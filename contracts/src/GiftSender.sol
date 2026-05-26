// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AbstractCallback} from "@reactive/abstract-base/AbstractCallback.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";
import {IAllowanceTransfer} from "permit2/src/interfaces/IAllowanceTransfer.sol";

/// @title GiftSender
/// @notice User-facing entry on the sender chain (Unichain Sepolia). Manages
/// a single shared v4 LP position; each gift is recorded as a slice of that
/// position. On claim/cancel/expire, the slice is decreased and tokens (with
/// pro-rata accrued fees) are returned.
///
/// The recipient passes `liquidity` (computed off-chain via Uniswap's
/// LiquidityAmounts library) along with `amount0Max`/`amount1Max` slippage
/// caps; the contract pulls `amount0Max`/`amount1Max` worth of tokens and
/// the actual amounts spent are determined by PositionManager.
contract GiftSender is AbstractCallback {
    using SafeERC20 for IERC20;

    enum State { None, Deposited, Claimed, Unwound, Delivered, Cancelled, Refunded, Expired }

    struct Gift {
        address sender;
        bytes32 commitment;
        uint128 liquidityShare;     // this gift's slice of the shared LP NFT
        uint128 amount0Provided;    // tokens actually pulled from sender on deposit
        uint128 amount1Provided;
        uint64  expiresAt;
        uint32  dstChainId;
        State   state;
    }

    /// @dev Permit2 has a deterministic address on every supported chain.
    IAllowanceTransfer public constant PERMIT2 = IAllowanceTransfer(0x000000000022D473030F116dDEE9F6B43aC78BA3);

    IPositionManager public immutable positionManager;
    PoolKey public poolKey;
    int24   public tickLower;
    int24   public tickUpper;

    /// @notice The shared LP NFT id. 0 means not minted yet.
    uint256 public lpTokenId;

    /// @notice Sum of all live gifts' liquidityShare. Used for pro-rata fee math.
    uint128 public totalLiquidity;

    mapping(bytes32 => Gift) public gifts;
    bytes32[] public allGiftIds;

    address public owner;

    /// @dev Reactive Lasna's LogRecord.data drops the first 32 bytes of the
    /// on-chain data. To survive the round-trip, we put `address sender` first
    /// (as the sacrificial first 32-byte slot) and the actual cargo (giftId,
    /// commitment, amounts, etc.) starts at the second field. The RSC's
    /// `abi.decode` skips the first field entirely.
    event GiftDeposited(
        address sender,
        bytes32 giftId,
        bytes32 commitment,
        uint128 amount0,
        uint128 amount1,
        uint32  dstChainId,
        uint64  expiresAt
    );
    event GiftCancelled(address discard, bytes32 giftId);
    event GiftExpired(address discard, bytes32 giftId);
    event GiftUnwound(
        address discard,
        bytes32 giftId,
        address recipient,
        uint128 principalReturned,
        uint128 yieldReturned,
        uint32  dstChainId
    );

    error NotOwner();
    error PoolKeyAlreadySet();
    error PoolKeyNotSet();
    error InvalidGiftState();
    error GiftNotExpired();
    error GiftAlreadyExists();
    error ZeroLiquidity();

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    constructor(
        address _callbackProxy,
        IPositionManager _positionManager,
        address _owner
    ) AbstractCallback(_callbackProxy) payable {
        positionManager = _positionManager;
        owner = _owner;
    }

    /// @notice One-time pool config. Approves Permit2 → PositionManager for
    /// both currencies so subsequent gift deposits don't need their own
    /// approval dance.
    /// @dev Reverts if a pool is already set; use `resetPoolKey` (owner-only,
    /// for testnet hot-fix scenarios) if you really need to swap pools.
    function setPoolKey(PoolKey calldata _poolKey, int24 _tickLower, int24 _tickUpper) external onlyOwner {
        if (Currency.unwrap(poolKey.currency0) != address(0)) revert PoolKeyAlreadySet();
        _setPoolKey(_poolKey, _tickLower, _tickUpper);
    }

    /// @notice Owner-only escape hatch to point GiftSender at a new pool.
    /// Only safe to call when no live gifts exist (would otherwise orphan the
    /// LP NFT). Resets `lpTokenId` so the next deposit mints fresh.
    function resetPoolKey(PoolKey calldata _poolKey, int24 _tickLower, int24 _tickUpper) external onlyOwner {
        require(totalLiquidity == 0, "live gifts exist");
        lpTokenId = 0;
        _setPoolKey(_poolKey, _tickLower, _tickUpper);
    }

    function _setPoolKey(PoolKey calldata _poolKey, int24 _tickLower, int24 _tickUpper) internal {
        poolKey = _poolKey;
        tickLower = _tickLower;
        tickUpper = _tickUpper;

        // Two-stage approval pattern required by Permit2-based PositionManager.
        // (1) approve Permit2 to pull from us, (2) tell Permit2 the PM may spend.
        IERC20(Currency.unwrap(_poolKey.currency0)).forceApprove(address(PERMIT2), type(uint256).max);
        IERC20(Currency.unwrap(_poolKey.currency1)).forceApprove(address(PERMIT2), type(uint256).max);
        PERMIT2.approve(Currency.unwrap(_poolKey.currency0), address(positionManager), type(uint160).max, type(uint48).max);
        PERMIT2.approve(Currency.unwrap(_poolKey.currency1), address(positionManager), type(uint160).max, type(uint48).max);
    }

    /// @notice Deposit a gift. Pulls (up to) amount0Max/amount1Max from sender,
    /// mints or increases the shared LP NFT by `liquidity` units, records the
    /// gift entry, emits GiftDeposited.
    /// @param liquidity v4 liquidity units to mint for this gift. Caller must
    ///        compute this off-chain from desired token amounts using
    ///        LiquidityAmounts.getLiquidityForAmounts(...).
    /// @param amount0Max slippage cap on token0; this is the amount we pull from sender.
    /// @param amount1Max slippage cap on token1; this is the amount we pull from sender.
    function depositGift(
        bytes32 commitment,
        uint128 liquidity,
        uint128 amount0Max,
        uint128 amount1Max,
        uint32  dstChainId,
        uint64  expiresAt
    ) external returns (bytes32 giftId) {
        if (Currency.unwrap(poolKey.currency0) == address(0)) revert PoolKeyNotSet();
        if (liquidity == 0) revert ZeroLiquidity();

        giftId = keccak256(abi.encode(commitment, msg.sender, block.timestamp, allGiftIds.length));
        if (gifts[giftId].state != State.None) revert GiftAlreadyExists();

        // Pull max tokens from sender (PositionManager will return any unused).
        IERC20(Currency.unwrap(poolKey.currency0)).safeTransferFrom(msg.sender, address(this), amount0Max);
        IERC20(Currency.unwrap(poolKey.currency1)).safeTransferFrom(msg.sender, address(this), amount1Max);

        // Build action plan: MINT_POSITION (first time) or INCREASE_LIQUIDITY,
        // followed by SETTLE_PAIR to push tokens in.
        bytes memory actions;
        bytes[] memory params;
        if (lpTokenId == 0) {
            uint256 newTokenId = positionManager.nextTokenId();
            actions = abi.encodePacked(uint8(Actions.MINT_POSITION), uint8(Actions.SETTLE_PAIR));
            params = new bytes[](2);
            params[0] = abi.encode(
                poolKey, tickLower, tickUpper, liquidity,
                amount0Max, amount1Max, address(this), bytes("")
            );
            params[1] = abi.encode(poolKey.currency0, poolKey.currency1);
            positionManager.modifyLiquidities(abi.encode(actions, params), block.timestamp + 60);
            lpTokenId = newTokenId;
        } else {
            actions = abi.encodePacked(uint8(Actions.INCREASE_LIQUIDITY), uint8(Actions.SETTLE_PAIR));
            params = new bytes[](2);
            params[0] = abi.encode(lpTokenId, liquidity, amount0Max, amount1Max, bytes(""));
            params[1] = abi.encode(poolKey.currency0, poolKey.currency1);
            positionManager.modifyLiquidities(abi.encode(actions, params), block.timestamp + 60);
        }

        // Refund any unused dust from slippage caps back to depositor.
        uint256 dust0 = IERC20(Currency.unwrap(poolKey.currency0)).balanceOf(address(this));
        uint256 dust1 = IERC20(Currency.unwrap(poolKey.currency1)).balanceOf(address(this));
        if (dust0 > 0) IERC20(Currency.unwrap(poolKey.currency0)).safeTransfer(msg.sender, dust0);
        if (dust1 > 0) IERC20(Currency.unwrap(poolKey.currency1)).safeTransfer(msg.sender, dust1);

        uint128 amount0Provided = amount0Max - uint128(dust0);
        uint128 amount1Provided = amount1Max - uint128(dust1);
        totalLiquidity += liquidity;

        gifts[giftId] = Gift({
            sender: msg.sender,
            commitment: commitment,
            liquidityShare: liquidity,
            amount0Provided: amount0Provided,
            amount1Provided: amount1Provided,
            expiresAt: expiresAt,
            dstChainId: dstChainId,
            state: State.Deposited
        });
        allGiftIds.push(giftId);

        emit GiftDeposited(msg.sender, giftId, commitment, amount0Provided, amount1Provided, dstChainId, expiresAt);
    }

    /// @notice Sender cancels an unclaimed gift. Returns principal + accrued yield.
    function cancelGift(bytes32 giftId) external {
        Gift storage g = gifts[giftId];
        if (g.state != State.Deposited) revert InvalidGiftState();
        if (msg.sender != g.sender) revert NotOwner();
        g.state = State.Cancelled;
        emit GiftCancelled(msg.sender, giftId);
        _unwind(giftId, g.sender);
    }

    /// @notice Anyone can call after expiry to auto-refund a stale gift to its sender.
    function expireGift(bytes32 giftId) external {
        Gift storage g = gifts[giftId];
        if (g.state != State.Deposited) revert InvalidGiftState();
        if (block.timestamp < g.expiresAt) revert GiftNotExpired();
        g.state = State.Expired;
        emit GiftExpired(msg.sender, giftId);
        _unwind(giftId, g.sender);
    }

    /// @notice Called by the RSC after the recipient claims on the destination chain.
    function unwindGift(bytes32 giftId, address recipient)
        external
        rvmIdOnly(rvm_id)
        authorizedSenderOnly
    {
        _adminTransitionAndUnwind(giftId, recipient);
    }

    /// @notice Owner-gated fallback equivalent of `unwindGift` for testnet
    /// operation under the relayer pattern.
    function adminUnwindGift(bytes32 giftId, address recipient) external onlyOwner {
        _adminTransitionAndUnwind(giftId, recipient);
    }

    function _adminTransitionAndUnwind(bytes32 giftId, address recipient) internal {
        Gift storage g = gifts[giftId];
        if (g.state != State.Deposited) revert InvalidGiftState();
        g.state = State.Claimed;
        _unwind(giftId, recipient);
    }

    /// @dev Decrease liquidity by g.liquidityShare and TAKE_PAIR to recipient.
    /// PositionManager auto-collects accrued fees attributable to the decreased
    /// portion, so `recipient` receives principal + pro-rata yield in one shot.
    function _unwind(bytes32 giftId, address recipient) internal {
        Gift storage g = gifts[giftId];

        // Snapshot recipient balances to back out exactly what was paid out.
        IERC20 t0 = IERC20(Currency.unwrap(poolKey.currency0));
        IERC20 t1 = IERC20(Currency.unwrap(poolKey.currency1));
        uint256 before0 = t0.balanceOf(recipient);
        uint256 before1 = t1.balanceOf(recipient);

        bytes memory actions = abi.encodePacked(
            uint8(Actions.DECREASE_LIQUIDITY),
            uint8(Actions.TAKE_PAIR)
        );
        bytes[] memory params = new bytes[](2);
        // amount0Min / amount1Min = 0: we trust the v4 fee mechanism.
        params[0] = abi.encode(lpTokenId, g.liquidityShare, uint128(0), uint128(0), bytes(""));
        params[1] = abi.encode(poolKey.currency0, poolKey.currency1, recipient);
        positionManager.modifyLiquidities(abi.encode(actions, params), block.timestamp + 60);

        uint256 paid0 = t0.balanceOf(recipient) - before0;
        uint256 paid1 = t1.balanceOf(recipient) - before1;

        // Compute principal vs yield split. Principal = the tokens originally
        // deposited for this gift; anything above that is fee yield.
        uint128 principalReturned = g.amount0Provided + g.amount1Provided;
        uint128 totalReturned = uint128(paid0 + paid1);
        uint128 yieldReturned = totalReturned > principalReturned
            ? totalReturned - principalReturned
            : 0;

        totalLiquidity -= g.liquidityShare;

        if (g.state == State.Cancelled || g.state == State.Expired) {
            g.state = State.Refunded;
        } else {
            g.state = State.Unwound;
        }

        emit GiftUnwound(address(this), giftId, recipient, principalReturned, yieldReturned, g.dstChainId);
    }

    function giftCount() external view returns (uint256) {
        return allGiftIds.length;
    }
}

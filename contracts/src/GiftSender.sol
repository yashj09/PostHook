// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {AbstractCallback} from "@reactive/abstract-base/AbstractCallback.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {Currency} from "@uniswap/v4-core/src/types/Currency.sol";
import {IHooks} from "@uniswap/v4-core/src/interfaces/IHooks.sol";
import {IPositionManager} from "@uniswap/v4-periphery/src/interfaces/IPositionManager.sol";
import {Actions} from "@uniswap/v4-periphery/src/libraries/Actions.sol";

/// @title GiftSender
/// @notice User-facing entry on the sender chain (Unichain Sepolia). A user
/// deposits two stable tokens; this contract mints a single v4 LP position
/// (or increases the shared one) on the gift pool and records the gift entry.
/// On claim/cancel/expire, the contract decreases liquidity by the gift's
/// share, collects accrued fees pro-rata, and forwards principal+yield via
/// CCTP (or callback to the recipient on the same chain in MVP fallback mode).
///
/// Inherits AbstractCallback so the GiftReactive RSC can dispatch authenticated
/// `unwindGift(...)` callbacks to it.
contract GiftSender is AbstractCallback {
    using SafeERC20 for IERC20;

    enum State { None, Deposited, Claimed, Unwound, Delivered, Cancelled, Refunded, Expired }

    struct Gift {
        address sender;            // who deposited
        bytes32 commitment;        // keccak256(secret) — bearer claim
        uint128 liquidityShare;    // this gift's portion of the pool position
        uint128 amount0;           // principal token0 deposited
        uint128 amount1;           // principal token1 deposited
        uint64  expiresAt;         // unix seconds; auto-refundable after this
        uint32  dstChainId;        // recipient's preferred chain
        State   state;
    }

    IPositionManager public immutable positionManager;
    PoolKey public poolKey;        // pool we deposit into; set by owner once
    uint256 public lpTokenId;      // shared LP NFT we manage; 0 if not minted yet

    mapping(bytes32 => Gift) public gifts;            // giftId => Gift
    bytes32[] public allGiftIds;                      // for enumeration / demo dashboard

    uint128 public totalLiquidity;                    // sum of all live gifts' liquidityShare

    address public owner;

    event GiftDeposited(
        bytes32 indexed giftId,
        address indexed sender,
        bytes32 commitment,
        uint128 amount0,
        uint128 amount1,
        uint32  dstChainId,
        uint64  expiresAt
    );
    event GiftCancelled(bytes32 indexed giftId);
    event GiftExpired(bytes32 indexed giftId);
    event GiftUnwound(
        bytes32 indexed giftId,
        address indexed recipient,
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
    error ZeroAmount();

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

    /// @notice One-time pool config (the stable pair the gifts live in).
    function setPoolKey(PoolKey calldata _poolKey) external onlyOwner {
        if (Currency.unwrap(poolKey.currency0) != address(0)) revert PoolKeyAlreadySet();
        poolKey = _poolKey;
    }

    /// @notice Deposit a gift. Pulls token0/token1 from sender, mints/increases
    ///   the shared LP position, records the gift entry, and emits GiftDeposited
    ///   for the RSC to mirror to the recipient chain.
    /// @dev Liquidity-add path is intentionally a stub here — full integration
    ///   with PositionManager.modifyLiquidities goes in Week 1 Day 3-4.
    function depositGift(
        bytes32 commitment,
        uint128 amount0,
        uint128 amount1,
        uint32  dstChainId,
        uint64  expiresAt
    ) external returns (bytes32 giftId) {
        if (Currency.unwrap(poolKey.currency0) == address(0)) revert PoolKeyNotSet();
        if (amount0 == 0 && amount1 == 0) revert ZeroAmount();

        giftId = keccak256(abi.encode(commitment, msg.sender, block.timestamp, allGiftIds.length));
        if (gifts[giftId].state != State.None) revert GiftAlreadyExists();

        // Pull tokens from sender.
        IERC20(Currency.unwrap(poolKey.currency0)).safeTransferFrom(msg.sender, address(this), amount0);
        IERC20(Currency.unwrap(poolKey.currency1)).safeTransferFrom(msg.sender, address(this), amount1);

        // TODO (Day 3): add liquidity to positionManager. For scaffold, we
        // record nominal liquidityShare = amount0 + amount1. This will be
        // replaced with the actual liquidity returned by MINT_POSITION /
        // INCREASE_LIQUIDITY.
        uint128 liquidityShare = amount0 + amount1;
        totalLiquidity += liquidityShare;

        gifts[giftId] = Gift({
            sender: msg.sender,
            commitment: commitment,
            liquidityShare: liquidityShare,
            amount0: amount0,
            amount1: amount1,
            expiresAt: expiresAt,
            dstChainId: dstChainId,
            state: State.Deposited
        });
        allGiftIds.push(giftId);

        emit GiftDeposited(giftId, msg.sender, commitment, amount0, amount1, dstChainId, expiresAt);
    }

    /// @notice Sender cancels an unclaimed gift. Returns principal + accrued yield.
    function cancelGift(bytes32 giftId) external {
        Gift storage g = gifts[giftId];
        if (g.state != State.Deposited) revert InvalidGiftState();
        if (msg.sender != g.sender) revert NotOwner();
        g.state = State.Cancelled;
        emit GiftCancelled(giftId);
        _unwind(giftId, g.sender);
    }

    /// @notice Anyone can call this after expiry to auto-refund a stale gift.
    function expireGift(bytes32 giftId) external {
        Gift storage g = gifts[giftId];
        if (g.state != State.Deposited) revert InvalidGiftState();
        if (block.timestamp < g.expiresAt) revert GiftNotExpired();
        g.state = State.Expired;
        emit GiftExpired(giftId);
        _unwind(giftId, g.sender);
    }

    /// @notice Called by the RSC when the recipient claims on the destination chain.
    ///   Unwinds the gift's share of the LP position and ships the proceeds via CCTP.
    function unwindGift(bytes32 giftId, address recipient)
        external
        rvmIdOnly(rvm_id)
        authorizedSenderOnly
    {
        Gift storage g = gifts[giftId];
        if (g.state != State.Deposited) revert InvalidGiftState();
        g.state = State.Claimed;
        _unwind(giftId, recipient);
    }

    function _unwind(bytes32 giftId, address recipient) internal {
        Gift storage g = gifts[giftId];

        // TODO (Day 3-4): call positionManager.modifyLiquidities with
        // DECREASE_LIQUIDITY by g.liquidityShare + TAKE_PAIR to address(this),
        // then split by ratio (g.liquidityShare / totalLiquidity) to compute
        // accrued fees attributable to this gift.
        //
        // For scaffold, we just transfer the recorded principal back; yield = 0.
        uint128 principalReturned = g.amount0 + g.amount1;
        uint128 yieldReturned = 0;

        totalLiquidity -= g.liquidityShare;

        // For unwind via cancel/expire, recipient = sender, transfer locally.
        // For unwind via claim, recipient is on dstChainId — TODO Day 13: CCTP burn-and-mint.
        // For scaffold, transfer locally regardless.
        if (g.amount0 > 0) {
            IERC20(Currency.unwrap(poolKey.currency0)).safeTransfer(recipient, g.amount0);
        }
        if (g.amount1 > 0) {
            IERC20(Currency.unwrap(poolKey.currency1)).safeTransfer(recipient, g.amount1);
        }

        if (g.state == State.Cancelled) {
            g.state = State.Refunded;
        } else if (g.state == State.Expired) {
            g.state = State.Refunded;
        } else {
            g.state = State.Unwound;
        }

        emit GiftUnwound(giftId, recipient, principalReturned, yieldReturned, g.dstChainId);
    }

    function giftCount() external view returns (uint256) {
        return allGiftIds.length;
    }
}

import {
  createUseReadContract,
  createUseWriteContract,
  createUseSimulateContract,
  createUseWatchContractEvent,
} from 'wagmi/codegen'

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Erc20
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const erc20Abi = [
  {
    type: 'function',
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ type: 'uint8' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ type: 'string' }],
    stateMutability: 'view',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GiftHook
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const giftHookAbi = [
  {
    type: 'constructor',
    inputs: [
      {
        name: '_poolManager',
        internalType: 'contract IPoolManager',
        type: 'address',
      },
      { name: '_positionManager', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct ModifyLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'liquidityDelta', internalType: 'int256', type: 'int256' },
          { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
      { name: 'delta0', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'delta1', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'afterAddLiquidity',
    outputs: [
      { name: '', internalType: 'bytes4', type: 'bytes4' },
      { name: '', internalType: 'BalanceDelta', type: 'int256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'afterDonate',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'sqrtPriceX96', internalType: 'uint160', type: 'uint160' },
      { name: 'tick', internalType: 'int24', type: 'int24' },
    ],
    name: 'afterInitialize',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct ModifyLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'liquidityDelta', internalType: 'int256', type: 'int256' },
          { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
      { name: 'delta0', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'delta1', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'afterRemoveLiquidity',
    outputs: [
      { name: '', internalType: 'bytes4', type: 'bytes4' },
      { name: '', internalType: 'BalanceDelta', type: 'int256' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct SwapParams',
        type: 'tuple',
        components: [
          { name: 'zeroForOne', internalType: 'bool', type: 'bool' },
          { name: 'amountSpecified', internalType: 'int256', type: 'int256' },
          {
            name: 'sqrtPriceLimitX96',
            internalType: 'uint160',
            type: 'uint160',
          },
        ],
      },
      { name: 'delta', internalType: 'BalanceDelta', type: 'int256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'afterSwap',
    outputs: [
      { name: '', internalType: 'bytes4', type: 'bytes4' },
      { name: '', internalType: 'int128', type: 'int128' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct ModifyLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'liquidityDelta', internalType: 'int256', type: 'int256' },
          { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'beforeAddLiquidity',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'amount0', internalType: 'uint256', type: 'uint256' },
      { name: 'amount1', internalType: 'uint256', type: 'uint256' },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'beforeDonate',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: 'sqrtPriceX96', internalType: 'uint160', type: 'uint160' },
    ],
    name: 'beforeInitialize',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct ModifyLiquidityParams',
        type: 'tuple',
        components: [
          { name: 'tickLower', internalType: 'int24', type: 'int24' },
          { name: 'tickUpper', internalType: 'int24', type: 'int24' },
          { name: 'liquidityDelta', internalType: 'int256', type: 'int256' },
          { name: 'salt', internalType: 'bytes32', type: 'bytes32' },
        ],
      },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'beforeRemoveLiquidity',
    outputs: [{ name: '', internalType: 'bytes4', type: 'bytes4' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      {
        name: 'key',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      {
        name: 'params',
        internalType: 'struct SwapParams',
        type: 'tuple',
        components: [
          { name: 'zeroForOne', internalType: 'bool', type: 'bool' },
          { name: 'amountSpecified', internalType: 'int256', type: 'int256' },
          {
            name: 'sqrtPriceLimitX96',
            internalType: 'uint160',
            type: 'uint160',
          },
        ],
      },
      { name: 'hookData', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'beforeSwap',
    outputs: [
      { name: '', internalType: 'bytes4', type: 'bytes4' },
      { name: '', internalType: 'BeforeSwapDelta', type: 'int256' },
      { name: '', internalType: 'uint24', type: 'uint24' },
    ],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'getHookPermissions',
    outputs: [
      {
        name: '',
        internalType: 'struct Hooks.Permissions',
        type: 'tuple',
        components: [
          { name: 'beforeInitialize', internalType: 'bool', type: 'bool' },
          { name: 'afterInitialize', internalType: 'bool', type: 'bool' },
          { name: 'beforeAddLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'afterAddLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'beforeRemoveLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'afterRemoveLiquidity', internalType: 'bool', type: 'bool' },
          { name: 'beforeSwap', internalType: 'bool', type: 'bool' },
          { name: 'afterSwap', internalType: 'bool', type: 'bool' },
          { name: 'beforeDonate', internalType: 'bool', type: 'bool' },
          { name: 'afterDonate', internalType: 'bool', type: 'bool' },
          { name: 'beforeSwapReturnDelta', internalType: 'bool', type: 'bool' },
          { name: 'afterSwapReturnDelta', internalType: 'bool', type: 'bool' },
          {
            name: 'afterAddLiquidityReturnDelta',
            internalType: 'bool',
            type: 'bool',
          },
          {
            name: 'afterRemoveLiquidityReturnDelta',
            internalType: 'bool',
            type: 'bool',
          },
        ],
      },
    ],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [],
    name: 'poolManager',
    outputs: [
      { name: '', internalType: 'contract IPoolManager', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'positionManager',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'PoolId', type: 'bytes32' }],
    name: 'totalSwapVolume',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  { type: 'error', inputs: [], name: 'HookNotImplemented' },
  { type: 'error', inputs: [], name: 'NotPoolManager' },
  { type: 'error', inputs: [], name: 'OnlyPositionManagerMayProvideLiquidity' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GiftRecipient
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const giftRecipientAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_callbackProxy', internalType: 'address', type: 'address' },
      { name: '_usdc', internalType: 'contract IERC20', type: 'address' },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'payable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [
      { name: 'giftId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'amount', internalType: 'uint128', type: 'uint128' },
    ],
    name: 'adminDeliverGift',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'giftId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'commitment', internalType: 'bytes32', type: 'bytes32' },
      { name: 'expectedAmount', internalType: 'uint128', type: 'uint128' },
      { name: 'expiresAt', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'adminMintGiftEntry',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'allGiftIds',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'giftId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'secret', internalType: 'bytes', type: 'bytes' },
    ],
    name: 'claimGift',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'coverDebt',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'giftId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'amount', internalType: 'uint128', type: 'uint128' },
    ],
    name: 'deliverGift',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'giftCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'gifts',
    outputs: [
      { name: 'commitment', internalType: 'bytes32', type: 'bytes32' },
      { name: 'expectedAmount', internalType: 'uint128', type: 'uint128' },
      { name: 'expiresAt', internalType: 'uint64', type: 'uint64' },
      { name: 'claimedBy', internalType: 'address', type: 'address' },
      {
        name: 'state',
        internalType: 'enum GiftRecipient.State',
        type: 'uint8',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'giftId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'commitment', internalType: 'bytes32', type: 'bytes32' },
      { name: 'expectedAmount', internalType: 'uint128', type: 'uint128' },
      { name: 'expiresAt', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'mintGiftEntry',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'pay',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'usdc',
    outputs: [{ name: '', internalType: 'contract IERC20', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'discard',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'giftId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'claimer',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
    ],
    name: 'GiftClaimed',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'discard',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'giftId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'amount',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
    ],
    name: 'GiftDelivered',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'discard',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'giftId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'commitment',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'expectedAmount',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
      {
        name: 'expiresAt',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'GiftMirrored',
  },
  { type: 'error', inputs: [], name: 'GiftExpired' },
  { type: 'error', inputs: [], name: 'InvalidGiftState' },
  { type: 'error', inputs: [], name: 'InvalidSecret' },
  { type: 'error', inputs: [], name: 'NotOwner' },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  { type: 'error', inputs: [], name: 'UnknownGift' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// GiftSender
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const giftSenderAbi = [
  {
    type: 'constructor',
    inputs: [
      { name: '_callbackProxy', internalType: 'address', type: 'address' },
      {
        name: '_positionManager',
        internalType: 'contract IPositionManager',
        type: 'address',
      },
      { name: '_owner', internalType: 'address', type: 'address' },
    ],
    stateMutability: 'payable',
  },
  { type: 'receive', stateMutability: 'payable' },
  {
    type: 'function',
    inputs: [],
    name: 'PERMIT2',
    outputs: [
      {
        name: '',
        internalType: 'contract IAllowanceTransfer',
        type: 'address',
      },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'giftId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'recipient', internalType: 'address', type: 'address' },
    ],
    name: 'adminUnwindGift',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    name: 'allGiftIds',
    outputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'giftId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'cancelGift',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'coverDebt',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'commitment', internalType: 'bytes32', type: 'bytes32' },
      { name: 'liquidity', internalType: 'uint128', type: 'uint128' },
      { name: 'amount0Max', internalType: 'uint128', type: 'uint128' },
      { name: 'amount1Max', internalType: 'uint128', type: 'uint128' },
      { name: 'dstChainId', internalType: 'uint32', type: 'uint32' },
      { name: 'expiresAt', internalType: 'uint64', type: 'uint64' },
    ],
    name: 'depositGift',
    outputs: [{ name: 'giftId', internalType: 'bytes32', type: 'bytes32' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'giftId', internalType: 'bytes32', type: 'bytes32' }],
    name: 'expireGift',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'giftCount',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: '', internalType: 'bytes32', type: 'bytes32' }],
    name: 'gifts',
    outputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'commitment', internalType: 'bytes32', type: 'bytes32' },
      { name: 'liquidityShare', internalType: 'uint128', type: 'uint128' },
      { name: 'amount0Provided', internalType: 'uint128', type: 'uint128' },
      { name: 'amount1Provided', internalType: 'uint128', type: 'uint128' },
      { name: 'expiresAt', internalType: 'uint64', type: 'uint64' },
      { name: 'dstChainId', internalType: 'uint32', type: 'uint32' },
      { name: 'state', internalType: 'enum GiftSender.State', type: 'uint8' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'lpTokenId',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'owner',
    outputs: [{ name: '', internalType: 'address', type: 'address' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [{ name: 'amount', internalType: 'uint256', type: 'uint256' }],
    name: 'pay',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'poolKey',
    outputs: [
      { name: 'currency0', internalType: 'Currency', type: 'address' },
      { name: 'currency1', internalType: 'Currency', type: 'address' },
      { name: 'fee', internalType: 'uint24', type: 'uint24' },
      { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
      { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'positionManager',
    outputs: [
      { name: '', internalType: 'contract IPositionManager', type: 'address' },
    ],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_poolKey',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: '_tickLower', internalType: 'int24', type: 'int24' },
      { name: '_tickUpper', internalType: 'int24', type: 'int24' },
    ],
    name: 'resetPoolKey',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      {
        name: '_poolKey',
        internalType: 'struct PoolKey',
        type: 'tuple',
        components: [
          { name: 'currency0', internalType: 'Currency', type: 'address' },
          { name: 'currency1', internalType: 'Currency', type: 'address' },
          { name: 'fee', internalType: 'uint24', type: 'uint24' },
          { name: 'tickSpacing', internalType: 'int24', type: 'int24' },
          { name: 'hooks', internalType: 'contract IHooks', type: 'address' },
        ],
      },
      { name: '_tickLower', internalType: 'int24', type: 'int24' },
      { name: '_tickUpper', internalType: 'int24', type: 'int24' },
    ],
    name: 'setPoolKey',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tickLower',
    outputs: [{ name: '', internalType: 'int24', type: 'int24' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'tickUpper',
    outputs: [{ name: '', internalType: 'int24', type: 'int24' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalLiquidity',
    outputs: [{ name: '', internalType: 'uint128', type: 'uint128' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'giftId', internalType: 'bytes32', type: 'bytes32' },
      { name: 'recipient', internalType: 'address', type: 'address' },
    ],
    name: 'unwindGift',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'discard',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'giftId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'GiftCancelled',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'sender',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'giftId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'commitment',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'amount0',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
      {
        name: 'amount1',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
      {
        name: 'dstChainId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
      {
        name: 'expiresAt',
        internalType: 'uint64',
        type: 'uint64',
        indexed: false,
      },
    ],
    name: 'GiftDeposited',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'discard',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'giftId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
    ],
    name: 'GiftExpired',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'discard',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'giftId',
        internalType: 'bytes32',
        type: 'bytes32',
        indexed: false,
      },
      {
        name: 'recipient',
        internalType: 'address',
        type: 'address',
        indexed: false,
      },
      {
        name: 'principalReturned',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
      {
        name: 'yieldReturned',
        internalType: 'uint128',
        type: 'uint128',
        indexed: false,
      },
      {
        name: 'dstChainId',
        internalType: 'uint32',
        type: 'uint32',
        indexed: false,
      },
    ],
    name: 'GiftUnwound',
  },
  { type: 'error', inputs: [], name: 'GiftAlreadyExists' },
  { type: 'error', inputs: [], name: 'GiftNotExpired' },
  { type: 'error', inputs: [], name: 'InvalidGiftState' },
  { type: 'error', inputs: [], name: 'NotOwner' },
  { type: 'error', inputs: [], name: 'PoolKeyAlreadySet' },
  { type: 'error', inputs: [], name: 'PoolKeyNotSet' },
  {
    type: 'error',
    inputs: [{ name: 'token', internalType: 'address', type: 'address' }],
    name: 'SafeERC20FailedOperation',
  },
  { type: 'error', inputs: [], name: 'ZeroLiquidity' },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// MockUSDT
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const mockUsdtAbi = [
  { type: 'constructor', inputs: [], stateMutability: 'nonpayable' },
  {
    type: 'function',
    inputs: [
      { name: 'owner', internalType: 'address', type: 'address' },
      { name: 'spender', internalType: 'address', type: 'address' },
    ],
    name: 'allowance',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [{ name: 'account', internalType: 'address', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', internalType: 'uint8', type: 'uint8' }],
    stateMutability: 'pure',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'amount', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [],
    name: 'name',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', internalType: 'string', type: 'string' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', internalType: 'uint256', type: 'uint256' }],
    stateMutability: 'view',
  },
  {
    type: 'function',
    inputs: [
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'function',
    inputs: [
      { name: 'from', internalType: 'address', type: 'address' },
      { name: 'to', internalType: 'address', type: 'address' },
      { name: 'value', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'transferFrom',
    outputs: [{ name: '', internalType: 'bool', type: 'bool' }],
    stateMutability: 'nonpayable',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      {
        name: 'owner',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'spender',
        internalType: 'address',
        type: 'address',
        indexed: true,
      },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Approval',
  },
  {
    type: 'event',
    anonymous: false,
    inputs: [
      { name: 'from', internalType: 'address', type: 'address', indexed: true },
      { name: 'to', internalType: 'address', type: 'address', indexed: true },
      {
        name: 'value',
        internalType: 'uint256',
        type: 'uint256',
        indexed: false,
      },
    ],
    name: 'Transfer',
  },
  {
    type: 'error',
    inputs: [
      { name: 'spender', internalType: 'address', type: 'address' },
      { name: 'allowance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientAllowance',
  },
  {
    type: 'error',
    inputs: [
      { name: 'sender', internalType: 'address', type: 'address' },
      { name: 'balance', internalType: 'uint256', type: 'uint256' },
      { name: 'needed', internalType: 'uint256', type: 'uint256' },
    ],
    name: 'ERC20InsufficientBalance',
  },
  {
    type: 'error',
    inputs: [{ name: 'approver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidApprover',
  },
  {
    type: 'error',
    inputs: [{ name: 'receiver', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidReceiver',
  },
  {
    type: 'error',
    inputs: [{ name: 'sender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSender',
  },
  {
    type: 'error',
    inputs: [{ name: 'spender', internalType: 'address', type: 'address' }],
    name: 'ERC20InvalidSpender',
  },
] as const

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// React
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useReadErc20 = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadErc20BalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"allowance"`
 */
export const useReadErc20Allowance = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"decimals"`
 */
export const useReadErc20Decimals = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"symbol"`
 */
export const useReadErc20Symbol = /*#__PURE__*/ createUseReadContract({
  abi: erc20Abi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useWriteErc20 = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useWriteErc20Approve = /*#__PURE__*/ createUseWriteContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__
 */
export const useSimulateErc20 = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link erc20Abi}__ and `functionName` set to `"approve"`
 */
export const useSimulateErc20Approve = /*#__PURE__*/ createUseSimulateContract({
  abi: erc20Abi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftHookAbi}__
 */
export const useReadGiftHook = /*#__PURE__*/ createUseReadContract({
  abi: giftHookAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"getHookPermissions"`
 */
export const useReadGiftHookGetHookPermissions =
  /*#__PURE__*/ createUseReadContract({
    abi: giftHookAbi,
    functionName: 'getHookPermissions',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"poolManager"`
 */
export const useReadGiftHookPoolManager = /*#__PURE__*/ createUseReadContract({
  abi: giftHookAbi,
  functionName: 'poolManager',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"positionManager"`
 */
export const useReadGiftHookPositionManager =
  /*#__PURE__*/ createUseReadContract({
    abi: giftHookAbi,
    functionName: 'positionManager',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"totalSwapVolume"`
 */
export const useReadGiftHookTotalSwapVolume =
  /*#__PURE__*/ createUseReadContract({
    abi: giftHookAbi,
    functionName: 'totalSwapVolume',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__
 */
export const useWriteGiftHook = /*#__PURE__*/ createUseWriteContract({
  abi: giftHookAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterAddLiquidity"`
 */
export const useWriteGiftHookAfterAddLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftHookAbi,
    functionName: 'afterAddLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterDonate"`
 */
export const useWriteGiftHookAfterDonate = /*#__PURE__*/ createUseWriteContract(
  { abi: giftHookAbi, functionName: 'afterDonate' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterInitialize"`
 */
export const useWriteGiftHookAfterInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftHookAbi,
    functionName: 'afterInitialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterRemoveLiquidity"`
 */
export const useWriteGiftHookAfterRemoveLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftHookAbi,
    functionName: 'afterRemoveLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterSwap"`
 */
export const useWriteGiftHookAfterSwap = /*#__PURE__*/ createUseWriteContract({
  abi: giftHookAbi,
  functionName: 'afterSwap',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeAddLiquidity"`
 */
export const useWriteGiftHookBeforeAddLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftHookAbi,
    functionName: 'beforeAddLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeDonate"`
 */
export const useWriteGiftHookBeforeDonate =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftHookAbi,
    functionName: 'beforeDonate',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeInitialize"`
 */
export const useWriteGiftHookBeforeInitialize =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftHookAbi,
    functionName: 'beforeInitialize',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeRemoveLiquidity"`
 */
export const useWriteGiftHookBeforeRemoveLiquidity =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftHookAbi,
    functionName: 'beforeRemoveLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeSwap"`
 */
export const useWriteGiftHookBeforeSwap = /*#__PURE__*/ createUseWriteContract({
  abi: giftHookAbi,
  functionName: 'beforeSwap',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__
 */
export const useSimulateGiftHook = /*#__PURE__*/ createUseSimulateContract({
  abi: giftHookAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterAddLiquidity"`
 */
export const useSimulateGiftHookAfterAddLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'afterAddLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterDonate"`
 */
export const useSimulateGiftHookAfterDonate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'afterDonate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterInitialize"`
 */
export const useSimulateGiftHookAfterInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'afterInitialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterRemoveLiquidity"`
 */
export const useSimulateGiftHookAfterRemoveLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'afterRemoveLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"afterSwap"`
 */
export const useSimulateGiftHookAfterSwap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'afterSwap',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeAddLiquidity"`
 */
export const useSimulateGiftHookBeforeAddLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'beforeAddLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeDonate"`
 */
export const useSimulateGiftHookBeforeDonate =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'beforeDonate',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeInitialize"`
 */
export const useSimulateGiftHookBeforeInitialize =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'beforeInitialize',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeRemoveLiquidity"`
 */
export const useSimulateGiftHookBeforeRemoveLiquidity =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'beforeRemoveLiquidity',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftHookAbi}__ and `functionName` set to `"beforeSwap"`
 */
export const useSimulateGiftHookBeforeSwap =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftHookAbi,
    functionName: 'beforeSwap',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftRecipientAbi}__
 */
export const useReadGiftRecipient = /*#__PURE__*/ createUseReadContract({
  abi: giftRecipientAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"allGiftIds"`
 */
export const useReadGiftRecipientAllGiftIds =
  /*#__PURE__*/ createUseReadContract({
    abi: giftRecipientAbi,
    functionName: 'allGiftIds',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"giftCount"`
 */
export const useReadGiftRecipientGiftCount =
  /*#__PURE__*/ createUseReadContract({
    abi: giftRecipientAbi,
    functionName: 'giftCount',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"gifts"`
 */
export const useReadGiftRecipientGifts = /*#__PURE__*/ createUseReadContract({
  abi: giftRecipientAbi,
  functionName: 'gifts',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"owner"`
 */
export const useReadGiftRecipientOwner = /*#__PURE__*/ createUseReadContract({
  abi: giftRecipientAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"usdc"`
 */
export const useReadGiftRecipientUsdc = /*#__PURE__*/ createUseReadContract({
  abi: giftRecipientAbi,
  functionName: 'usdc',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftRecipientAbi}__
 */
export const useWriteGiftRecipient = /*#__PURE__*/ createUseWriteContract({
  abi: giftRecipientAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"adminDeliverGift"`
 */
export const useWriteGiftRecipientAdminDeliverGift =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftRecipientAbi,
    functionName: 'adminDeliverGift',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"adminMintGiftEntry"`
 */
export const useWriteGiftRecipientAdminMintGiftEntry =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftRecipientAbi,
    functionName: 'adminMintGiftEntry',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"claimGift"`
 */
export const useWriteGiftRecipientClaimGift =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftRecipientAbi,
    functionName: 'claimGift',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"coverDebt"`
 */
export const useWriteGiftRecipientCoverDebt =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftRecipientAbi,
    functionName: 'coverDebt',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"deliverGift"`
 */
export const useWriteGiftRecipientDeliverGift =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftRecipientAbi,
    functionName: 'deliverGift',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"mintGiftEntry"`
 */
export const useWriteGiftRecipientMintGiftEntry =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftRecipientAbi,
    functionName: 'mintGiftEntry',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"pay"`
 */
export const useWriteGiftRecipientPay = /*#__PURE__*/ createUseWriteContract({
  abi: giftRecipientAbi,
  functionName: 'pay',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftRecipientAbi}__
 */
export const useSimulateGiftRecipient = /*#__PURE__*/ createUseSimulateContract(
  { abi: giftRecipientAbi },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"adminDeliverGift"`
 */
export const useSimulateGiftRecipientAdminDeliverGift =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftRecipientAbi,
    functionName: 'adminDeliverGift',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"adminMintGiftEntry"`
 */
export const useSimulateGiftRecipientAdminMintGiftEntry =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftRecipientAbi,
    functionName: 'adminMintGiftEntry',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"claimGift"`
 */
export const useSimulateGiftRecipientClaimGift =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftRecipientAbi,
    functionName: 'claimGift',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"coverDebt"`
 */
export const useSimulateGiftRecipientCoverDebt =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftRecipientAbi,
    functionName: 'coverDebt',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"deliverGift"`
 */
export const useSimulateGiftRecipientDeliverGift =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftRecipientAbi,
    functionName: 'deliverGift',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"mintGiftEntry"`
 */
export const useSimulateGiftRecipientMintGiftEntry =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftRecipientAbi,
    functionName: 'mintGiftEntry',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftRecipientAbi}__ and `functionName` set to `"pay"`
 */
export const useSimulateGiftRecipientPay =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftRecipientAbi,
    functionName: 'pay',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftRecipientAbi}__
 */
export const useWatchGiftRecipientEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: giftRecipientAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftRecipientAbi}__ and `eventName` set to `"GiftClaimed"`
 */
export const useWatchGiftRecipientGiftClaimedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: giftRecipientAbi,
    eventName: 'GiftClaimed',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftRecipientAbi}__ and `eventName` set to `"GiftDelivered"`
 */
export const useWatchGiftRecipientGiftDeliveredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: giftRecipientAbi,
    eventName: 'GiftDelivered',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftRecipientAbi}__ and `eventName` set to `"GiftMirrored"`
 */
export const useWatchGiftRecipientGiftMirroredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: giftRecipientAbi,
    eventName: 'GiftMirrored',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__
 */
export const useReadGiftSender = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"PERMIT2"`
 */
export const useReadGiftSenderPermit2 = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'PERMIT2',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"allGiftIds"`
 */
export const useReadGiftSenderAllGiftIds = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'allGiftIds',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"giftCount"`
 */
export const useReadGiftSenderGiftCount = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'giftCount',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"gifts"`
 */
export const useReadGiftSenderGifts = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'gifts',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"lpTokenId"`
 */
export const useReadGiftSenderLpTokenId = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'lpTokenId',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"owner"`
 */
export const useReadGiftSenderOwner = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'owner',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"poolKey"`
 */
export const useReadGiftSenderPoolKey = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'poolKey',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"positionManager"`
 */
export const useReadGiftSenderPositionManager =
  /*#__PURE__*/ createUseReadContract({
    abi: giftSenderAbi,
    functionName: 'positionManager',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"tickLower"`
 */
export const useReadGiftSenderTickLower = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'tickLower',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"tickUpper"`
 */
export const useReadGiftSenderTickUpper = /*#__PURE__*/ createUseReadContract({
  abi: giftSenderAbi,
  functionName: 'tickUpper',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"totalLiquidity"`
 */
export const useReadGiftSenderTotalLiquidity =
  /*#__PURE__*/ createUseReadContract({
    abi: giftSenderAbi,
    functionName: 'totalLiquidity',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__
 */
export const useWriteGiftSender = /*#__PURE__*/ createUseWriteContract({
  abi: giftSenderAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"adminUnwindGift"`
 */
export const useWriteGiftSenderAdminUnwindGift =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftSenderAbi,
    functionName: 'adminUnwindGift',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"cancelGift"`
 */
export const useWriteGiftSenderCancelGift =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftSenderAbi,
    functionName: 'cancelGift',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"coverDebt"`
 */
export const useWriteGiftSenderCoverDebt = /*#__PURE__*/ createUseWriteContract(
  { abi: giftSenderAbi, functionName: 'coverDebt' },
)

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"depositGift"`
 */
export const useWriteGiftSenderDepositGift =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftSenderAbi,
    functionName: 'depositGift',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"expireGift"`
 */
export const useWriteGiftSenderExpireGift =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftSenderAbi,
    functionName: 'expireGift',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"pay"`
 */
export const useWriteGiftSenderPay = /*#__PURE__*/ createUseWriteContract({
  abi: giftSenderAbi,
  functionName: 'pay',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"resetPoolKey"`
 */
export const useWriteGiftSenderResetPoolKey =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftSenderAbi,
    functionName: 'resetPoolKey',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"setPoolKey"`
 */
export const useWriteGiftSenderSetPoolKey =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftSenderAbi,
    functionName: 'setPoolKey',
  })

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"unwindGift"`
 */
export const useWriteGiftSenderUnwindGift =
  /*#__PURE__*/ createUseWriteContract({
    abi: giftSenderAbi,
    functionName: 'unwindGift',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__
 */
export const useSimulateGiftSender = /*#__PURE__*/ createUseSimulateContract({
  abi: giftSenderAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"adminUnwindGift"`
 */
export const useSimulateGiftSenderAdminUnwindGift =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftSenderAbi,
    functionName: 'adminUnwindGift',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"cancelGift"`
 */
export const useSimulateGiftSenderCancelGift =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftSenderAbi,
    functionName: 'cancelGift',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"coverDebt"`
 */
export const useSimulateGiftSenderCoverDebt =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftSenderAbi,
    functionName: 'coverDebt',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"depositGift"`
 */
export const useSimulateGiftSenderDepositGift =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftSenderAbi,
    functionName: 'depositGift',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"expireGift"`
 */
export const useSimulateGiftSenderExpireGift =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftSenderAbi,
    functionName: 'expireGift',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"pay"`
 */
export const useSimulateGiftSenderPay = /*#__PURE__*/ createUseSimulateContract(
  { abi: giftSenderAbi, functionName: 'pay' },
)

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"resetPoolKey"`
 */
export const useSimulateGiftSenderResetPoolKey =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftSenderAbi,
    functionName: 'resetPoolKey',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"setPoolKey"`
 */
export const useSimulateGiftSenderSetPoolKey =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftSenderAbi,
    functionName: 'setPoolKey',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link giftSenderAbi}__ and `functionName` set to `"unwindGift"`
 */
export const useSimulateGiftSenderUnwindGift =
  /*#__PURE__*/ createUseSimulateContract({
    abi: giftSenderAbi,
    functionName: 'unwindGift',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftSenderAbi}__
 */
export const useWatchGiftSenderEvent =
  /*#__PURE__*/ createUseWatchContractEvent({ abi: giftSenderAbi })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftSenderAbi}__ and `eventName` set to `"GiftCancelled"`
 */
export const useWatchGiftSenderGiftCancelledEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: giftSenderAbi,
    eventName: 'GiftCancelled',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftSenderAbi}__ and `eventName` set to `"GiftDeposited"`
 */
export const useWatchGiftSenderGiftDepositedEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: giftSenderAbi,
    eventName: 'GiftDeposited',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftSenderAbi}__ and `eventName` set to `"GiftExpired"`
 */
export const useWatchGiftSenderGiftExpiredEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: giftSenderAbi,
    eventName: 'GiftExpired',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link giftSenderAbi}__ and `eventName` set to `"GiftUnwound"`
 */
export const useWatchGiftSenderGiftUnwoundEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: giftSenderAbi,
    eventName: 'GiftUnwound',
  })

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockUsdtAbi}__
 */
export const useReadMockUsdt = /*#__PURE__*/ createUseReadContract({
  abi: mockUsdtAbi,
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"allowance"`
 */
export const useReadMockUsdtAllowance = /*#__PURE__*/ createUseReadContract({
  abi: mockUsdtAbi,
  functionName: 'allowance',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"balanceOf"`
 */
export const useReadMockUsdtBalanceOf = /*#__PURE__*/ createUseReadContract({
  abi: mockUsdtAbi,
  functionName: 'balanceOf',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"decimals"`
 */
export const useReadMockUsdtDecimals = /*#__PURE__*/ createUseReadContract({
  abi: mockUsdtAbi,
  functionName: 'decimals',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"name"`
 */
export const useReadMockUsdtName = /*#__PURE__*/ createUseReadContract({
  abi: mockUsdtAbi,
  functionName: 'name',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"symbol"`
 */
export const useReadMockUsdtSymbol = /*#__PURE__*/ createUseReadContract({
  abi: mockUsdtAbi,
  functionName: 'symbol',
})

/**
 * Wraps __{@link useReadContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"totalSupply"`
 */
export const useReadMockUsdtTotalSupply = /*#__PURE__*/ createUseReadContract({
  abi: mockUsdtAbi,
  functionName: 'totalSupply',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockUsdtAbi}__
 */
export const useWriteMockUsdt = /*#__PURE__*/ createUseWriteContract({
  abi: mockUsdtAbi,
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"approve"`
 */
export const useWriteMockUsdtApprove = /*#__PURE__*/ createUseWriteContract({
  abi: mockUsdtAbi,
  functionName: 'approve',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"mint"`
 */
export const useWriteMockUsdtMint = /*#__PURE__*/ createUseWriteContract({
  abi: mockUsdtAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"transfer"`
 */
export const useWriteMockUsdtTransfer = /*#__PURE__*/ createUseWriteContract({
  abi: mockUsdtAbi,
  functionName: 'transfer',
})

/**
 * Wraps __{@link useWriteContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useWriteMockUsdtTransferFrom =
  /*#__PURE__*/ createUseWriteContract({
    abi: mockUsdtAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockUsdtAbi}__
 */
export const useSimulateMockUsdt = /*#__PURE__*/ createUseSimulateContract({
  abi: mockUsdtAbi,
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"approve"`
 */
export const useSimulateMockUsdtApprove =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mockUsdtAbi,
    functionName: 'approve',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"mint"`
 */
export const useSimulateMockUsdtMint = /*#__PURE__*/ createUseSimulateContract({
  abi: mockUsdtAbi,
  functionName: 'mint',
})

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"transfer"`
 */
export const useSimulateMockUsdtTransfer =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mockUsdtAbi,
    functionName: 'transfer',
  })

/**
 * Wraps __{@link useSimulateContract}__ with `abi` set to __{@link mockUsdtAbi}__ and `functionName` set to `"transferFrom"`
 */
export const useSimulateMockUsdtTransferFrom =
  /*#__PURE__*/ createUseSimulateContract({
    abi: mockUsdtAbi,
    functionName: 'transferFrom',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mockUsdtAbi}__
 */
export const useWatchMockUsdtEvent = /*#__PURE__*/ createUseWatchContractEvent({
  abi: mockUsdtAbi,
})

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mockUsdtAbi}__ and `eventName` set to `"Approval"`
 */
export const useWatchMockUsdtApprovalEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mockUsdtAbi,
    eventName: 'Approval',
  })

/**
 * Wraps __{@link useWatchContractEvent}__ with `abi` set to __{@link mockUsdtAbi}__ and `eventName` set to `"Transfer"`
 */
export const useWatchMockUsdtTransferEvent =
  /*#__PURE__*/ createUseWatchContractEvent({
    abi: mockUsdtAbi,
    eventName: 'Transfer',
  })

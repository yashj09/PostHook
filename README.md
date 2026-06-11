# Posthook - DeFi Gift Card

A consumer-friendly gift card backed by a Uniswap v4 hook'd LP
position. A sender deposits two stables into the position; while the gift is
unclaimed, the **hook charges swappers a premium fee that flows to the waiting
gift** (it's the pool's sole LP), so the voucher grows *in transit*. The
recipient claims it on a different chain by revealing a four-word secret.

- **Theme track:** UHI9 — Impermanent Loss & Yield Systems
- **Sponsor track:** Reactive Network

## Architecture

```
Unichain Sepolia          Reactive Network          Base Sepolia
  GiftSender   ─events─→   GiftReactive  ─callbacks→  GiftRecipient
  GiftHook (v4)                  ↑                       ↓
  PoolManager           (subscribes to events,         USDC payout
  PositionManager        drives the next step)          to recipient
                                 └───── events ──────────┘
```

A single claim on Base triggers the rest automatically: the **Reactive Smart
Contract** subscribes to Posthook's events on both chains (`GiftDeposited` on
Unichain, `GiftClaimed` on Base) and drives the cross-chain unwind on Unichain
and payout on Base — no user in the loop.

## Try it live

- **App:** https://posthook.vercel.app
- **Watch a live gift grow:** the landing page's "Try the demo →" link opens a
  real in-transit gift (no wallet needed) with its yield ticking up.

## The hook (theme: IL & Yield Systems)

`GiftHook` is a **dynamic-fee** v4 hook. While any gift is in transit
(`GiftSender.totalLiquidity > 0`) it overrides the swap fee to a **0.30%**
premium tier; once all gifts are claimed it falls back to **0.05%**. Because the
gift position is the pool's sole LP, that premium accrues natively to the gift —
so a gift demonstrably out-earns an ordinary LP *because the hook works on its
behalf while it travels*. (Verified on-chain: a swap during transit realized
`fee = 3000`, and an unwound gift paid out principal + premium yield.)

## Deployed addresses (testnet)

| Contract | Chain | Address |
|---|---|---|
| GiftSender | Unichain Sepolia | `0xe51ccEb811b78b0d4d4592fF82422680d0959EaD` |
| GiftHook (dynamic-fee) | Unichain Sepolia | `0xdBaE3F68d81580eF851aF7d7EA9d26C8EE2a5ac0` |
| SwapNoise | Unichain Sepolia | `0xA5c1ca2B57C1777BFb98aB8fcbfe5b76925682a6` |
| MockUSDT | Unichain Sepolia | `0x7FDF67698D0A83EB97eA770D9bcA66d3557556c0` |
| GiftRecipient | Base Sepolia | `0x6C5E1FE9eDa67BE07f80582C1e4488ad416bF5C2` |
| GiftReactive (RSC) | Reactive Lasna | `0xc1fC884999997bbdD30B92E61a0b9851F3444F40` |

## Partner integrations

| Partner | How we use it | Where in code |
|---|---|---|
| **Uniswap v4** | `GiftHook` is a custom v4 hook on a live USDC/USDT pool. It overrides `beforeSwap` to charge a state-aware dynamic fee (0.30% while a gift is in transit, 0.05% idle), gates `beforeAddLiquidity`/`beforeRemoveLiquidity` to the canonical PositionManager, and tallies volume in `afterSwap`. The gift principal is a real concentrated-liquidity v4 position. | `contracts/src/GiftHook.sol`, `contracts/src/GiftSender.sol` |
| **Reactive Network** | A Reactive Smart Contract subscribes to Posthook's events across both chains (`GiftDeposited` on Unichain, `GiftClaimed` on Base) and reacts by driving the next cross-chain step — mirror, unwind, deliver — so a single claim settles across chains with no user in the loop. | `contracts/src/GiftReactive.sol` |
| **Unichain** | Sender side: the v4 pool, `GiftHook`, and the `GiftSender` escrow that owns the LP position are deployed on Unichain Sepolia. | `contracts/src/GiftSender.sol`, `contracts/script/` |
| **Base** | Recipient side: `GiftRecipient` lives on Base Sepolia, where the four-word secret is revealed and the payout is delivered — a genuine cross-chain claim across two L2s. | `contracts/src/GiftRecipient.sol` |

## Layout

- `contracts/` — Foundry project (Solidity)
  - `src/` — `GiftHook`, `GiftSender`, `GiftRecipient`, `GiftReactive`
  - `script/` — deploy scripts
  - `test/` — Foundry tests

## Build

```sh
cd contracts
cp .env.example .env  # then fill in values
forge build
forge test
```
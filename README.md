# DeFi Gift Card — UHI9 Hookathon

**Posthook** — a consumer-friendly gift card backed by a Uniswap v4 hook'd LP
position. A sender deposits two stables into the position; while the gift is
unclaimed, the **hook charges swappers a premium fee that flows to the waiting
gift** (it's the pool's sole LP), so the voucher grows *in transit*. The
recipient claims it on a different chain by revealing a four-word secret.

- **Theme track:** UHI9 — Impermanent Loss & Yield Systems
- **Sponsor track:** Reactive Network

> **How the cross-chain hop actually works (honest note).** The Reactive Smart
> Contract topology is real and deployed, but Reactive Lasna's `LogRecord.data`
> shifts the first 32 bytes when feeding events to `react()`, which made the RSC
> bridge unreliable. The **load-bearing bridge today is a transparent bash
> relayer** (`contracts/relayer/relay.sh`) that watches both chains and calls the
> `admin*` functions directly. Cross-chain USDC delivery is likewise stubbed
> (GiftRecipient is pre-funded on Base); real CCTP wiring is the next milestone.
> The `/about` page documents all of this in the open.

## Architecture

```
Unichain Sepolia          Reactive Lasna           Base Sepolia
  GiftSender   ─events─→   GiftReactive  ─callbacks→  GiftRecipient
  GiftHook (v4)                  ↑                       ↓
  PoolManager           (relayer is the load-           USDC payout
  PositionManager        bearing bridge today)          (CCTP: next step)
                                 └───── events ──────────┘
```

## Try it live

- **App:** _(Vercel URL — set after deploy)_
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

Demo gifts + reproduction commands: `docs/demo-data.md`. Detailed plan:
`so-i-am-participating-glimmering-aho.md`.

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

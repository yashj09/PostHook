# DeFi Gift Card — UHI9 Hookathon

A consumer-friendly gift card backed by a Uniswap v4 hook'd LP position. Gifts grow while unclaimed (real LP fees), and a Reactive Smart Contract delivers the (now-larger) amount cross-chain to the recipient on their preferred chain.

- **Theme track:** UHI9 — Impermanent Loss & Yield Systems
- **Sponsor track:** Reactive Network

## Architecture

```
Unichain Sepolia          Reactive Lasna           Base Sepolia
  GiftSender   ─events─→   GiftReactive  ─callbacks→  GiftRecipient
  GiftHook (v4)                  ↑                       ↓
  PoolManager                    │                       USDC (via CCTP)
  PositionManager                └───── events ──────────┘
```

Detailed plan in `so-i-am-participating-glimmering-aho.md`.

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

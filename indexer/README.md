# Posthook Indexer

A standalone, **read-only** on-chain event indexer. It watches the Posthook
contracts across Unichain Sepolia and Base Sepolia and prints every event as a
live, colored terminal ledger:

- **Gift lifecycle** — `Deposited` / `Cancelled` / `Expired` / `Unwound`
  (Unichain) and `Mirrored` / `Claimed` / `Delivered` (Base).
- **Uniswap v4 pool `Swap`** — including the **live dynamic fee**, so you can
  watch the GiftHook charge the 0.30% transit premium (vs 0.05% baseline) in
  real time. This is the on-chain proof that the hook is actually doing work.

On start it **backfills** recent history (so the terminal is immediately full of
real activity), then **live-tails** new blocks. It signs nothing and needs no
private key — only RPC URLs — so it's safe to show on screen.

## Run

```sh
cd indexer
pnpm install
pnpm start
```

It reads `../contracts/.env` for RPC URLs and contract addresses, falling back to
public testnet RPCs and the current deployment if `.env` is absent. Override RPCs
via `UNICHAIN_SEPOLIA_RPC` / `BASE_SEPOLIA_RPC` if the public ones rate-limit.

## What you'll see

```
── backfill · recent on-chain history ──────────────────────────
HH:MM:SS  UNI   ✉ DEPOSIT  gift 0xfedf09a2…96779b · $1.0000 principal · → chain 84532  #… <explorer url>
HH:MM:SS  UNI   ↻ SWAP     vol $0.10 · fee 0.30% (transit premium) · tick -1  #… <url>
HH:MM:SS  BASE  ⇄ MIRROR   gift 0xfedf09a2…96779b · expected $1.0000  #… <url>
         Σ gifts 2 · swaps 6 · volume $1.05 · delivered 0 · fee 0.30%
── live · tailing new blocks ───────────────────────────────────
```

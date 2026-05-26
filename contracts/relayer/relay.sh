#!/usr/bin/env bash
# Posthook cross-chain relayer.
#
# Watches GiftSender on Unichain Sepolia for GiftDeposited / GiftUnwound,
# and GiftRecipient on Base Sepolia for GiftClaimed. For each, calls the
# corresponding admin* function on the opposite chain. This is intentionally
# a small, transparent, hand-cranked cross-chain bridge — easy to audit,
# easy to swap for the Reactive RSC once Lasna's data-shift quirk is patched
# upstream.
#
# Event shape (post-fix, all fields non-indexed; first slot is a sacrificial
# `address discard` field):
#
#   GiftDeposited(address discard, bytes32 giftId, bytes32 commitment,
#                 uint128 amount0, uint128 amount1, uint32 dstChainId,
#                 uint64 expiresAt)
#   GiftClaimed(address discard, bytes32 giftId, address claimer)
#   GiftUnwound(address discard, bytes32 giftId, address recipient,
#               uint128 principalReturned, uint128 yieldReturned,
#               uint32 dstChainId)
#
# Usage: from contracts/, after sourcing .env:
#   set -a; . ./.env; set +a; bash relayer/relay.sh
#
# Stops with Ctrl+C. Stores last-seen block in /tmp.

set -euo pipefail

: "${PRIVATE_KEY:?need PRIVATE_KEY in env}"
: "${UNICHAIN_SEPOLIA_RPC:?}"; : "${BASE_SEPOLIA_RPC:?}"
: "${UNICHAIN_SEPOLIA_GIFT_SENDER:?}"; : "${BASE_SEPOLIA_GIFT_RECIPIENT:?}"

TOPIC_DEPOSITED=$(cast keccak "GiftDeposited(address,bytes32,bytes32,uint128,uint128,uint32,uint64)")
TOPIC_CLAIMED=$(cast keccak "GiftClaimed(address,bytes32,address)")
TOPIC_UNWOUND=$(cast keccak "GiftUnwound(address,bytes32,address,uint128,uint128,uint32)")

UNI_CURSOR_FILE=/tmp/giftcard_uni_cursor
BASE_CURSOR_FILE=/tmp/giftcard_base_cursor

if [ ! -f "$UNI_CURSOR_FILE" ]; then
  cast block-number --rpc-url "$UNICHAIN_SEPOLIA_RPC" > "$UNI_CURSOR_FILE"
fi
if [ ! -f "$BASE_CURSOR_FILE" ]; then
  cast block-number --rpc-url "$BASE_SEPOLIA_RPC" > "$BASE_CURSOR_FILE"
fi

RELAY_LOG="${RELAY_LOG:-/tmp/posthook-relay.log}"
exec > >(tee -a "$RELAY_LOG") 2>&1

echo "Relayer started. Watching:"
echo "  Unichain Sepolia GiftSender: $UNICHAIN_SEPOLIA_GIFT_SENDER"
echo "  Base Sepolia GiftRecipient:  $BASE_SEPOLIA_GIFT_RECIPIENT"
echo "  Cursor (Unichain): $(cat $UNI_CURSOR_FILE)"
echo "  Cursor (Base):     $(cat $BASE_CURSOR_FILE)"
echo "  Logging to:        $RELAY_LOG"
echo

# ----- handlers -----
# Each takes the on-chain data (hex with 0x prefix) and unpacks fields by
# 32-byte offset. Field 0 is the sacrificial discard slot; the real cargo
# starts at offset 32.

handle_deposited() {
  local data=$1
  local d=${data#0x}
  # field 0: discard (address)            slot [0   .. 64)
  local gift_id=0x${d:64:64}            # slot [64  .. 128)
  local commitment=0x${d:128:64}        # slot [128 .. 192)
  local amount0=0x${d:192:64}           # slot [192 .. 256)
  local amount1=0x${d:256:64}           # slot [256 .. 320)
  # field 5: dstChainId (uint32)          slot [320 .. 384)
  local expires=0x${d:384:64}           # slot [384 .. 448)

  local expected_amount=$((amount0 + amount1))
  echo "[deposit→mint] giftId=$gift_id commitment=$commitment expected=$expected_amount"
  cast send "$BASE_SEPOLIA_GIFT_RECIPIENT" \
    "adminMintGiftEntry(bytes32,bytes32,uint128,uint64)" \
    "$gift_id" "$commitment" "$expected_amount" "$expires" \
    --rpc-url "$BASE_SEPOLIA_RPC" --private-key "$PRIVATE_KEY" \
    2>&1 | grep -E "^status|^transactionHash" | head -2
}

handle_claimed() {
  local data=$1
  local d=${data#0x}
  # field 0: discard                      slot [0   .. 64)
  local gift_id=0x${d:64:64}            # slot [64  .. 128)
  local claimer=0x${d:128+24:40}        # address in slot [128 .. 192) low 20 bytes

  echo "[claim→unwind] giftId=$gift_id claimer=$claimer"
  cast send "$UNICHAIN_SEPOLIA_GIFT_SENDER" \
    "adminUnwindGift(bytes32,address)" \
    "$gift_id" "$claimer" \
    --rpc-url "$UNICHAIN_SEPOLIA_RPC" --private-key "$PRIVATE_KEY" \
    2>&1 | grep -E "^status|^transactionHash" | head -2
}

handle_unwound() {
  local data=$1
  local d=${data#0x}
  # field 0: discard                      slot [0   .. 64)
  local gift_id=0x${d:64:64}            # slot [64  .. 128)
  # field 2: recipient (address)          slot [128 .. 192)
  local principal=0x${d:192:64}         # slot [192 .. 256)
  local yield=0x${d:256:64}             # slot [256 .. 320)

  local total=$((principal + yield))
  echo "[unwound→deliver] giftId=$gift_id total=$total"
  cast send "$BASE_SEPOLIA_GIFT_RECIPIENT" \
    "adminDeliverGift(bytes32,uint128)" \
    "$gift_id" "$total" \
    --rpc-url "$BASE_SEPOLIA_RPC" --private-key "$PRIVATE_KEY" \
    2>&1 | grep -E "^status|^transactionHash" | head -2
}

extract_logs() {
  python3 -c '
import sys,re
events = sys.stdin.read().split("- address:")
for e in events:
    if not e.strip(): continue
    tx = re.search(r"transactionHash: (\S+)", e)
    data = re.search(r"data: (\S+)", e)
    if tx and data:
        print(tx.group(1), data.group(1))
'
}

# ----- poll loop -----

while true; do
  # Unichain side
  cur_uni=$(cat "$UNI_CURSOR_FILE")
  head_uni=$(cast block-number --rpc-url "$UNICHAIN_SEPOLIA_RPC")
  if [ "$head_uni" -gt "$cur_uni" ]; then
    while read -r line; do
      [ -z "$line" ] && continue
      data=$(echo "$line" | awk '{print $2}')
      handle_deposited "$data"
    done < <(cast logs --address "$UNICHAIN_SEPOLIA_GIFT_SENDER" "$TOPIC_DEPOSITED" \
        --from-block $((cur_uni + 1)) --to-block "$head_uni" \
        --rpc-url "$UNICHAIN_SEPOLIA_RPC" 2>/dev/null | extract_logs)

    while read -r line; do
      [ -z "$line" ] && continue
      data=$(echo "$line" | awk '{print $2}')
      handle_unwound "$data"
    done < <(cast logs --address "$UNICHAIN_SEPOLIA_GIFT_SENDER" "$TOPIC_UNWOUND" \
        --from-block $((cur_uni + 1)) --to-block "$head_uni" \
        --rpc-url "$UNICHAIN_SEPOLIA_RPC" 2>/dev/null | extract_logs)

    echo "$head_uni" > "$UNI_CURSOR_FILE"
  fi

  # Base side
  cur_base=$(cat "$BASE_CURSOR_FILE")
  head_base=$(cast block-number --rpc-url "$BASE_SEPOLIA_RPC")
  if [ "$head_base" -gt "$cur_base" ]; then
    while read -r line; do
      [ -z "$line" ] && continue
      data=$(echo "$line" | awk '{print $2}')
      handle_claimed "$data"
    done < <(cast logs --address "$BASE_SEPOLIA_GIFT_RECIPIENT" "$TOPIC_CLAIMED" \
        --from-block $((cur_base + 1)) --to-block "$head_base" \
        --rpc-url "$BASE_SEPOLIA_RPC" 2>/dev/null | extract_logs)

    echo "$head_base" > "$BASE_CURSOR_FILE"
  fi

  sleep 6
done

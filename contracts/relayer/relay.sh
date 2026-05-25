#!/usr/bin/env bash
# Manual cross-chain relayer (testnet fallback for the Reactive RSC).
#
# Watches the GiftSender on Unichain Sepolia for new GiftDeposited and
# GiftUnwound events, and watches the GiftRecipient on Base Sepolia for
# GiftClaimed events. For each, calls the corresponding `admin*` function
# on the *other* chain. This is what the RSC is supposed to do
# automatically; on Lasna we hit a topic-mapping quirk so we drive it
# manually for the hackathon demo.
#
# Usage: from contracts/, after sourcing .env:
#   set -a; . ./.env; set +a; bash relayer/relay.sh
#
# Stops with Ctrl+C. Stores last-seen block in /tmp.

set -euo pipefail

: "${PRIVATE_KEY:?need PRIVATE_KEY in env}"
: "${UNICHAIN_SEPOLIA_RPC:?}"; : "${BASE_SEPOLIA_RPC:?}"
: "${UNICHAIN_SEPOLIA_GIFT_SENDER:?}"; : "${BASE_SEPOLIA_GIFT_RECIPIENT:?}"

TOPIC_DEPOSITED=$(cast keccak "GiftDeposited(bytes32,address,bytes32,uint128,uint128,uint32,uint64)")
TOPIC_CLAIMED=$(cast keccak "GiftClaimed(bytes32,address)")
TOPIC_UNWOUND=$(cast keccak "GiftUnwound(bytes32,address,uint128,uint128,uint32)")

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

handle_deposited() {
  local data=$1 topic1=$2
  # data = (address sender, bytes32 commitment, uint128 amount0, uint128 amount1,
  #         uint32 dstChainId, uint64 expiresAt)
  # Each field zero-padded to 32 bytes. Strip 0x prefix and slice.
  local d=${data#0x}
  local sender_hex=${d:0:64}
  local commitment=0x${d:64:64}
  local amount0=0x${d:128:64}
  local amount1=0x${d:192:64}
  local dst_chain=0x${d:256:64}
  local expires=0x${d:320:64}

  local gift_id=$topic1
  local expected_amount=$(printf "%d\n" $((amount0 + amount1)))
  echo "[deposit→mint] giftId=$gift_id commitment=$commitment expected=$expected_amount expires=$expires"
  cast send "$BASE_SEPOLIA_GIFT_RECIPIENT" \
    "adminMintGiftEntry(bytes32,bytes32,uint128,uint64)" \
    "$gift_id" "$commitment" "$expected_amount" "$expires" \
    --rpc-url "$BASE_SEPOLIA_RPC" --private-key "$PRIVATE_KEY" \
    2>&1 | grep -E "^status|^transactionHash" | head -2
}

handle_claimed() {
  local topic1=$1 topic2=$2
  local gift_id=$topic1
  # topic2 is the address claimer, padded to 32 bytes.
  local claimer=0x${topic2:26}
  echo "[claim→unwind] giftId=$gift_id claimer=$claimer"
  cast send "$UNICHAIN_SEPOLIA_GIFT_SENDER" \
    "adminUnwindGift(bytes32,address)" \
    "$gift_id" "$claimer" \
    --rpc-url "$UNICHAIN_SEPOLIA_RPC" --private-key "$PRIVATE_KEY" \
    2>&1 | grep -E "^status|^transactionHash" | head -2
}

handle_unwound() {
  local data=$1 topic1=$2
  # data = (address recipient, uint128 principalReturned, uint128 yieldReturned, uint32 dstChainId)
  local d=${data#0x}
  # recipient is at offset 0..64
  local principal=0x${d:64:64}
  local yield=0x${d:128:64}

  local gift_id=$topic1
  local total=$(printf "%d\n" $((principal + yield)))
  echo "[unwound→deliver] giftId=$gift_id total=$total"
  cast send "$BASE_SEPOLIA_GIFT_RECIPIENT" \
    "adminDeliverGift(bytes32,uint128)" \
    "$gift_id" "$total" \
    --rpc-url "$BASE_SEPOLIA_RPC" --private-key "$PRIVATE_KEY" \
    2>&1 | grep -E "^status|^transactionHash" | head -2
}

# ----- poll loop -----

while true; do
  # ----- Unichain side -----
  cur_uni=$(cat "$UNI_CURSOR_FILE")
  head_uni=$(cast block-number --rpc-url "$UNICHAIN_SEPOLIA_RPC")
  if [ "$head_uni" -gt "$cur_uni" ]; then
    # GiftDeposited
    while read -r line; do
      [ -z "$line" ] && continue
      tx=$(echo "$line" | awk '{print $1}')
      block=$(echo "$line" | awk '{print $2}')
      data=$(echo "$line" | awk '{print $3}')
      topic1=$(echo "$line" | awk '{print $4}')
      handle_deposited "$data" "$topic1"
    done < <(cast logs --address "$UNICHAIN_SEPOLIA_GIFT_SENDER" "$TOPIC_DEPOSITED" \
        --from-block $((cur_uni + 1)) --to-block "$head_uni" \
        --rpc-url "$UNICHAIN_SEPOLIA_RPC" 2>/dev/null \
      | python3 -c '
import sys,re
events = sys.stdin.read().split("- address:")
for e in events:
    if not e.strip(): continue
    tx = re.search(r"transactionHash: (\S+)", e)
    bn = re.search(r"blockNumber: (\d+)", e)
    data = re.search(r"data: (\S+)", e)
    topics = re.findall(r"^\s*0x[0-9a-fA-F]{64}\s*$", e, re.MULTILINE)
    if tx and data and len(topics) >= 2:
        print(tx.group(1), bn.group(1) if bn else 0, data.group(1), topics[1])
')

    # GiftUnwound
    while read -r line; do
      [ -z "$line" ] && continue
      tx=$(echo "$line" | awk '{print $1}')
      data=$(echo "$line" | awk '{print $3}')
      topic1=$(echo "$line" | awk '{print $4}')
      handle_unwound "$data" "$topic1"
    done < <(cast logs --address "$UNICHAIN_SEPOLIA_GIFT_SENDER" "$TOPIC_UNWOUND" \
        --from-block $((cur_uni + 1)) --to-block "$head_uni" \
        --rpc-url "$UNICHAIN_SEPOLIA_RPC" 2>/dev/null \
      | python3 -c '
import sys,re
events = sys.stdin.read().split("- address:")
for e in events:
    if not e.strip(): continue
    tx = re.search(r"transactionHash: (\S+)", e)
    bn = re.search(r"blockNumber: (\d+)", e)
    data = re.search(r"data: (\S+)", e)
    topics = re.findall(r"^\s*0x[0-9a-fA-F]{64}\s*$", e, re.MULTILINE)
    if tx and data and len(topics) >= 2:
        print(tx.group(1), bn.group(1) if bn else 0, data.group(1), topics[1])
')

    echo "$head_uni" > "$UNI_CURSOR_FILE"
  fi

  # ----- Base side -----
  cur_base=$(cat "$BASE_CURSOR_FILE")
  head_base=$(cast block-number --rpc-url "$BASE_SEPOLIA_RPC")
  if [ "$head_base" -gt "$cur_base" ]; then
    while read -r line; do
      [ -z "$line" ] && continue
      tx=$(echo "$line" | awk '{print $1}')
      topic1=$(echo "$line" | awk '{print $3}')
      topic2=$(echo "$line" | awk '{print $4}')
      handle_claimed "$topic1" "$topic2"
    done < <(cast logs --address "$BASE_SEPOLIA_GIFT_RECIPIENT" "$TOPIC_CLAIMED" \
        --from-block $((cur_base + 1)) --to-block "$head_base" \
        --rpc-url "$BASE_SEPOLIA_RPC" 2>/dev/null \
      | python3 -c '
import sys,re
events = sys.stdin.read().split("- address:")
for e in events:
    if not e.strip(): continue
    tx = re.search(r"transactionHash: (\S+)", e)
    bn = re.search(r"blockNumber: (\d+)", e)
    topics = re.findall(r"^\s*0x[0-9a-fA-F]{64}\s*$", e, re.MULTILINE)
    if tx and len(topics) >= 3:
        print(tx.group(1), bn.group(1) if bn else 0, topics[1], topics[2])
')

    echo "$head_base" > "$BASE_CURSOR_FILE"
  fi

  sleep 6
done

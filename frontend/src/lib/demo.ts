/**
 * The pinned demo gift, surfaced on the landing page as a "Try the demo" link.
 *
 * It points at a real in-transit gift on the live contracts (sender state
 * Deposited, recipient state Mirrored) whose LP fees are visibly accruing — so
 * a visitor lands directly on `/sent/[giftId]` and watches the YieldTicker
 * climb without needing a wallet or faucet.
 *
 * Both values are overridable via env so a redeploy / fresh mint only needs an
 * env change (and rebuild), not a code edit. If either is missing, `demoGift`
 * is null and the CTA hides itself.
 */

// Display gift: minted on GiftSender 0xe51c…9EaD, mirrored to Base, never
// claimed (stays in transit for the judging window). See docs/demo-data.md.
const DEMO_GIFT_ID =
  process.env.NEXT_PUBLIC_DEMO_GIFT_ID ??
  "0xfedf09a276a648f99481386a566c47ee8e263d61418ffb36bbf1992e3a96779b";

const DEMO_SECRET =
  process.env.NEXT_PUBLIC_DEMO_SECRET ?? "Postcard-Heath-Ember-Cobalt";

const isGiftId = (v: string): v is `0x${string}` =>
  /^0x[0-9a-fA-F]{64}$/.test(v);

export const demoGift =
  DEMO_GIFT_ID && DEMO_SECRET && isGiftId(DEMO_GIFT_ID)
    ? { giftId: DEMO_GIFT_ID as `0x${string}`, secret: DEMO_SECRET }
    : null;

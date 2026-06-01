import { RelayLedger } from "@/components/RelayLedger";

export default function SortingRoomPage() {
  return (
    <main className="relative flex-1 w-full overflow-hidden">
      <section
        className="mx-auto w-full max-w-[1240px] px-8 pt-12 pb-16 animate-paper-rise"
        style={{ "--rise-delay": "60ms" } as React.CSSProperties}
      >
        <div
          className="text-[10px] uppercase tracking-[0.4em] text-[var(--color-stamp)] font-semibold mb-3"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Auxiliary · Telegraph
        </div>
        <h1
          className="display text-[var(--color-ink)] leading-[0.95]"
          style={{
            fontSize: "clamp(40px, 5.4vw, 76px)",
            fontVariationSettings: "'opsz' 144, 'wght' 380, 'WONK' 1",
            letterSpacing: "-0.02em",
          }}
        >
          The sorting room.
        </h1>
        <p
          className="mt-6 max-w-[640px] text-[15px] leading-[1.55] text-[var(--color-ink-soft)]"
          style={{ fontFamily: "var(--font-body)" }}
        >
          Every voucher passes through here. The Reactive Network handles this in production; on Sepolia we
          run a small bash relayer that watches both chains. Here is what it sees, line by line, in real time.
        </p>

        <div className="rule-brass my-10" />

        <RelayLedger />

        <div className="mt-10 grid grid-cols-12 gap-6">
          <Pillar
            n="I"
            label="Origin"
            value="GiftDeposited"
            caption="Unichain Sepolia"
          />
          <Pillar
            n="II"
            label="Bridge"
            value="adminMintGiftEntry"
            caption="Reactive · then Base"
          />
          <Pillar
            n="III"
            label="Claim"
            value="GiftClaimed"
            caption="Base Sepolia"
          />
          <Pillar
            n="IV"
            label="Unwind"
            value="adminUnwindGift"
            caption="Unichain Sepolia"
          />
        </div>
      </section>
    </main>
  );
}

function Pillar({
  n,
  label,
  value,
  caption,
}: {
  n: string;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="col-span-6 md:col-span-3 border-l border-[var(--color-rule)] pl-4">
      <div
        className="display text-[var(--color-stamp)] mb-1 leading-none"
        style={{ fontSize: 28, fontVariationSettings: "'opsz' 144, 'wght' 360, 'WONK' 1" }}
      >
        {n}.
      </div>
      <div
        className="text-[9px] uppercase tracking-[0.32em] text-[var(--color-ink-muted)]"
        style={{ fontFamily: "var(--font-body)" }}
      >
        {label}
      </div>
      <div
        className="display text-[var(--color-ink)] mt-1"
        style={{ fontSize: 18, fontVariationSettings: "'opsz' 144, 'wght' 500" }}
      >
        {value}
      </div>
      <div
        className="text-[10px] text-[var(--color-ink-muted)] mt-0.5"
        style={{ fontFamily: "var(--font-mono)" }}
      >
        {caption}
      </div>
    </div>
  );
}

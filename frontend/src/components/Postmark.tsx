"use client";

/**
 * A circular postmark stamp — like a hand-pressed ink ring with a date and
 * city/chain inside. Slight rotation jitter; wears the burgundy ink color.
 */
export function Postmark({
  city,
  date,
  jitter = -8,
  size = 110,
}: {
  city: string;
  date: string;
  jitter?: number;
  size?: number;
}) {
  const r = size / 2 - 4;
  return (
    <div
      className="relative inline-block"
      style={{
        width: size,
        height: size,
        transform: `rotate(${jitter}deg)`,
        opacity: 0.78,
        mixBlendMode: "multiply",
      }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0">
        {/* Outer ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-stamp)"
          strokeWidth={1.6}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r - 6}
          fill="none"
          stroke="var(--color-stamp)"
          strokeWidth={0.8}
          strokeDasharray="2 2"
        />
        {/* Curved top text */}
        <defs>
          <path
            id={`pm-curve-${city}`}
            d={`M ${size / 2 - r + 12} ${size / 2} A ${r - 12} ${r - 12} 0 0 1 ${size / 2 + r - 12} ${size / 2}`}
            fill="none"
          />
        </defs>
        <text
          fill="var(--color-stamp)"
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 9,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          <textPath href={`#pm-curve-${city}`} startOffset="50%" textAnchor="middle">
            {city}
          </textPath>
        </text>
        {/* Wavy lines (postmark cancellation) */}
        <path
          d={`M ${size / 2 - r + 8} ${size / 2 + 6}
              q ${(r - 8) / 2} 4, ${r - 8} 0
              q ${(r - 8) / 2} -4, ${r - 8} 0`}
          stroke="var(--color-stamp)"
          strokeWidth={1}
          fill="none"
          opacity={0.7}
        />
        <path
          d={`M ${size / 2 - r + 8} ${size / 2 + 12}
              q ${(r - 8) / 2} 4, ${r - 8} 0
              q ${(r - 8) / 2} -4, ${r - 8} 0`}
          stroke="var(--color-stamp)"
          strokeWidth={0.8}
          fill="none"
          opacity={0.55}
        />
        {/* Date inside */}
        <text
          x={size / 2}
          y={size / 2 - 2}
          textAnchor="middle"
          fill="var(--color-stamp)"
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.1em",
          }}
        >
          {date}
        </text>
      </svg>
    </div>
  );
}

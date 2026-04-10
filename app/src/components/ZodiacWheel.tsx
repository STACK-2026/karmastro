// SVG paths for each zodiac sign - clean, geometric, premium
const SIGN_PATHS: { name: string; path: string }[] = [
  { name: "Bélier", path: "M-5 8 C-5-2 0-8 5-8 C10-8 10 0 5 5 M5 8 C5-2 0-8-5-8 C-10-8-10 0-5 5" },
  { name: "Taureau", path: "M0 8 A6 6 0 1 1 0-4 M-6-6 C-6-10 0-12 0-8 C0-12 6-10 6-6" },
  { name: "Gémeaux", path: "M-5-8 L-5 8 M5-8 L5 8 M-7-8 C-3-11 3-11 7-8 M-7 8 C-3 11 3 11 7 8" },
  { name: "Cancer", path: "M-3-1 A3.5 3.5 0 1 1 3-1 M3 1 A3.5 3.5 0 1 1-3 1 M-3-1 L3-1 M-3 1 L3 1" },
  { name: "Lion", path: "M-5-5 C-5 1 0 5 3 4 M3 4 A3 3 0 1 1 3 10" },
  { name: "Vierge", path: "M-5-7 L-5 7 M-1-7 L-1 3 C-1 7 4 7 6 3 M3-7 L3 3 M7 0 L9-3" },
  { name: "Balance", path: "M-7 3 L7 3 M-5-2 C-5-7 5-7 5-2 M-7 7 L7 7" },
  { name: "Scorpion", path: "M-6-5 L-6 5 M-2-5 L-2 5 M2-5 L2 5 L5 2 L7 5 L9 3" },
  { name: "Sagittaire", path: "M-5 5 L5-5 M1-5 L5-5 L5-1 M-3 1 L1-3" },
  { name: "Capricorne", path: "M-5-5 L-1 5 C3 5 5 1 5-2 C5-5 8-4 7 0" },
  { name: "Verseau", path: "M-7-2 L-4 2 L0-2 L4 2 L7-2 M-7 4 L-4 8 L0 4 L4 8 L7 4" },
  { name: "Poissons", path: "M-5-7 C0-3 0 3-5 7 M5-7 C0-3 0 3 5 7 M-7 0 L7 0" },
];

const ZodiacWheel = ({ size = 200 }: { size?: number }) => {
  const r = size / 2 - 24;
  const iconSize = size / 14;

  return (
    <div
      className="relative animate-spin-slow"
      style={{ width: size, height: size, willChange: "transform" }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Outer rings */}
        <circle cx={size/2} cy={size/2} r={r + 14} fill="none" stroke="hsl(271 91% 65% / 0.15)" strokeWidth="0.5" />
        <circle cx={size/2} cy={size/2} r={r + 10} fill="none" stroke="hsl(271 91% 65% / 0.25)" strokeWidth="0.8" />
        <circle cx={size/2} cy={size/2} r={r - 10} fill="none" stroke="hsl(271 91% 65% / 0.15)" strokeWidth="0.5" />

        {/* 12 section lines (like a clock) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x1 = size/2 + (r - 10) * Math.cos(angle);
          const y1 = size/2 + (r - 10) * Math.sin(angle);
          const x2 = size/2 + (r + 10) * Math.cos(angle);
          const y2 = size/2 + (r + 10) * Math.sin(angle);
          return (
            <line key={`line-${i}`} x1={x1} y1={y1} x2={x2} y2={y2}
              stroke="hsl(271 91% 65% / 0.1)" strokeWidth="0.5" />
          );
        })}

        {/* Zodiac sign SVG paths */}
        {SIGN_PATHS.map((sign, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = size/2 + r * Math.cos(angle);
          const y = size/2 + r * Math.sin(angle);
          const isGold = i % 3 === 0; // Every 3rd sign in gold for variety
          return (
            <g key={sign.name} transform={`translate(${x},${y}) scale(${iconSize / 14})`}>
              <path
                d={sign.path}
                fill="none"
                stroke={isGold ? "hsl(43 76% 65%)" : "hsl(271 91% 75%)"}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.85"
              />
            </g>
          );
        })}

        {/* Center glow */}
        <circle cx={size/2} cy={size/2} r={18} fill="hsl(271 91% 65% / 0.15)" />
        <circle cx={size/2} cy={size/2} r={8} fill="hsl(271 91% 65% / 0.3)" />
        <circle cx={size/2} cy={size/2} r={3} fill="hsl(271 91% 65% / 0.6)" />
      </svg>
    </div>
  );
};

export default ZodiacWheel;

// Zodiac SVG symbol — same geometric paths as the ZodiacWheel component
// Replaces Unicode zodiac emoji (♈♉♊...) with clean SVG glyphs

const SIGN_PATHS: Record<string, string> = {
  "Bélier": "M-5 8 C-5-2 0-8 5-8 C10-8 10 0 5 5 M5 8 C5-2 0-8-5-8 C-10-8-10 0-5 5",
  "Taureau": "M0 8 A6 6 0 1 1 0-4 M-6-6 C-6-10 0-12 0-8 C0-12 6-10 6-6",
  "Gémeaux": "M-5-8 L-5 8 M5-8 L5 8 M-7-8 C-3-11 3-11 7-8 M-7 8 C-3 11 3 11 7 8",
  "Cancer": "M-3-1 A3.5 3.5 0 1 1 3-1 M3 1 A3.5 3.5 0 1 1-3 1 M-3-1 L3-1 M-3 1 L3 1",
  "Lion": "M-5-5 C-5 1 0 5 3 4 M3 4 A3 3 0 1 1 3 10",
  "Vierge": "M-5-7 L-5 7 M-1-7 L-1 3 C-1 7 4 7 6 3 M3-7 L3 3 M7 0 L9-3",
  "Balance": "M-7 3 L7 3 M-5-2 C-5-7 5-7 5-2 M-7 7 L7 7",
  "Scorpion": "M-6-5 L-6 5 M-2-5 L-2 5 M2-5 L2 5 L5 2 L7 5 L9 3",
  "Sagittaire": "M-5 5 L5-5 M1-5 L5-5 L5-1 M-3 1 L1-3",
  "Capricorne": "M-5-5 L-1 5 C3 5 5 1 5-2 C5-5 8-4 7 0",
  "Verseau": "M-7-2 L-4 2 L0-2 L4 2 L7-2 M-7 4 L-4 8 L0 4 L4 8 L7 4",
  "Poissons": "M-5-7 C0-3 0 3-5 7 M5-7 C0-3 0 3 5 7 M-7 0 L7 0",
};

interface Props {
  sign: string | null | undefined;
  size?: number;
  color?: string;
  className?: string;
}

export const ZodiacSymbol = ({ sign, size = 32, color = "#D4A017", className = "" }: Props) => {
  const path = sign ? SIGN_PATHS[sign] : null;
  if (!path) {
    // Fallback : empty circle (for unknown sign)
    return (
      <svg
        width={size}
        height={size}
        viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
      >
        <circle cx="0" cy="0" r={size / 4} fill="none" stroke={color} strokeWidth="1" opacity="0.3" />
      </svg>
    );
  }

  const scale = size / 28;
  return (
    <svg
      width={size}
      height={size}
      viewBox={`${-size / 2} ${-size / 2} ${size} ${size}`}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-label={sign}
      role="img"
    >
      <g transform={`scale(${scale})`}>
        <path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
};

export default ZodiacSymbol;

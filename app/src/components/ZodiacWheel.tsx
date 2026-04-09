import { motion } from "framer-motion";

const SIGNS = ["♈","♉","♊","♋","♌","♍","♎","♏","♐","♑","♒","♓"];

const ZodiacWheel = ({ size = 200 }: { size?: number }) => {
  const r = size / 2 - 20;
  
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
      className="relative"
      style={{ width: size, height: size }}
    >
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
        {/* Outer ring */}
        <circle cx={size/2} cy={size/2} r={r + 10} fill="none" stroke="hsl(271 91% 65% / 0.2)" strokeWidth="1" />
        <circle cx={size/2} cy={size/2} r={r - 10} fill="none" stroke="hsl(271 91% 65% / 0.1)" strokeWidth="1" />
        
        {/* Signs */}
        {SIGNS.map((sign, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = size/2 + r * Math.cos(angle);
          const y = size/2 + r * Math.sin(angle);
          return (
            <text
              key={i}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              className="fill-primary"
              fontSize={size / 12}
            >
              {sign}
            </text>
          );
        })}
        
        {/* Center glow */}
        <circle cx={size/2} cy={size/2} r={15} fill="hsl(271 91% 65% / 0.3)" />
        <circle cx={size/2} cy={size/2} r={5} fill="hsl(271 91% 65% / 0.6)" />
      </svg>
    </motion.div>
  );
};

export default ZodiacWheel;

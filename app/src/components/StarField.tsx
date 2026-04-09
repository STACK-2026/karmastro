// Seed fixed pour eviter le re-render random
const rng = (seed: number) => {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
};

const rand = rng(42);
const driftClasses = ["animate-drift-1", "animate-drift-2", "animate-drift-3"];

// 3 layers: fond (petites, nombreuses), milieu, premier plan (rares, brillantes)
const bgStars = Array.from({ length: 60 }, (_, i) => ({
  id: `bg-${i}`,
  left: `${rand() * 100}%`,
  top: `${rand() * 100}%`,
  size: rand() * 1.2 + 0.3,
  twinkleDelay: rand() * 8,
  twinkleDuration: rand() * 4 + 3,
  driftDelay: rand() * 10,
  opacity: rand() * 0.3 + 0.05,
  color: "white",
  drift: driftClasses[Math.floor(rand() * 3)],
}));

const midStars = Array.from({ length: 25 }, (_, i) => ({
  id: `mid-${i}`,
  left: `${rand() * 100}%`,
  top: `${rand() * 100}%`,
  size: rand() * 1.8 + 0.8,
  twinkleDelay: rand() * 6,
  twinkleDuration: rand() * 3 + 2,
  driftDelay: rand() * 8,
  opacity: rand() * 0.4 + 0.15,
  color: rand() > 0.7 ? "hsl(43 76% 80%)" : rand() > 0.4 ? "hsl(220 60% 90%)" : "white",
  drift: driftClasses[Math.floor(rand() * 3)],
}));

const brightStars = Array.from({ length: 8 }, (_, i) => ({
  id: `bright-${i}`,
  left: `${rand() * 100}%`,
  top: `${rand() * 100}%`,
  size: rand() * 1.5 + 2,
  twinkleDelay: rand() * 5,
  twinkleDuration: rand() * 2.5 + 1.5,
  driftDelay: rand() * 6,
  opacity: rand() * 0.3 + 0.5,
  color: rand() > 0.5 ? "hsl(271 60% 85%)" : "hsl(43 50% 90%)",
  drift: driftClasses[Math.floor(rand() * 3)],
}));

const allStars = [...bgStars, ...midStars, ...brightStars];

const StarField = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Nebula gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to bottom, hsl(271 30% 10%) 0%, hsl(260 30% 4%) 40%, hsl(260 30% 3%) 100%)",
          opacity: 0.7,
        }}
      />

      {allStars.map((star) => (
        <div
          key={star.id}
          className={`absolute rounded-full ${star.drift}`}
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: star.color,
            opacity: star.opacity,
            animation: `twinkle ${star.twinkleDuration}s ease-in-out ${star.twinkleDelay}s infinite, ${star.drift.replace("animate-", "")} ${12 + star.driftDelay}s ease-in-out ${star.driftDelay}s infinite`,
            willChange: "opacity, transform",
            ...(star.size > 2.5 ? { boxShadow: `0 0 ${star.size * 2}px ${star.color}` } : {}),
          }}
        />
      ))}
    </div>
  );
};

export default StarField;

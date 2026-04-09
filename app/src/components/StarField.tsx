// Seed fixed pour eviter le re-render random
const rng = (seed: number) => {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
};

const rand = rng(42);

// 3 layers: fond (petites, nombreuses), milieu, premier plan (rares, brillantes)
const bgStars = Array.from({ length: 60 }, (_, i) => ({
  id: `bg-${i}`,
  left: `${rand() * 100}%`,
  top: `${rand() * 100}%`,
  size: rand() * 1.2 + 0.3,
  delay: rand() * 8,
  duration: rand() * 4 + 3,
  opacity: rand() * 0.3 + 0.05,
  color: "white",
}));

const midStars = Array.from({ length: 25 }, (_, i) => ({
  id: `mid-${i}`,
  left: `${rand() * 100}%`,
  top: `${rand() * 100}%`,
  size: rand() * 1.8 + 0.8,
  delay: rand() * 6,
  duration: rand() * 3 + 2,
  opacity: rand() * 0.4 + 0.15,
  // Some warm (gold), some cool (blue-white)
  color: rand() > 0.7 ? "hsl(43 76% 80%)" : rand() > 0.4 ? "hsl(220 60% 90%)" : "white",
}));

const brightStars = Array.from({ length: 8 }, (_, i) => ({
  id: `bright-${i}`,
  left: `${rand() * 100}%`,
  top: `${rand() * 100}%`,
  size: rand() * 1.5 + 2,
  delay: rand() * 5,
  duration: rand() * 2.5 + 1.5,
  opacity: rand() * 0.3 + 0.5,
  color: rand() > 0.5 ? "hsl(271 60% 85%)" : "hsl(43 50% 90%)",
}));

const allStars = [...bgStars, ...midStars, ...brightStars];

const StarField = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Nebula gradient — slightly brighter */}
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
          className="absolute rounded-full animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            background: star.color,
            opacity: star.opacity,
            animationDelay: `${star.delay}s`,
            animationDuration: `${star.duration}s`,
            willChange: "opacity",
            // Glow on bright stars
            ...(star.size > 2.5 ? { boxShadow: `0 0 ${star.size * 2}px ${star.color}` } : {}),
          }}
        />
      ))}
    </div>
  );
};

export default StarField;

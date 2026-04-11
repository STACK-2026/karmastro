import { useEffect } from "react";

// Sparkle cursor trail with depth.
// Multi-layer particles (background soft + foreground bright), strong glow,
// mouse/touch responsive. Respects prefers-reduced-motion.
// Throttle 30ms desktop / 90ms mobile. Max 60 concurrent particles.
const SparkleCursorTrail = () => {
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = matchMedia("(pointer: coarse)").matches;
    const throttleMs = isMobile ? 90 : 30;
    const colors = ["#fbbf24", "#c9a8e8", "#ffffff", "#f3d68c"];
    let lastSpawn = 0;
    let active = 0;
    const MAX_ACTIVE = 60;

    const makeStar = (x: number, y: number, layer: 0 | 1) => {
      const isBg = layer === 0;
      const size = isBg ? 1.5 + Math.random() * 1.5 : 4 + Math.random() * 3.5;
      const color = colors[(Math.random() * colors.length) | 0];
      const spread = isBg ? 30 : 45;
      const dx = (Math.random() - 0.5) * spread;
      const dy = (Math.random() - 0.5) * spread * 0.6 + (isBg ? 12 : 18);
      const dur = isBg ? 900 + Math.random() * 500 : 1100 + Math.random() * 600;
      const initialOpacity = isBg ? 0.6 : 1;
      const glowMultiplier = isBg ? 3 : 5.5;
      const scale = isBg ? 0.5 : 0.2;

      const star = document.createElement("div");
      star.style.cssText =
        `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
        `background:${color};border-radius:50%;` +
        `box-shadow:0 0 ${size * glowMultiplier}px ${color},0 0 ${size * 2}px ${color};` +
        `pointer-events:none;z-index:9999;opacity:${initialOpacity};` +
        `transform:translate(-50%,-50%) scale(1);` +
        `transition:opacity ${dur}ms ease-out,transform ${dur}ms cubic-bezier(.3,.1,.3,1);` +
        `will-change:opacity,transform;`;
      document.body.appendChild(star);
      active++;

      requestAnimationFrame(() => {
        star.style.opacity = "0";
        star.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(${scale})`;
      });

      setTimeout(() => {
        star.remove();
        active--;
      }, dur + 80);
    };

    const spawn = (x: number, y: number) => {
      const now = performance.now();
      if (now - lastSpawn < throttleMs) return;
      if (active >= MAX_ACTIVE) return;
      lastSpawn = now;
      // Foreground bright star
      makeStar(x + (Math.random() - 0.5) * 6, y + (Math.random() - 0.5) * 6, 1);
      // Background soft star (depth layer)
      if (active < MAX_ACTIVE) {
        makeStar(x + (Math.random() - 0.5) * 16, y + (Math.random() - 0.5) * 16, 0);
      }
      // Occasional third tiny twinkle
      if (Math.random() > 0.6 && active < MAX_ACTIVE) {
        makeStar(x + (Math.random() - 0.5) * 24, y + (Math.random() - 0.5) * 24, 0);
      }
    };

    const onMouse = (e: MouseEvent) => spawn(e.clientX, e.clientY);
    const onTouch = (e: TouchEvent) => {
      if (e.touches[0]) spawn(e.touches[0].clientX, e.touches[0].clientY);
    };

    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return null;
};

export default SparkleCursorTrail;

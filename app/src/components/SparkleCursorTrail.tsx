import { useEffect } from "react";

// Sparkle cursor trail, ultra lite.
// Throttled, pointer-events none, auto-cleanup, respects prefers-reduced-motion.
// Mobile: 120ms throttle. Desktop: 45ms throttle. Max 30 concurrent particles.
const SparkleCursorTrail = () => {
  useEffect(() => {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const isMobile = matchMedia("(pointer: coarse)").matches;
    const throttleMs = isMobile ? 120 : 45;
    const colors = ["rgba(251,191,36,0.85)", "rgba(201,168,232,0.75)", "rgba(255,255,255,0.8)"];
    let lastSpawn = 0;
    let active = 0;
    const MAX_ACTIVE = 30;

    const spawn = (x: number, y: number) => {
      const now = performance.now();
      if (now - lastSpawn < throttleMs) return;
      if (active >= MAX_ACTIVE) return;
      lastSpawn = now;
      active++;

      const size = 2 + Math.random() * 2.2;
      const color = colors[(Math.random() * colors.length) | 0];
      const dx = (Math.random() - 0.5) * 22;
      const dy = (Math.random() - 0.5) * 14 + 8;
      const dur = 650 + Math.random() * 400;

      const star = document.createElement("div");
      star.style.cssText =
        `position:fixed;left:${x}px;top:${y}px;width:${size}px;height:${size}px;` +
        `background:${color};border-radius:50%;box-shadow:0 0 ${size * 2.5}px ${color};` +
        `pointer-events:none;z-index:9999;opacity:0.85;transform:translate(-50%,-50%);` +
        `transition:opacity ${dur}ms ease-out,transform ${dur}ms ease-out;will-change:opacity,transform;`;
      document.body.appendChild(star);

      requestAnimationFrame(() => {
        star.style.opacity = "0";
        star.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
      });

      setTimeout(() => {
        star.remove();
        active--;
      }, dur + 80);
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

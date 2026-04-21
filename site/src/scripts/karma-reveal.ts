// Shared reveal helpers for tool result cards.
//
// Usage, in any `<script>` block of a tool page, after the result is populated :
//
//   import { revealResult, animateNumberTo } from "../../scripts/karma-reveal";
//   revealResult(resultEl);
//   animateNumberTo(numberEl, result.number);
//
// The animations come from global.css (.karma-reveal, .karma-number-glow).
// This file only wires them to the runtime state changes.

const reducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Force-restart an animation by removing then re-adding the class on the next
// paint. Browsers skip the restart when the class is already there.
function retriggerAnimation(el: HTMLElement, className: string) {
  el.classList.remove(className);
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  void el.offsetWidth;
  el.classList.add(className);
}

// Fade+scale+shimmer reveal of a result container. Scrolls into view after a
// short delay so the animation plays in the user's field of view.
export function revealResult(el: HTMLElement | null): void {
  if (!el) return;
  el.classList.remove("hidden");
  if (!reducedMotion()) {
    retriggerAnimation(el, "karma-reveal");
  }
  setTimeout(() => {
    try {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      /* no-op */
    }
  }, 80);
}

// Count from 0 to the target value on a headline digit, with a gold glow that
// fades into a dimmer residual aura. For master numbers (11, 22, 33) we honour
// the display convention (no reduction) by accepting any number.
export function animateNumberTo(
  el: HTMLElement | null,
  target: number | string,
  options: { duration?: number; suffix?: string } = {}
): void {
  if (!el) return;
  const num = typeof target === "string" ? parseFloat(target) : target;
  const safeTarget = Number.isFinite(num) ? num : 0;
  const suffix = options.suffix || "";
  const finalText = Number.isFinite(num) ? String(target) : String(target || "");

  if (reducedMotion() || !Number.isFinite(num)) {
    el.textContent = finalText + suffix;
    return;
  }

  const duration = options.duration ?? 1400;
  const start = performance.now();
  const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

  retriggerAnimation(el, "karma-number-glow");

  function tick(now: number) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeOut(progress);
    const current = safeTarget * eased;
    // Master numbers (11, 22, 33) are shown as-is once reached.
    el.textContent = (progress < 1 ? Math.round(current) : safeTarget) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
    else el.textContent = finalText + suffix;
  }
  requestAnimationFrame(tick);
}

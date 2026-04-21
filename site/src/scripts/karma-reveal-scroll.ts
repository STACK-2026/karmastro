// Global scroll-reveal wiring. Any element tagged .karma-reveal-scroll fades
// and translates in when it crosses the viewport. Runs once per element, then
// unobserves to avoid reshooting on scroll back. Fully idempotent : safe to
// call multiple times (e.g. on astro:page-load).

function setupKarmaReveal() {
  if (typeof window === "undefined") return;
  // Remove fallback once JS runs so the initial "hidden" state applies.
  document.documentElement.classList.remove("no-js");

  const targets = document.querySelectorAll<HTMLElement>(
    ".karma-reveal-scroll:not(.is-visible)"
  );
  if (targets.length === 0) return;

  if (typeof IntersectionObserver !== "function") {
    // Very old browsers : reveal immediately, never penalise content visibility.
    targets.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.1 }
  );

  targets.forEach((el) => io.observe(el));
}

setupKarmaReveal();

// Astro MPA may swap documents on navigation. If an integration like
// <ClientRouter> is ever enabled, re-run on the new page.
document.addEventListener("astro:page-load", setupKarmaReveal);

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = resolve(import.meta.dirname, "../..");
const POSTHOG_MODULE = resolve(APP_ROOT, "src/lib/posthog.ts");
const TRACKER = resolve(APP_ROOT, "src/lib/tracker.ts");
const APP = resolve(APP_ROOT, "src/App.tsx");
const COOKIE_BANNER = resolve(APP_ROOT, "src/components/CookieBanner.tsx");
const ORACLE_PAGE = resolve(APP_ROOT, "src/pages/OraclePage.tsx");
const APP_HEADER = resolve(APP_ROOT, "src/components/AppHeader.tsx");
const PERSONALIZED_PAGES = [
  "Dashboard.tsx",
  "NumerologyPage.tsx",
  "CompatibilityPage.tsx",
  "CalendarPage.tsx",
].map((file) => resolve(APP_ROOT, "src/pages", file));

describe("PostHog App default-on privacy contract", () => {
  it("uses the EU endpoint and starts capture by default unless explicitly refused", () => {
    expect(existsSync(POSTHOG_MODULE), "src/lib/posthog.ts exists").toBe(true);
    if (!existsSync(POSTHOG_MODULE)) return;

    const source = readFileSync(POSTHOG_MODULE, "utf8");
    expect(source).toContain("https://eu.i.posthog.com");
    expect(source).toMatch(/opt_out_capturing_by_default:\s*false/);
    expect(source).toMatch(/hasExplicitlyOptedOut/);
    expect(source).toMatch(/cookie-consent[\s\S]*(none|essential)/);
    expect(source).toMatch(/VITE_POSTHOG_KEY/);
  });

  it("records behavior without exposing inputs or Oracle content", () => {
    const posthog = readFileSync(POSTHOG_MODULE, "utf8");
    const oracle = readFileSync(ORACLE_PAGE, "utf8");
    const appHeader = readFileSync(APP_HEADER, "utf8");

    expect(posthog).toMatch(/autocapture:\s*false/);
    expect(posthog).toMatch(/maskAllInputs:\s*true/);
    expect(posthog).toMatch(/blockSelector:[^\n]*\[data-ph-sensitive\]/);
    expect(posthog).toMatch(/maskTextSelector:[^\n]*\[data-ph-mask\]/);
    expect(oracle).toContain("data-ph-sensitive");
    expect(oracle).toContain('data-ph-mask="oracle-suggestions"');
    expect(oracle).toMatch(/<p data-ph-sensitive[^>]*>[\s\S]{0,300}empty_opener_question/);
    expect(oracle).toContain('aria-label={t("oracle.empty_choice_hint")}');
    expect(appHeader).toContain("data-ph-mask");
    for (const page of PERSONALIZED_PAGES) {
      expect(readFileSync(page, "utf8"), page).toContain("data-ph-mask");
    }
  });

  it("never starts replay on auth, recovery, or admin routes", () => {
    const posthog = readFileSync(POSTHOG_MODULE, "utf8");
    expect(posthog).toMatch(/disable_session_recording:\s*isReplayExcludedPath/);
    expect(posthog).toContain('path === "/auth"');
    expect(posthog).toContain('path.startsWith("/auth/")');
    expect(posthog).toContain('path === "/reset-password"');
    expect(posthog).toContain('path.startsWith("/admin")');
  });

  it("fans existing content-free events into PostHog and reacts to refusal", () => {
    const tracker = readFileSync(TRACKER, "utf8");
    const app = readFileSync(APP, "utf8");
    const banner = readFileSync(COOKIE_BANNER, "utf8");

    expect(tracker).toContain("capturePosthogEvent");
    expect(tracker).toContain("capturePosthogPageView");
    expect(app).toContain("initPosthog");
    expect(app.indexOf("initPosthog();")).toBeLessThan(app.indexOf("usePageTracking();"));
    expect(banner).toContain('new CustomEvent("kh:consent"');
  });

  it("recursively removes sensitive values and URL query strings before capture", async () => {
    const { sanitizePosthogProperties } = await import("@/lib/posthog");
    expect(sanitizePosthogProperties({
      question: "private question",
      assistant_message: "private answer",
      email: "private@example.test",
      user_question: "private nested-key question",
      displayName: "Private Name",
      birth_year: 1990,
      context: {
        question: "private nested question",
        safe_stage: "first_response",
        nested: { fullName: "Private Name", turn_index: 1 },
      },
      message_length: 42,
      turn_index: 1,
      $current_url: "https://app.karmastro.com/auth?code=secret#fragment",
    })).toEqual({
      context: {
        safe_stage: "first_response",
        nested: { turn_index: 1 },
      },
      message_length: 42,
      turn_index: 1,
      $current_url: "https://app.karmastro.com/auth",
    });
  });
});

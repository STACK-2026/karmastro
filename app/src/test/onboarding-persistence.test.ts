import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("onboarding profile persistence", () => {
  it("upserts the user-owned profile so a missing trigger row cannot restart onboarding", () => {
    const source = readFileSync(path.join(process.cwd(), "src/pages/OnboardingPage.tsx"), "utf8");

    expect(source).toMatch(/buildEssentialProfilePatch\(user\.id,\s*firstName,\s*birthDate\)/s);
    expect(source).toMatch(/onConflict:\s*["']user_id["']/);
    expect(source).not.toMatch(/\.from\(["']profiles["']\)\s*\.update\(/s);
  });

  it("removes the artificial scan and exposes an explicit reversible skip", () => {
    const source = readFileSync(path.join(process.cwd(), "src/pages/OnboardingPage.tsx"), "utf8");

    expect(source).not.toMatch(/setTimeout|SCAN_MESSAGES|scanStep|scanning|revealPhase/);
    expect(source).toContain('t("onboarding.progressive_skip")');
    expect(source).toContain('t("onboarding.progressive_skip_explanation")');
  });
});

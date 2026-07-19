import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("onboarding profile persistence", () => {
  it("upserts the user-owned profile so a missing trigger row cannot restart onboarding", () => {
    const source = readFileSync(path.join(process.cwd(), "src/pages/OnboardingPage.tsx"), "utf8");

    expect(source).toMatch(/\.upsert\(\s*\{\s*user_id:\s*user\.id,/s);
    expect(source).toMatch(/onConflict:\s*["']user_id["']/);
    expect(source).not.toMatch(/\.from\(["']profiles["']\)\s*\.update\(/s);
  });
});

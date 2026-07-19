import { describe, expect, it } from "vitest";
import { getLandingCtaPath } from "@/lib/landing-cta-path";

describe("landing CTA intent", () => {
  it("keeps profile acquisition in onboarding", () => {
    expect(getLandingCtaPath("profile")).toBe("/onboarding");
  });

  it("does not turn the Oracle preview into a profile CTA", () => {
    expect(getLandingCtaPath("oracle")).toBe("/oracle");
  });

  it("sends paid offer cards to pricing", () => {
    expect(getLandingCtaPath("pricing")).toBe("/pricing");
  });
});

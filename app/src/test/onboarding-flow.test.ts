import { describe, expect, it } from "vitest";
import {
  buildEssentialProfilePatch,
  profileIsComplete,
  resolveOnboardingFlow,
  resolveProfileBoundary,
} from "@/lib/onboarding-flow";

describe("progressive onboarding flow", () => {
  it("accepts only known internal destinations and reasons", () => {
    expect(resolveOnboardingFlow(new URLSearchParams("next=/oracle&reason=oracle_pending"))).toMatchObject({
      destination: "/oracle",
      skipDestination: "/oracle",
      reason: "oracle_pending",
    });
    expect(resolveOnboardingFlow(new URLSearchParams("next=https://evil.example&reason=unknown"))).toMatchObject({
      destination: "/dashboard",
      skipDestination: "/dashboard",
      reason: "direct",
    });
    expect(resolveOnboardingFlow(new URLSearchParams("next=/admin"))).toMatchObject({
      destination: "/dashboard",
      skipDestination: "/dashboard",
    });
  });

  it("sends a skipped personalized surface to the generic Oracle", () => {
    expect(resolveOnboardingFlow(
      new URLSearchParams("next=/astral&reason=personalized_surface"),
    )).toMatchObject({
      destination: "/astral",
      skipDestination: "/oracle",
      canSkip: true,
    });
  });

  it("builds a minimal upsert without advanced fields or null erasure", () => {
    expect(buildEssentialProfilePatch("user-1", "  Camille  ", "1990-02-14")).toEqual({
      user_id: "user-1",
      first_name: "Camille",
      birth_date: "1990-02-14",
    });
  });

  it("uses the same essential completion rule everywhere", () => {
    expect(profileIsComplete({ first_name: "Camille", birth_date: "1990-02-14" })).toBe(true);
    expect(profileIsComplete({ first_name: "Camille", birth_date: null })).toBe(false);
    expect(profileIsComplete(null)).toBe(false);
  });

  it("allows generic routes and blocks personalized routes contextually", () => {
    const incomplete = { first_name: null, birth_date: null };

    expect(resolveProfileBoundary("/oracle", incomplete)).toEqual({
      state: "allow",
      destination: "/oracle",
    });
    expect(resolveProfileBoundary("/pricing", incomplete)).toEqual({
      state: "allow",
      destination: "/pricing",
    });
    expect(resolveProfileBoundary("/astral", incomplete)).toEqual({
      state: "complete_profile",
      destination: "/astral",
    });
  });

  it("never turns a profile read error into demo personal data", () => {
    expect(resolveProfileBoundary("/numerology", null, new Error("network"))).toEqual({
      state: "read_error",
      destination: "/numerology",
    });
  });
});

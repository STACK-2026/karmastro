import { describe, expect, it } from "vitest";
import { EXTERNAL_LEGACY_ROUTES } from "@/lib/legacy-routes";
import { isProfileGateWhitelisted, resolveProfileGate } from "@/lib/profile-gate";

describe("profile gate cache", () => {
  it("caches complete profiles across protected route changes", () => {
    expect(resolveProfileGate({ first_name: "Sibylle", birth_date: "1990-01-01" })).toEqual({
      incomplete: false,
      cacheAsComplete: true,
      readFailed: false,
    });
  });

  it("never caches an incomplete profile as validated", () => {
    expect(resolveProfileGate({ first_name: "Sibylle", birth_date: null })).toEqual({
      incomplete: true,
      cacheAsComplete: false,
      readFailed: false,
    });
    expect(resolveProfileGate(null)).toEqual({
      incomplete: true,
      cacheAsComplete: false,
      readFailed: false,
    });
  });

  it("fails open without caching when the profile read fails", () => {
    expect(resolveProfileGate(null, new Error("network unavailable"))).toEqual({
      incomplete: false,
      cacheAsComplete: false,
      readFailed: true,
    });
  });

  it("lets public legacy calculators redirect before profile completion", () => {
    for (const path of Object.keys(EXTERNAL_LEGACY_ROUTES)) {
      expect(isProfileGateWhitelisted(path)).toBe(true);
    }
  });
});

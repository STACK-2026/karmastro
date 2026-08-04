import { describe, expect, it } from "vitest";

import {
  ORACLE_ETOILE_LIMIT_CTA_ROLLOUT,
  shouldShowOracleEtoileLimitCta,
} from "@/lib/oracle-commerce-rollout";

describe("Oracle Étoile limit CTA rollout", () => {
  it("is dated, reversible and limited to the authenticated interim wall", () => {
    expect(ORACLE_ETOILE_LIMIT_CTA_ROLLOUT).toEqual({
      id: "oracle_etoile_limit_cta_20260804_v1",
      introducedAt: "2026-08-04",
    });
    expect(shouldShowOracleEtoileLimitCta({
      wallType: "authenticated_interim_limit_v1",
      isAuthenticated: true,
      flagValue: undefined,
    })).toBe(true);
    expect(shouldShowOracleEtoileLimitCta({
      wallType: "authenticated_interim_limit_v1",
      isAuthenticated: true,
      flagValue: "false",
    })).toBe(false);
    expect(shouldShowOracleEtoileLimitCta({
      wallType: "anonymous_signup_wall_v1",
      isAuthenticated: false,
      flagValue: "true",
    })).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import {
  isPromotionPassActive,
  normalizeEffectiveAccess,
  requireSessionForPromotionUser,
  type EffectiveAccessResponse,
} from "@/lib/promotion-pass";

describe("promotion pass client contract", () => {
  const active: EffectiveAccessResponse = {
    access_source: "promo_pass",
    has_premium_access: true,
    offer_state: "active",
    activated_at: "2026-07-28T10:00:00.000Z",
    expires_at: "2026-07-30T10:00:00.000Z",
    server_now: "2026-07-28T11:00:00.000Z",
  };

  it("recognizes an active pass using server time", () => {
    expect(isPromotionPassActive(active)).toBe(true);
    expect(normalizeEffectiveAccess(active)).toMatchObject({
      isPremium: true,
      accessSource: "promo_pass",
      passState: "active",
    });
  });

  it("expires locally without changing the paid subscription state", () => {
    expect(isPromotionPassActive({
      ...active,
      server_now: "2026-07-30T10:00:00.000Z",
    })).toBe(false);
  });

  it("does not manufacture premium access from an invalid payload", () => {
    expect(normalizeEffectiveAccess(null)).toEqual({
      isPremium: false,
      accessSource: "none",
      passState: "unavailable",
      passExpiresAt: null,
      serverNow: null,
    });
  });

  it("refuses a promotion request if auth switched to another user", () => {
    expect(() => requireSessionForPromotionUser({
      access_token: "token-b",
      user: { id: "user-b" },
    }, "user-a")).toThrow("promotion_pass_auth_changed");
    expect(requireSessionForPromotionUser({
      access_token: "token-a",
      user: { id: "user-a" },
    }, "user-a").access_token).toBe("token-a");
  });
});

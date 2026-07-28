import { describe, expect, it } from "vitest";
import {
  hasEffectivePremiumAccess,
  hasPremiumAccess,
  parseIsoDateAsLocal,
  resolveBillingDestination,
} from "../lib/subscription";

describe("hasPremiumAccess", () => {
  const now = new Date("2026-07-16T12:00:00Z");

  it("unlocks an active Star subscription", () => {
    expect(hasPremiumAccess("etoile", "active", "2026-08-16T12:00:00Z", now)).toBe(true);
  });

  it("does not unlock unpaid, canceled or expired plans", () => {
    expect(hasPremiumAccess("etoile", "past_due", "2026-08-16T12:00:00Z", now)).toBe(false);
    expect(hasPremiumAccess("etoile", "active", "2026-06-16T12:00:00Z", now)).toBe(false);
    expect(hasPremiumAccess("eveil", "active", null, now)).toBe(false);
  });
});

describe("hasEffectivePremiumAccess", () => {
  const now = new Date("2026-07-16T12:00:00Z");

  it("recognizes an active Apple entitlement independently from Stripe", () => {
    expect(hasEffectivePremiumAccess({
      tier: "eveil",
      status: null,
      periodEnd: null,
      appleStatus: "active",
      applePeriodEnd: "2026-08-16T12:00:00Z",
    }, now)).toBe(true);
  });
});

describe("resolveBillingDestination", () => {
  it("routes Apple subscriptions to Apple and never to Stripe", () => {
    expect(resolveBillingDestination("apple", true)).toBe("apple");
    expect(resolveBillingDestination("stripe", true)).toBe("stripe");
    expect(resolveBillingDestination("apple", false)).toBe("pricing");
  });
});

describe("parseIsoDateAsLocal", () => {
  it("keeps the calendar birthday independent of the browser timezone", () => {
    const date = parseIsoDateAsLocal("1990-07-16");
    expect(date && [date.getFullYear(), date.getMonth() + 1, date.getDate()]).toEqual([1990, 7, 16]);
  });

  it("rejects impossible dates", () => {
    expect(parseIsoDateAsLocal("1990-02-31")).toBeNull();
  });
});

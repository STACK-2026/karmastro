import { describe, expect, it } from "vitest";
import {
  isWelcomeAccountEligible,
  welcomeClaimDecision,
} from "../../supabase/functions/_shared/welcome-policy";

const NOW = Date.parse("2026-07-31T14:00:00.000Z");

describe("welcome delivery policy", () => {
  it("allows only recently created accounts", () => {
    expect(isWelcomeAccountEligible("2026-07-31T13:59:00.000Z", NOW)).toBe(true);
    expect(isWelcomeAccountEligible("2026-07-30T14:00:01.000Z", NOW)).toBe(true);
    expect(isWelcomeAccountEligible("2026-07-30T13:59:59.000Z", NOW)).toBe(false);
    expect(isWelcomeAccountEligible("invalid", NOW)).toBe(false);
    expect(isWelcomeAccountEligible("2026-08-01T00:00:00.000Z", NOW)).toBe(false);
  });

  it("claims once, skips completed/fresh work and retries failed or stale work", () => {
    expect(welcomeClaimDecision(null, NOW)).toBe("claim");
    expect(welcomeClaimDecision({ status: "sent", claimedAt: null }, NOW)).toBe("already_sent");
    expect(welcomeClaimDecision({ status: "pending", claimedAt: "2026-07-31T13:55:00.000Z" }, NOW)).toBe("in_progress");
    expect(welcomeClaimDecision({ status: "pending", claimedAt: "2026-07-31T13:49:59.000Z" }, NOW)).toBe("retry");
    expect(welcomeClaimDecision({ status: "failed", claimedAt: "2026-07-31T13:59:00.000Z" }, NOW)).toBe("retry");
  });
});

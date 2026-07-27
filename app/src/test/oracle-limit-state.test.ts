import { describe, expect, it } from "vitest";
import {
  assignPendingTurnId,
  formatOracleAvailability,
  normalizeOracleLimitResponse,
} from "@/lib/oracle-limit-state";

describe("Oracle limit state", () => {
  it("accepts only the two server-owned pending-turn surfaces", () => {
    expect(normalizeOracleLimitResponse({
      surface: "anonymous_signup_wall_v1",
      next_available_at: "2026-07-28T00:00:00.000Z",
      pending_turn: true,
      pending_turn_id: "018f2b65-7b3f-7c1a-8f01-123456789abc",
    })?.surface).toBe("anonymous_signup_wall_v1");

    expect(normalizeOracleLimitResponse({
      surface: "authenticated_interim_limit_v1",
      next_available_at: "2026-07-28T00:00:00.000Z",
      pending_turn: true,
      pending_turn_id: "018f2b65-7b3f-7c1a-8f01-123456789abc",
    })?.surface).toBe("authenticated_interim_limit_v1");

    expect(normalizeOracleLimitResponse({
      surface: "show-pricing-now",
      next_available_at: "2026-07-28T00:00:00.000Z",
      pending_turn: true,
    })).toBeNull();
  });

  it("formats the server timestamp without recalculating the quota boundary", () => {
    const now = new Date("2026-07-27T09:00:00.000Z");
    expect(formatOracleAvailability(
      "2026-07-27T18:00:00.000Z",
      "fr-FR",
      now,
      "Europe/Paris",
    )).toEqual({ relation: "today", time: "20:00" });

    expect(formatOracleAvailability(
      "2026-07-28T00:00:00.000Z",
      "fr-FR",
      now,
      "Europe/Paris",
    )).toEqual({ relation: "tomorrow", time: "02:00" });
  });

  it("keeps a reused pending-turn id on only the latest blocked message", () => {
    const messages = [
      { role: "user", content: "ancienne question", pendingTurnId: "turn-1" },
      { role: "user", content: "nouvelle question" },
    ];

    expect(assignPendingTurnId(messages, "turn-1", 1)).toEqual([
      { role: "user", content: "ancienne question" },
      { role: "user", content: "nouvelle question", pendingTurnId: "turn-1" },
    ]);
  });
});

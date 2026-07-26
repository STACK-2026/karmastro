import { describe, expect, it } from "vitest";
import {
  oracleSignupPath,
  shouldShowOracleSignupHandoff,
} from "@/lib/oracle-signup-handoff";

describe("Oracle anonymous signup handoff", () => {
  it("keeps the anonymous session while sending signup to onboarding", () => {
    expect(oracleSignupPath("anon-session-123"))
      .toBe("/auth?next=%2Fonboarding&oracle_session=anon-session-123");
  });

  it("shows signup after the latest completed anonymous Oracle reply", () => {
    expect(shouldShowOracleSignupHandoff({
      isAuthenticated: false,
      role: "assistant",
      isLatest: true,
      isLoading: false,
    })).toBe(true);

    expect(shouldShowOracleSignupHandoff({
      isAuthenticated: true,
      role: "assistant",
      isLatest: true,
      isLoading: false,
    })).toBe(false);

    expect(shouldShowOracleSignupHandoff({
      isAuthenticated: false,
      role: "assistant",
      isLatest: true,
      isLoading: true,
    })).toBe(false);

    expect(shouldShowOracleSignupHandoff({
      isAuthenticated: false,
      role: "assistant",
      isLatest: false,
      isLoading: false,
    })).toBe(false);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearOnboardingDraft,
  purgeExpiredOnboardingDrafts,
  readOnboardingDraft,
  writeOnboardingDraft,
} from "@/lib/onboarding-draft";

const token = "550e8400-e29b-41d4-a716-446655440000";

describe("onboarding draft privacy", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("allows an anonymous draft to be resumed and then owned by the authenticated user", () => {
    writeOnboardingDraft(token, null, { firstName: "Camille" });
    expect(readOnboardingDraft<{ firstName: string }>(token, "user-a"))
      .toEqual({ firstName: "Camille" });

    writeOnboardingDraft(token, "user-a", { firstName: "Camille" });
    expect(readOnboardingDraft(token, null)).toBeNull();
    writeOnboardingDraft(token, null, { firstName: "" });
    expect(readOnboardingDraft(token, "user-a")).toEqual({ firstName: "Camille" });
    expect(readOnboardingDraft(token, "user-b")).toBeNull();
    expect(readOnboardingDraft(token, "user-a")).toEqual({ firstName: "Camille" });
  });

  it("expires drafts after 24 hours and supports explicit cleanup", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    writeOnboardingDraft(token, null, { birthDate: "1990-01-01" });
    expect(readOnboardingDraft(token, null, 1_000 + 24 * 60 * 60 * 1000 + 1)).toBeNull();

    writeOnboardingDraft(token, null, { birthDate: "1990-01-01" });
    clearOnboardingDraft(token);
    expect(readOnboardingDraft(token, null)).toBeNull();
  });

  it("purges abandoned expired drafts when the app boots", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_000);
    writeOnboardingDraft(token, null, { firstName: "Camille" });
    purgeExpiredOnboardingDrafts(1_000 + 24 * 60 * 60 * 1000 + 1);
    expect(localStorage.length).toBe(0);
  });
});

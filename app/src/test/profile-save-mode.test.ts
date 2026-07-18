import { describe, expect, it } from "vitest";
import { profileUpdatedProperties, resolveProfileSaveMode } from "@/lib/profile-save-mode";

describe("profile save mode", () => {
  it("treats an edit request for a complete profile as a profile update", () => {
    expect(resolveProfileSaveMode({ editRequested: true, profileComplete: true })).toEqual({
      mode: "edit",
      eventName: "profile_updated",
      destination: "/profile",
      allowDailyOptIn: false,
    });
  });

  it("does not let a forged edit query reclassify an incomplete profile", () => {
    expect(resolveProfileSaveMode({ editRequested: true, profileComplete: false })).toEqual({
      mode: "onboarding",
      eventName: "onboarding_completed",
      destination: null,
      allowDailyOptIn: true,
    });
  });

  it("keeps the standard onboarding outcome when edit mode is not requested", () => {
    expect(resolveProfileSaveMode({ editRequested: false, profileComplete: true })).toEqual({
      mode: "onboarding",
      eventName: "onboarding_completed",
      destination: null,
      allowDailyOptIn: true,
    });
  });

  it("allows only aggregate profile-completeness data in the update event", () => {
    const properties = profileUpdatedProperties({
      hasBirthTime: true,
      hasGeolocation: false,
      interestsCount: 2,
      level: "débutant",
    });

    expect(properties).toEqual({
      source: "app",
      has_birth_time: true,
      has_geolocation: false,
      interests_count: 2,
      level: "débutant",
    });
    expect(Object.keys(properties)).not.toEqual(expect.arrayContaining([
      "first_name", "last_name", "birth_date", "birth_time", "birth_place", "email",
    ]));
  });
});

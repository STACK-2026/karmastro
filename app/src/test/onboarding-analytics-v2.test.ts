import { describe, expect, it } from "vitest";
import {
  ONBOARDING_JOURNEY_VERSION,
  onboardingEvent,
} from "@/lib/onboarding-analytics";

describe("progressive onboarding analytics", () => {
  it("emits only categorical, non-profile properties", () => {
    const event = onboardingEvent("onboarding_essential_completed_v1", {
      flow: "acquisition",
      reason: "direct",
      destination: "/dashboard",
      completionLevel: "essential",
      hasBirthTime: false,
      hasBirthPlace: false,
    });

    expect(event).toEqual({
      name: "onboarding_essential_completed_v1",
      properties: {
        journey_version: ONBOARDING_JOURNEY_VERSION,
        flow: "acquisition",
        reason: "direct",
        destination: "/dashboard",
        completion_level: "essential",
        has_birth_time: false,
        has_birth_place: false,
      },
    });
    expect(Object.keys(event.properties)).not.toEqual(expect.arrayContaining([
      "first_name",
      "birth_date",
      "birth_place",
      "email",
      "user_id",
      "pending_turn_id",
    ]));
  });
});

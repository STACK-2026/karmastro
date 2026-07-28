import type {
  OnboardingDestination,
  OnboardingReason,
} from "@/lib/onboarding-flow";

export const ONBOARDING_JOURNEY_VERSION = "progressive_onboarding_v1";

export type OnboardingEventName =
  | "onboarding_viewed_v2"
  | "onboarding_essential_started_v1"
  | "onboarding_essential_completed_v1"
  | "onboarding_advanced_opened_v1"
  | "onboarding_skipped_v1"
  | "onboarding_destination_reached_v1";

type OnboardingEventInput = {
  flow: "acquisition" | "edit";
  reason: OnboardingReason;
  destination: OnboardingDestination;
  completionLevel: "none" | "essential" | "advanced";
  hasBirthTime: boolean;
  hasBirthPlace: boolean;
};

export function onboardingEvent(
  name: OnboardingEventName,
  input: OnboardingEventInput,
) {
  return {
    name,
    properties: {
      journey_version: ONBOARDING_JOURNEY_VERSION,
      flow: input.flow,
      reason: input.reason,
      destination: input.destination,
      completion_level: input.completionLevel,
      has_birth_time: input.hasBirthTime,
      has_birth_place: input.hasBirthPlace,
    },
  };
}

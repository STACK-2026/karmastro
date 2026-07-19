export type ProfileSaveMode = "onboarding" | "edit" | "redirect";

type ProfileSaveModeInput = {
  editRequested: boolean;
  profileComplete: boolean;
};

type ProfileSaveModeResult =
  | {
      mode: "onboarding";
      eventName: "onboarding_completed";
      destination: null;
      allowDailyOptIn: true;
      replaceHistory: true;
    }
  | {
      mode: "edit";
      eventName: "profile_updated";
      destination: "/profile";
      allowDailyOptIn: false;
      replaceHistory: true;
    }
  | {
      mode: "redirect";
      eventName: null;
      destination: "/dashboard";
      allowDailyOptIn: false;
      replaceHistory: true;
    };

type ProfileUpdatedPropertiesInput = {
  hasBirthTime: boolean;
  hasGeolocation: boolean;
  interestsCount: number;
  level: string;
};

/**
 * A URL query is only a UI request, never an authority signal. Edit mode is
 * enabled only after the authenticated user's existing profile is complete.
 */
export function resolveProfileSaveMode({
  editRequested,
  profileComplete,
}: ProfileSaveModeInput): ProfileSaveModeResult {
  const isEdit = editRequested && profileComplete;

  if (isEdit) {
    return {
      mode: "edit",
      eventName: "profile_updated",
      destination: "/profile",
      allowDailyOptIn: false,
      replaceHistory: true,
    };
  }

  if (profileComplete) {
    return {
      mode: "redirect",
      eventName: null,
      destination: "/dashboard",
      allowDailyOptIn: false,
      replaceHistory: true,
    };
  }

  return {
    mode: "onboarding",
    eventName: "onboarding_completed",
    destination: null,
    allowDailyOptIn: true,
    replaceHistory: true,
  };
}

/**
 * Keep edit analytics useful without sending profile values or identifiers.
 */
export function profileUpdatedProperties({
  hasBirthTime,
  hasGeolocation,
  interestsCount,
  level,
}: ProfileUpdatedPropertiesInput) {
  return {
    source: "app",
    has_birth_time: hasBirthTime,
    has_geolocation: hasGeolocation,
    interests_count: interestsCount,
    level,
  };
}

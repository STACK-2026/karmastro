export const ONBOARDING_DESTINATIONS = [
  "/dashboard",
  "/oracle",
  "/pricing",
  "/profile",
  "/astral",
  "/numerology",
  "/calendar",
  "/compatibility",
] as const;

export type OnboardingDestination = typeof ONBOARDING_DESTINATIONS[number];

export const ONBOARDING_REASONS = [
  "direct",
  "profile_edit",
  "oracle_pending",
  "personalized_checkout",
  "personalized_surface",
] as const;

export type OnboardingReason = typeof ONBOARDING_REASONS[number];

type MinimalProfile = {
  first_name?: string | null;
  birth_date?: string | null;
};

export type OnboardingFlow = {
  destination: OnboardingDestination;
  skipDestination: OnboardingDestination;
  reason: OnboardingReason;
  canSkip: true;
};

const DESTINATIONS = new Set<string>(ONBOARDING_DESTINATIONS);
const REASONS = new Set<string>(ONBOARDING_REASONS);
const PROFILE_DEPENDENT_DESTINATIONS = new Set<OnboardingDestination>([
  "/profile",
  "/astral",
  "/numerology",
  "/calendar",
  "/compatibility",
]);

export function isOnboardingDestination(value: string | null | undefined): value is OnboardingDestination {
  return Boolean(value && DESTINATIONS.has(value));
}

export function isOnboardingReason(value: string | null | undefined): value is OnboardingReason {
  return Boolean(value && REASONS.has(value));
}

export function profileIsComplete(profile: MinimalProfile | null | undefined): boolean {
  return Boolean(profile?.first_name?.trim() && profile?.birth_date);
}

export function resolveOnboardingFlow(
  search: URLSearchParams,
  stored?: Partial<Pick<OnboardingFlow, "destination" | "reason">> | null,
): OnboardingFlow {
  const requestedDestination = search.get("next");
  const destination = isOnboardingDestination(requestedDestination)
    ? requestedDestination
    : isOnboardingDestination(stored?.destination)
      ? stored.destination
      : "/dashboard";
  const requestedReason = search.get("reason");
  const reason = isOnboardingReason(requestedReason)
    ? requestedReason
    : isOnboardingReason(stored?.reason)
      ? stored.reason
      : "direct";

  return {
    destination,
    skipDestination: PROFILE_DEPENDENT_DESTINATIONS.has(destination) ? "/oracle" : destination,
    reason,
    canSkip: true,
  };
}

export function buildEssentialProfilePatch(
  userId: string,
  firstName: string,
  birthDate: string,
) {
  return {
    user_id: userId,
    first_name: firstName.trim(),
    birth_date: birthDate,
  };
}

export type ProfileBoundaryDecision =
  | { state: "allow"; destination: string }
  | { state: "complete_profile"; destination: string }
  | { state: "read_error"; destination: string };

export function resolveProfileBoundary(
  pathname: string,
  profile: MinimalProfile | null | undefined,
  error?: unknown,
): ProfileBoundaryDecision {
  if (error) return { state: "read_error", destination: pathname };
  if (!PROFILE_DEPENDENT_DESTINATIONS.has(pathname as OnboardingDestination)) {
    return { state: "allow", destination: pathname };
  }
  return profileIsComplete(profile)
    ? { state: "allow", destination: pathname }
    : { state: "complete_profile", destination: pathname };
}

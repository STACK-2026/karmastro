export type GuidanceSubscriber = {
  email: string | null;
  birth_date: string | null;
  full_name: string | null;
  locale: string | null;
};

export type GuidanceProfile = {
  first_name: string | null;
  birth_date: string | null;
  language: string | null;
};

type GuidancePatch = {
  birth_date?: string;
  full_name?: string;
  locale?: string;
};

export function hydrateGuidanceSubscriber(
  current: GuidanceSubscriber,
  profile: GuidanceProfile,
): {
  subscriber: GuidanceSubscriber;
  patch: GuidancePatch;
  recovered: boolean;
} {
  const patch: GuidancePatch = {};
  if (!current.birth_date && profile.birth_date) patch.birth_date = profile.birth_date;
  if (!current.full_name && profile.first_name) patch.full_name = profile.first_name;
  if (!current.locale && profile.language) patch.locale = profile.language;

  return {
    subscriber: { ...current, ...patch },
    patch,
    recovered: Object.keys(patch).length > 0,
  };
}

export function shouldPersistGuidanceChanges(dry: boolean): boolean {
  return !dry;
}

export type StripeSubscriptionClassification =
  | "eligible"
  | "inactive"
  | "verification_failed";

export function classifyStripeSubscription(
  status: string | null,
): StripeSubscriptionClassification {
  if (status === "active" || status === "trialing") return "eligible";
  if (status) return "inactive";
  return "verification_failed";
}

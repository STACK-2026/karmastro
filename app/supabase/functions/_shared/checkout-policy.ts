export type CheckoutDecisionReason =
  | "unknown_product"
  | "profile_required"
  | "subscription_exists";

export type CheckoutDecision = {
  allowed: boolean;
  reason: CheckoutDecisionReason | null;
};

type CheckoutProfile = {
  exists: boolean;
  firstName: string | null;
  birthDate: string | null;
  tier: string | null;
  status: string | null;
};

const KNOWN_PRODUCTS = new Set([
  "etoile_monthly",
  "etoile_annual",
  "ame_soeur",
  "pack_lune",
  "pack_soleil",
  "pack_cosmos",
]);

const SUBSCRIPTIONS = new Set(["etoile_monthly", "etoile_annual"]);
const PROFILE_REQUIRED = new Set(["etoile_monthly", "etoile_annual", "ame_soeur"]);
const EXISTING_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
  "unpaid",
  "incomplete",
]);

export function decideCheckout(priceKey: string, profile: CheckoutProfile): CheckoutDecision {
  if (!KNOWN_PRODUCTS.has(priceKey)) {
    return { allowed: false, reason: "unknown_product" };
  }

  if (
    SUBSCRIPTIONS.has(priceKey) &&
    profile.tier === "etoile" &&
    EXISTING_SUBSCRIPTION_STATUSES.has(profile.status || "")
  ) {
    return { allowed: false, reason: "subscription_exists" };
  }

  if (
    PROFILE_REQUIRED.has(priceKey) &&
    (!profile.exists || !profile.firstName?.trim() || !profile.birthDate)
  ) {
    return { allowed: false, reason: "profile_required" };
  }

  return { allowed: true, reason: null };
}

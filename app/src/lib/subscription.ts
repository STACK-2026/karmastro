export function hasPremiumAccess(
  tier: string | null | undefined,
  status: string | null | undefined,
  periodEnd: string | null | undefined,
  now = new Date(),
): boolean {
  if (tier !== "etoile" && tier !== "cosmos") return false;
  if (status !== "active") return false;
  if (!periodEnd) return true;
  const expiry = new Date(periodEnd);
  return Number.isFinite(expiry.getTime()) && expiry.getTime() > now.getTime();
}

export interface EffectiveSubscriptionState {
  tier: string | null | undefined;
  status: string | null | undefined;
  periodEnd: string | null | undefined;
  appleStatus: string | null | undefined;
  applePeriodEnd: string | null | undefined;
}

export function hasEffectivePremiumAccess(
  state: EffectiveSubscriptionState,
  now = new Date(),
): boolean {
  return hasPremiumAccess(state.tier, state.status, state.periodEnd, now)
    || hasPremiumAccess("etoile", state.appleStatus, state.applePeriodEnd, now);
}

export function resolveBillingDestination(
  provider: "apple" | "stripe" | null,
  hasBillingRelationship: boolean,
): "apple" | "stripe" | "pricing" {
  if (!hasBillingRelationship) return "pricing";
  return provider === "apple" ? "apple" : "stripe";
}

export function parseIsoDateAsLocal(value: string | null | undefined): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year
    || parsed.getMonth() !== month - 1
    || parsed.getDate() !== day
  ) return null;
  return parsed;
}

export const PROMOTION_PASS_OFFER_CODE = "etoile_pass_48h_v1";

export type EffectiveAccessResponse = {
  access_source: "subscription" | "promo_pass" | "none";
  has_premium_access: boolean;
  offer_state: "unavailable" | "offered" | "active" | "expired" | "revoked" | "disabled";
  activated_at: string | null;
  expires_at: string | null;
  server_now: string;
};

export type EffectiveAccess = {
  isPremium: boolean;
  accessSource: "subscription" | "promo_pass" | "none";
  passState: EffectiveAccessResponse["offer_state"];
  passExpiresAt: string | null;
  serverNow: string | null;
};

export const NO_EFFECTIVE_ACCESS: EffectiveAccess = {
  isPremium: false,
  accessSource: "none",
  passState: "unavailable",
  passExpiresAt: null,
  serverNow: null,
};

export function requireSessionForPromotionUser(
  session: { access_token?: string; user?: { id?: string } } | null,
  expectedUserId: string,
) {
  if (!session?.access_token || session.user?.id !== expectedUserId) {
    throw new Error("promotion_pass_auth_changed");
  }
  return session;
}

const ACCESS_SOURCES = new Set(["subscription", "promo_pass", "none"]);
const OFFER_STATES = new Set(["unavailable", "offered", "active", "expired", "revoked", "disabled"]);

function validDate(value: unknown): value is string {
  if (typeof value !== "string") return false;
  return Number.isFinite(new Date(value).getTime());
}

export function isPromotionPassActive(value: EffectiveAccessResponse): boolean {
  if (
    value.access_source !== "promo_pass"
    || !value.has_premium_access
    || value.offer_state !== "active"
    || !validDate(value.expires_at)
    || !validDate(value.server_now)
  ) return false;
  return new Date(value.expires_at).getTime() > new Date(value.server_now).getTime();
}

export function normalizeEffectiveAccess(value: unknown): EffectiveAccess {
  if (!value || typeof value !== "object" || Array.isArray(value)) return NO_EFFECTIVE_ACCESS;
  const input = value as Partial<EffectiveAccessResponse>;
  if (!ACCESS_SOURCES.has(String(input.access_source)) || !OFFER_STATES.has(String(input.offer_state))) {
    return NO_EFFECTIVE_ACCESS;
  }

  const response = input as EffectiveAccessResponse;
  const passActive = isPromotionPassActive(response);
  const subscriptionActive = response.access_source === "subscription" && response.has_premium_access === true;
  return {
    isPremium: passActive || subscriptionActive,
    accessSource: passActive ? "promo_pass" : subscriptionActive ? "subscription" : "none",
    passState: passActive ? "active" : response.offer_state,
    passExpiresAt: validDate(response.expires_at) ? response.expires_at : null,
    serverNow: validDate(response.server_now) ? response.server_now : null,
  };
}

export function formatPromotionPassRemaining(expiresAt: string | null, now = new Date()): string {
  if (!expiresAt) return "";
  const remainingMs = new Date(expiresAt).getTime() - now.getTime();
  if (!Number.isFinite(remainingMs) || remainingMs <= 0) return "";
  const totalMinutes = Math.ceil(remainingMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours} h ${minutes} min` : `${minutes} min`;
}

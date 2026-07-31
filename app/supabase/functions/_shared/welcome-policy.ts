export const WELCOME_ACCOUNT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const WELCOME_PENDING_STALE_MS = 10 * 60 * 1000;

export type WelcomeDeliveryStatus = "pending" | "sent" | "failed";
export type WelcomeClaimDecision = "claim" | "retry" | "already_sent" | "in_progress";

type ExistingWelcomeClaim = {
  status: WelcomeDeliveryStatus;
  claimedAt: string | null;
};

export function isWelcomeAccountEligible(
  createdAt: string | null | undefined,
  nowMs = Date.now(),
): boolean {
  const createdAtMs = Date.parse(String(createdAt || ""));
  if (!Number.isFinite(createdAtMs)) return false;
  const ageMs = nowMs - createdAtMs;
  return ageMs >= 0 && ageMs <= WELCOME_ACCOUNT_MAX_AGE_MS;
}

export function welcomeClaimDecision(
  existing: ExistingWelcomeClaim | null,
  nowMs = Date.now(),
): WelcomeClaimDecision {
  if (!existing) return "claim";
  if (existing.status === "sent") return "already_sent";
  if (existing.status === "failed") return "retry";

  const claimedAtMs = Date.parse(String(existing.claimedAt || ""));
  if (!Number.isFinite(claimedAtMs)) return "retry";
  return nowMs - claimedAtMs > WELCOME_PENDING_STALE_MS
    ? "retry"
    : "in_progress";
}

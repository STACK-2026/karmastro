import {
  normalizeWelcomeLocale,
  profileLanguageForWelcomeLocale,
} from "./email-templates.ts";
import {
  isWelcomeAccountEligible,
  welcomeClaimDecision,
  type WelcomeDeliveryStatus,
} from "./welcome-policy.ts";

export type WelcomeUser = {
  id: string;
  email: string;
  createdAt: string;
  metadata: Record<string, unknown>;
};

export type WelcomeProfile = {
  firstName: string | null;
  language: string | null;
};

export type WelcomeDelivery = {
  locale: string;
  firstName: string | null;
  status: WelcomeDeliveryStatus;
  claimedAt: string | null;
  attempts: number;
};

type CreateWelcomeClaim = {
  userId: string;
  locale: string;
  firstName: string | null;
  claimedAt: string;
};

type SendWelcomeInput = {
  to: string;
  firstName: string | null;
  locale: string;
  idempotencyKey: string;
};

export type WelcomeDeliveryStore = {
  getProfile: (userId: string) => Promise<WelcomeProfile | null>;
  getDelivery: (userId: string) => Promise<WelcomeDelivery | null>;
  createClaim: (claim: CreateWelcomeClaim) => Promise<"created" | "conflict" | "error">;
  reclaimDelivery: (
    userId: string,
    current: WelcomeDelivery,
    claimedAt: string,
  ) => Promise<boolean>;
  updateProfileLocale: (userId: string, locale: string) => Promise<boolean>;
  sendWelcome: (input: SendWelcomeInput) => Promise<void>;
  markSent: (userId: string, claimedAt: string, sentAt: string) => Promise<boolean>;
  markFailed: (userId: string, claimedAt: string, error: string) => Promise<void>;
};

type DeliveryResult =
  | { status: "sent"; locale: string; httpStatus: 200 }
  | { status: "already_sent" | "in_progress" | "ineligible"; httpStatus: 200 }
  | { error: "delivery_claim_failed" | "profile_locale_update_failed"; httpStatus: 503 }
  | { error: "welcome_delivery_failed"; httpStatus: 502 };

function firstNameFromMetadata(metadata: Record<string, unknown>): string | null {
  const candidates = [metadata.first_name, metadata.given_name, metadata.full_name, metadata.name];
  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;
    const firstName = candidate.trim().split(/\s+/)[0]?.slice(0, 80);
    if (firstName) return firstName;
  }
  return null;
}

export async function deliverWelcome(input: {
  user: WelcomeUser;
  requestedLocale: string | null;
  store: WelcomeDeliveryStore;
  nowMs?: number;
}): Promise<DeliveryResult> {
  const { user, requestedLocale, store } = input;
  const nowMs = input.nowMs ?? Date.now();
  if (!isWelcomeAccountEligible(user.createdAt, nowMs)) {
    return { status: "ineligible", httpStatus: 200 };
  }

  const profile = await store.getProfile(user.id);
  const metadataLocale = typeof user.metadata.locale === "string"
    ? user.metadata.locale
    : null;
  let locale = normalizeWelcomeLocale(
    requestedLocale || profile?.language || metadataLocale || "fr",
  );
  let firstName = profile?.firstName || firstNameFromMetadata(user.metadata);
  const claimedAt = new Date(nowMs).toISOString();

  let current = await store.getDelivery(user.id);
  let decision = welcomeClaimDecision(current, nowMs);
  if (decision === "already_sent" || decision === "in_progress") {
    return { status: decision, httpStatus: 200 };
  }

  if (decision === "claim") {
    const claimResult = await store.createClaim({
      userId: user.id,
      locale,
      firstName,
      claimedAt,
    });
    if (claimResult === "error") {
      return { error: "delivery_claim_failed", httpStatus: 503 };
    }
    if (claimResult === "conflict") {
      current = await store.getDelivery(user.id);
      decision = welcomeClaimDecision(current, nowMs);
      if (decision !== "retry") {
        return {
          status: decision === "claim" ? "in_progress" : decision,
          httpStatus: 200,
        };
      }
    }
  }

  if (decision === "retry") {
    if (!current) return { status: "in_progress", httpStatus: 200 };
    locale = normalizeWelcomeLocale(current.locale);
    firstName = current.firstName || firstName;
    const reclaimed = await store.reclaimDelivery(user.id, current, claimedAt);
    if (!reclaimed) return { status: "in_progress", httpStatus: 200 };
  }

  const localeUpdated = await store.updateProfileLocale(
    user.id,
    profileLanguageForWelcomeLocale(locale),
  );
  if (!localeUpdated) {
    await store.markFailed(user.id, claimedAt, "profile_locale_update_failed");
    return { error: "profile_locale_update_failed", httpStatus: 503 };
  }

  try {
    await store.sendWelcome({
      to: user.email,
      firstName,
      locale,
      idempotencyKey: `welcome-user/${user.id}`,
    });
    await store.markSent(user.id, claimedAt, new Date(nowMs).toISOString());
    return { status: "sent", locale, httpStatus: 200 };
  } catch (error) {
    const message = error instanceof Error ? error.message : "send_email_failed";
    await store.markFailed(user.id, claimedAt, message.slice(0, 200));
    return { error: "welcome_delivery_failed", httpStatus: 502 };
  }
}

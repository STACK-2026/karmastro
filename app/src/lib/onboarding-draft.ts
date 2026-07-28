const DRAFT_PREFIX = "km_onboarding_draft:";
const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const TOKEN_PATTERN = /^[a-f0-9-]{20,64}$/i;

export type StoredOnboardingDraft<T> = {
  createdAt: number;
  ownerUserId: string | null;
  values: T;
};

export function createOnboardingResumeToken(): string {
  return crypto.randomUUID();
}

export function sanitizeOnboardingResumeToken(value: string | null | undefined): string | null {
  return value && TOKEN_PATTERN.test(value) ? value : null;
}

function storageKey(token: string): string {
  return `${DRAFT_PREFIX}${token}`;
}

export function readOnboardingDraft<T>(
  token: string,
  userId: string | null,
  now = Date.now(),
): T | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey(token)) || "null") as StoredOnboardingDraft<T> | null;
    if (!parsed || typeof parsed.createdAt !== "number" || now - parsed.createdAt > DRAFT_MAX_AGE_MS) {
      localStorage.removeItem(storageKey(token));
      return null;
    }
    if (parsed.ownerUserId !== null && userId === null) return null;
    if (parsed.ownerUserId !== null && parsed.ownerUserId !== userId) {
      return null;
    }
    return parsed.values;
  } catch {
    return null;
  }
}

export function writeOnboardingDraft<T>(token: string, userId: string | null, values: T): void {
  try {
    const existing = JSON.parse(
      localStorage.getItem(storageKey(token)) || "null",
    ) as StoredOnboardingDraft<unknown> | null;
    if (
      existing
      && typeof existing.createdAt === "number"
      && Date.now() - existing.createdAt <= DRAFT_MAX_AGE_MS
      && existing.ownerUserId !== null
      && existing.ownerUserId !== userId
    ) {
      return;
    }
    localStorage.setItem(storageKey(token), JSON.stringify({
      createdAt: Date.now(),
      ownerUserId: userId,
      values,
    } satisfies StoredOnboardingDraft<T>));
  } catch {
    // Persistence is best effort in privacy mode.
  }
}

export function clearOnboardingDraft(token: string): void {
  try {
    localStorage.removeItem(storageKey(token));
  } catch {
    // Cleanup is best effort.
  }
}

export function purgeExpiredOnboardingDrafts(now = Date.now()): void {
  try {
    for (let index = localStorage.length - 1; index >= 0; index -= 1) {
      const key = localStorage.key(index);
      if (!key?.startsWith(DRAFT_PREFIX)) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || "null") as { createdAt?: unknown } | null;
        if (
          !parsed
          || typeof parsed.createdAt !== "number"
          || now - parsed.createdAt > DRAFT_MAX_AGE_MS
        ) {
          localStorage.removeItem(key);
        }
      } catch {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage cleanup is best effort in privacy mode.
  }
}

const SEND_WELCOME_URL =
  "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/send-welcome";

function canonicalLocaleCandidate(value: string | null | undefined): string | null {
  const candidate = String(value || "").trim().replace(/_/g, "-").slice(0, 64);
  if (!candidate) return null;
  try {
    return Intl.getCanonicalLocales(candidate)[0] ?? null;
  } catch {
    return null;
  }
}

export function resolveWelcomeLocalePreference(input: {
  query?: string | null;
  cookie?: string | null;
  persisted?: string | null;
  navigatorLanguages?: readonly string[];
}): string {
  const candidates = [
    input.query,
    input.cookie,
    input.persisted,
    ...(input.navigatorLanguages || []),
  ];
  for (const value of candidates) {
    const locale = canonicalLocaleCandidate(value);
    if (locale) return locale;
  }
  return "fr-FR";
}

/**
 * Preserve the user's regional preference for email even when the current web
 * UI does not yet expose that locale. The Edge Function remains authoritative
 * for mapping this value to the supported canonical catalog.
 */
export function detectWelcomeLocale(): string {
  if (typeof window === "undefined") return "fr-FR";

  let query: string | null = null;
  try {
    query = new URLSearchParams(window.location.search).get("lang");
  } catch { /* Location access can be unavailable in restricted contexts. */ }

  let cookie: string | null = null;
  try {
    const match = document.cookie.match(/(?:^|;\s*)karmastro_lang=([^;]+)/);
    cookie = match?.[1] ?? null;
  } catch { /* Cookie access can be unavailable in privacy mode. */ }

  let persisted: string | null = null;
  try {
    persisted = localStorage.getItem("km_lang");
  } catch { /* Storage access can be unavailable in privacy mode. */ }

  let navigatorLanguages: readonly string[] = [];
  try {
    navigatorLanguages = navigator.languages?.length
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : [];
  } catch { /* Navigator access can be unavailable during browser teardown. */ }

  return resolveWelcomeLocalePreference({
    query,
    cookie,
    persisted,
    navigatorLanguages,
  });
}

export async function requestWelcomeEmail(
  accessToken: string,
  locale: string,
  fetchImpl: typeof fetch = fetch,
): Promise<unknown> {
  const response = await fetchImpl(SEND_WELCOME_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ locale }),
  });

  if (!response.ok) {
    throw new Error(`welcome_email_request_failed:${response.status}`);
  }
  return response.json();
}

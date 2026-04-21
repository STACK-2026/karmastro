// Tracker analytics universel pour l'app React Karmastro
// Log : page_views (avec time_on_page) + analytics_events (custom)

import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "km_session_id";
const UTM_KEY = "km_utm";
const BACKFILL_KEY = "km_user_backfilled";

// ───────────────────────────────────────────────────────────────
// Session helpers
// ───────────────────────────────────────────────────────────────

export function getSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

function captureUtmFromUrl(): void {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  const utm = {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
    utm_term: p.get("utm_term"),
    utm_content: p.get("utm_content"),
  };
  // Persist only if at least one UTM present (first-touch attribution)
  if (Object.values(utm).some((v) => v)) {
    if (!sessionStorage.getItem(UTM_KEY)) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
  }
}

function getStoredUtm() {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(UTM_KEY) || "{}");
  } catch {
    return {};
  }
}

// ───────────────────────────────────────────────────────────────
// Track page view (with time-on-page from previous view)
// ───────────────────────────────────────────────────────────────

type PageViewState = {
  timerStart: number;
  lastPath: string;
  lastInsertId: string | null;
};

const state: PageViewState = {
  timerStart: 0,
  lastPath: "",
  lastInsertId: null,
};

function newUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return (crypto as any).randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export async function trackPageView(path: string, title?: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (!path || path === state.lastPath) return;

  // Flush time-on-page for previous view
  if (state.lastInsertId && state.timerStart) {
    const timeMs = Date.now() - state.timerStart;
    (supabase as any)
      .from("page_views")
      .update({ time_on_page_ms: timeMs })
      .eq("id", state.lastInsertId)
      .then(() => {});
  }

  captureUtmFromUrl();
  const utm = getStoredUtm();
  const referrer = document.referrer || null;

  const { data: { user } } = await supabase.auth.getUser();

  // Generate client-side UUID (no SELECT grant needed for update later)
  const newId = newUuid();

  (supabase as any)
    .from("page_views")
    .insert({
      id: newId,
      user_id: user?.id || null,
      session_id: getSessionId(),
      surface: "app",
      path,
      title: title || document.title,
      referrer,
      referrer_domain: extractDomain(referrer),
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_term: utm.utm_term || null,
      utm_content: utm.utm_content || null,
      user_agent: navigator.userAgent,
      screen_width: window.innerWidth,
      screen_height: window.innerHeight,
      locale: navigator.language?.split("-")[0] || "fr",
    })
    .then(() => {});

  state.lastInsertId = newId;
  state.timerStart = Date.now();
  state.lastPath = path;
}

// ───────────────────────────────────────────────────────────────
// Track custom event
// ───────────────────────────────────────────────────────────────

export async function trackEvent(
  eventName: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  if (typeof window === "undefined") return;

  const { data: { user } } = await supabase.auth.getUser();

  try {
    await (supabase as any).from("analytics_events").insert({
      user_id: user?.id || null,
      session_id: getSessionId(),
      surface: "app",
      event_name: eventName,
      properties,
      path: window.location.pathname,
    });
  } catch (e) {
    console.warn("[tracker] event insert failed", e);
  }
}

// ───────────────────────────────────────────────────────────────
// First-touch attribution (captured once per user at signup)
// ───────────────────────────────────────────────────────────────

export async function captureAttribution(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  const utm = getStoredUtm();
  try {
    await (supabase as any).from("user_attribution").insert({
      user_id: userId,
      utm_source: utm.utm_source || null,
      utm_medium: utm.utm_medium || null,
      utm_campaign: utm.utm_campaign || null,
      utm_term: utm.utm_term || null,
      utm_content: utm.utm_content || null,
      landing_page: window.location.pathname,
      referrer: document.referrer || null,
      referrer_domain: extractDomain(document.referrer || null),
      first_session_id: getSessionId(),
    });
  } catch (e) {
    // Silent fail (ON CONFLICT (user_id) will skip duplicates)
    console.warn("[tracker] attribution insert failed", e);
  }
  // Back-fill anonymous page_views of the current session with the new user_id.
  // Critical for conversion funnel analysis (pre-auth landing → post-auth onboarding).
  await backfillSessionPageViews(userId);
}

// Attach the new user_id to every page_view of the current session that was
// logged anonymously (pre-login landing, /auth, /onboarding). Idempotent via
// sessionStorage flag, runs at most once per session per user.
export async function backfillSessionPageViews(userId: string): Promise<void> {
  if (typeof window === "undefined") return;
  if (sessionStorage.getItem(BACKFILL_KEY) === userId) return;
  try {
    await (supabase as any)
      .from("page_views")
      .update({ user_id: userId })
      .eq("session_id", getSessionId())
      .is("user_id", null);
    sessionStorage.setItem(BACKFILL_KEY, userId);
  } catch (e) {
    console.warn("[tracker] backfill page_views failed", e);
  }
}

// ───────────────────────────────────────────────────────────────
// Flush time-on-page on unload (sendBeacon pour garantir l'envoi)
// ───────────────────────────────────────────────────────────────

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    if (state.lastInsertId && state.timerStart) {
      const timeMs = Date.now() - state.timerStart;
      const url = `${(supabase as any).supabaseUrl || ""}/rest/v1/page_views?id=eq.${state.lastInsertId}`;
      const key = (supabase as any).supabaseKey || "";
      try {
        const blob = new Blob([JSON.stringify({ time_on_page_ms: timeMs })], {
          type: "application/json",
        });
        const headers: Record<string, string> = {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        };
        // sendBeacon ne supporte pas les headers custom, fallback sur fetch keepalive
        fetch(url, {
          method: "PATCH",
          headers,
          body: blob,
          keepalive: true,
        }).catch(() => {});
      } catch {
        // no-op
      }
    }
  });
}

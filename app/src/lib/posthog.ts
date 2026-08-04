import posthog from "posthog-js";

const POSTHOG_HOST = "https://eu.i.posthog.com";
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const SENSITIVE_PROPERTY_TOKENS = new Set([
  "answer",
  "birth",
  "content",
  "email",
  "firstname",
  "fullname",
  "lastname",
  "message",
  "name",
  "password",
  "profile",
  "prompt",
  "question",
  "secret",
  "text",
  "token",
]);
const SAFE_AGGREGATE_KEYS = new Set([
  "answerlength",
  "contentlength",
  "messagelength",
  "namelength",
  "promptlength",
  "questionlength",
  "responselength",
  "textlength",
]);

let initialized = false;
let identifiedUserId: string | null = null;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function isExcludedPage(): boolean {
  if (typeof window === "undefined") return true;
  if (window.location.pathname.startsWith("/admin")) return true;
  try {
    return localStorage.getItem("kh_optout") === "1";
  } catch {
    return false;
  }
}

export function hasExplicitlyOptedOut(): boolean {
  const consent = getCookie("cookie-consent");
  return consent === "none" || consent === "essential";
}

export function isReplayExcludedPath(path: string): boolean {
  return (
    path.startsWith("/admin") ||
    path === "/auth" ||
    path.startsWith("/auth/") ||
    path === "/reset-password"
  );
}

function stripUrlQuery(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    const url = new URL(value, window.location.origin);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/, 1)[0];
  }
}

function normalizedPropertyKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function isSensitivePropertyKey(key: string, value: unknown): boolean {
  const normalized = normalizedPropertyKey(key);
  if (typeof value === "number" && SAFE_AGGREGATE_KEYS.has(normalized)) return false;
  const tokens = key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  return tokens.some((token) => SENSITIVE_PROPERTY_TOKENS.has(token));
}

function sanitizePosthogValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value
      .map((item) => sanitizePosthogValue(item))
      .filter((item) => item !== undefined);
  }
  if (!value || typeof value !== "object") return value;
  return sanitizePosthogProperties(value as Record<string, unknown>);
}

export function sanitizePosthogProperties(
  properties: Record<string, unknown>,
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (isSensitivePropertyKey(key, value)) continue;
    const normalized = normalizedPropertyKey(key);
    if (normalized.endsWith("url") || normalized.endsWith("href") || normalized.includes("referrer")) {
      sanitized[key] = stripUrlQuery(value);
      continue;
    }
    sanitized[key] = sanitizePosthogValue(value);
  }
  return sanitized;
}

export function initPosthog(): void {
  if (initialized || !POSTHOG_KEY || isExcludedPage() || hasExplicitlyOptedOut()) return;

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: "https://eu.posthog.com",
    autocapture: false,
    capture_pageview: false,
    capture_pageleave: true,
    capture_exceptions: false,
    disable_surveys: true,
    disable_session_recording: isReplayExcludedPath(window.location.pathname),
    person_profiles: "identified_only",
    persistence: "localStorage",
    opt_out_capturing_persistence_type: "localStorage",
    opt_out_capturing_by_default: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: "[data-ph-sensitive], [data-ph-sensitive] *, [data-ph-mask], [data-ph-mask] *",
      blockSelector: "[data-ph-sensitive]",
      recordCrossOriginIframes: false,
      recordHeaders: false,
      recordBody: false,
    },
    before_send: (event) => {
      if (!event) return null;
      return {
        ...event,
        properties: sanitizePosthogProperties(event.properties),
      };
    },
  });

  initialized = true;
}

export function applyPosthogConsent(level: string): void {
  if (level === "all") {
    initPosthog();
    if (initialized && !isReplayExcludedPath(window.location.pathname)) {
      posthog.opt_in_capturing();
      posthog.startSessionRecording();
    }
    return;
  }

  if (initialized) {
    posthog.stopSessionRecording();
    posthog.opt_out_capturing();
  }
}

export function syncPosthogIdentity(userId: string | null): void {
  if (!initialized || isExcludedPage()) return;
  if (userId) {
    if (identifiedUserId !== userId) {
      posthog.identify(userId);
      identifiedUserId = userId;
    }
    return;
  }

  if (identifiedUserId) {
    posthog.reset();
    identifiedUserId = null;
  }
}

function baseProperties(): Record<string, unknown> {
  return {
    schema_version: 1,
    surface: "app",
    locale: navigator.language || "fr-FR",
    is_anon: identifiedUserId === null,
  };
}

export function capturePosthogEvent(
  eventName: string,
  properties: Record<string, unknown> = {},
): void {
  if (!initialized || isExcludedPage() || posthog.has_opted_out_capturing()) return;
  posthog.capture(eventName, {
    ...baseProperties(),
    ...sanitizePosthogProperties(properties),
  });
}

export function capturePosthogPageView(path: string): void {
  capturePosthogEvent("$pageview", {
    path,
    $current_url: `${window.location.origin}${path}`,
  });
}

export function syncPosthogRoute(path: string): void {
  if (!initialized) return;
  if (isReplayExcludedPath(path)) {
    posthog.stopSessionRecording();
  } else if (!hasExplicitlyOptedOut()) {
    posthog.startSessionRecording();
  }
}

if (typeof document !== "undefined") {
  document.addEventListener("kh:consent", (event) => {
    applyPosthogConsent((event as CustomEvent<string>).detail);
  });
}

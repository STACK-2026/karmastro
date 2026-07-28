import {
  isOnboardingDestination,
  isOnboardingReason,
} from "@/lib/onboarding-flow";
import { sanitizeOnboardingResumeToken } from "@/lib/onboarding-draft";

export const POST_AUTH_PATH_KEY = "karmastro_post_auth_path";
export const ORACLE_HANDOFF_SESSION_KEY = "karmastro_oracle_session";

const ALLOWED_POST_AUTH_PATHS = new Set([
  "/dashboard",
  "/oracle",
  "/astral",
  "/pricing",
  "/onboarding",
]);

export function sanitizePostAuthPath(value: string | null | undefined): string {
  if (!value || value.startsWith("//")) return "/dashboard";
  try {
    const parsed = new URL(value, "https://app.karmastro.com");
    if (parsed.origin !== "https://app.karmastro.com") return "/dashboard";
    if (ALLOWED_POST_AUTH_PATHS.has(parsed.pathname) && !parsed.search) return parsed.pathname;
    if (parsed.pathname !== "/onboarding") return "/dashboard";
    const clean = new URLSearchParams();
    const resume = sanitizeOnboardingResumeToken(parsed.searchParams.get("resume"));
    const next = parsed.searchParams.get("next");
    const reason = parsed.searchParams.get("reason");
    if (resume) clean.set("resume", resume);
    if (isOnboardingDestination(next)) clean.set("next", next);
    if (isOnboardingReason(reason)) clean.set("reason", reason);
    const query = clean.toString();
    return query ? `/onboarding?${query}` : "/onboarding";
  } catch {
    return "/dashboard";
  }
}

export function storePostAuthPath(value: string | null | undefined): string {
  const path = sanitizePostAuthPath(value);
  localStorage.setItem(POST_AUTH_PATH_KEY, path);
  return path;
}

export function getPostAuthPath(): string {
  const path = sanitizePostAuthPath(localStorage.getItem(POST_AUTH_PATH_KEY));
  localStorage.removeItem(POST_AUTH_PATH_KEY);
  return path;
}

export function clearPostAuthPath(): void {
  localStorage.removeItem(POST_AUTH_PATH_KEY);
}

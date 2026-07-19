import { EXTERNAL_LEGACY_ROUTES } from "@/lib/legacy-routes";

type MinimalProfile = {
  first_name?: string | null;
  birth_date?: string | null;
};

const PROFILE_GATE_WHITELIST = new Set([
  "/",
  "/auth",
  "/reset-password",
  "/onboarding",
  "/pricing",
  ...Object.keys(EXTERNAL_LEGACY_ROUTES),
]);

export function isProfileGateWhitelisted(pathname: string) {
  return PROFILE_GATE_WHITELIST.has(pathname);
}

export function resolveProfileGate(profile: MinimalProfile | null | undefined, error?: unknown) {
  if (error) {
    return {
      // The gate is a UX redirect, not an authorization boundary. A transient
      // read failure must not manufacture an incomplete profile and loop.
      incomplete: false,
      cacheAsComplete: false,
      readFailed: true,
    };
  }

  const incomplete = !profile?.first_name || !profile?.birth_date;
  return {
    incomplete,
    // Only a complete result is stable enough to cache. An incomplete result
    // must be queried again after onboarding saves the missing fields.
    cacheAsComplete: !incomplete,
    readFailed: false,
  };
}

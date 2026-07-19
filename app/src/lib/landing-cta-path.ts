export type LandingCtaIntent = "profile" | "oracle" | "pricing";

const LANDING_CTA_PATHS = {
  profile: "/onboarding",
  oracle: "/oracle",
  pricing: "/pricing",
} as const satisfies Record<LandingCtaIntent, string>;

export function getLandingCtaPath(intent: LandingCtaIntent) {
  return LANDING_CTA_PATHS[intent];
}

import type { OracleLimitSurface } from "@/lib/oracle-limit-state";

export const ORACLE_ETOILE_LIMIT_CTA_ROLLOUT = Object.freeze({
  id: "oracle_etoile_limit_cta_20260804_v1",
  introducedAt: "2026-08-04",
});

type OracleEtoileLimitCtaInput = {
  wallType: OracleLimitSurface;
  isAuthenticated: boolean;
  flagValue?: string;
};

export function shouldShowOracleEtoileLimitCta({
  wallType,
  isAuthenticated,
  flagValue = import.meta.env.VITE_ORACLE_ETOILE_LIMIT_CTA_ENABLED,
}: OracleEtoileLimitCtaInput): boolean {
  return wallType === "authenticated_interim_limit_v1"
    && isAuthenticated
    && flagValue !== "false";
}

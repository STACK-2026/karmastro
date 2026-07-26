type OracleSignupHandoffState = {
  isAuthenticated: boolean;
  role: "user" | "assistant" | "paywall";
  isLatest: boolean;
  isLoading: boolean;
};

export function oracleSignupPath(sessionId: string): string {
  const params = new URLSearchParams({
    next: "/onboarding",
    oracle_session: sessionId,
  });
  return `/auth?${params.toString()}`;
}

export function shouldShowOracleSignupHandoff(
  state: OracleSignupHandoffState,
): boolean {
  return !state.isAuthenticated
    && state.role === "assistant"
    && state.isLatest
    && !state.isLoading;
}

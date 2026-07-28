import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  PromotionPassContext,
  type PromotionPassContextValue,
} from "@/contexts/promotion-pass-context";
import { useAuth } from "@/contexts/AuthContext";
import { SUPABASE_URL, supabase } from "@/integrations/supabase/client";
import {
  NO_EFFECTIVE_ACCESS,
  PROMOTION_PASS_OFFER_CODE,
  normalizeEffectiveAccess,
  requireSessionForPromotionUser,
  type EffectiveAccess,
} from "@/lib/promotion-pass";

const PROMOTION_PASS_URL = `${SUPABASE_URL}/functions/v1/promotion-pass`;

async function authenticatedHeaders(expectedUserId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  const verified = requireSessionForPromotionUser(session, expectedUserId);
  return {
    Authorization: `Bearer ${verified.access_token}`,
    "Content-Type": "application/json",
  };
}

export function PromotionPassProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [access, setAccess] = useState<EffectiveAccess>(NO_EFFECTIVE_ACCESS);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestGenerationRef = useRef(0);
  const currentUserIdRef = useRef(user?.id || null);
  currentUserIdRef.current = user?.id || null;

  const refreshAccess = useCallback(async () => {
    if (!user) {
      setAccess(NO_EFFECTIVE_ACCESS);
      return NO_EFFECTIVE_ACCESS;
    }
    const userId = user.id;
    const generation = ++requestGenerationRef.current;
    const isCurrent = () =>
      generation === requestGenerationRef.current
      && currentUserIdRef.current === userId;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(PROMOTION_PASS_URL, {
        method: "GET",
        headers: await authenticatedHeaders(userId),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error || "promotion_pass_unavailable");
      const next = normalizeEffectiveAccess(payload);
      if (isCurrent()) {
        setAccess(next);
        setServerOffsetMs(next.serverNow ? new Date(next.serverNow).getTime() - Date.now() : 0);
      }
      return next;
    } catch (nextError) {
      if (isCurrent()) {
        setError(nextError instanceof Error ? nextError.message : "promotion_pass_unavailable");
        setAccess(NO_EFFECTIVE_ACCESS);
        setServerOffsetMs(0);
      }
      return NO_EFFECTIVE_ACCESS;
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [user]);

  const activatePass = useCallback(async () => {
    if (!user) throw new Error("promotion_pass_auth_required");
    const userId = user.id;
    const generation = ++requestGenerationRef.current;
    const isCurrent = () =>
      generation === requestGenerationRef.current
      && currentUserIdRef.current === userId;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(PROMOTION_PASS_URL, {
        method: "POST",
        headers: await authenticatedHeaders(userId),
        body: JSON.stringify({
          action: "activate",
          offer_code: PROMOTION_PASS_OFFER_CODE,
          idempotency_key: crypto.randomUUID(),
        }),
      });
      const payload = await response.json().catch(() => null);
      const next = normalizeEffectiveAccess(payload?.access || payload);
      if (isCurrent()) {
        setAccess(next);
        setServerOffsetMs(next.serverNow ? new Date(next.serverNow).getTime() - Date.now() : 0);
      }
      if (!response.ok) throw new Error(payload?.error || "promotion_pass_activation_failed");
      return next;
    } catch (nextError) {
      if (isCurrent()) {
        setError(nextError instanceof Error ? nextError.message : "promotion_pass_activation_failed");
      }
      throw nextError;
    } finally {
      if (isCurrent()) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      requestGenerationRef.current += 1;
      setAccess(NO_EFFECTIVE_ACCESS);
      setServerOffsetMs(0);
      setError(null);
      return;
    }
    void refreshAccess();
  }, [authLoading, refreshAccess, user]);

  useEffect(() => {
    if (access.passState !== "active" || !access.passExpiresAt) return;
    const delay = new Date(access.passExpiresAt).getTime() - (Date.now() + serverOffsetMs);
    if (!Number.isFinite(delay) || delay <= 0) {
      void refreshAccess();
      return;
    }
    const timer = window.setTimeout(
      () => void refreshAccess(),
      Math.min(delay + 1_000, 2_147_000_000),
    );
    return () => window.clearTimeout(timer);
  }, [access.passExpiresAt, access.passState, refreshAccess, serverOffsetMs]);

  const value = useMemo<PromotionPassContextValue>(() => ({
    ...access,
    serverOffsetMs,
    loading,
    error,
    refreshAccess,
    activatePass,
  }), [access, activatePass, error, loading, refreshAccess, serverOffsetMs]);

  return (
    <PromotionPassContext.Provider value={value}>
      {children}
    </PromotionPassContext.Provider>
  );
}

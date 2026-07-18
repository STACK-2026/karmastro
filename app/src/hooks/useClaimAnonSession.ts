import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ORACLE_HANDOFF_SESSION_KEY } from "@/lib/postAuth";

const ALREADY_CLAIMED_KEY = "karmastro_oracle_session_claimed_at";
const SAFE_SESSION_RE = /^[A-Za-z0-9._:-]{8,128}$/;

// Listens for the SIGNED_IN event and, when it fires, asks the edge function
// to attach any anonymous oracle session (conversations + profile hints) to
// the freshly-authenticated user. Runs at most once per browser, even across
// page reloads (guarded by localStorage timestamp).
export function useClaimAnonSession() {
  const running = useRef(false);

  useEffect(() => {
    const handoffSession = new URLSearchParams(window.location.search).get("oracle_session")?.trim();
    if (handoffSession && SAFE_SESSION_RE.test(handoffSession)) {
      localStorage.setItem(ORACLE_HANDOFF_SESSION_KEY, handoffSession);
    }

    const claim = async (session: { access_token?: string } | null) => {
      if (running.current) return;

      const anonSessionId = localStorage.getItem(ORACLE_HANDOFF_SESSION_KEY);
      if (!anonSessionId) return;

      // Don't reclaim if we already did for this session id.
      const alreadyFor = localStorage.getItem(ALREADY_CLAIMED_KEY);
      if (alreadyFor === anonSessionId) return;

      const token = session?.access_token;
      if (!token) return;

      running.current = true;
      try {
        const url = `${supabase.supabaseUrl}/functions/v1/claim-anon-session`;
        const resp = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId: anonSessionId }),
        });
        if (resp.ok) {
          // Mark this sid as processed. We keep it in localStorage so
          // the existing conversation thread can still be rehydrated by
          // oracle mount logic, but next sign-in won't re-run the claim.
          localStorage.setItem(ALREADY_CLAIMED_KEY, anonSessionId);
          window.dispatchEvent(new CustomEvent("karmastro:oracle-claimed"));
        } else {
          console.warn("[claim-anon-session] non-ok response", resp.status);
        }
      } catch (e) {
        console.warn("[claim-anon-session] failed (non-fatal)", e);
      } finally {
        running.current = false;
      }
    };

    // A handoff can land in a browser that is already authenticated. Supabase
    // won't emit SIGNED_IN again in that case, so claim once on mount too.
    supabase.auth.getSession().then(({ data }) => claim(data.session));

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") await claim(session);
    });

    return () => subscription.unsubscribe();
  }, []);
}

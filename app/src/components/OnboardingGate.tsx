import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useT } from "@/i18n/ui";
import { isProfileGateWhitelisted, resolveProfileGate } from "@/lib/profile-gate";

/**
 * Wraps the app and redirects authenticated users with an incomplete profile
 * (missing first_name or birth_date) to /onboarding.
 *
 * Complete profiles are cached for the session. Incomplete results are always
 * rechecked after onboarding so a just-completed profile cannot be trapped.
 */
export const OnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useT();
  const [checked, setChecked] = useState(false);
  const checkedFor = useRef<string | null>(null); // complete user.id already validated

  useEffect(() => {
    if (authLoading) return;

    // Logged out : nothing to check
    if (!user) {
      setChecked(true);
      checkedFor.current = null;
      return;
    }

    // Already validated this user : noop on route change
    if (checkedFor.current === user.id) {
      setChecked(true);
      return;
    }

    // Whitelist : don't block rendering but still run the check in background
    // so the next protected navigation has the result
    const isWhitelisted = isProfileGateWhitelisted(location.pathname);
    setChecked(isWhitelisted);
    let cancelled = false;

    (async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("first_name, birth_date")
        .eq("user_id", user.id)
        .maybeSingle();

      // Route/user changes can start a newer request. An older whitelist read
      // must never reopen protected content or override the newer decision.
      if (cancelled) return;
      const decision = resolveProfileGate(profile, error);
      checkedFor.current = decision.cacheAsComplete ? user.id : null;

      if (decision.incomplete && !isWhitelisted) {
        navigate("/onboarding", { replace: true });
      }
      setChecked(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, location.pathname, navigate]);

  // Prevent flash of unauthorized content while first check is in flight
  if (!checked && user && !isProfileGateWhitelisted(location.pathname)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">{t("common.onboarding_loading")}</p>
      </div>
    );
  }

  return <>{children}</>;
};

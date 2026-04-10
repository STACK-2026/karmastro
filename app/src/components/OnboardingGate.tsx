import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps the app and redirects authenticated users with an incomplete profile
 * (missing first_name or birth_date) to /onboarding.
 *
 * Check runs ONCE per user (cached for the session). Whitelisted routes never
 * trigger the check.
 */
const WHITELIST = new Set([
  "/",
  "/auth",
  "/reset-password",
  "/onboarding",
  "/pricing",
]);

export const OnboardingGate = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [checked, setChecked] = useState(false);
  const checkedFor = useRef<string | null>(null); // user.id we already validated

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
    const isWhitelisted = WHITELIST.has(location.pathname);
    if (isWhitelisted) setChecked(true);

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, birth_date")
        .eq("user_id", user.id)
        .maybeSingle();

      const incomplete = !profile?.first_name || !profile?.birth_date;
      checkedFor.current = user.id;

      if (incomplete && !isWhitelisted) {
        navigate("/onboarding", { replace: true });
      }
      setChecked(true);
    })();
  }, [user, authLoading, location.pathname, navigate]);

  // Prevent flash of unauthorized content while first check is in flight
  if (!checked && user && !WHITELIST.has(location.pathname)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Alignement des astres...</p>
      </div>
    );
  }

  return <>{children}</>;
};

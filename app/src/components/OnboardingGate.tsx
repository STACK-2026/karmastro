import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

/**
 * Wraps the app and redirects authenticated users with an incomplete profile
 * (missing first_name or birth_date) to /onboarding.
 *
 * Whitelisted routes (reachable without completing onboarding):
 *   /, /auth, /reset-password, /onboarding, /pricing
 *
 * All other routes trigger a redirect if the user hasn't completed onboarding.
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

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setChecked(true);
      return;
    }
    // Only check on protected routes
    if (WHITELIST.has(location.pathname)) {
      setChecked(true);
      return;
    }

    (async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, birth_date")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!profile?.first_name || !profile?.birth_date) {
        navigate("/onboarding", { replace: true });
      }
      setChecked(true);
    })();
  }, [user, authLoading, location.pathname, navigate]);

  // Prevent flash of unauthorized content while checking
  if (!checked && user && !WHITELIST.has(location.pathname)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Alignement des astres...</p>
      </div>
    );
  }

  return <>{children}</>;
};

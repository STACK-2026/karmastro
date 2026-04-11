import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { trackEvent } from "@/lib/tracker";
import StarField from "@/components/StarField";

const REFERRAL_STORAGE_KEY = "karmastro_referral_code";

// Landing page for Supabase OAuth redirects. The session is parsed automatically
// by the Supabase client from the URL hash fragment; we just wait for the user
// to appear in useAuth(), then attach any stored referral code to the profile.
const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [attaching, setAttaching] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      // No session landed — send them back to auth
      navigate("/auth");
      return;
    }
    if (attaching) return;
    setAttaching(true);

    (async () => {
      const storedRef = localStorage.getItem(REFERRAL_STORAGE_KEY);

      // Track the sign-in event
      trackEvent("login", { method: "google_oauth" });

      if (storedRef) {
        try {
          await supabase
            .from("profiles")
            .update({ referred_by_code: storedRef } as never)
            .eq("user_id", user.id);
          localStorage.removeItem(REFERRAL_STORAGE_KEY);
        } catch (e) {
          // Swallow errors — the profile may not exist yet if the DB trigger is slow;
          // in that case the user can still complete signup. Don't block navigation.
          console.warn("Referral attach failed", e);
        }
      }

      // Check if onboarding is needed (no birth date/time in profile)
      // If yes, OnboardingGate will handle redirection automatically.
      navigate("/dashboard", { replace: true });
    })();
  }, [user, loading, navigate, attaching]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative">
      <StarField />
      <div className="relative z-10 text-center">
        <Sparkles className="h-10 w-10 text-primary mx-auto mb-4 animate-pulse" />
        <p className="text-sm text-muted-foreground">Les astres s'alignent…</p>
      </div>
    </div>
  );
};

export default AuthCallback;

import { useEffect, useState } from "react";
import { AlertCircle, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useT } from "@/i18n/ui";
import { supabase } from "@/integrations/supabase/client";
import {
  resolveProfileBoundary,
  type OnboardingDestination,
  type ProfileBoundaryDecision,
} from "@/lib/onboarding-flow";
import StarField from "@/components/StarField";

type BoundaryState = ProfileBoundaryDecision | { state: "loading"; destination: string };

export function ProfileBoundary({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useT();
  const [attempt, setAttempt] = useState(0);
  const [decision, setDecision] = useState<BoundaryState>({
    state: "loading",
    destination: location.pathname,
  });

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    if (!user) {
      setDecision({ state: "complete_profile", destination: location.pathname });
      return;
    }

    setDecision({ state: "loading", destination: location.pathname });
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("first_name, birth_date")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled) {
          setDecision(resolveProfileBoundary(location.pathname, data, error));
        }
      } catch (error) {
        if (!cancelled) {
          setDecision(resolveProfileBoundary(location.pathname, null, error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [attempt, authLoading, location.pathname, user]);

  if (decision.state === "allow") return <>{children}</>;

  const destination = decision.destination as OnboardingDestination;
  const onboardingPath = `/onboarding?${new URLSearchParams({
    next: destination,
    reason: "personalized_surface",
  }).toString()}`;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative px-5">
      <StarField />
      <section className="relative z-10 w-full max-w-md rounded-2xl border border-primary/25 bg-card/90 p-6 text-center shadow-xl">
        {decision.state === "loading" ? (
          <p className="text-sm text-muted-foreground">{t("common.onboarding_loading")}</p>
        ) : decision.state === "read_error" ? (
          <>
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-amber-300" />
            <h1 className="font-serif text-xl">{t("profile_boundary.error_title")}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t("profile_boundary.error_desc")}</p>
            <Button className="mt-5 w-full" variant="outline" onClick={() => setAttempt((value) => value + 1)}>
              {t("common.retry")}
            </Button>
          </>
        ) : (
          <>
            <Sparkles className="mx-auto mb-3 h-9 w-9 text-primary" />
            <h1 className="font-serif text-2xl">{t("profile_boundary.title")}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("profile_boundary.description")}
            </p>
            <Button className="mt-6 w-full" onClick={() => navigate(onboardingPath)}>
              {t("profile_boundary.complete")}
            </Button>
            <Button className="mt-2 w-full" variant="ghost" onClick={() => navigate("/oracle")}>
              {t("profile_boundary.use_oracle")}
            </Button>
          </>
        )}
      </section>
    </div>
  );
}

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Check, Star, Heart, Zap } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/tracker";
import { formatPrice } from "@/lib/locale";
import { useT } from "@/i18n/ui";

const CHECKOUT_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/stripe-checkout";

type CurrentPlan = {
  tier: string;
  status: string | null;
  credits: number;
  period_end: string | null;
};

const PricingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useT();
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("profiles")
      .select("subscription_tier, subscription_status, credits, subscription_period_end")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setCurrentPlan({
            tier: data.subscription_tier || "eveil",
            status: data.subscription_status,
            credits: data.credits || 0,
            period_end: data.subscription_period_end,
          });
        }
      });
  }, [user?.id]);

  const handleCheckout = async (priceKey: string) => {
    if (!user) {
      trackEvent("checkout_blocked_no_auth", { price_key: priceKey });
      toast({ title: t("pricing.toast_auth_required_title"), description: t("pricing.toast_auth_required_desc"), variant: "destructive" });
      navigate("/auth?next=/pricing");
      return;
    }

    trackEvent("checkout_started", { price_key: priceKey, locale });
    setLoading(priceKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error(t("pricing.checkout_session_expired"));

      const res = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceKey,
          locale,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || t("pricing.checkout_create_failed"));
      }

      window.location.href = data.url;
    } catch (error: unknown) {
      toast({
        title: t("pricing.toast_checkout_error_title"),
        description: error instanceof Error ? error.message : t("pricing.checkout_create_failed"),
        variant: "destructive",
      });
      setLoading(null);
    }
  };

  const isCurrentTier = (tier: string) => currentPlan?.tier === tier && currentPlan?.status === "active";

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title={t("pricing.header_title")} subtitle={t("pricing.header_subtitle")} showBack />

      <main className="relative z-10 px-5 space-y-5 max-w-2xl mx-auto">
        {/* Current plan indicator */}
        {currentPlan && currentPlan.tier !== "eveil" && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-center">
            <p className="text-xs text-primary">
              {t("pricing.current_plan_prefix")}{" "}
              <strong>
                {currentPlan.tier === "etoile"
                  ? t("pricing.current_plan_etoile")
                  : currentPlan.tier === "ame_soeur"
                  ? t("pricing.current_plan_ame_soeur")
                  : currentPlan.tier}
              </strong>
              {currentPlan.credits > 0 && <> · <strong>{t("pricing.current_credits", { count: currentPlan.credits })}</strong></>}
            </p>
          </div>
        )}

        {/* Billing period toggle */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-card/60 border border-border">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                billingPeriod === "monthly" ? "bg-primary text-[#140b20]" : "text-muted-foreground"
              }`}
            >
              {t("pricing.period_monthly")}
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                billingPeriod === "annual" ? "bg-primary text-[#140b20]" : "text-muted-foreground"
              }`}
            >
              {t("pricing.period_annual")} <span className="text-[10px] text-amber-300">{t("pricing.period_annual_badge")}</span>
            </button>
          </div>
        </div>

        {/* Étoile (subscription) - HIGHLIGHTED */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative p-6 rounded-2xl border-2 border-amber-300/60 bg-gradient-to-br from-purple-500/10 to-amber-300/10"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-300 text-[#0f0a1e] text-xs font-semibold">
            {t("pricing.most_popular")}
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 text-amber-300" />
            <h3 className="font-serif text-xl text-amber-300">{t("pricing.tier_etoile")}</h3>
            {isCurrentTier("etoile") && <span className="text-xs text-primary ml-auto">{t("pricing.cta_current_plan")}</span>}
          </div>
          <div className="mb-3">
            {billingPeriod === "monthly" ? (
              <p className="text-3xl font-serif">
                {formatPrice(5.99, locale)} <span className="text-xs text-muted-foreground">{t("pricing.per_month")}</span>
              </p>
            ) : (
              <>
                <p className="text-3xl font-serif">
                  {formatPrice(49.99, locale)} <span className="text-xs text-muted-foreground">{t("pricing.per_year")}</span>
                </p>
                <p className="text-xs text-amber-300/80">{t("pricing.annual_saves", { price: formatPrice(4.16, locale) })}</p>
              </>
            )}
          </div>
          <ul className="space-y-1.5 text-sm text-foreground/90 mb-5">
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> {t("pricing.tier_etoile_f1")}</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> {t("pricing.tier_etoile_f2")}</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> {t("pricing.tier_etoile_f3")}</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> {t("pricing.tier_etoile_f5")}</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> {t("pricing.tier_etoile_f6")}</li>
          </ul>
          <button
            onClick={() => handleCheckout(billingPeriod === "monthly" ? "etoile_monthly" : "etoile_annual")}
            disabled={loading !== null || isCurrentTier("etoile")}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === (billingPeriod === "monthly" ? "etoile_monthly" : "etoile_annual")
              ? t("pricing.cta_loading")
              : isCurrentTier("etoile")
              ? t("pricing.cta_current_plan")
              : billingPeriod === "monthly"
              ? t("pricing.cta_etoile_monthly")
              : t("pricing.cta_etoile_annual")}
          </button>
        </motion.div>

        {/* Âme Soeur (one-shot) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-5 rounded-2xl border border-pink-400/30 bg-pink-400/5"
        >
          <div className="flex items-center gap-2 mb-2">
            <Heart className="h-5 w-5 text-pink-300" />
            <h3 className="font-serif text-xl text-pink-300">{t("pricing.tier_ame_soeur")}</h3>
            <span className="text-xs text-muted-foreground ml-auto">{t("pricing.tier_ame_soeur_kind")}</span>
          </div>
          <p className="text-2xl font-serif mb-3">
            {formatPrice(3.99, locale)} <span className="text-xs text-muted-foreground">{t("pricing.once_only")}</span>
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-pink-300 mt-0.5 shrink-0" /> {t("pricing.tier_ame_soeur_f1")}</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-pink-300 mt-0.5 shrink-0" /> {t("pricing.tier_ame_soeur_f2")}</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-pink-300 mt-0.5 shrink-0" /> {t("pricing.tier_ame_soeur_f3")}</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-pink-300 mt-0.5 shrink-0" /> {t("pricing.tier_ame_soeur_f4")}</li>
          </ul>
          <button
            onClick={() => handleCheckout("ame_soeur")}
            disabled={loading !== null}
            className="w-full px-5 py-2.5 rounded-xl border border-pink-400/40 text-pink-300 font-medium hover:bg-pink-400/10 transition-colors disabled:opacity-50"
          >
            {loading === "ame_soeur" ? t("pricing.cta_loading") : t("pricing.cta_ame_soeur")}
          </button>
        </motion.div>

        {/* FAQ mini */}
        <div className="p-5 rounded-2xl bg-card/40 border border-border space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("pricing.faq_no_commit_title")}</p>
              <p className="text-xs text-muted-foreground">{t("pricing.faq_no_commit_desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("pricing.faq_stripe_title")}</p>
              <p className="text-xs text-muted-foreground">{t("pricing.faq_stripe_desc")}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Heart className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{t("pricing.faq_referral_title")}</p>
              <p className="text-xs text-muted-foreground">{t("pricing.faq_referral_desc")}</p>
            </div>
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default PricingPage;

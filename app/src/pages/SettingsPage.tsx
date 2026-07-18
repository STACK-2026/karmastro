import { Globe, LogOut, UserCog, CreditCard, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AppFooter from "@/components/AppFooter";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";
import { useT } from "@/i18n/ui";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BILLING_PORTAL_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/billing-portal";

const BILLING_LABELS: Record<string, string> = {
  fr: "Gérer mon abonnement",
  en: "Manage subscription",
  es: "Gestionar suscripción",
  pt: "Gerir subscrição",
  de: "Abo verwalten",
  it: "Gestisci abbonamento",
  tr: "Aboneliği yönet",
  pl: "Zarządzaj subskrypcją",
  ru: "Управлять подпиской",
  ja: "サブスクリプションを管理",
  ar: "إدارة الاشتراك",
};

const LOCALE_NATIVE: Record<string, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
  tr: "Türkçe",
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { t, locale } = useT();
  const { signOut } = useAuth();
  const profile = useUserProfile();
  const { toast } = useToast();
  const [billingLoading, setBillingLoading] = useState(false);
  const hasBillingRelationship = profile.subscriptionTier === "etoile"
    && Boolean(profile.subscriptionStatus)
    && profile.subscriptionStatus !== "canceled";

  const handleBilling = async () => {
    if (!hasBillingRelationship) {
      navigate("/pricing");
      return;
    }
    setBillingLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");
      const response = await fetch(BILLING_PORTAL_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload.url) throw new Error(payload.error || "Portail indisponible");
      window.location.assign(payload.url);
    } catch (error) {
      toast({
        title: t("pricing.toast_checkout_error_title"),
        description: error instanceof Error ? error.message : "Portail indisponible",
        variant: "destructive",
      });
      setBillingLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const settings = [
    { icon: Globe, label: t("settings.language"), value: LOCALE_NATIVE[locale] || locale.toUpperCase() },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title={t("settings.header_title")} showBack />

      <div className="relative z-10 px-5 space-y-3">
        <button
          onClick={() => navigate("/onboarding?mode=edit")}
          className="w-full flex items-center gap-3 border-glow rounded-lg bg-card/40 p-4 hover:bg-card/60 transition-colors"
        >
          <UserCog className="h-5 w-5 text-primary" />
          <span className="text-sm flex-1 text-left">{t("profile.edit_info")}</span>
          <span className="text-xs text-muted-foreground">→</span>
        </button>

        {settings.map((s) => (
          <div
            key={s.label}
            className="w-full flex items-center gap-3 border-glow rounded-lg bg-card/40 p-4"
          >
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm flex-1 text-left">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.value}</span>
          </div>
        ))}

        <div className="pt-4">
          <Button variant="outline" className="w-full border-primary text-primary" onClick={handleBilling} disabled={billingLoading}>
            {billingLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CreditCard className="h-4 w-4 mr-2" />}
            {hasBillingRelationship
              ? (BILLING_LABELS[locale] || BILLING_LABELS.en)
              : t("settings.upgrade_cta")}
          </Button>
        </div>

        <div className="pt-2">
          <Button variant="ghost" className="w-full text-destructive" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" /> {t("settings.logout")}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground text-center pt-6">
          {t("settings.footer_version")}
        </p>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default SettingsPage;

import { Globe, Bell, Palette, Shield, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AppFooter from "@/components/AppFooter";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";
import { useT } from "@/i18n/ui";

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

  const settings = [
    { icon: Globe, label: t("settings.language"), value: LOCALE_NATIVE[locale] || locale.toUpperCase() },
    { icon: Bell, label: t("settings.notifications"), value: t("settings.notifications_on") },
    { icon: Palette, label: t("settings.theme"), value: t("settings.theme_night") },
    { icon: Shield, label: t("settings.detail_level"), value: t("settings.detail_intermediate") },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title={t("settings.header_title")} showBack />

      <div className="relative z-10 px-5 space-y-3">
        {settings.map((s) => (
          <button
            key={s.label}
            className="w-full flex items-center gap-3 border-glow rounded-lg bg-card/40 p-4 hover:bg-card/60 transition-colors"
          >
            <s.icon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm flex-1 text-left">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.value}</span>
          </button>
        ))}

        <div className="pt-4">
          <Button variant="outline" className="w-full border-primary text-primary" onClick={() => navigate("/#pricing")}>
            {t("settings.upgrade_cta")}
          </Button>
        </div>

        <div className="pt-2">
          <Button variant="ghost" className="w-full text-destructive" onClick={() => navigate("/")}>
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

import { useState, useEffect } from "react";
import { useT } from "@/i18n/ui";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useT();

  useEffect(() => {
    const match = document.cookie.match(/(^| )cookie-consent=([^;]+)/);
    if (!match) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (level: string) => {
    const expires = new Date(Date.now() + 365 * 86400000).toUTCString();
    document.cookie = `cookie-consent=${level};expires=${expires};path=/;domain=.karmastro.com;SameSite=Lax`;
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[60] md:max-w-lg"
      style={{
        background: "rgba(10, 10, 15, 0.92)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        border: "1px solid rgba(139, 92, 246, 0.15)",
        borderRadius: 20,
        boxShadow: "0 8px 40px rgba(0, 0, 0, 0.4)",
        padding: 20,
        animation: "slide-up 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards",
      }}
    >
      <div className="flex items-start gap-3 mb-4">
        <span className="text-2xl">🔮</span>
        <div>
          <p className="text-foreground text-sm font-semibold mb-1 font-serif">
            {t("cookie.title")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("cookie.desc")}{" "}
            <a href="https://karmastro.com/politique-confidentialite" className="underline text-primary hover:text-foreground transition-colors">
              {t("cookie.learn_more")}
            </a>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => saveConsent("all")}
          className="flex-1 min-w-[100px] text-sm font-semibold text-white py-2.5 px-4 rounded-xl bg-primary hover:opacity-90 transition-all"
          style={{ boxShadow: "0 4px 15px rgba(139, 92, 246, 0.25)" }}
        >
          {t("cookie.accept_all")}
        </button>
        <button
          onClick={() => saveConsent("essential")}
          className="flex-1 min-w-[100px] text-sm font-medium text-muted-foreground py-2.5 px-4 rounded-xl border-glow hover:text-foreground transition-all"
        >
          {t("cookie.essentials_only")}
        </button>
        <button
          onClick={() => saveConsent("none")}
          className="text-xs py-2 px-3 rounded-lg text-muted-foreground/60 hover:text-muted-foreground transition-colors"
        >
          {t("cookie.refuse")}
        </button>
      </div>
    </div>
  );
};

export default CookieBanner;

import { useEffect, useRef, useState } from "react";
import { Clock3, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePromotionPass } from "@/hooks/usePromotionPass";
import { useT } from "@/i18n/ui";
import { formatPromotionPassRemaining } from "@/lib/promotion-pass";
import {
  etoilePassActivationFailedEvent,
  etoilePassActivationRequestedEvent,
  etoilePassActivationSucceededEvent,
  etoilePassOfferViewedEvent,
} from "@/lib/oracle-analytics";
import { trackEvent } from "@/lib/tracker";

export function EtoilePassCard() {
  const { t } = useT();
  const {
    passState,
    passExpiresAt,
    accessSource,
    serverOffsetMs,
    loading,
    activatePass,
  } = usePromotionPass();
  const viewedRef = useRef(false);
  const [, setClock] = useState(() => Date.now());

  useEffect(() => {
    if (passState !== "offered" || viewedRef.current) return;
    viewedRef.current = true;
    const event = etoilePassOfferViewedEvent();
    void trackEvent(event.name, event.properties);
  }, [passState]);

  useEffect(() => {
    if (passState !== "active") return;
    const timer = window.setInterval(() => setClock(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [passState]);

  if (passState !== "offered" && passState !== "active") return null;

  const activate = async () => {
    const requested = etoilePassActivationRequestedEvent();
    void trackEvent(requested.name, requested.properties);
    try {
      const next = await activatePass();
      const succeeded = etoilePassActivationSucceededEvent(next.accessSource);
      void trackEvent(succeeded.name, succeeded.properties);
    } catch {
      const failed = etoilePassActivationFailedEvent("unavailable");
      void trackEvent(failed.name, failed.properties);
    }
  };

  return (
    <section className="mx-auto mb-4 w-full max-w-md rounded-2xl border border-amber-300/35 bg-gradient-to-br from-amber-300/10 to-primary/10 p-4 text-center">
      <Sparkles className="mx-auto mb-2 h-6 w-6 text-amber-300" />
      {passState === "offered" ? (
        <>
          <h2 className="font-serif text-lg">{t("oracle.pass_offer_title")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("oracle.pass_offer_desc")}
          </p>
          <Button className="mt-3 w-full" disabled={loading} onClick={activate}>
            {loading ? t("common.loading") : t("oracle.pass_activate")}
          </Button>
          <p className="mt-2 text-[10px] text-muted-foreground">{t("oracle.pass_no_card")}</p>
        </>
      ) : (
        <>
          <h2 className="font-serif text-lg">{t("oracle.pass_active_title")}</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {t("oracle.pass_active_desc")}
          </p>
          <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-300/10 px-3 py-1 text-xs text-amber-200">
            <Clock3 className="h-3.5 w-3.5" />
            {t("oracle.pass_remaining", {
              time: formatPromotionPassRemaining(
                passExpiresAt,
                new Date(Date.now() + serverOffsetMs),
              ) || t("common.loading"),
            })}
          </p>
          {accessSource !== "promo_pass" && (
            <p className="mt-2 text-xs text-muted-foreground">{t("common.loading")}</p>
          )}
        </>
      )}
    </section>
  );
}

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  Crown,
  Hash,
  Heart,
  MessageCircle,
  Moon,
  Sparkles,
  Star,
  User,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useT } from "@/i18n/ui";
import { personalDay } from "@/lib/numerology";
import { getPersonalizedHooks, type OracleHook } from "@/lib/oracleHooks";
import { supabase } from "@/integrations/supabase/client";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";

type DailyHoroscope = {
  intro: string;
  love: string;
  work: string;
  energy: string;
  intuition: string;
  luckyNumber?: number;
  color?: string;
  mantra?: string;
  sign?: string;
};

const SIGN_SLUGS: Record<string, string> = {
  belier: "belier",
  taureau: "taureau",
  gemeaux: "gemeaux",
  cancer: "cancer",
  lion: "lion",
  vierge: "vierge",
  balance: "balance",
  scorpion: "scorpion",
  sagittaire: "sagittaire",
  capricorne: "capricorne",
  verseau: "verseau",
  poissons: "poissons",
};

const SECTION_LABELS: Record<string, [string, string, string, string]> = {
  fr: ["Amour", "Travail", "Énergie", "Intuition"],
  en: ["Love", "Work", "Energy", "Intuition"],
  es: ["Amor", "Trabajo", "Energía", "Intuición"],
  pt: ["Amor", "Trabalho", "Energia", "Intuição"],
  de: ["Liebe", "Arbeit", "Energie", "Intuition"],
  it: ["Amore", "Lavoro", "Energia", "Intuizione"],
  tr: ["Aşk", "İş", "Enerji", "Sezgi"],
  pl: ["Miłość", "Praca", "Energia", "Intuicja"],
  ru: ["Любовь", "Работа", "Энергия", "Интуиция"],
  ja: ["恋愛", "仕事", "エネルギー", "直感"],
  ar: ["الحب", "العمل", "الطاقة", "الحدس"],
};

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function signSlug(value: string): string {
  const normalized = value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return SIGN_SLUGS[normalized] || "belier";
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { t, locale } = useT();
  const { user } = useAuth();
  const profile = useUserProfile();
  const { firstName, astrology, numerology, isPremium } = profile;
  const [daily, setDaily] = useState<DailyHoroscope | null>(null);
  const [dailyUnavailable, setDailyUnavailable] = useState(false);
  const [hooks, setHooks] = useState<OracleHook[]>(() => getPersonalizedHooks([], 5));
  const [currentHookIndex, setCurrentHookIndex] = useState(0);
  const now = useMemo(() => new Date(), []);
  const labels = SECTION_LABELS[locale] || SECTION_LABELS.en;
  const todayPersonalDay = personalDay(numerology.personalYear2026, now.getMonth() + 1, now.getDate());

  useEffect(() => {
    if (profile.isLoading || profile.isDemo) return;
    let cancelled = false;
    const loadDaily = async () => {
      try {
        const response = await fetch(`https://karmastro.com/api/horoscope/${dateKey(now)}.json`);
        if (!response.ok) throw new Error(`daily_${response.status}`);
        const payload = await response.json();
        const localized = payload[locale] || payload.en || payload.fr;
        const result = localized?.[signSlug(astrology.sunSign.sign)] as DailyHoroscope | undefined;
        if (!result?.intro) throw new Error("daily_missing_sign");
        if (!cancelled) setDaily(result);
      } catch (error) {
        console.warn("[dashboard] daily horoscope unavailable", error);
        if (!cancelled) setDailyUnavailable(true);
      }
    };
    loadDaily();
    return () => { cancelled = true; };
  }, [astrology.sunSign.sign, locale, now, profile.isDemo, profile.isLoading]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("oracle_conversations")
      .select("title")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (!data?.length) return;
        setHooks(getPersonalizedHooks(data.map((conversation) => conversation.title || "").filter(Boolean), 5));
      });
  }, [user]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentHookIndex((index) => (index + 1) % Math.max(hooks.length, 1));
    }, 5000);
    return () => window.clearInterval(interval);
  }, [hooks.length]);

  const currentHook = hooks[currentHookIndex] || hooks[0];
  const sections = daily ? [
    { icon: Heart, label: labels[0], content: daily.love, color: "text-pink-300" },
    { icon: Zap, label: labels[1], content: daily.work, color: "text-amber-300" },
    { icon: Sparkles, label: labels[2], content: daily.energy, color: "text-purple-300" },
    { icon: Moon, label: labels[3], content: daily.intuition, color: "text-blue-300" },
  ] : [];

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader
        title={t("dashboard.greeting", { firstName })}
        rightContent={
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <ZodiacSymbol sign={astrology.sunSign.sign} size={16} color="#D4A017" />
              {isPremium && <Crown className="h-3.5 w-3.5 text-amber-300" aria-label={t("dashboard.premium_label")} />}
            </div>
            <p className="text-xs font-mono text-primary">
              {t("dashboard.badge_cv", { number: numerology.lifePath.number })} · {t("dashboard.personal_day_pill", { n: todayPersonalDay })}
            </p>
          </div>
        }
      />

      <main className="relative z-10 px-5 space-y-5 pt-2 max-w-3xl mx-auto">
        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-glow glow-violet rounded-2xl bg-card/80 backdrop-blur-sm p-5"
        >
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-amber-300/80 mb-1">
                {new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now)}
              </p>
              <h2 className="font-serif text-xl">{t("dashboard.rdv_title")}</h2>
            </div>
            <span className="shrink-0 rounded-full bg-primary/15 text-primary px-2.5 py-1 text-xs font-mono">
              {t("dashboard.personal_day_pill", { n: todayPersonalDay })}
            </span>
          </div>

          {!daily && !dailyUnavailable && (
            <div className="space-y-3 animate-pulse" aria-label="Chargement">
              <div className="h-3 rounded bg-white/10 w-full" />
              <div className="h-3 rounded bg-white/10 w-11/12" />
              <div className="h-3 rounded bg-white/10 w-4/5" />
            </div>
          )}

          {dailyUnavailable && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">{t("dashboard.cosmic_tip_default")}</p>
              <Button variant="outline" onClick={() => navigate("/oracle")}>{t("dashboard.quick_oracle")}</Button>
            </div>
          )}

          {daily && (
            <>
              <p className="text-sm text-foreground/85 leading-relaxed">{daily.intro}</p>
              {daily.mantra && (
                <blockquote className="mt-4 border-l-2 border-amber-300/50 pl-3 font-serif text-sm text-amber-100/90 italic">
                  « {daily.mantra} »
                </blockquote>
              )}
              <div className="grid sm:grid-cols-2 gap-3 mt-5">
                {sections.map(({ icon: Icon, label, content, color }) => (
                  <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Icon className={`h-4 w-4 ${color}`} />
                      <h3 className="text-xs font-semibold uppercase tracking-wide">{label}</h3>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{content}</p>
                  </div>
                ))}
              </div>
              {(daily.luckyNumber || daily.color) && (
                <div className="flex flex-wrap gap-2 mt-4 text-[11px] text-muted-foreground">
                  {daily.luckyNumber && <span className="rounded-full bg-secondary px-2.5 py-1">✦ {daily.luckyNumber}</span>}
                  {daily.color && <span className="rounded-full bg-secondary px-2.5 py-1">● {daily.color}</span>}
                </div>
              )}
            </>
          )}
        </motion.section>

        {currentHook && (
          <section className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-5">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="h-4 w-4 text-primary" />
              <h2 className="font-serif text-lg">{t("dashboard.quick_oracle")}</h2>
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentHookIndex}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm leading-relaxed mb-4"
              >
                <span className="mr-2">{currentHook.emoji}</span>{currentHook.text}
              </motion.p>
            </AnimatePresence>
            <Button className="w-full" onClick={() => navigate("/oracle")}>
              {currentHook.cta} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </section>
        )}

        {!isPremium && (
          <section className="rounded-2xl bg-gradient-to-r from-accent/15 via-primary/15 to-accent/15 border border-accent/30 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-accent" />
              <h2 className="font-serif text-lg">{t("dashboard.cta_banner_title")}</h2>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5 mb-4">
              <li>✦ {t("pricing.tier_etoile_f1")}</li>
              <li>✦ {t("pricing.tier_etoile_f2")}</li>
              <li>✦ {t("pricing.tier_etoile_f3")}</li>
            </ul>
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/pricing")}>
              <Star className="h-4 w-4 mr-2" /> {t("dashboard.cta_etoile")}
            </Button>
          </section>
        )}

        <section>
          <h2 className="font-serif text-lg mb-3">{t("dashboard.quick_access_title")}</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: User, label: t("dashboard.quick_astral"), path: "/astral" },
              { icon: Hash, label: t("dashboard.quick_numerology"), path: "/numerology" },
              { icon: Heart, label: t("dashboard.quick_compat"), path: "/compatibility" },
              { icon: MessageCircle, label: t("dashboard.quick_oracle"), path: "/oracle" },
              { icon: Calendar, label: t("dashboard.quick_calendar"), path: "/calendar" },
              { icon: BookOpen, label: t("dashboard.quick_learn"), path: "/learn" },
            ].map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="border-glow rounded-xl bg-card/40 p-3 text-center hover:bg-card/60 transition-colors min-h-20"
              >
                <Icon className="h-5 w-5 mx-auto mb-1.5 text-primary" />
                <span className="text-xs leading-tight">{label}</span>
              </button>
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;

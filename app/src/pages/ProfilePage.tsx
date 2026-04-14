import { useEffect, useState } from "react";
import { Sparkles, Star, Hash, Moon, Zap, BookOpen, Share2, Copy, Check, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AppFooter from "@/components/AppFooter";
import StarField from "@/components/StarField";
import AppHeader from "@/components/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";
import { useT } from "@/i18n/ui";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { t, locale } = useT();
  const profile = useUserProfile();
  const { astrology, numerology, firstName, lastName, birthDate, birthTime, birthPlace } = profile;
  const { user } = useAuth();
  const { toast } = useToast();

  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [badges, setBadges] = useState<string[]>([]);
  const [validatedCount, setValidatedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    // Fetch referral code + badges
    (supabase as any)
      .from("profiles")
      .select("referral_code, badges")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.referral_code) setReferralCode(data.referral_code);
        if (Array.isArray(data?.badges)) setBadges(data.badges);
      });

    // Fetch referral stats via RPC
    (supabase as any)
      .rpc("get_referral_stats", { p_user_id: user.id })
      .then(({ data }: any) => {
        if (Array.isArray(data) && data[0]) {
          setValidatedCount(Number(data[0].validated_count) || 0);
          setPendingCount(Number(data[0].pending_count) || 0);
        }
      });
  }, [user?.id]);

  const shareUrl = referralCode ? `https://karmastro.com/?ref=${referralCode}` : "";
  const shareText = referralCode ? t("profile.share_text") : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: t("profile.toast_link_copied_title"), description: t("profile.toast_link_copied_desc") });
    } catch {}
  };

  const handleShare = async () => {
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: t("profile.share_title"), text: shareText, url: shareUrl });
        return;
      } catch {}
    }
    handleCopy();
  };

  const nextBadge = validatedCount < 3 ? { target: 3, name: t("profile.badge_eclaireur") }
    : validatedCount < 10 ? { target: 10, name: t("profile.badge_guide") }
    : validatedCount < 25 ? { target: 25, name: t("profile.badge_constellation") }
    : validatedCount < 100 ? { target: 100, name: t("profile.badge_nebuleuse") }
    : null;

  const BADGE_META: Record<string, { name: string; icon: string; color: string }> = {
    eclaireur_cosmique: { name: t("profile.badge_eclaireur"), icon: "✦", color: "text-amber-300 border-amber-300/40" },
    guide_des_etoiles: { name: t("profile.badge_guide"), icon: "★", color: "text-purple-300 border-purple-300/40" },
    constellation_vivante: { name: t("profile.badge_constellation"), icon: "✧", color: "text-pink-300 border-pink-300/40" },
    nebuleuse_maitresse: { name: t("profile.badge_nebuleuse"), icon: "❋", color: "text-emerald-300 border-emerald-300/40" },
  };

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title={t("profile.header_title")} showBack />

      <div className="relative z-10 px-5 space-y-5">
        {/* Cosmic ID card */}
        <div className="border-glow glow-violet rounded-xl bg-card/80 p-6 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-serif text-2xl">{firstName} {lastName}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {birthDate.toLocaleDateString(locale)} · {birthTime} · {birthPlace}
          </p>

          <div className="flex justify-center gap-6 mt-4">
            <div className="text-center flex flex-col items-center">
              <ZodiacSymbol sign={astrology.sunSign.sign} size={32} color="#D4A017" />
              <p className="text-[10px] text-muted-foreground">{astrology.sunSign.sign}</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <ZodiacSymbol sign={astrology.moonSign.sign} size={32} color="#8B5CF6" />
              <p className="text-[10px] text-muted-foreground">{astrology.moonSign.sign || "-"}</p>
            </div>
            <div className="text-center flex flex-col items-center">
              <ZodiacSymbol sign={astrology.ascendant.sign} size={32} color="#60A5FA" />
              <p className="text-[10px] text-muted-foreground">Asc. {astrology.ascendant.sign || "-"}</p>
            </div>
          </div>

          <div className="flex justify-center gap-4 mt-4 text-sm">
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <span className="font-mono text-primary text-lg">{numerology.lifePath.number}</span>
              <p className="text-[10px] text-muted-foreground">Chemin de vie</p>
            </div>
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <span className="font-mono text-primary text-lg">{numerology.personalYear2026}</span>
              <p className="text-[10px] text-muted-foreground">{t("profile.year_label", { year: new Date().getFullYear() })}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg px-3 py-2">
              <span className="font-mono text-primary text-lg">{numerology.expression.number}</span>
              <p className="text-[10px] text-muted-foreground">Expression</p>
            </div>
          </div>

          {numerology.karmicDebts.length > 0 && (
            <p className="text-xs text-accent mt-3">{t("profile.karmic_debt", { list: numerology.karmicDebts.join(", ") })}</p>
          )}
          {numerology.northNode && (
            <p className="text-xs text-muted-foreground mt-2">
              {t("profile.north_node", { sign: numerology.northNode.sign, house: numerology.northNode.house, lesson: numerology.northNode.lesson })}
            </p>
          )}
        </div>

        {/* Referral card */}
        {referralCode && (
          <div className="rounded-xl border border-amber-300/20 bg-gradient-to-br from-amber-300/5 to-purple-400/5 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-amber-300" />
              <h3 className="font-serif text-lg">{t("profile.referral_title")}</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
              {t("profile.referral_intro")}
            </p>

            <div className="flex items-center gap-2 mb-3 p-3 rounded-lg bg-[#0f0a1e]/60 border border-white/10">
              <span className="flex-1 font-mono text-lg text-amber-300 text-center tracking-wider">{referralCode}</span>
            </div>

            <div className="flex gap-2 mb-4">
              <button
                onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 text-xs border border-amber-300/40 text-amber-300 rounded-lg px-3 py-2 hover:bg-amber-300/10 transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? t("profile.copied") : t("profile.copy_link")}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center gap-2 text-xs bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold rounded-lg px-3 py-2 hover:opacity-90 transition-opacity"
              >
                <Share2 className="h-3.5 w-3.5" />
                {t("profile.share")}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs pt-3 border-t border-white/10">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>
                  {t("profile.godchildren_count", { n: validatedCount })}
                  {pendingCount > 0 && (
                    <span className="text-muted-foreground/60"> · {t("profile.pending_count", { n: pendingCount })}</span>
                  )}
                </span>
              </div>
              {nextBadge && (
                <span className="text-amber-300/80">
                  {t("profile.next_badge", { n: nextBadge.target - validatedCount, badge: nextBadge.name })}
                </span>
              )}
              {!nextBadge && (
                <span className="text-amber-300">{t("profile.all_badges_done")}</span>
              )}
            </div>

            {badges.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs uppercase tracking-wider text-muted-foreground/60 mb-2">{t("profile.badges_title")}</p>
                <div className="flex flex-wrap gap-2">
                  {badges.map((badge) => {
                    const meta = BADGE_META[badge];
                    if (!meta) return null;
                    return (
                      <span
                        key={badge}
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full border bg-background/40 ${meta.color}`}
                      >
                        <span>{meta.icon}</span>
                        <span>{meta.name}</span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quick links */}
        <div className="space-y-2">
          {[
            { icon: Star, label: t("profile.quick_astral_full"), path: "/astral" },
            { icon: Hash, label: t("profile.quick_numero_full"), path: "/numerology" },
            { icon: Moon, label: t("profile.quick_calendar"), path: "/calendar" },
            { icon: Zap, label: t("profile.quick_compat"), path: "/compatibility" },
            { icon: BookOpen, label: t("profile.quick_learn"), path: "/learn" },
          ].map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center gap-3 border-glow rounded-lg bg-card/40 p-4 hover:bg-card/60 transition-colors text-left"
            >
              <item.icon className="h-5 w-5 text-primary" />
              <span className="text-sm">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AppFooter />
      <BottomNav />
    </div>
  );
};

export default ProfilePage;

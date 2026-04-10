import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Sparkles, Check, Star, Heart, Package, Zap } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CHECKOUT_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/stripe-checkout";

// Locale detection from navigator + pricing display per locale
function detectLocale(): string {
  if (typeof navigator === "undefined") return "fr";
  const lang = navigator.language?.slice(0, 2).toLowerCase() || "fr";
  const supported = ["fr", "en", "es", "pt", "de", "it", "tr", "pl", "ja", "ar", "ru"];
  return supported.includes(lang) ? lang : "en";
}

// Currency mapping matches edge function LOCALE_CURRENCY
const LOCALE_CURRENCY: Record<string, { code: string; symbol: string; symbolBefore: boolean; rate: number; zeroDecimal: boolean }> = {
  fr: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  es: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  pt: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  de: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  it: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  en: { code: "USD", symbol: "$", symbolBefore: true, rate: 1.08, zeroDecimal: false },
  tr: { code: "TRY", symbol: "₺", symbolBefore: false, rate: 37, zeroDecimal: false },
  pl: { code: "PLN", symbol: "zł", symbolBefore: false, rate: 4.3, zeroDecimal: false },
  ja: { code: "JPY", symbol: "¥", symbolBefore: true, rate: 165, zeroDecimal: true },
  ar: { code: "USD", symbol: "$", symbolBefore: true, rate: 1.08, zeroDecimal: false },
  ru: { code: "USD", symbol: "$", symbolBefore: true, rate: 1.08, zeroDecimal: false },
};

function formatPrice(eurAmount: number, locale: string): string {
  const currency = LOCALE_CURRENCY[locale] || LOCALE_CURRENCY.fr;
  const localAmount = eurAmount * currency.rate;
  const decimals = currency.zeroDecimal ? 0 : 2;
  const rounded = localAmount.toFixed(decimals);
  const [intPart, decPart] = rounded.split(".");
  const formatted = decPart ? `${intPart},${decPart}` : intPart;
  return currency.symbolBefore ? `${currency.symbol}${formatted}` : `${formatted}${currency.symbol}`;
}

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
  const [loading, setLoading] = useState<string | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [currentPlan, setCurrentPlan] = useState<CurrentPlan | null>(null);
  const [locale] = useState(() => detectLocale());

  useEffect(() => {
    if (!user?.id) return;
    (supabase as any)
      .from("profiles")
      .select("subscription_tier, subscription_status, credits, subscription_period_end")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: any) => {
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
      toast({ title: "Connexion requise", description: "Crée un compte pour débloquer cette offre.", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setLoading(priceKey);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Session expirée");

      const res = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceKey,
          locale,
          successUrl: `${window.location.origin}/dashboard?checkout=success`,
          cancelUrl: `${window.location.origin}/pricing?checkout=canceled`,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error || "Impossible de créer la session");
      }

      window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Erreur checkout", description: e.message, variant: "destructive" });
      setLoading(null);
    }
  };

  const isCurrentTier = (tier: string) => currentPlan?.tier === tier && currentPlan?.status === "active";

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />
      <AppHeader title="Tarifs" subtitle="Choisis ton chemin" showBack />

      <div className="relative z-10 px-5 space-y-5 max-w-2xl mx-auto">
        {/* Current plan indicator */}
        {currentPlan && currentPlan.tier !== "eveil" && (
          <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 text-center">
            <p className="text-xs text-primary">
              Tu es actuellement en{" "}
              <strong>
                {currentPlan.tier === "etoile"
                  ? "Étoile"
                  : currentPlan.tier === "ame_soeur"
                  ? "Âme Sœur"
                  : currentPlan.tier}
              </strong>
              {currentPlan.credits > 0 && <> · <strong>{currentPlan.credits} crédits</strong></>}
            </p>
          </div>
        )}

        {/* Billing period toggle */}
        <div className="flex justify-center">
          <div className="inline-flex p-1 rounded-xl bg-card/60 border border-border">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                billingPeriod === "monthly" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Mensuel
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-1.5 text-sm rounded-lg transition-colors ${
                billingPeriod === "annual" ? "bg-primary text-primary-foreground" : "text-muted-foreground"
              }`}
            >
              Annuel <span className="text-[10px] text-amber-300">-30%</span>
            </button>
          </div>
        </div>

        {/* Éveil (free) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl border border-border bg-card/40"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-serif text-xl">Éveil</h3>
            <span className="text-xs text-muted-foreground ml-auto">
              {isCurrentTier("eveil") || !currentPlan?.tier || currentPlan.tier === "eveil" ? "Plan actuel" : ""}
            </span>
          </div>
          <p className="text-2xl font-serif mb-3">
            Gratuit <span className="text-xs text-muted-foreground">offert par les astres</span>
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> Profil cosmique complet (thème natal + numérologie)</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> 3 messages Oracle par jour</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> Horoscope quotidien détaillé</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" /> Calendrier cosmique basique</li>
          </ul>
        </motion.div>

        {/* Étoile (subscription) - HIGHLIGHTED */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="relative p-6 rounded-2xl border-2 border-amber-300/60 bg-gradient-to-br from-purple-500/10 to-amber-300/10"
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-amber-300 text-[#0f0a1e] text-xs font-semibold">
            ★ Le plus populaire
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Star className="h-5 w-5 text-amber-300" />
            <h3 className="font-serif text-xl text-amber-300">Étoile</h3>
            {isCurrentTier("etoile") && <span className="text-xs text-primary ml-auto">Plan actuel</span>}
          </div>
          <div className="mb-3">
            {billingPeriod === "monthly" ? (
              <p className="text-3xl font-serif">
                {formatPrice(5.99, locale)} <span className="text-xs text-muted-foreground">/ mois</span>
              </p>
            ) : (
              <>
                <p className="text-3xl font-serif">
                  {formatPrice(49.99, locale)} <span className="text-xs text-muted-foreground">/ an</span>
                </p>
                <p className="text-xs text-amber-300/80">{formatPrice(4.16, locale)}/mois, économise 2 mois</p>
              </>
            )}
          </div>
          <ul className="space-y-1.5 text-sm text-foreground/90 mb-5">
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> Tout Éveil, plus :</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> Oracle illimité (4 guides au choix)</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> Compatibilité astro-numérologique illimitée</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> Calendrier cosmique détaillé (transits, rétrogrades)</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> Notifications transits en temps réel</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-amber-300 mt-0.5 shrink-0" /> Sans engagement, résiliable à tout moment</li>
          </ul>
          <button
            onClick={() => handleCheckout(billingPeriod === "monthly" ? "etoile_monthly" : "etoile_annual")}
            disabled={loading !== null || isCurrentTier("etoile")}
            className="w-full px-5 py-3 rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading === (billingPeriod === "monthly" ? "etoile_monthly" : "etoile_annual")
              ? "Chargement..."
              : isCurrentTier("etoile")
              ? "Plan actuel"
              : billingPeriod === "monthly"
              ? "Passer en Étoile"
              : "Étoile annuel - économise 20€"}
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
            <h3 className="font-serif text-xl text-pink-300">Âme Sœur</h3>
            <span className="text-xs text-muted-foreground ml-auto">Rituel unique</span>
          </div>
          <p className="text-2xl font-serif mb-3">
            {formatPrice(3.99, locale)} <span className="text-xs text-muted-foreground">une seule fois</span>
          </p>
          <ul className="space-y-1.5 text-sm text-muted-foreground mb-4">
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-pink-300 mt-0.5 shrink-0" /> Analyse karmique approfondie d'une relation</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-pink-300 mt-0.5 shrink-0" /> Synastrie astrologique complète</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-pink-300 mt-0.5 shrink-0" /> Compatibilité numérologique détaillée</li>
            <li className="flex items-start gap-2"><Check className="h-3.5 w-3.5 text-pink-300 mt-0.5 shrink-0" /> Guidance karmique personnalisée par Séléné</li>
          </ul>
          <button
            onClick={() => handleCheckout("ame_soeur")}
            disabled={loading !== null}
            className="w-full px-5 py-2.5 rounded-xl border border-pink-400/40 text-pink-300 font-medium hover:bg-pink-400/10 transition-colors disabled:opacity-50"
          >
            {loading === "ame_soeur" ? "Chargement..." : "Débloquer ce rituel"}
          </button>
        </motion.div>

        {/* Credit packs */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 pt-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground">Packs de crédits</h3>
          </div>
          <p className="text-xs text-muted-foreground">1 crédit = 1 consultation approfondie avec l'Oracle. Parfait pour les questions ponctuelles sans engagement.</p>

          <div className="grid grid-cols-3 gap-2">
            {[
              { key: "pack_lune", name: "Lune", credits: 10, price: formatPrice(4.99, locale), highlight: false },
              { key: "pack_soleil", name: "Soleil", credits: 35, price: formatPrice(11.99, locale), highlight: true },
              { key: "pack_cosmos", name: "Cosmos", credits: 100, price: formatPrice(29.99, locale), highlight: false },
            ].map((pack) => (
              <button
                key={pack.key}
                onClick={() => handleCheckout(pack.key)}
                disabled={loading !== null}
                className={`p-3 rounded-xl border transition-all text-center disabled:opacity-50 ${
                  pack.highlight
                    ? "border-amber-300/60 bg-amber-300/10 hover:bg-amber-300/15"
                    : "border-border bg-card/40 hover:bg-card/60"
                }`}
              >
                {pack.highlight && <p className="text-[9px] text-amber-300 mb-1">★ Best value</p>}
                <p className="font-serif text-base mb-0.5">{pack.name}</p>
                <p className="text-lg font-mono text-primary">{pack.credits}</p>
                <p className="text-[10px] text-muted-foreground">crédits</p>
                <p className="text-xs font-medium mt-1">{pack.price}</p>
              </button>
            ))}
          </div>
        </div>

        {/* FAQ mini */}
        <div className="p-5 rounded-2xl bg-card/40 border border-border space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <Zap className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Sans engagement</p>
              <p className="text-xs text-muted-foreground">Tu peux résilier ou changer de plan à tout moment depuis ton profil.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Paiement sécurisé par Stripe</p>
              <p className="text-xs text-muted-foreground">Aucune donnée bancaire stockée chez Karmastro. Compatible CB, Apple Pay, Google Pay.</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Heart className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Récompenses parrainage</p>
              <p className="text-xs text-muted-foreground">Invite tes proches et gagnez tous les deux des bonus. Voir ton code dans ton profil.</p>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PricingPage;

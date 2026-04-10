import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, ChevronDown, Moon, Hash, Zap, CheckCircle, XCircle, Star, MessageCircle, Calendar, User, BookOpen, Heart, Lock, Crown, ArrowRight, TrendingUp } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { dailyMessages } from "@/lib/demoData";
import { useUserProfile } from "@/hooks/useUserProfile";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";
import { getPersonalizedHooks, type OracleHook } from "@/lib/oracleHooks";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const today = dailyMessages[0];
const IS_PREMIUM = false; // Toggle for demo  -  will be replaced by real subscription check

const PremiumPill = ({ label = "Premium" }: { label?: string }) => (
  <span className="inline-flex items-center gap-1 rounded-full bg-accent/20 text-accent px-2 py-0.5 text-[10px] font-semibold">
    <Crown className="h-2.5 w-2.5" /> {label}
  </span>
);

const LockedOverlay = ({ children, cta = "Débloquer avec Premium" }: { children: React.ReactNode; cta?: string }) => {
  const navigate = useNavigate();
  if (IS_PREMIUM) return <>{children}</>;
  return (
    <div className="relative">
      <div className="blur-[6px] pointer-events-none select-none">{children}</div>
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/60 backdrop-blur-sm rounded-xl">
        <Lock className="h-5 w-5 text-accent mb-1.5" />
        <span className="text-[11px] text-muted-foreground mb-2">{cta}</span>
        <Button size="sm" variant="outline" className="border-accent text-accent text-xs h-7 px-3" onClick={() => navigate("/#pricing")}>
          <Crown className="h-3 w-3 mr-1" /> Étoile
        </Button>
      </div>
    </div>
  );
};

interface DoItem {
  text: string;
  why: string;
  isPremium?: boolean;
}

const DoListItem = ({ item, type }: { item: DoItem; type: "do" | "dont" }) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = type === "do" ? CheckCircle : XCircle;
  const iconColor = type === "do" ? "text-karmique-earth" : "text-destructive";

  const isLocked = item.isPremium && !IS_PREMIUM;

  return (
    <div className="mb-2.5">
      <button
        onClick={() => !isLocked && setExpanded(!expanded)}
        className="flex items-start gap-2 w-full text-left group"
      >
        <Icon className={`h-4 w-4 ${iconColor} mt-0.5 shrink-0`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs ${isLocked ? "blur-[4px]" : ""}`}>{item.text}</span>
            {item.isPremium && <PremiumPill />}
          </div>
        </div>
        {!isLocked && (
          <ChevronDown className={`h-3 w-3 text-muted-foreground shrink-0 mt-1 transition-transform ${expanded ? "rotate-180" : ""}`} />
        )}
      </button>
      <AnimatePresence>
        {expanded && !isLocked && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-1.5 ml-6 pl-0.5 border-l border-primary/30 py-1 px-2">
              {item.why}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [messageExpanded, setMessageExpanded] = useState(false);
  const { user } = useAuth();
  const userProfile = useUserProfile();
  const { firstName, astrology, numerology } = userProfile;

  // Fetch real conversation titles for personalized hooks
  const [hooks, setHooks] = useState<OracleHook[]>(() => getPersonalizedHooks([], 5));
  const [currentHookIndex, setCurrentHookIndex] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchConversations = async () => {
      const { data } = await supabase
        .from("oracle_conversations")
        .select("title")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(20);

      if (data && data.length > 0) {
        const titles = data.map(c => c.title || "").filter(Boolean);
        setHooks(getPersonalizedHooks(titles, 5));
      }
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentHookIndex(prev => (prev + 1) % hooks.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [hooks.length]);

  const currentHook = hooks[currentHookIndex];

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <StarField />

      <AppHeader
        title={`Bonjour ${firstName}`}
        rightContent={
          <div className="text-right">
            <div className="flex items-center gap-1 justify-end">
              <ZodiacSymbol sign={astrology.sunSign.sign} size={16} color="#D4A017" />
              {astrology.moonSign.sign && astrology.moonSign.sign !== "—" && (
                <ZodiacSymbol sign={astrology.moonSign.sign} size={14} color="#8B5CF6" />
              )}
              {astrology.ascendant.sign && astrology.ascendant.sign !== "—" && astrology.ascendant.sign !== "Inconnu" && (
                <ZodiacSymbol sign={astrology.ascendant.sign} size={14} color="#60A5FA" />
              )}
            </div>
            <p className="text-xs font-mono text-primary">CV {numerology.lifePath.number} · AP {numerology.personalYear2026}</p>
          </div>
        }
      />

      <div className="relative z-10 px-5 space-y-5 pt-2">
        {/* Daily RDV Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-glow glow-violet rounded-xl bg-card/80 backdrop-blur-sm p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-serif text-lg">Ton rendez-vous du jour</h2>
            <span className="text-xs text-muted-foreground">8 avr. 2026</span>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            <span className="bg-secondary rounded-full px-2.5 py-1">🌔 {today.moonSign}</span>
            <span className="bg-secondary rounded-full px-2.5 py-1">☿℞ Rétrograde</span>
            <span className="bg-primary/20 text-primary rounded-full px-2.5 py-1 font-mono">Jour {today.personalDay}</span>
            {!IS_PREMIUM && <PremiumPill label="3 sections verrouillées" />}
          </div>

          <p className="text-sm text-muted-foreground leading-relaxed">
            {messageExpanded ? today.message : today.message.slice(0, 300) + "..."}
          </p>
          
          <Button variant="ghost" size="sm" className="text-primary mt-2 -ml-2" onClick={() => setMessageExpanded(!messageExpanded)}>
            {messageExpanded ? "Réduire" : "Lire la suite"} <ChevronRight className={`h-3 w-3 transition-transform ${messageExpanded ? "rotate-90" : ""}`} />
          </Button>

          {/* Affirmation du jour */}
          {(today as any).affirmation && (
            <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-xs text-primary italic text-center">✨ « {(today as any).affirmation} »</p>
            </div>
          )}

          {/* Rotating Oracle Hook */}
          <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/15">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentHookIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="flex items-start gap-2"
              >
                <span className="text-lg shrink-0">{currentHook.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">{currentHook.text}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            {/* Dots indicator */}
            <div className="flex items-center justify-center gap-1 mt-2">
              {hooks.map((_, i) => (
                <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentHookIndex ? "w-4 bg-primary" : "w-1.5 bg-muted"}`} />
              ))}
            </div>
          </div>

          <Button size="sm" className="w-full mt-3 bg-primary/20 text-primary hover:bg-primary/30" onClick={() => navigate("/oracle")}>
            <MessageCircle className="h-4 w-4 mr-2" /> {currentHook.cta}
          </Button>
        </motion.div>

        {/* À faire / Éviter  -  ENRICHED */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="border-glow rounded-xl bg-card/80 backdrop-blur-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">À faire / Éviter</h3>
            <span className="text-[10px] text-muted-foreground">Appuyez pour le pourquoi</span>
          </div>

          <div className="mb-4">
            <p className="text-[10px] uppercase tracking-wider text-karmique-earth mb-2 font-semibold">✓ Faire aujourd'hui</p>
            {today.doList.map((item: DoItem) => (
              <DoListItem key={item.text} item={item} type="do" />
            ))}
          </div>

          <div className="border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-wider text-destructive mb-2 font-semibold">✗ Éviter aujourd'hui</p>
            {today.dontList.map((item: DoItem) => (
              <DoListItem key={item.text} item={item} type="dont" />
            ))}
          </div>
        </motion.div>

        {/* Sub-cards grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Energy */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-glow rounded-xl bg-card/60 p-4"
          >
            <div className="flex items-center gap-1.5 mb-3">
              <Zap className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium">Énergie du jour</span>
            </div>
            {Object.entries(today.energies).map(([key, val]) => (
              <div key={key} className="flex items-center gap-2 mb-1.5">
                <span className="text-[10px] text-muted-foreground w-16 capitalize">{key === "sante" ? "Santé" : key === "spiritualite" ? "Spiritu." : key.charAt(0).toUpperCase() + key.slice(1)}</span>
                <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${val * 10}%` }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                    className="h-full rounded-full bg-primary"
                  />
                </div>
                <span className="text-[10px] font-mono text-muted-foreground">{val}</span>
              </div>
            ))}
          </motion.div>

          {/* Personal day */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="border-glow rounded-xl bg-card/60 p-4 flex flex-col items-center justify-center text-center"
          >
            <Hash className="h-4 w-4 text-primary mb-1" />
            <span className="text-xs text-muted-foreground">Nombre du jour</span>
            <span className="text-4xl font-mono font-bold text-primary my-1">{today.personalDay}</span>
            <span className="text-xs text-muted-foreground">Achèvement</span>
            {(today as any).luckyNumbers && (
              <div className="mt-2 flex gap-1">
                {(today as any).luckyNumbers.map((n: number) => (
                  <span key={n} className="text-[10px] font-mono bg-primary/10 text-primary rounded-full w-5 h-5 flex items-center justify-center">{n}</span>
                ))}
              </div>
            )}
          </motion.div>

          {/* Moon */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="border-glow rounded-xl bg-card/60 p-4 text-center"
          >
            <Moon className="h-4 w-4 text-karmique-blue mx-auto mb-1" />
            <span className="text-xs text-muted-foreground">Lune du jour</span>
            <p className="text-lg mt-1">🌔</p>
            <p className="text-xs">{today.moonSign}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Gibbeuse croissante</p>
          </motion.div>

          {/* Cosmic Tip  -  NEW */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="border-glow border-glow-gold rounded-xl bg-card/60 p-4"
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium">Conseil cosmique</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {(today as any).cosmicTip || "Écoute ton intuition aujourd'hui  -  elle est ta meilleure alliée."}
            </p>
          </motion.div>
        </div>

        {/* Transits du jour  -  Premium gated */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="border-glow rounded-xl bg-card/80 backdrop-blur-sm p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-karmique-blue" />
              <h3 className="font-serif text-lg">Transits du jour</h3>
            </div>
            <PremiumPill label="2 sur 3" />
          </div>

          <div className="space-y-3">
            {today.transits.map((t: any, i: number) => {
              const isLocked = t.isPremium && !IS_PREMIUM;
              return (
                <div key={i} className={`rounded-lg p-3 ${isLocked ? "" : "bg-secondary/30"}`}>
                  {isLocked ? (
                    <LockedOverlay>
                      <div className="bg-secondary/30 rounded-lg p-3">
                        <p className="text-xs font-medium">{t.text}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{t.interpretation}</p>
                      </div>
                    </LockedOverlay>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium">{t.text}</p>
                        <Badge variant="secondary" className="text-[9px] h-4">{t.effect}</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{t.interpretation}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Premium CTA Banner */}
        {!IS_PREMIUM && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.35 }}
            className="rounded-xl bg-gradient-to-r from-accent/20 via-primary/20 to-accent/20 border border-accent/30 p-5 text-center"
          >
            <Crown className="h-6 w-6 text-accent mx-auto mb-2" />
            <h3 className="font-serif text-lg mb-1">Débloque ton potentiel complet</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Transits détaillés · Conseils karmiques exclusifs · Oracle illimité · Numérologie dynamique
            </p>
            <div className="flex flex-wrap gap-1.5 justify-center mb-4">
              <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5">Oracle illimité</span>
              <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5">Transits complets</span>
              <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5">Numérologie avancée</span>
              <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5">Conseils karmiques</span>
              <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5">Calendrier détaillé</span>
              <span className="text-[10px] bg-secondary rounded-full px-2 py-0.5">Compatibilité étendue</span>
            </div>
            <Button className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => navigate("/#pricing")}>
              <Star className="h-4 w-4 mr-2" /> Étoile  -  7,99€/mois
            </Button>
          </motion.div>
        )}

        {/* Quick access */}
        <div>
          <h3 className="font-serif text-lg mb-3">Accès rapides</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Star, label: "Profil astral", path: "/astral" },
              { icon: Hash, label: "Numérologie", path: "/numerology" },
              { icon: Heart, label: "Compatibilité", path: "/compatibility" },
              { icon: MessageCircle, label: "Oracle", path: "/oracle" },
              { icon: Calendar, label: "Calendrier", path: "/calendar" },
              { icon: BookOpen, label: "Apprendre", path: "/learn" },
            ].map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className="border-glow rounded-lg bg-card/40 p-3 text-center hover:bg-card/60 transition-colors"
              >
                <item.icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                <span className="text-xs">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* History */}
        <div>
          <h3 className="font-serif text-lg mb-3">Jours précédents</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-5 px-5">
            {dailyMessages.slice(1, 5).map((msg) => (
              <div
                key={msg.date}
                className="border-glow rounded-lg bg-card/40 p-3 min-w-[200px] shrink-0"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-muted-foreground">{msg.date.slice(5)}</span>
                  <span className="text-xs font-mono text-primary">J{msg.personalDay}</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-3">{msg.message.slice(0, 120)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;

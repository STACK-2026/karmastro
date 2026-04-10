import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, ArrowLeft, Moon, Zap, Calculator, Stars, Check } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { demoProfile } from "@/lib/demoData";
import { personalYear, personalMonth, personalDay } from "@/lib/numerology";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant"; content: string };

type GuideKey = "sibylle" | "orion" | "selene" | "pythia";

type GuideInfo = {
  key: GuideKey;
  name: string;
  title: string;
  description: string;
  strengths: string;
  icon: typeof Stars;
  color: string;
  opener: string;
  suggestions: string[];
};

const GUIDES: Record<GuideKey, GuideInfo> = {
  sibylle: {
    key: "sibylle",
    name: "Sibylle",
    title: "L'Oracle mystique",
    description: "Astrologue, poétique, profonde. Héritière des Sibylles antiques, prophétesses d'Apollon.",
    strengths: "Astrologie profonde · Sens de la vie · Mythologie",
    icon: Stars,
    color: "text-purple-300",
    opener: "Sibylle consulte les astres...",
    suggestions: [
      "Que me dit mon thème natal sur ma mission de vie ?",
      "Comment interpréter ma Lune en opposition à Pluton ?",
      "Que raconte mon Saturne en maison VII ?",
      "Quel sens donner à mes transits actuels ?",
    ],
  },
  orion: {
    key: "orion",
    name: "Orion",
    title: "Le coach cosmique",
    description: "Karmique, direct, motivant. Ancien prof de philosophie stoïcienne, chasseur du ciel.",
    strengths: "Carrière · Décisions · Discipline · Stoïcisme",
    icon: Zap,
    color: "text-amber-300",
    opener: "Orion scrute ta trajectoire...",
    suggestions: [
      "Est-ce le bon moment pour changer de travail ?",
      "Comment profiter au maximum de mon retour de Saturne ?",
      "Je procrastine sur un projet, que faire ?",
      "Quelle leçon karmique dois-je intégrer en ce moment ?",
    ],
  },
  selene: {
    key: "selene",
    name: "Séléné",
    title: "L'âme sœur cosmique",
    description: "Relationnelle, douce, empathique. Thérapeute inspirée de Séléné, déesse de la Lune.",
    strengths: "Amour · Relations · Émotions · Guérison",
    icon: Moon,
    color: "text-blue-300",
    opener: "Séléné écoute ton cœur...",
    suggestions: [
      "Est-ce que cette personne est mon âme sœur karmique ?",
      "Ma relation traverse une crise, que disent les astres ?",
      "Pourquoi je me sens bloquée émotionnellement ?",
      "Comment comprendre ma mère à travers son thème natal ?",
    ],
  },
  pythia: {
    key: "pythia",
    name: "Pythia",
    title: "La calculatrice cosmique",
    description: "Numérologue, analytique, précise. Mathématicienne dans la lignée de la Pythie de Delphes.",
    strengths: "Numérologie · Patterns · Calculs · Synchronicités",
    icon: Calculator,
    color: "text-emerald-300",
    opener: "Pythia calcule tes vibrations...",
    suggestions: [
      "Que signifie voir 22:22 partout depuis une semaine ?",
      "Explique-moi mon chemin de vie en détail",
      "Quelle est ma dette karmique et comment la résoudre ?",
      "Calcule ma compatibilité numérologique avec mon partenaire",
    ],
  },
};

const CHAT_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat";
const STORAGE_KEY = "karmastro_oracle_guide";

const OraclePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [guideKey, setGuideKey] = useState<GuideKey | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  // Load saved guide or show picker on first visit
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as GuideKey | null;
    if (saved && GUIDES[saved]) {
      setGuideKey(saved);
    } else {
      setShowPicker(true);
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const selectGuide = (key: GuideKey) => {
    setGuideKey(key);
    localStorage.setItem(STORAGE_KEY, key);
    setShowPicker(false);
    setMessages([]);
  };

  const currentGuide = guideKey ? GUIDES[guideKey] : null;

  // Build profile context for the Oracle
  const buildProfileContext = () => {
    const bd = demoProfile.birthDate;
    const now = new Date();
    const py = personalYear(bd.getDate(), bd.getMonth() + 1, now.getFullYear());
    const pm = personalMonth(py, now.getMonth() + 1);
    const pd = personalDay(py, now.getMonth() + 1, now.getDate());

    return {
      firstName: demoProfile.firstName,
      birthDate: "14/04/1992",
      birthTime: demoProfile.birthTime,
      birthPlace: demoProfile.birthPlace,
      sunSign: `${demoProfile.astrology.sunSign.sign} ${demoProfile.astrology.sunSign.symbol}`,
      moonSign: `${demoProfile.astrology.moonSign.sign} ${demoProfile.astrology.moonSign.symbol}`,
      ascendant: `${demoProfile.astrology.ascendant.sign} ${demoProfile.astrology.ascendant.symbol}`,
      lifePath: `${demoProfile.numerology.lifePath.number} (${demoProfile.numerology.lifePath.label})`,
      expression: `${demoProfile.numerology.expression.number} (${demoProfile.numerology.expression.label})`,
      soulUrge: `${demoProfile.numerology.soulUrge.number} (${demoProfile.numerology.soulUrge.label})`,
      personalYear: py,
      personalMonth: pm,
      personalDay: pd,
      karmicDebts: demoProfile.numerology.karmicDebts.length > 0 ? demoProfile.numerology.karmicDebts.join(", ") : "aucune",
      northNode: `${demoProfile.numerology.northNode.sign} M${demoProfile.numerology.northNode.house} - ${demoProfile.numerology.northNode.lesson}`,
    };
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || isLoading || !guideKey) return;

    const userMsg: Msg = { role: "user", content: msgText };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          profile: buildProfileContext(),
          guide: guideKey,
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `Erreur ${resp.status}`);
      }

      if (!resp.body) throw new Error("Pas de stream");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      toast({ title: `${currentGuide?.name || "Oracle"} est injoignable`, description: e.message, variant: "destructive" });
      if (!assistantSoFar) {
        setMessages(prev => [...prev, { role: "assistant", content: "Une perturbation cosmique m'empêche de te répondre. Réessaie dans un instant." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Guide picker modal
  if (showPicker || !currentGuide) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col relative">
        <StarField />
        <AppHeader title="L'Oracle" subtitle="Choisis ton guide" showBack />

        <div className="relative z-10 px-5 py-6 max-w-2xl mx-auto w-full">
          <div className="text-center mb-8">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="font-serif text-2xl mb-2">À qui veux-tu parler ?</h2>
            <p className="text-sm text-muted-foreground">
              Quatre guides, quatre voix, quatre façons d'éclairer ton chemin. Choisis celui qui résonne avec ce que tu cherches aujourd'hui.
            </p>
          </div>

          <div className="grid gap-3">
            {(Object.values(GUIDES) as GuideInfo[]).map((g) => {
              const Icon = g.icon;
              const isActive = guideKey === g.key;
              return (
                <motion.button
                  key={g.key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => selectGuide(g.key)}
                  className={`text-left p-5 rounded-2xl border transition-all ${
                    isActive
                      ? "bg-primary/10 border-primary"
                      : "bg-secondary/30 border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`mt-1 shrink-0 p-2.5 rounded-xl bg-background/50 ${g.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-serif text-lg">{g.name}</h3>
                        <span className="text-xs text-muted-foreground">· {g.title}</span>
                        {isActive && <Check className="h-4 w-4 text-primary ml-auto" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{g.description}</p>
                      <p className={`text-xs ${g.color}`}>{g.strengths}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground/60 text-center mt-6">
            Tu pourras changer de guide à tout moment depuis le chat.
          </p>
        </div>

        <BottomNav />
      </div>
    );
  }

  const Icon = currentGuide.icon;

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col relative">
      <StarField />

      <AppHeader title={currentGuide.name} subtitle={currentGuide.title} showBack />

      {/* Guide switcher pill */}
      <div className="relative z-10 px-5 pt-2">
        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border/60 hover:border-primary/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-1.5 rounded-lg bg-background/50 ${currentGuide.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm">
              Tu parles à <span className="font-medium">{currentGuide.name}</span>
            </span>
          </div>
          <span className="text-xs text-muted-foreground">Changer</span>
        </button>
      </div>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-10">
            <Icon className={`h-12 w-12 ${currentGuide.color} mx-auto mb-4 opacity-60`} />
            <h2 className="font-serif text-xl mb-2">{currentGuide.name} t'écoute</h2>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
              {currentGuide.description}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div className={
              msg.role === "user"
                ? "bg-secondary rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%]"
                : "bg-primary/10 border border-primary/20 rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%]"
            }>
              {msg.role === "assistant" && (
                <p className={`text-xs mb-1 font-medium flex items-center gap-1 ${currentGuide.color}`}>
                  <Icon className="h-3 w-3" /> {currentGuide.name}
                </p>
              )}
              {msg.role === "assistant" ? (
                <div className="text-sm prose prose-invert prose-sm max-w-none leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm">{msg.content}</p>
              )}
            </div>
          </motion.div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-primary/10 border border-primary/20 rounded-2xl rounded-bl-sm px-4 py-3">
              <p className={`text-xs mb-1 font-medium flex items-center gap-1 ${currentGuide.color}`}>
                <Icon className="h-3 w-3 animate-spin" /> {currentGuide.name}
              </p>
              <p className="text-sm text-muted-foreground">{currentGuide.opener}</p>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 px-5 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentGuide.suggestions.map(s => (
            <button
              key={s}
              onClick={() => handleSend(s)}
              className="text-xs border border-primary/30 text-primary rounded-full px-3 py-1.5 whitespace-nowrap hover:bg-primary/10 transition-colors shrink-0"
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-10 px-5 pb-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={`Pose ta question à ${currentGuide.name}...`}
            className="bg-secondary border-border"
            disabled={isLoading}
          />
          <Button size="icon" onClick={() => handleSend()} className="bg-primary hover:bg-primary/90 shrink-0" disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default OraclePage;

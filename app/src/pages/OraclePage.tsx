import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, ArrowLeft, Moon, Zap, Calculator, Stars, Check } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { personalYear, personalMonth, personalDay } from "@/lib/numerology";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import ReactMarkdown from "react-markdown";

type Msg = { role: "user" | "assistant" | "paywall"; content: string };

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
const SESSION_KEY = "karmastro_oracle_session";

// Get or create an anonymous session id (for users not signed in)
function getSessionId(): string {
  let sid = localStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

type FeedbackState = {
  status: "idle" | "expanded" | "submitted";
  rating?: 1 | 2 | 3;
};

const FEEDBACK_OPTIONS = [
  { rating: 3 as const, emoji: "✨", label: "Ça résonne", color: "border-emerald-400/40 hover:bg-emerald-400/10 text-emerald-300" },
  { rating: 2 as const, emoji: "⭐", label: "Intéressant, dis-m'en plus", color: "border-amber-300/40 hover:bg-amber-300/10 text-amber-300" },
  { rating: 1 as const, emoji: "🌑", label: "Pas cette fois", color: "border-pink-400/40 hover:bg-pink-400/10 text-pink-300" },
];

const OraclePage = () => {
  const userProfile = useUserProfile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [guideKey, setGuideKey] = useState<GuideKey | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [feedback, setFeedback] = useState<Record<number, FeedbackState>>({});
  const [feedbackText, setFeedbackText] = useState<Record<number, string>>({});

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
    setFeedback({});
    setFeedbackText({});
  };

  // Submit feedback for an assistant message
  const submitFeedback = async (messageIndex: number, rating: 1 | 2 | 3, text?: string) => {
    if (!guideKey) return;
    const assistantMsg = messages[messageIndex];
    const userMsg = messages[messageIndex - 1];
    if (!assistantMsg || assistantMsg.role !== "assistant") return;

    try {
      const payload = {
        user_id: user?.id ?? null,
        session_id: user?.id ? null : getSessionId(),
        guide: guideKey,
        rating,
        text: text?.trim() || null,
        user_message: userMsg?.content?.slice(0, 500) ?? null,
        assistant_message: assistantMsg.content.slice(0, 2000),
      };
      const { error } = await supabase.from("oracle_feedback" as any).insert(payload);
      if (error) throw error;

      setFeedback((prev) => ({ ...prev, [messageIndex]: { status: "submitted", rating } }));
      if (text?.trim()) {
        toast({ title: "Merci pour ton retour", description: "Ta voix aide " + (currentGuide?.name || "l'Oracle") + " à mieux te guider." });
      }
    } catch (e: any) {
      console.error("Feedback submit error:", e);
      toast({ title: "Retour non enregistré", description: "Réessaie dans un instant.", variant: "destructive" });
    }
  };

  const handleFeedbackClick = (messageIndex: number, rating: 1 | 2 | 3) => {
    // Expand the textarea first if user clicked a rating
    setFeedback((prev) => ({ ...prev, [messageIndex]: { status: "expanded", rating } }));
  };

  const handleFeedbackSubmit = (messageIndex: number) => {
    const state = feedback[messageIndex];
    if (!state || !state.rating) return;
    submitFeedback(messageIndex, state.rating, feedbackText[messageIndex]);
  };

  const handleFeedbackSkip = (messageIndex: number) => {
    const state = feedback[messageIndex];
    if (!state || !state.rating) return;
    submitFeedback(messageIndex, state.rating);
  };

  const currentGuide = guideKey ? GUIDES[guideKey] : null;

  // Build profile context for the Oracle (uses real user profile from Supabase)
  const buildProfileContext = () => {
    const bd = userProfile.birthDate;
    const now = new Date();
    const py = personalYear(bd.getDate(), bd.getMonth() + 1, now.getFullYear());
    const pm = personalMonth(py, now.getMonth() + 1);
    const pd = personalDay(py, now.getMonth() + 1, now.getDate());
    const { astrology: a, numerology: n } = userProfile;

    return {
      firstName: userProfile.firstName,
      birthDate: bd.toLocaleDateString("fr-FR"),
      birthTime: userProfile.birthTime,
      birthPlace: userProfile.birthPlace,
      sunSign: `${a.sunSign.sign} ${a.sunSign.symbol}`,
      moonSign: `${a.moonSign.sign} ${a.moonSign.symbol}`,
      ascendant: `${a.ascendant.sign} ${a.ascendant.symbol}`,
      lifePath: `${n.lifePath.number} (${n.lifePath.label})`,
      expression: `${n.expression.number} (${n.expression.label})`,
      soulUrge: `${n.soulUrge.number} (${n.soulUrge.label})`,
      personalYear: py,
      personalMonth: pm,
      personalDay: pd,
      karmicDebts: n.karmicDebts.length > 0 ? n.karmicDebts.join(", ") : "aucune",
      northNode: `${n.northNode.sign} M${n.northNode.house} - ${n.northNode.lesson}`,
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
          userId: user?.id ?? null,
          sessionId: user?.id ? null : getSessionId(),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));

        // Paywall (402) : show inline CTA instead of toast error
        if (resp.status === 402 && errData.paywall) {
          setMessages((prev) => [
            ...prev,
            {
              role: "paywall",
              content: errData.paywall.message || "Tu as atteint ta limite quotidienne.",
            },
          ]);
          return;
        }

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

        {messages.map((msg, i) => {
          // Paywall card
          if (msg.role === "paywall") {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex justify-center"
              >
                <div className="w-full max-w-md p-5 rounded-2xl border border-amber-300/30 bg-gradient-to-br from-purple-500/10 to-amber-300/10 text-center">
                  <Sparkles className="h-8 w-8 text-amber-300 mx-auto mb-2" />
                  <h3 className="font-serif text-lg mb-2">Les astres ne dorment jamais</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{msg.content}</p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      onClick={() => navigate("/pricing")}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Passer en Étoile · 5,99€/mois
                    </button>
                    <button
                      onClick={() => navigate("/pricing")}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-amber-300/40 text-amber-300 font-medium text-sm hover:bg-amber-300/10 transition-colors"
                    >
                      Recharger en crédits
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          }

          const fb = feedback[i];
          const showFeedback =
            msg.role === "assistant" &&
            // Only show feedback for completed messages (not the currently streaming one if loading)
            !(isLoading && i === messages.length - 1);

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={msg.role === "user" ? "flex justify-end" : "flex justify-start flex-col items-start"}
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

              {showFeedback && (
                <div className="mt-2 max-w-[85%] w-full">
                  {(!fb || fb.status === "idle") && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-muted-foreground/60 self-center mr-1">
                        Cette lecture t'a parlé ?
                      </span>
                      {FEEDBACK_OPTIONS.map((opt) => (
                        <button
                          key={opt.rating}
                          onClick={() => handleFeedbackClick(i, opt.rating)}
                          className={`text-[11px] border rounded-full px-2.5 py-1 transition-colors ${opt.color}`}
                        >
                          {opt.emoji} {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {fb?.status === "expanded" && (
                    <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {fb.rating === 3 && "Heureux que ça t'ait parlé."}
                        {fb.rating === 2 && "Dis-moi ce qui manquait, j'affine."}
                        {fb.rating === 1 && "Explique-moi pour que je fasse mieux."}
                        <span className="text-muted-foreground/50"> (optionnel)</span>
                      </p>
                      <textarea
                        value={feedbackText[i] || ""}
                        onChange={(e) => setFeedbackText((prev) => ({ ...prev, [i]: e.target.value }))}
                        placeholder="Ton retour en quelques mots..."
                        rows={2}
                        maxLength={500}
                        className="w-full text-sm bg-background/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleFeedbackSkip(i)}
                          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
                        >
                          Passer
                        </button>
                        <button
                          onClick={() => handleFeedbackSubmit(i)}
                          className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 font-medium"
                        >
                          Envoyer
                        </button>
                      </div>
                    </div>
                  )}

                  {fb?.status === "submitted" && (
                    <p className="text-[11px] text-muted-foreground/60 italic">
                      Merci, ton retour a été transmis à {currentGuide.name}.
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

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

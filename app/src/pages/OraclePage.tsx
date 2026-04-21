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
import { trackEvent } from "@/lib/tracker";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import ReactMarkdown from "react-markdown";
import { useT, type UiKey } from "@/i18n/ui";

type Msg = { role: "user" | "assistant" | "paywall"; content: string };

type GuideKey = "sibylle" | "orion" | "selene" | "pythia";

type GuideMeta = {
  key: GuideKey;
  icon: typeof Stars;
  color: string;
  nameKey: UiKey;
  titleKey: UiKey;
  descKey: UiKey;
  strengthsKey: UiKey;
  openerKey: UiKey;
  suggestionKeys: [UiKey, UiKey, UiKey, UiKey];
};

const GUIDES: Record<GuideKey, GuideMeta> = {
  sibylle: {
    key: "sibylle",
    icon: Stars,
    color: "text-purple-300",
    nameKey: "oracle.guide_sibylle_name",
    titleKey: "oracle.guide_sibylle_title",
    descKey: "oracle.guide_sibylle_desc",
    strengthsKey: "oracle.guide_sibylle_strengths",
    openerKey: "oracle.guide_sibylle_opener",
    suggestionKeys: [
      "oracle.guide_sibylle_sugg1",
      "oracle.guide_sibylle_sugg2",
      "oracle.guide_sibylle_sugg3",
      "oracle.guide_sibylle_sugg4",
    ],
  },
  orion: {
    key: "orion",
    icon: Zap,
    color: "text-amber-300",
    nameKey: "oracle.guide_orion_name",
    titleKey: "oracle.guide_orion_title",
    descKey: "oracle.guide_orion_desc",
    strengthsKey: "oracle.guide_orion_strengths",
    openerKey: "oracle.guide_orion_opener",
    suggestionKeys: [
      "oracle.guide_orion_sugg1",
      "oracle.guide_orion_sugg2",
      "oracle.guide_orion_sugg3",
      "oracle.guide_orion_sugg4",
    ],
  },
  selene: {
    key: "selene",
    icon: Moon,
    color: "text-blue-300",
    nameKey: "oracle.guide_selene_name",
    titleKey: "oracle.guide_selene_title",
    descKey: "oracle.guide_selene_desc",
    strengthsKey: "oracle.guide_selene_strengths",
    openerKey: "oracle.guide_selene_opener",
    suggestionKeys: [
      "oracle.guide_selene_sugg1",
      "oracle.guide_selene_sugg2",
      "oracle.guide_selene_sugg3",
      "oracle.guide_selene_sugg4",
    ],
  },
  pythia: {
    key: "pythia",
    icon: Calculator,
    color: "text-emerald-300",
    nameKey: "oracle.guide_pythia_name",
    titleKey: "oracle.guide_pythia_title",
    descKey: "oracle.guide_pythia_desc",
    strengthsKey: "oracle.guide_pythia_strengths",
    openerKey: "oracle.guide_pythia_opener",
    suggestionKeys: [
      "oracle.guide_pythia_sugg1",
      "oracle.guide_pythia_sugg2",
      "oracle.guide_pythia_sugg3",
      "oracle.guide_pythia_sugg4",
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

const FEEDBACK_OPTIONS: Array<{ rating: 1 | 2 | 3; emoji: string; labelKey: UiKey; color: string }> = [
  { rating: 3, emoji: "✨", labelKey: "oracle.feedback_resonates", color: "border-emerald-400/40 hover:bg-emerald-400/10 text-emerald-300" },
  { rating: 2, emoji: "⭐", labelKey: "oracle.feedback_interesting", color: "border-amber-300/40 hover:bg-amber-300/10 text-amber-300" },
  { rating: 1, emoji: "🌑", labelKey: "oracle.feedback_not_now", color: "border-pink-400/40 hover:bg-pink-400/10 text-pink-300" },
];

const OraclePage = () => {
  const userProfile = useUserProfile();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useT();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
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

      trackEvent("oracle_feedback_submitted", { guide: guideKey, rating, has_text: Boolean(text?.trim()) });
      setFeedback((prev) => ({ ...prev, [messageIndex]: { status: "submitted", rating } }));
      if (text?.trim()) {
        const guideName = currentGuide ? t(currentGuide.nameKey) : t("oracle.header_title");
        toast({ title: t("oracle.feedback_toast_title"), description: t("oracle.feedback_toast_desc", { name: guideName }) });
      }
    } catch (e: any) {
      console.error("Feedback submit error:", e);
      toast({ title: t("oracle.feedback_error_title"), description: t("oracle.feedback_error_desc"), variant: "destructive" });
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
    let responseOk = false;

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
          conversationId,
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
              content: errData.paywall.message || t("oracle.paywall_default_msg"),
            },
          ]);
          return;
        }

        throw new Error(errData.error || t("oracle.error_generic", { status: resp.status }));
      }

      if (!resp.body) throw new Error(t("oracle.error_no_stream"));

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
            if (parsed.conversation_id && !conversationId) {
              setConversationId(parsed.conversation_id);
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              responseOk = true;
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
      const guideName = currentGuide ? t(currentGuide.nameKey) : t("oracle.header_title");
      toast({ title: t("oracle.error_unreachable", { name: guideName }), description: e.message, variant: "destructive" });
      if (!assistantSoFar) {
        setMessages(prev => [...prev, { role: "assistant", content: t("oracle.error_fallback_msg") }]);
      }
    } finally {
      setIsLoading(false);
      if (responseOk) {
        trackEvent("oracle_message_sent", {
          guide: guideKey,
          message_length: msgText.length,
          conversation_depth: messages.length,
          conversation_id: conversationId,
        });
      }
    }
  };

  // Guide picker modal
  if (showPicker || !currentGuide) {
    return (
      <div className="min-h-screen bg-background pb-20 flex flex-col relative">
        <StarField />
        <AppHeader title={t("oracle.header_title")} subtitle={t("oracle.header_subtitle_picker")} showBack />

        <div className="relative z-10 px-5 py-6 max-w-2xl mx-auto w-full">
          <div className="text-center mb-8">
            <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
            <h2 className="font-serif text-2xl mb-2">{t("oracle.picker_title")}</h2>
            <p className="text-sm text-muted-foreground">
              {t("oracle.picker_subtitle")}
            </p>
          </div>

          <div className="grid gap-3">
            {(Object.values(GUIDES) as GuideMeta[]).map((g) => {
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
                        <h3 className="font-serif text-lg">{t(g.nameKey)}</h3>
                        <span className="text-xs text-muted-foreground">· {t(g.titleKey)}</span>
                        {isActive && <Check className="h-4 w-4 text-primary ml-auto" />}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{t(g.descKey)}</p>
                      <p className={`text-xs ${g.color}`}>{t(g.strengthsKey)}</p>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground/60 text-center mt-6">
            {t("oracle.picker_change_note")}
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

      <AppHeader title={t(currentGuide.nameKey)} subtitle={t(currentGuide.titleKey)} showBack />

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
              {t("oracle.guide_pill_talking_to", { name: t(currentGuide.nameKey) })}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">{t("oracle.guide_pill_change")}</span>
        </button>
      </div>

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-10">
            <Icon className={`h-12 w-12 ${currentGuide.color} mx-auto mb-4 opacity-60`} />
            <h2 className="font-serif text-xl mb-2">{t("oracle.empty_listens", { name: t(currentGuide.nameKey) })}</h2>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto">
              {t(currentGuide.descKey)}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          // Paywall "portail cosmique" : rotating conic halo behind a calm
          // central card. The halo only animates outside of reduced-motion.
          if (msg.role === "paywall") {
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.7, ease: [0.2, 0.65, 0.3, 1] }}
                className="flex justify-center my-2"
              >
                <div className="relative w-full max-w-md">
                  {/* Conic halo layer, motion-safe only */}
                  <div
                    aria-hidden="true"
                    className="absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl motion-safe:animate-[oracle-portal-spin_22s_linear_infinite]"
                    style={{
                      background:
                        "conic-gradient(from 0deg, rgba(212,160,23,0.25), rgba(139,92,246,0.22), rgba(212,160,23,0.06), rgba(139,92,246,0.22), rgba(212,160,23,0.25))",
                    }}
                  />
                  {/* Inner card : parchment + gold rim + soft aura */}
                  <div className="relative oracle-parchment oracle-aura rounded-2xl p-6 text-center overflow-hidden">
                    <motion.div
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.25, duration: 0.6, ease: "backOut" }}
                      className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-3"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(212,160,23,0.35) 0%, rgba(212,160,23,0.1) 60%, transparent 100%)",
                      }}
                    >
                      <Sparkles className="h-6 w-6 text-amber-300" />
                    </motion.div>
                    <h3 className="font-serif text-xl mb-2 text-gradient-gold">{t("oracle.paywall_title")}</h3>
                    <p className="text-sm text-white/70 mb-5 leading-relaxed">{msg.content}</p>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() => navigate("/pricing")}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold text-sm hover:opacity-90 transition-opacity glow-gold"
                      >
                        {t("oracle.paywall_cta_etoile")}
                      </button>
                      <button
                        onClick={() => navigate("/pricing")}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-amber-300/40 text-amber-300 font-medium text-sm hover:bg-amber-300/10 transition-colors"
                      >
                        {t("oracle.paywall_cta_credits")}
                      </button>
                    </div>
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

          const isUser = msg.role === "user";
          // Only "complete" assistant bubbles breathe. The currently streaming
          // one stays still so the text delta isn't blurred by the animation.
          const isStreamingAssistant =
            msg.role === "assistant" && isLoading && i === messages.length - 1;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0.65, 0.3, 1] }}
              className={isUser ? "flex justify-end" : "flex justify-start flex-col items-start"}
            >
              {isUser ? (
                <div className="bg-secondary/70 backdrop-blur-sm rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] border border-white/5">
                  <p className="text-sm text-white/90">{msg.content}</p>
                </div>
              ) : (
                <div
                  className={
                    "relative oracle-parchment rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] overflow-hidden " +
                    (isStreamingAssistant ? "" : "oracle-breathing")
                  }
                >
                  {/* Gold sweep on first mount, decorative only */}
                  <span aria-hidden="true" className="oracle-shimmer-sweep" />
                  <p className={`relative text-xs mb-1 font-medium flex items-center gap-1.5 ${currentGuide.color}`}>
                    <Icon className="h-3 w-3" />
                    <span className="tracking-wide uppercase text-[10px]">{t(currentGuide.nameKey)}</span>
                  </p>
                  <div className="relative text-sm prose prose-invert prose-sm max-w-none leading-relaxed [&_p]:my-1 [&_ul]:my-1 [&_li]:my-0 [&_em]:text-amber-200/90 [&_strong]:text-amber-100 [&_blockquote]:border-l-2 [&_blockquote]:border-amber-300/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-amber-100/85">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                </div>
              )}

              {showFeedback && (
                <div className="mt-2 max-w-[85%] w-full">
                  {(!fb || fb.status === "idle") && (
                    <div className="flex flex-wrap gap-1.5">
                      <span className="text-[10px] text-muted-foreground/60 self-center mr-1">
                        {t("oracle.feedback_prompt")}
                      </span>
                      {FEEDBACK_OPTIONS.map((opt) => (
                        <button
                          key={opt.rating}
                          onClick={() => handleFeedbackClick(i, opt.rating)}
                          className={`text-[11px] border rounded-full px-2.5 py-1 transition-colors ${opt.color}`}
                        >
                          {opt.emoji} {t(opt.labelKey)}
                        </button>
                      ))}
                    </div>
                  )}

                  {fb?.status === "expanded" && (
                    <div className="p-3 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
                      <p className="text-xs text-muted-foreground">
                        {fb.rating === 3 && t("oracle.feedback_expanded_r3")}
                        {fb.rating === 2 && t("oracle.feedback_expanded_r2")}
                        {fb.rating === 1 && t("oracle.feedback_expanded_r1")}
                        <span className="text-muted-foreground/50"> {t("oracle.feedback_optional")}</span>
                      </p>
                      <textarea
                        value={feedbackText[i] || ""}
                        onChange={(e) => setFeedbackText((prev) => ({ ...prev, [i]: e.target.value }))}
                        placeholder={t("oracle.feedback_placeholder")}
                        rows={2}
                        maxLength={500}
                        className="w-full text-sm bg-background/50 border border-border rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50 resize-none"
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleFeedbackSkip(i)}
                          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5"
                        >
                          {t("oracle.feedback_skip")}
                        </button>
                        <button
                          onClick={() => handleFeedbackSubmit(i)}
                          className="text-xs bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-3 py-1.5 font-medium"
                        >
                          {t("oracle.feedback_send")}
                        </button>
                      </div>
                    </div>
                  )}

                  {fb?.status === "submitted" && (
                    <p className="text-[11px] text-muted-foreground/60 italic">
                      {t("oracle.feedback_submitted", { name: t(currentGuide.nameKey) })}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex justify-start"
          >
            <div className="oracle-parchment rounded-2xl rounded-bl-sm px-4 py-3 min-w-[200px]">
              <p className={`text-xs mb-1.5 font-medium flex items-center gap-1.5 ${currentGuide.color}`}>
                <Icon className="h-3 w-3" />
                <span className="tracking-wide uppercase text-[10px]">{t(currentGuide.nameKey)}</span>
              </p>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" style={{ animation: "oracle-star-pulse-1 1.8s ease-in-out infinite" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" style={{ animation: "oracle-star-pulse-2 1.8s ease-in-out infinite" }} />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-300" style={{ animation: "oracle-star-pulse-3 1.8s ease-in-out infinite" }} />
                </div>
                <p className="text-xs text-amber-100/70 italic">{t(currentGuide.openerKey)}</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <div className="relative z-10 px-5 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {currentGuide.suggestionKeys.map(sk => {
            const s = t(sk);
            return (
              <button
                key={sk}
                onClick={() => handleSend(s)}
                className="text-xs border border-primary/30 text-primary rounded-full px-3 py-1.5 whitespace-nowrap hover:bg-primary/10 transition-colors shrink-0"
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div className="relative z-10 px-5 pb-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={t("oracle.input_placeholder", { name: t(currentGuide.nameKey) })}
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

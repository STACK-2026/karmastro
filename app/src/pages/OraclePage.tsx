import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Stars } from "lucide-react";
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
import {
  oracleEntryViewedEvent,
  oracleActivationContinuationDeliveredEvent,
  oracleCategorySelectedEvent,
  oracleFirstQuestionSubmittedEvent,
  oracleFeedbackSubmittedEvent,
  oracleHandoffClickEvent,
  oraclePendingTurnCreatedEvent,
  oraclePostContinuationMessageEvent,
  oraclePaywallEvents,
  oracleResponseEvents,
  oracleSignupWallCtaClickedEvent,
  oracleSignupWallViewedEvent,
  type OracleTrackingEvent,
} from "@/lib/oracle-analytics";
import BottomNav from "@/components/BottomNav";
import StarField from "@/components/StarField";
import { EtoilePassCard } from "@/components/EtoilePassCard";
import ReactMarkdown from "react-markdown";
import { useT, type UiKey } from "@/i18n/ui";
import { getErrorMessage } from "@/lib/errors";
import { shouldAutoScrollOracle } from "@/lib/oracle-scroll";
import {
  oracleSignupPath,
  shouldShowOracleSignupHandoff,
} from "@/lib/oracle-signup-handoff";
import {
  assignPendingTurnId,
  formatOracleAvailability,
  normalizeOracleLimitResponse,
  type OracleLimitSurface,
} from "@/lib/oracle-limit-state";

type Msg = {
  role: "user" | "assistant" | "paywall";
  content: string;
  pendingTurnId?: string;
  // Only set on role === "paywall". True means the hit came from an anon
  // session , we surface a "create an account" CTA first instead of pricing.
  isAnonPaywall?: boolean;
};

type GuideKey = "oracle";
type OracleCategory = "clarity_decision" | "relationship" | "work_direction" | "self_understanding";

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
  // Oracle unique sans nom (décision 29/05 : 4 guides -> 1 voix). desc/strengths
  // ne sont plus affichés (plus de picker) mais restent typés.
  oracle: {
    key: "oracle",
    icon: Stars,
    color: "text-purple-300",
    nameKey: "oracle.name_unique",
    titleKey: "oracle.title_unique",
    descKey: "oracle.guide_sibylle_desc",
    strengthsKey: "oracle.guide_sibylle_strengths",
    openerKey: "oracle.opener_unique",
    suggestionKeys: [
      "oracle.guide_sibylle_sugg1",
      "oracle.guide_sibylle_sugg2",
      "oracle.guide_sibylle_sugg3",
      "oracle.guide_sibylle_sugg4",
    ],
  },
};

const CHAT_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat";
const HISTORY_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-history";
const PENDING_TURN_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/pending-turn";
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

function trackOracleEvents(events: OracleTrackingEvent[]) {
  events.forEach((event) => { void trackEvent(event.name, event.properties); });
}

const OraclePage = () => {
  const userProfile = useUserProfile();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t } = useT();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<OracleCategory | null>(null);
  const [claimVersion, setClaimVersion] = useState(0);
  const [historyHydrated, setHistoryHydrated] = useState(false);
  const [pendingTurn, setPendingTurn] = useState<{
    id: string;
    text: string;
    wallType: OracleLimitSurface;
    nextAvailableAt: string;
  } | null>(null);
  const [pendingDraft, setPendingDraft] = useState("");
  const [pendingEditing, setPendingEditing] = useState(false);
  const [pendingProfileRequired, setPendingProfileRequired] = useState(false);
  const [pendingAvailabilityNow, setPendingAvailabilityNow] = useState(() => Date.now());
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const pendingAutoRef = useRef<string | null>(null);
  const continuationDeliveredAtRef = useRef<number | null>(null);
  const confirmPendingTurnRef = useRef<(
    turn: NonNullable<typeof pendingTurn>,
    automatic?: boolean,
  ) => Promise<void>>(async () => {});

  const [guideKey] = useState<GuideKey>("oracle");
  const [feedback, setFeedback] = useState<Record<number, FeedbackState>>({});
  const [feedbackText, setFeedbackText] = useState<Record<number, string>>({});
  // Follow-up chips parsed from the ---SUGGESTIONS--- block of each assistant
  // reply. Keyed by the assistant message index. Cleared when that suggestion
  // has been clicked (we don't want stale chips lingering).
  const [suggestions, setSuggestions] = useState<Record<number, string[]>>({});
  // Short recap of the user's prior conversation(s). Sent back to oracle-chat
  // so Claude can open with "the last time we spoke you were asking about…"
  // instead of a cold start. Hydrated by oracle-history at mount.
  const [priorSummary, setPriorSummary] = useState<string | null>(null);
  const [hasPriorConversations, setHasPriorConversations] = useState(false);
  // Engine status returned by the last oracle-chat reply. When degraded/offline
  // we surface a subtle banner so the user knows their reading is partial
  // and we don't silently pretend everything is fine.
  const [engineStatus, setEngineStatus] = useState<"ok" | "degraded" | "offline">("ok");
  useEffect(() => {
    const event = oracleEntryViewedEvent();
    void trackEvent(event.name, event.properties);
  }, []);

  useEffect(() => {
    const previousCount = previousMessageCountRef.current;
    const nextCount = messages.length;
    previousMessageCountRef.current = nextCount;

    if (shouldAutoScrollOracle(previousCount, nextCount)) {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "auto" });
    }
  }, [messages.length]);

  useEffect(() => {
    const refreshAfterClaim = () => setClaimVersion((version) => version + 1);
    window.addEventListener("karmastro:oracle-claimed", refreshAfterClaim);
    return () => window.removeEventListener("karmastro:oracle-claimed", refreshAfterClaim);
  }, []);

  // Rehydrate the user's last oracle conversation at mount so the chat isn't
  // a cold start on every page load. Recent threads (<7 days) are brought
  // back in full; older ones stay as a summary-only memory injected into the
  // next system prompt via `priorSummary`.
  useEffect(() => {
    if (!guideKey) return;
    let cancelled = false;
    setHistoryHydrated(false);
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
        const resp = await fetch(HISTORY_URL, {
          method: "POST",
          headers,
          body: JSON.stringify({
            sessionId: user?.id ? null : getSessionId(),
            guide: guideKey,
          }),
        });
        if (!resp.ok || cancelled) return;
        const data = await resp.json();
        if (cancelled) return;
        setHasPriorConversations((data.prior_conversations ?? 0) > 0);
        if (data.summary) setPriorSummary(data.summary);
        if (data.conversation?.id && Array.isArray(data.messages) && data.messages.length > 0) {
          setConversationId(data.conversation.id);
          setMessages(data.messages.map((m: { role: "user" | "assistant"; content: string }) => ({
            role: m.role,
            content: m.content,
          })));
        }
      } catch (e) {
        console.warn("[oracle-history] hydrate failed", e);
      } finally {
        if (!cancelled) setHistoryHydrated(true);
      }
    })();
    return () => { cancelled = true; };
    // Re-run when the user logs in/out or picks a different guide.
  }, [guideKey, user?.id, claimVersion]);

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
      const { error } = await supabase.from("oracle_feedback").insert(payload);
      if (error) throw error;

      const feedbackEvent = oracleFeedbackSubmittedEvent({
        guide: guideKey,
        rating,
        hasText: Boolean(text?.trim()),
      });
      void trackEvent(feedbackEvent.name, feedbackEvent.properties);
      setFeedback((prev) => ({ ...prev, [messageIndex]: { status: "submitted", rating } }));
      if (text?.trim()) {
        const guideName = currentGuide ? t(currentGuide.nameKey) : t("oracle.header_title");
        toast({ title: t("oracle.feedback_toast_title"), description: t("oracle.feedback_toast_desc", { name: guideName }) });
      }
    } catch (e: unknown) {
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

  const currentGuide = GUIDES[guideKey];

  const handleOracleSignup = () => {
    const event = oracleHandoffClickEvent("signup");
    void trackEvent(event.name, event.properties);
    navigate(oracleSignupPath(getSessionId()));
  };

  // Build profile context for the Oracle. Only fill in real user data. When
  // the profile is the demo stub (user not authenticated or profile empty),
  // return an empty object so the oracle never invents a name / birth chart.
  const buildProfileContext = () => {
    if (userProfile.isDemo || userProfile.isLoading) return {};

    const bd = userProfile.birthDate;
    const now = new Date();
    const py = personalYear(bd.getDate(), bd.getMonth() + 1, now.getFullYear());
    const pm = personalMonth(py, now.getMonth() + 1);
    const pd = personalDay(py, now.getMonth() + 1, now.getDate());
    const { astrology: a, numerology: n } = userProfile;

    return {
      firstName: userProfile.firstName,
      birthDate: `${bd.getFullYear()}-${String(bd.getMonth() + 1).padStart(2, "0")}-${String(bd.getDate()).padStart(2, "0")}`,
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

  const handleSend = async (
    text?: string,
    options: {
      pendingTurnId?: string;
      activationContinuation?: boolean;
      automatic?: boolean;
    } = {},
  ) => {
    const msgText = text || input;
    if (!msgText.trim() || isLoading || !guideKey) return;

    const userMsg: Msg = { role: "user", content: msgText };
    const lastMessage = messages[messages.length - 1];
    const reusesQueuedMessage = Boolean(
      options.pendingTurnId
      && lastMessage?.role === "user"
      && lastMessage.pendingTurnId === options.pendingTurnId,
    );
    const requestMessages = reusesQueuedMessage ? messages : [...messages, userMsg];
    const priorUserTurns = Math.max(
      0,
      requestMessages.filter((message) => message.role === "user").length - 1,
    );
    const continuationDeliveredAt = continuationDeliveredAtRef.current;
    if (
      !options.automatic
      && continuationDeliveredAt
      && Date.now() - continuationDeliveredAt <= 30 * 60 * 1000
    ) {
      const event = oraclePostContinuationMessageEvent();
      void trackEvent(event.name, event.properties);
      continuationDeliveredAtRef.current = null;
    }
    if (priorUserTurns === 0) {
      const event = oracleFirstQuestionSubmittedEvent({ source: "app", category: selectedCategory });
      void trackEvent(event.name, event.properties);
    }
    if (!reusesQueuedMessage) setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    let assistantSoFar = "";
    let responseOk = false;
    let resolvedConversationId = conversationId;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (user && !session) throw new Error(t("pricing.checkout_session_expired"));
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: requestMessages.map(m => ({ role: m.role, content: m.content })),
          profile: buildProfileContext(),
          guide: guideKey,
          sessionId: user?.id ? null : getSessionId(),
          conversationId,
          priorSummary: requestMessages.length === 1 ? priorSummary : null,
          category: selectedCategory,
          pendingTurnId: options.pendingTurnId,
          requestId: crypto.randomUUID(),
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));

        // Paywall (402) : show inline CTA instead of toast error
        if (resp.status === 402 && errData.paywall) {
          setPendingProfileRequired(false);
          const limit = normalizeOracleLimitResponse(errData.paywall);
          trackOracleEvents(oraclePaywallEvents({
            isAnon: Boolean(errData.paywall.is_anon),
            turn: priorUserTurns + 1,
          }));
          if (limit) {
            setMessages((current) => {
              const lastIndex = current.length - 1;
              const last = current[lastIndex];
              if (
                last?.role !== "user"
                || last.content.replace(/\s+/g, " ").trim()
                  !== msgText.replace(/\s+/g, " ").trim()
              ) {
                return current;
              }
              return assignPendingTurnId(current, limit.pendingTurnId, lastIndex);
            });
            setPendingTurn({
              id: limit.pendingTurnId,
              text: msgText.trim(),
              wallType: limit.surface,
              nextAvailableAt: limit.nextAvailableAt,
            });
            setPendingDraft(msgText.trim());
            const pendingEvent = oraclePendingTurnCreatedEvent({
              surface: limit.surface,
            });
            void trackEvent(pendingEvent.name, pendingEvent.properties);
            if (limit.surface === "anonymous_signup_wall_v1") {
              const wallEvent = oracleSignupWallViewedEvent();
              void trackEvent(wallEvent.name, wallEvent.properties);
            }
            return;
          }
          setMessages((prev) => [
            ...prev,
            {
              role: "paywall",
              content: errData.paywall.message || t("oracle.paywall_default_msg"),
              isAnonPaywall: Boolean(errData.paywall.is_anon),
            },
          ]);
          return;
        }

        if (
          resp.status === 429
          && (errData.error === "promo_hourly_cap" || errData.error === "promo_total_cap")
        ) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: t("oracle.pass_fair_use_reached") },
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
              resolvedConversationId = parsed.conversation_id;
            }
            if (parsed.engine_status && parsed.engine_status !== engineStatus) {
              setEngineStatus(parsed.engine_status);
            }
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              responseOk = true;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                const nextMessages = last?.role === "assistant"
                  ? prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m)
                  : [...prev, { role: "assistant" as const, content: assistantSoFar }];
                // Attach the oracle's suggestions to this assistant bubble
                // so the 3 follow-up chips render right below it.
                if (Array.isArray(parsed.suggestions) && parsed.suggestions.length > 0) {
                  const idx = nextMessages.length - 1;
                  setSuggestions((s) => ({ ...s, [idx]: parsed.suggestions.slice(0, 3) }));
                }
                return nextMessages;
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: unknown) {
      const guideName = currentGuide ? t(currentGuide.nameKey) : t("oracle.header_title");
      toast({ title: t("oracle.error_unreachable", { name: guideName }), description: getErrorMessage(e), variant: "destructive" });
      if (!assistantSoFar) {
        setMessages(prev => [...prev, { role: "assistant", content: t("oracle.error_fallback_msg") }]);
      }
    } finally {
      setIsLoading(false);
      if (responseOk) {
        trackOracleEvents(oracleResponseEvents({
          guide: guideKey,
          messageLength: msgText.length,
          priorUserTurns,
          conversationId: resolvedConversationId,
        }));
        if (options.pendingTurnId) {
          setMessages((current) => current.map((message) =>
            message.pendingTurnId === options.pendingTurnId
              ? { role: message.role, content: message.content }
              : message
          ));
          setPendingTurn(null);
          setPendingDraft("");
          setPendingEditing(false);
        }
        if (options.activationContinuation) {
          continuationDeliveredAtRef.current = Date.now();
          const event = oracleActivationContinuationDeliveredEvent();
          void trackEvent(event.name, event.properties);
        }
      }
    }
  };

  const pendingAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error(t("pricing.checkout_session_expired"));
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    };
  };

  const confirmPendingTurn = async (
    turn: NonNullable<typeof pendingTurn>,
    automatic = false,
  ) => {
    if (isLoading) return;
    try {
      const response = await fetch(`${PENDING_TURN_URL}/confirm`, {
        method: "POST",
        headers: await pendingAuth(),
        body: JSON.stringify({ id: turn.id }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (data.error === "profile_incomplete") {
          setPendingProfileRequired(true);
        }
        if (data.next_available_at) {
          setPendingTurn((current) => current
            ? { ...current, nextAvailableAt: data.next_available_at }
            : current);
        }
        return;
      }
      setPendingProfileRequired(false);
      const confirmedText = typeof data.pending_turn?.text === "string"
        ? data.pending_turn.text
        : turn.text;
      await handleSend(confirmedText, {
        pendingTurnId: turn.id,
        activationContinuation: turn.wallType === "anonymous_signup_wall_v1",
        automatic,
      });
    } catch (error) {
      console.warn("[pending-turn] confirm failed", getErrorMessage(error));
    }
  };
  confirmPendingTurnRef.current = confirmPendingTurn;

  const savePendingTurn = async () => {
    if (!pendingTurn || !pendingDraft.trim()) return;
    try {
      const response = await fetch(PENDING_TURN_URL, {
        method: "PATCH",
        headers: await pendingAuth(),
        body: JSON.stringify({ id: pendingTurn.id, text: pendingDraft.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || typeof data.pending_turn?.text !== "string") return;
      const savedText = data.pending_turn.text;
      setPendingTurn((current) => current
        ? { ...current, text: savedText }
        : current);
      setMessages((current) => current.map((message) =>
        message.pendingTurnId === pendingTurn.id
          ? { ...message, content: savedText }
          : message
      ));
      setPendingEditing(false);
    } catch (error) {
      console.warn("[pending-turn] update failed", getErrorMessage(error));
    }
  };

  const deletePendingTurn = async () => {
    if (!pendingTurn) return;
    try {
      const response = await fetch(PENDING_TURN_URL, {
        method: "DELETE",
        headers: await pendingAuth(),
        body: JSON.stringify({ id: pendingTurn.id }),
      });
      if (!response.ok) return;
      setPendingTurn(null);
      setPendingProfileRequired(false);
      setPendingDraft("");
      setPendingEditing(false);
      setMessages((current) =>
        current.filter((message) => message.pendingTurnId !== pendingTurn.id)
      );
    } catch (error) {
      console.warn("[pending-turn] delete failed", getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (!user || !historyHydrated || userProfile.isLoading || isLoading) return;
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const response = await fetch(PENDING_TURN_URL, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
        });
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const turn = data.pending_turn;
        if (
          !turn
          || typeof turn.id !== "string"
          || typeof turn.text !== "string"
          || (turn.wall_type !== "anonymous_signup_wall_v1"
            && turn.wall_type !== "authenticated_interim_limit_v1")
          || typeof turn.next_available_at !== "string"
        ) {
          return;
        }
        const normalized = {
          id: turn.id,
          text: turn.text,
          wallType: turn.wall_type as OracleLimitSurface,
          nextAvailableAt: turn.next_available_at,
        };
        setPendingProfileRequired(false);
        setPendingTurn(normalized);
        setPendingDraft(turn.text);
        if (
          normalized.wallType === "anonymous_signup_wall_v1"
          && pendingAutoRef.current !== normalized.id
        ) {
          pendingAutoRef.current = normalized.id;
          await confirmPendingTurnRef.current(normalized, true);
        }
      } catch (error) {
        console.warn("[pending-turn] hydrate failed", getErrorMessage(error));
      }
    })();
    return () => { cancelled = true; };
  }, [historyHydrated, isLoading, user, userProfile.isLoading]);

  useEffect(() => {
    if (!pendingTurn || pendingTurn.wallType !== "authenticated_interim_limit_v1") return;
    const availableAt = Date.parse(pendingTurn.nextAvailableAt);
    if (!Number.isFinite(availableAt)) return;

    const now = Date.now();
    setPendingAvailabilityNow(now);
    const delay = availableAt - now;
    if (delay <= 0) return;

    const timer = window.setTimeout(
      () => setPendingAvailabilityNow(Date.now()),
      Math.min(delay + 50, 2_147_483_647),
    );
    return () => window.clearTimeout(timer);
  }, [pendingTurn]);

  const Icon = currentGuide.icon;
  const pendingAvailability = pendingTurn
    ? formatOracleAvailability(pendingTurn.nextAvailableAt, navigator.language)
    : null;
  const pendingIsAvailable = pendingTurn
    ? Date.parse(pendingTurn.nextAvailableAt) <= pendingAvailabilityNow
    : false;
  const pendingAvailabilityText = pendingAvailability
    ? t(
      pendingAvailability.relation === "today"
        ? "oracle.pending_available_today"
        : "oracle.pending_available_tomorrow",
      { time: pendingAvailability.time },
    )
    : "";

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col relative">
      <StarField />

      <AppHeader title={t(currentGuide.nameKey)} subtitle={t(currentGuide.titleKey)} showBack />

      <div className="relative z-10 px-5 pt-2">
        <EtoilePassCard />
      </div>

      {/* Subtle banner when the astral engine is partial. We prefer informing
          the user over pretending everything is fine. */}
      {engineStatus !== "ok" && (
        <div className="relative z-10 px-5 pt-2">
          <div className="flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-2 text-[11px] text-amber-200/80">
            <span aria-hidden="true">☽</span>
            <span>
              {engineStatus === "offline"
                ? t("oracle.engine_offline")
                : t("oracle.engine_degraded")}
            </span>
          </div>
        </div>
      )}

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-10 pb-2">
            <Icon className={`h-12 w-12 ${currentGuide.color} mx-auto mb-4 opacity-60`} />
            <h2 className="font-serif text-xl mb-2">{t("oracle.empty_listens", { name: t(currentGuide.nameKey) })}</h2>
            <p className="text-sm text-muted-foreground/70 max-w-md mx-auto mb-6">
              {t(currentGuide.titleKey)}
            </p>
            <p className="font-serif text-base text-amber-100/90 max-w-md mx-auto mb-4">
              {t("oracle.empty_opener_question", {
                name: userProfile.isDemo ? t("oracle.anon_appellation") : userProfile.firstName,
              })}
            </p>

            {/* Anonymous personalisation starts with a free account. Birth
                data belongs in onboarding, never in the public chat flow. */}
            {!authLoading && !user && (
              <div className="max-w-md mx-auto mb-4">
                <button
                  onClick={handleOracleSignup}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 px-4 py-3 text-sm font-semibold text-[#0f0a1e] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                >
                  {t("oracle.paywall_cta_signup")}
                </button>
                <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40 text-center">
                  {t("oracle.profile_form_or")}
                </p>
              </div>
            )}

            <div
              role="group"
              aria-label={t("oracle.empty_opener_question", {
                name: userProfile.isDemo ? t("oracle.anon_appellation") : userProfile.firstName,
              })}
              className="flex flex-col gap-2 max-w-md mx-auto"
            >
              {([
                ["clarity_decision", "oracle.empty_choice_lost"],
                ["relationship", "oracle.empty_choice_precise"],
                ["work_direction", "oracle.empty_choice_explore"],
                ["self_understanding", "oracle.guide_sibylle_sugg4"],
              ] as Array<[OracleCategory, UiKey]>).map(([category, labelKey]) => {
                const label = t(labelKey);
                const selected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      const next = selected ? null : category;
                      setSelectedCategory(next);
                      if (next) {
                        const event = oracleCategorySelectedEvent({ source: "app", category: next });
                        void trackEvent(event.name, event.properties);
                      }
                    }}
                    aria-label={label}
                    className={`text-sm text-left rounded-xl border hover:bg-amber-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 text-amber-100/90 px-4 py-3 transition-colors ${selected ? "border-amber-300/70 bg-amber-300/20" : "border-amber-300/30 bg-amber-300/5"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <p className="text-[11px] text-muted-foreground/50 mt-4">
              {t("oracle.empty_choice_hint")}
            </p>
          </div>
        )}

        {messages.map((msg, i) => {
          // The paywall is part of the conversation, so it remains static like
          // every other message. Decorative light must not move the text.
          if (msg.role === "paywall") {
            return (
              <div
                key={i}
                className="flex justify-center my-2"
              >
                <div className="relative w-full max-w-md">
                  {/* Static conic halo layer. */}
                  <div
                    aria-hidden="true"
                    className="absolute -inset-4 rounded-[2rem] opacity-60 blur-2xl"
                    style={{
                      background:
                        "conic-gradient(from 0deg, rgba(212,160,23,0.25), rgba(139,92,246,0.22), rgba(212,160,23,0.06), rgba(139,92,246,0.22), rgba(212,160,23,0.25))",
                    }}
                  />
                  {/* Inner card : static parchment + gold rim. */}
                  <div className="relative oracle-parchment rounded-2xl p-6 text-center overflow-hidden">
                    <div
                      className="inline-flex items-center justify-center h-12 w-12 rounded-full mb-3"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(212,160,23,0.35) 0%, rgba(212,160,23,0.1) 60%, transparent 100%)",
                      }}
                    >
                      <Sparkles className="h-6 w-6 text-amber-300" />
                    </div>
                    <h3 className="font-serif text-xl mb-2 text-gradient-gold">
                      {msg.isAnonPaywall ? t("oracle.signup_wall_title") : t("oracle.pending_title")}
                    </h3>
                    <p className="text-sm text-white/70 mb-5 leading-relaxed">{msg.content}</p>
                    {msg.isAnonPaywall ? (
                      <button
                        onClick={handleOracleSignup}
                        className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 text-[#0f0a1e] font-semibold text-sm hover:opacity-90 transition-opacity glow-gold"
                      >
                        {t("oracle.signup_wall_cta")}
                      </button>
                    ) : (
                      <button
                        onClick={() => navigate("/profile")}
                        className="w-full px-4 py-2.5 rounded-xl border border-amber-300/40 text-amber-300 font-medium text-sm hover:bg-amber-300/10 transition-colors"
                      >
                        {t("oracle.pending_explore_profile")}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          const fb = feedback[i];
          const showFeedback =
            msg.role === "assistant" &&
            // Only show feedback for completed messages (not the currently streaming one if loading)
            !(isLoading && i === messages.length - 1);

          const isUser = msg.role === "user";
          const isStreamingAssistant =
            msg.role === "assistant" && isLoading && i === messages.length - 1;

          return (
            <div
              key={i}
              className={isUser ? "flex justify-end" : "flex justify-start flex-col items-start"}
            >
              {isUser ? (
                <div className="bg-secondary/70 backdrop-blur-sm rounded-2xl rounded-br-sm px-4 py-3 max-w-[85%] border border-white/5">
                  <p className="text-sm text-white/90">{msg.content}</p>
                </div>
              ) : (
                <div className="relative oracle-parchment rounded-2xl rounded-bl-sm px-4 py-3 max-w-[85%] overflow-hidden">
                  <p className={`relative text-xs mb-1.5 font-medium flex items-center gap-1.5 ${currentGuide.color}`}>
                    <Icon className="h-3 w-3" />
                    <span className="tracking-wide uppercase text-[10px]">{t(currentGuide.nameKey)}</span>
                    <span aria-hidden="true" className="ml-1 text-amber-300/40">✦</span>
                  </p>
                  <div
                    className={
                      "relative text-sm prose prose-invert prose-sm max-w-none leading-relaxed " +
                      "[&_p]:my-1.5 [&_ul]:my-2 [&_ol]:my-2 [&_li]:my-0.5 " +
                      "[&_em]:text-amber-200/90 [&_em]:not-italic [&_em]:font-medium " +
                      "[&_strong]:text-amber-100 [&_strong]:font-semibold " +
                      "[&_ul]:list-none [&_ul]:pl-0 " +
                      "[&_ul>li]:pl-4 [&_ul>li]:relative [&_ul>li]:before:content-['✦'] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:text-amber-300/80 [&_ul>li]:before:text-[11px] " +
                      "[&_blockquote]:border-l-2 [&_blockquote]:border-amber-300/50 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-amber-100/85 [&_blockquote]:bg-amber-300/[0.03] [&_blockquote]:py-0.5 [&_blockquote]:my-2 " +
                      "[&_hr]:border-amber-300/20 [&_hr]:my-3 " +
                      "[&_h1]:font-serif [&_h1]:text-base [&_h1]:text-amber-100 [&_h1]:mt-3 [&_h1]:mb-1 " +
                      "[&_h2]:font-serif [&_h2]:text-base [&_h2]:text-amber-100 [&_h2]:mt-3 [&_h2]:mb-1 " +
                      "[&_h3]:font-serif [&_h3]:text-sm [&_h3]:text-amber-100/90 [&_h3]:mt-2 [&_h3]:mb-1 " +
                      "[&_code]:text-amber-200 [&_code]:bg-amber-950/40 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[11px]"
                    }
                  >
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                  {!isStreamingAssistant && (
                    <p className={`relative mt-2 pt-2 border-t border-amber-300/10 text-[9px] tracking-[0.2em] uppercase ${currentGuide.color} opacity-60 text-right`}>
                      ~ {t(currentGuide.nameKey)} ~
                    </p>
                  )}
                </div>
              )}

              {/* Follow-up chips : 3 suggestions parsed from the oracle's
                  ---SUGGESTIONS--- block. Click to send as next user message,
                  or ignore and type your own in the input below. */}
              {!isUser && !isStreamingAssistant && suggestions[i]?.length > 0 && (
                <div
                  role="group"
                  aria-label={t("oracle.chips_group_label")}
                  className="mt-2 max-w-[85%] w-full flex flex-wrap gap-1.5"
                >
                  {suggestions[i].map((s, si) => (
                    <button
                      key={si}
                      onClick={() => {
                        setSuggestions((prev) => {
                          const n = { ...prev };
                          delete n[i];
                          return n;
                        });
                        handleSend(s);
                      }}
                      disabled={isLoading}
                      aria-label={s}
                      className="text-[12px] text-left rounded-full border border-amber-300/30 bg-amber-300/5 hover:bg-amber-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 text-amber-100/90 px-3 py-1.5 transition-colors disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {shouldShowOracleSignupHandoff({
                isAuthenticated: Boolean(user),
                role: msg.role,
                isLatest: i === messages.length - 1,
                isLoading: isLoading || authLoading,
              }) && (
                <button
                  onClick={handleOracleSignup}
                  className="mt-2 max-w-[85%] w-full rounded-xl bg-gradient-to-r from-purple-400 to-amber-300 px-4 py-2.5 text-sm font-semibold text-[#0f0a1e] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
                >
                  {t("oracle.paywall_cta_signup")}
                </button>
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
                        aria-label={t("oracle.feedback_placeholder")}
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
            </div>
          );
        })}

        {pendingTurn && (
          <div className="flex justify-center my-2">
            <div className="relative w-full max-w-md oracle-parchment rounded-2xl p-5 text-center overflow-hidden">
              <Sparkles className="h-6 w-6 text-amber-300 mx-auto mb-2" />
              <h3 className="font-serif text-lg text-gradient-gold mb-2">
                {pendingTurn.wallType === "anonymous_signup_wall_v1"
                  ? t("oracle.signup_wall_title")
                  : t("oracle.pending_title")}
              </h3>
              <p className="text-sm text-white/70 mb-3 leading-relaxed">
                {pendingTurn.wallType === "anonymous_signup_wall_v1"
                  ? t("oracle.signup_wall_text")
                  : t("oracle.pending_text")}
              </p>
              {pendingTurn.wallType === "authenticated_interim_limit_v1" && pendingAvailabilityText && (
                <p className="text-xs text-amber-200/80 mb-3">{pendingAvailabilityText}</p>
              )}
              {pendingTurn.wallType === "anonymous_signup_wall_v1" && !user ? (
                <div className="space-y-3">
                  <p className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-left text-sm text-white/85">
                    {pendingTurn.text}
                  </p>
                  <Button type="button" className="w-full" onClick={() => {
                    const event = oracleSignupWallCtaClickedEvent();
                    void trackEvent(event.name, event.properties);
                    handleOracleSignup();
                  }}>
                    {t("oracle.signup_wall_cta")}
                  </Button>
                </div>
              ) : pendingEditing ? (
                <div className="space-y-2">
                  <textarea
                    value={pendingDraft}
                    onChange={(event) => setPendingDraft(event.target.value)}
                    maxLength={4000}
                    rows={3}
                    className="w-full rounded-xl border border-white/15 bg-black/20 px-3 py-2 text-sm text-white focus:border-amber-300/60 focus:outline-none"
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="flex-1" onClick={() => {
                      setPendingDraft(pendingTurn.text);
                      setPendingEditing(false);
                    }}>
                      {t("common.cancel")}
                    </Button>
                    <Button type="button" className="flex-1" onClick={savePendingTurn}>
                      {t("common.save")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="rounded-xl border border-white/10 bg-black/15 px-3 py-2 text-left text-sm text-white/85">
                    {pendingTurn.text}
                  </p>
                  {pendingProfileRequired && (
                    <div className="rounded-xl border border-amber-300/30 bg-amber-300/5 p-3">
                      <p className="mb-2 text-xs leading-relaxed text-amber-100/80">
                        {t("profile_boundary.description")}
                      </p>
                      <Button
                        type="button"
                        className="w-full"
                        onClick={() => navigate("/onboarding?next=/oracle&reason=oracle_pending")}
                      >
                        {t("profile_boundary.complete")}
                      </Button>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <Button type="button" variant="outline" onClick={() => setPendingEditing(true)}>
                      {t("oracle.pending_modify")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate("/profile")}>
                      {t("oracle.pending_explore_profile")}
                    </Button>
                    <Button type="button" variant="ghost" onClick={deletePendingTurn}>
                      {t("oracle.pending_delete")}
                    </Button>
                    <Button
                      type="button"
                      onClick={() => confirmPendingTurn(pendingTurn)}
                      disabled={
                        isLoading
                        || pendingProfileRequired
                        || (pendingTurn.wallType === "authenticated_interim_limit_v1"
                          && !pendingIsAvailable)
                      }
                    >
                      {t("oracle.pending_send")}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
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
          </div>
        )}
      </div>

      <div className="relative z-10 px-5 pb-4">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            maxLength={4000}
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

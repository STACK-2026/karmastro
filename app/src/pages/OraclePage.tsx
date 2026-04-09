import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, ArrowLeft } from "lucide-react";
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

const CHAT_URL = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/oracle-chat";

const OraclePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const suggestions = [
    "Est-ce que cette personne est mon âme sœur karmique ?",
    "Est-ce le bon moment pour changer de travail ?",
    "Que signifie voir 22:22 partout depuis une semaine ?",
    "Pourquoi je me sens bloquée en ce moment ?",
    "Ma relation traverse une crise  -  que disent les astres ?",
    "Comment s'est passée ma semaine d'un point de vue cosmique ?",
  ];

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
      northNode: `${demoProfile.numerology.northNode.sign} M${demoProfile.numerology.northNode.house}  -  ${demoProfile.numerology.northNode.lesson}`,
    };
  };

  const handleSend = async (text?: string) => {
    const msgText = text || input;
    if (!msgText.trim() || isLoading) return;

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
      toast({ title: "Erreur Oracle", description: e.message, variant: "destructive" });
      if (!assistantSoFar) {
        setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez dans un instant." }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 flex flex-col relative">
      <StarField />

      <AppHeader title="L'Oracle" subtitle="Astrologie · Numerologie · Karma" showBack />

      <div ref={scrollRef} className="relative z-10 flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center pt-16">
            <Sparkles className="h-12 w-12 text-primary/30 mx-auto mb-4" />
            <h2 className="font-serif text-xl text-muted-foreground mb-2">Posez votre question</h2>
            <p className="text-sm text-muted-foreground/70">L'Oracle croise votre thème astral, numérologie et guidance karmique</p>
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
                <p className="text-primary text-xs mb-1 font-medium flex items-center gap-1">
                  <Sparkles className="h-3 w-3" /> Oracle
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
              <p className="text-primary text-xs mb-1 font-medium flex items-center gap-1">
                <Sparkles className="h-3 w-3 animate-spin" /> Oracle
              </p>
              <p className="text-sm text-muted-foreground">Consultation des étoiles...</p>
            </div>
          </div>
        )}
      </div>

      <div className="relative z-10 px-5 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {suggestions.map(s => (
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
            placeholder="Posez votre question à l'Oracle..."
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

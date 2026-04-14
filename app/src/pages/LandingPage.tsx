import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Moon, Hash, Sparkles, MessageCircle, Calendar, Heart, Zap, BookOpen, ChevronRight, Check } from "lucide-react";
import SmartDateInput from "@/components/SmartDateInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { getZodiacSign, lifePathNumber, getNumberKeyword } from "@/lib/numerology";
import ZodiacWheel from "@/components/ZodiacWheel";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";
import { FlipCard } from "@/components/FlipCard";
import StarField from "@/components/StarField";
import AppFooter from "@/components/AppFooter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useT, type UiKey } from "@/i18n/ui";

gsap.registerPlugin(ScrollTrigger);

// Typing effect for Oracle preview. Strings live in i18n (ui.ts) and are resolved at render time.
const ORACLE_CONVERSATION_KEYS: { question: UiKey; answer: UiKey }[] = [
  { question: "landing.oracle_conv1_q", answer: "landing.oracle_conv1_a" },
  { question: "landing.oracle_conv2_q", answer: "landing.oracle_conv2_a" },
  { question: "landing.oracle_conv3_q", answer: "landing.oracle_conv3_a" },
  { question: "landing.oracle_conv4_q", answer: "landing.oracle_conv4_a" },
];

// Full Oracle preview : rotates through conversations (question + answer), typed answer
const OracleLiveChat = () => {
  const { t } = useT();
  const [convIndex, setConvIndex] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  const currentKeys = ORACLE_CONVERSATION_KEYS[convIndex];
  const questionText = t(currentKeys.question);
  const answerText = t(currentKeys.answer);

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    const text = answerText;
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [convIndex, answerText]);

  useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => {
      setConvIndex((prev) => (prev + 1) % ORACLE_CONVERSATION_KEYS.length);
    }, 5500);
    return () => clearTimeout(timer);
  }, [done, convIndex]);

  return (
    <>
      <div key={`q-${convIndex}`} className="bg-secondary/50 rounded-lg p-3 text-sm max-w-[80%] animate-fade-in">
        {questionText}
      </div>
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm ml-auto max-w-[85%]">
        <p className="text-primary text-xs mb-1 font-medium flex items-center gap-1">
          <Sparkles className="h-3 w-3" /> {t("landing.oracle_live_label")}
        </p>
        <span>
          {displayed}
          {!done && <span className="animate-pulse text-primary">|</span>}
          {done && <span className="text-primary/70 italic text-xs">{t("landing.oracle_live_next")}</span>}
        </span>
      </div>
    </>
  );
};

const LandingPage = () => {
  const navigate = useNavigate();
  const { t } = useT();
  const [birthDate, setBirthDate] = useState("");
  const [firstName, setFirstName] = useState("");
  const [quickResult, setQuickResult] = useState<{ sign: string; symbol: string; lifePath: number; keyword: string } | null>(null);

  // Activate the cosmic star cursor only on the landing (marketing) page.
  // Interior app pages (dashboard, oracle, forms) keep the native cursor.
  useEffect(() => {
    document.body.classList.add("has-cosmic-cursor");
    return () => document.body.classList.remove("has-cosmic-cursor");
  }, []);

  // Refs for GSAP animations
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const calcRef = useRef<HTMLDivElement>(null);
  const pillarsRef = useRef<HTMLDivElement>(null);
  const pillarCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const oracleRef = useRef<HTMLDivElement>(null);
  const oracleChatRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const featureCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const testimonialCardsRef = useRef<(HTMLDivElement | null)[]>([]);
  const pricingRef = useRef<HTMLDivElement>(null);
  const pricingCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1 });
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    return () => { lenis.destroy(); };
  }, []);

  // GSAP scroll animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero text entrance
      if (heroTextRef.current) {
        const children = heroTextRef.current.children;
        gsap.from(Array.from(children), {
          y: 80,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.15,
          delay: 0.2,
        });
      }

      // Calculator card entrance
      gsap.from(calcRef.current, {
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        delay: 0.8,
      });

      // Pillars section title
      if (pillarsRef.current) {
        gsap.from(pillarsRef.current.querySelector("h2"), {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: pillarsRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // Pillar cards stagger entrance
      gsap.from(pillarCardsRef.current.filter(Boolean), {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: pillarsRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      // Subtle parallax on pillar cards (each moves at slightly different speed)
      pillarCardsRef.current.filter(Boolean).forEach((card, i) => {
        gsap.to(card, {
          y: -15 - i * 8, // Each card moves slightly differently
          ease: "none",
          scrollTrigger: {
            trigger: pillarsRef.current,
            start: "top bottom",
            end: "bottom top",
            scrub: 1.5,
          },
        });
      });

      // Oracle section
      if (oracleRef.current) {
        gsap.from(oracleRef.current.querySelectorAll("h2, p.oracle-subtitle"), {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: {
            trigger: oracleRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // Oracle chat card - clipPath reveal
      gsap.from(oracleChatRef.current, {
        clipPath: "inset(0 0 100% 0)",
        opacity: 0,
        duration: 1.2,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: oracleChatRef.current,
          start: "top 85%",
          toggleActions: "play none none none",
        },
      });

      // Features section title
      if (featuresRef.current) {
        gsap.from(featuresRef.current.querySelector("h2"), {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // Feature cards stagger
      gsap.from(featureCardsRef.current.filter(Boolean), {
        y: 40,
        opacity: 0,
        scale: 0.9,
        duration: 0.6,
        ease: "power3.out",
        stagger: 0.06,
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      // Testimonials title
      if (testimonialsRef.current) {
        gsap.from(testimonialsRef.current.querySelector("h2"), {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: testimonialsRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // Testimonial cards
      gsap.from(testimonialCardsRef.current.filter(Boolean), {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: testimonialsRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });

      // Pricing title
      if (pricingRef.current) {
        gsap.from(pricingRef.current.querySelector("h2"), {
          y: 60,
          opacity: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: pricingRef.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        });
      }

      // Pricing cards
      gsap.from(pricingCardsRef.current.filter(Boolean), {
        y: 60,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.15,
        scrollTrigger: {
          trigger: pricingRef.current,
          start: "top 80%",
          toggleActions: "play none none none",
        },
      });
    });

    return () => ctx.revert();
  }, []);

  const handleQuickCalc = () => {
    if (!birthDate) return;
    const parts = birthDate.split("-");
    if (parts.length !== 3) return;
    const [y, m, d] = parts.map(Number);
    const sign = getZodiacSign(d, m);
    const lp = lifePathNumber(d, m, y);
    setQuickResult({ sign: sign.sign, symbol: sign.symbol, lifePath: lp.number, keyword: getNumberKeyword(lp.number) });

    // Persist to sessionStorage so OnboardingPage can pre-fill
    try {
      sessionStorage.setItem("km_onboarding", JSON.stringify({ birthDate, firstName }));
    } catch {}
  };

  const features: { icon: typeof Hash; labelKey: UiKey; descKey: UiKey; backKey: UiKey }[] = [
    { icon: Hash,          labelKey: "landing.feat_lifepath_label",    descKey: "landing.feat_lifepath_desc",    backKey: "landing.feat_lifepath_back" },
    { icon: Star,          labelKey: "landing.feat_theme_label",       descKey: "landing.feat_theme_desc",       backKey: "landing.feat_theme_back" },
    { icon: Calendar,      labelKey: "landing.feat_personalday_label", descKey: "landing.feat_personalday_desc", backKey: "landing.feat_personalday_back" },
    { icon: Moon,          labelKey: "landing.feat_transits_label",    descKey: "landing.feat_transits_desc",    backKey: "landing.feat_transits_back" },
    { icon: Heart,         labelKey: "landing.feat_compat_label",      descKey: "landing.feat_compat_desc",      backKey: "landing.feat_compat_back" },
    { icon: Sparkles,      labelKey: "landing.feat_karma_label",       descKey: "landing.feat_karma_desc",       backKey: "landing.feat_karma_back" },
    { icon: MessageCircle, labelKey: "landing.feat_oracle_label",      descKey: "landing.feat_oracle_desc",      backKey: "landing.feat_oracle_back" },
    { icon: BookOpen,      labelKey: "landing.feat_learn_label",       descKey: "landing.feat_learn_desc",       backKey: "landing.feat_learn_back" },
  ];

  const testimonials: { nameKey: UiKey; textKey: UiKey; stars: number }[] = [
    { nameKey: "landing.testi_1_name", textKey: "landing.testi_1_text", stars: 5 },
    { nameKey: "landing.testi_2_name", textKey: "landing.testi_2_text", stars: 5 },
    { nameKey: "landing.testi_3_name", textKey: "landing.testi_3_text", stars: 5 },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <StarField />

      {/* Glass floating header */}
      <header
        className="fixed z-50 flex items-center justify-between"
        style={{
          top: 8, left: 8, right: 8,
          height: 56,
          padding: "0 16px",
          background: "rgba(10, 10, 15, 0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(139, 92, 246, 0.12)",
          borderRadius: 16,
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.3)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center bg-primary">
            <span className="text-white text-xs font-bold font-serif">K</span>
          </div>
          <span className="font-serif text-xl font-bold text-foreground">Karmastro</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")} className="text-muted-foreground hover:text-foreground">
            {t("landing.header_login")}
          </Button>
          <Button size="sm" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90" style={{ borderRadius: 12, boxShadow: "0 4px 15px rgba(139, 92, 246, 0.25)" }}>
            {t("landing.header_start")}
          </Button>
        </div>
      </header>
      {/* Spacer */}
      <div className="h-[72px]" />

      {/* Hero */}
      <section ref={heroRef} className="relative z-10 flex flex-col items-center px-6 pt-12 pb-20 text-center">
        <div className="mb-8">
          <ZodiacWheel size={180} />
        </div>

        <div ref={heroTextRef}>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 leading-tight">
            {t("landing.hero_title_1")}
            <br />
            <span className="text-gradient-violet">{t("landing.hero_title_2")}</span>
            <br />
            <span className="text-gradient-gold">{t("landing.hero_title_3")}</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl mb-6 mx-auto">
            {t("landing.hero_tagline")}
          </p>
          <p className="mb-10">
            <a href="https://karmastro.com/precision" className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors border border-white/5 rounded-full px-3 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-karmique-earth animate-pulse" />
              {t("landing.hero_precision_badge")}
            </a>
          </p>
        </div>

        {/* Quick calculator */}
        <div ref={calcRef} className="w-full max-w-lg border-glow rounded-xl bg-card/80 backdrop-blur-sm p-6">
          <p className="text-sm text-muted-foreground mb-4">{t("landing.calc_title")}</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <SmartDateInput
              value={birthDate}
              onChange={setBirthDate}
              className="flex-1"
            />
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 bg-secondary border-border"
              placeholder={t("landing.calc_firstname_placeholder")}
            />
            <Button onClick={handleQuickCalc} className="bg-primary hover:bg-primary/90">
              <Sparkles className="h-4 w-4 mr-1" /> {t("landing.calc_discover")}
            </Button>
          </div>

          {quickResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t border-border pt-4 flex items-center justify-center gap-6 text-sm"
            >
              <div className="text-center flex flex-col items-center">
                <ZodiacSymbol sign={quickResult.sign} size={28} color="#D4A017" />
                <p className="text-muted-foreground mt-1">{quickResult.sign}</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-mono text-primary">{quickResult.lifePath}</span>
                <p className="text-muted-foreground">{quickResult.keyword}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/onboarding")} className="border-primary text-primary">
                {t("landing.calc_full_profile")} <ChevronRight className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* 3 Pillars - Flip cards */}
      <section ref={pillarsRef} className="relative z-10 px-6 py-16">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          {t("landing.pillars_title_1")} <span className="text-gradient-violet">{t("landing.pillars_title_2")}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-sm">{t("landing.pillars_click_hint")}</p>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {([
            {
              icon: Star,
              titleKey: "landing.pillar_astro_title" as UiKey,
              descKey: "landing.pillar_astro_desc" as UiKey,
              whyKey: "landing.pillar_astro_why" as UiKey,
              backKey: "landing.pillar_astro_back" as UiKey,
              color: "text-karmique-blue",
              borderColor: "hsl(217 91% 60% / 0.3)",
            },
            {
              icon: Hash,
              titleKey: "landing.pillar_numero_title" as UiKey,
              descKey: "landing.pillar_numero_desc" as UiKey,
              whyKey: "landing.pillar_numero_why" as UiKey,
              backKey: "landing.pillar_numero_back" as UiKey,
              color: "text-primary",
              borderColor: "hsl(271 91% 65% / 0.3)",
            },
            {
              icon: Sparkles,
              titleKey: "landing.pillar_karma_title" as UiKey,
              descKey: "landing.pillar_karma_desc" as UiKey,
              whyKey: "landing.pillar_karma_why" as UiKey,
              backKey: "landing.pillar_karma_back" as UiKey,
              color: "text-accent",
              borderColor: "hsl(43 76% 53% / 0.3)",
            },
          ]).map((pillar, i) => (
            <FlipCard
              key={pillar.titleKey}
              cardRef={(el) => { pillarCardsRef.current[i] = el; }}
              borderColor={pillar.borderColor}
              front={
                <>
                  <pillar.icon className={`h-10 w-10 mb-4 ${pillar.color}`} />
                  <h3 className="font-serif text-xl mb-2">{t(pillar.titleKey)}</h3>
                  <p className="text-sm text-muted-foreground">{t(pillar.descKey)}</p>
                  <p className="text-[10px] text-muted-foreground/50 mt-3">{t("landing.pillar_click_flip")}</p>
                </>
              }
              back={
                <>
                  <h4 className={`font-serif text-lg mb-3 ${pillar.color}`}>{t(pillar.whyKey)}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t(pillar.backKey)}</p>
                </>
              }
            />
          ))}
        </div>
      </section>

      {/* Oracle preview - enriched */}
      <section ref={oracleRef} className="relative z-10 px-6 py-16">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          {t("landing.oracle_title_1")} <span className="text-gradient-gold">{t("landing.oracle_title_2")}</span>
        </h2>
        <p className="oracle-subtitle text-muted-foreground text-center mb-12 max-w-lg mx-auto">
          {t("landing.oracle_subtitle")}
        </p>

        {/* What the Oracle does - 4 points */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
          {([
            { icon: Hash,     titleKey: "landing.oracle_does_1_title" as UiKey, descKey: "landing.oracle_does_1_desc" as UiKey, color: "text-primary" },
            { icon: Moon,     titleKey: "landing.oracle_does_2_title" as UiKey, descKey: "landing.oracle_does_2_desc" as UiKey, color: "text-accent" },
            { icon: Sparkles, titleKey: "landing.oracle_does_3_title" as UiKey, descKey: "landing.oracle_does_3_desc" as UiKey, color: "text-primary" },
            { icon: Zap,      titleKey: "landing.oracle_does_4_title" as UiKey, descKey: "landing.oracle_does_4_desc" as UiKey, color: "text-accent" },
          ]).map((item) => (
            <div key={item.titleKey} className="border-glow rounded-xl bg-card/40 p-4 flex gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "hsl(271 91% 65% / 0.1)" }}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-1">{t(item.titleKey)}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Chat preview - live rotating conversations */}
        <div ref={oracleChatRef} className="max-w-md mx-auto border-glow rounded-xl bg-card/60 backdrop-blur-sm p-6 space-y-4">
          <OracleLiveChat />
          <div className="flex gap-2 flex-wrap">
            {(["landing.oracle_chip_1", "landing.oracle_chip_2", "landing.oracle_chip_3", "landing.oracle_chip_4"] as UiKey[]).map(k => (
              <span key={k} className="text-xs border border-primary/30 text-primary rounded-full px-3 py-1 cursor-pointer hover:bg-primary/10 transition-colors">
                {t(k)}
              </span>
            ))}
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate("/onboarding")}>
            <MessageCircle className="h-4 w-4 mr-2" /> {t("landing.oracle_cta")}
          </Button>
        <p className="text-center mt-4">
            <a href="https://karmastro.com/precision" className="inline-flex items-center gap-1.5 text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors">
              <span className="w-1 h-1 rounded-full bg-karmique-earth" />
              {t("landing.oracle_footnote")}
            </a>
          </p>
        </div>
      </section>

      {/* Features grid */}
      <section ref={featuresRef} className="relative z-10 px-6 py-16">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          {t("landing.feat_grid_h2_1")} <span className="text-gradient-violet">{t("landing.feat_grid_h2_2")}</span>
        </h2>
        <p className="text-center text-muted-foreground mb-12 text-sm">{t("landing.feat_grid_hint")}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {features.map((f, i) => (
            <FlipCard
              key={f.labelKey}
              cardRef={(el) => { featureCardsRef.current[i] = el; }}
              className="min-h-[140px] p-4"
              backClassName="min-h-[140px] p-4 text-left"
              front={
                <>
                  <f.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <p className="text-sm font-medium">{t(f.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(f.descKey)}</p>
                </>
              }
              back={
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <f.icon className="h-4 w-4 text-primary flex-shrink-0" />
                    <p className="text-xs font-medium">{t(f.labelKey)}</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{t(f.backKey)}</p>
                </>
              }
            />
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} className="relative z-10 px-6 py-16">
        <h2 className="font-serif text-3xl text-center mb-10">{t("landing.testi_title_1")} <span className="text-gradient-gold">{t("landing.testi_title_2")}</span></h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {testimonials.map((testi, i) => (
            <div
              key={testi.nameKey}
              ref={(el) => { testimonialCardsRef.current[i] = el; }}
              className="border-glow rounded-xl bg-card/40 p-6"
            >
              <div className="flex gap-0.5 mb-3">
                {Array(testi.stars).fill(0).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-3">"{t(testi.textKey)}"</p>
              <p className="text-sm font-medium">{t(testi.nameKey)}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="relative z-10 px-6 py-16" id="pricing">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
          {t("landing.pricing_title_1")} <span className="text-gradient-violet">{t("landing.pricing_title_2")}</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Éveil */}
          <div ref={(el) => { pricingCardsRef.current[0] = el; }} className="border-glow rounded-xl bg-card/40 p-6">
            <h3 className="font-serif text-xl mb-1">{t("landing.pricing_eveil_title")} <Sparkles className="h-4 w-4 inline text-primary" /></h3>
            <p className="text-lg font-medium mb-4 text-gradient-gold">{t("landing.pricing_eveil_price")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              {(["landing.pricing_eveil_f1","landing.pricing_eveil_f2","landing.pricing_eveil_f3","landing.pricing_eveil_f4","landing.pricing_eveil_f5"] as UiKey[]).map(k => (
                <li key={k} className="flex items-center gap-2"><Check className="h-4 w-4 text-karmique-earth" /> {t(k)}</li>
              ))}
            </ul>
            <Button variant="outline" className="w-full border-primary text-primary" onClick={() => navigate("/onboarding")}>
              {t("landing.pricing_eveil_cta")}
            </Button>
          </div>
          {/* Étoile */}
          <div ref={(el) => { pricingCardsRef.current[1] = el; }} className="border-glow-gold glow-violet rounded-xl bg-card/60 p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
              {t("landing.pricing_etoile_badge")}
            </span>
            <h3 className="font-serif text-xl mb-1">{t("landing.pricing_etoile_title")} <Star className="h-4 w-4 inline text-accent" /></h3>
            <p className="text-3xl font-bold mb-1">5,99€<span className="text-sm font-normal text-muted-foreground">{t("landing.pricing_etoile_per_month")}</span></p>
            <p className="text-xs text-muted-foreground mb-4">{t("landing.pricing_etoile_annual_hint")}</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              {(["landing.pricing_etoile_f1","landing.pricing_etoile_f2","landing.pricing_etoile_f3","landing.pricing_etoile_f4","landing.pricing_etoile_f5","landing.pricing_etoile_f6","landing.pricing_etoile_f7"] as UiKey[]).map(k => (
                <li key={k} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {t(k)}</li>
              ))}
            </ul>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate("/onboarding")}>
              {t("landing.pricing_etoile_cta")}
            </Button>
          </div>
          {/* Âme Sœur */}
          <div ref={(el) => { pricingCardsRef.current[2] = el; }} className="border-glow rounded-xl bg-card/40 p-6">
            <h3 className="font-serif text-xl mb-1">{t("landing.pricing_ame_title")} <Heart className="h-4 w-4 inline text-karmique-fire" /></h3>
            <p className="text-3xl font-bold mb-4">2,99€<span className="text-sm font-normal text-muted-foreground"> {t("landing.pricing_ame_unit")}</span></p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              {(["landing.pricing_ame_f1","landing.pricing_ame_f2","landing.pricing_ame_f3","landing.pricing_ame_f4"] as UiKey[]).map(k => (
                <li key={k} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> {t(k)}</li>
              ))}
            </ul>
            <Button variant="outline" className="w-full border-accent text-accent" onClick={() => navigate("/onboarding")}>
              {t("landing.pricing_ame_cta")}
            </Button>
          </div>
        </div>
      </section>

      {/* Footer, site-parity */}
      <AppFooter />
    </div>
  );
};

export default LandingPage;

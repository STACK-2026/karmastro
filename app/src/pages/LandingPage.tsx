import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star, Moon, Hash, Sparkles, MessageCircle, Calendar, Heart, Zap, BookOpen, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { getZodiacSign, lifePathNumber, getNumberKeyword } from "@/lib/numerology";
import ZodiacWheel from "@/components/ZodiacWheel";
import StarField from "@/components/StarField";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const navigate = useNavigate();
  const [birthDate, setBirthDate] = useState("");
  const [firstName, setFirstName] = useState("");
  const [quickResult, setQuickResult] = useState<{ sign: string; symbol: string; lifePath: number; keyword: string } | null>(null);

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

      // Pillar cards stagger
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
  };

  const features = [
    { icon: Hash, label: "Chemin de vie", desc: "Votre nombre directeur" },
    { icon: Star, label: "Thème astral", desc: "Planètes & maisons" },
    { icon: Calendar, label: "Jour personnel", desc: "Guidance quotidienne" },
    { icon: Moon, label: "Transits", desc: "Planètes en mouvement" },
    { icon: Heart, label: "Compatibilité", desc: "Synastrie & numérologie" },
    { icon: Sparkles, label: "Karma", desc: "Dettes & leçons" },
    { icon: MessageCircle, label: "L'Oracle", desc: "Réponses 24/7" },
    { icon: BookOpen, label: "Apprendre", desc: "Guides complets" },
  ];

  const testimonials = [
    { name: "Sophie M.", text: "Mon rendez-vous quotidien est devenu un rituel. La fusion astro + numérologie est unique.", stars: 5 },
    { name: "Marc L.", text: "L'Oracle m'a aidé à comprendre mon cycle karmique. Des réponses d'une profondeur incroyable.", stars: 5 },
    { name: "Émilie R.", text: "Enfin une app en français qui prend la numérologie au sérieux. Le jour personnel change tout.", stars: 5 },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <StarField />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-serif text-2xl font-bold text-foreground">Karmastro</span>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/auth")}>
            Connexion
          </Button>
          <Button size="sm" onClick={() => navigate("/auth")} className="bg-primary hover:bg-primary/90">
            Commencer
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative z-10 flex flex-col items-center px-6 pt-12 pb-20 text-center">
        <div className="mb-8">
          <ZodiacWheel size={180} />
        </div>

        <div ref={heroTextRef}>
          <h1 className="font-serif text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Votre carte de vie.
            <br />
            <span className="text-gradient-violet">Écrite dans les étoiles</span>
            <br />
            <span className="text-gradient-gold">et les nombres.</span>
          </h1>

          <p className="text-muted-foreground text-lg max-w-xl mb-10 mx-auto">
            Astrologie + Numérologie + Guidance karmique. Un seul profil. Un rendez-vous quotidien. Un L'Oracle disponible 24/7.
          </p>
        </div>

        {/* Quick calculator */}
        <div ref={calcRef} className="w-full max-w-lg border-glow rounded-xl bg-card/80 backdrop-blur-sm p-6">
          <p className="text-sm text-muted-foreground mb-4">Découvrez votre profil en 10 secondes</p>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <Input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="flex-1 bg-secondary border-border"
              placeholder="Date de naissance"
            />
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex-1 bg-secondary border-border"
              placeholder="Prénom"
            />
            <Button onClick={handleQuickCalc} className="bg-primary hover:bg-primary/90">
              <Sparkles className="h-4 w-4 mr-1" /> Découvrir
            </Button>
          </div>

          {quickResult && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="border-t border-border pt-4 flex items-center justify-center gap-6 text-sm"
            >
              <div className="text-center">
                <span className="text-2xl">{quickResult.symbol}</span>
                <p className="text-muted-foreground">{quickResult.sign}</p>
              </div>
              <div className="text-center">
                <span className="text-2xl font-mono text-primary">{quickResult.lifePath}</span>
                <p className="text-muted-foreground">{quickResult.keyword}</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => navigate("/onboarding")} className="border-primary text-primary">
                Profil complet <ChevronRight className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </div>
      </section>

      {/* 3 Pillars */}
      <section ref={pillarsRef} className="relative z-10 px-6 py-16">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
          3 piliers, <span className="text-gradient-violet">1 profil</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {[
            { icon: Star, title: "Astrologie", desc: "Thème natal complet, transits du jour, rétrogrades, maisons et aspects. Votre carte du ciel, décodée.", color: "text-karmique-blue" },
            { icon: Hash, title: "Numérologie", desc: "Chemin de vie, année/mois/jour personnel, table d'inclusion, cycles, pinnacles. Les nombres qui vous guident.", color: "text-primary" },
            { icon: Sparkles, title: "Karma", desc: "Dettes karmiques, noeuds lunaires, lecons de vie, cycles de Saturne. L'histoire de ton ame.", color: "text-accent" },
          ].map((pillar, i) => (
            <div
              key={pillar.title}
              ref={(el) => { pillarCardsRef.current[i] = el; }}
              className="border-glow rounded-xl bg-card/60 backdrop-blur-sm p-6 text-center hover:glow-violet transition-shadow"
            >
              <pillar.icon className={`h-10 w-10 mx-auto mb-4 ${pillar.color}`} />
              <h3 className="font-serif text-xl mb-2">{pillar.title}</h3>
              <p className="text-sm text-muted-foreground">{pillar.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Oracle preview */}
      <section ref={oracleRef} className="relative z-10 px-6 py-16">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-4">
          L'Oracle <span className="text-gradient-gold">vous répond</span>
        </h2>
        <p className="oracle-subtitle text-muted-foreground text-center mb-10 max-w-lg mx-auto">
          Posez n'importe quelle question. L'Oracle croise astrologie, numérologie et sagesse karmique pour vous guider.
        </p>
        <div ref={oracleChatRef} className="max-w-md mx-auto border-glow rounded-xl bg-card/60 backdrop-blur-sm p-6 space-y-4">
          <div className="bg-secondary/50 rounded-lg p-3 text-sm max-w-[80%]">
            Est-ce le bon moment pour lancer mon business ?
          </div>
          <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm ml-auto max-w-[85%]">
            <p className="text-primary text-xs mb-1 font-medium">✨ Oracle</p>
            Votre année personnelle 1 et Jupiter en transit dans votre maison 10 créent un alignement rare pour l'entrepreneuriat. Cependant, avec Mercure rétrograde jusqu'au 19 avril...
            <span className="text-primary cursor-pointer"> Lire la suite →</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {["Ma compatibilité", "Mercure rétrograde", "Mon karma"].map(q => (
              <span key={q} className="text-xs border border-primary/30 text-primary rounded-full px-3 py-1 cursor-pointer hover:bg-primary/10 transition-colors">
                {q}
              </span>
            ))}
          </div>
          <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate("/onboarding")}>
            <MessageCircle className="h-4 w-4 mr-2" /> Poser votre question
          </Button>
        </div>
      </section>

      {/* Features grid */}
      <section ref={featuresRef} className="relative z-10 px-6 py-16">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
          Ce que Karmastro <span className="text-gradient-violet">calcule pour toi</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          {features.map((f, i) => (
            <div
              key={f.label}
              ref={(el) => { featureCardsRef.current[i] = el; }}
              className="border-glow rounded-lg bg-card/40 p-4 text-center hover:bg-card/60 transition-colors cursor-pointer"
            >
              <f.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium">{f.label}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section ref={testimonialsRef} className="relative z-10 px-6 py-16">
        <h2 className="font-serif text-3xl text-center mb-10">Ils ont trouvé <span className="text-gradient-gold">leur chemin</span></h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              ref={(el) => { testimonialCardsRef.current[i] = el; }}
              className="border-glow rounded-xl bg-card/40 p-6"
            >
              <div className="flex gap-0.5 mb-3">
                {Array(t.stars).fill(0).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-3">"{t.text}"</p>
              <p className="text-sm font-medium">{t.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} className="relative z-10 px-6 py-16" id="pricing">
        <h2 className="font-serif text-3xl md:text-4xl text-center mb-12">
          Choisissez votre <span className="text-gradient-violet">voie</span>
        </h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Eveil */}
          <div ref={(el) => { pricingCardsRef.current[0] = el; }} className="border-glow rounded-xl bg-card/40 p-6">
            <h3 className="font-serif text-xl mb-1">Eveil ✨</h3>
            <p className="text-lg font-medium mb-4 text-gradient-gold">Offert par les astres</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              {["Profil cosmique complet", "RDV quotidien (court)", "3 messages Oracle/jour", "1 compatibilite", "Guides educatifs"].map(f => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-karmique-earth" /> {f}</li>
              ))}
            </ul>
            <Button variant="outline" className="w-full border-primary text-primary" onClick={() => navigate("/onboarding")}>
              Commencer mon eveil
            </Button>
          </div>
          {/* Etoile */}
          <div ref={(el) => { pricingCardsRef.current[1] = el; }} className="border-glow-gold glow-violet rounded-xl bg-card/60 p-6 relative">
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full">
              Le plus choisi
            </span>
            <h3 className="font-serif text-xl mb-1">Etoile ⭐</h3>
            <p className="text-3xl font-bold mb-1">7,99€<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
            <p className="text-xs text-muted-foreground mb-4">ou 59,99€/an</p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              {["RDV quotidien COMPLET", "L'Oracle ILLIMITE", "Calendrier cosmique detaille", "Compatibilites illimitees", "Calculateur timing optimal", "Export PDF", "Zero publicite"].map(f => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
              ))}
            </ul>
            <Button className="w-full bg-primary hover:bg-primary/90" onClick={() => navigate("/onboarding")}>
              7 jours offerts par les astres
            </Button>
          </div>
          {/* Ame Soeur */}
          <div ref={(el) => { pricingCardsRef.current[2] = el; }} className="border-glow rounded-xl bg-card/40 p-6">
            <h3 className="font-serif text-xl mb-1">Ame Soeur 💫</h3>
            <p className="text-3xl font-bold mb-4">2,99€<span className="text-sm font-normal text-muted-foreground"> rituel unique</span></p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6">
              {["Rapport compatibilite 15 pages", "Synastrie complete", "Guidance karmique couple", "Export PDF"].map(f => (
                <li key={f} className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> {f}</li>
              ))}
            </ul>
            <Button variant="outline" className="w-full border-accent text-accent" onClick={() => navigate("/onboarding")}>
              Recevoir mon rituel
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border px-6 py-10 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-serif text-lg text-foreground">Karmastro</span>
        </div>
        <p>Les astres inclinent, ne déterminent pas.</p>
        <p className="mt-2">© 2026 Karmastro. Tous droits reserves.</p>
      </footer>
    </div>
  );
};

export default LandingPage;

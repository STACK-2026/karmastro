import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, User, Sparkles, ChevronRight, ChevronLeft, Heart, BookOpen, Star, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import SmartDateInput from "@/components/SmartDateInput";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { lifePathNumber, expressionNumber, soulUrgeNumber, personalYear, getZodiacSign, getNumberKeyword, karmicDebts } from "@/lib/numerology";
import { geocodePlace, createDebouncer, type GeocodeResult } from "@/lib/geocoding";
import { trackEvent } from "@/lib/tracker";
import StarField from "@/components/StarField";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";

const ONBOARDING_STORAGE_KEY = "km_onboarding";

const INTERESTS = [
  { id: "astro", label: "Astrologie", icon: Star },
  { id: "numero", label: "Numérologie", icon: Sparkles },
  { id: "tarot", label: "Tarot", icon: Heart },
  { id: "karma", label: "Karma & vies passées", icon: BookOpen },
  { id: "lune", label: "Cycles lunaires", icon: Calendar },
  { id: "meditation", label: "Méditation", icon: MapPin },
];

const LEVELS = [
  { id: "débutant", label: "Débutant", desc: "Je découvre" },
  { id: "intermédiaire", label: "Intermédiaire", desc: "J'ai des bases" },
  { id: "avancé", label: "Avancé", desc: "Je pratique régulièrement" },
];

const GENDERS = [
  { id: "femme", label: "Femme" },
  { id: "homme", label: "Homme" },
  { id: "non-binaire", label: "Non-binaire" },
  { id: "autre", label: "Préfère ne pas dire" },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1: Birth data
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [knowsBirthTime, setKnowsBirthTime] = useState(true);
  const [birthPlace, setBirthPlace] = useState("");
  const [geoResult, setGeoResult] = useState<GeocodeResult | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);

  // Step 2: Names
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthName, setBirthName] = useState("");
  const [currentName, setCurrentName] = useState("");

  // Step 3: Preferences
  const [gender, setGender] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [level, setLevel] = useState("débutant");

  // Step 4: Reveal
  const [revealPhase, setRevealPhase] = useState(0);
  const [scanStep, setScanStep] = useState(0);
  const [scanning, setScanning] = useState(false);

  // Restore form data on mount:
  // 1. From existing DB profile (user already filled partial data before)
  // 2. Fallback to sessionStorage (landing quick calc + data saved before auth redirect)
  useEffect(() => {
    let cancelled = false;

    const restoreFromSession = () => {
      try {
        const raw = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
        if (!raw) return;
        const saved = JSON.parse(raw);
        if (saved.birthDate) setBirthDate(saved.birthDate);
        if (saved.birthTime) setBirthTime(saved.birthTime);
        if (saved.knowsBirthTime === false) setKnowsBirthTime(false);
        if (saved.birthPlace) setBirthPlace(saved.birthPlace);
        if (saved.geoResult) setGeoResult(saved.geoResult);
        if (saved.firstName) setFirstName(saved.firstName);
        if (saved.lastName) setLastName(saved.lastName);
        if (saved.birthName) setBirthName(saved.birthName);
        if (saved.currentName) setCurrentName(saved.currentName);
        if (saved.gender) setGender(saved.gender);
        if (Array.isArray(saved.interests)) setInterests(saved.interests);
        if (saved.level) setLevel(saved.level);
      } catch {}
    };

    if (user) {
      // Try to pre-fill from existing profile in DB
      supabase
        .from("profiles")
        .select("first_name, last_name, birth_name, current_name, birth_date, birth_time, knows_birth_time, birth_place, birth_latitude, birth_longitude, gender, interests, level")
        .eq("user_id", user.id)
        .maybeSingle()
        .then(({ data: p }) => {
          if (cancelled) return;
          if (p?.birth_date) {
            setBirthDate(p.birth_date);
            if (p.birth_time) setBirthTime(p.birth_time);
            if (p.knows_birth_time === false) setKnowsBirthTime(false);
            if (p.birth_place) {
              setBirthPlace(p.birth_place);
              if (p.birth_latitude && p.birth_longitude) {
                setGeoResult({
                  displayName: p.birth_place,
                  latitude: Number(p.birth_latitude),
                  longitude: Number(p.birth_longitude),
                });
              }
            }
            if (p.first_name) setFirstName(p.first_name);
            if (p.last_name) setLastName(p.last_name);
            if (p.birth_name) setBirthName(p.birth_name);
            if (p.current_name) setCurrentName(p.current_name);
            if (p.gender) setGender(p.gender);
            if (Array.isArray(p.interests) && p.interests.length) setInterests(p.interests);
            if (p.level) setLevel(p.level);
          } else {
            // No DB data yet, fallback to sessionStorage
            restoreFromSession();
          }
        });
    } else {
      restoreFromSession();
    }

    return () => { cancelled = true; };
  }, [user]);

  // Persist form state to sessionStorage on every meaningful change
  // so data survives auth redirect
  useEffect(() => {
    try {
      sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({
        birthDate, birthTime, knowsBirthTime, birthPlace, geoResult,
        firstName, lastName, birthName, currentName,
        gender, interests, level,
      }));
    } catch {}
  }, [birthDate, birthTime, knowsBirthTime, birthPlace, geoResult, firstName, lastName, birthName, currentName, gender, interests, level]);

  const toggleInterest = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Debounced geocoder - Nominatim query 500ms after last keystroke
  const debouncedGeocode = useRef(
    createDebouncer((q: string) => {
      if (!q || q.length < 3) {
        setGeoResult(null);
        setGeoLoading(false);
        return;
      }
      setGeoLoading(true);
      geocodePlace(q).then((r) => {
        setGeoResult(r);
        setGeoLoading(false);
      });
    }, 600)
  ).current;

  const handleBirthPlaceChange = useCallback(
    (v: string) => {
      setBirthPlace(v);
      setGeoResult(null);
      debouncedGeocode(v);
    },
    [debouncedGeocode]
  );

  const canNext = () => {
    if (step === 0) return !!birthDate;
    if (step === 1) return !!firstName;
    return true;
  };

  const computeProfile = () => {
    const parts = birthDate.split("-");
    const day = parseInt(parts[2]);
    const month = parseInt(parts[1]);
    const year = parseInt(parts[0]);
    const fullName = `${firstName} ${lastName}`.trim();
    const zodiac = getZodiacSign(day, month);
    const lp = lifePathNumber(day, month, year);
    const expr = expressionNumber(fullName);
    const soul = soulUrgeNumber(fullName);
    const now = new Date();
    const py = personalYear(day, month, now.getFullYear());
    const debts = karmicDebts([lp.intermediate, expr.intermediate, soul.intermediate]);

    return { zodiac, lp, expr, soul, py, debts };
  };

  const handleFinish = async () => {
    if (!user) {
      toast({ title: "Connectez-vous d'abord", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("profiles")
        .update({
          first_name: firstName,
          last_name: lastName,
          birth_name: birthName || null,
          current_name: currentName || null,
          birth_date: birthDate,
          birth_time: knowsBirthTime ? birthTime || null : null,
          knows_birth_time: knowsBirthTime,
          birth_place: geoResult?.displayName || birthPlace || null,
          birth_latitude: geoResult?.latitude ?? null,
          birth_longitude: geoResult?.longitude ?? null,
          gender: gender || null,
          interests: interests,
          level: level,
          // Clear cached chart - will be recomputed with new coords on next fetch
          natal_chart_json: null,
          natal_chart_computed_at: null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      trackEvent("onboarding_completed", {
        has_birth_time: knowsBirthTime,
        has_geolocation: Boolean(geoResult),
        interests_count: interests.length,
        level,
      });
      // Clean up session storage now that data is in DB
      try { sessionStorage.removeItem(ONBOARDING_STORAGE_KEY); } catch {}
      navigate("/dashboard");
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const goNext = () => {
    if (step === 2) {
      setStep(3);
      setScanning(true);
      setScanStep(0);
      // Scan phase : 4 etapes x 900ms = 3600ms
      setTimeout(() => setScanStep(1), 900);
      setTimeout(() => setScanStep(2), 1800);
      setTimeout(() => setScanStep(3), 2700);
      setTimeout(() => {
        setScanning(false);
        // Reveal cards sequentially
        setRevealPhase(1);
        setTimeout(() => setRevealPhase(2), 700);
        setTimeout(() => setRevealPhase(3), 1400);
        setTimeout(() => setRevealPhase(4), 2100);
      }, 3600);
    } else {
      setStep(step + 1);
    }
  };

  const SCAN_MESSAGES = [
    { text: "Alignement avec les éphémérides", sub: "Positions planétaires Swiss Ephemeris" },
    { text: "Calcul de ton thème natal", sub: "12 planètes, 12 maisons, aspects majeurs" },
    { text: "Connexion aux nœuds lunaires", sub: "Trajectoire karmique et mission d'âme" },
    { text: "Réduction pythagoricienne", sub: "Chemin de vie, expression, âme" },
  ];

  const profile = step === 3 ? computeProfile() : null;

  const slideVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center relative">
      <StarField />

      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 z-20 h-1 bg-secondary">
        <motion.div
          className="h-full bg-primary"
          animate={{ width: `${((step + 1) / 4) * 100}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      {/* Step indicators */}
      <div className="fixed top-4 left-0 right-0 z-20 flex justify-center gap-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= step ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <AnimatePresence mode="wait">
          {/* ===== STEP 0: Birth Data ===== */}
          {step === 0 && (
            <motion.div key="step0" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-8">
                <Calendar className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="font-serif text-2xl font-bold">Tes coordonnées cosmiques</h1>
                <p className="text-sm text-muted-foreground mt-1">Le ciel au moment de ta naissance</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Date de naissance *</label>
                  <SmartDateInput value={birthDate} onChange={setBirthDate} />
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Heure de naissance</label>
                  {knowsBirthTime ? (
                    <Input type="time" value={birthTime} onChange={e => setBirthTime(e.target.value)} className="bg-secondary border-border" />
                  ) : (
                    <p className="text-xs text-muted-foreground italic py-2">Pas de souci, nous utiliserons midi solaire</p>
                  )}
                  <button
                    type="button"
                    onClick={() => setKnowsBirthTime(!knowsBirthTime)}
                    className="text-xs text-primary mt-1 hover:underline"
                  >
                    {knowsBirthTime ? "Je ne connais pas mon heure" : "Je connais mon heure"}
                  </button>
                </div>

                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Lieu de naissance</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Paris, Lyon, Marseille..."
                      value={birthPlace}
                      onChange={(e) => handleBirthPlaceChange(e.target.value)}
                      className="pl-10 pr-10 bg-secondary border-border"
                    />
                    <div className="absolute right-3 top-3">
                      {geoLoading && <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />}
                      {!geoLoading && geoResult && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                  </div>
                  {geoResult && (
                    <p className="text-[10px] text-emerald-400/80 mt-1 truncate">
                      ✓ {geoResult.displayName}
                    </p>
                  )}
                  {!geoLoading && birthPlace.length >= 3 && !geoResult && (
                    <p className="text-[10px] text-amber-400/80 mt-1">
                      Lieu non trouvé, précise ville + pays pour un ascendant exact
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 1: Names ===== */}
          {step === 1 && (
            <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-8">
                <User className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="font-serif text-2xl font-bold">Ton identité vibratoire</h1>
                <p className="text-sm text-muted-foreground mt-1">Chaque lettre porte une fréquence numérologique</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Prénom *</label>
                  <Input placeholder="Léa" value={firstName} onChange={e => setFirstName(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nom de famille</label>
                  <Input placeholder="Moreau" value={lastName} onChange={e => setLastName(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nom de naissance (si différent)</label>
                  <Input placeholder="Optionnel" value={birthName} onChange={e => setBirthName(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1 block">Nom d'usage actuel (si différent)</label>
                  <Input placeholder="Optionnel" value={currentName} onChange={e => setCurrentName(e.target.value)} className="bg-secondary border-border" />
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 2: Preferences ===== */}
          {step === 2 && (
            <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-6">
                <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
                <h1 className="font-serif text-2xl font-bold">Personnalise ton cosmos</h1>
                <p className="text-sm text-muted-foreground mt-1">Pour une expérience sur mesure</p>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Genre</label>
                <div className="grid grid-cols-2 gap-2">
                  {GENDERS.map(g => (
                    <button
                      key={g.id}
                      onClick={() => setGender(g.id)}
                      className={`py-2 px-3 rounded-lg text-sm border transition-colors ${
                        gender === g.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Centres d'intérêt</label>
                <div className="grid grid-cols-2 gap-2">
                  {INTERESTS.map(item => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleInterest(item.id)}
                        className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm border transition-colors ${
                          interests.includes(item.id)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Niveau</label>
                <div className="flex gap-2">
                  {LEVELS.map(l => (
                    <button
                      key={l.id}
                      onClick={() => setLevel(l.id)}
                      className={`flex-1 py-2 px-2 rounded-lg text-center border transition-colors ${
                        level === l.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-secondary text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      <p className="text-sm font-medium">{l.label}</p>
                      <p className="text-[10px] opacity-70">{l.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* ===== STEP 3: Scan + Reveal ===== */}
          {step === 3 && scanning && (
            <motion.div
              key="step3-scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              {/* Rotating rings around a central star */}
              <div className="relative w-40 h-40 mb-8">
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary/30"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  style={{ borderTopColor: "hsl(271 91% 65%)" }}
                />
                <motion.div
                  className="absolute inset-4 rounded-full border-2 border-accent/30"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  style={{ borderRightColor: "hsl(43 76% 55%)" }}
                />
                <motion.div
                  className="absolute inset-8 rounded-full border border-primary/20"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  style={{ borderBottomColor: "hsl(271 91% 75%)" }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="h-10 w-10 text-primary" />
                  </motion.div>
                </div>
                {/* Pulsing glow */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-primary/10 blur-2xl"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Progress bar linking to scan steps */}
              <div className="w-56 h-0.5 bg-secondary rounded-full mb-6 overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary via-accent to-primary"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((scanStep + 1) / 4) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                />
              </div>

              {/* Rotating status messages */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={scanStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.4 }}
                  className="text-center"
                >
                  <p className="font-serif text-lg text-primary mb-1">
                    {SCAN_MESSAGES[scanStep].text}
                    <motion.span
                      animate={{ opacity: [0, 1, 0] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="inline-block ml-1"
                    >
                      ...
                    </motion.span>
                  </p>
                  <p className="text-xs text-muted-foreground">{SCAN_MESSAGES[scanStep].sub}</p>
                </motion.div>
              </AnimatePresence>

              <p className="mt-8 text-[10px] text-muted-foreground/60 uppercase tracking-widest">
                Précision 0.001" · Niveau NASA JPL
              </p>
            </motion.div>
          )}

          {step === 3 && !scanning && profile && (
            <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }} className="space-y-6">
              <div className="text-center mb-4">
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", damping: 12, duration: 0.8 }}
                >
                  <Sparkles className="h-12 w-12 text-primary mx-auto mb-3" />
                </motion.div>
                <h1 className="font-serif text-2xl font-bold">Ton profil cosmique</h1>
                <p className="text-sm text-muted-foreground mt-1">{firstName}, voici ton empreinte céleste</p>
              </div>

              <div className="space-y-3">
                {/* Zodiac Sign */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={revealPhase >= 1 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5 }}
                  className="bg-secondary/80 border border-border rounded-xl p-4"
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Signe solaire</p>
                  <div className="flex items-center gap-3">
                    <ZodiacSymbol sign={profile.zodiac.sign} size={36} color="#D4A017" />
                    <div>
                      <p className="font-serif text-lg">{profile.zodiac.sign}</p>
                      <p className="text-xs text-muted-foreground">{profile.zodiac.element}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Life Path */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={revealPhase >= 2 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5 }}
                  className="bg-secondary/80 border border-border rounded-xl p-4"
                >
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Chemin de vie</p>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-mono font-bold text-primary">{profile.lp.number}</span>
                    <div>
                      <p className="font-serif text-lg">{getNumberKeyword(profile.lp.number)}</p>
                      <p className="text-xs text-muted-foreground">Via {profile.lp.intermediate}</p>
                    </div>
                  </div>
                </motion.div>

                {/* Expression & Soul */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={revealPhase >= 3 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="bg-secondary/80 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Expression</p>
                    <p className="text-2xl font-mono font-bold text-primary">{profile.expr.number}</p>
                    <p className="text-xs text-muted-foreground">{getNumberKeyword(profile.expr.number)}</p>
                  </div>
                  <div className="bg-secondary/80 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Nombre intime</p>
                    <p className="text-2xl font-mono font-bold text-primary">{profile.soul.number}</p>
                    <p className="text-xs text-muted-foreground">{getNumberKeyword(profile.soul.number)}</p>
                  </div>
                </motion.div>

                {/* Personal Year + Karmic Debts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={revealPhase >= 4 ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5 }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="bg-secondary/80 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Année personnelle</p>
                    <p className="text-2xl font-mono font-bold text-accent">{profile.py}</p>
                    <p className="text-xs text-muted-foreground">{getNumberKeyword(profile.py)}</p>
                  </div>
                  <div className="bg-secondary/80 border border-border rounded-xl p-4">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dettes karmiques</p>
                    <p className="text-2xl font-mono font-bold text-accent">
                      {profile.debts.length > 0 ? profile.debts.join(", ") : "Aucune"}
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8">
          {step > 0 && step < 3 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Retour
            </Button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <Button onClick={goNext} disabled={!canNext()} className="bg-primary hover:bg-primary/90">
              Continuer <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={revealPhase >= 4 ? { opacity: 1 } : {}}
              className="w-full"
            >
              <Button onClick={handleFinish} disabled={saving} className="w-full bg-primary hover:bg-primary/90">
                {saving ? "Enregistrement..." : "Entrer dans mon cosmos"}
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingPage;

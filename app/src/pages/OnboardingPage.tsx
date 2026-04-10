import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, Clock, MapPin, User, Sparkles, ChevronRight, ChevronLeft, Heart, BookOpen, Star, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { lifePathNumber, expressionNumber, soulUrgeNumber, personalYear, getZodiacSign, getNumberKeyword, karmicDebts } from "@/lib/numerology";
import { geocodePlace, createDebouncer, type GeocodeResult } from "@/lib/geocoding";
import { trackEvent } from "@/lib/tracker";
import StarField from "@/components/StarField";
import { ZodiacSymbol } from "@/components/ZodiacSymbol";

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

  const toggleInterest = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  // Debounced geocoder — Nominatim query 500ms after last keystroke
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
          // Clear cached chart — will be recomputed with new coords on next fetch
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
      // Trigger reveal animation phases
      setTimeout(() => setRevealPhase(1), 600);
      setTimeout(() => setRevealPhase(2), 1800);
      setTimeout(() => setRevealPhase(3), 3000);
      setTimeout(() => setRevealPhase(4), 4200);
    } else {
      setStep(step + 1);
    }
  };

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
                  <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="bg-secondary border-border" />
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

          {/* ===== STEP 3: Reveal ===== */}
          {step === 3 && profile && (
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

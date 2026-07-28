import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import SmartDateInput from "@/components/SmartDateInput";
import StarField from "@/components/StarField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useT, type UiKey } from "@/i18n/ui";
import { supabase } from "@/integrations/supabase/client";
import { geocodePlace, createDebouncer, type GeocodeResult } from "@/lib/geocoding";
import { getErrorMessage } from "@/lib/errors";
import {
  buildEssentialProfilePatch,
  profileIsComplete,
  resolveOnboardingFlow,
  type OnboardingDestination,
  type OnboardingReason,
} from "@/lib/onboarding-flow";
import { onboardingEvent, type OnboardingEventName } from "@/lib/onboarding-analytics";
import {
  clearOnboardingDraft,
  createOnboardingResumeToken,
  readOnboardingDraft,
  sanitizeOnboardingResumeToken,
  writeOnboardingDraft,
} from "@/lib/onboarding-draft";
import { trackEvent } from "@/lib/tracker";
import { getZodiacSign } from "@/lib/numerology";

type StoredOnboarding = {
  birthDate?: string;
  birthTime?: string;
  knowsBirthTime?: boolean;
  birthPlace?: string;
  geoResult?: GeocodeResult | null;
  firstName?: string;
  lastName?: string;
  birthName?: string;
  currentName?: string;
  gender?: string;
  interests?: string[];
  level?: string;
  destination?: OnboardingDestination;
  reason?: OnboardingReason;
};

type InterestDef = { id: string; labelKey: UiKey };
type LevelDef = { id: string; labelKey: UiKey; descKey: UiKey };
type GenderDef = { id: string; labelKey: UiKey };

const INTERESTS: InterestDef[] = [
  { id: "astro", labelKey: "onboarding.interest_astro" },
  { id: "numero", labelKey: "onboarding.interest_numero" },
  { id: "tarot", labelKey: "onboarding.interest_tarot" },
  { id: "karma", labelKey: "onboarding.interest_karma" },
  { id: "lune", labelKey: "onboarding.interest_lune" },
  { id: "meditation", labelKey: "onboarding.interest_meditation" },
];

const LEVELS: LevelDef[] = [
  { id: "débutant", labelKey: "onboarding.level_beginner", descKey: "onboarding.level_beginner_desc" },
  { id: "intermédiaire", labelKey: "onboarding.level_intermediate", descKey: "onboarding.level_intermediate_desc" },
  { id: "avancé", labelKey: "onboarding.level_advanced", descKey: "onboarding.level_advanced_desc" },
];

const GENDERS: GenderDef[] = [
  { id: "femme", labelKey: "onboarding.gender_female" },
  { id: "homme", labelKey: "onboarding.gender_male" },
  { id: "non-binaire", labelKey: "onboarding.gender_nonbinary" },
  { id: "autre", labelKey: "onboarding.gender_other" },
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const { t, locale } = useT();
  const resumeTokenRef = useRef(
    sanitizeOnboardingResumeToken(searchParams.get("resume")) || createOnboardingResumeToken(),
  );
  const storedRef = useRef<StoredOnboarding>(
    authLoading
      ? {}
      : readOnboardingDraft<StoredOnboarding>(resumeTokenRef.current, user?.id || null) || {},
  );
  const flow = useMemo(
    () => resolveOnboardingFlow(searchParams, storedRef.current),
    [searchParams],
  );

  const [firstName, setFirstName] = useState(storedRef.current.firstName || "");
  const [birthDate, setBirthDate] = useState(storedRef.current.birthDate || "");
  const [advancedOpen, setAdvancedOpen] = useState(searchParams.get("mode") === "edit");
  const [birthTime, setBirthTime] = useState(storedRef.current.birthTime || "");
  const [knowsBirthTime, setKnowsBirthTime] = useState(storedRef.current.knowsBirthTime ?? true);
  const [birthPlace, setBirthPlace] = useState(storedRef.current.birthPlace || "");
  const [geoResult, setGeoResult] = useState<GeocodeResult | null>(storedRef.current.geoResult || null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [lastName, setLastName] = useState(storedRef.current.lastName || "");
  const [birthName, setBirthName] = useState(storedRef.current.birthName || "");
  const [currentName, setCurrentName] = useState(storedRef.current.currentName || "");
  const [gender, setGender] = useState(storedRef.current.gender || "");
  const [interests, setInterests] = useState<string[]>(storedRef.current.interests || []);
  const [level, setLevel] = useState(storedRef.current.level || "débutant");
  const [dailyOptIn, setDailyOptIn] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [profileLoadError, setProfileLoadError] = useState(false);
  const [profileLoadAttempt, setProfileLoadAttempt] = useState(0);
  const [profileComplete, setProfileComplete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(!authLoading);
  const viewedRef = useRef(false);
  const startedRef = useRef(false);
  const advancedTrackedRef = useRef(false);
  const resumeUrlWrittenRef = useRef(false);

  const editRequested = searchParams.get("mode") === "edit";
  const isEditMode = editRequested && profileComplete;
  const analyticsFlow = isEditMode ? "edit" : "acquisition";

  const trackOnboarding = useCallback((name: OnboardingEventName, completionLevel: "none" | "essential" | "advanced") => {
    const event = onboardingEvent(name, {
      flow: analyticsFlow,
      reason: isEditMode ? "profile_edit" : flow.reason,
      destination: isEditMode ? "/profile" : flow.destination,
      completionLevel,
      hasBirthTime: knowsBirthTime && Boolean(birthTime),
      hasBirthPlace: Boolean(geoResult || birthPlace.trim()),
    });
    void trackEvent(event.name, event.properties);
  }, [
    analyticsFlow,
    birthPlace,
    birthTime,
    flow.destination,
    flow.reason,
    geoResult,
    isEditMode,
    knowsBirthTime,
  ]);

  const arrivalState = useCallback((
    completionLevel: "none" | "essential" | "advanced",
    destination: OnboardingDestination = isEditMode ? "/profile" : flow.destination,
  ) => {
    const event = onboardingEvent("onboarding_destination_reached_v1", {
      flow: analyticsFlow,
      reason: isEditMode ? "profile_edit" : flow.reason,
      destination,
      completionLevel,
      hasBirthTime: knowsBirthTime && Boolean(birthTime),
      hasBirthPlace: Boolean(geoResult || birthPlace.trim()),
    });
    return { onboardingArrival: event };
  }, [
    analyticsFlow,
    birthPlace,
    birthTime,
    flow.destination,
    flow.reason,
    geoResult,
    isEditMode,
    knowsBirthTime,
  ]);

  useEffect(() => {
    if (authLoading) return;
    const stored = readOnboardingDraft<StoredOnboarding>(
      resumeTokenRef.current,
      user?.id || null,
    ) || {};
    storedRef.current = stored;
    setFirstName(stored.firstName || "");
    setBirthDate(stored.birthDate || "");
    setBirthTime(stored.birthTime || "");
    setKnowsBirthTime(stored.knowsBirthTime ?? true);
    setBirthPlace(stored.birthPlace || "");
    setGeoResult(stored.geoResult || null);
    setLastName(stored.lastName || "");
    setBirthName(stored.birthName || "");
    setCurrentName(stored.currentName || "");
    setGender(stored.gender || "");
    setInterests(stored.interests || []);
    setLevel(stored.level || "débutant");
    setDraftReady(true);
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (
      resumeUrlWrittenRef.current
      || sanitizeOnboardingResumeToken(searchParams.get("resume"))
    ) return;
    resumeUrlWrittenRef.current = true;
    const params = new URLSearchParams(searchParams);
    params.set("resume", resumeTokenRef.current);
    window.history.replaceState(
      window.history.state,
      "",
      `/onboarding?${params.toString()}`,
    );
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || !draftReady) return;
    let cancelled = false;
    setProfileLoaded(false);
    setProfileLoadError(false);

    if (!user) {
      setProfileComplete(false);
      setProfileLoaded(true);
      return;
    }

    void (async () => {
      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("first_name, last_name, birth_name, current_name, birth_date, birth_time, knows_birth_time, birth_place, birth_latitude, birth_longitude, gender, interests, level")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          setProfileLoadError(true);
          setProfileLoaded(true);
          return;
        }

        setProfileComplete(profileIsComplete(profile));
        if (profile?.first_name) setFirstName(profile.first_name);
        if (profile?.birth_date) setBirthDate(profile.birth_date);
        if (profile?.last_name) setLastName(profile.last_name);
        if (profile?.birth_name) setBirthName(profile.birth_name);
        if (profile?.current_name) setCurrentName(profile.current_name);
        if (profile?.birth_time) setBirthTime(profile.birth_time);
        if (profile?.knows_birth_time === false) setKnowsBirthTime(false);
        if (profile?.birth_place) setBirthPlace(profile.birth_place);
        if (profile?.birth_place && profile.birth_latitude != null && profile.birth_longitude != null) {
          setGeoResult({
            displayName: profile.birth_place,
            latitude: Number(profile.birth_latitude),
            longitude: Number(profile.birth_longitude),
            country: null,
            countryCode: null,
          });
        }
        if (profile?.gender) setGender(profile.gender);
        if (Array.isArray(profile?.interests)) setInterests(profile.interests);
        if (profile?.level) setLevel(profile.level);
        setProfileLoaded(true);
      } catch {
        if (!cancelled) {
          setProfileLoadError(true);
          setProfileLoaded(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, draftReady, profileLoadAttempt, user]);

  useEffect(() => {
    if (!profileLoaded || profileLoadError || viewedRef.current) return;
    viewedRef.current = true;
    trackOnboarding("onboarding_viewed_v2", profileComplete ? "essential" : "none");
  }, [profileComplete, profileLoadError, profileLoaded, trackOnboarding]);

  useEffect(() => {
    if (!profileLoaded || profileLoadError || !profileComplete || isEditMode) return;
    clearOnboardingDraft(resumeTokenRef.current);
    navigate(flow.destination, { replace: true, state: arrivalState("essential") });
  }, [
    flow.destination,
    isEditMode,
    navigate,
    profileComplete,
    profileLoadError,
    profileLoaded,
    arrivalState,
  ]);

  useEffect(() => {
    if (authLoading || !draftReady) return;
    try {
      writeOnboardingDraft(resumeTokenRef.current, user?.id || null, {
        birthDate,
        birthTime,
        knowsBirthTime,
        birthPlace,
        geoResult,
        firstName,
        lastName,
        birthName,
        currentName,
        gender,
        interests,
        level,
        destination: flow.destination,
        reason: flow.reason,
      } satisfies StoredOnboarding);
    } catch {
      // Session persistence is best effort in privacy mode.
    }
  }, [
    birthDate,
    birthName,
    birthPlace,
    birthTime,
    currentName,
    firstName,
    flow.destination,
    flow.reason,
    gender,
    geoResult,
    interests,
    knowsBirthTime,
    lastName,
    level,
    user?.id,
    authLoading,
    draftReady,
  ]);

  const debouncedGeocode = useRef(
    createDebouncer((query: string) => {
      if (query.trim().length < 3) {
        setGeoResult(null);
        setGeoLoading(false);
        return;
      }
      setGeoLoading(true);
      void geocodePlace(query).then((result) => {
        setGeoResult(result);
        setGeoLoading(false);
      });
    }, 600),
  ).current;

  const handleBirthPlaceChange = useCallback((value: string) => {
    setBirthPlace(value);
    setGeoResult(null);
    debouncedGeocode(value);
  }, [debouncedGeocode]);

  const markEssentialStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    trackOnboarding("onboarding_essential_started_v1", "none");
  };

  const toggleAdvanced = () => {
    setAdvancedOpen((open) => {
      const next = !open;
      if (next && !advancedTrackedRef.current) {
        advancedTrackedRef.current = true;
        trackOnboarding("onboarding_advanced_opened_v1", profileComplete ? "essential" : "none");
      }
      return next;
    });
  };

  const toggleInterest = (id: string) => {
    setInterests((current) => current.includes(id)
      ? current.filter((value) => value !== id)
      : [...current, id]);
  };

  const handleSave = async () => {
    if (!firstName.trim() || !birthDate) return;
    if (!user) {
      toast({ title: t("onboarding.toast_login_required") });
      const resumePath = `/onboarding?${new URLSearchParams({
        resume: resumeTokenRef.current,
        next: flow.destination,
        reason: flow.reason,
      }).toString()}`;
      navigate(`/auth?next=${encodeURIComponent(resumePath)}`);
      return;
    }
    if (!profileLoaded || profileLoadError) return;

    setSaving(true);
    try {
      const essentialPatch = buildEssentialProfilePatch(user.id, firstName, birthDate);
      const { error: essentialError } = await supabase
        .from("profiles")
        .upsert(essentialPatch, { onConflict: "user_id" });
      if (essentialError) throw essentialError;

      if (advancedOpen) {
        const { error: advancedError } = await supabase
          .from("profiles")
          .upsert({
            user_id: user.id,
            last_name: lastName || null,
            birth_name: birthName || null,
            current_name: currentName || null,
            birth_time: knowsBirthTime ? birthTime || null : null,
            knows_birth_time: knowsBirthTime,
            birth_place: geoResult?.displayName || birthPlace || null,
            birth_latitude: geoResult?.latitude ?? null,
            birth_longitude: geoResult?.longitude ?? null,
            gender: gender || null,
            interests,
            level,
            natal_chart_json: null,
            natal_chart_computed_at: null,
          }, { onConflict: "user_id" });
        if (advancedError) throw advancedError;
      }

      trackOnboarding(
        "onboarding_essential_completed_v1",
        advancedOpen ? "advanced" : "essential",
      );

      if (!isEditMode && advancedOpen && dailyOptIn && user.email) {
        try {
          const [, month, day] = birthDate.split("-").map((value) => Number(value));
          const signName = getZodiacSign(day, month).sign;
          const signSlug = signName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
          await fetch("https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/newsletter-subscribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              locale,
              sign_slug: signSlug,
              source: "onboarding_optin",
            }),
          });
        } catch {
          // Explicit newsletter opt-in remains non-blocking for profile save.
        }
      }

      try {
        clearOnboardingDraft(resumeTokenRef.current);
      } catch {
        // Storage cleanup is best effort.
      }
      const destination = isEditMode ? "/profile" : flow.destination;
      if (isEditMode) {
        toast({ title: t("profile.updated_title"), description: t("profile.updated_desc") });
      }
      navigate(destination, {
        replace: true,
        state: arrivalState(advancedOpen ? "advanced" : "essential"),
      });
    } catch (error: unknown) {
      toast({
        title: t("onboarding.toast_error_title"),
        description: getErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = () => {
    trackOnboarding("onboarding_skipped_v1", profileComplete ? "essential" : "none");
    clearOnboardingDraft(resumeTokenRef.current);
    const destination = isEditMode ? "/profile" : flow.skipDestination;
    navigate(destination, {
      replace: true,
      state: arrivalState(profileComplete ? "essential" : "none", destination),
    });
  };

  if (profileLoadError) {
    return (
      <div className="min-h-screen bg-background flex flex-col gap-4 items-center justify-center relative">
        <StarField />
        <p className="relative z-10 text-sm text-muted-foreground">{t("common.error_generic")}</p>
        <Button className="relative z-10" variant="outline" onClick={() => setProfileLoadAttempt((attempt) => attempt + 1)}>
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  if (authLoading || !draftReady || !profileLoaded || (profileComplete && !isEditMode)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative">
        <StarField />
        <p className="relative z-10 text-sm text-muted-foreground">{t("common.onboarding_loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative px-5 py-10">
      <StarField />
      <main className="relative z-10 mx-auto w-full max-w-lg">
        <section className="rounded-2xl border border-primary/25 bg-card/90 p-6 shadow-xl backdrop-blur-sm">
          <div className="text-center">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-primary" />
            <h1 className="font-serif text-2xl font-bold">
              {isEditMode ? t("profile.edit_mode_title") : t("onboarding.progressive_title")}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {t("onboarding.progressive_subtitle")}
            </p>
          </div>

          <div className="mt-7 space-y-4">
            <div>
              <label htmlFor="onboarding-first-name" className="mb-1 block text-sm text-muted-foreground">
                {t("onboarding.first_name_label")}
              </label>
              <Input
                id="onboarding-first-name"
                value={firstName}
                placeholder={t("onboarding.first_name_placeholder")}
                onFocus={markEssentialStarted}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
              />
            </div>
            <div>
              <label id="onboarding-birth-date-label" className="mb-1 block text-sm text-muted-foreground">
                {t("onboarding.birth_date_label")}
              </label>
              <div onFocus={markEssentialStarted}>
                <SmartDateInput value={birthDate} onChange={setBirthDate} ariaLabelledBy="onboarding-birth-date-label" />
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-6 flex w-full items-center justify-between rounded-xl border border-border bg-secondary/60 px-4 py-3 text-left"
            onClick={toggleAdvanced}
            aria-expanded={advancedOpen}
            aria-controls="onboarding-advanced-fields"
          >
            <span>
              <span className="block text-sm font-medium">{t("onboarding.progressive_advanced_title")}</span>
              <span className="block text-xs text-muted-foreground">{t("onboarding.progressive_advanced_desc")}</span>
            </span>
            {advancedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {advancedOpen && (
            <div id="onboarding-advanced-fields" className="mt-4 space-y-5 rounded-xl border border-border/80 bg-background/30 p-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="onboarding-birth-time" className="mb-1 block text-sm text-muted-foreground">{t("onboarding.birth_time_label")}</label>
                  {knowsBirthTime ? (
                    <div className="relative">
                      <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="onboarding-birth-time" className="pl-9" type="time" value={birthTime} onChange={(event) => setBirthTime(event.target.value)} />
                    </div>
                  ) : (
                    <p className="py-2 text-xs italic text-muted-foreground">{t("onboarding.birth_time_none")}</p>
                  )}
                  <button type="button" className="mt-1 text-xs text-primary hover:underline" onClick={() => setKnowsBirthTime((value) => !value)}>
                    {knowsBirthTime ? t("onboarding.birth_time_unknown") : t("onboarding.birth_time_known")}
                  </button>
                </div>
                <div>
                  <label htmlFor="onboarding-birth-place" className="mb-1 block text-sm text-muted-foreground">{t("onboarding.birth_place_label")}</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="onboarding-birth-place" className="pl-9 pr-9" value={birthPlace} onChange={(event) => handleBirthPlaceChange(event.target.value)} />
                    <span className="absolute right-3 top-3">
                      {geoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : geoResult ? <Check className="h-4 w-4 text-emerald-400" /> : null}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="onboarding-last-name" className="mb-1 block text-sm text-muted-foreground">{t("onboarding.last_name_label")}</label>
                  <Input id="onboarding-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} />
                </div>
                <div>
                  <label htmlFor="onboarding-birth-name" className="mb-1 block text-sm text-muted-foreground">{t("onboarding.birth_name_label")}</label>
                  <Input id="onboarding-birth-name" value={birthName} onChange={(event) => setBirthName(event.target.value)} />
                </div>
              </div>
              <div>
                <label htmlFor="onboarding-current-name" className="mb-1 block text-sm text-muted-foreground">{t("onboarding.current_name_label")}</label>
                <Input id="onboarding-current-name" value={currentName} onChange={(event) => setCurrentName(event.target.value)} />
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">{t("onboarding.gender_label")}</label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("onboarding.gender_label")}>
                  {GENDERS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={gender === item.id}
                      onClick={() => setGender(item.id)}
                      className={`rounded-lg border px-3 py-2 text-sm ${gender === item.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">{t("onboarding.interests_label")}</label>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label={t("onboarding.interests_label")}>
                  {INTERESTS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={interests.includes(item.id)}
                      onClick={() => toggleInterest(item.id)}
                      className={`rounded-lg border px-3 py-2 text-sm ${interests.includes(item.id) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      {t(item.labelKey)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-muted-foreground">{t("onboarding.level_label")}</label>
                <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("onboarding.level_label")}>
                  {LEVELS.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      aria-pressed={level === item.id}
                      onClick={() => setLevel(item.id)}
                      className={`rounded-lg border px-2 py-2 text-center ${level === item.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}
                    >
                      <span className="block text-xs font-medium">{t(item.labelKey)}</span>
                      <span className="block text-[10px] opacity-70">{t(item.descKey)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {!isEditMode && (
                <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
                  <input
                    type="checkbox"
                    checked={dailyOptIn}
                    onChange={(event) => setDailyOptIn(event.target.checked)}
                    className="mt-0.5 accent-primary"
                  />
                  <span className="text-sm text-muted-foreground">{t("onboarding.daily_optin")}</span>
                </label>
              )}
            </div>
          )}

          <Button
            className="mt-6 w-full"
            disabled={saving || !firstName.trim() || !birthDate}
            onClick={handleSave}
          >
            {saving
              ? t("onboarding.cta_saving")
              : isEditMode
                ? t("profile.save_changes")
                : t("onboarding.progressive_save")}
          </Button>

          <div className="mt-4 text-center">
            <Button variant="ghost" onClick={handleSkip}>
              {isEditMode ? t("common.cancel") : t("onboarding.progressive_skip")}
            </Button>
            {!isEditMode && (
              <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                {t("onboarding.progressive_skip_explanation")}
              </p>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default OnboardingPage;

import { useEffect, useState } from "react";
import { SUPABASE_URL, supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  lifePathNumber,
  expressionNumber,
  soulUrgeNumber,
  personalityNumber,
  birthdayNumber,
  personalYear,
  karmicDebts,
  getZodiacSign,
} from "@/lib/numerology";
import { demoProfile } from "@/lib/demoData";
import {
  hasEffectivePremiumAccess,
  hasPremiumAccess,
  parseIsoDateAsLocal,
} from "@/lib/subscription";
import { usePromotionPass } from "@/hooks/usePromotionPass";

export type UserProfileData = {
  // Identity
  firstName: string;
  lastName: string;
  birthDate: Date;
  birthTime: string;
  birthPlace: string;
  knowsBirthTime: boolean;
  gender: string;
  interests: string[];
  level: string;
  isDemo: boolean; // true if user has no profile yet → fallback demoProfile
  isLoading: boolean;
  loadError: boolean; // true if the profile fetch itself failed (transient/network) → distinct from "no profile yet"
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionPeriodEnd: string | null;
  subscriptionProvider: "apple" | "stripe" | null;
  isPremium: boolean;
  isSubscriptionPremium: boolean;

  // Astrology (sun sign computed locally, moon/asc/planets/aspects/houses from Engine)
  astrology: {
    sunSign: { sign: string; symbol: string; element: string; degrees: string };
    moonSign: { sign: string; symbol: string; element: string; degrees: string };
    ascendant: { sign: string; symbol: string; element: string; degrees: string };
    planets: typeof demoProfile.astrology.planets;
    aspects: typeof demoProfile.astrology.aspects;
    houses: typeof demoProfile.astrology.houses;
  };

  // Numerology (fully computed locally from Pythagorean lib)
  numerology: {
    lifePath: { number: number; intermediate: number; label: string };
    expression: { number: number; intermediate: number; label: string };
    soulUrge: { number: number; intermediate: number; label: string };
    personality: { number: number; intermediate: number; label: string };
    birthday: number;
    personalYear2026: number;
    karmicDebts: number[];
    northNode: { sign: string; house: number; lesson: string };
  };
};

const NUMBER_LABELS: Record<number, string> = {
  1: "Le Leader",
  2: "Le Diplomate",
  3: "Le Créatif",
  4: "Le Bâtisseur",
  5: "L'Aventurier",
  6: "Le Nourricier",
  7: "Le Chercheur",
  8: "Le Pouvoir",
  9: "L'Humaniste",
  11: "L'Intuitif (Maître nombre)",
  22: "Le Maître Bâtisseur",
  33: "Le Maître Enseignant",
};

function labelFor(n: number): string {
  return NUMBER_LABELS[n] || `Nombre ${n}`;
}

function computeNumerologyFromProfile(
  firstName: string,
  lastName: string,
  birthDate: Date
) {
  const fullName = `${firstName} ${lastName}`.trim();
  const day = birthDate.getDate();
  const month = birthDate.getMonth() + 1;
  const year = birthDate.getFullYear();

  const lp = lifePathNumber(day, month, year);
  const expr = expressionNumber(fullName);
  const soul = soulUrgeNumber(fullName);
  const pers = personalityNumber(fullName);
  const bday = birthdayNumber(day);
  const py = personalYear(day, month, 2026);

  const intermediates = [lp.intermediate, expr.intermediate, soul.intermediate, pers.intermediate];
  const debts = karmicDebts(intermediates);

  return {
    lifePath: { number: lp.number, intermediate: lp.intermediate, label: labelFor(lp.number) },
    expression: { number: expr.number, intermediate: expr.intermediate, label: labelFor(expr.number) },
    soulUrge: { number: soul.number, intermediate: soul.intermediate, label: labelFor(soul.number) },
    personality: { number: pers.number, intermediate: pers.intermediate, label: labelFor(pers.number) },
    birthday: bday,
    personalYear2026: py,
    karmicDebts: debts,
    northNode: { sign: "-", house: 0, lesson: "Calcul du nœud lunaire indisponible sans heure de naissance" },
  };
}

export function useUserProfile(): UserProfileData & { reload: () => void } {
  const { user, loading: authLoading } = useAuth();
  const promotionPass = usePromotionPass();
  const [reloadKey, setReloadKey] = useState(0);
  const [data, setData] = useState<UserProfileData>({
    ...demoProfile,
    isDemo: true,
    isLoading: true,
    loadError: false,
    subscriptionTier: "eveil",
    subscriptionStatus: null,
    subscriptionPeriodEnd: null,
    subscriptionProvider: null,
    isPremium: false,
    isSubscriptionPremium: false,
  });

  const reload = () => {
    setData((d) => ({ ...d, loadError: false, isLoading: true }));
    setReloadKey((k) => k + 1);
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setData((d) => ({ ...d, isLoading: false }));
      return;
    }

    (async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        // Transient/network/DB error: do NOT fall back to demo mode, or a
        // paying subscriber with a hiccup would get bounced into onboarding.
        // Surface a distinct error state so the UI can offer a retry instead.
        setData((d) => ({ ...d, loadError: true, isLoading: false }));
        return;
      }

      if (!profile) {
        // No error, but genuinely no row yet: keep the existing demo/onboarding fallback.
        setData((d) => ({ ...d, isLoading: false }));
        return;
      }

      // Sync subscription tier to localStorage so the site (karmastro.com)
      // can unlock premium features (ex : horoscope tomorrow preview).
      // localStorage is domain-scoped, but both app.karmastro.com and
      // karmastro.com share the apex via cookies; for localStorage we write
      // on both by setting a cookie with SameSite=Lax, Domain=.karmastro.com.
      try {
        const tier = profile.subscription_tier || "eveil";
        const isActive = hasEffectivePremiumAccess({
          tier,
          status: profile.subscription_status,
          periodEnd: profile.subscription_period_end,
          appleStatus: profile.apple_subscription_status,
          applePeriodEnd: profile.apple_subscription_expires_at,
        });
        const effectiveTier = isActive
          ? tier === "eveil" ? "etoile" : tier
          : tier === "etoile" ? "eveil" : tier;
        // Write to both localStorage (same-domain) and cookie (cross-subdomain)
        localStorage.setItem("km_user_tier", effectiveTier);
        document.cookie = `km_user_tier=${effectiveTier}; Path=/; Domain=.karmastro.com; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
      } catch {
        /* silent */
      }

      // Parse birth_date (stored as ISO date string)
      const birthDate = parseIsoDateAsLocal(profile.birth_date);
      const stripeTier = profile.subscription_tier || "eveil";
      const stripeStatus = profile.subscription_status || null;
      const stripePeriodEnd = profile.subscription_period_end || null;
      const applePremium = hasPremiumAccess(
        "etoile",
        profile.apple_subscription_status,
        profile.apple_subscription_expires_at,
      );
      const isPremium = hasEffectivePremiumAccess({
        tier: stripeTier,
        status: stripeStatus,
        periodEnd: stripePeriodEnd,
        appleStatus: profile.apple_subscription_status,
        applePeriodEnd: profile.apple_subscription_expires_at,
      });
      const subscriptionTier = applePremium && stripeTier === "eveil" ? "etoile" : stripeTier;
      const subscriptionStatus = applePremium ? "active" : stripeStatus;
      const subscriptionPeriodEnd = applePremium
        ? profile.apple_subscription_expires_at
        : stripePeriodEnd;
      const subscriptionProvider = applePremium
        ? "apple"
        : hasPremiumAccess(stripeTier, stripeStatus, stripePeriodEnd)
          ? "stripe"
          : null;

      if (!birthDate || !profile.first_name) {
        // Incomplete profile : keep demo values but mark as demo
        setData({
          ...demoProfile,
          firstName: profile.first_name || demoProfile.firstName,
          isDemo: true,
          isLoading: false,
          loadError: false,
          subscriptionTier,
          subscriptionStatus,
          subscriptionPeriodEnd,
          subscriptionProvider,
          isPremium,
          isSubscriptionPremium: isPremium,
        });
        return;
      }

      // Compute numerology locally
      const numerology = computeNumerologyFromProfile(
        profile.first_name,
        profile.last_name || "",
        birthDate
      );

      // Compute sun sign from birth date
      const sunSign = getZodiacSign(birthDate.getDate(), birthDate.getMonth() + 1);

      const baseProfile: UserProfileData = {
        firstName: profile.first_name,
        lastName: profile.last_name || "",
        birthDate,
        birthTime: profile.birth_time || "-",
        birthPlace: profile.birth_place || "-",
        knowsBirthTime: Boolean(profile.knows_birth_time),
        gender: profile.gender || "-",
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        level: profile.level || "débutant",
        isDemo: false,
        isLoading: false,
        loadError: false,
        subscriptionTier,
        subscriptionStatus,
        subscriptionPeriodEnd,
        subscriptionProvider,
        isPremium,
        isSubscriptionPremium: isPremium,
        astrology: {
          sunSign: { ...sunSign, degrees: "-" },
          moonSign: { sign: "-", symbol: "", element: "", degrees: "" },
          ascendant: profile.knows_birth_time
            ? { sign: "-", symbol: "", element: "", degrees: "" }
            : { sign: "Inconnu", symbol: "?", element: "-", degrees: "heure manquante" },
          planets: [],
          aspects: [],
          houses: [],
        },
        numerology,
      };

      setData(baseProfile);

      // Lazy-load full natal chart from Engine via edge function
      // (moon sign, ascendant, planets, houses, aspects)
      // A precise enriched chart requires both an explicit birth time and
      // geocoded coordinates. Never manufacture an ascendant from defaults.
      if (
        !profile.knows_birth_time
        || !profile.birth_time
        || profile.birth_latitude == null
        || profile.birth_longitude == null
      ) {
        return;
      }

      // Retry once after 3s if first attempt fails (session may not be ready)
      const fetchNatalChart = async (attempt = 1): Promise<void> => {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 3000));
              return fetchNatalChart(attempt + 1);
            }
            return;
          }

          const resp = await fetch(
            `${SUPABASE_URL}/functions/v1/get-natal-chart`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (!resp.ok) {
            if (attempt < 2) {
              await new Promise((r) => setTimeout(r, 3000));
              return fetchNatalChart(attempt + 1);
            }
            return;
          }
          const { chart } = await resp.json();
          if (!chart?.natal_chart) return;

          const nc = chart.natal_chart;
          const enrichedAstrology = enrichAstrologyFromEngine(baseProfile.astrology, nc);
          setData((prev) => ({ ...prev, astrology: enrichedAstrology }));
        } catch (e) {
          console.warn(`[useUserProfile] natal chart fetch failed (attempt ${attempt})`, e);
          if (attempt < 2) {
            await new Promise((r) => setTimeout(r, 3000));
            return fetchNatalChart(attempt + 1);
          }
        }
      };

      fetchNatalChart();
    })().catch(() => {
      // Unexpected exception while loading the profile: same rule as a DB
      // error above, never silently fall back to demo/onboarding.
      setData((d) => ({ ...d, loadError: true, isLoading: false }));
    });
  }, [user, authLoading, reloadKey]);

  return {
    ...data,
    reload,
    // Promotional access unlocks the same app surfaces without ever mutating
    // the Stripe-backed profile tier, status, cookie, or billing controls.
    isPremium: data.isPremium || promotionPass.isPremium,
    isSubscriptionPremium: data.isPremium,
  };
}

// ───────────────────────────────────────────────────────────────
// Engine response → UserProfile.astrology transformation
// ───────────────────────────────────────────────────────────────

const SIGN_SYMBOLS: Record<string, { symbol: string; element: string }> = {
  "Bélier": { symbol: "♈", element: "Feu" },
  "Taureau": { symbol: "♉", element: "Terre" },
  "Gémeaux": { symbol: "♊", element: "Air" },
  "Cancer": { symbol: "♋", element: "Eau" },
  "Lion": { symbol: "♌", element: "Feu" },
  "Vierge": { symbol: "♍", element: "Terre" },
  "Balance": { symbol: "♎", element: "Air" },
  "Scorpion": { symbol: "♏", element: "Eau" },
  "Sagittaire": { symbol: "♐", element: "Feu" },
  "Capricorne": { symbol: "♑", element: "Terre" },
  "Verseau": { symbol: "♒", element: "Air" },
  "Poissons": { symbol: "♓", element: "Eau" },
};

type EnginePoint = {
  sign?: string;
  degree?: number;
  minute?: number;
};

type EnginePlanet = EnginePoint & {
  symbol?: string;
  house?: number;
  interpretation?: string;
};

type EngineHouse = { sign?: string; description?: string };
type EngineAspect = {
  planet1?: string;
  planet2?: string;
  p1?: string;
  p2?: string;
  type?: string;
  aspect?: string;
  orb?: number;
  nature?: string;
  interpretation?: string;
};

type EngineNatalChart = {
  planets?: Record<string, EnginePlanet>;
  ascendant?: EnginePoint;
  houses?: EngineHouse[];
  aspects?: EngineAspect[];
};

function signInfo(sign: string | undefined | null, degree?: number, minute?: number) {
  if (!sign) return { sign: "-", symbol: "", element: "", degrees: "" };
  const info = SIGN_SYMBOLS[sign] || { symbol: "", element: "" };
  const deg = degree != null && minute != null ? `${degree}°${String(minute).padStart(2, "0")}'` : "";
  return { sign, symbol: info.symbol, element: info.element, degrees: deg };
}

function enrichAstrologyFromEngine(
  base: UserProfileData["astrology"],
  natalChart: EngineNatalChart
): UserProfileData["astrology"] {
  const planets = natalChart.planets || {};

  // Moon sign
  const moonData = planets["Lune"] || planets["Moon"];
  const moonSign = moonData
    ? signInfo(moonData.sign, moonData.degree, moonData.minute)
    : base.moonSign;

  // Sun sign (refine with exact degrees from engine)
  const sunData = planets["Soleil"] || planets["Sun"];
  const sunSign = sunData
    ? signInfo(sunData.sign, sunData.degree, sunData.minute)
    : base.sunSign;

  // Ascendant
  const ascData = natalChart.ascendant;
  const ascendant = ascData
    ? signInfo(ascData.sign, ascData.degree, ascData.minute)
    : base.ascendant;

  // Planets array (unified shape)
  const planetsList = Object.entries(planets).map(([name, p]) => ({
    name,
    symbol: p.symbol || "",
    sign: p.sign || "-",
    house: p.house || 0,
    degrees: p.degree != null ? `${p.degree}°${String(p.minute || 0).padStart(2, "0")}'` : "-",
    interpretation: p.interpretation || "",
  }));

  // Houses
  const housesList = Array.isArray(natalChart.houses)
    ? natalChart.houses.map((h, i) => ({
        house: i + 1,
        sign: h.sign || "-",
        description: h.description || "",
      }))
    : [];

  // Aspects
  const aspectsList = Array.isArray(natalChart.aspects)
    ? natalChart.aspects.map((a) => ({
        planet1: a.planet1 || a.p1 || "",
        planet2: a.planet2 || a.p2 || "",
        type: a.type || a.aspect || "",
        orb: a.orb ? `${a.orb}°` : "-",
        nature: a.nature || "-",
        interpretation: a.interpretation || "",
      }))
    : [];

  return {
    sunSign,
    moonSign,
    ascendant,
    planets: planetsList,
    aspects: aspectsList,
    houses: housesList,
  };
}

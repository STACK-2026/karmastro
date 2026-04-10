import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
    northNode: { sign: "—", house: 0, lesson: "Calcul du nœud lunaire indisponible sans heure de naissance" },
  };
}

export function useUserProfile(): UserProfileData {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<UserProfileData>({
    ...demoProfile,
    isDemo: true,
    isLoading: true,
  });

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

      if (error || !profile) {
        setData((d) => ({ ...d, isLoading: false }));
        return;
      }

      // Parse birth_date (stored as ISO date string)
      const birthDate = profile.birth_date ? new Date(profile.birth_date) : null;

      if (!birthDate || !profile.first_name) {
        // Incomplete profile : keep demo values but mark as demo
        setData({
          ...demoProfile,
          firstName: profile.first_name || demoProfile.firstName,
          isDemo: true,
          isLoading: false,
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
        birthTime: profile.birth_time || "—",
        birthPlace: profile.birth_place || "—",
        knowsBirthTime: Boolean(profile.knows_birth_time),
        gender: profile.gender || "—",
        interests: Array.isArray(profile.interests) ? profile.interests : [],
        level: profile.level || "débutant",
        isDemo: false,
        isLoading: false,
        astrology: {
          sunSign: { ...sunSign, degrees: "—" },
          moonSign: { sign: "—", symbol: "", element: "", degrees: "" },
          ascendant: profile.knows_birth_time
            ? { sign: "—", symbol: "", element: "", degrees: "" }
            : { sign: "Inconnu", symbol: "?", element: "—", degrees: "heure manquante" },
          planets: [],
          aspects: [],
          houses: [],
        },
        numerology,
      };

      setData(baseProfile);

      // Lazy-load full natal chart from Engine via edge function
      // (moon sign, ascendant, planets, houses, aspects)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const resp = await fetch(
          `${(supabase as any).supabaseUrl || "https://nkjbmbdrvejemzrggxvr.supabase.co"}/functions/v1/get-natal-chart`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (!resp.ok) return;
        const { chart } = await resp.json();
        if (!chart?.natal_chart) return;

        const nc = chart.natal_chart;
        const enrichedAstrology = enrichAstrologyFromEngine(baseProfile.astrology, nc);
        setData((prev) => ({ ...prev, astrology: enrichedAstrology }));
      } catch (e) {
        console.warn("[useUserProfile] natal chart fetch failed", e);
      }
    })().catch(() => {
      setData((d) => ({ ...d, isLoading: false }));
    });
  }, [user, authLoading]);

  return data;
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

function signInfo(sign: string | undefined | null, degree?: number, minute?: number) {
  if (!sign) return { sign: "—", symbol: "", element: "", degrees: "" };
  const info = SIGN_SYMBOLS[sign] || { symbol: "", element: "" };
  const deg = degree != null && minute != null ? `${degree}°${String(minute).padStart(2, "0")}'` : "";
  return { sign, symbol: info.symbol, element: info.element, degrees: deg };
}

function enrichAstrologyFromEngine(
  base: UserProfileData["astrology"],
  natalChart: any
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
  const planetsList = Object.entries(planets).map(([name, p]: [string, any]) => ({
    name,
    symbol: p.symbol || "",
    sign: p.sign || "—",
    house: p.house || 0,
    degrees: p.degree != null ? `${p.degree}°${String(p.minute || 0).padStart(2, "0")}'` : "—",
    interpretation: p.interpretation || "",
  }));

  // Houses
  const housesList = Array.isArray(natalChart.houses)
    ? natalChart.houses.map((h: any, i: number) => ({
        house: i + 1,
        sign: h.sign || "—",
        description: h.description || "",
      }))
    : [];

  // Aspects
  const aspectsList = Array.isArray(natalChart.aspects)
    ? natalChart.aspects.map((a: any) => ({
        planet1: a.planet1 || a.p1 || "",
        planet2: a.planet2 || a.p2 || "",
        type: a.type || a.aspect || "",
        orb: a.orb ? `${a.orb}°` : "—",
        nature: a.nature || "—",
        interpretation: a.interpretation || "",
      }))
    : [];

  return {
    sunSign,
    moonSign,
    ascendant,
    planets: planetsList as any,
    aspects: aspectsList as any,
    houses: housesList as any,
  };
}

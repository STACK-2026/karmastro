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

      setData({
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
          // Moon + ascendant + planets/houses/aspects require Swiss Ephemeris (Engine call)
          // For V1 we show dashes; follow-up edge function get-natal-chart will fill these.
          moonSign: { sign: "—", symbol: "", element: "", degrees: "" },
          ascendant: profile.knows_birth_time
            ? { sign: "—", symbol: "", element: "", degrees: "" }
            : { sign: "Inconnu", symbol: "?", element: "—", degrees: "heure manquante" },
          planets: [],
          aspects: [],
          houses: [],
        },
        numerology,
      });
    })().catch(() => {
      setData((d) => ({ ...d, isLoading: false }));
    });
  }, [user, authLoading]);

  return data;
}

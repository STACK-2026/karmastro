import { describe, expect, it } from "vitest";
import {
  EXTERNAL_LEGACY_ROUTES,
  INTERNAL_LEGACY_ROUTES,
} from "@/lib/legacy-routes";

describe("legacy article deeplinks", () => {
  it("maps profile promises to onboarding and completed accounts can be gated onward", () => {
    expect(INTERNAL_LEGACY_ROUTES["/profil-complet"]).toBe("/onboarding");
    expect(INTERNAL_LEGACY_ROUTES["/profils-cosmiques"]).toBe("/onboarding");
  });

  it("maps obsolete app modules to the closest live experience", () => {
    expect(INTERNAL_LEGACY_ROUTES["/synastrie"]).toBe("/compatibility");
    expect(INTERNAL_LEGACY_ROUTES["/compatibilite"]).toBe("/compatibility");
    expect(INTERNAL_LEGACY_ROUTES["/theme-astral"]).toBe("/astral");
    expect(INTERNAL_LEGACY_ROUTES["/consultations"]).toBe("/oracle");
    expect(INTERNAL_LEGACY_ROUTES["/previsions"]).toBe("/calendar");
  });

  it("sends obsolete calculators to the maintained public tools", () => {
    expect(EXTERNAL_LEGACY_ROUTES["/calculateur"]).toBe("https://karmastro.com/outils/");
    expect(EXTERNAL_LEGACY_ROUTES["/outils/chemin-de-vie"]).toBe(
      "https://karmastro.com/outils/chemin-de-vie/",
    );
    expect(EXTERNAL_LEGACY_ROUTES["/outils/calcul-annee-personnelle"]).toBe(
      "https://karmastro.com/outils/annee-personnelle/",
    );
  });

  it("does not define one legacy path twice", () => {
    const internal = new Set(Object.keys(INTERNAL_LEGACY_ROUTES));
    const duplicates = Object.keys(EXTERNAL_LEGACY_ROUTES).filter((path) => internal.has(path));
    expect(duplicates).toEqual([]);
  });
});

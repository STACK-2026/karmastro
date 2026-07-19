/**
 * Indexed articles still reference product names used before the current app
 * navigation was consolidated. Keep those promises useful and deterministic
 * instead of rendering the catch-all 404.
 */
export const INTERNAL_LEGACY_ROUTES: Readonly<Record<string, string>> = {
  "/analyse-croisee": "/numerology",
  "/aspects": "/astral",
  "/calendrier": "/calendar",
  "/calendrier-lunaire": "/calendar",
  "/chiron": "/astral",
  "/compatibilite": "/compatibility",
  "/compatibilite-amoureuse": "/compatibility",
  "/composite": "/compatibility",
  "/consultations": "/oracle",
  "/cycles": "/numerology",
  "/cycles-personnels": "/numerology",
  "/forces-cachees": "/astral",
  "/intentions": "/oracle",
  "/karmic": "/numerology",
  "/karmique": "/numerology",
  "/meditations": "/learn",
  "/methode": "/learn",
  "/numerologie": "/numerology",
  "/numerologie/chemin-de-vie": "/numerology",
  "/previsions": "/calendar",
  "/profil-complet": "/onboarding",
  "/profils-cosmiques": "/onboarding",
  "/promo-2026": "/pricing",
  "/synastrie": "/compatibility",
  "/test-vocation": "/numerology",
  "/theme-astral": "/astral",
  "/theme-natal": "/astral",
  "/transformation-lunaire": "/oracle",
};

export const EXTERNAL_LEGACY_ROUTES: Readonly<Record<string, string>> = {
  "/calcul-ascendant": "https://karmastro.com/outils/ascendant/",
  "/calcul-chemin-de-vie": "https://karmastro.com/outils/chemin-de-vie/",
  "/calcul-nombre-expression": "https://karmastro.com/outils/nombre-expression/",
  "/calculateur": "https://karmastro.com/outils/",
  "/outils/calcul-annee-personnelle": "https://karmastro.com/outils/annee-personnelle/",
  "/outils/chemin-de-vie": "https://karmastro.com/outils/chemin-de-vie/",
  "/transits": "https://karmastro.com/outils/transits/",
};

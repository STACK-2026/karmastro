// Karmastro translations - UI strings only
// Pages content stays separate (too heavy for this file)
// Organized by section, flat keys for easy extension

import type { Locale } from "./config";

export type TranslationKeys = {
  // Navigation
  "nav.home": string;
  "nav.horoscope": string;
  "nav.tools": string;
  "nav.blog": string;
  "nav.referral": string;
  "nav.oracle": string;
  "nav.profile": string;

  // Header / common
  "common.menu": string;
  "common.close": string;
  "common.free": string;
  "common.loading": string;
  "common.error": string;
  "common.retry": string;
  "common.back": string;
  "common.share": string;
  "common.download_pdf": string;
  "common.calculate": string;

  // Footer
  "footer.tagline": string;
  "footer.about": string;
  "footer.legal": string;
  "footer.contact": string;
  "footer.cgv": string;
  "footer.privacy": string;
  "footer.terms": string;

  // Hero (homepage)
  "hero.title": string;
  "hero.subtitle": string;
  "hero.cta_primary": string;
  "hero.cta_secondary": string;
  "hero.free_badge": string;

  // Pricing
  "pricing.free": string;
  "pricing.monthly": string;
  "pricing.annual": string;
  "pricing.one_time": string;
  "pricing.per_month": string;
  "pricing.per_year": string;
  "pricing.most_popular": string;
  "pricing.current_plan": string;

  // Oracle
  "oracle.ask": string;
  "oracle.thinking": string;
  "oracle.ask_placeholder": string;
  "oracle.feedback_resonates": string;
  "oracle.feedback_interesting": string;
  "oracle.feedback_not_this_time": string;

  // Language switcher
  "lang.select": string;
  "lang.current": string;
};

const fr: TranslationKeys = {
  "nav.home": "Accueil",
  "nav.horoscope": "Horoscope",
  "nav.tools": "Outils",
  "nav.blog": "Le Cosmos",
  "nav.referral": "Parrainage",
  "nav.oracle": "L'Oracle",
  "nav.profile": "Mon profil",

  "common.menu": "Menu",
  "common.close": "Fermer",
  "common.free": "Gratuit",
  "common.loading": "Chargement...",
  "common.error": "Une erreur est survenue",
  "common.retry": "Réessayer",
  "common.back": "Retour",
  "common.share": "Partager",
  "common.download_pdf": "Télécharger PDF",
  "common.calculate": "Calculer",

  "footer.tagline": "Ta carte de vie écrite dans les étoiles et les nombres",
  "footer.about": "Notre histoire",
  "footer.legal": "Mentions légales",
  "footer.contact": "Contact",
  "footer.cgv": "CGV",
  "footer.privacy": "Politique de confidentialité",
  "footer.terms": "Conditions d'utilisation",

  "hero.title": "Ta carte de vie cosmique, décodée",
  "hero.subtitle": "L'Oracle croise ton thème natal, ta numérologie et ta guidance karmique en temps réel. Swiss Ephemeris, précision niveau NASA.",
  "hero.cta_primary": "Découvrir mon profil",
  "hero.cta_secondary": "Voir les outils gratuits",
  "hero.free_badge": "Gratuit pour commencer",

  "pricing.free": "Gratuit",
  "pricing.monthly": "Mensuel",
  "pricing.annual": "Annuel",
  "pricing.one_time": "Paiement unique",
  "pricing.per_month": "par mois",
  "pricing.per_year": "par an",
  "pricing.most_popular": "Le plus populaire",
  "pricing.current_plan": "Plan actuel",

  "oracle.ask": "Pose ta question",
  "oracle.thinking": "L'Oracle consulte les étoiles...",
  "oracle.ask_placeholder": "Pose ta question à l'Oracle...",
  "oracle.feedback_resonates": "Ça résonne",
  "oracle.feedback_interesting": "Intéressant, dis-m'en plus",
  "oracle.feedback_not_this_time": "Pas cette fois",

  "lang.select": "Choisir la langue",
  "lang.current": "Langue actuelle",
};

// English translation (passe 1 - to be reviewed by native speaker)
const en: TranslationKeys = {
  "nav.home": "Home",
  "nav.horoscope": "Horoscope",
  "nav.tools": "Tools",
  "nav.blog": "The Cosmos",
  "nav.referral": "Referral",
  "nav.oracle": "The Oracle",
  "nav.profile": "My profile",

  "common.menu": "Menu",
  "common.close": "Close",
  "common.free": "Free",
  "common.loading": "Loading...",
  "common.error": "An error occurred",
  "common.retry": "Retry",
  "common.back": "Back",
  "common.share": "Share",
  "common.download_pdf": "Download PDF",
  "common.calculate": "Calculate",

  "footer.tagline": "Your life map written in the stars and numbers",
  "footer.about": "Our story",
  "footer.legal": "Legal notice",
  "footer.contact": "Contact",
  "footer.cgv": "Terms of sale",
  "footer.privacy": "Privacy policy",
  "footer.terms": "Terms of use",

  "hero.title": "Your cosmic life map, decoded",
  "hero.subtitle": "The Oracle crosses your birth chart, numerology and karmic guidance in real time. Swiss Ephemeris, NASA-grade precision.",
  "hero.cta_primary": "Discover my profile",
  "hero.cta_secondary": "See the free tools",
  "hero.free_badge": "Free to start",

  "pricing.free": "Free",
  "pricing.monthly": "Monthly",
  "pricing.annual": "Yearly",
  "pricing.one_time": "One-time payment",
  "pricing.per_month": "per month",
  "pricing.per_year": "per year",
  "pricing.most_popular": "Most popular",
  "pricing.current_plan": "Current plan",

  "oracle.ask": "Ask your question",
  "oracle.thinking": "The Oracle consults the stars...",
  "oracle.ask_placeholder": "Ask the Oracle a question...",
  "oracle.feedback_resonates": "It resonates",
  "oracle.feedback_interesting": "Interesting, tell me more",
  "oracle.feedback_not_this_time": "Not this time",

  "lang.select": "Choose language",
  "lang.current": "Current language",
};

// Placeholders - fallback to FR for now
// Each language will be filled progressively during the translation phase
const placeholderFR: TranslationKeys = { ...fr };

export const translations: Record<Locale, TranslationKeys> = {
  fr,
  en,
  es: placeholderFR,
  pt: placeholderFR,
  de: placeholderFR,
  it: placeholderFR,
  tr: placeholderFR,
  ar: placeholderFR,
  ja: placeholderFR,
  pl: placeholderFR,
  ru: placeholderFR,
};

// Simple t() helper
export function t(key: keyof TranslationKeys, locale: Locale): string {
  return translations[locale]?.[key] || translations.fr[key] || key;
}

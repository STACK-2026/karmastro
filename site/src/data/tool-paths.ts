// Tool page paths per locale, used by BaseLayout to emit correct hreflang
// alternates. Tool slugs are localized per language (karmic-debt in EN,
// deuda-karmica in ES, etc.) and the container folder itself is translated
// (tools / herramientas / ferramentas / ...), so naive `/locale + path`
// construction produced 404s on every alternate. This module provides the
// ground-truth map derived from the actual pages in src/pages.

import type { Locale } from "../i18n/config";

// Canonical tool key == FR slug. A null in the map means that tool has no
// page in the locale and must be omitted from hreflang alternates.
export type ToolKey =
  | "dette-karmique"
  | "theme-natal"
  | "ascendant"
  | "chemin-de-vie"
  | "nombre-expression"
  | "annee-personnelle"
  | "transits"
  | "compatibilite"
  | "synastrie";

// Folder name housing the tool pages per locale (the URL segment right after
// the locale prefix). Example : https://karmastro.com/de/werkzeuge/...
const TOOLS_DIR: Record<Locale, string> = {
  fr: "outils",
  en: "tools",
  es: "herramientas",
  pt: "ferramentas",
  de: "werkzeuge",
  it: "strumenti",
  tr: "araclar",
  pl: "narzedzia",
  ru: "instrumenty",
  ja: "shindan",
  ar: "adawat",
};

// Localized slug per tool per locale. null means the tool is not published
// in this locale yet (9 locales only have 6 tools today).
const TOOL_SLUG: Record<ToolKey, Record<Locale, string | null>> = {
  "dette-karmique": {
    fr: "dette-karmique", en: "karmic-debt",
    es: null, pt: null, de: null, it: null, tr: null,
    pl: null, ru: null, ja: null, ar: null,
  },
  "theme-natal": {
    fr: "theme-natal", en: "birth-chart",
    es: "carta-natal", pt: "mapa-natal", de: "geburtshoroskop",
    it: "tema-natale", tr: "dogum-haritasi", pl: "horoskop-natalny",
    ru: "natalnaya-karta", ja: "shusseizu", ar: "kharitat-mawlid",
  },
  "ascendant": {
    fr: "ascendant", en: "rising-sign",
    es: "ascendente", pt: "ascendente", de: "aszendent",
    it: "ascendente", tr: "yukselen-burc", pl: "wschodzacy-znak",
    ru: "voskhodyaschiy-znak", ja: "asendanto", ar: "al-taaali",
  },
  "chemin-de-vie": {
    fr: "chemin-de-vie", en: "life-path-number",
    es: "camino-de-vida", pt: "numero-do-caminho-de-vida",
    de: "lebenszahl", it: "numero-del-cammino-di-vita",
    tr: "yasam-yolu-sayisi", pl: "liczba-drogi-zycia",
    ru: "chislo-zhiznennogo-puti", ja: "raifu-pasu-nanbaa",
    ar: "raqm-masar-al-hayat",
  },
  "nombre-expression": {
    fr: "nombre-expression", en: "expression-number",
    es: "numero-expresion", pt: "numero-expressao",
    de: "ausdruckszahl", it: "numero-espressione",
    tr: "ifade-sayisi", pl: "liczba-ekspresji",
    ru: "chislo-vyrazheniya", ja: "hyougen-suu", ar: "raqm-tabir",
  },
  "annee-personnelle": {
    fr: "annee-personnelle", en: "personal-year",
    es: "ano-personal", pt: "ano-pessoal", de: "personliches-jahr",
    it: "anno-personale", tr: "kisisel-yil", pl: "rok-osobisty",
    ru: "lichnyi-god", ja: "kojin-toshi", ar: "sanat-shakhseya",
  },
  "transits": {
    fr: "transits", en: "transits",
    es: null, pt: null, de: null, it: null, tr: null,
    pl: null, ru: null, ja: null, ar: null,
  },
  "compatibilite": {
    fr: "compatibilite", en: "compatibility",
    es: "compatibilidad", pt: "compatibilidade", de: "partnerhoroskop",
    it: "compatibilita", tr: "uyumluluk", pl: "kompatybilnosc",
    ru: "sovmestimost", ja: "aishou-shindan", ar: "tawafuq-azwaj",
  },
  "synastrie": {
    fr: "synastrie", en: "synastry",
    es: null, pt: null, de: null, it: null, tr: null,
    pl: null, ru: null, ja: null, ar: null,
  },
};

// Reverse lookup : given a (locale, localized_slug), find the canonical key.
const REVERSE_INDEX: Record<string, ToolKey> = {};
for (const [key, perLocale] of Object.entries(TOOL_SLUG) as [ToolKey, Record<Locale, string | null>][]) {
  for (const [locale, slug] of Object.entries(perLocale) as [Locale, string | null][]) {
    if (slug) {
      REVERSE_INDEX[`${locale}:${slug}`] = key;
    }
  }
}

// Given a pathname (with its locale prefix stripped, e.g. "/outils/theme-natal"
// or "/werkzeuge/geburtshoroskop"), attempt to detect a tool match and return
// the canonical key. Returns null if the path is not a tool page.
export function detectToolKey(pathWithoutLocale: string, currentLocale: Locale): ToolKey | null {
  const segments = pathWithoutLocale.split("/").filter(Boolean);
  if (segments.length < 2) return null;
  const [toolsDir, slug] = segments;
  if (toolsDir !== TOOLS_DIR[currentLocale]) return null;
  return REVERSE_INDEX[`${currentLocale}:${slug}`] ?? null;
}

// Build the tool path for a given locale, or null if the tool is not
// published in that locale.
export function toolPathFor(locale: Locale, key: ToolKey): string | null {
  const slug = TOOL_SLUG[key][locale];
  if (!slug) return null;
  const prefix = locale === "fr" ? "" : `/${locale}`;
  return `${prefix}/${TOOLS_DIR[locale]}/${slug}`;
}

// Return the tools hub path for a given locale (e.g. "/outils", "/de/werkzeuge").
export function toolsHubPathFor(locale: Locale): string {
  const prefix = locale === "fr" ? "" : `/${locale}`;
  return `${prefix}/${TOOLS_DIR[locale]}`;
}

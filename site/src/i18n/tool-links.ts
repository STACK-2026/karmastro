// Central mapping of tool keys to localized URLs.
// Used by Features, StatsSection, and anywhere that needs a click-through
// from a UI element to its corresponding tool/app destination.

import type { Locale } from "./config";
import { siteConfig } from "../../site.config";

type ToolKey =
  | "oracle"
  | "birth-chart"
  | "numerology"
  | "compatibility"
  | "transits"
  | "karmic"
  | "tools-index"
  | "blog-index";

// Tools index per locale (always exists)
const TOOLS_INDEX: Record<Locale, string> = {
  fr: "/outils",
  en: "/en/tools",
  es: "/es/herramientas",
  pt: "/pt/ferramentas",
  de: "/de/werkzeuge",
  it: "/it/strumenti",
  tr: "/tr/araclar",
  pl: "/pl/narzedzia",
  ru: "/ru/instrumenty",
  ja: "/ja/shindan",
  ar: "/ar/adawat",
};

const BLOG_INDEX: Record<Locale, string> = {
  fr: "/blog",
  en: "/en/blog",
  es: "/es/blog",
  pt: "/pt/blog",
  de: "/de/blog",
  it: "/it/blog",
  tr: "/tr/blog",
  pl: "/pl/blog",
  ru: "/ru/blog",
  ja: "/ja/blog",
  ar: "/ar/blog",
};

// Per-tool per-locale slugs, with fallback to tools index when a localized
// calculator page does not yet exist.
const BIRTH_CHART: Partial<Record<Locale, string>> = {
  fr: "/outils/theme-natal",
  en: "/en/tools/birth-chart",
};

const NUMEROLOGY: Partial<Record<Locale, string>> = {
  fr: "/outils/chemin-de-vie",
  en: "/en/tools/life-path-number",
  es: "/es/herramientas/camino-de-vida",
  pt: "/pt/ferramentas/numero-do-caminho-de-vida",
  de: "/de/werkzeuge/lebenszahl",
  it: "/it/strumenti/numero-del-cammino-di-vita",
  tr: "/tr/araclar/yasam-yolu-sayisi",
  pl: "/pl/narzedzia/liczba-drogi-zycia",
  ru: "/ru/instrumenty/chislo-zhiznennogo-puti",
  ja: "/ja/shindan/raifu-pasu-nanbaa",
  ar: "/ar/adawat/raqm-masar-al-hayat",
};

const COMPATIBILITY: Partial<Record<Locale, string>> = {
  fr: "/outils/compatibilite",
  en: "/en/tools/compatibility",
};

const TRANSITS: Partial<Record<Locale, string>> = {
  fr: "/outils/transits",
  en: "/en/tools/transits",
};

const KARMIC: Partial<Record<Locale, string>> = {
  fr: "/outils/dette-karmique",
  en: "/en/tools/karmic-debt",
};

export function getToolUrl(key: ToolKey, locale: Locale): string {
  switch (key) {
    case "oracle":
      return `${siteConfig.appUrl}/oracle`;
    case "tools-index":
      return TOOLS_INDEX[locale];
    case "blog-index":
      return BLOG_INDEX[locale];
    case "birth-chart":
      return BIRTH_CHART[locale] ?? TOOLS_INDEX[locale];
    case "numerology":
      return NUMEROLOGY[locale] ?? TOOLS_INDEX[locale];
    case "compatibility":
      return COMPATIBILITY[locale] ?? TOOLS_INDEX[locale];
    case "transits":
      return TRANSITS[locale] ?? TOOLS_INDEX[locale];
    case "karmic":
      return KARMIC[locale] ?? TOOLS_INDEX[locale];
    default:
      return TOOLS_INDEX[locale];
  }
}

// Map icon names (used in Features.astro) to tool keys.
export const ICON_TO_TOOL: Record<string, ToolKey> = {
  star: "birth-chart",
  chart: "numerology",
  zap: "oracle",
  users: "compatibility",
  search: "transits",
  shield: "karmic",
};

// Map stats labelKey to tool keys.
export const STAT_TO_TOOL: Record<string, ToolKey> = {
  planets: "birth-chart",
  houses: "birth-chart",
  tools: "tools-index",
  guides: "oracle",
  // years/precision fall through to blog/home elsewhere
};

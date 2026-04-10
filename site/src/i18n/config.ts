// Karmastro i18n configuration - 11 languages
// Uses Astro's native i18n routing with prefixDefaultLocale: false
// (so /fr/... is served as /... for the default locale)

export const LOCALES = [
  "fr", // Français (default)
  "en", // English
  "es", // Español
  "pt", // Português
  "de", // Deutsch
  "it", // Italiano
  "tr", // Türkçe
  "ar", // العربية
  "ja", // 日本語
  "pl", // Polski
  "ru", // Русский
] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "fr";

export const LOCALE_NAMES: Record<Locale, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  pt: "Português",
  de: "Deutsch",
  it: "Italiano",
  tr: "Türkçe",
  ar: "العربية",
  ja: "日本語",
  pl: "Polski",
  ru: "Русский",
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  fr: "🇫🇷",
  en: "🇬🇧",
  es: "🇪🇸",
  pt: "🇵🇹",
  de: "🇩🇪",
  it: "🇮🇹",
  tr: "🇹🇷",
  ar: "🇸🇦",
  ja: "🇯🇵",
  pl: "🇵🇱",
  ru: "🇷🇺",
};

// RTL locales (for CSS direction)
export const RTL_LOCALES: Locale[] = ["ar"];

export function isRTL(locale: Locale): boolean {
  return RTL_LOCALES.includes(locale);
}

// Build a localized URL for a given path and locale
// Default locale has no prefix : /foo (fr default)
// Other locales : /en/foo, /es/foo...
export function localizeUrl(path: string, locale: Locale = DEFAULT_LOCALE): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) {
    return cleanPath;
  }
  return `/${locale}${cleanPath}`;
}

// Extract the locale from a URL path
export function extractLocale(pathname: string): Locale {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return DEFAULT_LOCALE;
  const first = parts[0];
  if (LOCALES.includes(first as Locale) && first !== DEFAULT_LOCALE) {
    return first as Locale;
  }
  return DEFAULT_LOCALE;
}

// Strip the locale prefix from a path
// /en/horoscope -> /horoscope
export function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  const first = parts[0];
  if (LOCALES.includes(first as Locale) && first !== DEFAULT_LOCALE) {
    return "/" + parts.slice(1).join("/");
  }
  return pathname;
}

// Locale detection + currency formatting for the React app.
// Reads the karmastro_lang cookie set by the site (LanguageSwitcher),
// then falls back to navigator.language. Shared between app pages.

const SUPPORTED = ["fr", "en", "es", "pt", "de", "it", "tr", "pl", "ja", "ar", "ru"] as const;
export type AppLocale = (typeof SUPPORTED)[number];

/**
 * Detect the user's locale with this priority chain:
 *   1. ?lang=xx URL query param (for direct site -> app navigation links)
 *   2. karmastro_lang cookie (shared with karmastro.com via Domain=.karmastro.com)
 *   3. navigator.language
 *   4. "fr" fallback
 */
export function detectLocale(): AppLocale {
  if (typeof window === "undefined") return "fr";

  // 1. URL query param
  try {
    const urlLang = new URLSearchParams(window.location.search).get("lang");
    if (urlLang && (SUPPORTED as readonly string[]).includes(urlLang)) {
      // Persist to cookie so subsequent nav keeps it
      setLocaleCookie(urlLang as AppLocale);
      return urlLang as AppLocale;
    }
  } catch {}

  // 2. Cookie
  try {
    const m = document.cookie.match(/(?:^|;\s*)karmastro_lang=([^;]+)/);
    if (m && (SUPPORTED as readonly string[]).includes(m[1])) {
      return m[1] as AppLocale;
    }
  } catch {}

  // 3. navigator.language
  try {
    const nav = navigator.language?.slice(0, 2).toLowerCase();
    if (nav && (SUPPORTED as readonly string[]).includes(nav)) {
      return nav as AppLocale;
    }
  } catch {}

  return "fr";
}

export function setLocaleCookie(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `karmastro_lang=${locale}; Path=/; Domain=.karmastro.com; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    // Also mirror in localStorage for faster access
    localStorage.setItem("km_lang", locale);
  } catch {}
}

/**
 * Apply the detected locale to the <html lang> attribute + document direction (RTL for Arabic).
 * Call once at app init (App.tsx).
 */
export function applyLocaleToDocument(locale: AppLocale): void {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("lang", locale);
  document.documentElement.setAttribute("dir", locale === "ar" ? "rtl" : "ltr");
}

// ──────────────────────────────────────────────────────────────
// Currency (shared with edge function stripe-checkout)
// ──────────────────────────────────────────────────────────────

export const LOCALE_CURRENCY: Record<
  string,
  { code: string; symbol: string; symbolBefore: boolean; rate: number; zeroDecimal: boolean }
> = {
  fr: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  es: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  pt: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  de: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  it: { code: "EUR", symbol: "€", symbolBefore: false, rate: 1, zeroDecimal: false },
  en: { code: "USD", symbol: "$", symbolBefore: true, rate: 1.08, zeroDecimal: false },
  tr: { code: "TRY", symbol: "₺", symbolBefore: false, rate: 37, zeroDecimal: false },
  pl: { code: "PLN", symbol: "zł", symbolBefore: false, rate: 4.3, zeroDecimal: false },
  ja: { code: "JPY", symbol: "¥", symbolBefore: true, rate: 165, zeroDecimal: true },
  ar: { code: "USD", symbol: "$", symbolBefore: true, rate: 1.08, zeroDecimal: false },
  ru: { code: "USD", symbol: "$", symbolBefore: true, rate: 1.08, zeroDecimal: false },
};

export function formatPrice(eurAmount: number, locale: string): string {
  const currency = LOCALE_CURRENCY[locale] || LOCALE_CURRENCY.fr;
  const localAmount = eurAmount * currency.rate;
  const decimals = currency.zeroDecimal ? 0 : 2;
  const rounded = localAmount.toFixed(decimals);
  const [intPart, decPart] = rounded.split(".");
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.code === "EUR" ? " " : ",");
  const amount = decPart ? `${intFormatted},${decPart}` : intFormatted;
  return currency.symbolBefore ? `${currency.symbol}${amount}` : `${amount} ${currency.symbol}`;
}

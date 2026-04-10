// Locale → currency mapping + price conversion for display
// Stripe charges in EUR (single source of truth), but we DISPLAY local currency on the site
// to optimize conversion. User's card will be auto-converted by their bank at checkout.

import type { Locale } from "./config";

export type CurrencyCode = "EUR" | "USD" | "GBP" | "CAD" | "JPY" | "TRY" | "PLN" | "RUB" | "SAR" | "BRL";

export type CurrencyInfo = {
  code: CurrencyCode;
  symbol: string;
  symbolBefore: boolean; // ex: "$5" vs "5€"
  // Multiplier vs EUR (approximate, static for display only)
  // Stripe will always charge EUR, bank handles conversion
  eurToLocal: number;
  // Decimal separator for display
  decimalSep: string;
  thousandsSep: string;
};

export const CURRENCIES: Record<CurrencyCode, CurrencyInfo> = {
  EUR: { code: "EUR", symbol: "€", symbolBefore: false, eurToLocal: 1, decimalSep: ",", thousandsSep: " " },
  USD: { code: "USD", symbol: "$", symbolBefore: true, eurToLocal: 1.08, decimalSep: ".", thousandsSep: "," },
  GBP: { code: "GBP", symbol: "£", symbolBefore: true, eurToLocal: 0.85, decimalSep: ".", thousandsSep: "," },
  CAD: { code: "CAD", symbol: "C$", symbolBefore: true, eurToLocal: 1.48, decimalSep: ".", thousandsSep: "," },
  JPY: { code: "JPY", symbol: "¥", symbolBefore: true, eurToLocal: 165, decimalSep: ".", thousandsSep: "," },
  TRY: { code: "TRY", symbol: "₺", symbolBefore: false, eurToLocal: 37, decimalSep: ",", thousandsSep: "." },
  PLN: { code: "PLN", symbol: "zł", symbolBefore: false, eurToLocal: 4.3, decimalSep: ",", thousandsSep: " " },
  RUB: { code: "RUB", symbol: "₽", symbolBefore: false, eurToLocal: 100, decimalSep: ",", thousandsSep: " " },
  SAR: { code: "SAR", symbol: "﷼", symbolBefore: false, eurToLocal: 4.05, decimalSep: ".", thousandsSep: "," },
  BRL: { code: "BRL", symbol: "R$", symbolBefore: true, eurToLocal: 5.5, decimalSep: ",", thousandsSep: "." },
};

// Map locale → preferred display currency
// FR/ES/PT/DE/IT → EUR (euro zone or close)
// EN → USD (default for international English, could be GBP for UK)
// Others : local currency where possible
export const LOCALE_CURRENCY: Record<Locale, CurrencyCode> = {
  fr: "EUR",
  es: "EUR",
  pt: "EUR",
  de: "EUR",
  it: "EUR",
  en: "USD", // or GBP depending on user's region
  tr: "TRY",
  pl: "PLN",
  ru: "RUB",
  ja: "JPY",
  ar: "SAR",
};

/**
 * Format a price in EUR cents for display in the locale's currency.
 * @param eurCents - price in EUR cents (e.g. 599 = 5.99€)
 * @param locale - user's locale
 * @returns formatted price string (e.g. "5,99€" or "$6.47" or "¥988")
 */
export function formatPrice(eurCents: number, locale: Locale): string {
  const currency = CURRENCIES[LOCALE_CURRENCY[locale]];
  const eurAmount = eurCents / 100;
  const localAmount = eurAmount * currency.eurToLocal;

  // For JPY we typically don't show decimals
  const decimals = currency.code === "JPY" ? 0 : 2;
  const rounded = localAmount.toFixed(decimals);

  // Apply thousand separators and decimal format
  const [intPart, decPart] = rounded.split(".");
  const withThousands = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, currency.thousandsSep);
  const formatted = decPart ? `${withThousands}${currency.decimalSep}${decPart}` : withThousands;

  return currency.symbolBefore
    ? `${currency.symbol}${formatted}`
    : `${formatted}${currency.symbol}`;
}

/**
 * Return a small disclaimer text about the actual charge being in EUR.
 * Shown next to non-EUR prices.
 */
export function getChargeDisclaimer(locale: Locale): string | null {
  const currency = CURRENCIES[LOCALE_CURRENCY[locale]];
  if (currency.code === "EUR") return null;

  const disclaimers: Partial<Record<Locale, string>> = {
    en: "Approximate. Charged in EUR by your bank.",
    es: "Aproximado. Cobrado en EUR por tu banco.",
    pt: "Aproximado. Cobrado em EUR pelo teu banco.",
    de: "Ungefähr. Wird in EUR von deiner Bank abgebucht.",
    it: "Approssimativo. Addebitato in EUR dalla tua banca.",
    tr: "Yaklaşık. Bankan tarafından EUR cinsinden tahsil edilir.",
    pl: "Przybliżone. Pobrane w EUR przez twój bank.",
    ru: "Приблизительно. Списывается в EUR твоим банком.",
    ja: "目安価格。あなたの銀行によってEURで請求されます。",
    ar: "تقريبي. يتم تحصيله باليورو من قبل البنك.",
  };

  return disclaimers[locale] || "Charged in EUR.";
}

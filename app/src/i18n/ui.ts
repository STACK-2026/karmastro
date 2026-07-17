// Karmastro app UI translations, loaded one locale at a time.
import { Fragment, createContext, createElement, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { applyLocaleToDocument, detectLocale, type AppLocale } from "@/lib/locale";
import frDictionary from "./locales/fr";
import type { UiKey, UiStrings } from "./ui-types";

export type { UiKey, UiStrings } from "./ui-types";
export type UiDictionary = Partial<UiStrings>;
export const fr = frDictionary;
export const UI_LOCALES = ["fr", "en", "es", "pt", "de", "it", "tr", "pl", "ru", "ja", "ar"] as const satisfies readonly AppLocale[];

const loaders: Record<Exclude<AppLocale, "fr">, () => Promise<{ default: UiDictionary }>> = {
  en: () => import("./locales/en"),
  es: () => import("./locales/es"),
  pt: () => import("./locales/pt"),
  de: () => import("./locales/de"),
  it: () => import("./locales/it"),
  tr: () => import("./locales/tr"),
  pl: () => import("./locales/pl"),
  ru: () => import("./locales/ru"),
  ja: () => import("./locales/ja"),
  ar: () => import("./locales/ar"),
};

const cache: Partial<Record<AppLocale, UiDictionary>> = { fr };

export async function loadUiDictionary(locale: AppLocale): Promise<UiDictionary> {
  if (cache[locale]) return cache[locale]!;
  try {
    const loaded = await loaders[locale as Exclude<AppLocale, "fr">]();
    cache[locale] = loaded.default;
  } catch {
    cache[locale] = fr;
  }
  return cache[locale]!;
}

export function translate(
  key: UiKey,
  dictionary: UiDictionary,
  params?: Record<string, string | number>,
): string {
  const value = dictionary[key] ?? fr[key] ?? key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, name) =>
    params[name] !== undefined ? String(params[name]) : match
  );
}

// Synchronous compatibility helper. Non-French dictionaries become available
// after their provider has loaded them; French remains the safe fallback.
export function t(
  key: UiKey,
  locale: AppLocale,
  params?: Record<string, string | number>,
): string {
  return translate(key, cache[locale] ?? fr, params);
}

type I18nValue = {
  locale: AppLocale;
  t: (key: UiKey, params?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [locale] = useState<AppLocale>(() => detectLocale());
  const [dictionary, setDictionary] = useState<UiDictionary | null>(() => cache[locale] ?? null);

  useEffect(() => {
    applyLocaleToDocument(locale);
    if (dictionary) return;
    let active = true;
    loadUiDictionary(locale).then((loaded) => { if (active) setDictionary(loaded); });
    return () => { active = false; };
  }, [dictionary, locale]);

  const value = useMemo<I18nValue | null>(() => dictionary ? ({
    locale,
    t: (key, params) => translate(key, dictionary, params),
  }) : null, [dictionary, locale]);

  if (!value) return createElement(Fragment, null, fallback);
  return createElement(I18nContext.Provider, { value }, children);
}

export function useT(): I18nValue {
  const value = useContext(I18nContext);
  if (value) return value;
  return { locale: "fr", t: (key, params) => translate(key, fr, params) };
}

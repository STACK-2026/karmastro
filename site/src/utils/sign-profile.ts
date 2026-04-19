// Load a sign profile JSON for a given locale.
// Locales without a generated profile fall back to French (the authored source).
import fs from "fs";
import path from "path";
import type { Locale } from "../i18n/config";
import { DEFAULT_LOCALE } from "../i18n/config";

export type SignProfile = {
  tagline: string;
  intro: string;
  strengths: string[];
  weaknesses: string[];
  in_love: string;
  in_friendship: string;
  at_work: string;
  best_matches: Array<{ slug: string; score: number; why: string }>;
  challenging_matches: Array<{ slug: string; why: string }>;
  attributes: {
    gemstone: string;
    animal_totem: string;
    flower: string;
    color: string;
    lucky_day: string;
    lucky_number: number;
    metal: string;
  };
  famous_people: string[];
  faq: Array<{ q: string; a: string }>;
};

const cache = new Map<string, SignProfile | null>();

export function loadSignProfile(slug: string, locale: Locale = DEFAULT_LOCALE): SignProfile | null {
  const key = `${locale}:${slug}`;
  if (cache.has(key)) return cache.get(key)!;

  const filePath = path.join(process.cwd(), "src/data/sign-profiles", locale, `${slug}.json`);
  let data: SignProfile | null = null;
  try {
    if (fs.existsSync(filePath)) {
      data = JSON.parse(fs.readFileSync(filePath, "utf-8")) as SignProfile;
    } else if (locale !== DEFAULT_LOCALE) {
      const fallback = path.join(process.cwd(), "src/data/sign-profiles", DEFAULT_LOCALE, `${slug}.json`);
      if (fs.existsSync(fallback)) {
        data = JSON.parse(fs.readFileSync(fallback, "utf-8")) as SignProfile;
      }
    }
  } catch {
    data = null;
  }
  cache.set(key, data);
  return data;
}

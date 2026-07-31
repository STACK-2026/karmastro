import { describe, expect, it } from "vitest";
import {
  normalizeWelcomeLocale,
  welcomeEmail,
  WELCOME_LOCALES,
} from "../../supabase/functions/_shared/email-templates";

const SUBJECT_MARKERS: Record<(typeof WELCOME_LOCALES)[number], string> = {
  "fr-FR": "Bienvenue sur Karmastro",
  "en-US": "Welcome to Karmastro",
  "es-ES": "Te damos la bienvenida a Karmastro",
  "es-MX": "Te damos la bienvenida a Karmastro",
  "de-DE": "Willkommen bei Karmastro",
  "it-IT": "Benvenuto su Karmastro",
  "pt-BR": "Boas-vindas à Karmastro",
  "nl-NL": "Welkom bij Karmastro",
  "ja-JP": "Karmastroへようこそ",
  "ko-KR": "Karmastro에 오신 것을 환영합니다",
  "zh-Hans": "欢迎来到 Karmastro",
  ar: "مرحبًا بك في Karmastro",
  "tr-TR": "Karmastro'ya hoş geldin",
  "pl-PL": "Witaj w Karmastro",
  "ru-RU": "Добро пожаловать в Karmastro",
  "uk-UA": "Ласкаво просимо до Karmastro",
  "cs-CZ": "Vítej v Karmastro",
  "hu-HU": "Üdvözlünk a Karmastróban",
  "ro-RO": "Bun venit la Karmastro",
  "sv-SE": "Välkommen till Karmastro",
  "da-DK": "Velkommen til Karmastro",
  "nb-NO": "Velkommen til Karmastro",
  "fi-FI": "Tervetuloa Karmastroon",
  "el-GR": "Καλώς ήρθες στο Karmastro",
  "th-TH": "ยินดีต้อนรับสู่ Karmastro",
  "vi-VN": "Chào mừng đến với Karmastro",
  "id-ID": "Selamat datang di Karmastro",
  "ms-MY": "Selamat datang ke Karmastro",
};

const LEGACY_APP_QUERY: Partial<Record<(typeof WELCOME_LOCALES)[number], string>> = {
  "en-US": "en",
  "es-ES": "es",
  "es-MX": "es",
  "de-DE": "de",
  "it-IT": "it",
  "pt-BR": "pt",
  "ja-JP": "ja",
  ar: "ar",
  "tr-TR": "tr",
  "pl-PL": "pl",
  "ru-RU": "ru",
};

describe("welcome email localization", () => {
  it.each(WELCOME_LOCALES)("renders native %s subject, document language, copy and CTA", (locale) => {
    const email = welcomeEmail("Ari", "Sam", locale);

    expect(email.subject).toContain(SUBJECT_MARKERS[locale]);
    expect(email.html).toContain(`<html lang="${locale}"`);
    expect(email.html).toContain(locale === "ar" ? 'dir="rtl"' : 'dir="ltr"');
    const profileUrl = locale === "fr-FR"
      ? "https://app.karmastro.com/dashboard"
      : `https://app.karmastro.com/dashboard?lang=${LEGACY_APP_QUERY[locale] ?? "en"}`;
    expect(email.html).toContain(profileUrl);
    expect(email.text.length).toBeGreaterThan(180);
    expect(email.html).toContain("Ari");
    expect(email.html).toContain("Sam");
    if (locale !== "fr-FR") {
      const combined = `${email.html}\n${email.text}`;
      expect(combined).not.toContain("Les étoiles t'attendaient");
      expect(combined).not.toContain("Voici ce que tu peux faire");
      expect(combined).not.toContain("2 messages gratuits par jour");
      expect(combined).not.toContain("Découvrir mon profil cosmique");
      expect(combined).not.toContain("Les astres inclinent");
    }
  });

  it("normalizes regional locales and falls back deterministically", () => {
    expect(normalizeWelcomeLocale("pt-BR")).toBe("pt-BR");
    expect(normalizeWelcomeLocale("pt-PT")).toBe("fr-FR");
    expect(normalizeWelcomeLocale("es_MX")).toBe("es-MX");
    expect(normalizeWelcomeLocale("es-AR")).toBe("es-ES");
    expect(normalizeWelcomeLocale("AR-sa")).toBe("ar");
    expect(normalizeWelcomeLocale("zh-CN")).toBe("zh-Hans");
    expect(normalizeWelcomeLocale("zh-TW")).toBe("fr-FR");
    expect(normalizeWelcomeLocale("no-NO")).toBe("nb-NO");
    expect(normalizeWelcomeLocale(null)).toBe("fr-FR");
  });

  it("escapes names in HTML and strips control characters from the subject", () => {
    const email = welcomeEmail("<img src=x onerror=alert(1)>\r\nBcc: victim@example.test", null, "en-US");

    expect(email.html).not.toContain("<img src=x");
    expect(email.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(email.subject).not.toContain("\r");
    expect(email.subject).not.toContain("\n");
    expect(email.subject.length).toBeLessThanOrEqual(180);
  });

  it("keeps unsupported locales on the complete French fallback", () => {
    const email = welcomeEmail(null, null, "pt-PT");
    expect(email.subject).toContain("Bienvenue sur Karmastro");
    expect(email.html).toContain('<html lang="fr-FR"');
    expect(email.text).toContain("2 messages gratuits par jour");
  });
});

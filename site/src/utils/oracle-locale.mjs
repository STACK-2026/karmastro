export const ORACLE_PUBLIC_LOCALES = Object.freeze([
  "fr",
  "en",
  "es",
  "it",
  "pt",
  "de",
  "ar",
  "ja",
  "pl",
  "ru",
  "tr",
]);

const ORACLE_PUBLIC_LOCALE_SET = new Set(ORACLE_PUBLIC_LOCALES);

const ORACLE_PAYWALL_COPY = Object.freeze({
  fr: Object.freeze({
    message: "Tu as atteint ta limite de messages cosmiques du jour.",
    features: Object.freeze([
      "Oracle illimité, jour et nuit",
      "Profil et historique conservés",
      "Guidance personnalisée chaque mois",
    ]),
    cta: "Débloquer l'Oracle illimité - 5,99 €/mois",
    security: "Paiement sécurisé Stripe · sans engagement",
  }),
  en: Object.freeze({
    message: "You have reached today's cosmic message limit.",
    features: Object.freeze([
      "Unlimited Oracle, day and night",
      "Your profile and history are saved",
      "Personalized guidance every month",
    ]),
    cta: "Unlock unlimited Oracle - €5.99/month",
    security: "Secure Stripe payment · cancel anytime",
  }),
  es: Object.freeze({
    message: "Has alcanzado el límite de mensajes cósmicos de hoy.",
    features: Object.freeze([
      "Oráculo ilimitado, de día y de noche",
      "Tu perfil y tu historial se conservan",
      "Guía personalizada cada mes",
    ]),
    cta: "Desbloquear el Oráculo ilimitado - 5,99 €/mes",
    security: "Pago seguro con Stripe · sin permanencia",
  }),
  it: Object.freeze({
    message: "Hai raggiunto il limite di messaggi cosmici di oggi.",
    features: Object.freeze([
      "Oracolo illimitato, giorno e notte",
      "Profilo e cronologia sempre disponibili",
      "Guida personalizzata ogni mese",
    ]),
    cta: "Sblocca l'Oracolo illimitato - 5,99 €/mese",
    security: "Pagamento sicuro con Stripe · nessun vincolo",
  }),
  pt: Object.freeze({
    message: "Atingiste o limite de mensagens cósmicas de hoje.",
    features: Object.freeze([
      "Oráculo ilimitado, dia e noite",
      "Perfil e histórico guardados",
      "Orientação personalizada todos os meses",
    ]),
    cta: "Desbloquear o Oráculo ilimitado - 5,99 €/mês",
    security: "Pagamento seguro com Stripe · sem compromisso",
  }),
  de: Object.freeze({
    message: "Du hast dein kosmisches Nachrichtenlimit für heute erreicht.",
    features: Object.freeze([
      "Unbegrenztes Orakel, Tag und Nacht",
      "Profil und Verlauf bleiben gespeichert",
      "Persönliche Begleitung jeden Monat",
    ]),
    cta: "Unbegrenztes Orakel freischalten - 5,99 €/Monat",
    security: "Sichere Zahlung mit Stripe · jederzeit kündbar",
  }),
});

function normalizeOracleLocale(value) {
  if (typeof value !== "string") return null;
  const locale = value.trim().toLowerCase().split("-")[0];
  return ORACLE_PUBLIC_LOCALE_SET.has(locale) ? locale : null;
}

export function oraclePaywallCopy(locale) {
  const normalized = normalizeOracleLocale(locale);
  return ORACLE_PAYWALL_COPY[normalized] || ORACLE_PAYWALL_COPY.en;
}

export function resolveOracleLocale({ currentUrl, referrer, documentLang }) {
  let current;
  try {
    current = new URL(currentUrl);
  } catch {
    return normalizeOracleLocale(documentLang) || "fr";
  }

  const explicit = normalizeOracleLocale(current.searchParams.get("lang"));
  if (explicit) return explicit;

  if (referrer) {
    try {
      const previous = new URL(referrer);
      if (previous.origin === current.origin) {
        const pathLocale = normalizeOracleLocale(previous.pathname.split("/")[1]);
        if (pathLocale) return pathLocale;
      }
    } catch {
      // Ignore malformed referrers and fall through to the document locale.
    }
  }

  return normalizeOracleLocale(documentLang) || "fr";
}

export function localizeOracleHref(href, documentLang, siteOrigin) {
  try {
    const url = new URL(href, siteOrigin);
    if (url.origin !== siteOrigin || !/^\/oracle\/?$/.test(url.pathname)) return href;

    const locale = normalizeOracleLocale(documentLang) || "fr";
    if (locale === "fr") return href;
    url.searchParams.set("lang", locale);
    return url.toString();
  } catch {
    return href;
  }
}

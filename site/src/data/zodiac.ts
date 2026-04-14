// Zodiac signs configuration - shared between pages and scripts
// Slugs are ASCII (no accents) for URL safety

export type ZodiacSign = {
  slug: string;
  name: string;
  symbol: string;
  element: "feu" | "terre" | "air" | "eau";
  quality: "cardinal" | "fixe" | "mutable";
  dates: string;
  rulingPlanet: string;
  compatibilities: string[];
};

export const ZODIAC_SIGNS: ZodiacSign[] = [
  {
    slug: "belier",
    name: "Bélier",
    symbol: "♈",
    element: "feu",
    quality: "cardinal",
    dates: "21 mars - 19 avril",
    rulingPlanet: "Mars",
    compatibilities: ["lion", "sagittaire", "gemeaux"],
  },
  {
    slug: "taureau",
    name: "Taureau",
    symbol: "♉",
    element: "terre",
    quality: "fixe",
    dates: "20 avril - 20 mai",
    rulingPlanet: "Vénus",
    compatibilities: ["vierge", "capricorne", "cancer"],
  },
  {
    slug: "gemeaux",
    name: "Gémeaux",
    symbol: "♊",
    element: "air",
    quality: "mutable",
    dates: "21 mai - 20 juin",
    rulingPlanet: "Mercure",
    compatibilities: ["balance", "verseau", "lion"],
  },
  {
    slug: "cancer",
    name: "Cancer",
    symbol: "♋",
    element: "eau",
    quality: "cardinal",
    dates: "21 juin - 22 juillet",
    rulingPlanet: "Lune",
    compatibilities: ["scorpion", "poissons", "taureau"],
  },
  {
    slug: "lion",
    name: "Lion",
    symbol: "♌",
    element: "feu",
    quality: "fixe",
    dates: "23 juillet - 22 août",
    rulingPlanet: "Soleil",
    compatibilities: ["belier", "sagittaire", "gemeaux"],
  },
  {
    slug: "vierge",
    name: "Vierge",
    symbol: "♍",
    element: "terre",
    quality: "mutable",
    dates: "23 août - 22 septembre",
    rulingPlanet: "Mercure",
    compatibilities: ["taureau", "capricorne", "scorpion"],
  },
  {
    slug: "balance",
    name: "Balance",
    symbol: "♎",
    element: "air",
    quality: "cardinal",
    dates: "23 septembre - 22 octobre",
    rulingPlanet: "Vénus",
    compatibilities: ["gemeaux", "verseau", "sagittaire"],
  },
  {
    slug: "scorpion",
    name: "Scorpion",
    symbol: "♏",
    element: "eau",
    quality: "fixe",
    dates: "23 octobre - 21 novembre",
    rulingPlanet: "Pluton",
    compatibilities: ["cancer", "poissons", "vierge"],
  },
  {
    slug: "sagittaire",
    name: "Sagittaire",
    symbol: "♐",
    element: "feu",
    quality: "mutable",
    dates: "22 novembre - 21 décembre",
    rulingPlanet: "Jupiter",
    compatibilities: ["belier", "lion", "balance"],
  },
  {
    slug: "capricorne",
    name: "Capricorne",
    symbol: "♑",
    element: "terre",
    quality: "cardinal",
    dates: "22 décembre - 19 janvier",
    rulingPlanet: "Saturne",
    compatibilities: ["taureau", "vierge", "poissons"],
  },
  {
    slug: "verseau",
    name: "Verseau",
    symbol: "♒",
    element: "air",
    quality: "fixe",
    dates: "20 janvier - 18 février",
    rulingPlanet: "Uranus",
    compatibilities: ["gemeaux", "balance", "sagittaire"],
  },
  {
    slug: "poissons",
    name: "Poissons",
    symbol: "♓",
    element: "eau",
    quality: "mutable",
    dates: "19 février - 20 mars",
    rulingPlanet: "Neptune",
    compatibilities: ["cancer", "scorpion", "capricorne"],
  },
];

export const SIGN_SLUGS = ZODIAC_SIGNS.map((s) => s.slug);

// Localized URL slugs per language.
// Keys = canonical FR slug, values = localized slug used in the URL path.
// FR is identity. Other locales use the SEO-standard term users actually search for.
export const SIGN_SLUGS_BY_LANG: Record<string, Record<string, string>> = {
  fr: {
    belier: "belier", taureau: "taureau", gemeaux: "gemeaux", cancer: "cancer",
    lion: "lion", vierge: "vierge", balance: "balance", scorpion: "scorpion",
    sagittaire: "sagittaire", capricorne: "capricorne", verseau: "verseau", poissons: "poissons",
  },
  en: {
    belier: "aries", taureau: "taurus", gemeaux: "gemini", cancer: "cancer",
    lion: "leo", vierge: "virgo", balance: "libra", scorpion: "scorpio",
    sagittaire: "sagittarius", capricorne: "capricorn", verseau: "aquarius", poissons: "pisces",
  },
  es: {
    belier: "aries", taureau: "tauro", gemeaux: "geminis", cancer: "cancer",
    lion: "leo", vierge: "virgo", balance: "libra", scorpion: "escorpio",
    sagittaire: "sagitario", capricorne: "capricornio", verseau: "acuario", poissons: "piscis",
  },
  pt: {
    belier: "aries", taureau: "touro", gemeaux: "gemeos", cancer: "cancer",
    lion: "leao", vierge: "virgem", balance: "libra", scorpion: "escorpiao",
    sagittaire: "sagitario", capricorne: "capricornio", verseau: "aquario", poissons: "peixes",
  },
  de: {
    belier: "widder", taureau: "stier", gemeaux: "zwillinge", cancer: "krebs",
    lion: "loewe", vierge: "jungfrau", balance: "waage", scorpion: "skorpion",
    sagittaire: "schuetze", capricorne: "steinbock", verseau: "wassermann", poissons: "fische",
  },
  it: {
    belier: "ariete", taureau: "toro", gemeaux: "gemelli", cancer: "cancro",
    lion: "leone", vierge: "vergine", balance: "bilancia", scorpion: "scorpione",
    sagittaire: "sagittario", capricorne: "capricorno", verseau: "acquario", poissons: "pesci",
  },
  tr: {
    belier: "koc", taureau: "boga", gemeaux: "ikizler", cancer: "yengec",
    lion: "aslan", vierge: "basak", balance: "terazi", scorpion: "akrep",
    sagittaire: "yay", capricorne: "oglak", verseau: "kova", poissons: "balik",
  },
  ar: {
    belier: "alhamal", taureau: "althawr", gemeaux: "aljawza", cancer: "alsaratan",
    lion: "alasad", vierge: "alazra", balance: "almizan", scorpion: "alaqrab",
    sagittaire: "alqaws", capricorne: "aljadi", verseau: "aldalw", poissons: "alhut",
  },
  ja: {
    belier: "ohitsujiza", taureau: "oushiza", gemeaux: "futagoza", cancer: "kaniza",
    lion: "shishiza", vierge: "otomeza", balance: "tenbinza", scorpion: "sasoriza",
    sagittaire: "iteza", capricorne: "yagiza", verseau: "mizugameza", poissons: "uoza",
  },
  pl: {
    belier: "baran", taureau: "byk", gemeaux: "blizniaki", cancer: "rak",
    lion: "lew", vierge: "panna", balance: "waga", scorpion: "skorpion",
    sagittaire: "strzelec", capricorne: "koziorozec", verseau: "wodnik", poissons: "ryby",
  },
  ru: {
    belier: "oven", taureau: "telets", gemeaux: "bliznetsy", cancer: "rak",
    lion: "lev", vierge: "deva", balance: "vesy", scorpion: "skorpion",
    sagittaire: "strelets", capricorne: "kozerog", verseau: "vodoley", poissons: "ryby",
  },
};

export function getLocalizedSlug(canonicalSlug: string, lang: string): string {
  return SIGN_SLUGS_BY_LANG[lang]?.[canonicalSlug] ?? canonicalSlug;
}

export function getCanonicalSlugFromLocalized(localizedSlug: string, lang: string): string | undefined {
  const map = SIGN_SLUGS_BY_LANG[lang];
  if (!map) return undefined;
  for (const [canonical, localized] of Object.entries(map)) {
    if (localized === localizedSlug) return canonical;
  }
  return undefined;
}

export function getSignBySlug(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((s) => s.slug === slug);
}

export function getSignByLocalizedSlug(localizedSlug: string, lang: string): ZodiacSign | undefined {
  const canonical = getCanonicalSlugFromLocalized(localizedSlug, lang);
  if (!canonical) return undefined;
  return getSignBySlug(canonical);
}

export function formatFrenchDate(dateStr: string): string {
  // dateStr = "YYYY-MM-DD"
  const [y, m, d] = dateStr.split("-").map(Number);
  const months = [
    "janvier",
    "février",
    "mars",
    "avril",
    "mai",
    "juin",
    "juillet",
    "août",
    "septembre",
    "octobre",
    "novembre",
    "décembre",
  ];
  return `${d} ${months[m - 1]} ${y}`;
}

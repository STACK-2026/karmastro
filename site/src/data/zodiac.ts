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

export function getSignBySlug(slug: string): ZodiacSign | undefined {
  return ZODIAC_SIGNS.find((s) => s.slug === slug);
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

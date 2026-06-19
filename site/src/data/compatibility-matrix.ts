// Deterministic compatibility matrix for all 144 sign combinations.
// Scores are calculated from element + quality affinities (traditional Hellenistic + modern approach).
// Uses astrological rules, not random numbers.

export type Element = "feu" | "terre" | "air" | "eau";
export type Quality = "cardinal" | "fixe" | "mutable";

const ELEMENT_COMPAT: Record<Element, Record<Element, number>> = {
  feu:   { feu: 85, terre: 50, air: 90, eau: 40 },
  terre: { feu: 50, terre: 80, air: 45, eau: 85 },
  air:   { feu: 90, terre: 45, air: 80, eau: 55 },
  eau:   { feu: 40, terre: 85, air: 55, eau: 85 },
};

const QUALITY_COMPAT: Record<Quality, Record<Quality, number>> = {
  cardinal: { cardinal: 70, fixe: 75, mutable: 80 },
  fixe:     { cardinal: 75, fixe: 65, mutable: 70 },
  mutable:  { cardinal: 80, fixe: 70, mutable: 75 },
};

export function compatibilityScore(e1: Element, q1: Quality, e2: Element, q2: Quality): {
  global: number;
  love: number;
  friendship: number;
  work: number;
  karma: number;
  tension: number;
} {
  const elem = ELEMENT_COMPAT[e1][e2];
  const qual = QUALITY_COMPAT[q1][q2];
  const base = Math.round((elem * 0.6 + qual * 0.4));

  // Slight variations per dimension (deterministic offsets)
  return {
    global: base,
    love: Math.max(20, Math.min(100, base + (e1 === e2 ? 5 : 0) + (e1 === "eau" || e1 === "feu" ? 3 : 0))),
    friendship: Math.max(20, Math.min(100, base + (q1 === q2 ? 5 : -3) + 5)),
    work: Math.max(20, Math.min(100, base + (q1 === "cardinal" || q1 === "fixe" ? 5 : -2))),
    karma: Math.max(20, Math.min(100, base + (Math.abs(e1.length - e2.length)))),
    tension: Math.max(10, Math.min(100, 100 - base + 20)),
  };
}

// Element + quality → descriptive phrase for interpretations
export type InterpLang = "fr" | "en";

const ELEMENT_NAMES: Record<InterpLang, Record<Element, string>> = {
  fr: { feu: "feu", terre: "terre", air: "air", eau: "eau" },
  en: { feu: "fire", terre: "earth", air: "air", eau: "water" },
};

// Language packs for the template-based interpretation. fr is byte-for-byte the
// original copy (so the 144 FR pages are unchanged); en is a full translation.
const INTERP_PACK = {
  fr: {
    sameElementStrength: (el: string) => `Vous partagez le même élément ${el}, ce qui crée une compréhension instinctive et une énergie commune qui se nourrit mutuellement.`,
    sameElementFriction: `Le revers de cette similitude : vous pouvez amplifier vos excès sans garde-fou. Deux feux brûlent plus fort ensemble, pour le meilleur et pour le pire.`,
    fireAir: (n1: string, n2: string) => `Le feu et l'air s'alimentent mutuellement. ${n1} allume, ${n2} souffle sur les braises, ensemble la flamme devient inspirante.`,
    earthWater: (n1: string, n2: string) => `La terre et l'eau se fertilisent. ${n1} structure, ${n2} adoucit, ensemble vous créez un terrain fertile pour vos projets communs.`,
    fireWater: (n1: string, n2: string) => `Le feu et l'eau s'annulent si la communication lâche. ${n1} veut agir vite, ${n2} ressent profondément. Sans respect mutuel du rythme, la vapeur.`,
    earthAir: (n1: string, n2: string) => `La terre et l'air ne se comprennent pas sans effort. ${n1} pense concret, ${n2} pense abstrait. Le pont se construit par la patience.`,
    cardinalStrength: `Vous êtes tous les deux des initiateurs. Ensemble, vous lancez des projets ambitieux que les autres n'oseraient pas.`,
    cardinalFriction: `Deux cardinaux, deux chefs. Qui décide ? La lutte de pouvoir latente doit être nommée pour éviter les impasses.`,
    fixeStrength: `Votre loyauté commune crée une forteresse. Une fois engagés, vous ne lâchez pas.`,
    fixeFriction: `Deux signes fixes, deux murs. Quand vous n'êtes pas d'accord, personne ne bouge. Flexibilité à cultiver.`,
    mutableStrength: `Votre flexibilité commune permet de s'adapter à tout. Rien ne vous arrête durablement.`,
    mutableFriction: `Deux mutables peuvent manquer de structure. Qui tient le cap quand les vents tournent ? Un des deux doit choisir un ancrage.`,
    guidance: (n1: string, n2: string) => `La compatibilité entre ${n1} et ${n2} n'est pas une fatalité, c'est un point de départ. L'astrologie révèle les tendances, la conscience transforme les dynamiques. Un thème natal complet (avec Lune, Vénus, Mars et ascendants) affinera cette lecture à 85% de précision, contre 30% pour les signes solaires seuls.`,
    fallbackStrength: (n1: string, n2: string) => `${n1} et ${n2} forment une combinaison à construire consciemment. Les différences sont des opportunités d'apprentissage mutuel.`,
    fallbackFriction: `Aucun axe de friction majeur. Restez vigilants sur les micro-tensions du quotidien qui peuvent s'accumuler silencieusement.`,
  },
  en: {
    sameElementStrength: (el: string) => `You share the same element, ${el}, which creates an instinctive understanding and a shared energy that feeds itself.`,
    sameElementFriction: `The flip side of this similarity: you can amplify each other's excesses with no safety net. Two fires burn hotter together, for better and for worse.`,
    fireAir: (n1: string, n2: string) => `Fire and air feed each other. ${n1} ignites, ${n2} fans the embers, and together the flame becomes inspiring.`,
    earthWater: (n1: string, n2: string) => `Earth and water enrich each other. ${n1} provides structure, ${n2} softens, and together you create fertile ground for shared projects.`,
    fireWater: (n1: string, n2: string) => `Fire and water cancel each other out when communication slips. ${n1} wants to act fast, ${n2} feels deeply. Without mutual respect for each other's pace, it all turns to steam.`,
    earthAir: (n1: string, n2: string) => `Earth and air don't understand each other without effort. ${n1} thinks in concrete terms, ${n2} thinks in the abstract. The bridge is built with patience.`,
    cardinalStrength: `You are both initiators. Together, you launch ambitious projects that others wouldn't dare to start.`,
    cardinalFriction: `Two cardinal signs, two leaders. Who decides? The latent power struggle must be named to avoid deadlock.`,
    fixeStrength: `Your shared loyalty builds a fortress. Once committed, you don't let go.`,
    fixeFriction: `Two fixed signs, two walls. When you disagree, no one budges. Flexibility is something to cultivate.`,
    mutableStrength: `Your shared flexibility lets you adapt to anything. Nothing stops you for long.`,
    mutableFriction: `Two mutable signs can lack structure. Who holds the course when the winds shift? One of you needs to choose an anchor.`,
    guidance: (n1: string, n2: string) => `The compatibility between ${n1} and ${n2} is not a fate, it's a starting point. Astrology reveals tendencies; awareness transforms the dynamic. A full birth chart (with Moon, Venus, Mars and rising signs) refines this reading to 85% accuracy, versus 30% for sun signs alone.`,
    fallbackStrength: (n1: string, n2: string) => `${n1} and ${n2} form a combination to build consciously. The differences are opportunities for mutual learning.`,
    fallbackFriction: `No major axis of friction. Stay mindful of the small day-to-day tensions that can quietly add up.`,
  },
} as const;

export function compatibilityInterpretation(
  name1: string,
  e1: Element,
  q1: Quality,
  name2: string,
  e2: Element,
  q2: Quality,
  lang: InterpLang = "fr"
): { strengths: string[]; frictions: string[]; guidance: string } {
  const P = INTERP_PACK[lang];
  const EL = ELEMENT_NAMES[lang];
  const strengths: string[] = [];
  const frictions: string[] = [];

  // Element-based insights
  if (e1 === e2) {
    strengths.push(P.sameElementStrength(EL[e1]));
    frictions.push(P.sameElementFriction);
  } else if ((e1 === "feu" && e2 === "air") || (e1 === "air" && e2 === "feu")) {
    strengths.push(P.fireAir(name1, name2));
  } else if ((e1 === "terre" && e2 === "eau") || (e1 === "eau" && e2 === "terre")) {
    strengths.push(P.earthWater(name1, name2));
  } else if ((e1 === "feu" && e2 === "eau") || (e1 === "eau" && e2 === "feu")) {
    frictions.push(P.fireWater(name1, name2));
  } else if ((e1 === "terre" && e2 === "air") || (e1 === "air" && e2 === "terre")) {
    frictions.push(P.earthAir(name1, name2));
  }

  // Quality-based insights
  if (q1 === q2 && q1 === "cardinal") {
    strengths.push(P.cardinalStrength);
    frictions.push(P.cardinalFriction);
  }
  if (q1 === q2 && q1 === "fixe") {
    strengths.push(P.fixeStrength);
    frictions.push(P.fixeFriction);
  }
  if (q1 === q2 && q1 === "mutable") {
    strengths.push(P.mutableStrength);
    frictions.push(P.mutableFriction);
  }

  return {
    strengths: strengths.length > 0 ? strengths : [P.fallbackStrength(name1, name2)],
    frictions: frictions.length > 0 ? frictions : [P.fallbackFriction],
    guidance: P.guidance(name1, name2),
  };
}

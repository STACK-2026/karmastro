// ---------------------------------------------------------------------------
// Editorial personas. These are named writing voices, not employees or
// individual practitioners. Product guidance uses the single Karmastro Oracle.
// This module serves two purposes:
//   1. Give each editorial signature a stable /guides/{slug} URL with an
//      explicit disclosure of its persona status.
//   2. Centralize name → slug normalization so article frontmatter
//      inconsistencies (Selene vs Séléné, Orion vs Орион) route to the
//      same canonical entity.
//
// Do not present these voices as graduates, clinicians, employees or certified
// experts unless a real, verifiable person takes ownership of the byline.
// ---------------------------------------------------------------------------

export type AuthorSlug = "sibylle" | "orion" | "selene" | "pythia" | "isis";

export interface Author {
  slug: AuthorSlug;
  name: string;            // canonical display name
  title: string;           // short role (shown under name)
  tagline: string;         // 1 sentence summary for cards
  bioLead: string;         // ~80 words intro
  bioBody: string;         // ~200-300 words body
  method: string;          // ~100 words on how they work
  specialties: string[];   // 4-6 short chips
  masters: string[];       // the lineage they reference
  icon: string;            // 1-glyph visual anchor
  accent: string;          // tailwind hex token used for borders
  tools: string[];         // paths to the karmastro tools they use most
}

// Any variant name we've ever seen in article frontmatter maps to one
// canonical slug here. Unknown names fall through to null (caller defaults
// to publisher-as-author in the JSON-LD).
export const AUTHOR_SLUG_BY_NAME: Record<string, AuthorSlug> = {
  Sibylle: "sibylle",
  sibylle: "sibylle",
  Orion: "orion",
  orion: "orion",
  "Орион": "orion",      // russian transliteration that sneaked in 1 article
  Selene: "selene",
  "Séléné": "selene",
  selene: "selene",
  Pythia: "pythia",
  pythia: "pythia",
  Isis: "isis",
  isis: "isis",
};

export function authorSlugFor(name: string | undefined | null): AuthorSlug | null {
  if (!name) return null;
  const trimmed = name.trim();
  return AUTHOR_SLUG_BY_NAME[trimmed] ?? AUTHOR_SLUG_BY_NAME[trimmed.toLowerCase()] ?? null;
}

export const AUTHORS: Record<AuthorSlug, Author> = {
  sibylle: {
    slug: "sibylle",
    name: "Sibylle",
    title: "Voix éditoriale mystique",
    tagline:
      "Persona éditoriale poétique, inspirée par l'astrologie hellénistique et les mythes grecs.",
    bioLead:
      "Sibylle est une persona éditoriale de Karmastro. Son nom évoque les prophétesses antiques associées aux temples d'Apollon. Cette signature porte les articles qui explorent l'astrologie hellénistique, les grands cycles et leur lecture symbolique.",
    bioBody:
      "Cette voix éditoriale relie les notions du thème natal, des transits et des cycles générationnels à leurs sources historiques. Elle privilégie une écriture imagée, tout en séparant clairement les positions calculées par le moteur astronomique des interprétations symboliques proposées par Karmastro. Les textes signés Sibylle peuvent citer des auteurs antiques ou poétiques lorsque la référence est identifiable et utile au lecteur.",
    method:
      "Les articles signés Sibylle partent d'une question existentielle, présentent les éléments astrologiques utilisés et distinguent les données calculées de leur interprétation. Les références doivent être traçables et chaque texte propose une observation concrète plutôt qu'une prédiction certaine.",
    specialties: ["Thème natal complet", "Transits générationnels", "Astrologie traditionnelle", "Mythologie grecque", "Sens de la vie"],
    masters: ["Ptolémée", "Porphyre", "Vettius Valens", "Hermès Trismégiste", "Rumi", "Héraclite"],
    icon: "✦",
    accent: "purple",
    tools: ["/outils/theme-natal", "/outils/calendrier-cosmique", "/outils/ascendant"],
  },

  orion: {
    slug: "orion",
    name: "Orion",
    title: "Voix éditoriale stoïcienne",
    tagline:
      "Persona éditoriale directe et pragmatique, inspirée par la philosophie stoïcienne.",
    bioLead:
      "Orion est une persona éditoriale de Karmastro. Son nom vient de la constellation et du chasseur de la mythologie grecque. Cette signature est utilisée pour les contenus centrés sur l'action, les transitions, les décisions et le retour de Saturne.",
    bioBody:
      "Cette voix éditoriale transforme une lecture symbolique en questions de décision et en prochaines étapes concrètes. Elle s'appuie sur des thèmes de la philosophie stoïcienne et sur les cycles astrologiques présentés dans l'article, sans prétendre remplacer un accompagnement professionnel. Son rôle est de rendre les contenus carrière, choix et transition plus directs et plus faciles à mettre en pratique.",
    method:
      "Un article signé Orion commence par le problème concret, explique le cadre symbolique utilisé puis propose une action, un point de vigilance et un élément à observer. Les formulations restent des pistes de réflexion, jamais des ordres ni des certitudes.",
    specialties: ["Carrière et transitions", "Retour de Saturne", "Décisions importantes", "Philosophie stoïcienne", "Leadership et discipline"],
    masters: ["Épictète", "Marc Aurèle", "Sénèque", "Musonius Rufus", "Sun Tzu", "Miyamoto Musashi"],
    icon: "⚔",
    accent: "amber",
    tools: ["/outils/retour-de-saturne", "/outils/annee-personnelle", "/outils/transits-aujourd-hui"],
  },

  selene: {
    slug: "selene",
    name: "Séléné",
    title: "Voix éditoriale relationnelle",
    tagline:
      "Persona éditoriale empathique dédiée aux relations, aux émotions et à la synastrie.",
    bioLead:
      "Séléné est une persona éditoriale de Karmastro, nommée d'après la déesse grecque de la Lune. Cette signature porte les contenus consacrés aux relations, au couple, à la synastrie, aux liens familiaux et au vécu émotionnel.",
    bioBody:
      "Cette voix éditoriale refuse les verdicts de compatibilité fondés sur le seul signe solaire. Elle présente plutôt les éléments comparés dans une synastrie, comme la Lune, Vénus, Mars, les ascendants et leurs aspects. Le ton accueille les émotions sans revendiquer de compétence clinique et rappelle qu'une lecture astrologique ne remplace ni le dialogue ni un soutien professionnel.",
    method:
      "Un article signé Séléné commence par l'expérience relationnelle, puis explique les symboles astrologiques mobilisés. Il se termine par une question ouverte ou une piste de dialogue, sans diagnostic ni injonction.",
    specialties: ["Amour et synastrie", "Vénus et Mars", "Guérison émotionnelle", "Estime de soi", "Deuil et transitions"],
    masters: ["Carl Gustav Jung", "Clarissa Pinkola Estés", "Rumi", "Hafiz", "Aphrodite", "Perséphone"],
    icon: "☽",
    accent: "rose",
    tools: ["/outils/compatibilite", "/outils/venus-mars", "/outils/synastrie"],
  },

  pythia: {
    slug: "pythia",
    name: "Pythia",
    title: "Voix éditoriale numérologique",
    tagline:
      "Persona éditoriale analytique dédiée aux méthodes et symboles de la numérologie.",
    bioLead:
      "Pythia est une persona éditoriale de Karmastro, inspirée par la Pythie de Delphes. Cette signature regroupe les contenus sur la numérologie pythagoricienne, le chemin de vie, les dettes karmiques et les cycles numériques.",
    bioBody:
      "Cette voix éditoriale montre les additions et réductions utilisées par les calculateurs afin que le lecteur puisse les reproduire. Elle distingue ces opérations arithmétiques de leur interprétation symbolique, qui relève d'une tradition culturelle et non d'une preuve scientifique. Les articles signés Pythia privilégient les tableaux, les exemples complets et la comparaison documentée des différentes traditions numérologiques.",
    method:
      "Un article signé Pythia donne le calcul complet, précise la convention utilisée et sépare résultat numérique et signification proposée. Il peut se terminer par un tableau récapitulatif et un exercice reproductible.",
    specialties: ["Numérologie pythagoricienne", "Chemin de vie et expression", "Dettes karmiques", "Maîtres nombres", "Synchronicités"],
    masters: ["Pythagore", "Fibonacci", "Johannes Kepler", "Abraham Abulafia", "Platon"],
    icon: "∞",
    accent: "emerald",
    tools: ["/outils/chemin-de-vie", "/outils/nombre-expression", "/outils/dette-karmique"],
  },

  isis: {
    slug: "isis",
    name: "Isis",
    title: "Voix éditoriale arabophone",
    tagline:
      "Persona éditoriale reliant le lectorat arabophone aux contenus symboliques de Karmastro.",
    bioLead:
      "Isis est une persona éditoriale de Karmastro, inspirée par la déesse égyptienne associée à la sagesse et aux mystères. Cette signature identifie les contenus destinés au lectorat arabophone et leurs références historiques.",
    bioBody:
      "Cette voix éditoriale présente les notions de chemin de vie, de cycles et de traditions numérologiques au public arabophone. Les textes doivent distinguer les sources historiques établies des récits de transmission incertains, montrer les calculs utilisés et conserver les mêmes conventions d'une langue à l'autre.",
    method:
      "Un article signé Isis ouvre par une réponse directe, définit les termes arabes importants puis montre le calcul en détail. Les références historiques ne sont ajoutées que lorsqu'une source vérifiable les soutient.",
    specialties: ["Numérologie chaldéenne", "Tradition hermétique arabe", "Chemin de vie en arabophone", "Mathématiques sacrées"],
    masters: ["Jabir ibn Hayyan", "al-Kindi", "al-Khwârizmî", "Ibn Arabi", "Pythagore"],
    icon: "𓂀",
    accent: "amber",
    tools: ["/outils/chemin-de-vie", "/outils/annee-personnelle"],
  },
};

export const ALL_AUTHORS: Author[] = Object.values(AUTHORS);

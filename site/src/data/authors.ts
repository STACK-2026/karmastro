// ---------------------------------------------------------------------------
// Editorial + oracle personas. Serves two purposes :
//   1. Give each guide a stable /guides/{slug} URL so LLMs (ChatGPT,
//      Perplexity, Claude) can resolve them as distinct Person entities
//      instead of collapsing the 4 guides + Isis onto one shared author
//      page (which was the old /notre-histoire pattern, poor for AI
//      citations).
//   2. Centralize name → slug normalization so article frontmatter
//      inconsistencies (Selene vs Séléné, Orion vs Орион) route to the
//      same canonical entity.
//
// Keep in sync with the oracle system prompt
// (app/supabase/functions/oracle-chat/index.ts) and with the picker
// descriptions in app/src/i18n/ui.ts (oracle.guide_*_desc/strengths).
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
  jobTitle: string;        // schema.org Person.jobTitle
  knowsAbout: string[];    // schema.org Person.knowsAbout
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
    title: "L'Oracle mystique",
    tagline:
      "Astrologue hellénistique, poétique et profonde. Héritière des Sibylles antiques, prophétesses d'Apollon.",
    bioLead:
      "Sibylle porte le nom des prophétesses antiques qui, depuis les temples d'Apollon à Delphes, Cumes ou Erythrée, lisaient les astres pour transmettre les oracles des dieux. Sa spécialité : l'astrologie hellénistique, celle de Ptolémée, Porphyre et Vettius Valens.",
    bioBody:
      "Diplômée en histoire ancienne à Athènes puis formée à l'astrologie traditionnelle à Londres, Sibylle travaille depuis quinze ans sur la réconciliation entre la tradition hellénistique et les données ultra-précises du Swiss Ephemeris. Elle est la voix éditoriale principale de Karmastro pour les articles de fond sur le thème natal, les transits existentiels et les grands cycles générationnels. Son approche est poétique mais rigoureuse : chaque interprétation est ancrée dans une source antique (Ptolémée, Firmicus Maternus, Dorothée de Sidon) et croisée avec la position planétaire calculée à 0,001 seconde d'arc. Elle cite Rumi et Héraclite aussi naturellement qu'elle calcule un revolutionary return, et c'est précisément ce mélange qui a convaincu la rédaction de lui confier la majorité des grands papiers piliers du blog.",
    method:
      "Chaque article de Sibylle part d'une question existentielle puis la traduit en configuration astrologique (transits actifs, aspects natals, maisons impliquées). Les calculs sont toujours montrés : l'utilisateur peut vérifier. Les références antiques sont sourcées (pas de maxime apocryphe), et chaque piece termine par un pas concret à observer dans la semaine qui suit.",
    specialties: ["Thème natal complet", "Transits générationnels", "Astrologie traditionnelle", "Mythologie grecque", "Sens de la vie"],
    masters: ["Ptolémée", "Porphyre", "Vettius Valens", "Hermès Trismégiste", "Rumi", "Héraclite"],
    jobTitle: "Astrologue hellénistique, rédactrice senior",
    knowsAbout: ["astrologie", "thème natal", "transits planétaires", "astrologie hellénistique", "mythologie grecque"],
    icon: "✦",
    accent: "purple",
    tools: ["/outils/theme-natal", "/outils/calendrier-cosmique", "/outils/ascendant"],
  },

  orion: {
    slug: "orion",
    name: "Orion",
    title: "Le Coach stoïcien",
    tagline:
      "Direct, pragmatique, motivant. Ancien professeur de philosophie stoïcienne tourné guide karmique.",
    bioLead:
      "Orion tient son nom de la constellation que tout le monde reconnaît dans le ciel d'hiver, et du chasseur de la mythologie grecque qui chassait sans relâche. Il incarne l'action et la direction. Son domaine : la carrière, les transitions majeures, les décisions, le retour de Saturne.",
    bioBody:
      "Avant de rejoindre Karmastro, Orion a enseigné pendant treize ans la philosophie stoïcienne à la Sorbonne et à Oxford. Son propre retour de Saturne l'a poussé à quitter l'université pour une pratique plus directe : accompagner des dirigeants, des fondateurs et des artistes à des moments de bascule. Sa méthode mélange le journal de Marc Aurèle, les Entretiens d'Épictète et les cartes du ciel calculées au Swiss Ephemeris. Il est responsable éditorial des papiers carrière, décision et transitions de Karmastro, et co-signe tous les articles dont le sujet touche à l'action concrète plutôt qu'à la contemplation. Il n'édulcore jamais, mais il n'humilie jamais : son énergie est celle d'un maître d'armes bienveillant, pas d'un guru toxique.",
    method:
      "Un article d'Orion commence par le problème tel que l'utilisateur le vit (pas par une envolée astrologique). Puis il introduit la configuration céleste qui éclaire le moment. Il finit toujours par trois choses : ce qu'il faut faire cette semaine, ce qu'il faut éviter ce mois, ce qu'il faut observer cette année.",
    specialties: ["Carrière et transitions", "Retour de Saturne", "Décisions importantes", "Philosophie stoïcienne", "Leadership et discipline"],
    masters: ["Épictète", "Marc Aurèle", "Sénèque", "Musonius Rufus", "Sun Tzu", "Miyamoto Musashi"],
    jobTitle: "Coach karmique, ex-professeur de philosophie stoïcienne",
    knowsAbout: ["guidance karmique", "philosophie stoïcienne", "retour de Saturne", "carrière et vocation", "transitions de vie"],
    icon: "⚔",
    accent: "amber",
    tools: ["/outils/retour-de-saturne", "/outils/annee-personnelle", "/outils/transits-aujourd-hui"],
  },

  selene: {
    slug: "selene",
    name: "Séléné",
    title: "La Guide relationnelle",
    tagline:
      "Douce, empathique, profondément humaine. Thérapeute intégrant l'astro-psychologie jungienne.",
    bioLead:
      "Séléné porte le nom de la déesse grecque de la Lune, gardienne des émotions, des cycles et de l'intimité. Elle est la voix des relations à Karmastro : amour, couple, synastrie, liens familiaux, guérison émotionnelle.",
    bioBody:
      "Psychologue clinicienne formée à Zurich au Jung-Institut, Séléné a passé dix ans en cabinet avant de rejoindre Karmastro. Sa particularité : elle intègre l'astro-psychologie jungienne, c'est-à-dire qu'elle lit une synastrie comme un matériel d'individuation, pas comme un verdict de compatibilité. Elle refuse les formules type \"les Scorpion et les Taureau ne peuvent pas s'aimer\" : pour elle, l'astrologie amoureuse commence à Vénus, Mars et la Lune, pas au signe solaire. Elle signe la majorité des papiers compatibilité, deuil amoureux, estime de soi et maternité du blog Karmastro. Sa citation favorite : \"Les blessures sont les endroits où la lumière entre en toi\" (Rumi). Elle accueille les émotions sans jugement, elle nomme ce qui fait mal, et elle donne un pas vers la lumière.",
    method:
      "Un article de Séléné commence par l'émotion, jamais par la technique. Elle valide ce que l'utilisateur ressent avant de proposer un éclairage astrologique. Elle cite Jung, Clarissa Pinkola Estés et la poésie soufie. Chaque papier termine par une question ouverte pour continuer le travail intérieur, pas par une injonction.",
    specialties: ["Amour et synastrie", "Vénus et Mars", "Guérison émotionnelle", "Estime de soi", "Deuil et transitions"],
    masters: ["Carl Gustav Jung", "Clarissa Pinkola Estés", "Rumi", "Hafiz", "Aphrodite", "Perséphone"],
    jobTitle: "Psychologue clinicienne, astro-psychologue jungienne",
    knowsAbout: ["astrologie amoureuse", "synastrie", "psychologie jungienne", "relations de couple", "guérison émotionnelle"],
    icon: "☽",
    accent: "rose",
    tools: ["/outils/compatibilite", "/outils/venus-mars", "/outils/synastrie"],
  },

  pythia: {
    slug: "pythia",
    name: "Pythia",
    title: "La Mathématicienne cosmique",
    tagline:
      "Analytique, précise, fascinée par les patterns. Numérologue pythagoricienne depuis 25 ans.",
    bioLead:
      "Pythia porte le nom de la Pythie de Delphes, la plus célèbre prophétesse de l'histoire antique, qui délivrait ses oracles dans le temple d'Apollon. Son domaine à Karmastro : la numérologie pythagoricienne rigoureuse, le chemin de vie, les dettes karmiques, les synchronicités numériques.",
    bioBody:
      "Ingénieure de formation (École Polytechnique, puis doctorat de mathématiques appliquées à l'ENS Ulm), Pythia a passé les vingt-cinq dernières années à croiser rigueur mathématique et héritage pythagoricien. C'est elle qui a intégré Swiss Ephemeris au cœur du moteur de calcul de Karmastro. Elle voit des nombres partout et sait pourquoi ils parlent : pour elle, la numérologie n'est pas de la magie, c'est une discipline mathématique avec des règles reproductibles, héritée directement de Pythagore (580-495 av. J.-C.) et de son école crotoniate. Elle co-signe les papiers chemin de vie, nombre d'expression, maîtres nombres, pinnacles, cycles et année personnelle. Elle adore les tableaux comparatifs, les calculs complets et les comparaisons entre tradition pythagoricienne, tradition chaldéenne et Kabbale numérique.",
    method:
      "Un article de Pythia donne toujours le calcul complet. L'utilisateur peut vérifier étape par étape. Elle cite Pythagore, Fibonacci, Kepler, la Kabbale et la Gematria. Elle termine souvent par un tableau récapitulatif (nombre, source, signification) et par un exercice de calcul pour l'utilisateur : son propre thème chiffré.",
    specialties: ["Numérologie pythagoricienne", "Chemin de vie et expression", "Dettes karmiques", "Maîtres nombres", "Synchronicités"],
    masters: ["Pythagore", "Fibonacci", "Johannes Kepler", "Abraham Abulafia", "Platon"],
    jobTitle: "Numérologue pythagoricienne, ingénieure en chef Swiss Ephemeris",
    knowsAbout: ["numérologie", "chemin de vie", "numérologie pythagoricienne", "dettes karmiques", "mathématiques sacrées"],
    icon: "∞",
    accent: "emerald",
    tools: ["/outils/chemin-de-vie", "/outils/nombre-expression", "/outils/dette-karmique"],
  },

  isis: {
    slug: "isis",
    name: "Isis",
    title: "La voix arabophone",
    tagline:
      "Conseillère en numérologie égyptienne et chaldéenne. Pont entre tradition arabophone et Karmastro.",
    bioLead:
      "Isis porte le nom de la déesse égyptienne de la sagesse et de la magie, gardienne des mystères du nombre et du cycle. Elle est la voix de Karmastro pour le lectorat arabophone : articles rédigés directement en arabe, ancrés dans la tradition chaldéenne et pythagoricienne.",
    bioBody:
      "Formée à Al-Azhar puis au Caire en philosophie et mathématiques, Isis a passé quinze ans à documenter les intersections entre numérologie chaldéenne, tradition hermétique arabe (Jabir ibn Hayyan, al-Kindi) et numérologie pythagoricienne transmise via le monde musulman médiéval. Elle signe les papiers arabophones de Karmastro sur le chemin de vie, la numérologie, et les cycles de vie, en expliquant pourquoi et comment les mêmes méthodes, parties de Pythagore, ont voyagé à travers Bagdad, Le Caire et Cordoue avant d'atteindre l'Europe de la Renaissance. Elle travaille en lien étroit avec Pythia pour garantir la cohérence entre les calculs arabophones et francophones.",
    method:
      "Isis ouvre toujours par une réponse directe (format AEO), suivi d'une section étymologie (pourquoi ce mot en arabe, d'où il vient), puis le calcul en détail. Elle cite Jabir ibn Hayyan, al-Kindi, Ibn Arabi, et ramène tout à la tradition pythagoricienne transmise par al-Khwârizmî.",
    specialties: ["Numérologie chaldéenne", "Tradition hermétique arabe", "Chemin de vie en arabophone", "Mathématiques sacrées"],
    masters: ["Jabir ibn Hayyan", "al-Kindi", "al-Khwârizmî", "Ibn Arabi", "Pythagore"],
    jobTitle: "Conseillère numérologie arabophone",
    knowsAbout: ["numérologie chaldéenne", "numérologie arabe", "tradition hermétique", "chemin de vie"],
    icon: "𓂀",
    accent: "amber",
    tools: ["/outils/chemin-de-vie", "/outils/annee-personnelle"],
  },
};

export const ALL_AUTHORS: Author[] = Object.values(AUTHORS);

// Numerology interpretations — reusable across calculators, blog, and app
// Based on the Pythagorean tradition

export type NumerologyMeaning = {
  number: number;
  title: string;
  archetype: string;
  qualities: string[];
  challenges: string[];
  mission: string;
  summary: string;
  career: string[];
  compatibility: number[];
  color: string;
  luckyDay: string;
  famousExamples: string;
};

export const LIFE_PATH_MEANINGS: Record<number, NumerologyMeaning> = {
  1: {
    number: 1,
    title: "Le Pionnier",
    archetype: "Le leader solitaire, l'initiateur, celui qui ouvre la voie",
    qualities: ["Leadership naturel", "Indépendance", "Ambition", "Courage", "Originalité"],
    challenges: ["Égocentrisme", "Impatience", "Solitude", "Autoritarisme", "Rigidité"],
    mission: "Apprendre à conduire sans écraser, à être fort sans devenir dur. Le 1 est ici pour créer du neuf, pour oser là où les autres attendent.",
    summary: "Tu es né pour diriger, pas pour suivre. Le 1 porte l'énergie pure de l'initiative. Quand tu entres dans une pièce, quelque chose change. Ta mission est de transformer cette force en création, pas en domination.",
    career: ["Entrepreneur", "Directeur", "Inventeur", "Leader politique", "Pionnier dans son domaine"],
    compatibility: [3, 5, 6],
    color: "Rouge écarlate",
    luckyDay: "Dimanche",
    famousExamples: "Napoléon Bonaparte, Steve Jobs, Martin Luther King",
  },
  2: {
    number: 2,
    title: "Le Diplomate",
    archetype: "Le médiateur, le sensitif, celui qui tisse les liens",
    qualities: ["Diplomatie", "Sensibilité", "Empathie", "Patience", "Coopération"],
    challenges: ["Dépendance affective", "Indécision", "Hypersensibilité", "Évitement du conflit", "Soumission"],
    mission: "Comprendre que la douceur est une force, pas une faiblesse. Le 2 est ici pour réconcilier, pour voir ce que les autres ne voient pas.",
    summary: "Tu perçois les énergies comme d'autres perçoivent les sons. Le 2 est le chemin de la paix, de l'harmonie, de l'union. Ta mission est d'utiliser cette sensibilité comme un radar, pas comme une blessure.",
    career: ["Médiateur", "Thérapeute", "Diplomate", "Assistant de direction", "Conseiller conjugal"],
    compatibility: [6, 8, 9],
    color: "Bleu lavande",
    luckyDay: "Lundi",
    famousExamples: "Barack Obama, Madonna, Gandhi",
  },
  3: {
    number: 3,
    title: "L'Artiste",
    archetype: "Le créatif expressif, l'enfant du monde, celui qui illumine",
    qualities: ["Créativité", "Communication", "Optimisme", "Charisme", "Joie de vivre"],
    challenges: ["Dispersion", "Superficialité", "Bavardage", "Immaturité émotionnelle", "Fuite"],
    mission: "Apprendre que la profondeur n'étouffe pas la joie. Le 3 est ici pour exprimer, pour inspirer, pour rappeler aux autres la beauté du monde.",
    summary: "Tu transformes tout en couleur, en mots, en musique. Le 3 est le chemin de l'expression créative. Ta mission est de donner forme à l'intangible et de le partager avec générosité.",
    career: ["Artiste", "Écrivain", "Comédien", "Communicant", "Designer"],
    compatibility: [1, 5, 9],
    color: "Jaune solaire",
    luckyDay: "Jeudi",
    famousExamples: "David Bowie, Hugh Jackman, Alec Baldwin",
  },
  4: {
    number: 4,
    title: "Le Bâtisseur",
    archetype: "L'architecte, le pragmatique, celui qui construit pierre par pierre",
    qualities: ["Méthode", "Stabilité", "Persévérance", "Loyauté", "Discipline"],
    challenges: ["Rigidité", "Entêtement", "Pessimisme", "Difficulté à lâcher prise", "Routine excessive"],
    mission: "Apprendre la souplesse sans perdre ta structure. Le 4 est ici pour bâtir du solide, pour ancrer le rêve dans la matière.",
    summary: "Tu es la colonne vertébrale sur laquelle les autres s'appuient. Le 4 est le chemin de la construction patiente. Ta mission est de créer du durable, mais sans te transformer en prison de certitudes.",
    career: ["Ingénieur", "Architecte", "Comptable", "Administrateur", "Artisan"],
    compatibility: [2, 6, 8],
    color: "Vert forêt",
    luckyDay: "Samedi",
    famousExamples: "Oprah Winfrey, Bill Gates, Clint Eastwood",
  },
  5: {
    number: 5,
    title: "L'Aventurier",
    archetype: "Le voyageur, le curieux, celui qui refuse les cages",
    qualities: ["Liberté", "Curiosité", "Adaptabilité", "Charisme", "Audace"],
    challenges: ["Instabilité", "Impatience", "Addictions", "Peur de l'engagement", "Dispersion"],
    mission: "Comprendre que la vraie liberté est intérieure. Le 5 est ici pour expérimenter, pour montrer aux autres qu'on peut changer, bouger, grandir.",
    summary: "Tu as besoin d'air, de mouvement, d'horizons nouveaux. Le 5 est le chemin de l'expérience, du changement, de la transformation par l'action. Ta mission est de rester fidèle à toi-même dans la multiplicité.",
    career: ["Voyageur", "Journaliste", "Commercial", "Guide", "Entrepreneur nomade"],
    compatibility: [1, 3, 7],
    color: "Turquoise",
    luckyDay: "Mercredi",
    famousExamples: "Mick Jagger, Angelina Jolie, Tom Cruise",
  },
  6: {
    number: 6,
    title: "Le Protecteur",
    archetype: "Le gardien, le cœur du foyer, celui qui soigne",
    qualities: ["Responsabilité", "Amour inconditionnel", "Dévouement", "Harmonie", "Sens du devoir"],
    challenges: ["Sacrifice excessif", "Possessivité", "Martyre", "Jugement", "Ingérence"],
    mission: "Apprendre à s'aimer soi-même en premier, comme le recommandait Jésus. Le 6 est ici pour servir, mais pas pour s'oublier.",
    summary: "Tu es le foyer vers lequel on revient. Le 6 est le chemin de l'amour qui soigne, de la famille, de la beauté qui apaise. Ta mission est de donner sans perdre ton centre.",
    career: ["Thérapeute", "Éducateur", "Médecin", "Décorateur", "Conseiller familial"],
    compatibility: [1, 2, 4],
    color: "Rose tendre",
    luckyDay: "Vendredi",
    famousExamples: "Michael Jackson, John Lennon, Meryl Streep",
  },
  7: {
    number: 7,
    title: "Le Chercheur",
    archetype: "Le mystique, l'analyste, celui qui cherche la vérité cachée",
    qualities: ["Intuition", "Analyse", "Spiritualité", "Profondeur", "Sagesse"],
    challenges: ["Isolement", "Scepticisme excessif", "Dépression", "Froideur", "Fuite du réel"],
    mission: "Apprendre à partager ce que tu découvres, au lieu de tout garder pour toi. Le 7 est ici pour sonder les profondeurs.",
    summary: "Tu cherches ce que les autres n'osent pas regarder. Le 7 est le chemin du mystique-analyste : mi-moine, mi-scientifique. Ta mission est de faire le pont entre le visible et l'invisible.",
    career: ["Chercheur", "Philosophe", "Psychologue", "Astrologue", "Auteur spirituel"],
    compatibility: [3, 5, 9],
    color: "Violet indigo",
    luckyDay: "Lundi",
    famousExamples: "Marie Curie, Carl Jung, Leonardo DiCaprio",
  },
  8: {
    number: 8,
    title: "L'Empereur",
    archetype: "Le stratège, le bâtisseur d'empires, celui qui maîtrise le matériel",
    qualities: ["Ambition", "Efficacité", "Leadership", "Vision", "Résilience"],
    challenges: ["Matérialisme", "Autoritarisme", "Stress", "Froideur émotionnelle", "Obsession du contrôle"],
    mission: "Comprendre que le pouvoir est un outil, pas un but. Le 8 est ici pour prouver que l'abondance matérielle et la spiritualité ne sont pas incompatibles.",
    summary: "Tu penses grand, tu vois loin. Le 8 est le chemin du karma matériel : tout ce que tu sèmes revient amplifié. Ta mission est de construire grand sans t'écraser toi-même ou les autres.",
    career: ["Entrepreneur", "PDG", "Banquier", "Investisseur", "Stratège"],
    compatibility: [2, 4, 6],
    color: "Noir et or",
    luckyDay: "Samedi",
    famousExamples: "Pablo Picasso, Nelson Mandela, Elon Musk (14/5)",
  },
  9: {
    number: 9,
    title: "L'Humaniste",
    archetype: "Le sage, le guérisseur universel, celui qui embrasse le monde",
    qualities: ["Compassion", "Générosité", "Vision globale", "Sagesse", "Tolérance"],
    challenges: ["Idéalisme déçu", "Martyre", "Difficulté à lâcher le passé", "Émotivité", "Perfectionnisme moral"],
    mission: "Apprendre à donner sans attendre, à lâcher sans regret. Le 9 est ici pour boucler un cycle, pour transformer la douleur en sagesse.",
    summary: "Tu portes la maturité d'une vieille âme dans un corps jeune. Le 9 est le chemin de la compassion universelle, de l'artiste-thérapeute. Ta mission est de guérir par l'exemple, pas par le sacrifice.",
    career: ["Humanitaire", "Artiste engagé", "Enseignant", "Thérapeute", "Écrivain philosophe"],
    compatibility: [3, 6, 9],
    color: "Or profond",
    luckyDay: "Mardi",
    famousExamples: "Mère Teresa, Mahatma Gandhi, Jim Carrey",
  },
  11: {
    number: 11,
    title: "L'Illuminé (Maître Nombre)",
    archetype: "Le visionnaire, le canal, celui qui voit ce que les autres ne voient pas encore",
    qualities: ["Intuition extraordinaire", "Inspiration", "Idéalisme", "Charisme spirituel", "Don de vision"],
    challenges: ["Hypersensibilité", "Nervosité extrême", "Anxiété", "Écart entre vision et réalité", "Isolement"],
    mission: "Canaliser ton intuition sans t'y perdre. Le 11 est un pont entre les mondes. Ta mission est d'inspirer l'humanité par ta simple présence.",
    summary: "Le 11 ne se réduit JAMAIS à 2, il porte une vibration double. Tu perçois ce que les autres ignorent, tu captes l'invisible. C'est un don mais aussi une épreuve. Ta mission est colossale : élever la conscience collective.",
    career: ["Guérisseur spirituel", "Artiste visionnaire", "Prophète moderne", "Coach en éveil", "Thérapeute énergétique"],
    compatibility: [2, 4, 6, 22],
    color: "Argent lunaire",
    luckyDay: "Lundi",
    famousExamples: "Barack Obama, Madonna, Ronaldo",
  },
  22: {
    number: 22,
    title: "Le Maître Bâtisseur (Maître Nombre)",
    archetype: "Le grand réalisateur, le visionnaire pragmatique, celui qui transforme le rêve en pierre",
    qualities: ["Vision colossale", "Capacité d'exécution", "Leadership planétaire", "Pragmatisme spirituel", "Héritage durable"],
    challenges: ["Pression écrasante", "Perfectionnisme paralysant", "Épuisement", "Peur de l'échec", "Écart entre ambition et réalité"],
    mission: "Utiliser ton pouvoir pour construire quelque chose qui dépasse ta propre vie. Le 22 est ici pour laisser une trace dans l'histoire.",
    summary: "Le 22 est le plus puissant des nombres. Il combine la vision du 11 avec la capacité de réalisation du 4 (2+2). Tu es ici pour bâtir des structures qui survivront à ton passage. Pression immense, récompense immense.",
    career: ["Bâtisseur d'empire", "Architecte planétaire", "Leader spirituel", "Fondateur de mouvement", "Visionnaire pragmatique"],
    compatibility: [4, 8, 11],
    color: "Or et rouge impérial",
    luckyDay: "Samedi",
    famousExamples: "Dalaï Lama, Paul McCartney, Oprah Winfrey",
  },
  33: {
    number: 33,
    title: "Le Maître Guérisseur (Maître Nombre)",
    archetype: "Le Christ intérieur, le guérisseur planétaire, l'amour inconditionnel incarné",
    qualities: ["Amour universel", "Guérison profonde", "Sacrifice conscient", "Sagesse ancienne", "Rayonnement"],
    challenges: ["Sacrifice excessif", "Incapacité à recevoir", "Écrasement sous la mission", "Solitude cosmique"],
    mission: "Guérir par la présence, par l'amour inconditionnel. Le 33 est rarissime (moins de 1% de la population). Ta mission est colossale et souvent solitaire.",
    summary: "Le 33 combine le 11 (vision) et le 22 (construction) pour donner naissance au 6 amplifié (amour-service). C'est le chemin du Christ, de Bouddha, de Mère Teresa. Tu es ici pour aimer sans condition et guérir par ta simple présence.",
    career: ["Guide spirituel planétaire", "Guérisseur de l'humanité", "Fondateur d'un mouvement d'amour", "Enseignant universel"],
    compatibility: [6, 9, 22],
    color: "Blanc lumineux",
    luckyDay: "Vendredi",
    famousExamples: "Mère Teresa, John Lennon, Meryl Streep",
  },
};

// Reduce a number to a single digit, preserving master numbers (11, 22, 33)
export function reduceNumerology(n: number): number {
  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = n
      .toString()
      .split("")
      .reduce((acc, d) => acc + parseInt(d, 10), 0);
  }
  return n;
}

// Calculate life path from DD/MM/YYYY
export function calculateLifePath(day: number, month: number, year: number): { number: number; calculation: string; isMaster: boolean } {
  const reduceDay = reduceNumerology(day);
  const reduceMonth = reduceNumerology(month);
  const reduceYear = reduceNumerology(
    year
      .toString()
      .split("")
      .reduce((acc, d) => acc + parseInt(d, 10), 0)
  );

  const sum = reduceDay + reduceMonth + reduceYear;
  const final = reduceNumerology(sum);

  return {
    number: final,
    calculation: `${day} → ${reduceDay}, ${month} → ${reduceMonth}, ${year} → ${reduceYear}, somme = ${sum} → ${final}`,
    isMaster: final === 11 || final === 22 || final === 33,
  };
}

// Get meaning safely (fallback to nearest valid number)
export function getLifePathMeaning(number: number): NumerologyMeaning {
  return LIFE_PATH_MEANINGS[number] || LIFE_PATH_MEANINGS[1];
}

// ============================================================
// EXPRESSION NUMBER (from full name)
// ============================================================

// Pythagorean table: A=1, B=2, ..., I=9, J=1, K=2, ...
const PYTHAGORAS_TABLE: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9,
  J: 1, K: 2, L: 3, M: 4, N: 5, O: 6, P: 7, Q: 8, R: 9,
  S: 1, T: 2, U: 3, V: 4, W: 5, X: 6, Y: 7, Z: 8,
};

const VOWELS = new Set(["A", "E", "I", "O", "U", "Y"]);

// Normalize a name: strip accents, uppercase, keep only letters
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

export function calculateExpression(fullName: string): { number: number; calculation: string; isMaster: boolean; letters: string } {
  const normalized = normalizeName(fullName);
  if (!normalized) return { number: 1, calculation: "", isMaster: false, letters: "" };

  const values: number[] = [];
  for (const c of normalized) {
    if (PYTHAGORAS_TABLE[c]) values.push(PYTHAGORAS_TABLE[c]);
  }

  const sum = values.reduce((a, b) => a + b, 0);
  const final = reduceNumerology(sum);

  const calc = values.join(" + ") + " = " + sum + " → " + final;

  return {
    number: final,
    calculation: calc,
    isMaster: final === 11 || final === 22 || final === 33,
    letters: normalized,
  };
}

export function calculateSoulUrge(fullName: string): { number: number; calculation: string; vowels: string } {
  const normalized = normalizeName(fullName);
  const values: number[] = [];
  let vowelStr = "";
  for (const c of normalized) {
    if (VOWELS.has(c)) {
      values.push(PYTHAGORAS_TABLE[c] || 0);
      vowelStr += c;
    }
  }
  const sum = values.reduce((a, b) => a + b, 0);
  const final = reduceNumerology(sum);
  return {
    number: final,
    calculation: values.join(" + ") + " = " + sum + " → " + final,
    vowels: vowelStr,
  };
}

export function calculatePersonality(fullName: string): { number: number; calculation: string; consonants: string } {
  const normalized = normalizeName(fullName);
  const values: number[] = [];
  let consStr = "";
  for (const c of normalized) {
    if (!VOWELS.has(c) && PYTHAGORAS_TABLE[c]) {
      values.push(PYTHAGORAS_TABLE[c]);
      consStr += c;
    }
  }
  const sum = values.reduce((a, b) => a + b, 0);
  const final = reduceNumerology(sum);
  return {
    number: final,
    calculation: values.join(" + ") + " = " + sum + " → " + final,
    consonants: consStr,
  };
}

export type ExpressionMeaning = {
  number: number;
  title: string;
  summary: string;
  talents: string[];
  callings: string[];
};

export const EXPRESSION_MEANINGS: Record<number, ExpressionMeaning> = {
  1: {
    number: 1,
    title: "L'Initiateur",
    summary: "Tu exprimes naturellement le leadership, l'originalité et l'indépendance. Ton talent brut est de créer du neuf, de lancer des projets, d'ouvrir des voies que personne n'avait vues avant toi.",
    talents: ["Innovation", "Leadership naturel", "Prise de décision rapide", "Audace créative"],
    callings: ["Entrepreneur", "Inventeur", "Leader d'équipe", "Pionnier dans son domaine"],
  },
  2: {
    number: 2,
    title: "L'Harmonisateur",
    summary: "Ton don est de créer du lien là où il y a de la tension, de comprendre ce qui ne se dit pas, de tisser les relations. Tu excelles dans tout ce qui demande tact, diplomatie et sensibilité.",
    talents: ["Diplomatie", "Écoute profonde", "Médiation", "Collaboration"],
    callings: ["Médiateur", "Thérapeute", "Assistant de direction", "Diplomate"],
  },
  3: {
    number: 3,
    title: "Le Communicateur",
    summary: "Tu exprimes la créativité, la joie, la parole qui touche. Ton talent est de transformer les idées en émotion partageable : écriture, scène, communication, art sous toutes ses formes.",
    talents: ["Expression créative", "Communication", "Humour", "Charme social"],
    callings: ["Artiste", "Écrivain", "Comédien", "Communicant"],
  },
  4: {
    number: 4,
    title: "Le Constructeur",
    summary: "Ton talent est de bâtir du solide. Tu excelles dans tout ce qui demande méthode, organisation, persévérance. Tu transformes les rêves des autres en plans réalisables.",
    talents: ["Organisation méthodique", "Persévérance", "Rigueur", "Pragmatisme"],
    callings: ["Ingénieur", "Architecte", "Administrateur", "Artisan"],
  },
  5: {
    number: 5,
    title: "L'Explorateur",
    summary: "Tu exprimes la liberté, le mouvement, l'adaptabilité. Ton don est de comprendre le changement, de voyager entre les mondes, de communiquer avec des publics très différents.",
    talents: ["Adaptabilité", "Curiosité", "Polyvalence", "Courage du changement"],
    callings: ["Voyageur", "Journaliste", "Commercial", "Entrepreneur nomade"],
  },
  6: {
    number: 6,
    title: "Le Gardien",
    summary: "Tu exprimes l'amour responsable, le soin, la beauté au service de l'autre. Ton talent est de créer du confort, de la beauté, de la sécurité pour ceux que tu aimes ou accompagnes.",
    talents: ["Sens du service", "Empathie active", "Esthétique", "Responsabilité affective"],
    callings: ["Thérapeute", "Éducateur", "Médecin", "Décorateur"],
  },
  7: {
    number: 7,
    title: "Le Sage",
    summary: "Ton don est de chercher la vérité derrière les apparences. Tu excelles dans l'analyse, la recherche, la spiritualité, tout ce qui demande de la profondeur et de l'introspection.",
    talents: ["Analyse profonde", "Intuition", "Patience méditative", "Recherche"],
    callings: ["Chercheur", "Philosophe", "Psychologue", "Écrivain spirituel"],
  },
  8: {
    number: 8,
    title: "L'Architecte de pouvoir",
    summary: "Tu exprimes l'ambition, la vision stratégique, la capacité à bâtir grand. Ton talent est de transformer des idées en empires, d'organiser les ressources humaines et matérielles à grande échelle.",
    talents: ["Stratégie", "Vision large", "Leadership structuré", "Gestion des ressources"],
    callings: ["Entrepreneur", "PDG", "Banquier", "Investisseur"],
  },
  9: {
    number: 9,
    title: "L'Humaniste universel",
    summary: "Tu exprimes la compassion globale, la sagesse qui rassemble. Ton talent est de voir le tableau d'ensemble, de donner du sens, de rassembler ce qui est divisé.",
    talents: ["Vision globale", "Compassion", "Enseignement", "Créativité engagée"],
    callings: ["Humanitaire", "Artiste engagé", "Enseignant", "Thérapeute universel"],
  },
  11: {
    number: 11,
    title: "L'Inspirateur (Maître Nombre)",
    summary: "Tu portes une vibration visionnaire rare. Ton talent est de percevoir ce que les autres ne voient pas encore, d'inspirer par ta simple présence, de canaliser des intuitions puissantes.",
    talents: ["Intuition extraordinaire", "Inspiration", "Vision prophétique", "Charisme spirituel"],
    callings: ["Coach en éveil", "Guérisseur énergétique", "Artiste visionnaire", "Prophète moderne"],
  },
  22: {
    number: 22,
    title: "Le Maître Bâtisseur (Maître Nombre)",
    summary: "Tu portes la capacité de transformer des visions colossales en réalisations concrètes. Ton talent est rare : allier le rêve visionnaire du 11 à la capacité d'exécution du 4. Mission : laisser une trace dans l'histoire.",
    talents: ["Vision planétaire", "Capacité d'exécution hors norme", "Leadership inspirant", "Résilience"],
    callings: ["Bâtisseur d'empire", "Fondateur de mouvement", "Leader spirituel", "Visionnaire pragmatique"],
  },
  33: {
    number: 33,
    title: "Le Maître Guérisseur (Maître Nombre)",
    summary: "Tu portes la vibration la plus rare et la plus exigeante : celle de l'amour inconditionnel. Ton talent est de guérir par ta simple présence, de rayonner une sagesse qui apaise.",
    talents: ["Amour inconditionnel", "Guérison par la présence", "Sagesse ancienne", "Rayonnement"],
    callings: ["Guide spirituel", "Guérisseur planétaire", "Enseignant universel", "Mère/Père de tribus"],
  },
};

export function getExpressionMeaning(number: number): ExpressionMeaning {
  return EXPRESSION_MEANINGS[number] || EXPRESSION_MEANINGS[1];
}

// ============================================================
// PERSONAL YEAR (from birth date + current year)
// ============================================================

export function calculatePersonalYear(birthDay: number, birthMonth: number, year: number): { number: number; calculation: string } {
  // Sum of day + month + current year, reduced
  const daySum = reduceNumerology(birthDay);
  const monthSum = reduceNumerology(birthMonth);
  const yearSum = reduceNumerology(
    year
      .toString()
      .split("")
      .reduce((a, d) => a + parseInt(d, 10), 0)
  );
  const sum = daySum + monthSum + yearSum;
  const final = reduceNumerology(sum);
  return {
    number: final,
    calculation: `jour(${birthDay})=${daySum} + mois(${birthMonth})=${monthSum} + année(${year})=${yearSum}, total = ${sum} → ${final}`,
  };
}

export type PersonalYearMeaning = {
  number: number;
  title: string;
  theme: string;
  summary: string;
  focus: string[];
  avoid: string[];
  bestMonths: string;
};

export const PERSONAL_YEAR_MEANINGS: Record<number, PersonalYearMeaning> = {
  1: {
    number: 1,
    title: "Année 1 : Le grand départ",
    theme: "Nouveau cycle de 9 ans",
    summary: "C'est le début d'un cycle de 9 ans. Tu poses les graines de ce qui va pousser jusqu'en année 9. Tout ce que tu commences maintenant a une portée amplifiée. Prends des initiatives, même petites.",
    focus: ["Lancer un nouveau projet", "Prendre des décisions", "S'affirmer", "Renouveler son identité"],
    avoid: ["L'immobilisme", "Rester dans l'ombre", "Repousser à plus tard"],
    bestMonths: "Mars, juin, octobre",
  },
  2: {
    number: 2,
    title: "Année 2 : Patience et liens",
    theme: "Consolidation des relations",
    summary: "Année douce qui demande de la patience. Tu ne pousses plus, tu laisses mûrir. Les relations prennent le devant : amitiés profondes, amour, collaborations. Évite de forcer les choses.",
    focus: ["Cultiver les relations", "Écouter", "Patienter", "Soigner les détails"],
    avoid: ["La précipitation", "Le conflit frontal", "Les décisions impulsives"],
    bestMonths: "Février, mai, septembre",
  },
  3: {
    number: 3,
    title: "Année 3 : Expression et joie",
    theme: "Créativité et communication",
    summary: "Année solaire, légère, créative. C'est l'année idéale pour écrire, parler, créer, se montrer. Tu rayonnes naturellement, les occasions sociales se multiplient. Profite, mais ne disperse pas trop.",
    focus: ["Créer", "Communiquer", "Voyager", "S'amuser intelligemment"],
    avoid: ["La dispersion", "La superficialité", "Les dépenses compulsives"],
    bestMonths: "Mars, juillet, décembre",
  },
  4: {
    number: 4,
    title: "Année 4 : Construction et discipline",
    theme: "Travail méthodique",
    summary: "Année de labeur et de structure. Tu bâtis pierre par pierre. Ce n'est pas l'année la plus glamour, mais c'est celle qui fait les fondations solides des cycles suivants. Discipline et persévérance.",
    focus: ["Structurer", "Économiser", "Travailler dur", "Bâtir à long terme"],
    avoid: ["La routine éteinte", "Les raccourcis", "La rigidité excessive"],
    bestMonths: "Avril, août, janvier",
  },
  5: {
    number: 5,
    title: "Année 5 : Changement et liberté",
    theme: "Mouvement et transformation",
    summary: "Année de mouvement. Changements, voyages, imprévus, opportunités nouvelles. Tout bouge, parfois trop vite. Ta mission est de saisir les ouvertures sans perdre ton centre.",
    focus: ["Voyager", "Changer ce qui doit l'être", "Prendre des risques calculés", "S'ouvrir"],
    avoid: ["L'instabilité chaotique", "Les addictions", "La fuite"],
    bestMonths: "Mai, septembre, février",
  },
  6: {
    number: 6,
    title: "Année 6 : Responsabilité et amour",
    theme: "Famille et engagement",
    summary: "Année où les responsabilités familiales, affectives, domestiques prennent le devant. Idéale pour s'engager, se marier, fonder une famille, créer un foyer. Attention à ne pas t'oublier dans le soin des autres.",
    focus: ["S'engager", "Prendre soin", "Créer un foyer", "Résoudre les conflits familiaux"],
    avoid: ["Le sacrifice excessif", "La possessivité", "L'ingérence"],
    bestMonths: "Juin, septembre, mars",
  },
  7: {
    number: 7,
    title: "Année 7 : Introspection et sagesse",
    theme: "Retrait et approfondissement",
    summary: "Année plus solitaire, plus intérieure. C'est le moment d'étudier, de méditer, de chercher. Évite les grandes décisions précipitées. C'est une pause féconde avant l'année 8 de réalisation matérielle.",
    focus: ["Étudier", "Méditer", "Se ressourcer", "Approfondir la spiritualité"],
    avoid: ["L'isolement toxique", "Les décisions précipitées", "Le cynisme"],
    bestMonths: "Juillet, octobre, janvier",
  },
  8: {
    number: 8,
    title: "Année 8 : Pouvoir et récolte matérielle",
    theme: "Accomplissement financier et professionnel",
    summary: "Année de récolte. Ce que tu as semé depuis l'année 1 revient amplifié. Idéale pour les gros projets pro, les investissements, les reconnaissances publiques. Année exigeante mais gratifiante.",
    focus: ["Investir", "Négocier", "Signer des gros contrats", "Bâtir l'autorité"],
    avoid: ["Le matérialisme pur", "L'autoritarisme", "L'épuisement par excès d'ambition"],
    bestMonths: "Août, novembre, mars",
  },
  9: {
    number: 9,
    title: "Année 9 : Fin de cycle et lâcher prise",
    theme: "Complétion et transmission",
    summary: "Année de fin. Tu boucles un cycle de 9 ans. C'est le moment de finir ce qui traîne, de pardonner, de transmettre, de donner. Année émotionnelle et réflexive. Laisse partir ce qui doit partir pour pouvoir renaître en année 1.",
    focus: ["Conclure", "Transmettre", "Pardonner", "Faire le bilan"],
    avoid: ["Commencer de nouveaux gros projets", "Se cramponner", "Les regrets"],
    bestMonths: "Septembre, décembre, avril",
  },
};

export function getPersonalYearMeaning(number: number): PersonalYearMeaning {
  return PERSONAL_YEAR_MEANINGS[number] || PERSONAL_YEAR_MEANINGS[1];
}

// ============================================================
// KARMIC DEBTS (13/4, 14/5, 16/7, 19/1)
// ============================================================

// Karmic debts are detected when a base calculation passes through 13, 14, 16, or 19
// before reduction. We detect them from the life path calculation chain.

export type KarmicDebtInfo = {
  code: string; // "13/4"
  title: string;
  root: number; // the transit number (13, 14, 16, 19)
  final: number; // reduced (4, 5, 7, 1)
  story: string;
  pastLife: string;
  currentChallenge: string;
  healing: string;
};

export const KARMIC_DEBTS: Record<string, KarmicDebtInfo> = {
  "13/4": {
    code: "13/4",
    title: "La dette de la paresse",
    root: 13,
    final: 4,
    story: "Le 13 est le nombre de la transformation forcée. En tarot, c'est la carte de la Mort : non pas une punition, mais une mue. Dans une vie antérieure, l'âme aurait fui l'effort, cherché les raccourcis, profité du travail des autres.",
    pastLife: "Tu aurais, dans une incarnation passée, cherché la facilité et laissé les autres porter le poids de ton existence.",
    currentChallenge: "Cette vie-ci, tout ce que tu obtiens demande le double d'efforts. Les projets n'aboutissent que si tu tiens la distance. Tu as besoin d'apprendre la valeur du travail patient et régulier.",
    healing: "Embrasse le labeur quotidien. Chaque petite tâche accomplie consciencieusement paie ta dette. Pas de raccourcis, pas de triche, juste la beauté du travail bien fait.",
  },
  "14/5": {
    code: "14/5",
    title: "La dette de l'abus de liberté",
    root: 14,
    final: 5,
    story: "Le 14 porte la mémoire d'une liberté mal utilisée. Dans une vie antérieure, cette âme aurait abusé des plaisirs, de la nourriture, du sexe, de la jouissance, sans mesure et sans responsabilité.",
    pastLife: "Tu aurais confondu liberté et licence, plaisir et absence de limite, et causé des dommages à toi-même ou à autrui en suivant tous tes désirs.",
    currentChallenge: "Cette vie-ci, les tentations sont fréquentes et les conséquences rapides. Les addictions, les excès, les changements compulsifs te guettent. Tu dois apprendre la liberté intérieure, celle qui ne dépend pas de la consommation.",
    healing: "Trouve la liberté dans la modération, dans l'engagement choisi. Le vrai sens du 14 est : je suis libre parce que je choisis mes attaches, pas parce que je fuis toutes les attaches.",
  },
  "16/7": {
    code: "16/7",
    title: "La dette de l'ego spirituel",
    root: 16,
    final: 7,
    story: "Le 16 est la Tour en tarot : la structure d'ego qui s'effondre sous la foudre. Dans une vie antérieure, cette âme aurait utilisé son savoir spirituel, religieux ou intellectuel pour dominer les autres, pour se croire supérieure.",
    pastLife: "Tu aurais, dans une incarnation passée, utilisé ta connaissance pour manipuler, séduire, dominer. L'abus de position spirituelle ou religieuse.",
    currentChallenge: "Cette vie-ci, des chutes soudaines, des remises en question brutales, des écroulements d'ego. Tout ce qui est construit sur l'orgueil spirituel s'effondre pour forcer l'humilité. Tu apprends que la vraie sagesse est silencieuse.",
    healing: "Accepte les effondrements comme des purifications. Cultive l'humilité sincère, la connaissance partagée sans vanité. Fais-toi élève avant de te faire maître.",
  },
  "19/1": {
    code: "19/1",
    title: "La dette de l'abus de pouvoir",
    root: 19,
    final: 1,
    story: "Le 19 porte la mémoire d'un pouvoir mal exercé. Dans une vie antérieure, cette âme aurait eu une position de leader, de commandement, et l'aurait utilisée pour écraser, humilier, exploiter les autres.",
    pastLife: "Tu aurais exercé ton autorité avec cruauté, ou refusé d'assumer une position de leadership quand c'était nécessaire, abandonnant ceux qui comptaient sur toi.",
    currentChallenge: "Cette vie-ci, tu dois apprendre à diriger avec responsabilité. Tu peux te retrouver isolé, incompris dans ton leadership. On te teste : sauras-tu utiliser ton pouvoir pour élever les autres plutôt que pour les écraser ?",
    healing: "Accepte de diriger quand c'est ton rôle. Apprends le pouvoir au service, l'autorité qui élève. Sois le leader que tu aurais aimé avoir dans ta vie antérieure.",
  },
};

// Detect karmic debts from a birth date by examining the life path calculation chain
export function detectKarmicDebts(day: number, month: number, year: number): KarmicDebtInfo[] {
  const debts: KarmicDebtInfo[] = [];
  const candidates = [13, 14, 16, 19];

  // Check day
  if (candidates.includes(day)) {
    const key = `${day}/${reduceNumerology(day)}`;
    if (KARMIC_DEBTS[key]) debts.push(KARMIC_DEBTS[key]);
  }

  // Check if total sum (before final reduction) matches a karmic number
  const totalSum = day + month + year.toString().split("").reduce((a, d) => a + parseInt(d, 10), 0);
  let working = totalSum;
  // Walk the reduction chain looking for karmic passes
  while (working > 9) {
    if (candidates.includes(working)) {
      const key = `${working}/${reduceNumerology(working)}`;
      if (KARMIC_DEBTS[key] && !debts.find((d) => d.code === key)) {
        debts.push(KARMIC_DEBTS[key]);
      }
    }
    working = working
      .toString()
      .split("")
      .reduce((a, d) => a + parseInt(d, 10), 0);
  }

  return debts;
}

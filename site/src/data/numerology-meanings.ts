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

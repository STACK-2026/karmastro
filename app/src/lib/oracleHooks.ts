// Oracle hook phrases  -  emotionally impactful, rotating prompts to incite users to ask questions
// Organized by theme for targeting based on user history

export interface OracleHook {
  text: string;
  theme: string;
  cta: string;
  emoji: string;
}

export const oracleHooks: OracleHook[] = [
  // Amour & Relations
  { text: "Quelqu'un pense à vous en ce moment…", theme: "amour", cta: "Découvrir qui", emoji: "💜" },
  { text: "Votre prochaine grande histoire d'amour est plus proche que vous ne pensez", theme: "amour", cta: "En savoir plus", emoji: "💫" },
  { text: "Est-ce que cette personne est vraiment faite pour vous ?", theme: "amour", cta: "Demander à l'Oracle", emoji: "❤️‍🔥" },
  { text: "Un ancien amour pourrait resurgir cette semaine…", theme: "amour", cta: "Explorer", emoji: "🔮" },
  { text: "Les astres voient une conversation importante avec votre partenaire bientôt", theme: "amour", cta: "Que dire ?", emoji: "💬" },
  { text: "Votre Vénus natale reçoit un transit rare  -  votre magnétisme est décuplé", theme: "amour", cta: "Exploiter cette énergie", emoji: "✨" },

  // Argent & Carrière
  { text: "Une opportunité financière se profile dans les prochains jours", theme: "argent", cta: "Voir les détails", emoji: "💰" },
  { text: "Votre jour personnel d'aujourd'hui favorise les décisions financières", theme: "argent", cta: "Demander conseil", emoji: "📈" },
  { text: "Est-ce le bon moment pour ce changement professionnel ?", theme: "carriere", cta: "Analyser le timing", emoji: "🚀" },
  { text: "Votre année personnelle 6 influence vos finances  -  savez-vous comment ?", theme: "argent", cta: "Comprendre", emoji: "🔢" },
  { text: "Un blocage financier pourrait avoir une origine karmique", theme: "argent", cta: "Identifier le blocage", emoji: "🔓" },

  // Vie & Bien-être
  { text: "Comment s'est passée votre dernière semaine ? Les astres ont la réponse", theme: "vie", cta: "Faire le bilan", emoji: "🌟" },
  { text: "Vous sentez que quelque chose doit changer, mais quoi exactement ?", theme: "vie", cta: "Poser la question", emoji: "🦋" },
  { text: "Votre énergie vitale est en transformation  -  voici pourquoi", theme: "vie", cta: "Comprendre", emoji: "⚡" },
  { text: "Le cosmos prépare quelque chose de grand pour vous en avril", theme: "vie", cta: "Découvrir quoi", emoji: "🌙" },
  { text: "Avez-vous ressenti une fatigue inexplicable dernièrement ?", theme: "vie", cta: "Voir la cause cosmique", emoji: "😴" },

  // Proches & Famille
  { text: "Un proche traverse une période difficile  -  les astres montrent comment l'aider", theme: "proches", cta: "Demander guidance", emoji: "🤝" },
  { text: "La relation avec votre mère/père cache une leçon karmique importante", theme: "proches", cta: "Découvrir la leçon", emoji: "👨‍👩‍👧" },
  { text: "Quelqu'un de votre entourage va avoir besoin de vous très bientôt", theme: "proches", cta: "Savoir qui", emoji: "🫂" },

  // Amitié
  { text: "Une amitié importante est à un tournant  -  savez-vous laquelle ?", theme: "amitie", cta: "Explorer", emoji: "👯" },
  { text: "Votre cercle d'amis va évoluer cette année  -  est-ce positif ?", theme: "amitie", cta: "Demander à l'Oracle", emoji: "🌐" },

  // Séparation & Retrouvailles
  { text: "Une personne du passé pense à vous recontacter…", theme: "retrouvailles", cta: "Qui est-ce ?", emoji: "🔄" },
  { text: "Cette séparation avait-elle un but karmique ? La réponse pourrait vous surprendre", theme: "separation", cta: "Comprendre", emoji: "💔" },
  { text: "Le cosmos prévoit des retrouvailles inattendues ce mois-ci", theme: "retrouvailles", cta: "En savoir plus", emoji: "🌈" },

  // Bonheur & Accomplissement
  { text: "Votre plus grande source de bonheur est inscrite dans votre thème natal", theme: "bonheur", cta: "La découvrir", emoji: "☀️" },
  { text: "Vous êtes à 3 décisions d'un tournant majeur dans votre vie", theme: "bonheur", cta: "Lesquelles ?", emoji: "🎯" },
  { text: "Le bonheur que vous cherchez n'est pas là où vous pensez", theme: "bonheur", cta: "Où alors ?", emoji: "🗝️" },

  // Spiritualité
  { text: "Vous avez vu des signes récemment  -  heures miroirs, synchronicités ?", theme: "spiritualite", cta: "Décoder les signes", emoji: "11:11" },
  { text: "Votre Nœud Nord révèle votre mission de vie  -  la connaissez-vous ?", theme: "spiritualite", cta: "Découvrir", emoji: "☊" },
  { text: "Un rêve récurrent essaie de vous transmettre un message", theme: "spiritualite", cta: "Interpréter", emoji: "🌙" },

  // Urgence / FOMO
  { text: "Mercure rétrograde termine le 19 avril  -  que devez-vous régler avant ?", theme: "urgence", cta: "Vérifier", emoji: "⏳" },
  { text: "La fenêtre cosmique actuelle se referme dans 48h", theme: "urgence", cta: "Agir maintenant", emoji: "⚡" },
];

// Get hooks based on user's conversation history themes, or random if no history
export function getPersonalizedHooks(
  conversationTitles: string[],
  count: number = 3
): OracleHook[] {
  if (conversationTitles.length === 0) {
    // No history  -  return diverse random hooks
    const shuffled = [...oracleHooks].sort(() => Math.random() - 0.5);
    // Pick from different themes
    const picked: OracleHook[] = [];
    const usedThemes = new Set<string>();
    for (const hook of shuffled) {
      if (!usedThemes.has(hook.theme)) {
        picked.push(hook);
        usedThemes.add(hook.theme);
        if (picked.length >= count) break;
      }
    }
    return picked;
  }

  // Analyze conversation titles to detect themes
  const titleText = conversationTitles.join(" ").toLowerCase();
  const themeScores: Record<string, number> = {};

  const themeKeywords: Record<string, string[]> = {
    amour: ["amour", "relation", "couple", "partenaire", "cœur", "rencontre", "ex", "mariage", "âme sœur", "karmique"],
    argent: ["argent", "financ", "salaire", "investis", "argent", "business", "entreprise"],
    carriere: ["travail", "carrière", "job", "profession", "emploi", "promotion", "projet"],
    vie: ["vie", "sens", "direction", "changement", "décision", "avenir"],
    proches: ["famille", "mère", "père", "parent", "enfant", "frère", "sœur", "proche"],
    amitie: ["ami", "amitié", "copain", "copine", "entourage"],
    separation: ["séparation", "rupture", "divorce", "quitter", "fin"],
    retrouvailles: ["retrouv", "revenir", "passé", "ancien", "recontact"],
    bonheur: ["bonheur", "joie", "heureux", "épanoui", "accomplissement"],
    spiritualite: ["heure miroir", "signe", "rêve", "synchronicité", "mission", "karma", "nœud"],
  };

  for (const [theme, keywords] of Object.entries(themeKeywords)) {
    themeScores[theme] = keywords.filter(kw => titleText.includes(kw)).length;
  }

  // Get top themes user is interested in
  const topThemes = Object.entries(themeScores)
    .filter(([, s]) => s > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([t]) => t);

  // Mix: 60% from user's themes, 40% new themes to expand
  const relevantHooks = oracleHooks.filter(h => topThemes.includes(h.theme));
  const newHooks = oracleHooks.filter(h => !topThemes.includes(h.theme));

  const shuffledRelevant = relevantHooks.sort(() => Math.random() - 0.5);
  const shuffledNew = newHooks.sort(() => Math.random() - 0.5);

  const targetRelevant = Math.ceil(count * 0.6);
  const targetNew = count - targetRelevant;

  return [
    ...shuffledRelevant.slice(0, targetRelevant),
    ...shuffledNew.slice(0, targetNew),
  ].slice(0, count);
}

// Oracle suggestions organized by theme for the Oracle page
export const oracleSuggestionsByTheme = {
  amour: [
    "Est-ce que cette personne est mon âme sœur karmique ?",
    "Quand vais-je rencontrer le grand amour ?",
    "Ma relation traverse une crise  -  que disent les astres ?",
    "Mon ex va-t-il/elle revenir ?",
  ],
  argent: [
    "Est-ce le bon moment pour investir ?",
    "Pourquoi ai-je un blocage avec l'argent ?",
    "Mon année personnelle favorise-t-elle l'abondance ?",
  ],
  carriere: [
    "Est-ce le bon moment pour changer de travail ?",
    "Quel métier correspond à mon chemin de vie ?",
    "Mon projet professionnel va-t-il réussir ?",
  ],
  spiritualite: [
    "Que signifie voir 22:22 partout ?",
    "Quelle est ma mission de vie karmique ?",
    "Mon rêve récurrent a-t-il un message ?",
    "Que signifie mon jour personnel aujourd'hui ?",
  ],
  vie: [
    "Comment s'est passée ma semaine d'un point de vue cosmique ?",
    "Quel est le thème principal de mon mois personnel ?",
    "Pourquoi je me sens bloquée en ce moment ?",
  ],
  proches: [
    "La relation avec ma mère a-t-elle un lien karmique ?",
    "Comment aider un proche qui souffre selon les astres ?",
  ],
};

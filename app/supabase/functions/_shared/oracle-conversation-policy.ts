export const ORACLE_CATEGORIES = [
  "clarity_decision",
  "relationship",
  "work_direction",
  "self_understanding",
] as const;

export type OracleCategory = typeof ORACLE_CATEGORIES[number];

const CATEGORY_CONTEXT: Record<OracleCategory, string> = {
  clarity_decision: "clarification et décision",
  relationship: "relations",
  work_direction: "travail et direction",
  self_understanding: "compréhension de soi",
};

export function normalizeOracleCategory(value: unknown): OracleCategory | null {
  return typeof value === "string" &&
      (ORACLE_CATEGORIES as readonly string[]).includes(value)
    ? value as OracleCategory
    : null;
}

export function buildOracleConversationInstructions({
  firstTurn,
  category,
}: {
  firstTurn: boolean;
  category: OracleCategory | null;
}): string {
  let instructions = "";
  if (category) {
    instructions += `\n\nCONTEXTE DE QUALIFICATION : catégorie "${CATEGORY_CONTEXT[category]}". Cette catégorie est une métadonnée choisie dans l'interface. Elle n'est pas un message écrit par l'utilisateur et tu ne dois jamais prétendre qu'il ou elle a prononcé ces mots.`;
  }
  if (firstTurn) {
    instructions += `\n\nCONTRAT PRIORITAIRE DU PREMIER TOUR :
- Réponse visible de 70 à 120 mots, hors bloc de suggestions.
- Commence par refléter précisément la situation exprimée.
- Donne une seule prise utile, concrète et immédiatement compréhensible.
- Termine par une seule question ouverte liée aux mots de l'utilisateur.
- AUCUNE citation, AUCUNE liste de transits, AUCUN appellatif mystique.
- Ne récite pas le ciel général et ne demande pas automatiquement de date de naissance.
- Trois suggestions courtes maximum dans le bloc technique prévu.
Ce contrat remplace toute consigne générale contradictoire de longueur, de citation, de transit ou de style pour ce premier tour.`;
  }
  return instructions;
}

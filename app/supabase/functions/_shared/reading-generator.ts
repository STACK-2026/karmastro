// Génère la lecture karmique payante : construit le prompt (déterministe, testé) puis
// appelle Claude. La lecture va AU-DELÀ du teaser gratuit : elle croise la/les dette(s)
// détectée(s) avec le chemin de vie et le nombre d'expression, personnalisée au prénom.

import { calculateLifePath, calculateExpression, KARMIC_DEBTS } from "./numerology.ts";

// Lecture de secours composée des textes canoniques (KARMIC_DEBTS) + chemin de vie,
// servie SI l'appel Claude échoue (ex : crédit API épuisé). Le client payant reçoit
// toujours une vraie lecture cohérente à l'écran (règle "livraison écran d'abord").
export function buildFallbackReading(input: ReadingInput): string {
  const parts = (input.birthDate || "").split("-").map(Number);
  const prenom = input.fullName.trim().split(/\s+/)[0] || "toi";
  let lpLine = "";
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    const [y, m, d] = parts;
    const lp = calculateLifePath(d, m, y);
    lpLine = `Ton chemin de vie ${lp.number}${lp.isMaster ? " (maître nombre)" : ""} colore la façon dont cette mémoire se rejoue aujourd'hui.`;
  }
  const blocks = input.debtCodes
    .map((code) => KARMIC_DEBTS[code])
    .filter(Boolean)
    .map((info) => {
      return [
        `## ${info.code} — ${info.title}`,
        `**La mémoire d'âme.** ${info.story} ${info.pastLife}`,
        `**Ce que ça crée aujourd'hui.** ${info.currentChallenge} ${lpLine}`,
        `**Le travail de cette incarnation.** ${info.healing}`,
        `**Ton rituel de la semaine.** Chaque soir, note un moment où le schéma du ${info.code} s'est rejoué dans ta journée — sans te juger, juste pour le voir. La conscience est le premier pas du remboursement.`,
        `**La question à te poser.** Avant chaque décision importante : « est-ce que je répète mon ${info.code}, ou est-ce que je choisis la voie de guérison ? »`,
      ].join("\n\n");
    });
  const intro = `${prenom}, voici ta lecture karmique. Prends-la comme une carte, pas comme une sentence : la dette est une invitation à grandir, jamais une condamnation.`;
  return [intro, ...blocks].join("\n\n");
}

export type ReadingInput = {
  fullName: string;
  birthDate: string; // "YYYY-MM-DD"
  locale: string;
  debtCodes: string[];
};

export function buildKarmicDebtPrompt(input: ReadingInput): string {
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const lp = calculateLifePath(d, m, y);
  const hasName = input.fullName.trim().length > 0;
  const prenom = hasName ? input.fullName.trim().split(/\s+/)[0] : "toi";
  const exprLine = hasName
    ? `Nombre d'expression (depuis "${input.fullName.trim()}") : ${calculateExpression(input.fullName).number}.`
    : `Nom complet non fourni : centre la lecture sur la/les dette(s) et le chemin de vie.`;

  // Matière première canonique pour ancrer Claude sur la doctrine du site.
  const debtContext = input.debtCodes
    .map((code) => {
      const info = KARMIC_DEBTS[code];
      if (!info) return `- ${code}`;
      return `- ${info.code} (${info.title}) · mémoire : ${info.pastLife}`;
    })
    .join("\n");

  return [
    `Tu es Orion, coach karmique de Karmastro : voix chaleureuse, lucide, incarnée, jamais anxiogène ni new-age creux.`,
    `Écris une lecture karmique personnalisée EN FRANÇAIS, au tutoiement, d'environ 1100 à 1400 mots.`,
    ``,
    `Personne : prénom "${prenom}".`,
    `Dette(s) karmique(s) détectée(s) :`,
    debtContext,
    `Chemin de vie : ${lp.number}${lp.isMaster ? " (maître nombre)" : ""}. ${exprLine}`,
    ``,
    `Structure la lecture en sections avec des titres en markdown (##) :`,
    `1) La mémoire d'âme — ce que cette ou ces dette(s) racontent d'une vie passée, formulé pour ${prenom}.`,
    `2) Ce que ça crée aujourd'hui dans TA vie — concret, relié au chemin de vie ${lp.number}.`,
    `3) Le travail de cette incarnation — la leçon à intégrer, sans culpabilisation.`,
    `4) Ton rituel de la semaine — un geste concret, simple, à tenter dans les 7 jours.`,
    `5) La question à te poser — une seule question pivot à se poser avant chaque décision importante.`,
    ``,
    `Contraintes : pas de promesse médicale, financière ou de guérison miraculeuse ; pas de fatalisme (la dette est une invitation, jamais une sentence) ; pas de jargon non expliqué ; pas de listes à puces interminables, privilégie une prose habitée. Commence directement par la première section.`,
  ].join("\n");
}

// Appel Claude isolé — vérifié manuellement (test E2E), pas en test unitaire (réseau + clé).
export async function generateReading(input: ReadingInput): Promise<string> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY manquante");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 3500,
      messages: [{ role: "user", content: buildKarmicDebtPrompt(input) }],
    }),
  });
  if (!res.ok) {
    throw new Error(`Anthropic ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const data = await res.json();
  const text = data?.content?.[0]?.text ?? "";
  if (!text) throw new Error("Réponse Claude vide");
  return text;
}

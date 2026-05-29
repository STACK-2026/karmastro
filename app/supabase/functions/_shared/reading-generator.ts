// Génère la lecture karmique payante : construit le prompt (déterministe, testé) puis
// appelle Claude. La lecture va AU-DELÀ du teaser gratuit : elle croise la/les dette(s)
// détectée(s) avec le chemin de vie et le nombre d'expression, personnalisée au prénom.

import { calculateLifePath, calculateExpression, KARMIC_DEBTS } from "./numerology.ts";

// Résumés canoniques EN (pour le fallback anglais — KARMIC_DEBTS source est FR).
const KARMIC_DEBTS_EN: Record<string, { title: string; pastLife: string; challenge: string; healing: string }> = {
  "13/4": { title: "The debt of laziness", pastLife: "In a past life, your soul sought shortcuts and let others carry the weight of its existence.", challenge: "This life, everything you earn demands twice the effort; projects only bear fruit if you go the distance.", healing: "Embrace patient daily work. Each task done conscientiously pays your debt — no shortcuts, just the beauty of work well done." },
  "14/5": { title: "The debt of misused freedom", pastLife: "In a past life, your soul abused pleasures and freedom without measure or responsibility.", challenge: "This life, temptations are frequent and consequences swift — excess and compulsive change lie in wait.", healing: "Find freedom in moderation and chosen commitment. True freedom isn't fleeing all ties — it's choosing them." },
  "16/7": { title: "The debt of spiritual ego", pastLife: "In a past life, your soul used its knowledge to dominate, seduce or feel superior.", challenge: "This life, sudden falls and ego collapses force humility; whatever is built on spiritual pride crumbles.", healing: "Accept collapses as purifications. Cultivate sincere humility and shared knowledge without vanity." },
  "19/1": { title: "The debt of misused power", pastLife: "In a past life, your soul wielded authority with cruelty, or abandoned those who depended on its leadership.", challenge: "This life, you must learn to lead with responsibility; you may feel isolated or misunderstood in your leadership.", healing: "Accept to lead when it's your role. Learn power in service — authority that lifts others up." },
};

// Lecture de secours composée des textes canoniques (KARMIC_DEBTS) + chemin de vie,
// servie SI l'appel Claude échoue (ex : crédit API épuisé). Le client payant reçoit
// toujours une vraie lecture cohérente à l'écran (règle "livraison écran d'abord").
export function buildFallbackReading(input: ReadingInput): string {
  const en = input.locale === "en";
  const parts = (input.birthDate || "").split("-").map(Number);
  const first = input.fullName.trim().split(/\s+/)[0] || (en ? "friend" : "toi");
  let lpLine = "";
  if (parts.length === 3 && parts.every((n) => Number.isFinite(n))) {
    const [y, m, d] = parts;
    const lp = calculateLifePath(d, m, y);
    lpLine = en
      ? `Your life path ${lp.number}${lp.isMaster ? " (master number)" : ""} colours how this memory replays today.`
      : `Ton chemin de vie ${lp.number}${lp.isMaster ? " (maître nombre)" : ""} colore la façon dont cette mémoire se rejoue aujourd'hui.`;
  }

  if (en) {
    const blocks = input.debtCodes.map((code) => KARMIC_DEBTS_EN[code] ? { code, ...KARMIC_DEBTS_EN[code] } : null)
      .filter(Boolean)
      .map((info) => [
        `## ${info!.code} — ${info!.title}`,
        `**The soul memory.** ${info!.pastLife}`,
        `**What it creates today.** ${info!.challenge} ${lpLine}`,
        `**The work of this lifetime.** ${info!.healing}`,
        `**Your ritual for the week.** Each evening, note one moment where the ${info!.code} pattern replayed in your day — without judging, just to see it. Awareness is the first step of repayment.`,
        `**The question to hold.** Before each important decision: "am I repeating my ${info!.code}, or choosing the path of healing?"`,
      ].join("\n\n"));
    const intro = `${first}, here is your karmic reading. Take it as a map, not a sentence: a karmic debt is an invitation to grow, never a condemnation.`;
    return [intro, ...blocks].join("\n\n");
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
  const intro = `${first}, voici ta lecture karmique. Prends-la comme une carte, pas comme une sentence : la dette est une invitation à grandir, jamais une condamnation.`;
  return [intro, ...blocks].join("\n\n");
}

export type ReadingInput = {
  fullName: string;
  birthDate: string; // "YYYY-MM-DD"
  locale: string;
  debtCodes: string[];
};

export function buildKarmicDebtPrompt(input: ReadingInput): string {
  const en = input.locale === "en";
  const [y, m, d] = input.birthDate.split("-").map(Number);
  const lp = calculateLifePath(d, m, y);
  const hasName = input.fullName.trim().length > 0;
  const first = hasName ? input.fullName.trim().split(/\s+/)[0] : (en ? "the seeker" : "toi");

  if (en) {
    const exprLine = hasName
      ? `Expression number (from "${input.fullName.trim()}"): ${calculateExpression(input.fullName).number}.`
      : `Full name not provided: centre the reading on the karmic debt(s) and the life path.`;
    const debtContext = input.debtCodes.map((code) => {
      const info = KARMIC_DEBTS_EN[code];
      return info ? `- ${code} (${info.title}) · memory: ${info.pastLife}` : `- ${code}`;
    }).join("\n");
    return [
      `You are Orion, the karmic coach of Karmastro: warm, lucid, grounded, never anxiety-inducing or hollow new-age.`,
      `Write a personalised karmic reading IN ENGLISH, addressing the person as "you", about 1100 to 1400 words.`,
      ``,
      `Person: first name "${first}".`,
      `Detected karmic debt(s):`,
      debtContext,
      `Life path: ${lp.number}${lp.isMaster ? " (master number)" : ""}. ${exprLine}`,
      ``,
      `Structure the reading in sections with markdown (##) titles:`,
      `1) The soul memory — what this debt (or debts) say about a past life, written for ${first}.`,
      `2) What it creates in YOUR life today — concrete, tied to life path ${lp.number}.`,
      `3) The work of this lifetime — the lesson to integrate, without guilt-tripping.`,
      `4) Your ritual for the week — one simple, concrete gesture to try within 7 days.`,
      `5) The question to hold — a single pivotal question to ask before every important decision.`,
      ``,
      `Constraints: no medical, financial or miraculous-healing promises; no fatalism (a karmic debt is an invitation, never a sentence); no unexplained jargon; avoid endless bullet lists, favour inhabited prose. Start directly with the first section.`,
    ].join("\n");
  }

  const exprLine = hasName
    ? `Nombre d'expression (depuis "${input.fullName.trim()}") : ${calculateExpression(input.fullName).number}.`
    : `Nom complet non fourni : centre la lecture sur la/les dette(s) et le chemin de vie.`;
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
    `Personne : prénom "${first}".`,
    `Dette(s) karmique(s) détectée(s) :`,
    debtContext,
    `Chemin de vie : ${lp.number}${lp.isMaster ? " (maître nombre)" : ""}. ${exprLine}`,
    ``,
    `Structure la lecture en sections avec des titres en markdown (##) :`,
    `1) La mémoire d'âme — ce que cette ou ces dette(s) racontent d'une vie passée, formulé pour ${first}.`,
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

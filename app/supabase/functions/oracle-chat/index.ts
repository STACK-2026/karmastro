import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================
// NUMEROLOGY ENGINE (server-side, reproductible)
// ============================================

function reduceToSingle(n: number, keepMasters = true): number {
  while (n > 9) {
    if (keepMasters && (n === 11 || n === 22 || n === 33)) return n;
    n = String(n).split("").reduce((sum, d) => sum + parseInt(d), 0);
  }
  return n;
}

function lifePathNumber(day: number, month: number, year: number): number {
  const d = reduceToSingle(day, true);
  const m = reduceToSingle(month, true);
  const y = reduceToSingle(String(year).split("").reduce((s, c) => s + parseInt(c), 0), true);
  return reduceToSingle(d + m + y, true);
}

function personalYear(day: number, month: number, currentYear: number): number {
  return reduceToSingle(day + month + reduceToSingle(
    String(currentYear).split("").reduce((s, c) => s + parseInt(c), 0), false
  ), true);
}

function personalMonth(day: number, month: number, currentYear: number, currentMonth: number): number {
  return reduceToSingle(personalYear(day, month, currentYear) + currentMonth, true);
}

function personalDay(day: number, month: number, currentYear: number, currentMonth: number, currentDay: number): number {
  return reduceToSingle(personalMonth(day, month, currentYear, currentMonth) + currentDay, true);
}

function getMoonPhase(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  let c = Math.floor(365.25 * year) + Math.floor(30.6 * month) + day - 694039.09;
  c = c / 29.53;
  c = c - Math.floor(c);
  const phase = Math.round(c * 8) % 8;
  const phases = [
    "Nouvelle Lune (renouveau, intentions)",
    "Premier croissant (élan, confiance)",
    "Premier quartier (action, décisions)",
    "Gibbeuse croissante (persévérance, ajustement)",
    "Pleine Lune (culmination, révélation)",
    "Gibbeuse décroissante (gratitude, partage)",
    "Dernier quartier (lâcher-prise, bilan)",
    "Dernier croissant (repos, introspection)"
  ];
  return phases[phase];
}

function getZodiacSign(day: number, month: number): { sign: string; element: string; quality: string } {
  const signs = [
    { sign: "Capricorne", element: "Terre", quality: "Cardinal", start: [1,1], end: [1,19] },
    { sign: "Verseau", element: "Air", quality: "Fixe", start: [1,20], end: [2,18] },
    { sign: "Poissons", element: "Eau", quality: "Mutable", start: [2,19], end: [3,20] },
    { sign: "Bélier", element: "Feu", quality: "Cardinal", start: [3,21], end: [4,19] },
    { sign: "Taureau", element: "Terre", quality: "Fixe", start: [4,20], end: [5,20] },
    { sign: "Gémeaux", element: "Air", quality: "Mutable", start: [5,21], end: [6,20] },
    { sign: "Cancer", element: "Eau", quality: "Cardinal", start: [6,21], end: [7,22] },
    { sign: "Lion", element: "Feu", quality: "Fixe", start: [7,23], end: [8,22] },
    { sign: "Vierge", element: "Terre", quality: "Mutable", start: [8,23], end: [9,22] },
    { sign: "Balance", element: "Air", quality: "Cardinal", start: [9,23], end: [10,22] },
    { sign: "Scorpion", element: "Eau", quality: "Fixe", start: [10,23], end: [11,21] },
    { sign: "Sagittaire", element: "Feu", quality: "Mutable", start: [11,22], end: [12,21] },
    { sign: "Capricorne", element: "Terre", quality: "Cardinal", start: [12,22], end: [12,31] },
  ];
  for (const s of signs) {
    const afterStart = month > s.start[0] || (month === s.start[0] && day >= s.start[1]);
    const beforeEnd = month < s.end[0] || (month === s.end[0] && day <= s.end[1]);
    if (afterStart && beforeEnd) return { sign: s.sign, element: s.element, quality: s.quality };
  }
  return { sign: "Capricorne", element: "Terre", quality: "Cardinal" };
}

// Known retrogrades 2026 (approximate)
function getRetrogrades2026(month: number): string[] {
  const retros: string[] = [];
  if ((month >= 3 && month <= 4) || (month >= 7 && month <= 8) || (month >= 11 && month <= 12)) retros.push("Mercure");
  if (month >= 7 && month <= 11) retros.push("Saturne");
  if (month >= 6 && month <= 10) retros.push("Jupiter rétrograde possible");
  if (month >= 7 && month <= 12) retros.push("Neptune");
  return retros;
}

// ============================================
// SYSTEM PROMPT
// ============================================

const SYSTEM_PROMPT = `Tu es l'Oracle de Karmastro, un guide spirituel expert en astrologie occidentale, numérologie pythagoricienne et sagesse karmique.

IDENTITÉ :
Tu es sage, chaleureux, direct et jamais condescendant. Tu es un mathématicien du cosmos. La numérologie est un système mathématique reproductible (Pythagore, tradition chaldéenne). L'astrologie est basée sur les éphémérides et les calculs de positions planétaires. Tu n'inventes rien - tu calcules et tu interprètes.

MÉTHODOLOGIE (TOUJOURS montrer le raisonnement) :
1. Quand tu calcules un nombre, MONTRE LE CALCUL étape par étape
2. Quand tu interprètes un transit, EXPLIQUE la logique (quelle planète, quel aspect, quel effet)
3. Quand tu donnes un conseil de timing, CROISE numérologie (jour/mois/année personnel) ET astrologie (transits, rétrogrades, phase lunaire)
4. Cite tes sources quand pertinent : "Selon la tradition pythagoricienne...", "En astrologie classique..."

DONNÉES EN TEMPS RÉEL :
Tu reçois les données calculées du jour (phase lunaire, jour personnel, rétrogrades en cours). Utilise-les dans tes réponses.

EXPERTISE :
- Astrologie occidentale : signes, planètes, maisons, aspects, transits, rétrogrades, synastrie
- Numérologie pythagoricienne : chemins de vie 1-9 + maîtres nombres 11/22/33, expression, nombre intime, année/mois/jour personnel, cycles, pinnacles, défis
- Table de Pythagore : A=1 B=2 C=3 D=4 E=5 F=6 G=7 H=8 I=9 J=1 K=2 L=3 M=4 N=5 O=6 P=7 Q=8 R=9 S=1 T=2 U=3 V=4 W=5 X=6 Y=7 Z=8
- Dettes karmiques : 13/4 (paresse vies passées), 14/5 (abus liberté), 16/7 (ego), 19/1 (abus pouvoir)
- Noeuds lunaires : Nord = mission de vie, Sud = acquis des vies passées
- Cycles de Saturne : ~29.5 ans (premier retour 27-30 ans, deuxième 56-60 ans)

RÈGLES :
1. CROISE TOUJOURS les données du profil dans tes réponses
2. MONTRE les calculs (l'user doit pouvoir vérifier)
3. "Les astres inclinent, ne déterminent pas"
4. JAMAIS de prédictions absolues ni diagnostics médicaux
5. Français, tutoiement
6. Markdown avec emojis (✨🌙⭐🔮)
7. Concis mais profond - que de la substance
8. Tu ne mentionnes JAMAIS être une IA/chatbot/modèle. Tu es l'Oracle.
9. Pas de tiret cadratin (em dash)
10. Quand tu n'as pas une donnée, dis-le honnêtement et explique ce que tu aurais besoin pour être plus précis`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, profile } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY non configurée");

    const now = new Date();
    const todayDay = now.getDate();
    const todayMonth = now.getMonth() + 1;
    const todayYear = now.getFullYear();

    // Calculate real-time cosmic data
    const moonPhase = getMoonPhase(now);
    const retrogrades = getRetrogrades2026(todayMonth);
    const todaySign = getZodiacSign(todayDay, todayMonth);

    let cosmicContext = `\n\nDONNÉES COSMIQUES DU JOUR (${now.toISOString().split('T')[0]}) :
- Phase lunaire : ${moonPhase}
- Soleil en : ${todaySign.sign} (${todaySign.element}, ${todaySign.quality})
- Rétrogrades en cours : ${retrogrades.length > 0 ? retrogrades.join(", ") : "Aucune"}`;

    // Build profile context
    let profileContext = "";
    if (profile) {
      // Calculate numerology numbers server-side (verified)
      let numContext = "";
      if (profile.birthDate) {
        const [y, m, d] = profile.birthDate.split("-").map(Number);
        const lp = lifePathNumber(d, m, y);
        const py = personalYear(d, m, todayYear);
        const pm = personalMonth(d, m, todayYear, todayMonth);
        const pd = personalDay(d, m, todayYear, todayMonth, todayDay);
        const birthSign = getZodiacSign(d, m);

        numContext = `
- Chemin de vie (calculé) : ${lp}
- Année personnelle ${todayYear} : ${py}
- Mois personnel (${todayMonth}/${todayYear}) : ${pm}
- Jour personnel (aujourd'hui) : ${pd}
- Signe solaire (calculé) : ${birthSign.sign} (${birthSign.element})`;
      }

      profileContext = `\n\nPROFIL DE L'UTILISATEUR :
- Prénom : ${profile.firstName || "inconnu"}
- Date de naissance : ${profile.birthDate || "inconnue"}
- Heure : ${profile.birthTime || "inconnue"}
- Lieu : ${profile.birthPlace || "inconnu"}${numContext}
- Signe lunaire (déclaré) : ${profile.moonSign || "inconnu"}
- Ascendant (déclaré) : ${profile.ascendant || "inconnu"}
- Nombre d'expression : ${profile.expression || "inconnu"}
- Nombre intime : ${profile.soulUrge || "inconnu"}
- Dette karmique : ${profile.karmicDebts || "aucune"}
- Noeud Nord : ${profile.northNode || "inconnu"}`;
    }

    // Convert messages to Anthropic format
    const anthropicMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 2048,
        system: SYSTEM_PROMPT + cosmicContext + profileContext,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Les astres sont très sollicités. Réessaie dans un instant." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "L'Oracle médite profondément. Réessaie dans un instant." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "L'Oracle médite sur ta question...";

    // Return in OpenAI-compatible SSE format (expected by the frontend)
    const sseData = JSON.stringify({
      choices: [{ delta: { content: text }, finish_reason: "stop" }],
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("oracle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es l'Oracle de Karmastro, un guide spirituel expert en astrologie occidentale, numérologie pythagoricienne et sagesse karmique. Tu es sage, chaleureux, direct et jamais condescendant - comme un ami spirituel très cultivé.

La numérologie est un système mathématique : les calculs sont reproductibles, les méthodes documentées (Pythagore, tradition chaldéenne). Tu abordes le spirituel de manière rationnelle et explicable.

EXPERTISE :
- Astrologie occidentale : signes, planètes, maisons, aspects, transits, rétrogrades, synastrie
- Numérologie pythagoricienne : chemins de vie 1-9 + maîtres nombres 11/22/33, expression, nombre intime, réalisation, année/mois/jour personnel, cycles, pinnacles, défis
- Symbolisme karmique : dettes karmiques (13/4, 14/5, 16/7, 19/1), noeuds lunaires, leçons de vie, cycles de Saturne
- Heures miroirs et synchronicités
- Guidance bienveillante et non-déterministe

RÈGLES :
1. Tu croises TOUJOURS les données du profil de l'utilisateur dans tes réponses quand elles sont fournies
2. Tu utilises la formule "Les astres inclinent, ne déterminent pas"
3. Tu ne fais JAMAIS de prédictions absolues ni de diagnostics médicaux
4. Tu réponds en français, tu tutoies l'utilisateur
5. Tu formattes tes réponses en Markdown avec des emojis pertinents (✨🌙⭐🔮)
6. Tu es concis mais profond - pas de blabla, que de la substance
7. Quand on te pose une question de timing, tu croises numérologie (jour/mois/année personnel) et transits planétaires
8. Pour les questions relationnelles, tu analyses la compatibilité via synastrie ET numérologie croisée
9. Tu ne mentionnes JAMAIS que tu es une IA, un chatbot, ou un modèle de langage. Tu es l'Oracle.
10. Pas de tiret cadratin (em dash). Utilise des tirets normaux.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, profile } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY non configurée");

    // Build context from user profile
    let profileContext = "";
    if (profile) {
      profileContext = `\n\nPROFIL DE L'UTILISATEUR :
- Prénom : ${profile.firstName || "inconnu"}
- Date de naissance : ${profile.birthDate || "inconnue"}
- Heure : ${profile.birthTime || "inconnue"}
- Lieu : ${profile.birthPlace || "inconnu"}
- Signe solaire : ${profile.sunSign || "inconnu"}
- Signe lunaire : ${profile.moonSign || "inconnu"}
- Ascendant : ${profile.ascendant || "inconnu"}
- Chemin de vie : ${profile.lifePath || "inconnu"}
- Nombre d'expression : ${profile.expression || "inconnu"}
- Nombre intime : ${profile.soulUrge || "inconnu"}
- Année personnelle : ${profile.personalYear || "inconnue"}
- Mois personnel : ${profile.personalMonth || "inconnu"}
- Jour personnel : ${profile.personalDay || "inconnu"}
- Dette karmique : ${profile.karmicDebts || "aucune"}
- Noeud Nord : ${profile.northNode || "inconnu"}
- Date du jour : ${new Date().toISOString().split('T')[0]}`;
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
        system: SYSTEM_PROMPT + profileContext,
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

      return new Response(JSON.stringify({ error: "L'Oracle est momentanément indisponible." }), {
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

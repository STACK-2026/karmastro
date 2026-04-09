import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `Tu es l'Oracle de Karmique, un guide spirituel expert en astrologie occidentale, numérologie pythagoricienne et sagesse karmique. Tu es sage, chaleureux, direct et jamais condescendant  -  comme un ami spirituel très cultivé.

EXPERTISE :
- Astrologie occidentale : signes, planètes, maisons, aspects, transits, rétrogrades, synastrie
- Numérologie pythagoricienne : chemins de vie 1-9 + maîtres nombres 11/22/33, expression, nombre intime, réalisation, année/mois/jour personnel, cycles, pinnacles, défis
- Symbolisme karmique : dettes karmiques (13/4, 14/5, 16/7, 19/1), nœuds lunaires, leçons de vie, cycles de Saturne
- Heures miroirs et synchronicités
- Guidance bienveillante et non-déterministe

RÈGLES :
1. Tu croises TOUJOURS les données du profil de l'utilisateur dans tes réponses quand elles sont fournies
2. Tu utilises la formule "Les astres inclinent, ne déterminent pas"
3. Tu ne fais JAMAIS de prédictions absolues ni de diagnostics médicaux
4. Tu réponds en français par défaut (ou en anglais si demandé)
5. Tu formattes tes réponses en Markdown avec des emojis pertinents (✨🌙⭐🔮)
6. Tu es concis mais profond  -  pas de blabla, que de la substance
7. Quand on te pose une question de timing, tu croises numérologie (jour/mois/année personnel) et transits planétaires
8. Pour les questions relationnelles, tu analyses la compatibilité via synastrie ET numérologie croisée`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, profile } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build context from user profile if available
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
- Nœud Nord : ${profile.northNode || "inconnu"}
- Date du jour : ${new Date().toISOString().split('T')[0]}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: SYSTEM_PROMPT + profileContext },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans un instant." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoutez des fonds dans les paramètres." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur du gateway IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("oracle error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erreur inconnue" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

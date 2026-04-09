import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENGINE_URL = "http://168.119.229.20:8100";

const SYSTEM_PROMPT = `Tu es l'Oracle de Karmastro, un guide spirituel expert en astrologie occidentale, numérologie pythagoricienne et sagesse karmique.

IDENTITÉ :
Tu es sage, chaleureux, direct et jamais condescendant. Tu es un mathématicien du cosmos. La numérologie est un système mathématique reproductible (Pythagore, tradition chaldéenne). L'astrologie est basée sur les éphémérides Swiss Ephemeris, précision 0.001 arcseconde (niveau NASA). Tu n'inventes rien - tu calcules et tu interprètes.

MÉTHODOLOGIE :
1. MONTRE LE CALCUL étape par étape quand tu calcules un nombre
2. EXPLIQUE la logique quand tu interprètes un transit (quelle planète, quel aspect, quel effet)
3. CROISE numérologie (jour/mois/année personnel) ET astrologie (transits, rétrogrades, phase lunaire)
4. Cite tes sources : "Selon la tradition pythagoricienne...", "En astrologie classique..."
5. Tu reçois les positions planétaires EXACTES calculées par Swiss Ephemeris - utilise-les

EXPERTISE :
- Astrologie occidentale : signes, planètes, maisons, aspects, transits, rétrogrades, synastrie
- Numérologie pythagoricienne : chemins de vie 1-9 + maîtres nombres 11/22/33, expression, nombre intime, année/mois/jour personnel, cycles, pinnacles, défis
- Table de Pythagore : A=1 B=2 C=3 D=4 E=5 F=6 G=7 H=8 I=9 J=1 K=2 L=3 M=4 N=5 O=6 P=7 Q=8 R=9 S=1 T=2 U=3 V=4 W=5 X=6 Y=7 Z=8
- Dettes karmiques : 13/4 (paresse), 14/5 (abus liberté), 16/7 (ego), 19/1 (abus pouvoir)
- Noeuds lunaires : Nord = mission de vie, Sud = acquis des vies passées
- Cycles de Saturne : ~29.5 ans

RÈGLES :
1. CROISE TOUJOURS les données du profil dans tes réponses
2. MONTRE les calculs (l'utilisateur doit pouvoir vérifier)
3. "Les astres inclinent, ne déterminent pas"
4. JAMAIS de prédictions absolues ni diagnostics médicaux
5. Français, tutoiement
6. Markdown avec emojis (✨🌙⭐🔮)
7. Concis mais profond - que de la substance
8. Tu ne mentionnes JAMAIS être une IA/chatbot/modèle. Tu es l'Oracle.
9. Pas de tiret cadratin (em dash)
10. Quand tu n'as pas une donnée, dis-le honnêtement`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, profile } = await req.json();
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY non configurée");

    // Fetch real-time data from the Engine API
    let engineContext = "";
    try {
      // Cosmic snapshot (always available)
      const cosmicRes = await fetch(`${ENGINE_URL}/cosmic`);
      if (cosmicRes.ok) {
        const cosmic = await cosmicRes.json();
        engineContext += `\n\nDONNÉES COSMIQUES EN TEMPS RÉEL (Swiss Ephemeris) :
- Date : ${cosmic.date}
- Phase lunaire : ${cosmic.moon?.name} (${cosmic.moon?.illumination}% illumination)
- Lune en : ${cosmic.moon?.moon_sign?.sign} ${cosmic.moon?.moon_sign?.degree}°${cosmic.moon?.moon_sign?.minute}'
- Soleil en : ${cosmic.sun_position?.sign} ${cosmic.sun_position?.degree}°${cosmic.sun_position?.minute}'
- Rétrogrades : ${cosmic.retrogrades?.length > 0 ? cosmic.retrogrades.map((r: any) => `${r.planet} en ${r.sign}`).join(", ") : "Aucune planète rétrograde"}`;
      }

      // Full profile context if birth data available
      if (profile?.birthDate) {
        const [y, m, d] = profile.birthDate.split("-").map(Number);
        const body: any = { year: y, month: m, day: d };
        if (profile.birthTime) {
          const [h, mi] = profile.birthTime.split(":").map(Number);
          body.hour = h + (mi || 0) / 60;
        }
        if (profile.latitude) body.latitude = profile.latitude;
        if (profile.longitude) body.longitude = profile.longitude;
        if (profile.firstName) body.name = profile.firstName + (profile.lastName ? " " + profile.lastName : "");

        const ctxRes = await fetch(`${ENGINE_URL}/oracle-context`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (ctxRes.ok) {
          const ctx = await ctxRes.json();
          const n = ctx.numerology;
          const chart = ctx.natal_chart;

          engineContext += `\n\nPROFIL NUMÉROLOGIQUE (calculé) :
- Prénom : ${profile.firstName || "inconnu"}
- Chemin de vie : ${n?.life_path?.number} ${n?.life_path?.is_master ? "(MAÎTRE NOMBRE)" : ""} — calcul : ${n?.life_path?.calculation}
- Année personnelle ${new Date().getFullYear()} : ${n?.personal_year}
- Mois personnel : ${n?.personal_month}
- Jour personnel (aujourd'hui) : ${n?.personal_day}`;

          if (n?.expression) engineContext += `\n- Expression : ${n.expression.number} — ${n.expression.calculation}`;
          if (n?.soul_urge) engineContext += `\n- Nombre intime : ${n.soul_urge.number}`;
          if (n?.karmic_debts?.length > 0) {
            engineContext += `\n- Dettes karmiques : ${n.karmic_debts.map((d: any) => `${d.number} (${d.source} — ${d.meaning})`).join("; ")}`;
          }
          if (n?.inclusion?.missing_numbers?.length > 0) {
            engineContext += `\n- Nombres manquants (leçons karmiques) : ${n.inclusion.missing_numbers.join(", ")}`;
          }
          if (n?.pinnacles) {
            engineContext += `\n- Pinnacles : ${n.pinnacles.map((p: any) => `${p.pinnacle}e (${p.ages}) = ${p.number}`).join(", ")}`;
          }

          if (chart?.planets) {
            engineContext += `\n\nTHÈME NATAL (Swiss Ephemeris, précision 0.001") :`;
            for (const [pname, pdata] of Object.entries(chart.planets) as any) {
              const retro = pdata.retrograde ? " ℞" : "";
              const house = pdata.house ? ` (maison ${pdata.house})` : "";
              engineContext += `\n- ${pname} : ${pdata.sign} ${pdata.degree}°${pdata.minute}'${retro}${house}`;
            }
            if (chart.ascendant) engineContext += `\n- Ascendant : ${chart.ascendant.sign} ${chart.ascendant.degree}°${chart.ascendant.minute}'`;
            if (chart.midheaven) engineContext += `\n- Milieu du Ciel : ${chart.midheaven.sign} ${chart.midheaven.degree}°${chart.midheaven.minute}'`;
          }

          if (chart?.aspects?.length > 0) {
            engineContext += `\n\nASPECTS NATAUX :`;
            for (const a of chart.aspects.slice(0, 10)) {
              engineContext += `\n- ${a.planet_1} ${a.aspect} ${a.planet_2} (orbe ${a.orb}°, ${a.nature})${a.exact ? " — EXACT" : ""}`;
            }
          }

          if (ctx.active_transits?.length > 0) {
            engineContext += `\n\nTRANSITS ACTIFS AUJOURD'HUI :`;
            for (const t of ctx.active_transits.slice(0, 8)) {
              const retro = t.transit_retrograde ? " ℞" : "";
              engineContext += `\n- ${t.transit_planet}${retro} ${t.aspect} ${t.natal_planet} natal (orbe ${t.orb}°, ${t.nature})`;
            }
          }

          engineContext += `\n- Âge : ${ctx.age} ans`;
        }
      }
    } catch (engineErr) {
      console.error("Engine API error (non-blocking):", engineErr);
      engineContext += "\n\n(Données astrologiques en temps réel temporairement indisponibles — utiliser les connaissances générales)";
    }

    // Profile basics if no Engine data
    if (!engineContext.includes("PROFIL") && profile) {
      engineContext += `\n\nPROFIL DÉCLARÉ :
- Prénom : ${profile.firstName || "inconnu"}
- Date de naissance : ${profile.birthDate || "inconnue"}
- Signe solaire : ${profile.sunSign || "inconnu"}
- Signe lunaire : ${profile.moonSign || "inconnu"}
- Ascendant : ${profile.ascendant || "inconnu"}`;
    }

    // Convert messages
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
        system: SYSTEM_PROMPT + engineContext,
        messages: anthropicMessages,
      }),
    });

    if (!response.ok) {
      console.error("Anthropic error:", response.status);
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

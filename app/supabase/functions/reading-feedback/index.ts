// reading-feedback : capture le retour J+1 ("la lecture a-t-elle résonné ?").
// Lien cliqué depuis l'email de suivi : ?token=<uuid>&v=good|meh
// Enregistre readings.feedback, loggue un event analytics, puis REDIRIGE vers
// la lecture (re-voit son contenu + cross-sell). Public, idempotent.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE = "https://karmastro.com";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  const v = url.searchParams.get("v") === "good" ? "good" : "meh";
  if (!token) return new Response("token requis", { status: 400 });

  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    // n'écrase pas un feedback déjà donné (idempotent, 1er clic gagne)
    const { data: row } = await sb
      .from("readings")
      .select("locale, feedback")
      .eq("token", token)
      .maybeSingle();
    if (row && !row.feedback) {
      await sb.from("readings").update({ feedback: v }).eq("token", token);
      // event analytics (surface site, comme tracker.js)
      sb.from("analytics_events").insert({
        session_id: "followup",
        surface: "site",
        event_name: "reading_feedback",
        properties: { value: v },
        path: "/lecture/",
      }).then(() => {});
    }
    const lang = row?.locale && row.locale !== "fr" ? `&lang=${row.locale}` : "";
    // Redirige vers la lecture (re-engagement + cross-sell), avec un petit merci.
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE}/lecture/?token=${encodeURIComponent(token)}${lang}&merci=${v}` },
    });
  } catch {
    return new Response(null, { status: 302, headers: { Location: `${SITE}/` } });
  }
});

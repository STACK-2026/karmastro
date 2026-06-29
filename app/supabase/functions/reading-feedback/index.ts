// reading-feedback : capture l'avis sur une lecture payante.
//
//  GET  ?token=<uuid>&v=good|meh   -> compat des anciens emails 1-clic. Pose
//        feedback (good|meh) si absent puis REDIRIGE vers /avis pour enrichir
//        (note + commentaire). Public, idempotent.
//  GET  ?token=<uuid>[&note=N]     -> redirige vers /avis (page d'avis), note pre-cochee.
//  POST { token, rating?, text?, public_ok? }
//        -> enregistre rating (1-5), feedback_text, feedback_public, feedback_at.
//        Appele depuis la page /avis du site. Public, idempotent (re-soumission OK).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE = "https://karmastro.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "content-type": "application/json" } });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // ----- POST : soumission depuis la page /avis -----
  if (req.method === "POST") {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* corps invalide */ }
    const token = String(body.token || "").trim();
    if (!token) return json({ error: "token requis" }, 400);

    const ratingRaw = Number(body.rating);
    const rating = Number.isInteger(ratingRaw) && ratingRaw >= 1 && ratingRaw <= 5 ? ratingRaw : null;
    const text = typeof body.text === "string" ? body.text.trim().slice(0, 2000) : "";
    const publicOk = body.public_ok === true;

    const { data: row } = await sb.from("readings").select("locale, rating").eq("token", token).maybeSingle();
    if (!row) return json({ error: "lecture introuvable" }, 404);

    const patch: Record<string, unknown> = { feedback_at: new Date().toISOString() };
    if (rating !== null) {
      patch.rating = rating;
      patch.feedback = rating >= 4 ? "good" : "meh"; // garde la colonne historique coherente
    }
    if (text) { patch.feedback_text = text; patch.feedback_public = publicOk; }

    await sb.from("readings").update(patch).eq("token", token);
    sb.from("analytics_events").insert({
      session_id: "avis",
      surface: "site",
      event_name: "reading_review_submitted",
      properties: { rating, has_text: !!text, public_ok: publicOk },
      path: "/avis/",
    }).then(() => {});

    return json({ ok: true });
  }

  // ----- GET : clic depuis un email -----
  const url = new URL(req.url);
  const token = url.searchParams.get("token") || "";
  if (!token) return new Response("token requis", { status: 400, headers: cors });

  const vParam = url.searchParams.get("v");
  const noteParam = url.searchParams.get("note");

  try {
    const { data: row } = await sb.from("readings").select("locale, feedback").eq("token", token).maybeSingle();
    // compat : ancien lien 1-clic good|meh -> pose feedback si absent
    if (vParam && row && !row.feedback) {
      const v = vParam === "good" ? "good" : "meh";
      await sb.from("readings").update({ feedback: v }).eq("token", token);
      sb.from("analytics_events").insert({
        session_id: "followup", surface: "site", event_name: "reading_feedback",
        properties: { value: v }, path: "/lecture/",
      }).then(() => {});
    }
    const lang = row?.locale && row.locale !== "fr" ? `&lang=${row.locale}` : "";
    const note = noteParam ? `&note=${encodeURIComponent(noteParam)}` : "";
    return new Response(null, {
      status: 302,
      headers: { ...cors, Location: `${SITE}/avis/?token=${encodeURIComponent(token)}${note}${lang}` },
    });
  } catch {
    return new Response(null, { status: 302, headers: { ...cors, Location: `${SITE}/` } });
  }
});

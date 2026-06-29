// send-followups : envoie l'email J+1 "ta lecture a-t-elle résonné ?" aux acheteurs
// d'une lecture livrée la veille (status ready, followup_sent_at null, email présent).
// Idempotent : marque followup_sent_at après envoi (un seul J+1 par lecture).
// Déclenché par cron (email-followups.yml) ; protégé par un secret CRON_SECRET.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";

serve(async (req) => {
  // garde simple : header x-cron-secret ou ?dry=1 pour tester sans envoyer
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const auth = req.headers.get("x-cron-secret") || url.searchParams.get("secret") || "";
  if (CRON_SECRET && auth !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { "content-type": "application/json" } });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // Lectures livrées il y a 20h à 48h, sans suivi encore, avec email.
  const nowMs = Date.now();
  const since = new Date(nowMs - 48 * 3600 * 1000).toISOString();
  const until = new Date(nowMs - 20 * 3600 * 1000).toISOString();

  const { data: rows, error } = await sb
    .from("readings")
    .select("token, email, locale, created_at, inputs_json")
    .eq("status", "ready")
    .is("followup_sent_at", null)
    .not("email", "is", null)
    .gte("created_at", since)
    .lte("created_at", until)
    .limit(200);

  if (error) {
    return new Response(JSON.stringify({ error: String(error.message) }), { status: 500, headers: { "content-type": "application/json" } });
  }

  let sent = 0;
  const candidates = rows || [];
  for (const r of candidates) {
    if (dry) continue;
    const fullName = (r.inputs_json && typeof r.inputs_json === "object" ? (r.inputs_json as Record<string, unknown>).fullName : null);
    const firstName = typeof fullName === "string" && fullName.trim() ? fullName.trim().split(/\s+/)[0] : null;
    try {
      const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}`, "apikey": SERVICE_KEY },
        body: JSON.stringify({ type: "reading_review", to: r.email, data: { token: r.token, locale: r.locale || "fr", firstName } }),
      });
      if (resp.ok) {
        await sb.from("readings").update({ followup_sent_at: new Date().toISOString() }).eq("token", r.token);
        sent += 1;
      }
    } catch (_e) { /* on réessaiera au prochain cron */ }
  }

  return new Response(JSON.stringify({ candidates: candidates.length, sent, dry }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
});

// send-monthly-guidance : envoie la guidance mensuelle aux abonnés actifs (Guide mensuel).
// Génère une lecture "guidance-mensuelle" personnalisée par abonné, l'envoie via Resend,
// marque last_sent_month (idempotent : 1 envoi par mois). Vérifie le statut Stripe (skip si
// annulé). Déclenché par cron mensuel (email-followups.yml), protégé par CRON_SECRET.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";
import { generateReading } from "../_shared/reading-generator.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM = Deno.env.get("RESEND_FROM_EMAIL") || "Karmastro <contact@karmastro.com>";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";

const SUBJECT: Record<string, string> = {
  fr: "✦ Ta guidance du mois est arrivée", en: "✦ Your guidance for the month is here",
};

function mdToHtml(md: string): string {
  return md.split(/\n{2,}/).map((b) => {
    const t = b.trim().replace(/</g, "&lt;");
    if (!t) return "";
    if (t.startsWith("## ")) return `<h2 style="font-family:Georgia,serif;font-size:19px;color:#fcd34d;margin:22px 0 8px;">${t.slice(3)}</h2>`;
    return `<p style="font-size:15px;line-height:1.7;color:rgba(255,255,255,0.85);margin:0 0 14px;">${t.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

serve(async (req) => {
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const auth = req.headers.get("x-cron-secret") || url.searchParams.get("secret") || "";
  if (CRON_SECRET && auth !== CRON_SECRET) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const stripe = STRIPE_SECRET_KEY ? new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia", httpClient: Stripe.createFetchHttpClient() }) : null;

  const now = new Date();
  const yr = now.getUTCFullYear();
  const mo = now.getUTCMonth() + 1;
  const monthKey = `${yr}-${String(mo).padStart(2, "0")}`;

  const { data: subs, error } = await sb
    .from("subscriptions")
    .select("id, email, birth_date, full_name, locale, stripe_subscription_id, status, last_sent_month")
    .eq("status", "active")
    .or(`last_sent_month.is.null,last_sent_month.neq.${monthKey}`)
    .limit(500);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  let sent = 0, skipped = 0;
  for (const s of subs || []) {
    if (!s.birth_date || !s.email) { skipped++; continue; }
    // statut Stripe à jour ?
    if (stripe && s.stripe_subscription_id) {
      try {
        const sub = await stripe.subscriptions.retrieve(s.stripe_subscription_id);
        if (sub.status !== "active" && sub.status !== "trialing") {
          await sb.from("subscriptions").update({ status: sub.status, canceled_at: new Date().toISOString() }).eq("id", s.id);
          skipped++; continue;
        }
      } catch { /* on tente quand même l'envoi */ }
    }
    if (dry) { sent++; continue; }
    try {
      const content = await generateReading({
        tool: "guidance-mensuelle", fullName: s.full_name || "", birthDate: s.birth_date,
        locale: s.locale || "fr", currentYear: yr, currentMonth: mo,
      });
      const loc = s.locale === "en" ? "en" : "fr";
      const html = `<div style="background:#0f0a1e;padding:32px 20px;font-family:system-ui,sans-serif;"><div style="max-width:560px;margin:0 auto;background:rgba(26,15,46,0.9);border:1px solid rgba(212,160,23,0.25);border-radius:16px;padding:32px 28px;"><p style="font-size:11px;letter-spacing:4px;color:rgba(251,191,36,0.5);text-align:center;margin:0 0 18px;">✦ ✧ · ✦ · ✧ ✦</p>${mdToHtml(content)}<p style="font-size:11px;color:rgba(196,184,219,0.4);text-align:center;margin-top:24px;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">Guide mensuel Karmastro · <a href="https://karmastro.com" style="color:rgba(251,191,36,0.6);">karmastro.com</a></p></div></div>`;
      const resp = await fetch("https://api.resend.com/emails", {
        method: "POST", headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: FROM, to: s.email, subject: SUBJECT[loc], html }),
      });
      if (resp.ok) {
        await sb.from("subscriptions").update({ last_sent_month: monthKey }).eq("id", s.id);
        sent++;
      } else { skipped++; }
    } catch { skipped++; }
  }
  return new Response(JSON.stringify({ candidates: (subs || []).length, sent, skipped, monthKey, dry }), { status: 200, headers: { "content-type": "application/json" } });
});

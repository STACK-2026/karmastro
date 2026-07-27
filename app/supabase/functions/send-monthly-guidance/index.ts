// send-monthly-guidance : envoie la guidance mensuelle aux abonnés actifs (Guide mensuel).
// Génère une lecture "guidance-mensuelle" personnalisée par abonné, l'envoie via Resend,
// marque last_sent_month (idempotent : 1 envoi par mois). Vérifie le statut Stripe (skip si
// annulé). Déclenché par cron mensuel (email-followups.yml), protégé par CRON_SECRET.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";
import { generateReading } from "../_shared/reading-generator.ts";
import {
  canExecuteGuidanceSend,
  classifyStripeSubscription,
  guidanceRunHttpStatus,
  hydrateGuidanceSubscriber,
  shouldPersistGuidanceChanges,
  type GuidanceSubscriber,
} from "../_shared/monthly-guidance.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const CRON_SECRET = Deno.env.get("CRON_SECRET") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM = Deno.env.get("RESEND_FROM_EMAIL") || "Karmastro <contact@karmastro.com>";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SEND_ENABLED = Deno.env.get("MONTHLY_GUIDANCE_SEND_ENABLED");

const SUBJECT: Record<string, string> = {
  fr: "✦ Ta guidance du mois est arrivée", en: "✦ Your guidance for the month is here",
};

type SubscriptionRow = GuidanceSubscriber & {
  id: string;
  stripe_subscription_id: string | null;
  status: string | null;
  last_sent_month: string | null;
};

type GuidanceCounters = {
  candidates: number;
  eligible: number;
  sent: number;
  recoverable_profile: number;
  blocked_missing_profile: number;
  blocked_missing_email: number;
  blocked_stripe_error: number;
  blocked_inactive: number;
  failed_generation: number;
  failed_resend: number;
  failed_state_update: number;
};

function mdToHtml(md: string): string {
  return md.split(/\n{2,}/).map((b) => {
    const t = b.trim()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    if (!t) return "";
    if (t.startsWith("## ")) return `<h2 style="font-family:Georgia,serif;font-size:19px;color:#fcd34d;margin:22px 0 8px;">${t.slice(3)}</h2>`;
    return `<p style="font-size:15px;line-height:1.7;color:rgba(255,255,255,0.85);margin:0 0 14px;">${t.replace(/\n/g, "<br>")}</p>`;
  }).join("");
}

serve(async (req) => {
  const url = new URL(req.url);
  const dry = url.searchParams.get("dry") === "1";
  const auth = req.headers.get("x-cron-secret") || "";
  const jsonHeaders = { "content-type": "application/json" };
  if (!CRON_SECRET) {
    return new Response(JSON.stringify({ error: "cron_secret_missing" }), { status: 503, headers: jsonHeaders });
  }
  if (auth !== CRON_SECRET) {
    return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: jsonHeaders });
  }
  if (!SERVICE_KEY) {
    return new Response(JSON.stringify({ error: "service_role_not_configured" }), { status: 503, headers: jsonHeaders });
  }
  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: "stripe_not_configured" }), { status: 503, headers: jsonHeaders });
  }
  if (!dry && !RESEND_API_KEY) {
    return new Response(JSON.stringify({ error: "email_not_configured" }), { status: 503, headers: jsonHeaders });
  }
  if (!canExecuteGuidanceSend({ dry, sendEnabled: SEND_ENABLED })) {
    return new Response(JSON.stringify({ error: "sending_disabled", dry }), { status: 503, headers: jsonHeaders });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });

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
  if (error) {
    console.error("[monthly-guidance] candidate query failed");
    return new Response(JSON.stringify({ error: "candidate_query_failed" }), { status: 500, headers: jsonHeaders });
  }

  const rows = (subs || []) as SubscriptionRow[];
  const counters: GuidanceCounters = {
    candidates: rows.length,
    eligible: 0,
    sent: 0,
    recoverable_profile: 0,
    blocked_missing_profile: 0,
    blocked_missing_email: 0,
    blocked_stripe_error: 0,
    blocked_inactive: 0,
    failed_generation: 0,
    failed_resend: 0,
    failed_state_update: 0,
  };

  for (const row of rows) {
    let subscriber: GuidanceSubscriber = {
      email: row.email,
      birth_date: row.birth_date,
      full_name: row.full_name,
      locale: row.locale,
    };

    if (!subscriber.birth_date || !subscriber.email) {
      if (!row.stripe_subscription_id) {
        counters.blocked_missing_profile++;
        continue;
      }
      const { data: profiles, error: profileError } = await sb
        .from("profiles")
        .select("user_id, first_name, birth_date, language")
        .eq("stripe_subscription_id", row.stripe_subscription_id)
        .limit(2);
      if (profileError || profiles?.length !== 1) {
        counters.blocked_missing_profile++;
        continue;
      }

      const profile = profiles[0];
      const hydrated = hydrateGuidanceSubscriber(subscriber, profile);
      subscriber = hydrated.subscriber;
      const patch: Record<string, string> = { ...hydrated.patch };

      if (!subscriber.email) {
        const { data: authUser, error: authUserError } = await sb.auth.admin.getUserById(profile.user_id);
        const recoveredEmail = authUser?.user?.email || null;
        if (authUserError || !recoveredEmail) {
          counters.blocked_missing_email++;
          continue;
        }
        subscriber.email = recoveredEmail;
        patch.email = recoveredEmail;
      }

      if (!subscriber.birth_date) {
        counters.blocked_missing_profile++;
        continue;
      }
      if (Object.keys(patch).length > 0) {
        counters.recoverable_profile++;
        if (shouldPersistGuidanceChanges(dry)) {
          const { error: hydrationUpdateError } = await sb
            .from("subscriptions")
            .update(patch)
            .eq("id", row.id);
          if (hydrationUpdateError) {
            counters.blocked_missing_profile++;
            continue;
          }
        }
      }
    }

    if (!subscriber.email) {
      counters.blocked_missing_email++;
      continue;
    }

    if (!row.stripe_subscription_id) {
      counters.blocked_stripe_error++;
      continue;
    }

    let stripeStatus: string | null = null;
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(row.stripe_subscription_id);
      stripeStatus = stripeSubscription.status;
    } catch {
      counters.blocked_stripe_error++;
      continue;
    }

    const stripeClassification = classifyStripeSubscription(stripeStatus);
    if (stripeClassification === "inactive") {
      counters.blocked_inactive++;
      if (shouldPersistGuidanceChanges(dry)) {
        const statusPatch: Record<string, string> = { status: stripeStatus! };
        if (stripeStatus === "canceled") statusPatch.canceled_at = new Date().toISOString();
        const { error: inactiveStateError } = await sb
          .from("subscriptions")
          .update(statusPatch)
          .eq("id", row.id);
        if (inactiveStateError) counters.failed_state_update++;
      }
      continue;
    }
    if (stripeClassification === "verification_failed") {
      counters.blocked_stripe_error++;
      continue;
    }

    counters.eligible++;
    if (dry) continue;

    let content: string;
    try {
      content = await generateReading({
        tool: "guidance-mensuelle",
        fullName: subscriber.full_name || "",
        birthDate: subscriber.birth_date!,
        locale: subscriber.locale || "fr",
        currentYear: yr,
        currentMonth: mo,
      });
    } catch {
      counters.failed_generation++;
      continue;
    }

    const loc = subscriber.locale === "en" ? "en" : "fr";
    const html = `<div style="background:#0f0a1e;padding:32px 20px;font-family:system-ui,sans-serif;"><div style="max-width:560px;margin:0 auto;background:rgba(26,15,46,0.9);border:1px solid rgba(212,160,23,0.25);border-radius:16px;padding:32px 28px;"><p style="font-size:11px;letter-spacing:4px;color:rgba(251,191,36,0.5);text-align:center;margin:0 0 18px;">✦ ✧ · ✦ · ✧ ✦</p>${mdToHtml(content)}<p style="font-size:11px;color:rgba(196,184,219,0.4);text-align:center;margin-top:24px;border-top:1px solid rgba(255,255,255,0.08);padding-top:16px;">Guidance mensuelle Karmastro · <a href="https://karmastro.com" style="color:rgba(251,191,36,0.6);">karmastro.com</a></p></div></div>`;
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: subscriber.email,
        subject: SUBJECT[loc],
        html,
      }),
    }).catch(() => null);
    if (!resendResponse?.ok) {
      counters.failed_resend++;
      continue;
    }

    counters.sent++;
    const { error: sentStateError } = await sb
      .from("subscriptions")
      .update({ last_sent_month: monthKey })
      .eq("id", row.id);
    if (sentStateError) counters.failed_state_update++;
  }

  const status = guidanceRunHttpStatus(counters);
  return new Response(JSON.stringify({
    ...counters,
    skipped: counters.candidates - counters.sent,
    month_key: monthKey,
    dry,
    run_complete: status === 200,
  }), {
    status,
    headers: jsonHeaders,
  });
});

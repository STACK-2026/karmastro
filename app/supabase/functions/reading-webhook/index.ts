// reading-webhook : endpoint Stripe DÉDIÉ aux lectures (≠ stripe-webhook abonnements).
// checkout.session.completed -> génère la lecture (Claude) -> upsert readings -> email (non bloquant).
//
// Secrets requis (posés côté Supabase) :
//   STRIPE_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY (déjà présents)
//   STRIPE_READING_WEBHOOK_SECRET (whsec_..., du 2e endpoint, posé par Augustin)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";
import { generateReading, buildFallbackReading } from "../_shared/reading-generator.ts";

// EdgeRuntime est fourni par le runtime Supabase (background tasks).
// deno-lint-ignore no-explicit-any
declare const EdgeRuntime: any;

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const WEBHOOK_SECRET = Deno.env.get("STRIPE_READING_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  const stripe = new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2024-11-20.acacia",
    httpClient: Stripe.createFetchHttpClient(),
  });

  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, WEBHOOK_SECRET);
  } catch (e) {
    return new Response(`Bad signature: ${String(e).slice(0, 200)}`, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return new Response("ignored", { status: 200 });
  }

  // deno-lint-ignore no-explicit-any
  const session = event.data.object as any;
  const md = session.metadata || {};
  if (md.tool !== "karmic-debt" || !md.token) {
    return new Response("not a reading", { status: 200 });
  }

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const inputs = {
    fullName: md.fullName || "",
    birthDate: md.birthDate,
    locale: md.locale || "fr",
    debtCodes: String(md.debtCodes || "").split(",").filter(Boolean),
  };

  // 1. S'assurer qu'une ligne pending existe (sans écraser un statut déjà avancé).
  await sb.from("readings").upsert({
    token: md.token,
    email,
    tool_type: md.tool,
    inputs_json: inputs,
    locale: inputs.locale,
    status: "pending",
    stripe_session_id: session.id,
  }, { onConflict: "token", ignoreDuplicates: true });

  // 2. Claim atomique pending -> generating. Si on ne claim pas, un autre rejeu
  //    Stripe gère déjà (ou la lecture est ready/error) : on répond 200 sans rien faire.
  //    Évite la double-génération (= double coût Claude) sur rejeu de webhook.
  const { data: claimed } = await sb.from("readings")
    .update({ status: "generating" })
    .eq("token", md.token).eq("status", "pending")
    .select("token").maybeSingle();
  if (!claimed) return new Response("in progress or done", { status: 200 });

  // 3. Génération en arrière-plan : on répond 200 à Stripe TOUT DE SUITE (la génération
  //    Claude peut dépasser le timeout webhook ~10s). /lecture poll get-reading.
  const task = (async () => {
    let content: string;
    try {
      content = await generateReading(inputs);
    } catch (e) {
      // Fallback : Claude indisponible (ex crédit épuisé) -> lecture de secours canonique,
      // le client payant reçoit quand même une vraie lecture cohérente.
      console.error("Claude KO, fallback:", String(e).slice(0, 200));
      content = buildFallbackReading(inputs);
    }
    await sb.from("readings").update({ content, status: "ready" }).eq("token", md.token);
    if (email) {
      fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ type: "reading", to: email, data: { token: md.token } }),
      }).catch(() => {});
    }
  })();

  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(task);
  } else {
    await task; // fallback local/test
  }
  return new Response("ok", { status: 200 });
});

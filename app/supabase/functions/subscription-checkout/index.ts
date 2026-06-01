// subscription-checkout : Stripe Checkout en mode ABONNEMENT (Guide mensuel 4,90€/mo).
// Capture la date de naissance + locale en metadata pour générer la guidance mensuelle.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUB_PRICE_ID = Deno.env.get("SUB_PRICE_ID") || "";
const SITE = "https://karmastro.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "content-type": "application/json" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!STRIPE_SECRET_KEY) return json({ error: "STRIPE_SECRET_KEY manquante" }, 500);
    if (!SUB_PRICE_ID) return json({ error: "SUB_PRICE_ID non configuré" }, 500);
    const { birthDate, fullName, locale } = await req.json();
    if (!birthDate) return json({ error: "birthDate requis" }, 400);

    const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-11-20.acacia", httpClient: Stripe.createFetchHttpClient() });
    const loc = String(locale || "fr").slice(0, 5);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: SUB_PRICE_ID, quantity: 1 }],
      success_url: `${SITE}/abonnement-confirme/?ok=1`,
      cancel_url: `${SITE}/?sub_canceled=1`,
      subscription_data: {
        metadata: { kind: "guide_mensuel", birthDate: String(birthDate).slice(0, 20), fullName: String(fullName || "").slice(0, 120), locale: loc },
      },
      metadata: { kind: "guide_mensuel", birthDate: String(birthDate).slice(0, 20), fullName: String(fullName || "").slice(0, 120), locale: loc },
    });
    return json({ url: session.url });
  } catch (e) {
    return json({ error: String(e).slice(0, 300) }, 500);
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Price ID mapping (LIVE mode , activated 10/04/2026)
// TEST IDs kept in comments for rollback:
// etoile_monthly: price_1TKges0t7uSlTxJbUqwZ7A8Y
// etoile_annual:  price_1TKges0t7uSlTxJbpVs86TJW
// ame_soeur:      price_1TKget0t7uSlTxJbovixGYcH
// pack_lune:      price_1TKgeu0t7uSlTxJboTCwe3jF
// pack_soleil:    price_1TKgeu0t7uSlTxJb8gKdJDNq
// pack_cosmos:    price_1TKgev0t7uSlTxJbU06O6KKB
const PRICE_IDS: Record<string, string> = {
  etoile_monthly: "price_1TKgsP148fIJBvxR5Xof0v6g",
  etoile_annual: "price_1TKgsQ148fIJBvxRZIqIHiA3",
  ame_soeur: "price_1TKgsR148fIJBvxRcvA9NM6J",
  pack_lune: "price_1TKgsR148fIJBvxRUolphVum",
  pack_soleil: "price_1TKgsS148fIJBvxR2G1BhJT7",
  pack_cosmos: "price_1TKgsT148fIJBvxR9TpUHW6U",
};

// Whether each priceKey is a subscription or one-time
const IS_SUBSCRIPTION: Record<string, boolean> = {
  etoile_monthly: true,
  etoile_annual: true,
  ame_soeur: false,
  pack_lune: false,
  pack_soleil: false,
  pack_cosmos: false,
};

// Locale → Stripe currency code (all prices have currency_options configured)
const LOCALE_CURRENCY: Record<string, string> = {
  fr: "eur",
  es: "eur",
  pt: "eur",
  de: "eur",
  it: "eur",
  en: "usd",
  tr: "try",
  pl: "pln",
  ja: "jpy",
  ar: "usd", // SAR not supported in Stripe card charges → fallback USD
  ru: "usd", // RUB restricted by sanctions → fallback USD
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY non configurée");

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Parse request
    const { priceKey, successUrl, cancelUrl, locale } = await req.json();

    if (!priceKey || !PRICE_IDS[priceKey]) {
      return new Response(JSON.stringify({ error: "Produit inconnu" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine currency from locale (default EUR)
    const currency = LOCALE_CURRENCY[locale || "fr"] || "eur";

    // Get the authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non authentifié" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Session invalide" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch or create stripe_customer_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, first_name")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        name: profile?.first_name ?? undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabase
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("user_id", user.id);
    }

    // Build checkout session
    const isSub = IS_SUBSCRIPTION[priceKey];
    const origin = req.headers.get("origin") || "https://app.karmastro.com";

    // Stripe Checkout locale (2-letter code, supports all karmastro locales except ar)
    const stripeLocale = ["fr", "en", "es", "pt", "de", "it", "tr", "pl", "ja"].includes(locale)
      ? (locale as any)
      : "auto";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: isSub ? "subscription" : "payment",
      currency, // explicitly set based on user locale → uses Stripe currency_options
      line_items: [
        {
          price: PRICE_IDS[priceKey],
          quantity: 1,
        },
      ],
      success_url: successUrl || `${origin}/dashboard?checkout=success`,
      cancel_url: cancelUrl || `${origin}/pricing?checkout=canceled`,
      locale: stripeLocale,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      metadata: {
        supabase_user_id: user.id,
        price_key: priceKey,
        locale: locale || "fr",
        currency,
      },
      ...(isSub && {
        subscription_data: {
          metadata: {
            supabase_user_id: user.id,
            price_key: priceKey,
            locale: locale || "fr",
            currency,
          },
        },
      }),
    });

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("stripe-checkout error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erreur interne" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

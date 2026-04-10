import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const CREDITS_BY_PRICE: Record<string, number> = {
  pack_lune: 10,
  pack_soleil: 35,
  pack_cosmos: 100,
};

const TIER_BY_PRICE: Record<string, string> = {
  etoile_monthly: "etoile",
  etoile_annual: "etoile",
  ame_soeur: "ame_soeur",
};

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // Verify signature
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Log event (idempotent via unique constraint)
    const userIdMeta =
      (event.data.object as any).metadata?.supabase_user_id ||
      (event.data.object as any).subscription?.metadata?.supabase_user_id ||
      null;

    const { error: logError } = await supabase
      .from("stripe_events")
      .insert({
        stripe_event_id: event.id,
        type: event.type,
        user_id: userIdMeta,
        payload: event.data.object,
      });

    if (logError && !logError.message?.includes("duplicate key")) {
      console.error("Failed to log stripe event:", logError);
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const priceKey = session.metadata?.price_key;

        if (!userId || !priceKey) break;

        // Credit pack
        if (CREDITS_BY_PRICE[priceKey]) {
          const credits = CREDITS_BY_PRICE[priceKey];

          // Get current balance
          const { data: profile } = await supabase
            .from("profiles")
            .select("credits")
            .eq("user_id", userId)
            .maybeSingle();

          const newBalance = (profile?.credits || 0) + credits;

          await supabase
            .from("profiles")
            .update({ credits: newBalance })
            .eq("user_id", userId);

          await supabase
            .from("credit_transactions")
            .insert({
              user_id: userId,
              amount: credits,
              balance_after: newBalance,
              type: "purchase",
              description: `Achat ${priceKey}`,
              stripe_session_id: session.id,
            });
        }
        // Âme Soeur one-shot : unlock the tier temporarily (metadata flag, no status)
        else if (priceKey === "ame_soeur") {
          await supabase
            .from("profiles")
            .update({
              subscription_tier: "ame_soeur",
              subscription_status: "active",
              subscription_period_end: null, // no expiry for one-shot
            })
            .eq("user_id", userId);
        }
        // Subscriptions handled by customer.subscription.created/updated
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        const priceKey = sub.metadata?.price_key;

        if (!userId) break;

        const tier = priceKey && TIER_BY_PRICE[priceKey] ? TIER_BY_PRICE[priceKey] : "etoile";
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;

        await supabase
          .from("profiles")
          .update({
            subscription_tier: tier,
            subscription_status: sub.status,
            subscription_period_end: periodEnd,
            stripe_subscription_id: sub.id,
          })
          .eq("user_id", userId);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        await supabase
          .from("profiles")
          .update({
            subscription_tier: "eveil",
            subscription_status: "canceled",
            subscription_period_end: null,
            stripe_subscription_id: null,
          })
          .eq("user_id", userId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        break;
      }
    }

    // Mark event as processed
    await supabase
      .from("stripe_events")
      .update({ processed: true })
      .eq("stripe_event_id", event.id);

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("stripe-webhook error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

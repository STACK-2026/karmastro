import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_NOTIFY_EMAIL") || "augustin.foucheres@gmail.com";

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

const PRODUCT_NAMES: Record<string, string> = {
  etoile_monthly: "Étoile mensuel",
  etoile_annual: "Étoile annuel",
  ame_soeur: "Âme Sœur",
  pack_lune: "Pack Lune",
  pack_soleil: "Pack Soleil",
  pack_cosmos: "Pack Cosmos",
};

const PRICE_AMOUNTS: Record<string, string> = {
  etoile_monthly: "5,99€",
  etoile_annual: "49,99€",
  ame_soeur: "3,99€",
  pack_lune: "4,99€",
  pack_soleil: "11,99€",
  pack_cosmos: "29,99€",
};

// Helper to trigger email via send-email edge function
async function triggerEmail(
  type: string,
  to: string,
  data: Record<string, any>
): Promise<void> {
  try {
    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({ type, to, data }),
    });
    if (!res.ok) {
      console.warn("send-email failed:", res.status, await res.text());
    }
  } catch (e) {
    console.warn("triggerEmail error (non-blocking):", e);
  }
}

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

    if (logError?.code === "23505" || logError?.message?.includes("duplicate key")) {
      const { data: existingEvent } = await supabase
        .from("stripe_events")
        .select("processed")
        .eq("stripe_event_id", event.id)
        .maybeSingle();
      if (existingEvent?.processed) {
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } else if (logError) {
      console.error("Failed to log stripe event:", logError);
    }

    // Handle events
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const priceKey = session.metadata?.price_key;

        if (!userId || !priceKey) break;
        if (session.mode === "payment" && session.payment_status !== "paid") break;

        // Fetch profile for email data + birth data (Âme Sœur reading needs it)
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("credits, first_name, birth_date, language")
          .eq("user_id", userId)
          .maybeSingle();
        if (profileError) throw profileError;

        // Get user email from auth
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        const userEmail = userData?.user?.email;

        // Credit pack
        if (CREDITS_BY_PRICE[priceKey]) {
          const credits = CREDITS_BY_PRICE[priceKey];
          const { data: fulfilled, error: fulfillError } = await supabase.rpc("fulfill_credit_purchase", {
            p_user_id: userId,
            p_credits: credits,
            p_session_id: session.id,
            p_description: `Achat ${priceKey}`,
          });
          if (fulfillError) throw fulfillError;
          if (!fulfilled) break;

          // Email: payment success with credits
          if (userEmail) {
            await triggerEmail("payment_success", userEmail, {
              firstName: profile?.first_name,
              productName: PRODUCT_NAMES[priceKey] || priceKey,
              amount: PRICE_AMOUNTS[priceKey] || "",
              isSubscription: false,
              credits,
            });
          }
        }
        // Âme Sœur (lecture one-shot d'une relation) : ce n'est PAS un abonnement, donc on
        // ne pose AUCUN tier. On crée une lecture en attente de la personne concernée + on
        // invite l'acheteur à la renseigner (page /ame-soeur token-gated). Idempotent sur la
        // session Stripe (le webhook peut être rejoué, on ne recrée pas de lecture).
        else if (priceKey === "ame_soeur") {
          const { data: existingReading, error: readingLookupError } = await supabase
            .from("readings")
            .select("token")
            .eq("stripe_session_id", session.id)
            .maybeSingle();
          if (readingLookupError) throw readingLookupError;
          if (existingReading) break;
          const token = crypto.randomUUID();
          const locale = String(profile?.language || session.metadata?.locale || "fr").slice(0, 5);
          const { error: readingInsertError } = await supabase.from("readings").insert({
            token,
            email: userEmail,
            tool_type: "ame-soeur",
            status: "awaiting_partner",
            locale,
            stripe_session_id: session.id,
            user_id: userId,
            inputs_json: {
              tool: "ame-soeur",
              fullName: profile?.first_name || "",
              birthDate: profile?.birth_date || "",
              locale,
            },
          });
          if (readingInsertError) throw readingInsertError;
          if (userEmail) {
            await triggerEmail("ame_soeur_collect", userEmail, {
              firstName: profile?.first_name,
              token,
              locale,
            });
          }
        }
        // Subscriptions handled by customer.subscription.created/updated

        // Notification interne : une vente vient d'être encaissée (tout produit one-shot/pack).
        // Les abonnements notifient aussi ici (checkout.session.completed fire une fois par vente).
        await triggerEmail("admin_sale", ADMIN_EMAIL, {
          productName: PRODUCT_NAMES[priceKey] || priceKey,
          amount: PRICE_AMOUNTS[priceKey] || "",
          customerEmail: userEmail || "",
        });
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

        // Check if this is a new subscription (status transition to active)
        const { data: profileBefore } = await supabase
          .from("profiles")
          .select("subscription_status, first_name, birth_date, language")
          .eq("user_id", userId)
          .maybeSingle();

        const wasInactive = profileBefore?.subscription_status !== "active";

        const { error: subscriptionUpdateError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: tier,
            subscription_status: sub.status,
            subscription_period_end: periodEnd,
            stripe_subscription_id: sub.id,
          })
          .eq("user_id", userId);
        if (subscriptionUpdateError) throw subscriptionUpdateError;

        // The monthly guidance worker reads the dedicated subscriptions table.
        // Keep it in sync with app subscriptions so the benefit sold on the
        // pricing page is actually delivered to Star customers.
        const { data: subscriberUser } = await supabase.auth.admin.getUserById(userId);
        const subscriberEmail = subscriberUser?.user?.email;
        if (subscriberEmail) {
          const { error: guidanceSubscriptionError } = await supabase
            .from("subscriptions")
            .upsert({
              email: subscriberEmail,
              birth_date: profileBefore?.birth_date || null,
              full_name: profileBefore?.first_name || null,
              locale: profileBefore?.language || "fr",
              stripe_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer?.id || null,
              stripe_subscription_id: sub.id,
              status: sub.status,
              canceled_at: null,
            }, { onConflict: "stripe_subscription_id", ignoreDuplicates: false });
          if (guidanceSubscriptionError) throw guidanceSubscriptionError;
        }

        // Email: payment success for new subscription activation
        if (event.type === "customer.subscription.created" || (wasInactive && sub.status === "active")) {
          const userEmail = subscriberEmail;
          if (userEmail && priceKey) {
            await triggerEmail("payment_success", userEmail, {
              firstName: profileBefore?.first_name,
              productName: PRODUCT_NAMES[priceKey] || "Karmastro Étoile",
              amount: PRICE_AMOUNTS[priceKey] || "",
              isSubscription: true,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.supabase_user_id;
        if (!userId) break;

        const { error: subscriptionDeleteError } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "eveil",
            subscription_status: "canceled",
            subscription_period_end: null,
            stripe_subscription_id: null,
          })
          .eq("user_id", userId);
        if (subscriptionDeleteError) throw subscriptionDeleteError;
        const { error: guidanceDeleteError } = await supabase
          .from("subscriptions")
          .update({ status: "canceled", canceled_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        if (guidanceDeleteError) throw guidanceDeleteError;
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        const { error: paymentFailedUpdateError } = await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);
        if (paymentFailedUpdateError) throw paymentFailedUpdateError;
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;
          const { error: guidancePastDueError } = await supabase
            .from("subscriptions")
            .update({ status: "past_due" })
            .eq("stripe_subscription_id", subscriptionId);
          if (guidancePastDueError) throw guidancePastDueError;
        }
        break;
      }
    }

    // Mark event as processed
    const { error: processedUpdateError } = await supabase
      .from("stripe_events")
      .update({ processed: true })
      .eq("stripe_event_id", event.id);
    if (processedUpdateError) throw processedUpdateError;

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

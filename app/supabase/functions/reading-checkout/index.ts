// reading-checkout : crée une session Stripe Checkout one-time INVITÉ (email seul, sans compte)
// pour débloquer une lecture karmique. Génère le token d'accès et le passe en metadata + success_url.
// Réutilise le pattern de stripe-checkout/index.ts (init Stripe, CORS).
//
// Secrets requis (posés côté Supabase) :
//   STRIPE_SECRET_KEY        (déjà présent)
//   READING_PRICE_ID         (price_... one-time 4,90€, créé par Augustin)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@17.3.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const READING_PRICE_ID = Deno.env.get("READING_PRICE_ID") || "";
const SITE = "https://karmastro.com";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!STRIPE_SECRET_KEY) return json({ error: "STRIPE_SECRET_KEY non configurée" }, 500);
    if (!READING_PRICE_ID) return json({ error: "READING_PRICE_ID non configuré" }, 500);

    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const READING_TOOLS = new Set([
      "karmic-debt", "chemin-de-vie", "nombre-expression", "annee-personnelle", "compatibilite",
    ]);
    const { tool, birthDate, fullName, locale, debtCodes, partnerBirthDate, partnerName } = await req.json();
    if (!READING_TOOLS.has(tool) || !birthDate) {
      return json({ error: "params invalides" }, 400);
    }
    if (tool === "karmic-debt" && (!Array.isArray(debtCodes) || debtCodes.length === 0)) {
      return json({ error: "debtCodes requis pour karmic-debt" }, 400);
    }
    if (tool === "compatibilite" && !partnerBirthDate) {
      return json({ error: "partnerBirthDate requis pour compatibilite" }, 400);
    }

    const token = crypto.randomUUID();
    const loc = String(locale || "fr").slice(0, 5);
    const langParam = loc !== "fr" ? `&lang=${encodeURIComponent(loc)}` : "";
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: READING_PRICE_ID, quantity: 1 }],
      success_url: `${SITE}/lecture/?token=${token}${langParam}`,
      cancel_url: `${SITE}/outils/${tool === "karmic-debt" ? "dette-karmique" : tool}/?canceled=1`,
      metadata: {
        token,
        tool,
        birthDate: String(birthDate).slice(0, 20),
        fullName: String(fullName || "").slice(0, 120),
        locale: String(locale || "fr").slice(0, 5),
        debtCodes: Array.isArray(debtCodes) ? debtCodes.join(",").slice(0, 60) : "",
        partnerBirthDate: String(partnerBirthDate || "").slice(0, 20),
        partnerName: String(partnerName || "").slice(0, 120),
      },
    });

    return json({ url: session.url });
  } catch (e) {
    return json({ error: String(e).slice(0, 300) }, 500);
  }
});

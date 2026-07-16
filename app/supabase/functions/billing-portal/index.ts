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
const ALLOWED_ORIGINS = new Set([
  "https://app.karmastro.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:4174",
]);

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    if (!STRIPE_SECRET_KEY || !SUPABASE_URL || !SERVICE_KEY) {
      return json({ error: "billing_not_configured" }, 503);
    }

    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) return json({ error: "missing_auth" }, 401);

    const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) return json({ error: "invalid_token" }, 401);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError) throw profileError;
    if (!profile?.stripe_customer_id) return json({ error: "stripe_customer_missing" }, 404);

    const requestOrigin = req.headers.get("origin") || "https://app.karmastro.com";
    const origin = ALLOWED_ORIGINS.has(requestOrigin) ? requestOrigin : "https://app.karmastro.com";
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2024-11-20.acacia",
      httpClient: Stripe.createFetchHttpClient(),
    });
    const portal = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    return json({ url: portal.url });
  } catch (error) {
    console.error("billing-portal error:", error);
    return json({ error: "billing_portal_failed" }, 500);
  }
});

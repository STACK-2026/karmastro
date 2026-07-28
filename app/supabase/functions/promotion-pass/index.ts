import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  PromotionPassRequestError,
  normalizePromotionPassRequest,
} from "../_shared/promotion-pass-policy.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

type EffectiveAccess = {
  access_source: "subscription" | "promo_pass" | "none";
  has_premium_access: boolean;
  offer_state: "unavailable" | "offered" | "active" | "expired" | "revoked" | "disabled";
  activated_at: string | null;
  expires_at: string | null;
  server_now: string;
};

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function firstRow(value: unknown): EffectiveAccess | null {
  if (!Array.isArray(value) || !value[0] || typeof value[0] !== "object") return null;
  return value[0] as EffectiveAccess;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    if (!SERVICE_KEY || !ANON_KEY) return jsonResponse({ error: "entitlement_service_unavailable" }, 503);

    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token) return jsonResponse({ error: "invalid_token" }, 401);

    const authClient = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    if (authError || !authData?.user?.id) return jsonResponse({ error: "invalid_token" }, 401);

    const body = req.method === "POST"
      ? await req.json().catch(() => null)
      : undefined;
    const normalized = normalizePromotionPassRequest(req.method, body);
    const serviceClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    if (normalized.action === "status") {
      const { data, error } = await serviceClient.rpc("get_effective_app_access", {
        p_user_id: authData.user.id,
        p_campaign_code: normalized.offerCode,
      });
      const access = firstRow(data);
      if (error || !access) return jsonResponse({ error: "entitlement_service_unavailable" }, 503);
      return jsonResponse(access);
    }

    const { data, error } = await serviceClient.rpc("activate_promotion_pass", {
      p_user_id: authData.user.id,
      p_campaign_code: normalized.offerCode,
      p_activation_request_id: normalized.idempotencyKey,
    });
    const access = firstRow(data);
    if (error || !access) return jsonResponse({ error: "entitlement_service_unavailable" }, 503);

    if (access.access_source === "subscription") {
      return jsonResponse({ error: "ineligible_paid", access }, 409);
    }
    if (access.offer_state === "active") {
      return jsonResponse({ result: "activated", access });
    }
    if (access.offer_state === "expired" || access.offer_state === "revoked") {
      return jsonResponse({ error: "already_used", access }, 409);
    }
    if (access.offer_state === "disabled") {
      return jsonResponse({ error: "offer_unavailable", access }, 409);
    }
    return jsonResponse({ error: "not_offered", access }, 409);
  } catch (error) {
    if (error instanceof PromotionPassRequestError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    console.error("promotion-pass error:", error instanceof Error ? error.message : "unknown");
    return jsonResponse({ error: "entitlement_service_unavailable" }, 503);
  }
});

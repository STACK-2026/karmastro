import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  deliverWelcome,
  type WelcomeDelivery,
  type WelcomeDeliveryStore,
} from "../_shared/welcome-delivery.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function bearerToken(header: string | null): string | null {
  const match = (header?.trim() || "").match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "method_not_allowed" }, 405);
  if (!SUPABASE_URL || !SERVICE_KEY) return jsonResponse({ error: "service_unavailable" }, 503);

  const token = bearerToken(req.headers.get("Authorization"));
  if (!token) return jsonResponse({ error: "unauthorized" }, 401);

  const db = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: authData, error: authError } = await db.auth.getUser(token);
  const authUser = authData?.user;
  if (authError || !authUser?.id || !authUser.email) {
    return jsonResponse({ error: "unauthorized" }, 401);
  }

  let requestedLocale: string | null = null;
  try {
    const body = await req.json() as { locale?: unknown };
    requestedLocale = typeof body?.locale === "string" ? body.locale : null;
  } catch {
    requestedLocale = null;
  }

  const store: WelcomeDeliveryStore = {
    async getProfile(userId) {
      const { data } = await db
        .from("profiles")
        .select("first_name, language")
        .eq("user_id", userId)
        .maybeSingle();
      return data
        ? { firstName: data.first_name || null, language: data.language || null }
        : null;
    },

    async getDelivery(userId) {
      const { data } = await db
        .from("welcome_email_deliveries")
        .select("locale, first_name, status, claimed_at, attempts")
        .eq("user_id", userId)
        .maybeSingle();
      return data
        ? {
            locale: data.locale,
            firstName: data.first_name || null,
            status: data.status,
            claimedAt: data.claimed_at,
            attempts: data.attempts,
          } as WelcomeDelivery
        : null;
    },

    async createClaim(claim) {
      const { error } = await db
        .from("welcome_email_deliveries")
        .insert({
          user_id: claim.userId,
          locale: claim.locale,
          first_name: claim.firstName,
          status: "pending",
          attempts: 1,
          claimed_at: claim.claimedAt,
          last_error: null,
        });
      if (!error) return "created";
      return error.code === "23505" ? "conflict" : "error";
    },

    async reclaimDelivery(userId, current, claimedAt) {
      let query = db
        .from("welcome_email_deliveries")
        .update({
          status: "pending",
          attempts: current.attempts + 1,
          claimed_at: claimedAt,
          last_error: null,
        })
        .eq("user_id", userId)
        .eq("status", current.status);
      query = current.claimedAt
        ? query.eq("claimed_at", current.claimedAt)
        : query.is("claimed_at", null);
      const { data, error } = await query.select("user_id").maybeSingle();
      return !error && Boolean(data);
    },

    async updateProfileLocale(userId, locale) {
      const { data, error } = await db
        .from("profiles")
        .update({ language: locale })
        .eq("user_id", userId)
        .select("user_id")
        .maybeSingle();
      return !error && Boolean(data);
    },

    async sendWelcome(input) {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "welcome",
          to: input.to,
          data: { firstName: input.firstName, locale: input.locale },
          idempotencyKey: input.idempotencyKey,
        }),
      });
      const result = await response.json().catch(() => null) as { status?: string } | null;
      if (!response.ok || result?.status !== "sent") {
        throw new Error(`send_email_failed:${response.status}`);
      }
    },

    async markSent(userId, claimedAt, sentAt) {
      const { data, error } = await db
        .from("welcome_email_deliveries")
        .update({ status: "sent", sent_at: sentAt, last_error: null })
        .eq("user_id", userId)
        .eq("claimed_at", claimedAt)
        .select("user_id")
        .maybeSingle();
      return !error && Boolean(data);
    },

    async markFailed(userId, claimedAt, error) {
      await db
        .from("welcome_email_deliveries")
        .update({ status: "failed", last_error: error.slice(0, 200) })
        .eq("user_id", userId)
        .eq("claimed_at", claimedAt);
    },
  };

  const result = await deliverWelcome({
    user: {
      id: authUser.id,
      email: authUser.email,
      createdAt: authUser.created_at,
      metadata: (authUser.user_metadata || {}) as Record<string, unknown>,
    },
    requestedLocale,
    store,
  });
  const { httpStatus, ...body } = result;
  return jsonResponse(body, httpStatus);
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  decryptPendingTurn,
  encryptPendingTurn,
} from "../_shared/pending-turn-crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PendingTurnRow = {
  id: string;
  user_id: string;
  ciphertext: string;
  iv: string;
  key_version: number;
  wall_type: "anonymous_signup_wall_v1" | "authenticated_interim_limit_v1";
  status: "pending" | "claimed";
  expires_at: string;
  next_available_at: string;
};

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function currentKeyVersion(): number {
  const parsed = Number(Deno.env.get("PENDING_TURN_KEY_VERSION") || "1");
  if (!Number.isInteger(parsed) || parsed < 1) throw new Error("pending_turn_key_version_invalid");
  return parsed;
}

function encryptionSecretForVersion(version: number): string {
  const current = currentKeyVersion();
  const secret = version === current
    ? Deno.env.get("PENDING_TURN_ENCRYPTION_KEY")
    : Deno.env.get(`PENDING_TURN_ENCRYPTION_KEY_V${version}`);
  if (!secret) throw new Error("pending_turn_encryption_key_missing");
  return secret;
}

async function resolveUser(req: Request): Promise<string | null> {
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!token || !ANON_KEY) return null;
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await client.auth.getUser();
  return error ? null : data.user?.id || null;
}

function normalizeText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  return text && text.length <= 4_000 ? text : null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    if (!SERVICE_KEY) return json({ error: "identity_service_unavailable" }, 503);
    const userId = await resolveUser(req);
    if (!userId) return json({ error: "invalid_token" }, 401);
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const body = req.method === "GET" ? {} : await req.json().catch(() => ({}));
    const input = body && typeof body === "object" && !Array.isArray(body)
      ? body as Record<string, unknown>
      : {};
    const requestedId = typeof input.id === "string" && UUID_RE.test(input.id) ? input.id : null;

    if (req.method === "GET") {
      const { data, error } = await sb
        .from("oracle_pending_turns")
        .select("id,user_id,ciphertext,iv,key_version,wall_type,status,expires_at,next_available_at")
        .eq("user_id", userId)
        .in("status", ["pending", "claimed"])
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ pending_turn: null });
      const row = data as PendingTurnRow;
      const text = await decryptPendingTurn(
        { ciphertext: row.ciphertext, iv: row.iv, keyVersion: row.key_version },
        encryptionSecretForVersion(row.key_version),
      );
      return json({
        pending_turn: {
          id: row.id,
          text,
          wall_type: row.wall_type,
          status: row.status,
          expires_at: row.expires_at,
          next_available_at: row.next_available_at,
        },
      });
    }

    if (!requestedId) return json({ error: "invalid_pending_turn_id" }, 400);

    const { data, error } = await sb
      .from("oracle_pending_turns")
      .select("id,user_id,ciphertext,iv,key_version,wall_type,status,expires_at,next_available_at")
      .eq("id", requestedId)
      .eq("user_id", userId)
      .in("status", ["pending", "claimed"])
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "pending_turn_not_found" }, 404);
    const row = data as PendingTurnRow;

    if (req.method === "PATCH") {
      const text = normalizeText(input.text);
      if (!text) return json({ error: "invalid_pending_turn_text" }, 400);
      const version = currentKeyVersion();
      const encrypted = await encryptPendingTurn(text, encryptionSecretForVersion(version), version);
      const { error: updateError } = await sb
        .from("oracle_pending_turns")
        .update({
          ciphertext: encrypted.ciphertext,
          iv: encrypted.iv,
          key_version: encrypted.keyVersion,
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestedId)
        .eq("user_id", userId);
      if (updateError) throw updateError;
      return json({ pending_turn: { id: requestedId, text } });
    }

    if (req.method === "DELETE") {
      const { error: deleteError } = await sb
        .from("oracle_pending_turns")
        .delete()
        .eq("id", requestedId)
        .eq("user_id", userId);
      if (deleteError) throw deleteError;
      return json({ deleted: true });
    }

    if (req.method === "POST" && new URL(req.url).pathname.endsWith("/confirm")) {
      const text = await decryptPendingTurn(
        { ciphertext: row.ciphertext, iv: row.iv, keyVersion: row.key_version },
        encryptionSecretForVersion(row.key_version),
      );

      if (row.wall_type === "authenticated_interim_limit_v1") {
        if (Date.parse(row.next_available_at) > Date.now()) {
          return json({
            error: "not_available",
            next_available_at: row.next_available_at,
          }, 409);
        }
        return json({
          authorized_by: "daily_quota",
          pending_turn: { id: row.id, text },
        });
      }

      const { data: profile, error: profileError } = await sb
        .from("profiles")
        .select("first_name,birth_date")
        .eq("user_id", userId)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.first_name || !profile?.birth_date) {
        return json({ error: "profile_incomplete" }, 409);
      }

      const { data: existingGrant, error: grantReadError } = await sb
        .from("oracle_activation_grants")
        .select("status")
        .eq("pending_turn_id", row.id)
        .maybeSingle();
      if (grantReadError) throw grantReadError;
      if (existingGrant?.status === "consumed" || existingGrant?.status === "revoked") {
        return json({ error: "activation_grant_unavailable" }, 409);
      }
      if (!existingGrant) {
        const { error: grantError } = await sb
          .from("oracle_activation_grants")
          .insert({
            pending_turn_id: row.id,
            user_id: userId,
            expires_at: row.expires_at,
          });
        if (grantError && grantError.code !== "23505") throw grantError;
      }
      return json({
        authorized_by: "activation_grant",
        pending_turn: { id: row.id, text },
      });
    }

    return json({ error: "method_not_allowed" }, 405);
  } catch (error) {
    console.error("pending-turn error:", error instanceof Error ? error.message : "unknown");
    return json({ error: "pending_turn_unavailable" }, 503);
  }
});

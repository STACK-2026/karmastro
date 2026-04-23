import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";

// ============================================================================
// Claim an anonymous oracle session on behalf of a freshly-authenticated user.
//
// The client calls this once at SIGNED_IN, passing the session_id it still has
// in localStorage (karmastro_oracle_session). We :
//   1. resolve the caller's user_id from the Authorization bearer token,
//   2. move oracle_conversations / oracle_messages from session_id → user_id,
//   3. soft-merge any profile hints Claude captured during the anon chat
//      (only fill profile columns that are currently null/empty),
//   4. mark the hints row as claimed so we never re-apply it.
//
// Returns { claimed: { conversations, messages, hints_applied } } so the
// client can decide whether to show a "we kept your history" toast.
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    if (!SERVICE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY missing");

    // Resolve the caller's user_id from their JWT. We use the anon key client
    // only to introspect the token (auth.getUser does an authenticated RPC).
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return new Response(JSON.stringify({ error: "missing_auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sbAuth = createClient(SUPABASE_URL, ANON_KEY, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await sbAuth.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "invalid_token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const { sessionId } = await req.json().catch(() => ({ sessionId: null }));
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 128) {
      return new Response(JSON.stringify({ error: "invalid_session_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // 1. Move conversations. We only move rows that are still anonymous to
    //    avoid clobbering someone else's user_id if two users shared a browser.
    const { data: movedConvs, error: convErr } = await sb
      .from("oracle_conversations")
      .update({ user_id: userId, session_id: null })
      .eq("session_id", sessionId)
      .is("user_id", null)
      .select("id");
    if (convErr) throw convErr;

    const { data: movedMsgs, error: msgErr } = await sb
      .from("oracle_messages")
      .update({ user_id: userId, session_id: null })
      .eq("session_id", sessionId)
      .is("user_id", null)
      .select("id");
    if (msgErr) throw msgErr;

    // 2. Usage counter : merge today's anon usage into the user counter so
    //    the fresh signup doesn't get a second free quota today.
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data: anonUsage } = await sb
        .from("oracle_daily_usage")
        .select("message_count")
        .eq("session_id", sessionId)
        .eq("day", today)
        .maybeSingle();
      if (anonUsage?.message_count) {
        await sb.rpc("increment_oracle_usage", {
          p_user_id: userId,
          p_session_id: null,
        });
        // Best-effort : bump user counter to reflect what the anon session
        // already consumed. We run the RPC N-1 extra times (the first call
        // above already counts for 1).
        for (let i = 1; i < anonUsage.message_count; i += 1) {
          await sb.rpc("increment_oracle_usage", {
            p_user_id: userId,
            p_session_id: null,
          });
        }
      }
    } catch (usageErr) {
      console.warn("usage merge non-fatal:", usageErr);
    }

    // 3. Profile soft-merge. Only fill profile columns that are currently
    //    empty , never overwrite a user's own edits.
    let hintsApplied = 0;
    const { data: hints } = await sb
      .from("oracle_anon_profile_hints")
      .select("first_name,last_name,birth_date,birth_time,birth_place,gender")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (hints) {
      const { data: prof } = await sb
        .from("profiles")
        .select("first_name,last_name,birth_date,birth_time,birth_place,gender")
        .eq("user_id", userId)
        .maybeSingle();

      const patch: Record<string, string> = {};
      const isEmpty = (v: unknown) => v === null || v === undefined || v === "" || v === "-";
      for (const col of ["first_name", "last_name", "birth_date", "birth_time", "birth_place", "gender"] as const) {
        const hintVal = hints[col];
        if (typeof hintVal === "string" && hintVal.trim() && isEmpty(prof?.[col])) {
          patch[col] = hintVal.trim();
        }
      }
      if (Object.keys(patch).length > 0) {
        if (prof) {
          const { error: upErr } = await sb.from("profiles").update(patch).eq("user_id", userId);
          if (upErr) throw upErr;
        } else {
          const { error: insErr } = await sb.from("profiles").insert({ user_id: userId, ...patch });
          if (insErr) throw insErr;
        }
        hintsApplied = Object.keys(patch).length;
      }

      await sb
        .from("oracle_anon_profile_hints")
        .update({ claimed_at: new Date().toISOString(), claimed_by: userId })
        .eq("session_id", sessionId);
    }

    return new Response(
      JSON.stringify({
        claimed: {
          conversations: movedConvs?.length ?? 0,
          messages: movedMsgs?.length ?? 0,
          hints_applied: hintsApplied,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("claim-anon-session error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

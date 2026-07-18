import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
const SESSION_ID_RE = /^[A-Za-z0-9._:-]{8,128}$/;

type OracleHistoryMessage = {
  role: string;
  content: string;
  created_at: string;
};

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// Return the latest oracle conversation of the caller so the UI can rehydrate
// the chat on mount (multi-session memory). We look up by user_id for
// authenticated users, by session_id for anonymous ones. RLS cannot reason
// about session_id, so we run with the service role and scope the query
// manually.
//
// Response shape :
//   { conversation: { id, guide, updated_at } | null,
//     messages: [{ role, content, created_at }],
//     summary: string | null,
//     prior_conversations: number }
//
// `summary` is a short LLM-free recap we build locally (first+last user msgs)
// used as a fallback when we don't want to rehydrate the full thread.
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

    const { sessionId, guide } = await req.json().catch(() => ({}));

    // Resolve user_id from bearer token if provided. An invalid bearer must
    // never silently fall back to anonymous access: otherwise a stale or
    // forged token plus a guessed session id could read someone else's chat.
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (token && token !== ANON_KEY) {
      if (!ANON_KEY) return jsonResponse({ error: "identity_service_unavailable" }, 503);
      const sbAuth = createClient(SUPABASE_URL, ANON_KEY, {
        auth: { persistSession: false },
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: userData, error: userError } = await sbAuth.auth.getUser();
      if (userError || !userData?.user?.id) return jsonResponse({ error: "invalid_token" }, 401);
      userId = userData.user.id;
    }

    if (!userId && (typeof sessionId !== "string" || !SESSION_ID_RE.test(sessionId.trim()))) {
      return jsonResponse({ error: "invalid_session_id" }, 400);
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Pick the most recent conversation. If a guide is passed we prefer one
    // from the same guide , otherwise we fall back to the latest overall so
    // a user who switches guides mid-journey still gets a thread.
    const col = userId ? "user_id" : "session_id";
    const val = userId ?? sessionId.trim();

    let q = sb
      .from("oracle_conversations")
      .select("id, guide, updated_at, created_at, title")
      .eq(col, val)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (guide) q = q.eq("guide", guide);

    let { data: conv } = await q.maybeSingle();
    if (!conv) {
      // Retry without the guide filter to still recall older threads.
      const { data: anyConv } = await sb
        .from("oracle_conversations")
        .select("id, guide, updated_at, created_at, title")
        .eq(col, val)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      conv = anyConv;
    }

    // Count prior conversations for the caller so the UI can decide whether
    // to show a "we remember you" affordance.
    const { count: priorCount } = await sb
      .from("oracle_conversations")
      .select("id", { count: "exact", head: true })
      .eq(col, val);

    if (!conv) {
      return new Response(
        JSON.stringify({ conversation: null, messages: [], summary: null, prior_conversations: priorCount ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only rehydrate a conversation that's still "warm" : recent (<7 days)
    // and short enough to fit in the chat context without overwhelming the
    // user. Anything older becomes a summary-only memory.
    const ageMs = Date.now() - new Date(conv.updated_at).getTime();
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    const rehydrate = ageMs < ONE_WEEK;

    const { data: msgs } = await sb
      .from("oracle_messages")
      .select("role, content, created_at")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true })
      .limit(40);

    const messages: OracleHistoryMessage[] = (msgs ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      created_at: m.created_at,
    }));

    // Lightweight local summary : first user message + number of turns +
    // guide. Safe to inject into the next system prompt without a second
    // LLM call. The oracle-chat prompt can use this as "HISTORIQUE RÉCENT".
    const firstUserMsg = messages.find((m) => m.role === "user");
    const summary = conv
      ? `Dernière conversation avec ${conv.guide ?? "le guide"} (${new Date(conv.updated_at).toISOString().slice(0, 10)}), ${messages.length} échanges. L'utilisateur avait ouvert avec : "${(firstUserMsg?.content || conv.title || "").slice(0, 160)}".`
      : null;

    return new Response(
      JSON.stringify({
        conversation: rehydrate ? { id: conv.id, guide: conv.guide, updated_at: conv.updated_at } : null,
        messages: rehydrate ? messages : [],
        summary,
        prior_conversations: priorCount ?? 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("oracle-history error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "unknown" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

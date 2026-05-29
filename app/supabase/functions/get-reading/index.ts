// get-reading : renvoie une lecture par token (poll public depuis /lecture).
// Ne renvoie JAMAIS l'email ni de PII. Le token (uuid v4) = capacité d'accès.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json", "cache-control": "no-store" },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const token = new URL(req.url).searchParams.get("token");
  if (!token) return json({ error: "token requis" }, 400);

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const { data } = await sb
    .from("readings")
    .select("status, content, tool_type, locale, created_at") // jamais email/inputs
    .eq("token", token)
    .maybeSingle();

  if (!data) return json({ status: "not_found" }, 404);
  return json(data);
});

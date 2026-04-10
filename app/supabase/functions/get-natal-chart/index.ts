// Edge function : calcule et cache le theme natal d'un user via le Engine Swiss Ephemeris
// Appele par le client depuis useUserProfile (lazy, apres initial load)
// Cache dans profiles.natal_chart_json (hit si deja calcule et profil inchange)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ENGINE_URL = "http://168.119.229.20:8100";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check : extract user from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sbUser = createClient(SUPABASE_URL, authHeader.replace("Bearer ", ""), {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userErr } = await sbUser.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Invalid auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Service role client for DB writes
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Fetch user profile
    const { data: profile, error: pErr } = await sb
      .from("profiles")
      .select("first_name, last_name, birth_date, birth_time, birth_place, birth_latitude, birth_longitude, knows_birth_time, natal_chart_json, natal_chart_computed_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (pErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check for force refresh param
    const url = new URL(req.url);
    const force = url.searchParams.get("force") === "1";

    // Return cached chart if fresh (< 24h) and not force
    if (!force && profile.natal_chart_json && profile.natal_chart_computed_at) {
      const ageMs = Date.now() - new Date(profile.natal_chart_computed_at).getTime();
      const maxAgeMs = 24 * 60 * 60 * 1000;
      if (ageMs < maxAgeMs) {
        return new Response(
          JSON.stringify({ source: "cache", chart: profile.natal_chart_json }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!profile.birth_date) {
      return new Response(JSON.stringify({ error: "Missing birth_date" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse birth date
    const [y, m, d] = (profile.birth_date as string).split("-").map(Number);
    const body: any = { year: y, month: m, day: d };

    if (profile.birth_time) {
      const [h, mi] = (profile.birth_time as string).split(":").map(Number);
      body.hour = h + (mi || 0) / 60;
    }

    if (profile.birth_latitude != null) body.latitude = Number(profile.birth_latitude);
    if (profile.birth_longitude != null) body.longitude = Number(profile.birth_longitude);

    if (profile.first_name) {
      body.name = profile.first_name + (profile.last_name ? " " + profile.last_name : "");
    }

    // Call Engine /oracle-context (returns both numerology + natal chart)
    const ctxRes = await fetch(`${ENGINE_URL}/oracle-context`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!ctxRes.ok) {
      const errText = await ctxRes.text();
      return new Response(
        JSON.stringify({ error: "Engine unreachable", details: errText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const engineData = await ctxRes.json();

    // Persist to profile
    await sb
      .from("profiles")
      .update({
        natal_chart_json: engineData,
        natal_chart_computed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({ source: "fresh", chart: engineData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("get-natal-chart error:", e);
    return new Response(
      JSON.stringify({ error: "Internal error", details: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

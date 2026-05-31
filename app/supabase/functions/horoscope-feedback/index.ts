// horoscope-feedback : capture le retour « le ciel d'hier a-t-il résonné ? » cliqué
// depuis l'horoscope quotidien. ?t=<unsubscribe_token>&v=good|meh
// Loggue un event analytics + redirige vers l'horoscope (re-engagement). Public.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const SITE = "https://karmastro.com";

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("t") || "";
  const v = url.searchParams.get("v") === "good" ? "good" : "meh";
  if (!token) return new Response(null, { status: 302, headers: { Location: SITE } });

  let locale = "fr";
  try {
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: sub } = await sb
      .from("newsletter_subscribers")
      .select("locale")
      .eq("unsubscribe_token", token)
      .maybeSingle();
    if (sub?.locale) locale = sub.locale;
    // awaité : un insert fire-and-forget après la réponse peut être abandonné côté Edge.
    await sb.from("analytics_events").insert({
      session_id: "horoscope-followup",
      surface: "site",
      event_name: "horoscope_feedback",
      properties: { value: v, locale },
      path: "/horoscope/",
    });
  } catch { /* on redirige quand même */ }

  const path = locale === "fr" ? "/horoscope/" : `/${locale}/horoscope/`;
  return new Response(null, {
    status: 302,
    headers: { Location: `${SITE}${path}?merci=${v}` },
  });
});

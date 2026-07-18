// ame-soeur-generate : reçoit les infos du partenaire (depuis la page /ame-soeur token-gated),
// génère la lecture Âme Sœur (Séléné) via le moteur readings partagé, puis email le lien /lecture.
// Token = capacité d'accès (uuid v4 posé par stripe-webhook à l'achat). Aucune PII renvoyée.
//
// Secrets requis (déjà présents) : SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_API_KEY,
//   RESEND_API_KEY/RESEND_FROM_EMAIL (via send-email).
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { generateReading, buildFallbackReading } from "../_shared/reading-generator.ts";

// EdgeRuntime fourni par le runtime Supabase (background tasks).
declare const EdgeRuntime: { waitUntil(promise: Promise<unknown>): void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json", "cache-control": "no-store" },
  });
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "POST requis" }, 405);

  let payload: { token?: string; partnerName?: string; partnerBirthDate?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: "JSON invalide" }, 400);
  }

  const token = String(payload.token || "").trim();
  const partnerName = String(payload.partnerName || "").trim().slice(0, 120);
  const partnerBirthDate = String(payload.partnerBirthDate || "").trim().slice(0, 10);

  if (!token) return json({ error: "token requis" }, 400);
  if (!DATE_RE.test(partnerBirthDate)) {
    return json({ error: "date de naissance du partenaire invalide (format AAAA-MM-JJ)" }, 400);
  }
  // Garde-fou date réelle (mois 1-12, jour 1-31, pas dans le futur).
  const [py, pm, pd] = partnerBirthDate.split("-").map(Number);
  const now = new Date();
  const valid = pm >= 1 && pm <= 12 && pd >= 1 && pd <= 31 && py >= 1900 &&
    new Date(`${partnerBirthDate}T00:00:00Z`).getTime() <= now.getTime();
  if (!valid) return json({ error: "date de naissance du partenaire invalide" }, 400);

  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

  // 1. Charger la lecture liée au token (doit être une Âme Sœur en attente de partenaire).
  const { data: row } = await sb
    .from("readings")
    .select("token, email, tool_type, status, inputs_json, locale")
    .eq("token", token)
    .maybeSingle();

  if (!row) return json({ status: "not_found" }, 404);
  if (row.tool_type !== "ame-soeur") return json({ error: "token non éligible" }, 400);
  if (row.status === "ready") return json({ status: "ready" });
  if (row.status === "generating") return json({ status: "generating" });
  if (row.status !== "awaiting_partner") return json({ status: row.status });

  // 2. Claim atomique awaiting_partner -> generating (évite la double génération sur double-submit).
  const { data: claimed } = await sb
    .from("readings")
    .update({ status: "generating" })
    .eq("token", token).eq("status", "awaiting_partner")
    .select("token").maybeSingle();
  if (!claimed) return json({ status: "generating" });

  // 3. Fusionner les données du partenaire dans inputs_json.
  const base = (row.inputs_json || {}) as Record<string, unknown>;
  const inputs = {
    ...base,
    tool: "ame-soeur" as const,
    fullName: String(base.fullName || ""),
    birthDate: String(base.birthDate || ""),
    locale: String(base.locale || row.locale || "fr"),
    partnerName,
    partnerBirthDate,
  };

  // 4. Génération EN ARRIÈRE-PLAN : on répond TOUT DE SUITE (generating). Une lecture de
  //    ~1700 mots peut dépasser le temps d'attente d'une requête navigateur, donc /lecture
  //    poll get-reading jusqu'à ready (animation maintenue). Filet de secours si Gemini KO.
  const task = (async () => {
    let content: string;
    try {
      content = await generateReading(inputs);
    } catch (e) {
      console.error("Gemini KO, fallback ame-soeur:", String(e).slice(0, 200));
      content = buildFallbackReading(inputs);
    }
    await sb.from("readings")
      .update({ content, status: "ready", inputs_json: inputs })
      .eq("token", token);
    if (row.email) {
      fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ type: "reading", to: row.email, data: { token, locale: inputs.locale, guideName: "Séléné" } }),
      }).catch(() => {});
    }
  })();

  if (typeof EdgeRuntime !== "undefined" && EdgeRuntime?.waitUntil) {
    EdgeRuntime.waitUntil(task);
  } else {
    await task; // fallback local/test
  }

  return json({ status: "generating" });
});

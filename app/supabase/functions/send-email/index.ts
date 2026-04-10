import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  welcomeEmail,
  paymentSuccessEmail,
  badgeUnlockedEmail,
  filleulArrivedEmail,
  firstOracleEmail,
} from "../_shared/email-templates.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Karmastro <contact@karmastro.com>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

type TemplateType =
  | "welcome"
  | "payment_success"
  | "badge_unlocked"
  | "filleul_arrived"
  | "first_oracle";

async function sendViaResend(to: string, subject: string, html: string, text: string): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("RESEND_API_KEY not set, email not sent to", to);
    return;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error ${res.status}: ${err}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { type, to, data } = await req.json() as {
      type: TemplateType;
      to: string;
      data?: Record<string, any>;
    };

    if (!to || !type) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'type'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let template;
    switch (type) {
      case "welcome":
        template = welcomeEmail(data?.firstName ?? null, data?.referrerName ?? null);
        break;
      case "payment_success":
        template = paymentSuccessEmail(
          data?.firstName ?? null,
          data?.productName ?? "Karmastro",
          data?.amount ?? "",
          Boolean(data?.isSubscription),
          data?.credits
        );
        break;
      case "badge_unlocked":
        template = badgeUnlockedEmail(
          data?.firstName ?? null,
          data?.badgeName ?? "",
          data?.badgeIcon ?? "✦",
          data?.filleulsCount ?? 0
        );
        break;
      case "filleul_arrived":
        template = filleulArrivedEmail(data?.firstName ?? null, data?.filleulName ?? null);
        break;
      case "first_oracle":
        template = firstOracleEmail(data?.firstName ?? null, data?.guideName ?? "Sibylle");
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown template type: ${type}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    // Log the email attempt to DB for audit trail (non-blocking)
    if (SERVICE_KEY) {
      try {
        const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
        await sb.from("email_log").insert({
          recipient: to,
          type,
          subject: template.subject,
          status: RESEND_API_KEY ? "pending" : "skipped_no_key",
        });
      } catch (logErr) {
        console.warn("Failed to log email:", logErr);
      }
    }

    // Send
    if (!RESEND_API_KEY) {
      console.warn(`[send-email] RESEND_API_KEY not configured, would send "${type}" to ${to}`);
      return new Response(JSON.stringify({
        status: "skipped",
        reason: "RESEND_API_KEY not configured",
        preview: { subject: template.subject },
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await sendViaResend(to, template.subject, template.html, template.text);

    return new Response(JSON.stringify({ status: "sent", subject: template.subject }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("send-email error:", e);
    return new Response(JSON.stringify({ error: e.message || "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

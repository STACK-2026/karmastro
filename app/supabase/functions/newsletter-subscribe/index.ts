// Newsletter subscribe edge function
// - Calls newsletter_subscribe RPC (creates or reactivates subscriber)
// - Sends double opt-in email via Resend
// - Returns success/error

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "https://nkjbmbdrvejemzrggxvr.supabase.co";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = "Karmastro <noreply@karmastro.com>";
const SITE_URL = "https://karmastro.com";

// Minimal i18n for the confirmation email subject + body
const MESSAGES: Record<string, { subject: string; preview: string; title: string; body: string; cta: string; footer: string }> = {
  fr: {
    subject: "✦ Confirme ton abonnement à Karmastro",
    preview: "Un dernier clic pour recevoir ton horoscope quotidien",
    title: "Bienvenue parmi les voyageurs cosmiques",
    body: "Les astres sont ravis de ta présence. Clique ci-dessous pour confirmer ton abonnement et recevoir ton horoscope quotidien, calculé avec Swiss Ephemeris (précision 0,001 seconde d'arc).",
    cta: "Confirmer mon abonnement",
    footer: "Si tu n'as pas demandé cet abonnement, ignore simplement cet email. Karmastro respecte ton parcours.",
  },
  en: {
    subject: "✦ Confirm your Karmastro subscription",
    preview: "One last click to receive your daily horoscope",
    title: "Welcome among the cosmic travelers",
    body: "The stars are delighted by your presence. Click below to confirm your subscription and receive your daily horoscope, calculated with Swiss Ephemeris (0.001 arcsecond precision).",
    cta: "Confirm my subscription",
    footer: "If you didn't request this subscription, simply ignore this email. Karmastro respects your journey.",
  },
  es: {
    subject: "✦ Confirma tu suscripción a Karmastro",
    preview: "Un último clic para recibir tu horóscopo diario",
    title: "Bienvenida entre los viajeros cósmicos",
    body: "Los astros están encantados con tu presencia. Haz clic abajo para confirmar tu suscripción y recibir tu horóscopo diario, calculado con Swiss Ephemeris (precisión de 0.001 segundos de arco).",
    cta: "Confirmar mi suscripción",
    footer: "Si no solicitaste esta suscripción, simplemente ignora este correo. Karmastro respeta tu camino.",
  },
  pt: {
    subject: "✦ Confirma a tua subscrição ao Karmastro",
    preview: "Um último clique para receberes o teu horóscopo diário",
    title: "Bem-vinda entre os viajantes cósmicos",
    body: "Os astros estão encantados com a tua presença. Clica abaixo para confirmar a tua subscrição e receber o teu horóscopo diário, calculado com Swiss Ephemeris (precisão de 0,001 segundos de arco).",
    cta: "Confirmar a minha subscrição",
    footer: "Se não pediste esta subscrição, ignora simplesmente este email. O Karmastro respeita o teu caminho.",
  },
  de: {
    subject: "✦ Bestätige dein Karmastro-Abonnement",
    preview: "Ein letzter Klick, um dein tägliches Horoskop zu erhalten",
    title: "Willkommen unter den kosmischen Reisenden",
    body: "Die Sterne freuen sich über deine Anwesenheit. Klicke unten, um dein Abonnement zu bestätigen und dein tägliches Horoskop zu erhalten, berechnet mit Swiss Ephemeris (Präzision 0,001 Bogensekunden).",
    cta: "Mein Abonnement bestätigen",
    footer: "Wenn du dieses Abonnement nicht angefordert hast, ignoriere einfach diese E-Mail. Karmastro respektiert deinen Weg.",
  },
  it: {
    subject: "✦ Conferma la tua iscrizione a Karmastro",
    preview: "Un ultimo clic per ricevere il tuo oroscopo quotidiano",
    title: "Benvenuta tra i viaggiatori cosmici",
    body: "Gli astri sono felici della tua presenza. Clicca qui sotto per confermare la tua iscrizione e ricevere il tuo oroscopo quotidiano, calcolato con Swiss Ephemeris (precisione di 0,001 secondi d'arco).",
    cta: "Conferma la mia iscrizione",
    footer: "Se non hai richiesto questa iscrizione, ignora semplicemente questa email. Karmastro rispetta il tuo cammino.",
  },
  tr: {
    subject: "✦ Karmastro aboneliğini onayla",
    preview: "Günlük burcunu almak için son bir tıklama",
    title: "Kozmik yolculara hoş geldin",
    body: "Yıldızlar varlığından çok mutlu. Aboneliğini onaylamak ve Swiss Ephemeris (0.001 ark saniye hassasiyeti) ile hesaplanan günlük burcunu almak için aşağıya tıkla.",
    cta: "Aboneliğimi onayla",
    footer: "Bu aboneliği talep etmediysen, bu e-postayı yoksay. Karmastro yolculuğuna saygı duyar.",
  },
  pl: {
    subject: "✦ Potwierdź swoją subskrypcję Karmastro",
    preview: "Ostatnie kliknięcie, by otrzymać codzienny horoskop",
    title: "Witamy wśród kosmicznych podróżników",
    body: "Gwiazdy cieszą się z twojej obecności. Kliknij poniżej, aby potwierdzić subskrypcję i otrzymywać codzienny horoskop obliczony z dokładnością do 0,001 sekundy kątowej przez Swiss Ephemeris.",
    cta: "Potwierdź subskrypcję",
    footer: "Jeśli nie prosiłeś o tę subskrypcję, po prostu zignoruj tę wiadomość. Karmastro szanuje twoją drogę.",
  },
  ru: {
    subject: "✦ Подтверди подписку на Karmastro",
    preview: "Последний клик, чтобы получать ежедневный гороскоп",
    title: "Добро пожаловать в число космических путешественников",
    body: "Звёзды рады твоему присутствию. Нажми ниже, чтобы подтвердить подписку и получать ежедневный гороскоп, рассчитанный с точностью 0,001 угловой секунды через Swiss Ephemeris.",
    cta: "Подтвердить подписку",
    footer: "Если ты не запрашивал эту подписку, просто проигнорируй это письмо. Karmastro уважает твой путь.",
  },
  ja: {
    subject: "✦ Karmastro購読を確認",
    preview: "毎日のホロスコープを受け取るための最後のクリック",
    title: "コズミック旅人の仲間入り",
    body: "星々があなたの存在を喜んでいます。下のボタンをクリックして購読を確認し、Swiss Ephemeris（精度0.001秒角）で計算された毎日のホロスコープを受け取ってください。",
    cta: "購読を確認する",
    footer: "この購読をリクエストしていない場合は、このメールを無視してください。Karmastroはあなたの旅路を尊重します。",
  },
  ar: {
    subject: "✦ أكد اشتراكك في Karmastro",
    preview: "نقرة أخيرة لتلقي برجك اليومي",
    title: "مرحباً بك بين المسافرين الكونيين",
    body: "النجوم سعيدة بحضورك. انقر أدناه لتأكيد اشتراكك وتلقي برجك اليومي، المحسوب بدقة 0.001 ثانية قوسية عبر Swiss Ephemeris.",
    cta: "تأكيد اشتراكي",
    footer: "إذا لم تطلب هذا الاشتراك، ببساطة تجاهل هذا البريد الإلكتروني. Karmastro يحترم رحلتك.",
  },
};

function htmlEmail(locale: string, confirmUrl: string, unsubUrl: string): string {
  const m = MESSAGES[locale] || MESSAGES.fr;
  const dir = locale === "ar" ? "rtl" : "ltr";
  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${m.subject}</title>
</head>
<body style="margin:0;padding:0;background:#0f0a1e;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#e5e7eb;">
<div style="display:none;max-height:0;overflow:hidden;">${m.preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0a1e;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#1a0f2e 0%,#0f0a1e 100%);border:1px solid rgba(212,160,23,0.25);border-radius:16px;overflow:hidden;">
<tr><td style="padding:48px 40px 24px;text-align:center;">
<p style="margin:0;font-size:48px;">✦</p>
<h1 style="margin:16px 0 8px;font-family:Outfit,sans-serif;font-size:28px;color:#ffffff;font-weight:600;">${m.title}</h1>
</td></tr>
<tr><td style="padding:0 40px 32px;">
<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.75);">${m.body}</p>
<div style="text-align:center;margin:32px 0;">
<a href="${confirmUrl}" style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#a78bfa 0%,#fbbf24 100%);color:#0f0a1e;text-decoration:none;border-radius:12px;font-weight:600;font-size:15px;">${m.cta}</a>
</div>
<p style="margin:24px 0 0;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;text-align:center;">${m.footer}</p>
</td></tr>
<tr><td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
<p style="margin:0;font-size:10px;color:rgba(196,184,219,0.4);">
« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin<br/>
<a href="${unsubUrl}" style="color:rgba(196,184,219,0.5);text-decoration:underline;">Unsubscribe</a> ·
<a href="${SITE_URL}" style="color:rgba(196,184,219,0.5);text-decoration:none;">karmastro.com</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { email, locale = "fr", sign_slug = null, source = null, utm_source = null, utm_medium = null, utm_campaign = null } = body;

    if (!email || typeof email !== "string") {
      return new Response(JSON.stringify({ error: "email_required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

    // Call RPC
    const { data, error } = await sb.rpc("newsletter_subscribe", {
      p_email: email,
      p_locale: locale,
      p_sign_slug: sign_slug,
      p_source: source,
      p_utm_source: utm_source,
      p_utm_medium: utm_medium,
      p_utm_campaign: utm_campaign,
    });

    if (error) {
      console.error("RPC error:", error);
      return new Response(JSON.stringify({ error: "rpc_failed", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data.success) {
      return new Response(JSON.stringify(data), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unsubscribe token (always present)
    const { data: subscriber } = await sb
      .from("newsletter_subscribers")
      .select("unsubscribe_token")
      .eq("email", email.toLowerCase())
      .single();

    // Only send email if we have a confirmation token (new or reactivated)
    if (data.token && RESEND_API_KEY && subscriber) {
      const confirmUrl = `${SITE_URL}/newsletter/confirm?token=${data.token}`;
      const unsubUrl = `${SITE_URL}/newsletter/unsubscribe?token=${subscriber.unsubscribe_token}`;
      const m = MESSAGES[locale] || MESSAGES.fr;

      const resendResp = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [email],
          subject: m.subject,
          html: htmlEmail(locale, confirmUrl, unsubUrl),
        }),
      });

      if (!resendResp.ok) {
        console.error("Resend error:", await resendResp.text());
      }
    }

    return new Response(
      JSON.stringify({ success: true, status: data.status }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Handler error:", e);
    return new Response(JSON.stringify({ error: "internal", details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

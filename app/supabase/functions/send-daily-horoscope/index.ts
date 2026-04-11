// Send daily horoscope to confirmed newsletter subscribers.
// Triggered by pg_cron at 07:00 Paris time.
// For each confirmed subscriber: fetch today's horoscope JSON (their locale with FR fallback),
// render email in their language, send via Resend, mark last_sent_at.

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

// Sign slug → localized display name (FR base + translations where needed).
// Keep FR for slug but display localized in emails.
const SIGN_NAMES: Record<string, Record<string, string>> = {
  belier: { fr: "Bélier", en: "Aries", es: "Aries", pt: "Carneiro", de: "Widder", it: "Ariete", tr: "Koç", pl: "Baran", ru: "Овен", ja: "牡羊座", ar: "الحمل" },
  taureau: { fr: "Taureau", en: "Taurus", es: "Tauro", pt: "Touro", de: "Stier", it: "Toro", tr: "Boğa", pl: "Byk", ru: "Телец", ja: "牡牛座", ar: "الثور" },
  gemeaux: { fr: "Gémeaux", en: "Gemini", es: "Géminis", pt: "Gémeos", de: "Zwillinge", it: "Gemelli", tr: "İkizler", pl: "Bliźnięta", ru: "Близнецы", ja: "双子座", ar: "الجوزاء" },
  cancer: { fr: "Cancer", en: "Cancer", es: "Cáncer", pt: "Caranguejo", de: "Krebs", it: "Cancro", tr: "Yengeç", pl: "Rak", ru: "Рак", ja: "蟹座", ar: "السرطان" },
  lion: { fr: "Lion", en: "Leo", es: "Leo", pt: "Leão", de: "Löwe", it: "Leone", tr: "Aslan", pl: "Lew", ru: "Лев", ja: "獅子座", ar: "الأسد" },
  vierge: { fr: "Vierge", en: "Virgo", es: "Virgo", pt: "Virgem", de: "Jungfrau", it: "Vergine", tr: "Başak", pl: "Panna", ru: "Дева", ja: "乙女座", ar: "العذراء" },
  balance: { fr: "Balance", en: "Libra", es: "Libra", pt: "Balança", de: "Waage", it: "Bilancia", tr: "Terazi", pl: "Waga", ru: "Весы", ja: "天秤座", ar: "الميزان" },
  scorpion: { fr: "Scorpion", en: "Scorpio", es: "Escorpio", pt: "Escorpião", de: "Skorpion", it: "Scorpione", tr: "Akrep", pl: "Skorpion", ru: "Скорпион", ja: "蠍座", ar: "العقرب" },
  sagittaire: { fr: "Sagittaire", en: "Sagittarius", es: "Sagitario", pt: "Sagitário", de: "Schütze", it: "Sagittario", tr: "Yay", pl: "Strzelec", ru: "Стрелец", ja: "射手座", ar: "القوس" },
  capricorne: { fr: "Capricorne", en: "Capricorn", es: "Capricornio", pt: "Capricórnio", de: "Steinbock", it: "Capricorno", tr: "Oğlak", pl: "Koziorożec", ru: "Козерог", ja: "山羊座", ar: "الجدي" },
  verseau: { fr: "Verseau", en: "Aquarius", es: "Acuario", pt: "Aquário", de: "Wassermann", it: "Acquario", tr: "Kova", pl: "Wodnik", ru: "Водолей", ja: "水瓶座", ar: "الدلو" },
  poissons: { fr: "Poissons", en: "Pisces", es: "Piscis", pt: "Peixes", de: "Fische", it: "Pesci", tr: "Balık", pl: "Ryby", ru: "Рыбы", ja: "魚座", ar: "الحوت" },
};

// Localized email subject + intro + CTA
type Copy = {
  subject: (sign: string) => string;
  preview: string;
  greeting: string;
  ctaMore: string;
  ctaApp: string;
  unsubLabel: string;
  footer: string;
};

const COPY: Record<string, Copy> = {
  fr: {
    subject: (sign) => `✦ ${sign} · ton horoscope du jour`,
    preview: "Les astres t'ont écrit un message ce matin",
    greeting: "Voici ta lecture cosmique du jour, calculée avec Swiss Ephemeris et écrite par Sibylle.",
    ctaMore: "Lire l'horoscope complet",
    ctaApp: "Ouvrir l'Oracle",
    unsubLabel: "Se désabonner",
    footer: "Karmastro, astrologie sérieuse, précision NASA JPL",
  },
  en: {
    subject: (sign) => `✦ ${sign} · your daily horoscope`,
    preview: "The stars wrote you a message this morning",
    greeting: "Here is your cosmic reading for today, calculated with Swiss Ephemeris and written by Sibylle.",
    ctaMore: "Read the full horoscope",
    ctaApp: "Open the Oracle",
    unsubLabel: "Unsubscribe",
    footer: "Karmastro, serious astrology, NASA JPL precision",
  },
  es: {
    subject: (sign) => `✦ ${sign} · tu horóscopo de hoy`,
    preview: "Los astros te escribieron un mensaje esta mañana",
    greeting: "Aquí está tu lectura cósmica del día, calculada con Swiss Ephemeris y escrita por Sibylle.",
    ctaMore: "Leer el horóscopo completo",
    ctaApp: "Abrir el Oráculo",
    unsubLabel: "Darse de baja",
    footer: "Karmastro, astrología seria, precisión NASA JPL",
  },
  pt: {
    subject: (sign) => `✦ ${sign} · o teu horóscopo do dia`,
    preview: "Os astros escreveram-te uma mensagem esta manhã",
    greeting: "Aqui está a tua leitura cósmica do dia, calculada com Swiss Ephemeris e escrita por Sibylle.",
    ctaMore: "Ler o horóscopo completo",
    ctaApp: "Abrir o Oráculo",
    unsubLabel: "Cancelar subscrição",
    footer: "Karmastro, astrologia séria, precisão NASA JPL",
  },
  de: {
    subject: (sign) => `✦ ${sign} · dein Tageshoroskop`,
    preview: "Die Sterne haben dir heute Morgen eine Nachricht geschrieben",
    greeting: "Hier ist deine kosmische Lektüre für heute, berechnet mit Swiss Ephemeris und geschrieben von Sibylle.",
    ctaMore: "Das ganze Horoskop lesen",
    ctaApp: "Das Orakel öffnen",
    unsubLabel: "Abbestellen",
    footer: "Karmastro, seriöse Astrologie, NASA JPL Präzision",
  },
  it: {
    subject: (sign) => `✦ ${sign} · il tuo oroscopo del giorno`,
    preview: "Gli astri ti hanno scritto un messaggio stamattina",
    greeting: "Ecco la tua lettura cosmica del giorno, calcolata con Swiss Ephemeris e scritta da Sibylle.",
    ctaMore: "Leggi l'oroscopo completo",
    ctaApp: "Apri l'Oracolo",
    unsubLabel: "Annulla iscrizione",
    footer: "Karmastro, astrologia seria, precisione NASA JPL",
  },
  tr: {
    subject: (sign) => `✦ ${sign} · bugünkü burcun`,
    preview: "Yıldızlar bu sabah sana bir mesaj yazdı",
    greeting: "İşte Swiss Ephemeris ile hesaplanan ve Sibylle tarafından yazılan bugünkü kozmik okuman.",
    ctaMore: "Tam burcu oku",
    ctaApp: "Kahin'i aç",
    unsubLabel: "Abonelikten çık",
    footer: "Karmastro, ciddi astroloji, NASA JPL hassasiyeti",
  },
  pl: {
    subject: (sign) => `✦ ${sign} · twój dzisiejszy horoskop`,
    preview: "Gwiazdy napisały ci dziś rano wiadomość",
    greeting: "Oto twój kosmiczny odczyt na dziś, obliczony przez Swiss Ephemeris i napisany przez Sibylle.",
    ctaMore: "Czytaj pełny horoskop",
    ctaApp: "Otwórz Wyrocznię",
    unsubLabel: "Wypisz się",
    footer: "Karmastro, poważna astrologia, precyzja NASA JPL",
  },
  ru: {
    subject: (sign) => `✦ ${sign} · твой гороскоп на сегодня`,
    preview: "Звёзды написали тебе сообщение сегодня утром",
    greeting: "Вот твоё космическое чтение на сегодня, рассчитанное Swiss Ephemeris и написанное Сивиллой.",
    ctaMore: "Читать полный гороскоп",
    ctaApp: "Открыть Оракула",
    unsubLabel: "Отписаться",
    footer: "Karmastro · серьёзная астрология, точность NASA JPL",
  },
  ja: {
    subject: (sign) => `✦ ${sign} · 今日のホロスコープ`,
    preview: "星々が今朝、あなたにメッセージを書きました",
    greeting: "Swiss Ephemerisで計算され、Sibylleによって書かれた今日のコズミック・リーディングです。",
    ctaMore: "ホロスコープ全文を読む",
    ctaApp: "オラクルを開く",
    unsubLabel: "配信停止",
    footer: "Karmastro · 本格占星術、NASA JPL精度",
  },
  ar: {
    subject: (sign) => `✦ ${sign} · برجك اليومي`,
    preview: "كتبت لك النجوم رسالة هذا الصباح",
    greeting: "إليك قراءتك الكونية لهذا اليوم، المحسوبة بواسطة Swiss Ephemeris والمكتوبة بواسطة Sibylle.",
    ctaMore: "اقرأ البرج كاملاً",
    ctaApp: "افتح العرّاف",
    unsubLabel: "إلغاء الاشتراك",
    footer: "Karmastro · علم فلك جاد، دقة NASA JPL",
  },
};

function parisDate(): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function htmlEmail(params: {
  locale: string;
  signSlug: string;
  signName: string;
  entry: { intro?: string; mantra?: string; luckyNumber?: number | string; color?: string; moonPhase?: string };
  unsubUrl: string;
  articleUrl: string;
}): string {
  const { locale, signName, entry, unsubUrl, articleUrl } = params;
  const c = COPY[locale] || COPY.fr;
  const dir = locale === "ar" ? "rtl" : "ltr";
  const intro = entry.intro || "";
  const mantra = entry.mantra || "";
  const lucky = entry.luckyNumber != null ? String(entry.luckyNumber) : "";
  const color = entry.color || "";
  const moon = entry.moonPhase || "";

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${signName} · ${parisDate()}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f0a1e;background-image:url('${SITE_URL}/email/starfield.svg');background-repeat:repeat-y;background-position:top center;background-size:560px auto;font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#e5e7eb;">
<div style="display:none;max-height:0;overflow:hidden;">${c.preview}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:transparent;">
<tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:rgba(15,10,30,0.85);background-image:linear-gradient(180deg,rgba(26,15,46,0.9) 0%,rgba(15,10,30,0.92) 100%);border:1px solid rgba(212,160,23,0.25);border-radius:16px;overflow:hidden;backdrop-filter:blur(8px);">
<tr><td style="padding:40px 40px 16px;text-align:center;">
<p style="margin:0 0 4px;font-size:10px;color:rgba(251,191,36,0.4);letter-spacing:6px;">✦ ✧ · ✦ · ✧ ✦</p>
<p style="margin:8px 0 0;font-size:42px;">✦</p>
<h1 style="margin:12px 0 4px;font-family:Outfit,Georgia,serif;font-size:26px;color:#fbbf24;font-weight:600;">${signName}</h1>
<p style="margin:0;font-size:12px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:1.5px;">${parisDate()}</p>
<p style="margin:4px 0 0;font-size:10px;color:rgba(251,191,36,0.4);letter-spacing:6px;">✧ · ✦ ✧ · ✦ ·</p>
</td></tr>
<tr><td style="padding:8px 40px 24px;">
<p style="margin:0 0 16px;font-size:13px;color:rgba(255,255,255,0.6);line-height:1.6;font-style:italic;">${c.greeting}</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.75;color:rgba(255,255,255,0.85);">${intro}</p>
${mantra ? `<div style="margin:20px 0;padding:16px 20px;border-left:2px solid #fbbf24;background:rgba(251,191,36,0.05);"><p style="margin:0;font-size:13px;color:#fbbf24;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Mantra</p><p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.8);font-style:italic;">${mantra}</p></div>` : ""}
${(lucky || color || moon) ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;"><tr>${lucky ? `<td align="center" style="padding:10px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;width:33%;"><p style="margin:0;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">★</p><p style="margin:4px 0 0;font-size:14px;color:#fbbf24;font-weight:600;">${lucky}</p></td>` : ""}${color ? `<td align="center" style="padding:10px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;width:33%;"><p style="margin:0;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">◐</p><p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${color}</p></td>` : ""}${moon ? `<td align="center" style="padding:10px;border:1px solid rgba(255,255,255,0.08);border-radius:10px;width:33%;"><p style="margin:0;font-size:10px;color:rgba(255,255,255,0.4);text-transform:uppercase;letter-spacing:1px;">☾</p><p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,0.8);">${moon}</p></td>` : ""}</tr></table>` : ""}
<div style="text-align:center;margin:24px 0 8px;">
<a href="${articleUrl}" style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#a78bfa 0%,#fbbf24 100%);color:#0f0a1e;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">${c.ctaMore}</a>
</div>
</td></tr>
<tr><td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
<p style="margin:0 0 6px;font-size:10px;color:rgba(196,184,219,0.35);">${c.footer}</p>
<p style="margin:0;font-size:10px;color:rgba(196,184,219,0.35);">
<a href="${unsubUrl}" style="color:rgba(196,184,219,0.45);text-decoration:underline;">${c.unsubLabel}</a>
&middot;
<a href="${SITE_URL}" style="color:rgba(196,184,219,0.45);text-decoration:none;">karmastro.com</a>
</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

async function fetchTodayHoroscope(date: string): Promise<Record<string, Record<string, unknown>>> {
  const url = `${SITE_URL}/api/horoscope/${date}.json`;
  const resp = await fetch(url, { cache: "no-store" });
  if (!resp.ok) throw new Error(`horoscope_fetch_failed_${resp.status}`);
  return await resp.json();
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
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const override = (body && typeof body === "object" ? (body as Record<string, unknown>) : {}) as Record<string, unknown>;
    const dryRun = override.dry_run === true;
    const forceDate = typeof override.date === "string" ? (override.date as string) : null;

    const today = forceDate || parisDate();
    const horoscope = await fetchTodayHoroscope(today);

    // Pull all confirmed, non-unsubscribed subscribers
    const { data: subs, error } = await sb
      .from("newsletter_subscribers")
      .select("id, email, locale, sign_slug, unsubscribe_token")
      .eq("confirmed", true)
      .eq("unsubscribed", false);

    if (error) {
      return new Response(JSON.stringify({ error: "db_error", details: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary = { total: subs?.length || 0, sent: 0, skipped: 0, failed: 0, dryRun, date: today };
    if (!subs || subs.length === 0) {
      return new Response(JSON.stringify(summary), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    for (const sub of subs) {
      try {
        // Locale with FR fallback
        const localeData = (horoscope[sub.locale] || horoscope.fr) as Record<string, unknown> | undefined;
        if (!localeData) {
          summary.skipped++;
          continue;
        }

        // Rotate sign: if user picked a sign, use it. Else send all 12? Too much.
        // Policy: if sign_slug set, use it. Else default to belier and log.
        const signSlug = sub.sign_slug || "belier";
        const entry = localeData[signSlug] as Record<string, unknown> | undefined;
        if (!entry) {
          summary.skipped++;
          continue;
        }

        const signName = SIGN_NAMES[signSlug]?.[sub.locale] || SIGN_NAMES[signSlug]?.fr || signSlug;
        const unsubUrl = `${SITE_URL}/newsletter/unsubscribe?token=${sub.unsubscribe_token}`;
        const articleUrl = `${SITE_URL}${sub.locale === "fr" ? "" : "/" + sub.locale}/horoscope/${signSlug}`;
        const c = COPY[sub.locale] || COPY.fr;

        if (dryRun) {
          summary.sent++;
          continue;
        }

        if (!RESEND_API_KEY) {
          summary.skipped++;
          continue;
        }

        const html = htmlEmail({
          locale: sub.locale,
          signSlug,
          signName,
          entry: entry as never,
          unsubUrl,
          articleUrl,
        });

        const resendResp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [sub.email],
            subject: c.subject(signName),
            html,
            headers: {
              "List-Unsubscribe": `<${unsubUrl}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          }),
        });

        if (!resendResp.ok) {
          console.error("resend_failed", sub.email, await resendResp.text());
          summary.failed++;
          continue;
        }

        // Mark as sent (last_sent_at only, send_count incremented via RPC below)
        await sb
          .from("newsletter_subscribers")
          .update({ last_sent_at: new Date().toISOString() })
          .eq("id", sub.id);

        summary.sent++;
      } catch (err) {
        console.error("send_exception", sub.email, err);
        summary.failed++;
      }
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("handler_error", e);
    return new Response(JSON.stringify({ error: "internal", details: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

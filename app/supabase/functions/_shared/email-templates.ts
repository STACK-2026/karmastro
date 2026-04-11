// Karmastro email templates - HTML + plain text versions
// Every template returns { subject, html, text }

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

// ============================================================
// Shared branding (inline CSS, email-safe)
// ============================================================

const BRAND_COLORS = {
  bg: "#0f0a1e",
  surface: "#1a1330",
  primary: "#8B5CF6",
  gold: "#D4A017",
  text: "#E5E7EB",
  muted: "#9CA3AF",
  border: "rgba(255,255,255,0.1)",
};

function wrapHtml(title: string, content: string, ctaText?: string, ctaUrl?: string): string {
  const cta = ctaText && ctaUrl
    ? `<tr><td align="center" style="padding:24px 0 8px;">
        <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,${BRAND_COLORS.primary},${BRAND_COLORS.gold});color:#0f0a1e;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">${ctaText}</a>
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_COLORS.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND_COLORS.text};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND_COLORS.bg};padding:40px 20px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:${BRAND_COLORS.surface};border-radius:16px;border:1px solid ${BRAND_COLORS.border};overflow:hidden;">

<!-- Header -->
<tr><td align="center" style="padding:32px 24px 16px;border-bottom:1px solid ${BRAND_COLORS.border};">
<div style="display:inline-block;">
<span style="display:inline-block;width:32px;height:32px;background:${BRAND_COLORS.primary};border-radius:10px;vertical-align:middle;text-align:center;line-height:32px;color:#fff;font-weight:bold;font-family:Georgia,serif;">K</span>
<span style="font-size:22px;font-weight:bold;color:#fff;vertical-align:middle;margin-left:10px;letter-spacing:-0.5px;">Karmastro</span>
</div>
</td></tr>

<!-- Body -->
<tr><td style="padding:32px 32px 24px;color:${BRAND_COLORS.text};font-size:15px;line-height:1.6;">
${content}
</td></tr>

${cta}

<!-- Footer -->
<tr><td align="center" style="padding:24px;border-top:1px solid ${BRAND_COLORS.border};color:${BRAND_COLORS.muted};font-size:12px;">
<p style="margin:0 0 8px;">« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin</p>
<p style="margin:0 0 4px;"><a href="https://karmastro.com" style="color:${BRAND_COLORS.gold};text-decoration:none;">karmastro.com</a> · <a href="https://app.karmastro.com" style="color:${BRAND_COLORS.gold};text-decoration:none;">app.karmastro.com</a></p>
<p style="margin:0;">Karmastro SAS · contact@karmastro.com</p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

// ============================================================
// 1. Welcome email (after signup)
// ============================================================

export function welcomeEmail(firstName: string | null, referrerName?: string | null): EmailTemplate {
  const name = firstName || "cher voyageur";
  const referrerLine = referrerName
    ? `<p>Tu arrives avec <strong>${referrerName}</strong> qui t'a invité(e). Merci de faire confiance à ton constellation proche.</p>`
    : "";

  const html = wrapHtml(
    "Bienvenue sur Karmastro",
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:28px;margin:0 0 16px;">Bienvenue, ${name}.</h1>
<p>Les étoiles t'attendaient. Karmastro croise astrologie, numérologie et guidance karmique pour te proposer une lecture de toi qui va plus loin qu'un horoscope générique.</p>
${referrerLine}
<p>Voici ce que tu peux faire dès maintenant :</p>
<ul style="padding-left:20px;color:#E5E7EB;">
<li><strong>Découvrir ton thème natal</strong> complet (10 planètes, 12 maisons, aspects)</li>
<li><strong>Poser une question à l'Oracle</strong> - tu as le choix entre 4 guides : Sibylle, Orion, Séléné ou Pythia</li>
<li><strong>Calculer ton chemin de vie</strong> et tes autres nombres numérologiques</li>
</ul>
<p>Tu as droit à 3 consultations gratuites par jour avec l'Oracle. C'est parti.</p>
    `,
    "Découvrir mon profil cosmique",
    "https://app.karmastro.com/dashboard"
  );

  const text = `Bienvenue sur Karmastro, ${name}.

Les étoiles t'attendaient. Karmastro croise astrologie, numérologie et guidance karmique pour une lecture qui va plus loin qu'un horoscope générique.

${referrerName ? `Tu arrives avec ${referrerName} qui t'a invité(e).\n\n` : ""}Voici ce que tu peux faire dès maintenant :
- Découvrir ton thème natal complet
- Poser une question à l'Oracle (4 guides au choix : Sibylle, Orion, Séléné, Pythia)
- Calculer ton chemin de vie

Tu as 3 consultations gratuites par jour avec l'Oracle.

Ton profil : https://app.karmastro.com/dashboard

« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin

Karmastro, contact@karmastro.com
`;

  return {
    subject: `Bienvenue sur Karmastro, ${name} ✦`,
    html,
    text,
  };
}

// ============================================================
// 2. Payment success (after Stripe checkout)
// ============================================================

export function paymentSuccessEmail(
  firstName: string | null,
  productName: string,
  amount: string,
  isSubscription: boolean,
  credits?: number
): EmailTemplate {
  const name = firstName || "cher voyageur";
  const detail = credits
    ? `<p><strong>${credits} crédits cosmiques</strong> viennent d'être ajoutés à ton compte. Ils ne s'expirent jamais.</p>`
    : isSubscription
      ? `<p>Ton abonnement <strong>${productName}</strong> est actif. Tu bénéficies maintenant de l'Oracle illimité, des compatibilités illimitées et du calendrier cosmique détaillé.</p>`
      : `<p>Ton achat <strong>${productName}</strong> est confirmé.</p>`;

  const html = wrapHtml(
    "Paiement confirmé",
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Paiement confirmé ✦</h1>
<p>Merci ${name}. Ta transaction de <strong>${amount}</strong> a bien été enregistrée.</p>
${detail}
<p style="color:#9CA3AF;font-size:13px;margin-top:24px;">Tu peux consulter ton historique et gérer ton abonnement directement depuis ton profil.</p>
    `,
    "Accéder à mon profil",
    "https://app.karmastro.com/profile"
  );

  const text = `Paiement confirmé ✦

Merci ${name}. Ta transaction de ${amount} pour ${productName} a bien été enregistrée.

${credits ? `${credits} crédits cosmiques ont été ajoutés à ton compte. Ils n'expirent jamais.` : ""}${isSubscription ? `Ton abonnement est actif : Oracle illimité, compatibilités illimitées, calendrier cosmique détaillé.` : ""}

Ton profil : https://app.karmastro.com/profile

« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin
`;

  return {
    subject: `Paiement confirmé ✦ ${productName}`,
    html,
    text,
  };
}

// ============================================================
// 3. Badge unlocked (referral)
// ============================================================

export function badgeUnlockedEmail(firstName: string | null, badgeName: string, badgeIcon: string, filleulsCount: number): EmailTemplate {
  const name = firstName || "Éclaireur";
  const html = wrapHtml(
    `Badge débloqué : ${badgeName}`,
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">${badgeIcon} ${badgeName}</h1>
<p>Félicitations ${name}. Tu viens de débloquer le badge <strong>${badgeName}</strong> grâce à tes <strong>${filleulsCount} filleuls validés</strong>.</p>
<p>Ce badge apparaît désormais sur ton profil et dans le <a href="https://karmastro.com/hall-des-constellations" style="color:#D4A017;">Hall des Constellations</a>. Ta constellation grandit.</p>
<p>Continue de partager - chaque étoile compte dans la carte que nous construisons ensemble.</p>
    `,
    "Voir mon profil",
    "https://app.karmastro.com/profile"
  );

  const text = `${badgeIcon} Badge débloqué : ${badgeName}

Félicitations ${name}. Tu viens de débloquer le badge ${badgeName} grâce à tes ${filleulsCount} filleuls validés.

Ce badge apparaît sur ton profil et dans le Hall des Constellations.
https://karmastro.com/hall-des-constellations

« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin
`;

  return {
    subject: `${badgeIcon} Tu as débloqué : ${badgeName}`,
    html,
    text,
  };
}

// ============================================================
// 4. Filleul arrived (parrain notification)
// ============================================================

export function filleulArrivedEmail(firstName: string | null, filleulName: string | null): EmailTemplate {
  const name = firstName || "Éclaireur";
  const filleul = filleulName || "Une nouvelle étoile";
  const html = wrapHtml(
    "Un nouveau filleul a rejoint ta constellation",
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:24px;margin:0 0 16px;">✨ Une étoile s'est levée</h1>
<p>Bonne nouvelle ${name} : <strong>${filleul}</strong> vient de rejoindre Karmastro grâce à toi.</p>
<p>Le parrainage sera validé automatiquement dans 7 jours (le temps de laisser à ton filleul le temps de confirmer son intérêt). Si tout se passe bien, ton compteur augmentera et tu te rapprocheras du prochain badge.</p>
<p style="color:#9CA3AF;font-size:13px;">Pour info : les filleuls qui se désinscrivent dans les 7 premiers jours ne comptent pas, c'est normal. Au-delà, c'est définitif.</p>
    `,
    "Voir ma constellation",
    "https://app.karmastro.com/profile"
  );

  const text = `✨ Une étoile s'est levée

Bonne nouvelle ${name} : ${filleul} vient de rejoindre Karmastro grâce à toi.

Le parrainage sera validé automatiquement dans 7 jours. Ton compteur augmentera et tu te rapprocheras du prochain badge.

Ma constellation : https://app.karmastro.com/profile

« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin
`;

  return {
    subject: `✨ Un nouveau filleul dans ta constellation`,
    html,
    text,
  };
}

// ============================================================
// 5. First Oracle consultation
// ============================================================

export function firstOracleEmail(firstName: string | null, guideName: string): EmailTemplate {
  const name = firstName || "cher voyageur";
  const html = wrapHtml(
    "Ta première consultation avec l'Oracle",
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Ta première rencontre avec ${guideName}</h1>
<p>${name}, tu viens d'avoir ta première consultation avec l'un de nos quatre guides cosmiques. On espère que ça a résonné.</p>
<p>Quelques conseils pour aller plus loin :</p>
<ul style="padding-left:20px;color:#E5E7EB;">
<li><strong>Reviens demain</strong> : tu as 3 consultations gratuites par jour, ça permet d'installer un dialogue au fil du temps</li>
<li><strong>Essaie un autre guide</strong> : chacun a son style (Sibylle mystique, Orion direct, Séléné relationnelle, Pythia analytique)</li>
<li><strong>Donne du feedback</strong> : après chaque réponse, les boutons ✨⭐🌑 aident ton guide à affiner son ton au fil du temps</li>
</ul>
<p>Si tu veux débloquer l'Oracle illimité (sans la limite de 3/jour), tu peux passer en Étoile pour 5,99€/mois - sans engagement.</p>
    `,
    "Retourner à l'Oracle",
    "https://app.karmastro.com/oracle"
  );

  const text = `Ta première rencontre avec ${guideName}

${name}, tu viens d'avoir ta première consultation. On espère que ça a résonné.

Conseils :
- Reviens demain (3 consultations gratuites par jour)
- Essaie un autre guide : Sibylle, Orion, Séléné, Pythia
- Donne du feedback après chaque réponse

Pour l'Oracle illimité : 5,99€/mois sans engagement.

https://app.karmastro.com/oracle

« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin
`;

  return {
    subject: `✦ Ta première rencontre avec ${guideName}`,
    html,
    text,
  };
}

// Karmastro email templates - HTML + plain text versions
// Every template returns { subject, html, text }

type EmailTemplate = {
  subject: string;
  html: string;
  text: string;
};

export const WELCOME_LOCALES = [
  "fr-FR",
  "en-US",
  "es-ES",
  "es-MX",
  "de-DE",
  "it-IT",
  "pt-BR",
  "nl-NL",
  "ja-JP",
  "ko-KR",
  "zh-Hans",
  "ar",
  "tr-TR",
  "pl-PL",
  "ru-RU",
  "uk-UA",
  "cs-CZ",
  "hu-HU",
  "ro-RO",
  "sv-SE",
  "da-DK",
  "nb-NO",
  "fi-FI",
  "el-GR",
  "th-TH",
  "vi-VN",
  "id-ID",
  "ms-MY",
] as const;

export type WelcomeLocale = (typeof WELCOME_LOCALES)[number];

export function normalizeWelcomeLocale(locale: string | null | undefined): WelcomeLocale {
  const normalized = String(locale || "").trim().replace(/_/g, "-");
  if (!normalized) return "fr-FR";

  let canonical: string;
  try {
    canonical = Intl.getCanonicalLocales(normalized)[0] ?? "";
  } catch {
    return "fr-FR";
  }
  if ((WELCOME_LOCALES as readonly string[]).includes(canonical)) {
    return canonical as WelcomeLocale;
  }

  const parsed = new Intl.Locale(canonical);
  switch (parsed.language) {
    case "fr": return "fr-FR";
    case "en": return "en-US";
    case "es": return parsed.region === "MX" ? "es-MX" : "es-ES";
    case "de": return "de-DE";
    case "it": return "it-IT";
    case "pt": return parsed.region === "PT" ? "fr-FR" : "pt-BR";
    case "nl": return "nl-NL";
    case "ja": return "ja-JP";
    case "ko": return "ko-KR";
    case "zh":
      return parsed.script === "Hans" || parsed.region === "CN" || parsed.region === "SG"
        ? "zh-Hans"
        : "fr-FR";
    case "ar": return "ar";
    case "tr": return "tr-TR";
    case "pl": return "pl-PL";
    case "ru": return "ru-RU";
    case "uk": return "uk-UA";
    case "cs": return "cs-CZ";
    case "hu": return "hu-HU";
    case "ro": return "ro-RO";
    case "sv": return "sv-SE";
    case "da": return "da-DK";
    case "no":
    case "nb": return "nb-NO";
    case "fi": return "fi-FI";
    case "el": return "el-GR";
    case "th": return "th-TH";
    case "vi": return "vi-VN";
    case "id": return "id-ID";
    case "ms": return "ms-MY";
    default: return "fr-FR";
  }
}

export function profileLanguageForWelcomeLocale(locale: WelcomeLocale): string {
  return new Intl.Locale(locale).language;
}

const APP_QUERY_LANGUAGE: Partial<Record<WelcomeLocale, string>> = {
  "en-US": "en",
  "es-ES": "es",
  "es-MX": "es",
  "de-DE": "de",
  "it-IT": "it",
  "pt-BR": "pt",
  "ja-JP": "ja",
  ar: "ar",
  "tr-TR": "tr",
  "pl-PL": "pl",
  "ru-RU": "ru",
};

function welcomeProfileUrl(locale: WelcomeLocale): string {
  if (locale === "fr-FR") return "https://app.karmastro.com/dashboard";
  const queryLanguage = APP_QUERY_LANGUAGE[locale] ?? "en";
  return `https://app.karmastro.com/dashboard?lang=${queryLanguage}`;
}

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

const FOOTER_QUOTES: Record<WelcomeLocale, string> = {
  "fr-FR": "Les astres inclinent, mais ne déterminent pas",
  "en-US": "The stars incline us, they do not bind us",
  "es-ES": "Los astros inclinan, pero no determinan",
  "es-MX": "Los astros inclinan, pero no determinan",
  "de-DE": "Die Sterne machen geneigt, aber sie zwingen nicht",
  "it-IT": "Gli astri inclinano, ma non determinano",
  "pt-BR": "Os astros inclinam, mas não determinam",
  "nl-NL": "De sterren beïnvloeden, maar bepalen niet",
  "ja-JP": "星は傾向を示しますが、運命を決めるものではありません",
  "ko-KR": "별은 우리를 이끌지만 운명을 결정하지는 않습니다",
  "zh-Hans": "星辰指引方向，却不决定命运",
  ar: "النجوم تميل بنا، لكنها لا تحدد مصيرنا",
  "tr-TR": "Yıldızlar eğilim verir, ancak belirlemez",
  "pl-PL": "Gwiazdy skłaniają, ale nie determinują",
  "ru-RU": "Звёзды склоняют, но не предопределяют",
  "uk-UA": "Зорі схиляють, але не визначають",
  "cs-CZ": "Hvězdy nás ovlivňují, ale neurčují",
  "hu-HU": "A csillagok hajlamosítanak, de nem határoznak meg",
  "ro-RO": "Astrele înclină, dar nu determină",
  "sv-SE": "Stjärnorna påverkar, men bestämmer inte",
  "da-DK": "Stjernerne påvirker, men bestemmer ikke",
  "nb-NO": "Stjernene påvirker, men bestemmer ikke",
  "fi-FI": "Tähdet ohjaavat, mutta eivät määrää",
  "el-GR": "Τα άστρα επηρεάζουν, αλλά δεν καθορίζουν",
  "th-TH": "ดวงดาวชี้นำ แต่ไม่ได้กำหนดชะตา",
  "vi-VN": "Các vì sao dẫn lối, nhưng không định đoạt",
  "id-ID": "Bintang memberi arah, tetapi tidak menentukan",
  "ms-MY": "Bintang memberi petunjuk, tetapi tidak menentukan",
};

function wrapHtml(
  title: string,
  content: string,
  ctaText?: string,
  ctaUrl?: string,
  locale: WelcomeLocale = "fr-FR",
): string {
  const cta = ctaText && ctaUrl
    ? `<tr><td align="center" style="padding:24px 0 8px;">
        <a href="${ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,${BRAND_COLORS.primary},${BRAND_COLORS.gold});color:#0f0a1e;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;">${ctaText}</a>
      </td></tr>`
    : "";

  return `<!doctype html>
<html lang="${locale}" dir="${locale === "ar" ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
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
<p style="margin:0 0 8px;">« ${FOOTER_QUOTES[locale]} » - Thomas d'Aquin</p>
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

type WelcomeCopy = {
  fallbackName: string;
  subject: (name: string) => string;
  title: (name: string) => string;
  intro: string;
  referrer: (name: string) => string;
  actionsIntro: string;
  actions: readonly [string, string, string];
  freeMessages: string;
  cta: string;
  profileLabel: string;
};

const WELCOME_COPY: Record<WelcomeLocale, WelcomeCopy> = {
  "fr-FR": {
    fallbackName: "cher voyageur",
    subject: (name) => `Bienvenue sur Karmastro, ${name} ✦`,
    title: (name) => `Bienvenue, ${name}.`,
    intro: "Les étoiles t'attendaient. Karmastro croise astrologie, numérologie et guidance karmique pour te proposer une lecture de toi qui va plus loin qu'un horoscope générique.",
    referrer: (name) => `Tu arrives avec ${name} qui t'a invité(e). Merci de faire confiance à une personne de ta constellation proche.`,
    actionsIntro: "Voici ce que tu peux faire dès maintenant :",
    actions: [
      "Découvrir ton thème natal complet (10 planètes, 12 maisons, aspects)",
      "Poser une question à ton Oracle personnel et construire un échange qui garde le fil",
      "Calculer ton chemin de vie et tes autres nombres numérologiques",
    ],
    freeMessages: "Tu as droit à 2 messages gratuits par jour avec l'Oracle. C'est parti.",
    cta: "Découvrir mon profil cosmique",
    profileLabel: "Ton profil",
  },
  "en-US": {
    fallbackName: "cosmic traveller",
    subject: (name) => `Welcome to Karmastro, ${name} ✦`,
    title: (name) => `Welcome, ${name}.`,
    intro: "The stars were waiting for you. Karmastro brings astrology, numerology and karmic guidance together to offer insight that goes beyond a generic horoscope.",
    referrer: (name) => `You joined through ${name}'s invitation. Thank you for trusting someone in your close constellation.`,
    actionsIntro: "Here is what you can explore right away:",
    actions: [
      "Discover your complete birth chart (10 planets, 12 houses and aspects)",
      "Ask your personal Oracle a question and build a conversation that keeps its context",
      "Calculate your life path and your other numerology numbers",
    ],
    freeMessages: "You have 2 free Oracle messages every day. Your journey can begin.",
    cta: "Discover my cosmic profile",
    profileLabel: "Your profile",
  },
  "es-ES": {
    fallbackName: "alma viajera",
    subject: (name) => `Te damos la bienvenida a Karmastro, ${name} ✦`,
    title: (name) => `Te damos la bienvenida, ${name}.`,
    intro: "Las estrellas te estaban esperando. Karmastro une astrología, numerología y orientación kármica para ofrecerte una lectura que va más allá de un horóscopo genérico.",
    referrer: (name) => `Has llegado por invitación de ${name}. Gracias por confiar en alguien de tu constelación cercana.`,
    actionsIntro: "Esto es lo que puedes explorar desde ahora:",
    actions: [
      "Descubrir tu carta natal completa (10 planetas, 12 casas y aspectos)",
      "Hacer una pregunta a tu Oráculo personal y construir una conversación que conserve el contexto",
      "Calcular tu camino de vida y tus otros números numerológicos",
    ],
    freeMessages: "Tienes 2 mensajes gratuitos al día con el Oráculo. Tu viaje puede empezar.",
    cta: "Descubrir mi perfil cósmico",
    profileLabel: "Tu perfil",
  },
  "es-MX": {
    fallbackName: "alma viajera",
    subject: (name) => `Te damos la bienvenida a Karmastro, ${name} ✦`,
    title: (name) => `Te damos la bienvenida, ${name}.`,
    intro: "Las estrellas te estaban esperando. Karmastro reúne astrología, numerología y guía kármica para ofrecerte una lectura que va más allá de un horóscopo genérico.",
    referrer: (name) => `Llegaste por invitación de ${name}. Gracias por confiar en alguien de tu constelación cercana.`,
    actionsIntro: "Esto es lo que puedes explorar desde ahora:",
    actions: [
      "Descubrir tu carta natal completa (10 planetas, 12 casas y aspectos)",
      "Hacerle una pregunta a tu Oráculo personal y construir una conversación que conserve el contexto",
      "Calcular tu camino de vida y tus otros números numerológicos",
    ],
    freeMessages: "Tienes 2 mensajes gratis al día con el Oráculo. Tu viaje puede comenzar.",
    cta: "Descubrir mi perfil cósmico",
    profileLabel: "Tu perfil",
  },
  "pt-BR": {
    fallbackName: "alma viajante",
    subject: (name) => `Boas-vindas à Karmastro, ${name} ✦`,
    title: (name) => `Boas-vindas, ${name}.`,
    intro: "As estrelas estavam esperando por você. A Karmastro reúne astrologia, numerologia e orientação cármica para oferecer uma leitura que vai além de um horóscopo genérico.",
    referrer: (name) => `Você chegou pelo convite de ${name}. Agradecemos por confiar em alguém da sua constelação próxima.`,
    actionsIntro: "Veja o que você pode explorar agora:",
    actions: [
      "Descobrir seu mapa astral completo (10 planetas, 12 casas e aspectos)",
      "Fazer uma pergunta ao seu Oráculo pessoal e construir uma conversa que mantém o contexto",
      "Calcular seu caminho de vida e seus outros números numerológicos",
    ],
    freeMessages: "Você tem 2 mensagens gratuitas por dia com o Oráculo. Sua jornada pode começar.",
    cta: "Descobrir meu perfil cósmico",
    profileLabel: "Seu perfil",
  },
  "de-DE": {
    fallbackName: "Sternenseele",
    subject: (name) => `Willkommen bei Karmastro, ${name} ✦`,
    title: (name) => `Willkommen, ${name}.`,
    intro: "Die Sterne haben auf dich gewartet. Karmastro verbindet Astrologie, Numerologie und karmische Begleitung zu einer Deutung, die über ein allgemeines Horoskop hinausgeht.",
    referrer: (name) => `Du bist auf Einladung von ${name} zu uns gekommen. Danke, dass du einem Menschen aus deiner nahen Konstellation vertraust.`,
    actionsIntro: "Das kannst du sofort entdecken:",
    actions: [
      "Dein vollständiges Geburtshoroskop entdecken (10 Planeten, 12 Häuser und Aspekte)",
      "Deinem persönlichen Orakel eine Frage stellen und ein Gespräch mit bleibendem Kontext aufbauen",
      "Deine Lebenszahl und weitere numerologische Zahlen berechnen",
    ],
    freeMessages: "Du hast jeden Tag 2 kostenlose Nachrichten beim Orakel. Deine Reise kann beginnen.",
    cta: "Mein kosmisches Profil entdecken",
    profileLabel: "Dein Profil",
  },
  "it-IT": {
    fallbackName: "anima in viaggio",
    subject: (name) => `Benvenuto su Karmastro, ${name} ✦`,
    title: (name) => `Ti diamo il benvenuto, ${name}.`,
    intro: "Le stelle ti stavano aspettando. Karmastro unisce astrologia, numerologia e guida karmica per offrirti una lettura che va oltre un oroscopo generico.",
    referrer: (name) => `Sei qui grazie all'invito di ${name}. Grazie per la fiducia in una persona della tua costellazione più vicina.`,
    actionsIntro: "Ecco cosa puoi esplorare fin da subito:",
    actions: [
      "Scoprire il tuo tema natale completo (10 pianeti, 12 case e aspetti)",
      "Fare una domanda al tuo Oracolo personale e costruire un dialogo che conserva il contesto",
      "Calcolare il tuo cammino di vita e gli altri numeri della numerologia",
    ],
    freeMessages: "Hai 2 messaggi gratuiti al giorno con l'Oracolo. Il tuo viaggio può iniziare.",
    cta: "Scoprire il mio profilo cosmico",
    profileLabel: "Il tuo profilo",
  },
  "nl-NL": {
    fallbackName: "sterrenreiziger",
    subject: (name) => `Welkom bij Karmastro, ${name} ✦`,
    title: (name) => `Welkom, ${name}.`,
    intro: "De sterren wachtten op je. Karmastro brengt astrologie, numerologie en karmische begeleiding samen voor inzichten die verder gaan dan een algemene horoscoop.",
    referrer: (name) => `Je bent hier op uitnodiging van ${name}. Dank je voor het vertrouwen in iemand uit je nabije constellatie.`,
    actionsIntro: "Dit kun je meteen ontdekken:",
    actions: [
      "Ontdek je volledige geboortehoroscoop (10 planeten, 12 huizen en aspecten)",
      "Stel je persoonlijke Orakel een vraag en bouw een gesprek op dat de context onthoudt",
      "Bereken je levenspad en je andere numerologische getallen",
    ],
    freeMessages: "Je krijgt elke dag 2 gratis berichten met het Orakel. Je reis kan beginnen.",
    cta: "Ontdek mijn kosmische profiel",
    profileLabel: "Jouw profiel",
  },
  "tr-TR": {
    fallbackName: "yıldız yolcusu",
    subject: (name) => `Karmastro'ya hoş geldin, ${name} ✦`,
    title: (name) => `Hoş geldin, ${name}.`,
    intro: "Yıldızlar seni bekliyordu. Karmastro, genel bir burç yorumunun ötesine geçen kişisel bir bakış sunmak için astroloji, numeroloji ve karmik rehberliği bir araya getirir.",
    referrer: (name) => `${name} tarafından davet edildin. Yakın çevrendeki birine güvendiğin için teşekkür ederiz.`,
    actionsIntro: "Hemen keşfedebileceklerin:",
    actions: [
      "Eksiksiz doğum haritanı keşfet (10 gezegen, 12 ev ve açılar)",
      "Kişisel Kahinine bir soru sor ve bağlamını koruyan bir sohbet oluştur",
      "Yaşam yolunu ve diğer numeroloji sayılarını hesapla",
    ],
    freeMessages: "Kahin ile her gün 2 ücretsiz mesaj hakkın var. Yolculuğun başlayabilir.",
    cta: "Kozmik profilimi keşfet",
    profileLabel: "Profilin",
  },
  "pl-PL": {
    fallbackName: "gwiezdna duszo",
    subject: (name) => `Witaj w Karmastro, ${name} ✦`,
    title: (name) => `Witaj, ${name}.`,
    intro: "Gwiazdy na Ciebie czekały. Karmastro łączy astrologię, numerologię i przewodnictwo karmiczne, aby dać Ci wgląd wykraczający poza ogólny horoskop.",
    referrer: (name) => `Dołączasz na zaproszenie od ${name}. Dziękujemy za zaufanie osobie z Twojej bliskiej konstelacji.`,
    actionsIntro: "Oto co możesz odkryć już teraz:",
    actions: [
      "Poznać swój pełny kosmogram urodzeniowy (10 planet, 12 domów i aspekty)",
      "Zadać pytanie osobistej Wyroczni i prowadzić rozmowę, która zachowuje kontekst",
      "Obliczyć swoją drogę życia i pozostałe liczby numerologiczne",
    ],
    freeMessages: "Każdego dnia masz 2 bezpłatne wiadomości do Wyroczni. Twoja podróż może się zacząć.",
    cta: "Odkryj mój kosmiczny profil",
    profileLabel: "Twój profil",
  },
  "ru-RU": {
    fallbackName: "звёздная душа",
    subject: (name) => `Добро пожаловать в Karmastro, ${name} ✦`,
    title: (name) => `Добро пожаловать, ${name}.`,
    intro: "Звёзды ждали тебя. Karmastro объединяет астрологию, нумерологию и кармические подсказки, чтобы дать тебе понимание, которое глубже обычного гороскопа.",
    referrer: (name) => `Ты здесь по приглашению от ${name}. Спасибо за доверие к человеку из твоего близкого круга.`,
    actionsIntro: "Вот что можно исследовать прямо сейчас:",
    actions: [
      "Открыть свою полную натальную карту (10 планет, 12 домов и аспекты)",
      "Задать вопрос личному Оракулу и продолжить разговор с сохранением контекста",
      "Рассчитать число жизненного пути и другие нумерологические числа",
    ],
    freeMessages: "Каждый день у тебя есть 2 бесплатных сообщения Оракулу. Путешествие начинается.",
    cta: "Открыть мой космический профиль",
    profileLabel: "Твой профиль",
  },
  "ja-JP": {
    fallbackName: "星の旅人",
    subject: (name) => `Karmastroへようこそ、${name} ✦`,
    title: (name) => `ようこそ、${name}。`,
    intro: "星々はあなたを待っていました。Karmastroは占星術、数秘術、カルマの導きを組み合わせ、一般的な星占いを超えた気づきを届けます。",
    referrer: (name) => `${name}さんの招待で参加しました。身近なつながりを信頼してくださり、ありがとうございます。`,
    actionsIntro: "今すぐ体験できること：",
    actions: [
      "完全な出生図を知る（10天体、12ハウス、アスペクト）",
      "あなた専用のオラクルに質問し、文脈が続く対話を重ねる",
      "ライフパスナンバーとその他の数秘術の数字を計算する",
    ],
    freeMessages: "オラクルには毎日2通まで無料でメッセージを送れます。旅を始めましょう。",
    cta: "コズミックプロフィールを見る",
    profileLabel: "あなたのプロフィール",
  },
  "ko-KR": {
    fallbackName: "별의 여행자",
    subject: (name) => `Karmastro에 오신 것을 환영합니다, ${name} ✦`,
    title: (name) => `환영합니다, ${name}.`,
    intro: "별들이 당신을 기다리고 있었습니다. Karmastro는 점성술, 수비학, 카르마 안내를 결합해 일반적인 운세를 넘어서는 통찰을 전합니다.",
    referrer: (name) => `${name}님의 초대로 함께하게 되었습니다. 가까운 인연을 믿어 주셔서 감사합니다.`,
    actionsIntro: "지금 바로 살펴볼 수 있어요:",
    actions: [
      "완전한 출생 차트 알아보기 (10개 행성, 12개 하우스, 애스펙트)",
      "나만의 오라클에게 질문하고 맥락이 이어지는 대화 나누기",
      "라이프 패스와 다른 수비학 숫자 계산하기",
    ],
    freeMessages: "매일 오라클 메시지 2개를 무료로 이용할 수 있습니다. 이제 여정을 시작해 보세요.",
    cta: "나의 우주 프로필 보기",
    profileLabel: "내 프로필",
  },
  "zh-Hans": {
    fallbackName: "星际旅人",
    subject: (name) => `欢迎来到 Karmastro，${name} ✦`,
    title: (name) => `欢迎你，${name}。`,
    intro: "星辰一直在等待你。Karmastro 融合占星术、数字命理与业力指引，为你带来超越普通星座运势的洞见。",
    referrer: (name) => `你通过 ${name} 的邀请加入。感谢你信任身边星群中的这段缘分。`,
    actionsIntro: "你现在就可以探索：",
    actions: [
      "查看完整本命盘（10 颗行星、12 个宫位及相位）",
      "向你的专属神谕提问，并展开能够延续上下文的对话",
      "计算生命灵数及其他数字命理数值",
    ],
    freeMessages: "你每天可免费向神谕发送 2 条消息。现在就开启旅程吧。",
    cta: "探索我的宇宙档案",
    profileLabel: "你的档案",
  },
  ar: {
    fallbackName: "يا مسافر النجوم",
    subject: (name) => `مرحبًا بك في Karmastro، ${name} ✦`,
    title: (name) => `مرحبًا بك، ${name}.`,
    intro: "كانت النجوم في انتظارك. يجمع Karmastro بين علم التنجيم وعلم الأرقام والإرشاد الكارمي ليقدم لك قراءة تتجاوز الأبراج العامة.",
    referrer: (name) => `انضممت بدعوة من ${name}. شكرًا لثقتك بشخص من دائرتك القريبة.`,
    actionsIntro: "إليك ما يمكنك استكشافه الآن:",
    actions: [
      "اكتشاف خريطة ميلادك الكاملة (10 كواكب و12 بيتًا والزوايا)",
      "طرح سؤال على عرّافك الشخصي وبناء حوار يحتفظ بالسياق",
      "حساب مسار حياتك وأرقامك الأخرى في علم الأرقام",
    ],
    freeMessages: "لديك رسالتان مجانيتان يوميًا مع العرّاف. يمكن لرحلتك أن تبدأ.",
    cta: "اكتشاف ملفي الكوني",
    profileLabel: "ملفك الشخصي",
  },
  "uk-UA": {
    fallbackName: "зоряний мандрівнику",
    subject: (name) => `Ласкаво просимо до Karmastro, ${name} ✦`,
    title: (name) => `Ласкаво просимо, ${name}.`,
    intro: "Зорі чекали на тебе. Karmastro поєднує астрологію, нумерологію та кармічні поради, щоб дати розуміння, глибше за звичайний гороскоп.",
    referrer: (name) => `Ти приєднався за запрошенням від ${name}. Дякуємо за довіру до людини з твого близького кола.`,
    actionsIntro: "Ось що можна дослідити просто зараз:",
    actions: [
      "Відкрити повну натальну карту (10 планет, 12 будинків та аспекти)",
      "Поставити запитання особистому Оракулу й вести розмову зі збереженням контексту",
      "Розрахувати число життєвого шляху та інші нумерологічні числа",
    ],
    freeMessages: "Щодня ти маєш 2 безкоштовні повідомлення Оракулу. Подорож починається.",
    cta: "Відкрити мій космічний профіль",
    profileLabel: "Твій профіль",
  },
  "cs-CZ": {
    fallbackName: "hvězdný poutníku",
    subject: (name) => `Vítej v Karmastro, ${name} ✦`,
    title: (name) => `Vítej, ${name}.`,
    intro: "Hvězdy na tebe čekaly. Karmastro propojuje astrologii, numerologii a karmické vedení a nabízí vhled, který přesahuje běžný horoskop.",
    referrer: (name) => `Přicházíš na pozvání od ${name}. Děkujeme za důvěru v člověka z tvé blízké konstelace.`,
    actionsIntro: "Hned teď můžeš objevit:",
    actions: [
      "Svůj úplný horoskop narození (10 planet, 12 domů a aspekty)",
      "Položit otázku osobnímu Orákulu a vést rozhovor, který si uchovává souvislosti",
      "Vypočítat svou životní cestu a další numerologická čísla",
    ],
    freeMessages: "Každý den máš 2 zprávy Orákulu zdarma. Tvá cesta může začít.",
    cta: "Objevit můj kosmický profil",
    profileLabel: "Tvůj profil",
  },
  "hu-HU": {
    fallbackName: "csillagutazó",
    subject: (name) => `Üdvözlünk a Karmastróban, ${name} ✦`,
    title: (name) => `Üdvözlünk, ${name}.`,
    intro: "A csillagok vártak rád. A Karmastro az asztrológiát, a numerológiát és a karmikus útmutatást ötvözi, hogy az általános horoszkópnál mélyebb betekintést adjon.",
    referrer: (name) => `${name} meghívásával érkeztél. Köszönjük, hogy megbízol közeli csillagképed egyik tagjában.`,
    actionsIntro: "Ezeket már most felfedezheted:",
    actions: [
      "A teljes születési képletedet (10 bolygó, 12 ház és fényszögek)",
      "Kérdezhetsz személyes Orákulumodtól, és folytathatod a kontextust megőrző beszélgetést",
      "Kiszámíthatod életút-számodat és más numerológiai számaidat",
    ],
    freeMessages: "Naponta 2 ingyenes üzenetet küldhetsz az Orákulumnak. Kezdődhet az utazás.",
    cta: "Felfedezem a kozmikus profilomat",
    profileLabel: "A profilod",
  },
  "ro-RO": {
    fallbackName: "călător stelar",
    subject: (name) => `Bun venit la Karmastro, ${name} ✦`,
    title: (name) => `Bun venit, ${name}.`,
    intro: "Stelele te așteptau. Karmastro îmbină astrologia, numerologia și îndrumarea karmică pentru a-ți oferi o perspectivă dincolo de un horoscop generic.",
    referrer: (name) => `Ai venit la invitația lui ${name}. Îți mulțumim că ai încredere în cineva din constelația ta apropiată.`,
    actionsIntro: "Iată ce poți explora chiar acum:",
    actions: [
      "Descoperă harta natală completă (10 planete, 12 case și aspecte)",
      "Adresează o întrebare Oracolului personal și construiește o conversație care păstrează contextul",
      "Calculează-ți calea vieții și celelalte numere numerologice",
    ],
    freeMessages: "Ai 2 mesaje gratuite pe zi cu Oracolul. Călătoria ta poate începe.",
    cta: "Descoperă profilul meu cosmic",
    profileLabel: "Profilul tău",
  },
  "sv-SE": {
    fallbackName: "stjärnresenär",
    subject: (name) => `Välkommen till Karmastro, ${name} ✦`,
    title: (name) => `Välkommen, ${name}.`,
    intro: "Stjärnorna väntade på dig. Karmastro förenar astrologi, numerologi och karmisk vägledning för insikter som går bortom ett allmänt horoskop.",
    referrer: (name) => `Du kom hit genom en inbjudan från ${name}. Tack för att du litar på någon i din nära konstellation.`,
    actionsIntro: "Det här kan du utforska direkt:",
    actions: [
      "Upptäck ditt fullständiga födelsehoroskop (10 planeter, 12 hus och aspekter)",
      "Ställ en fråga till ditt personliga Orakel och bygg ett samtal som minns sammanhanget",
      "Beräkna din livsväg och dina andra numerologiska tal",
    ],
    freeMessages: "Du får 2 kostnadsfria meddelanden med Oraklet varje dag. Din resa kan börja.",
    cta: "Upptäck min kosmiska profil",
    profileLabel: "Din profil",
  },
  "da-DK": {
    fallbackName: "stjernerejsende",
    subject: (name) => `Velkommen til Karmastro, ${name} ✦`,
    title: (name) => `Velkommen, ${name}.`,
    intro: "Stjernerne ventede på dig. Karmastro forener astrologi, numerologi og karmisk vejledning og giver indsigter, der rækker ud over et almindeligt horoskop.",
    referrer: (name) => `Du kom hertil på invitation fra ${name}. Tak, fordi du stoler på en person i din nære konstellation.`,
    actionsIntro: "Det kan du udforske med det samme:",
    actions: [
      "Se dit fulde fødselshoroskop (10 planeter, 12 huse og aspekter)",
      "Stil dit personlige Orakel et spørgsmål, og skab en samtale, der husker sammenhængen",
      "Beregn din livsvej og dine øvrige numerologiske tal",
    ],
    freeMessages: "Du får 2 gratis beskeder med Oraklet hver dag. Din rejse kan begynde.",
    cta: "Se min kosmiske profil",
    profileLabel: "Din profil",
  },
  "nb-NO": {
    fallbackName: "stjernereisende",
    subject: (name) => `Velkommen til Karmastro, ${name} ✦`,
    title: (name) => `Velkommen, ${name}.`,
    intro: "Stjernene ventet på deg. Karmastro forener astrologi, numerologi og karmisk veiledning for innsikt som går lenger enn et generelt horoskop.",
    referrer: (name) => `Du kom hit på invitasjon fra ${name}. Takk for at du stoler på noen i din nære konstellasjon.`,
    actionsIntro: "Dette kan du utforske med en gang:",
    actions: [
      "Oppdag hele fødselshoroskopet ditt (10 planeter, 12 hus og aspekter)",
      "Still ditt personlige Orakel et spørsmål og bygg en samtale som husker sammenhengen",
      "Beregn livsveien din og de andre numerologiske tallene dine",
    ],
    freeMessages: "Du får 2 gratis meldinger med Oraklet hver dag. Reisen din kan begynne.",
    cta: "Oppdag min kosmiske profil",
    profileLabel: "Profilen din",
  },
  "fi-FI": {
    fallbackName: "tähtimatkaaja",
    subject: (name) => `Tervetuloa Karmastroon, ${name} ✦`,
    title: (name) => `Tervetuloa, ${name}.`,
    intro: "Tähdet odottivat sinua. Karmastro yhdistää astrologian, numerologian ja karmallisen ohjauksen tarjotakseen oivalluksia tavallista horoskooppia syvemmältä.",
    referrer: (name) => `Liityit mukaan henkilön ${name} kutsusta. Kiitos, että luotat läheiseen tähtikuvioosi kuuluvaan ihmiseen.`,
    actionsIntro: "Voit tutkia heti seuraavia asioita:",
    actions: [
      "Täydellinen syntymäkarttasi (10 planeettaa, 12 huonetta ja aspektit)",
      "Kysy henkilökohtaiselta Oraakkeliltasi ja rakenna keskustelu, joka muistaa asiayhteyden",
      "Laske elämänpolkusi ja muut numerologiset lukusi",
    ],
    freeMessages: "Saat 2 ilmaista viestiä Oraakkelille joka päivä. Matkasi voi alkaa.",
    cta: "Tutustu kosmiseen profiiliini",
    profileLabel: "Profiilisi",
  },
  "el-GR": {
    fallbackName: "ταξιδιώτη των άστρων",
    subject: (name) => `Καλώς ήρθες στο Karmastro, ${name} ✦`,
    title: (name) => `Καλώς ήρθες, ${name}.`,
    intro: "Τα άστρα σε περίμεναν. Το Karmastro συνδυάζει αστρολογία, αριθμολογία και καρμική καθοδήγηση για μια ματιά πέρα από ένα γενικό ωροσκόπιο.",
    referrer: (name) => `Ήρθες με πρόσκληση από τον/την ${name}. Σε ευχαριστούμε που εμπιστεύεσαι κάποιον από τον κοντινό σου αστερισμό.`,
    actionsIntro: "Μπορείς να εξερευνήσεις αμέσως:",
    actions: [
      "Τον πλήρη γενέθλιο χάρτη σου (10 πλανήτες, 12 οίκοι και όψεις)",
      "Να ρωτήσεις το προσωπικό σου Μαντείο και να χτίσεις μια συζήτηση που θυμάται το πλαίσιο",
      "Να υπολογίσεις τον αριθμό πορείας ζωής και τους άλλους αριθμολογικούς αριθμούς σου",
    ],
    freeMessages: "Έχεις 2 δωρεάν μηνύματα με το Μαντείο κάθε μέρα. Το ταξίδι σου μπορεί να αρχίσει.",
    cta: "Ανακάλυψε το κοσμικό προφίλ μου",
    profileLabel: "Το προφίλ σου",
  },
  "th-TH": {
    fallbackName: "นักเดินทางแห่งดวงดาว",
    subject: (name) => `ยินดีต้อนรับสู่ Karmastro, ${name} ✦`,
    title: (name) => `ยินดีต้อนรับ, ${name}`,
    intro: "ดวงดาวรอคุณอยู่ Karmastro ผสานโหราศาสตร์ เลขศาสตร์ และคำแนะนำด้านกรรม เพื่อมอบมุมมองที่ลึกกว่าคำทำนายทั่วไป",
    referrer: (name) => `คุณเข้าร่วมผ่านคำเชิญของ ${name} ขอบคุณที่ไว้วางใจคนในกลุ่มดาวที่ใกล้ชิดของคุณ`,
    actionsIntro: "สิ่งที่คุณสำรวจได้ทันที:",
    actions: [
      "ค้นพบดวงชะตากำเนิดฉบับเต็ม (ดาวเคราะห์ 10 ดวง เรือน 12 เรือน และมุมสัมพันธ์)",
      "ถามคำถามกับออราเคิลส่วนตัวและสนทนาต่อเนื่องโดยคงบริบทไว้",
      "คำนวณเลขเส้นทางชีวิตและเลขศาสตร์อื่น ๆ ของคุณ",
    ],
    freeMessages: "คุณส่งข้อความถึงออราเคิลได้ฟรีวันละ 2 ข้อความ เริ่มการเดินทางได้เลย",
    cta: "ค้นพบโปรไฟล์จักรวาลของฉัน",
    profileLabel: "โปรไฟล์ของคุณ",
  },
  "vi-VN": {
    fallbackName: "người lữ hành giữa các vì sao",
    subject: (name) => `Chào mừng đến với Karmastro, ${name} ✦`,
    title: (name) => `Chào mừng, ${name}.`,
    intro: "Các vì sao đã chờ bạn. Karmastro kết hợp chiêm tinh, thần số học và định hướng nghiệp quả để mang đến góc nhìn sâu hơn một tử vi chung chung.",
    referrer: (name) => `Bạn đến theo lời mời của ${name}. Cảm ơn bạn đã tin tưởng một người trong chòm sao thân cận của mình.`,
    actionsIntro: "Bạn có thể khám phá ngay:",
    actions: [
      "Khám phá đầy đủ bản đồ sao ngày sinh (10 hành tinh, 12 nhà và các góc hợp)",
      "Đặt câu hỏi cho Nhà Tiên Tri cá nhân và xây dựng cuộc trò chuyện luôn ghi nhớ ngữ cảnh",
      "Tính con số đường đời và các con số thần số học khác",
    ],
    freeMessages: "Bạn có 2 tin nhắn miễn phí với Nhà Tiên Tri mỗi ngày. Hành trình có thể bắt đầu.",
    cta: "Khám phá hồ sơ vũ trụ của tôi",
    profileLabel: "Hồ sơ của bạn",
  },
  "id-ID": {
    fallbackName: "pengelana bintang",
    subject: (name) => `Selamat datang di Karmastro, ${name} ✦`,
    title: (name) => `Selamat datang, ${name}.`,
    intro: "Bintang-bintang telah menantimu. Karmastro memadukan astrologi, numerologi, dan panduan karma untuk memberi wawasan yang melampaui ramalan umum.",
    referrer: (name) => `Kamu bergabung melalui undangan ${name}. Terima kasih telah memercayai seseorang dalam konstelasi terdekatmu.`,
    actionsIntro: "Berikut yang bisa langsung kamu jelajahi:",
    actions: [
      "Temukan bagan kelahiran lengkapmu (10 planet, 12 rumah, dan aspek)",
      "Ajukan pertanyaan kepada Orakel pribadimu dan bangun percakapan yang mengingat konteks",
      "Hitung jalan hidup dan angka numerologi lainnya",
    ],
    freeMessages: "Kamu mendapat 2 pesan gratis dengan Orakel setiap hari. Perjalananmu bisa dimulai.",
    cta: "Temukan profil kosmisku",
    profileLabel: "Profilmu",
  },
  "ms-MY": {
    fallbackName: "pengembara bintang",
    subject: (name) => `Selamat datang ke Karmastro, ${name} ✦`,
    title: (name) => `Selamat datang, ${name}.`,
    intro: "Bintang-bintang telah menantimu. Karmastro menggabungkan astrologi, numerologi dan panduan karma untuk memberi pemahaman yang melangkaui horoskop umum.",
    referrer: (name) => `Kamu menyertai melalui jemputan ${name}. Terima kasih kerana mempercayai seseorang dalam buruj terdekatmu.`,
    actionsIntro: "Inilah yang boleh kamu terokai sekarang:",
    actions: [
      "Temui carta kelahiran lengkapmu (10 planet, 12 rumah dan aspek)",
      "Tanya Orakel peribadimu dan bina perbualan yang mengingati konteks",
      "Kira laluan hidup dan nombor numerologi lainmu",
    ],
    freeMessages: "Kamu mendapat 2 mesej percuma dengan Orakel setiap hari. Perjalananmu boleh bermula.",
    cta: "Temui profil kosmikku",
    profileLabel: "Profilmu",
  },
};

function safeDisplayName(value: string | null | undefined, fallback: string): string {
  const sanitized = String(value || "")
    .split("")
    .map((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127 ? " " : character;
    })
    .join("")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return sanitized || fallback;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function welcomeEmail(
  firstName: string | null,
  referrerName?: string | null,
  requestedLocale?: string | null,
): EmailTemplate {
  const locale = normalizeWelcomeLocale(requestedLocale);
  const copy = WELCOME_COPY[locale];
  const name = safeDisplayName(firstName, copy.fallbackName);
  const referrer = referrerName ? safeDisplayName(referrerName, "") : "";
  const profileUrl = welcomeProfileUrl(locale);
  const htmlName = escapeHtml(name);
  const htmlReferrer = escapeHtml(referrer);
  const list = copy.actions.map((action) => `<li>${action}</li>`).join("\n");
  const referrerHtml = referrer ? `<p>${copy.referrer(htmlReferrer)}</p>` : "";

  const html = wrapHtml(
    copy.subject(name),
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:28px;margin:0 0 16px;">${copy.title(htmlName)}</h1>
<p>${copy.intro}</p>
${referrerHtml}
<p>${copy.actionsIntro}</p>
<ul style="padding-left:20px;color:#E5E7EB;">
${list}
</ul>
<p>${copy.freeMessages}</p>
    `,
    copy.cta,
    profileUrl,
    locale,
  );

  const text = `${copy.title(name)}

${copy.intro}

${referrer ? `${copy.referrer(referrer)}\n\n` : ""}${copy.actionsIntro}
- ${copy.actions.join("\n- ")}

${copy.freeMessages}

${copy.profileLabel}: ${profileUrl}

« ${FOOTER_QUOTES[locale]} » - Thomas d'Aquin

Karmastro, contact@karmastro.com
`;

  return {
    subject: copy.subject(name).slice(0, 180),
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
      ? `<p>Ton abonnement <strong>${productName}</strong> est actif. Tu bénéficies maintenant de l'Oracle illimité, de la mémoire de tes échanges et d'une guidance mensuelle personnalisée.</p>`
      : `<p>Ton achat <strong>${productName}</strong> est confirmé.</p>`;
  const destination = isSubscription
    ? "https://app.karmastro.com/settings"
    : "https://app.karmastro.com/dashboard";
  const ctaText = isSubscription ? "Gérer mon abonnement" : "Accéder à Karmastro";

  const html = wrapHtml(
    "Paiement confirmé",
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Paiement confirmé ✦</h1>
<p>Merci ${name}. Ta transaction de <strong>${amount}</strong> a bien été enregistrée.</p>
${detail}
<p style="color:#9CA3AF;font-size:13px;margin-top:24px;">${isSubscription ? "Tu peux gérer ton abonnement à tout moment depuis les réglages." : "Tu peux retrouver ton achat depuis ton espace Karmastro."}</p>
    `,
    ctaText,
    destination
  );

  const text = `Paiement confirmé ✦

Merci ${name}. Ta transaction de ${amount} pour ${productName} a bien été enregistrée.

${credits ? `${credits} crédits cosmiques ont été ajoutés à ton compte. Ils n'expirent jamais.` : ""}${isSubscription ? `Ton abonnement est actif : Oracle illimité, mémoire de tes échanges et guidance mensuelle personnalisée.` : ""}

Ton espace : ${destination}

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

export function firstOracleEmail(firstName: string | null, _guideName: string): EmailTemplate {
  const name = firstName || "cher voyageur";
  const html = wrapHtml(
    "Ta première consultation avec l'Oracle",
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Ta première rencontre avec l'Oracle</h1>
<p>${name}, tu viens d'avoir ton premier échange avec ton Oracle personnel. On espère que ça a résonné.</p>
<p>Quelques conseils pour aller plus loin :</p>
<ul style="padding-left:20px;color:#E5E7EB;">
<li><strong>Reviens demain</strong> : tu as 2 messages gratuits par jour pour installer un dialogue au fil du temps</li>
<li><strong>Garde le fil</strong> : ton Oracle peut s'appuyer sur vos échanges précédents</li>
<li><strong>Donne du feedback</strong> : après chaque réponse, les boutons ✨⭐🌑 l'aident à affiner son ton</li>
</ul>
<p>Si tu veux débloquer l'Oracle illimité, tu peux passer en Étoile pour 5,99€/mois, sans engagement.</p>
    `,
    "Retourner à l'Oracle",
    "https://app.karmastro.com/oracle"
  );

  const text = `Ta première rencontre avec l'Oracle

${name}, tu viens d'avoir ton premier échange avec ton Oracle personnel. On espère que ça a résonné.

Conseils :
- Reviens demain (2 messages gratuits par jour)
- Garde le fil de votre dialogue
- Donne du feedback après chaque réponse

Pour l'Oracle illimité : 5,99€/mois sans engagement.

https://app.karmastro.com/oracle

« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin
`;

  return {
    subject: "✦ Ta première rencontre avec l'Oracle",
    html,
    text,
  };
}

export function readingEmail(token: string, locale = "fr", guideName = "Orion"): EmailTemplate {
  const guide = guideName || "Orion";
  if (locale === "en") {
    const urlEn = `https://karmastro.com/lecture/?token=${token}&lang=en`;
    const htmlEn = wrapHtml(
      "Your personalised reading is ready",
      `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Your reading awaits ✦</h1>
<p>${guide} has finished your personalised reading. It is reserved for you and stays accessible any time via the link below.</p>
<p>Take a quiet moment to read it.</p>
      `,
      "Read my reading",
      urlEn
    );
    const textEn = `Your reading awaits

${guide} has finished your personalised reading. It stays accessible any time here:

${urlEn}

Take a quiet moment to read it.
`;
    return { subject: "✦ Your personalised reading is ready", html: htmlEn, text: textEn };
  }

  const url = `https://karmastro.com/lecture/?token=${token}`;
  const html = wrapHtml(
    "Ta lecture personnalisée est prête",
    `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Ta lecture t'attend ✦</h1>
<p>${guide} a terminé ta lecture personnalisée. Elle t'est réservée et reste accessible à tout moment via le lien ci-dessous.</p>
<p>Prends un moment au calme pour la lire.</p>
    `,
    "Lire ma lecture",
    url
  );

  const text = `Ta lecture t'attend ✦

${guide} a terminé ta lecture personnalisée. Elle reste accessible à tout moment ici :

${url}

Prends un moment au calme pour la lire.

« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin
`;

  return {
    subject: "✦ Ta lecture personnalisée est prête",
    html,
    text,
  };
}

// Suivi J+1 : "ta lecture d'hier a-t-elle résonné ?" — feedback + re-engagement.
export function readingFollowupEmail(token: string, locale = "fr"): EmailTemplate {
  const FB = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-feedback";
  const yes = `${FB}?token=${token}&v=good`;
  const no = `${FB}?token=${token}&v=meh`;
  const btn = (href: string, label: string, primary: boolean) =>
    `<a href="${href}" style="display:inline-block;margin:6px;padding:13px 26px;border-radius:12px;text-decoration:none;font-weight:600;font-size:15px;${primary ? "background:linear-gradient(135deg,#a78bfa,#fcd34d);color:#0f0a1e;" : "border:1px solid rgba(252,211,77,0.4);color:#fcd34d;"}">${label}</a>`;

  if (locale === "en") {
    const content = `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Did it resonate? ✨</h1>
<p>Yesterday, Orion placed your reading in your hands. Since then, has something quietly echoed, a word, an image, a small click of recognition?</p>
<p>Tell Orion in one tap. It helps the Oracle read you better next time.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:18px 0;">
${btn(yes, "Yes, it resonated ✨", true)}${btn(no, "Not really", false)}
</td></tr></table>
<p style="font-size:13px;color:rgba(255,255,255,0.5);">Your reading stays accessible any time, and a fresh calculation is always one step away on karmastro.com.</p>`;
    return { subject: "Did Orion's reading resonate? ✨", html: wrapHtml("Did it resonate?", content), text: `Did yesterday's reading resonate?\n\nYes: ${yes}\nNot really: ${no}` };
  }

  const content = `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Est-ce que ça a résonné ? ✨</h1>
<p>Hier, Orion a déposé ta lecture entre tes mains. Depuis, est-ce que quelque chose a fait écho, un mot, une image, un petit déclic de reconnaissance ?</p>
<p>Dis-le à Orion en un clic. Ça aide l'Oracle à mieux te lire la prochaine fois.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:18px 0;">
${btn(yes, "Oui, ça a résonné ✨", true)}${btn(no, "Pas vraiment", false)}
</td></tr></table>
<p style="font-size:13px;color:rgba(255,255,255,0.5);">Ta lecture reste accessible à tout moment, et un nouveau calcul n'est jamais qu'à un pas sur karmastro.com.</p>`;
  return { subject: "Ta lecture d'hier a-t-elle résonné ? ✨", html: wrapHtml("Est-ce que ça a résonné ?", content), text: `Ta lecture d'hier a-t-elle résonné ?\n\nOui : ${yes}\nPas vraiment : ${no}` };
}

// ============================================================
// Demande d'avis (note 1-5 + commentaire) : chaque etoile mene a la page /avis,
// la note est pre-cochee et capturee au clic, l'utilisateur peut ajouter un mot.
// ============================================================
export function readingReviewEmail(token: string, locale = "fr", firstName: string | null = null): EmailTemplate {
  const lang = locale && locale !== "fr" ? `&lang=${encodeURIComponent(locale)}` : "";
  const star = (n: number) =>
    `<a href="https://karmastro.com/avis/?token=${token}&note=${n}${lang}" style="text-decoration:none;color:#fcd34d;font-size:34px;line-height:1;padding:0 3px;">&#9733;</a>`;
  const starsRow = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:14px 0 6px;">${star(1)}${star(2)}${star(3)}${star(4)}${star(5)}</td></tr></table>`;

  const en = locale === "en";
  const hi = firstName ? `${en ? "Hi" : "Coucou"} ${firstName},` : (en ? "Hi," : "Coucou,");

  if (en) {
    const content = `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">How did your reading feel? ✦</h1>
<p>${hi}</p>
<p>You took the time to receive a reading from us, and your honest impression matters a lot. How much did it resonate?</p>
${starsRow}
<p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">Tap a star, then add a word if you like.</p>
<p style="font-size:13px;color:rgba(255,255,255,0.45);">Your reading stays accessible any time on karmastro.com.</p>`;
    return { subject: "Your opinion matters to us ✦", html: wrapHtml("How did your reading feel?", content), text: `How did your reading feel? Rate it here:\nhttps://karmastro.com/avis/?token=${token}${lang}` };
  }

  const content = `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Ta lecture, ça a donné quoi&nbsp;? ✦</h1>
<p>${hi}</p>
<p>Tu as pris le temps de recevoir une lecture chez nous, et ton ressenti honnête compte beaucoup pour nous. À quel point ça a résonné&nbsp;?</p>
${starsRow}
<p style="text-align:center;font-size:13px;color:rgba(255,255,255,0.5);margin-top:4px;">Clique une étoile, puis ajoute un mot si tu veux.</p>
<p style="font-size:13px;color:rgba(255,255,255,0.45);">Ta lecture reste accessible à tout moment sur karmastro.com.</p>`;
  return { subject: "Ton avis compte pour nous ✦", html: wrapHtml("Ta lecture, ça a donné quoi ?", content), text: `Ton avis compte pour nous. Note ta lecture ici :\nhttps://karmastro.com/avis/?token=${token}${lang}` };
}

// ============================================================
// Âme Sœur : invitation à renseigner la personne concernée (après achat one-shot).
// ============================================================
export function ameSoeurCollectEmail(firstName: string | null, token: string, locale = "fr"): EmailTemplate {
  const langParam = locale && locale !== "fr" ? `&lang=${encodeURIComponent(locale)}` : "";
  const url = `https://karmastro.com/ame-soeur/?token=${token}${langParam}`;

  if (locale === "en") {
    const contentEn = `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Your Soulmate reading ✦</h1>
<p>Thank you, your Soulmate reading is reserved. To weave it, Séléné needs one last thing: the person this bond is about.</p>
<p>Open the link below and enter their first name and date of birth. Your reading is then crafted and sent to you within minutes.</p>`;
    const textEn = `Your Soulmate reading awaits.

Séléné needs one last thing: the person this bond is about. Enter their first name and date of birth here:

${url}

Your reading is crafted and sent within minutes.`;
    return { subject: "✦ One last step for your Soulmate reading", html: wrapHtml("Your Soulmate reading", contentEn, "Reveal my reading", url), text: textEn };
  }

  const name = firstName ? firstName : "cher voyageur";
  const content = `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:26px;margin:0 0 16px;">Ta lecture Âme Sœur ✦</h1>
<p>Merci ${name}, ta lecture Âme Sœur t'est réservée. Pour la tisser, Séléné a besoin d'une dernière chose : la personne dont parle ce lien.</p>
<p>Ouvre le lien ci-dessous et indique son prénom et sa date de naissance. Ta lecture est ensuite composée et t'est envoyée en quelques minutes.</p>`;
  const text = `Ta lecture Âme Sœur t'attend.

Séléné a besoin d'une dernière chose : la personne dont parle ce lien. Indique son prénom et sa date de naissance ici :

${url}

Ta lecture est composée et envoyée en quelques minutes.

« Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin`;
  return { subject: "✦ Une dernière étape pour ta lecture Âme Sœur", html: wrapHtml("Ta lecture Âme Sœur", content, "Révéler ma lecture", url), text };
}

// ============================================================
// Notification interne : une vente vient d'être encaissée.
// ============================================================
export function adminSaleEmail(productName: string, amount: string, customerEmail: string): EmailTemplate {
  const amt = amount ? ` (${amount})` : "";
  const content = `
<h1 style="color:#fff;font-family:Georgia,serif;font-size:24px;margin:0 0 16px;">Nouvelle vente Karmastro ✦</h1>
<p><strong>Produit :</strong> ${productName}${amt}</p>
<p><strong>Client :</strong> ${customerEmail || "inconnu"}</p>
<p style="font-size:13px;color:#9CA3AF;">Notification automatique du webhook Stripe.</p>`;
  const text = `Nouvelle vente Karmastro\n\nProduit : ${productName}${amt}\nClient : ${customerEmail || "inconnu"}\n\nNotification automatique du webhook Stripe.`;
  return { subject: `Karmastro, nouvelle vente : ${productName}${amt}`, html: wrapHtml("Nouvelle vente", content), text };
}

// Structured localized content : features list, FAQ, SEO meta tags
// Complements translations.ts (which holds flat UI strings)

import type { Locale } from "./config";

export type Feature = {
  title: string;
  description: string;
  icon: string;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type SEOMeta = {
  title: string;
  description: string;
};

export type LocaleContent = {
  // Hero rotating words
  heroRotatingWords: string[];
  // Homepage sections
  features: Feature[];
  featuresTitle: string;
  featuresSubtitle: string;
  faq: FAQItem[];
  faqTitle: string;
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  ctaNoCard: string;
  heroBadge: string;
  heroFreeTeaser: string;
  nasaBadge: string;
  exploreCosmosLabel: string;
  // Stats section
  statsTitle: string;
  statsSubtitle: string;
  statsLabels: { planets: string; houses: string; years: string; precision: string; tools: string; guides: string };
  statsDescriptions: { planets: string; houses: string; years: string; precision: string; tools: string; guides: string };
  // Footer
  footerLegalTitle: string;
  footerExploreTitle: string;
  footerCopyright: string;
  // SEO per page
  seo: {
    home: SEOMeta;
    horoscope: SEOMeta;
    tools: SEOMeta;
    referral: SEOMeta;
  };
};

// ============================================================
// FR
// ============================================================

const fr: LocaleContent = {
  heroRotatingWords: ["ton thème natal", "ta numérologie", "ton karma", "tes transits", "ta compatibilité", "ton chemin de vie"],
  heroBadge: "Astrologie + Numérologie + Karma",
  heroFreeTeaser: "Offert par les astres · Thème natal + 3 messages Oracle/jour",
  nasaBadge: "Calculs astronomiques précision NASA",
  exploreCosmosLabel: "Explorer Le Cosmos",
  features: [
    { title: "Thème natal complet", description: "12 planètes, 12 maisons, aspects majeurs et mineurs. Ton ciel de naissance décodé en profondeur.", icon: "star" },
    { title: "Numérologie karmique", description: "Chemin de vie, nombre d'expression, âme, dettes karmiques et pinnacles. Les nombres révèlent ta mission.", icon: "chart" },
    { title: "L'Oracle 24/7", description: "Pose tes questions à l'Oracle. Il croise ton thème natal, ta numérologie et tes cycles karmiques pour te guider.", icon: "zap" },
    { title: "Compatibilité complète", description: "Synastrie astrologique + compatibilité numérologique. Découvre les forces et défis de chaque relation.", icon: "users" },
    { title: "Calendrier cosmique", description: "Transits quotidiens, rétrogrades, phases lunaires et jours personnels numérologiques. Planifie au bon moment.", icon: "search" },
    { title: "Guidance karmique", description: "Nœuds lunaires, leçons de vie, cycles de Saturne. Comprends d'où tu viens et où tu vas.", icon: "shield" },
  ],
  featuresTitle: "Pourquoi Karmastro ?",
  featuresSubtitle: "Un écosystème spirituel qui croise 3 disciplines pour une guidance complète",
  faq: [
    { question: "Qu'est-ce que Karmastro ?", answer: "Karmastro est un écosystème spirituel intelligent qui fusionne astrologie, numérologie et guidance karmique. Tu obtiens un profil cosmique complet basé sur ta date, heure et lieu de naissance, avec l'Oracle disponible 24/7." },
    { question: "Comment fonctionne L'Oracle ?", answer: "L'Oracle analyse ton thème natal, ton chemin de vie numérologique et tes nœuds lunaires karmiques pour te donner des réponses personnalisées. Tu peux choisir parmi 4 guides : Sibylle, Orion, Séléné ou Pythia." },
    { question: "Est-ce que Karmastro est gratuit ?", answer: "Oui, la voie Éveil est offerte par les astres : profil cosmique complet, horoscope quotidien et 3 messages Oracle par jour. La voie Étoile à 5,99€/mois débloque l'Oracle illimité et bien plus." },
    { question: "Quelle est la différence avec un horoscope classique ?", answer: "Un horoscope classique se base uniquement sur ton signe solaire. Karmastro croise 3 disciplines : astrologie (12 planètes, aspects, maisons), numérologie (chemin de vie, expression, âme) et guidance karmique (nœuds lunaires, dettes, cycles)." },
    { question: "Mes données sont-elles protégées ?", answer: "Oui. Tes données personnelles et ton profil cosmique sont chiffrés et stockés de manière sécurisée. Karmastro est conforme au RGPD. Aucune donnée n'est partagée avec des tiers." },
  ],
  faqTitle: "Questions fréquentes",
  ctaTitle: "Commence ton éveil cosmique",
  ctaSubtitle: "Thème natal, chemin de vie, guidance karmique. Les astres t'attendent.",
  ctaButton: "Commencer mon éveil",
  ctaNoCard: "Aucune carte bancaire requise",
  statsTitle: "Une guidance de précision",
  statsSubtitle: "Des données astronomiques réelles, une tradition millénaire, des outils modernes. Tout ce qu'il faut pour comprendre ton ciel intérieur.",
  statsLabels: { planets: "Planètes analysées", houses: "Maisons astrologiques", years: "Années de tradition", precision: "Seconde d'arc de précision", tools: "Calculateurs gratuits", guides: "Guides cosmiques" },
  statsDescriptions: {
    planets: "Du Soleil à Pluton, chaque planète du zodiaque entre dans ton profil",
    houses: "Les 12 domaines de vie cartographiés dans ton thème natal",
    years: "Depuis les Mésopotamiens jusqu'à Kepler et Swiss Ephemeris",
    precision: "Niveau NASA Jet Propulsion Laboratory",
    tools: "Chemin de vie, thème natal, ascendant, compatibilité et plus",
    guides: "Sibylle, Orion, Séléné, Pythia — choisis celui qui te parle",
  },
  footerLegalTitle: "Informations légales",
  footerExploreTitle: "Explorer",
  footerCopyright: "Tous droits réservés",
  seo: {
    home: {
      title: "Karmastro - Ta carte de vie écrite dans les étoiles et les nombres",
      description: "Karmastro est le premier écosystème spirituel intelligent qui fusionne astrologie, numérologie et guidance karmique. Oracle 24/7, thème natal complet, calculs Swiss Ephemeris.",
    },
    horoscope: {
      title: "Horoscope quotidien gratuit - 12 signes - Karmastro",
      description: "Horoscope quotidien pour les 12 signes du zodiaque, calculé avec Swiss Ephemeris. Amour, travail, énergie et intuition du jour.",
    },
    tools: {
      title: "Calculateurs gratuits d'astrologie et numérologie - Karmastro",
      description: "9 calculateurs cosmiques gratuits : chemin de vie, ascendant, thème natal, compatibilité, transits. Méthode Swiss Ephemeris et numérologie pythagoricienne.",
    },
    referral: {
      title: "Parrainage Karmastro - Étoiles Jumelles - Invite et gagne",
      description: "Rejoins le programme Étoiles Jumelles. Invite tes proches sur Karmastro et recevez tous les deux des bonus cosmiques. Gratuit, sans limite de filleuls.",
    },
  },
};

// ============================================================
// EN
// ============================================================

const en: LocaleContent = {
  heroRotatingWords: ["your birth chart", "your numerology", "your karma", "your transits", "your compatibility", "your life path"],
  heroBadge: "Astrology + Numerology + Karma",
  heroFreeTeaser: "Gifted by the stars · Birth chart + 3 Oracle messages/day",
  nasaBadge: "NASA-grade astronomical calculations",
  exploreCosmosLabel: "Explore The Cosmos",
  features: [
    { title: "Complete birth chart", description: "12 planets, 12 houses, major and minor aspects. Your birth sky decoded in depth.", icon: "star" },
    { title: "Karmic numerology", description: "Life path, expression number, soul, karmic debts and pinnacles. Numbers reveal your mission.", icon: "chart" },
    { title: "The Oracle 24/7", description: "Ask the Oracle your questions. It crosses your birth chart, numerology and karmic cycles to guide you.", icon: "zap" },
    { title: "Complete compatibility", description: "Astrological synastry + numerological compatibility. Discover the strengths and challenges of every relationship.", icon: "users" },
    { title: "Cosmic calendar", description: "Daily transits, retrogrades, lunar phases and numerological personal days. Plan at the right moment.", icon: "search" },
    { title: "Karmic guidance", description: "Lunar nodes, life lessons, Saturn cycles. Understand where you come from and where you're going.", icon: "shield" },
  ],
  featuresTitle: "Why Karmastro?",
  featuresSubtitle: "A spiritual ecosystem crossing 3 disciplines for complete guidance",
  faq: [
    { question: "What is Karmastro?", answer: "Karmastro is an intelligent spiritual ecosystem that fuses astrology, numerology and karmic guidance. You get a complete cosmic profile based on your birth date, time and location, with the Oracle available 24/7." },
    { question: "How does The Oracle work?", answer: "The Oracle analyzes your birth chart, numerological life path and karmic lunar nodes to give you personalized answers. You can choose from 4 guides: Sibylle, Orion, Séléné or Pythia." },
    { question: "Is Karmastro free?", answer: "Yes, the Awakening tier is gifted by the stars: complete cosmic profile, daily horoscope and 3 Oracle messages per day. The Star tier at €5.99/month unlocks unlimited Oracle and much more." },
    { question: "How is it different from a classic horoscope?", answer: "A classic horoscope is based only on your sun sign. Karmastro crosses 3 disciplines: astrology (12 planets, aspects, houses), numerology (life path, expression, soul) and karmic guidance (lunar nodes, debts, cycles)." },
    { question: "Is my data protected?", answer: "Yes. Your personal data and cosmic profile are encrypted and securely stored. Karmastro is GDPR compliant. No data is shared with third parties." },
  ],
  faqTitle: "Frequently asked questions",
  ctaTitle: "Start your cosmic awakening",
  ctaSubtitle: "Birth chart, life path, karmic guidance. The stars are waiting for you.",
  ctaButton: "Start my awakening",
  ctaNoCard: "No credit card required",
  statsTitle: "Precision guidance",
  statsSubtitle: "Real astronomical data, a millennia-old tradition, modern tools. Everything you need to understand your inner sky.",
  statsLabels: { planets: "Planets analyzed", houses: "Astrological houses", years: "Years of tradition", precision: "Arc second precision", tools: "Free calculators", guides: "Cosmic guides" },
  statsDescriptions: {
    planets: "From Sun to Pluto, every zodiac planet enters your profile",
    houses: "The 12 life domains mapped in your birth chart",
    years: "From the Mesopotamians to Kepler and Swiss Ephemeris",
    precision: "NASA Jet Propulsion Laboratory level",
    tools: "Life path, birth chart, ascendant, compatibility and more",
    guides: "Sibylle, Orion, Séléné, Pythia — choose the one who speaks to you",
  },
  footerLegalTitle: "Legal information",
  footerExploreTitle: "Explore",
  footerCopyright: "All rights reserved",
  seo: {
    home: {
      title: "Karmastro - Your life map written in the stars and numbers",
      description: "Karmastro is the first intelligent spiritual ecosystem fusing astrology, numerology and karmic guidance. 24/7 Oracle, complete birth chart, Swiss Ephemeris calculations.",
    },
    horoscope: {
      title: "Free daily horoscope - 12 signs - Karmastro",
      description: "Daily horoscope for the 12 zodiac signs, calculated with Swiss Ephemeris. Love, work, energy and intuition of the day.",
    },
    tools: {
      title: "Free astrology and numerology calculators - Karmastro",
      description: "9 free cosmic calculators: life path, ascendant, birth chart, compatibility, transits. Swiss Ephemeris method and Pythagorean numerology.",
    },
    referral: {
      title: "Karmastro Referral - Twin Stars - Invite and earn",
      description: "Join the Twin Stars program. Invite your loved ones to Karmastro and both receive cosmic bonuses. Free, unlimited referrals.",
    },
  },
};

// ============================================================
// ES
// ============================================================

const es: LocaleContent = {
  heroRotatingWords: ["tu carta natal", "tu numerología", "tu karma", "tus tránsitos", "tu compatibilidad", "tu camino de vida"],
  heroBadge: "Astrología + Numerología + Karma",
  heroFreeTeaser: "Regalado por los astros · Carta natal + 3 mensajes Oráculo/día",
  nasaBadge: "Cálculos astronómicos precisión NASA",
  exploreCosmosLabel: "Explorar El Cosmos",
  features: [
    { title: "Carta natal completa", description: "12 planetas, 12 casas, aspectos mayores y menores. Tu cielo natal descifrado en profundidad.", icon: "star" },
    { title: "Numerología kármica", description: "Camino de vida, número de expresión, alma, deudas kármicas y pináculos. Los números revelan tu misión.", icon: "chart" },
    { title: "El Oráculo 24/7", description: "Haz tus preguntas al Oráculo. Cruza tu carta natal, tu numerología y tus ciclos kármicos para guiarte.", icon: "zap" },
    { title: "Compatibilidad completa", description: "Sinastría astrológica + compatibilidad numerológica. Descubre las fortalezas y retos de cada relación.", icon: "users" },
    { title: "Calendario cósmico", description: "Tránsitos diarios, retrógrados, fases lunares y días personales numerológicos. Planifica en el momento justo.", icon: "search" },
    { title: "Guía kármica", description: "Nodos lunares, lecciones de vida, ciclos de Saturno. Entiende de dónde vienes y a dónde vas.", icon: "shield" },
  ],
  featuresTitle: "¿Por qué Karmastro?",
  featuresSubtitle: "Un ecosistema espiritual que cruza 3 disciplinas para una guía completa",
  faq: [
    { question: "¿Qué es Karmastro?", answer: "Karmastro es un ecosistema espiritual inteligente que fusiona astrología, numerología y guía kármica. Obtienes un perfil cósmico completo basado en tu fecha, hora y lugar de nacimiento, con el Oráculo disponible 24/7." },
    { question: "¿Cómo funciona El Oráculo?", answer: "El Oráculo analiza tu carta natal, tu camino de vida numerológico y tus nodos lunares kármicos para darte respuestas personalizadas. Puedes elegir entre 4 guías: Sibila, Orión, Selene o Pitia." },
    { question: "¿Karmastro es gratis?", answer: "Sí, la vía Despertar es un regalo de los astros: perfil cósmico completo, horóscopo diario y 3 mensajes Oráculo al día. La vía Estrella a 5,99€/mes desbloquea el Oráculo ilimitado y mucho más." },
    { question: "¿Cuál es la diferencia con un horóscopo clásico?", answer: "Un horóscopo clásico se basa solo en tu signo solar. Karmastro cruza 3 disciplinas: astrología (12 planetas, aspectos, casas), numerología (camino de vida, expresión, alma) y guía kármica (nodos lunares, deudas, ciclos)." },
    { question: "¿Mis datos están protegidos?", answer: "Sí. Tus datos personales y perfil cósmico están cifrados y almacenados de forma segura. Karmastro cumple con el RGPD. Ningún dato se comparte con terceros." },
  ],
  faqTitle: "Preguntas frecuentes",
  ctaTitle: "Empieza tu despertar cósmico",
  ctaSubtitle: "Carta natal, camino de vida, guía kármica. Los astros te esperan.",
  ctaButton: "Comenzar mi despertar",
  ctaNoCard: "No se requiere tarjeta bancaria",
  statsTitle: "Una guía de precisión",
  statsSubtitle: "Datos astronómicos reales, una tradición milenaria, herramientas modernas. Todo lo necesario para entender tu cielo interior.",
  statsLabels: { planets: "Planetas analizados", houses: "Casas astrológicas", years: "Años de tradición", precision: "Segundo de arco de precisión", tools: "Calculadoras gratuitas", guides: "Guías cósmicos" },
  statsDescriptions: {
    planets: "Del Sol a Plutón, cada planeta del zodíaco entra en tu perfil",
    houses: "Los 12 dominios de vida mapeados en tu carta natal",
    years: "Desde los mesopotámicos hasta Kepler y Swiss Ephemeris",
    precision: "Nivel NASA Jet Propulsion Laboratory",
    tools: "Camino de vida, carta natal, ascendente, compatibilidad y más",
    guides: "Sibila, Orión, Selene, Pitia — elige el que te habla",
  },
  footerLegalTitle: "Información legal",
  footerExploreTitle: "Explorar",
  footerCopyright: "Todos los derechos reservados",
  seo: {
    home: {
      title: "Karmastro - Tu mapa de vida escrito en las estrellas y los números",
      description: "Karmastro es el primer ecosistema espiritual inteligente que fusiona astrología, numerología y guía kármica. Oráculo 24/7, carta natal completa, cálculos Swiss Ephemeris.",
    },
    horoscope: {
      title: "Horóscopo diario gratuito - 12 signos - Karmastro",
      description: "Horóscopo diario para los 12 signos del zodíaco, calculado con Swiss Ephemeris. Amor, trabajo, energía e intuición del día.",
    },
    tools: {
      title: "Calculadoras gratuitas de astrología y numerología - Karmastro",
      description: "9 calculadoras cósmicas gratuitas: camino de vida, ascendente, carta natal, compatibilidad, tránsitos. Método Swiss Ephemeris y numerología pitagórica.",
    },
    referral: {
      title: "Programa de referidos Karmastro - Estrellas Gemelas",
      description: "Únete al programa Estrellas Gemelas. Invita a tus allegados a Karmastro y ambos reciban bonos cósmicos. Gratis, sin límite de referidos.",
    },
  },
};

// ============================================================
// PT
// ============================================================

const pt: LocaleContent = {
  heroRotatingWords: ["o teu mapa natal", "a tua numerologia", "o teu karma", "os teus trânsitos", "a tua compatibilidade", "o teu caminho de vida"],
  heroBadge: "Astrologia + Numerologia + Karma",
  heroFreeTeaser: "Oferecido pelos astros · Mapa natal + 3 mensagens Oráculo/dia",
  nasaBadge: "Cálculos astronómicos precisão NASA",
  exploreCosmosLabel: "Explorar O Cosmos",
  features: [
    { title: "Mapa natal completo", description: "12 planetas, 12 casas, aspetos maiores e menores. O teu céu de nascimento descodificado em profundidade.", icon: "star" },
    { title: "Numerologia kármica", description: "Caminho de vida, número de expressão, alma, dívidas kármicas e pináculos. Os números revelam a tua missão.", icon: "chart" },
    { title: "O Oráculo 24/7", description: "Faz as tuas perguntas ao Oráculo. Cruza o teu mapa natal, numerologia e ciclos kármicos para te orientar.", icon: "zap" },
    { title: "Compatibilidade completa", description: "Sinastria astrológica + compatibilidade numerológica. Descobre as forças e desafios de cada relação.", icon: "users" },
    { title: "Calendário cósmico", description: "Trânsitos diários, retrógrados, fases lunares e dias pessoais numerológicos. Planeia no momento certo.", icon: "search" },
    { title: "Orientação kármica", description: "Nodos lunares, lições de vida, ciclos de Saturno. Compreende de onde vens e para onde vais.", icon: "shield" },
  ],
  featuresTitle: "Porquê Karmastro?",
  featuresSubtitle: "Um ecossistema espiritual que cruza 3 disciplinas para uma orientação completa",
  faq: [
    { question: "O que é Karmastro?", answer: "Karmastro é um ecossistema espiritual inteligente que funde astrologia, numerologia e orientação kármica. Obténs um perfil cósmico completo baseado na tua data, hora e local de nascimento, com o Oráculo disponível 24/7." },
    { question: "Como funciona O Oráculo?", answer: "O Oráculo analisa o teu mapa natal, caminho de vida numerológico e nodos lunares kármicos para te dar respostas personalizadas. Podes escolher entre 4 guias: Sibila, Órion, Selene ou Pítia." },
    { question: "Karmastro é gratuito?", answer: "Sim, a via Despertar é oferecida pelos astros: perfil cósmico completo, horóscopo diário e 3 mensagens Oráculo por dia. A via Estrela a 5,99€/mês desbloqueia o Oráculo ilimitado e muito mais." },
    { question: "Qual a diferença de um horóscopo clássico?", answer: "Um horóscopo clássico baseia-se apenas no teu signo solar. Karmastro cruza 3 disciplinas: astrologia (12 planetas, aspetos, casas), numerologia (caminho de vida, expressão, alma) e orientação kármica (nodos lunares, dívidas, ciclos)." },
    { question: "Os meus dados estão protegidos?", answer: "Sim. Os teus dados pessoais e perfil cósmico são encriptados e armazenados de forma segura. Karmastro cumpre o RGPD. Nenhum dado é partilhado com terceiros." },
  ],
  faqTitle: "Perguntas frequentes",
  ctaTitle: "Começa o teu despertar cósmico",
  ctaSubtitle: "Mapa natal, caminho de vida, orientação kármica. Os astros esperam por ti.",
  ctaButton: "Começar o meu despertar",
  ctaNoCard: "Não é necessário cartão bancário",
  statsTitle: "Uma orientação de precisão",
  statsSubtitle: "Dados astronómicos reais, uma tradição milenar, ferramentas modernas. Tudo o que precisas para compreender o teu céu interior.",
  statsLabels: { planets: "Planetas analisados", houses: "Casas astrológicas", years: "Anos de tradição", precision: "Segundo de arco de precisão", tools: "Calculadoras gratuitas", guides: "Guias cósmicos" },
  statsDescriptions: {
    planets: "Do Sol a Plutão, cada planeta do zodíaco entra no teu perfil",
    houses: "Os 12 domínios da vida mapeados no teu mapa natal",
    years: "Desde os mesopotâmios até Kepler e Swiss Ephemeris",
    precision: "Nível NASA Jet Propulsion Laboratory",
    tools: "Caminho de vida, mapa natal, ascendente, compatibilidade e mais",
    guides: "Sibila, Órion, Selene, Pítia — escolhe o que te fala",
  },
  footerLegalTitle: "Informações legais",
  footerExploreTitle: "Explorar",
  footerCopyright: "Todos os direitos reservados",
  seo: {
    home: {
      title: "Karmastro - O teu mapa de vida escrito nas estrelas e nos números",
      description: "Karmastro é o primeiro ecossistema espiritual inteligente que funde astrologia, numerologia e orientação kármica. Oráculo 24/7, mapa natal completo, cálculos Swiss Ephemeris.",
    },
    horoscope: {
      title: "Horóscopo diário gratuito - 12 signos - Karmastro",
      description: "Horóscopo diário para os 12 signos do zodíaco, calculado com Swiss Ephemeris. Amor, trabalho, energia e intuição do dia.",
    },
    tools: {
      title: "Calculadoras gratuitas de astrologia e numerologia - Karmastro",
      description: "9 calculadoras cósmicas gratuitas: caminho de vida, ascendente, mapa natal, compatibilidade, trânsitos. Método Swiss Ephemeris e numerologia pitagórica.",
    },
    referral: {
      title: "Programa de indicações Karmastro - Estrelas Gémeas",
      description: "Junta-te ao programa Estrelas Gémeas. Convida os teus próximos para Karmastro e ambos recebam bónus cósmicos. Grátis, sem limite de indicações.",
    },
  },
};

// ============================================================
// DE
// ============================================================

const de: LocaleContent = {
  heroRotatingWords: ["dein Geburtshoroskop", "deine Numerologie", "dein Karma", "deine Transite", "deine Kompatibilität", "deinen Lebensweg"],
  heroBadge: "Astrologie + Numerologie + Karma",
  heroFreeTeaser: "Von den Sternen geschenkt · Geburtshoroskop + 3 Orakelnachrichten/Tag",
  nasaBadge: "Astronomische Berechnungen NASA-Präzision",
  exploreCosmosLabel: "Den Kosmos erkunden",
  features: [
    { title: "Komplettes Geburtshoroskop", description: "12 Planeten, 12 Häuser, große und kleine Aspekte. Dein Geburtshimmel tiefgründig entschlüsselt.", icon: "star" },
    { title: "Karmische Numerologie", description: "Lebensweg, Ausdruckszahl, Seele, karmische Schulden und Höhepunkte. Zahlen enthüllen deine Mission.", icon: "chart" },
    { title: "Das Orakel rund um die Uhr", description: "Stelle dem Orakel deine Fragen. Es verbindet dein Geburtshoroskop, deine Numerologie und deine karmischen Zyklen, um dich zu führen.", icon: "zap" },
    { title: "Komplette Kompatibilität", description: "Astrologische Synastrie + numerologische Kompatibilität. Entdecke die Stärken und Herausforderungen jeder Beziehung.", icon: "users" },
    { title: "Kosmischer Kalender", description: "Tägliche Transite, Rückläufe, Mondphasen und numerologische persönliche Tage. Plane zum richtigen Moment.", icon: "search" },
    { title: "Karmische Führung", description: "Mondknoten, Lebenslektionen, Saturn-Zyklen. Verstehe, woher du kommst und wohin du gehst.", icon: "shield" },
  ],
  featuresTitle: "Warum Karmastro?",
  featuresSubtitle: "Ein spirituelles Ökosystem, das 3 Disziplinen für eine vollständige Führung kreuzt",
  faq: [
    { question: "Was ist Karmastro?", answer: "Karmastro ist ein intelligentes spirituelles Ökosystem, das Astrologie, Numerologie und karmische Führung verschmilzt. Du erhältst ein vollständiges kosmisches Profil basierend auf deinem Geburtsdatum, deiner Geburtszeit und deinem Geburtsort, mit dem Orakel rund um die Uhr verfügbar." },
    { question: "Wie funktioniert Das Orakel?", answer: "Das Orakel analysiert dein Geburtshoroskop, deinen numerologischen Lebensweg und deine karmischen Mondknoten, um dir personalisierte Antworten zu geben. Du kannst zwischen 4 Führern wählen: Sibylle, Orion, Selene oder Pythia." },
    { question: "Ist Karmastro kostenlos?", answer: "Ja, der Erwachen-Pfad wird von den Sternen geschenkt: vollständiges kosmisches Profil, tägliches Horoskop und 3 Orakelnachrichten pro Tag. Der Stern-Pfad für 5,99€/Monat schaltet das unbegrenzte Orakel und vieles mehr frei." },
    { question: "Was ist der Unterschied zu einem klassischen Horoskop?", answer: "Ein klassisches Horoskop basiert nur auf deinem Sonnenzeichen. Karmastro kreuzt 3 Disziplinen: Astrologie (12 Planeten, Aspekte, Häuser), Numerologie (Lebensweg, Ausdruck, Seele) und karmische Führung (Mondknoten, Schulden, Zyklen)." },
    { question: "Sind meine Daten geschützt?", answer: "Ja. Deine persönlichen Daten und dein kosmisches Profil werden verschlüsselt und sicher gespeichert. Karmastro ist DSGVO-konform. Keine Daten werden mit Dritten geteilt." },
  ],
  faqTitle: "Häufige Fragen",
  ctaTitle: "Beginne dein kosmisches Erwachen",
  ctaSubtitle: "Geburtshoroskop, Lebensweg, karmische Führung. Die Sterne warten auf dich.",
  ctaButton: "Mein Erwachen starten",
  ctaNoCard: "Keine Kreditkarte erforderlich",
  statsTitle: "Präzisionsführung",
  statsSubtitle: "Echte astronomische Daten, eine jahrtausendealte Tradition, moderne Werkzeuge. Alles, was du brauchst, um deinen inneren Himmel zu verstehen.",
  statsLabels: { planets: "Analysierte Planeten", houses: "Astrologische Häuser", years: "Jahre Tradition", precision: "Bogensekunden Genauigkeit", tools: "Kostenlose Rechner", guides: "Kosmische Führer" },
  statsDescriptions: {
    planets: "Von der Sonne bis Pluto, jeder Planet des Tierkreises fließt in dein Profil ein",
    houses: "Die 12 Lebensbereiche in deinem Geburtshoroskop kartiert",
    years: "Von den Mesopotamiern bis Kepler und Swiss Ephemeris",
    precision: "NASA Jet Propulsion Laboratory Niveau",
    tools: "Lebensweg, Geburtshoroskop, Aszendent, Kompatibilität und mehr",
    guides: "Sibylle, Orion, Selene, Pythia — wähle die, die zu dir spricht",
  },
  footerLegalTitle: "Rechtliche Informationen",
  footerExploreTitle: "Entdecken",
  footerCopyright: "Alle Rechte vorbehalten",
  seo: {
    home: {
      title: "Karmastro - Deine Lebenskarte in den Sternen und Zahlen",
      description: "Karmastro ist das erste intelligente spirituelle Ökosystem, das Astrologie, Numerologie und karmische Führung verschmilzt. 24/7 Orakel, komplettes Geburtshoroskop, Swiss Ephemeris Berechnungen.",
    },
    horoscope: {
      title: "Kostenloses Tageshoroskop - 12 Zeichen - Karmastro",
      description: "Tägliches Horoskop für die 12 Tierkreiszeichen, berechnet mit Swiss Ephemeris. Liebe, Arbeit, Energie und Intuition des Tages.",
    },
    tools: {
      title: "Kostenlose Astrologie- und Numerologie-Rechner - Karmastro",
      description: "9 kostenlose kosmische Rechner: Lebensweg, Aszendent, Geburtshoroskop, Kompatibilität, Transite. Swiss Ephemeris und pythagoräische Numerologie.",
    },
    referral: {
      title: "Karmastro Empfehlungsprogramm - Zwillingssterne",
      description: "Tritt dem Zwillingssterne-Programm bei. Lade deine Lieben zu Karmastro ein und erhaltet beide kosmische Boni. Kostenlos, unbegrenzte Empfehlungen.",
    },
  },
};

// ============================================================
// IT
// ============================================================

const it: LocaleContent = {
  heroRotatingWords: ["il tuo tema natale", "la tua numerologia", "il tuo karma", "i tuoi transiti", "la tua compatibilità", "il tuo cammino di vita"],
  heroBadge: "Astrologia + Numerologia + Karma",
  heroFreeTeaser: "Regalato dagli astri · Tema natale + 3 messaggi Oracolo/giorno",
  nasaBadge: "Calcoli astronomici precisione NASA",
  exploreCosmosLabel: "Esplora Il Cosmo",
  features: [
    { title: "Tema natale completo", description: "12 pianeti, 12 case, aspetti maggiori e minori. Il tuo cielo natale decodificato in profondità.", icon: "star" },
    { title: "Numerologia karmica", description: "Cammino di vita, numero di espressione, anima, debiti karmici e pinnacoli. I numeri rivelano la tua missione.", icon: "chart" },
    { title: "L'Oracolo 24/7", description: "Fai le tue domande all'Oracolo. Incrocia il tuo tema natale, la numerologia e i cicli karmici per guidarti.", icon: "zap" },
    { title: "Compatibilità completa", description: "Sinastria astrologica + compatibilità numerologica. Scopri le forze e le sfide di ogni relazione.", icon: "users" },
    { title: "Calendario cosmico", description: "Transiti quotidiani, retrogradazioni, fasi lunari e giorni personali numerologici. Pianifica al momento giusto.", icon: "search" },
    { title: "Guida karmica", description: "Nodi lunari, lezioni di vita, cicli di Saturno. Comprendi da dove vieni e dove vai.", icon: "shield" },
  ],
  featuresTitle: "Perché Karmastro?",
  featuresSubtitle: "Un ecosistema spirituale che incrocia 3 discipline per una guida completa",
  faq: [
    { question: "Cos'è Karmastro?", answer: "Karmastro è un ecosistema spirituale intelligente che fonde astrologia, numerologia e guida karmica. Ottieni un profilo cosmico completo basato sulla tua data, ora e luogo di nascita, con l'Oracolo disponibile 24/7." },
    { question: "Come funziona L'Oracolo?", answer: "L'Oracolo analizza il tuo tema natale, il tuo cammino di vita numerologico e i tuoi nodi lunari karmici per darti risposte personalizzate. Puoi scegliere tra 4 guide: Sibilla, Orione, Selene o Pizia." },
    { question: "Karmastro è gratuito?", answer: "Sì, la via del Risveglio è regalata dagli astri: profilo cosmico completo, oroscopo quotidiano e 3 messaggi Oracolo al giorno. La via della Stella a 5,99€/mese sblocca l'Oracolo illimitato e molto altro." },
    { question: "Qual è la differenza con un oroscopo classico?", answer: "Un oroscopo classico si basa solo sul tuo segno solare. Karmastro incrocia 3 discipline: astrologia (12 pianeti, aspetti, case), numerologia (cammino di vita, espressione, anima) e guida karmica (nodi lunari, debiti, cicli)." },
    { question: "I miei dati sono protetti?", answer: "Sì. I tuoi dati personali e profilo cosmico sono crittografati e archiviati in modo sicuro. Karmastro è conforme al GDPR. Nessun dato viene condiviso con terze parti." },
  ],
  faqTitle: "Domande frequenti",
  ctaTitle: "Inizia il tuo risveglio cosmico",
  ctaSubtitle: "Tema natale, cammino di vita, guida karmica. Gli astri ti aspettano.",
  ctaButton: "Inizia il mio risveglio",
  ctaNoCard: "Nessuna carta di credito richiesta",
  statsTitle: "Una guida di precisione",
  statsSubtitle: "Dati astronomici reali, una tradizione millenaria, strumenti moderni. Tutto quello che serve per capire il tuo cielo interiore.",
  statsLabels: { planets: "Pianeti analizzati", houses: "Case astrologiche", years: "Anni di tradizione", precision: "Secondo d'arco di precisione", tools: "Calcolatori gratuiti", guides: "Guide cosmiche" },
  statsDescriptions: {
    planets: "Dal Sole a Plutone, ogni pianeta dello zodiaco entra nel tuo profilo",
    houses: "I 12 domini della vita mappati nel tuo tema natale",
    years: "Dai mesopotamici a Keplero e Swiss Ephemeris",
    precision: "Livello NASA Jet Propulsion Laboratory",
    tools: "Cammino di vita, tema natale, ascendente, compatibilità e altro",
    guides: "Sibilla, Orione, Selene, Pizia — scegli quella che ti parla",
  },
  footerLegalTitle: "Informazioni legali",
  footerExploreTitle: "Esplorare",
  footerCopyright: "Tutti i diritti riservati",
  seo: {
    home: {
      title: "Karmastro - La tua mappa di vita scritta nelle stelle e nei numeri",
      description: "Karmastro è il primo ecosistema spirituale intelligente che fonde astrologia, numerologia e guida karmica. Oracolo 24/7, tema natale completo, calcoli Swiss Ephemeris.",
    },
    horoscope: {
      title: "Oroscopo quotidiano gratuito - 12 segni - Karmastro",
      description: "Oroscopo quotidiano per i 12 segni dello zodiaco, calcolato con Swiss Ephemeris. Amore, lavoro, energia e intuizione del giorno.",
    },
    tools: {
      title: "Calcolatori gratuiti di astrologia e numerologia - Karmastro",
      description: "9 calcolatori cosmici gratuiti: cammino di vita, ascendente, tema natale, compatibilità, transiti. Metodo Swiss Ephemeris e numerologia pitagorica.",
    },
    referral: {
      title: "Programma Karmastro - Stelle Gemelle",
      description: "Unisciti al programma Stelle Gemelle. Invita i tuoi cari a Karmastro e riceverete entrambi bonus cosmici. Gratis, senza limiti di referral.",
    },
  },
};

// For the 5 remaining languages (TR, PL, RU, JA, AR), we provide SEO + basic
// strings now. Features/FAQ fall back to English for those languages.
// This can be extended progressively.

function contentWithEnglishFallback(seo: LocaleContent["seo"], overrides: Partial<LocaleContent> = {}): LocaleContent {
  return {
    ...en,
    ...overrides,
    seo,
  };
}

const tr: LocaleContent = contentWithEnglishFallback({
  home: {
    title: "Karmastro - Yıldızlarda ve sayılarda yazılı hayat haritanız",
    description: "Karmastro, astroloji, numeroloji ve karmik rehberliği birleştiren ilk akıllı ruhani ekosistem. 7/24 Kahin, tam doğum haritası, Swiss Ephemeris hesaplamaları.",
  },
  horoscope: {
    title: "Ücretsiz günlük burç - 12 burç - Karmastro",
    description: "12 burç için Swiss Ephemeris ile hesaplanan günlük burç. Günün aşkı, işi, enerjisi ve sezgisi.",
  },
  tools: {
    title: "Ücretsiz astroloji ve numeroloji hesaplayıcıları - Karmastro",
    description: "9 ücretsiz kozmik hesaplayıcı: hayat yolu, yükselen, doğum haritası, uyumluluk, transitler.",
  },
  referral: {
    title: "Karmastro Davet Programı - İkiz Yıldızlar",
    description: "İkiz Yıldızlar programına katılın. Sevdiklerinizi Karmastro'ya davet edin ve kozmik bonuslar kazanın.",
  },
});

const pl: LocaleContent = contentWithEnglishFallback({
  home: {
    title: "Karmastro - Twoja mapa życia zapisana w gwiazdach i liczbach",
    description: "Karmastro to pierwszy inteligentny ekosystem duchowy łączący astrologię, numerologię i przewodnictwo karmiczne. Wyrocznia 24/7, pełny horoskop urodzeniowy, Swiss Ephemeris.",
  },
  horoscope: {
    title: "Darmowy codzienny horoskop - 12 znaków - Karmastro",
    description: "Codzienny horoskop dla 12 znaków zodiaku, obliczony z Swiss Ephemeris. Miłość, praca, energia i intuicja dnia.",
  },
  tools: {
    title: "Darmowe kalkulatory astrologii i numerologii - Karmastro",
    description: "9 darmowych kalkulatorów kosmicznych: droga życia, ascendent, horoskop urodzeniowy, kompatybilność, tranzyty.",
  },
  referral: {
    title: "Program polecający Karmastro - Gwiazdy Bliźniacze",
    description: "Dołącz do programu Gwiazdy Bliźniacze. Zaproś bliskich do Karmastro i oboje otrzymajcie kosmiczne bonusy.",
  },
});

const ru: LocaleContent = contentWithEnglishFallback({
  home: {
    title: "Karmastro - Твоя карта жизни, записанная в звёздах и числах",
    description: "Karmastro - первая умная духовная экосистема, объединяющая астрологию, нумерологию и кармическое руководство. Оракул 24/7, полная натальная карта, Swiss Ephemeris.",
  },
  horoscope: {
    title: "Бесплатный ежедневный гороскоп - 12 знаков - Karmastro",
    description: "Ежедневный гороскоп для 12 знаков зодиака, рассчитанный с помощью Swiss Ephemeris. Любовь, работа, энергия и интуиция дня.",
  },
  tools: {
    title: "Бесплатные калькуляторы астрологии и нумерологии - Karmastro",
    description: "9 бесплатных космических калькуляторов: путь жизни, асцендент, натальная карта, совместимость, транзиты.",
  },
  referral: {
    title: "Программа рефералов Karmastro - Звёзды-Близнецы",
    description: "Присоединяйся к программе Звёзды-Близнецы. Пригласи близких на Karmastro и получите космические бонусы.",
  },
});

const ja: LocaleContent = contentWithEnglishFallback({
  home: {
    title: "Karmastro - 星々と数字に書かれたあなたの人生地図",
    description: "Karmastroは、占星術、数秘術、カルマ的ガイダンスを融合させた最初のインテリジェントなスピリチュアルエコシステム。24時間オラクル、完全な出生図、Swiss Ephemeris計算。",
  },
  horoscope: {
    title: "無料デイリーホロスコープ - 12星座 - Karmastro",
    description: "Swiss Ephemerisで計算された12星座のデイリーホロスコープ。その日の恋愛、仕事、エネルギー、直感。",
  },
  tools: {
    title: "無料占星術・数秘術計算機 - Karmastro",
    description: "9つの無料コスミック計算機:人生の道、アセンダント、出生図、相性、トランジット。",
  },
  referral: {
    title: "Karmastro紹介プログラム - ツインスター",
    description: "ツインスタープログラムに参加。大切な人をKarmastroに招待して、コスミックボーナスを受け取ろう。",
  },
});

const ar: LocaleContent = contentWithEnglishFallback({
  home: {
    title: "Karmastro - خريطة حياتك مكتوبة في النجوم والأرقام",
    description: "Karmastro هي أول منظومة روحية ذكية تدمج التنجيم وعلم الأعداد والإرشاد الكرمي. عراف على مدار الساعة، خريطة ولادة كاملة، حسابات Swiss Ephemeris.",
  },
  horoscope: {
    title: "برج يومي مجاني - 12 برجاً - Karmastro",
    description: "برج يومي لأبراج الزودياك الاثني عشر، محسوب بـ Swiss Ephemeris. حب، عمل، طاقة وحدس اليوم.",
  },
  tools: {
    title: "حاسبات تنجيم وعلم أعداد مجانية - Karmastro",
    description: "9 حاسبات كونية مجانية: مسار الحياة، الطالع، خريطة الولادة، التوافق، العبور.",
  },
  referral: {
    title: "برنامج إحالة Karmastro - النجوم التوأم",
    description: "انضم إلى برنامج النجوم التوأم. ادعُ أحبائك إلى Karmastro واحصلا على مكافآت كونية.",
  },
});

// ============================================================
// Map
// ============================================================

export const content: Record<Locale, LocaleContent> = {
  fr,
  en,
  es,
  pt,
  de,
  it,
  tr,
  pl,
  ru,
  ja,
  ar,
};

export function getContent(locale: Locale): LocaleContent {
  return content[locale] || content.fr;
}

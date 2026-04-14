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
    guides: "Sibylle, Orion, Séléné, Pythia - choisis celui qui te parle",
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
    guides: "Sibylle, Orion, Séléné, Pythia - choose the one who speaks to you",
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
    guides: "Sibila, Orión, Selene, Pitia - elige el que te habla",
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
    guides: "Sibila, Órion, Selene, Pítia - escolhe o que te fala",
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
    guides: "Sibylle, Orion, Selene, Pythia - wähle die, die zu dir spricht",
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
    guides: "Sibilla, Orione, Selene, Pizia - scegli quella che ti parla",
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

// ============================================================
// TR
// ============================================================

const tr: LocaleContent = {
  heroRotatingWords: ["doğum haritanı", "numerolojini", "karmanı", "transitlerini", "uyumunu", "hayat yolunu"],
  heroBadge: "Astroloji + Numeroloji + Karma",
  heroFreeTeaser: "Yıldızların hediyesi · Doğum haritası + günlük 3 Kahin mesajı",
  nasaBadge: "NASA hassasiyetinde astronomik hesaplamalar",
  exploreCosmosLabel: "Kozmosu Keşfet",
  features: [
    { title: "Tam doğum haritası", description: "12 gezegen, 12 ev, büyük ve küçük açılar. Doğum göğün derinlemesine çözümleniyor.", icon: "star" },
    { title: "Karmik numeroloji", description: "Hayat yolu, ifade sayısı, ruh, karmik borçlar ve zirveler. Sayılar misyonunu ortaya çıkarır.", icon: "chart" },
    { title: "Kahin 7/24", description: "Sorularını Kahin'e sor. Doğum haritanı, numerolojini ve karmik döngülerini birleştirerek sana yol gösterir.", icon: "zap" },
    { title: "Eksiksiz uyumluluk", description: "Astrolojik sinastri + numerolojik uyumluluk. Her ilişkinin güçlerini ve zorluklarını keşfet.", icon: "users" },
    { title: "Kozmik takvim", description: "Günlük transitler, retrolar, ay evreleri ve numerolojik kişisel günler. Doğru anda planla.", icon: "search" },
    { title: "Karmik rehberlik", description: "Ay düğümleri, hayat dersleri, Satürn döngüleri. Nereden geldiğini ve nereye gittiğini anla.", icon: "shield" },
  ],
  featuresTitle: "Neden Karmastro?",
  featuresSubtitle: "Eksiksiz bir rehberlik için 3 disiplini birleştiren ruhani bir ekosistem",
  faq: [
    { question: "Karmastro nedir?", answer: "Karmastro, astroloji, numeroloji ve karmik rehberliği birleştiren akıllı bir ruhani ekosistemdir. Doğum tarihin, saatin ve yerine dayalı eksiksiz bir kozmik profil ve 7/24 Kahin erişimi sunar." },
    { question: "Kahin nasıl çalışır?", answer: "Kahin doğum haritanı, numerolojik hayat yolunu ve karmik ay düğümlerini analiz ederek sana kişiselleştirilmiş yanıtlar verir. 4 rehber arasından seçim yapabilirsin: Sibylle, Orion, Séléné veya Pythia." },
    { question: "Karmastro ücretsiz mi?", answer: "Evet, Uyanış yolu yıldızların hediyesidir: eksiksiz kozmik profil, günlük burç ve günde 3 Kahin mesajı. Aylık 5,99€ Yıldız yolu sınırsız Kahin'i ve çok daha fazlasını açar." },
    { question: "Klasik burçtan farkı ne?", answer: "Klasik burç sadece güneş burcuna dayanır. Karmastro 3 disiplini birleştirir: astroloji (12 gezegen, açılar, evler), numeroloji (hayat yolu, ifade, ruh) ve karmik rehberlik (ay düğümleri, borçlar, döngüler)." },
    { question: "Verilerim korunuyor mu?", answer: "Evet. Kişisel verilerin ve kozmik profilin şifrelenerek güvenli şekilde saklanır. Karmastro GDPR uyumludur. Hiçbir veri üçüncü taraflarla paylaşılmaz." },
  ],
  faqTitle: "Sıkça sorulan sorular",
  ctaTitle: "Kozmik uyanışına başla",
  ctaSubtitle: "Doğum haritası, hayat yolu, karmik rehberlik. Yıldızlar seni bekliyor.",
  ctaButton: "Uyanışıma başla",
  ctaNoCard: "Kredi kartı gerekmez",
  statsTitle: "Hassas bir rehberlik",
  statsSubtitle: "Gerçek astronomik veriler, binlerce yıllık gelenek, modern araçlar. İç göğünü anlamak için ihtiyacın olan her şey.",
  statsLabels: { planets: "Analiz edilen gezegen", houses: "Astrolojik ev", years: "Yıllık gelenek", precision: "Yay saniyesi hassasiyet", tools: "Ücretsiz hesaplayıcı", guides: "Kozmik rehber" },
  statsDescriptions: {
    planets: "Güneş'ten Plüton'a, zodyağın her gezegeni profiline giriyor",
    houses: "Doğum haritanda haritalanan 12 yaşam alanı",
    years: "Mezopotamyalılardan Kepler'e ve Swiss Ephemeris'e",
    precision: "NASA Jet Propulsion Laboratory seviyesi",
    tools: "Hayat yolu, doğum haritası, yükselen, uyumluluk ve daha fazlası",
    guides: "Sibylle, Orion, Séléné, Pythia · sana hitap edeni seç",
  },
  footerLegalTitle: "Yasal bilgiler",
  footerExploreTitle: "Keşfet",
  footerCopyright: "Tüm hakları saklıdır",
  seo: {
    home: {
      title: "Karmastro - Yıldızlarda ve sayılarda yazılı hayat haritan",
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
  },
};

// ============================================================
// PL
// ============================================================

const pl: LocaleContent = {
  heroRotatingWords: ["twój horoskop urodzeniowy", "twoja numerologia", "twoja karma", "twoje tranzyty", "twoja kompatybilność", "twoja droga życia"],
  heroBadge: "Astrologia + Numerologia + Karma",
  heroFreeTeaser: "Dar gwiazd · Horoskop urodzeniowy + 3 wiadomości Wyroczni dziennie",
  nasaBadge: "Obliczenia astronomiczne precyzji NASA",
  exploreCosmosLabel: "Odkryj Kosmos",
  features: [
    { title: "Pełny horoskop urodzeniowy", description: "12 planet, 12 domów, aspekty główne i poboczne. Twoje niebo urodzeniowe odczytane dogłębnie.", icon: "star" },
    { title: "Numerologia karmiczna", description: "Droga życia, liczba ekspresji, dusza, długi karmiczne i szczyty. Liczby ujawniają twoją misję.", icon: "chart" },
    { title: "Wyrocznia 24/7", description: "Zadaj Wyroczni pytania. Łączy twój horoskop urodzeniowy, numerologię i cykle karmiczne, aby cię prowadzić.", icon: "zap" },
    { title: "Pełna kompatybilność", description: "Synastria astrologiczna + kompatybilność numerologiczna. Odkryj mocne strony i wyzwania każdej relacji.", icon: "users" },
    { title: "Kosmiczny kalendarz", description: "Codzienne tranzyty, retrogradacje, fazy Księżyca i numerologiczne dni osobiste. Planuj w odpowiednim momencie.", icon: "search" },
    { title: "Karmiczne przewodnictwo", description: "Węzły księżycowe, lekcje życia, cykle Saturna. Zrozum skąd pochodzisz i dokąd zmierzasz.", icon: "shield" },
  ],
  featuresTitle: "Dlaczego Karmastro?",
  featuresSubtitle: "Duchowy ekosystem łączący 3 dyscypliny dla pełnego przewodnictwa",
  faq: [
    { question: "Czym jest Karmastro?", answer: "Karmastro to inteligentny ekosystem duchowy łączący astrologię, numerologię i przewodnictwo karmiczne. Otrzymujesz pełny profil kosmiczny oparty na dacie, godzinie i miejscu urodzenia, z Wyrocznią dostępną 24/7." },
    { question: "Jak działa Wyrocznia?", answer: "Wyrocznia analizuje twój horoskop urodzeniowy, numerologiczną drogę życia i karmiczne węzły księżycowe, aby dać ci spersonalizowane odpowiedzi. Możesz wybierać spośród 4 przewodników: Sibylle, Orion, Séléné lub Pythia." },
    { question: "Czy Karmastro jest darmowe?", answer: "Tak, ścieżka Przebudzenia jest darem gwiazd: pełny profil kosmiczny, codzienny horoskop i 3 wiadomości Wyroczni dziennie. Ścieżka Gwiazdy za 5,99€/miesiąc odblokowuje nieograniczoną Wyrocznię i wiele więcej." },
    { question: "Czym różni się od klasycznego horoskopu?", answer: "Klasyczny horoskop opiera się tylko na znaku słonecznym. Karmastro łączy 3 dyscypliny: astrologię (12 planet, aspekty, domy), numerologię (droga życia, ekspresja, dusza) i przewodnictwo karmiczne (węzły księżycowe, długi, cykle)." },
    { question: "Czy moje dane są chronione?", answer: "Tak. Twoje dane osobowe i profil kosmiczny są szyfrowane i bezpiecznie przechowywane. Karmastro jest zgodne z RODO. Żadne dane nie są udostępniane stronom trzecim." },
  ],
  faqTitle: "Często zadawane pytania",
  ctaTitle: "Rozpocznij kosmiczne przebudzenie",
  ctaSubtitle: "Horoskop urodzeniowy, droga życia, przewodnictwo karmiczne. Gwiazdy na ciebie czekają.",
  ctaButton: "Rozpocznij moje przebudzenie",
  ctaNoCard: "Karta kredytowa niewymagana",
  statsTitle: "Przewodnictwo z precyzją",
  statsSubtitle: "Prawdziwe dane astronomiczne, tysiącletnia tradycja, nowoczesne narzędzia. Wszystko, czego potrzebujesz, aby zrozumieć swoje wewnętrzne niebo.",
  statsLabels: { planets: "Analizowane planety", houses: "Domy astrologiczne", years: "Lat tradycji", precision: "Sekund kątowych precyzji", tools: "Darmowe kalkulatory", guides: "Kosmiczni przewodnicy" },
  statsDescriptions: {
    planets: "Od Słońca do Plutona, każda planeta zodiaku wchodzi do twojego profilu",
    houses: "12 obszarów życia zmapowanych w twoim horoskopie urodzeniowym",
    years: "Od Mezopotamczyków przez Keplera do Swiss Ephemeris",
    precision: "Poziom NASA Jet Propulsion Laboratory",
    tools: "Droga życia, horoskop urodzeniowy, ascendent, kompatybilność i więcej",
    guides: "Sibylle, Orion, Séléné, Pythia · wybierz tego, który do ciebie przemawia",
  },
  footerLegalTitle: "Informacje prawne",
  footerExploreTitle: "Odkrywaj",
  footerCopyright: "Wszelkie prawa zastrzeżone",
  seo: {
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
  },
};

// ============================================================
// RU
// ============================================================

const ru: LocaleContent = {
  heroRotatingWords: ["твою натальную карту", "твою нумерологию", "твою карму", "твои транзиты", "твою совместимость", "твой путь жизни"],
  heroBadge: "Астрология + Нумерология + Карма",
  heroFreeTeaser: "Дар звёзд · Натальная карта + 3 сообщения Оракула в день",
  nasaBadge: "Астрономические расчёты точности NASA",
  exploreCosmosLabel: "Исследовать Космос",
  features: [
    { title: "Полная натальная карта", description: "12 планет, 12 домов, мажорные и минорные аспекты. Небо твоего рождения расшифровано в глубину.", icon: "star" },
    { title: "Кармическая нумерология", description: "Путь жизни, число выражения, душа, кармические долги и вершины. Числа раскрывают твою миссию.", icon: "chart" },
    { title: "Оракул 24/7", description: "Задай Оракулу свои вопросы. Он соединяет твою натальную карту, нумерологию и кармические циклы, чтобы вести тебя.", icon: "zap" },
    { title: "Полная совместимость", description: "Астрологическая синастрия + нумерологическая совместимость. Открой силы и вызовы каждых отношений.", icon: "users" },
    { title: "Космический календарь", description: "Ежедневные транзиты, ретрограды, фазы Луны и персональные нумерологические дни. Планируй в нужный момент.", icon: "search" },
    { title: "Кармическое руководство", description: "Лунные узлы, уроки жизни, циклы Сатурна. Пойми, откуда ты пришёл и куда идёшь.", icon: "shield" },
  ],
  featuresTitle: "Почему Karmastro?",
  featuresSubtitle: "Духовная экосистема, объединяющая 3 дисциплины для полного руководства",
  faq: [
    { question: "Что такое Karmastro?", answer: "Karmastro - это умная духовная экосистема, объединяющая астрологию, нумерологию и кармическое руководство. Ты получаешь полный космический профиль на основе твоей даты, времени и места рождения, с Оракулом 24/7." },
    { question: "Как работает Оракул?", answer: "Оракул анализирует твою натальную карту, нумерологический путь жизни и кармические лунные узлы, чтобы дать персонализированные ответы. Можно выбрать из 4 гидов: Сибилла, Орион, Селена или Пифия." },
    { question: "Karmastro бесплатный?", answer: "Да, путь Пробуждения - дар звёзд: полный космический профиль, ежедневный гороскоп и 3 сообщения Оракула в день. Путь Звезды за 5,99€/месяц открывает безлимитного Оракула и многое другое." },
    { question: "Чем отличается от классического гороскопа?", answer: "Классический гороскоп опирается только на солнечный знак. Karmastro объединяет 3 дисциплины: астрологию (12 планет, аспекты, дома), нумерологию (путь жизни, выражение, душа) и кармическое руководство (лунные узлы, долги, циклы)." },
    { question: "Мои данные защищены?", answer: "Да. Твои личные данные и космический профиль зашифрованы и безопасно хранятся. Karmastro соответствует GDPR. Никакие данные не передаются третьим лицам." },
  ],
  faqTitle: "Частые вопросы",
  ctaTitle: "Начни космическое пробуждение",
  ctaSubtitle: "Натальная карта, путь жизни, кармическое руководство. Звёзды ждут тебя.",
  ctaButton: "Начать пробуждение",
  ctaNoCard: "Банковская карта не требуется",
  statsTitle: "Руководство с точностью",
  statsSubtitle: "Реальные астрономические данные, тысячелетняя традиция, современные инструменты. Всё, что нужно, чтобы понять твоё внутреннее небо.",
  statsLabels: { planets: "Планет проанализировано", houses: "Астрологических домов", years: "Лет традиции", precision: "Угловая секунда точности", tools: "Бесплатных калькуляторов", guides: "Космических гидов" },
  statsDescriptions: {
    planets: "От Солнца до Плутона, каждая планета зодиака входит в твой профиль",
    houses: "12 сфер жизни нанесены на твою натальную карту",
    years: "От месопотамцев до Кеплера и Swiss Ephemeris",
    precision: "Уровень NASA Jet Propulsion Laboratory",
    tools: "Путь жизни, натальная карта, асцендент, совместимость и ещё",
    guides: "Сибилла, Орион, Селена, Пифия · выбери того, кто говорит с тобой",
  },
  footerLegalTitle: "Правовая информация",
  footerExploreTitle: "Исследовать",
  footerCopyright: "Все права защищены",
  seo: {
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
  },
};

// ============================================================
// JA
// ============================================================

const ja: LocaleContent = {
  heroRotatingWords: ["あなたの出生図", "あなたの数秘術", "あなたのカルマ", "あなたのトランジット", "あなたの相性", "あなたの人生の道"],
  heroBadge: "占星術 + 数秘術 + カルマ",
  heroFreeTeaser: "星々からの贈り物 · 出生図 + 1日3つのオラクルメッセージ",
  nasaBadge: "NASA精度の天文計算",
  exploreCosmosLabel: "コスモスを探索",
  features: [
    { title: "完全な出生図", description: "12惑星、12ハウス、メジャーとマイナーのアスペクト。あなたの誕生の空を深く解読。", icon: "star" },
    { title: "カルマ数秘術", description: "人生の道、表現数、魂、カルマの負債、ピナクル。数字があなたの使命を明らかにします。", icon: "chart" },
    { title: "オラクル24時間", description: "オラクルに質問を。あなたの出生図、数秘術、カルマ的サイクルを組み合わせてあなたを導きます。", icon: "zap" },
    { title: "完全な相性診断", description: "占星術シナストリー + 数秘術相性。それぞれの関係の強みと課題を発見。", icon: "users" },
    { title: "コスミックカレンダー", description: "日々のトランジット、逆行、月相、数秘術のパーソナルデイ。最適な瞬間に計画を。", icon: "search" },
    { title: "カルマ的ガイダンス", description: "ドラゴンヘッド、人生の教訓、土星サイクル。どこから来てどこへ行くのかを理解。", icon: "shield" },
  ],
  featuresTitle: "なぜKarmastro?",
  featuresSubtitle: "3つの分野を組み合わせた完全なガイダンスのためのスピリチュアルなエコシステム",
  faq: [
    { question: "Karmastroとは?", answer: "Karmastroは、占星術、数秘術、カルマ的ガイダンスを融合したインテリジェントなスピリチュアルエコシステムです。生年月日、時刻、場所に基づいた完全なコスミックプロファイルと、24時間利用可能なオラクルを提供します。" },
    { question: "オラクルはどう動く?", answer: "オラクルはあなたの出生図、数秘術の人生の道、カルマ的な月のノードを分析し、パーソナライズされた回答を提供します。4人のガイドから選べます: Sibylle、Orion、Séléné、Pythia。" },
    { question: "Karmastroは無料?", answer: "はい、目覚めの道は星々からの贈り物です: 完全なコスミックプロファイル、毎日の星占い、1日3つのオラクルメッセージ。月額5,99€の星の道では無制限のオラクルなどがアンロックされます。" },
    { question: "一般的な星占いとの違いは?", answer: "一般的な星占いは太陽星座のみに基づきます。Karmastroは3つの分野を融合します: 占星術(12惑星、アスペクト、ハウス)、数秘術(人生の道、表現、魂)、カルマ的ガイダンス(月のノード、負債、サイクル)。" },
    { question: "データは保護されていますか?", answer: "はい。個人データとコスミックプロファイルは暗号化され安全に保管されます。KarmastroはGDPR準拠です。第三者とデータが共有されることはありません。" },
  ],
  faqTitle: "よくある質問",
  ctaTitle: "コスミックな目覚めを始める",
  ctaSubtitle: "出生図、人生の道、カルマ的ガイダンス。星々があなたを待っています。",
  ctaButton: "目覚めを始める",
  ctaNoCard: "クレジットカード不要",
  statsTitle: "精度の高いガイダンス",
  statsSubtitle: "実際の天文データ、千年を超える伝統、モダンなツール。あなたの内なる空を理解するために必要なすべて。",
  statsLabels: { planets: "分析された惑星", houses: "占星術のハウス", years: "伝統の年月", precision: "弧秒の精度", tools: "無料計算機", guides: "コスミックガイド" },
  statsDescriptions: {
    planets: "太陽から冥王星まで、黄道のすべての惑星があなたのプロファイルに",
    houses: "あなたの出生図にマッピングされた12の人生領域",
    years: "メソポタミア人からケプラー、Swiss Ephemerisへ",
    precision: "NASAジェット推進研究所レベル",
    tools: "人生の道、出生図、アセンダント、相性など",
    guides: "Sibylle、Orion、Séléné、Pythia · あなたに語りかける者を選んで",
  },
  footerLegalTitle: "法的情報",
  footerExploreTitle: "探索",
  footerCopyright: "全著作権所有",
  seo: {
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
  },
};

// ============================================================
// AR
// ============================================================

const ar: LocaleContent = {
  heroRotatingWords: ["خريطة ولادتك", "علم أعدادك", "كارماك", "عبوراتك", "توافقك", "مسار حياتك"],
  heroBadge: "التنجيم + علم الأعداد + الكارما",
  heroFreeTeaser: "هدية من النجوم · خريطة ولادة + 3 رسائل من العراف يومياً",
  nasaBadge: "حسابات فلكية بدقة ناسا",
  exploreCosmosLabel: "استكشف الكون",
  features: [
    { title: "خريطة ولادة كاملة", description: "12 كوكباً، 12 بيتاً، الجوانب الكبرى والصغرى. سماء ولادتك مفكّكة بعمق.", icon: "star" },
    { title: "علم أعداد كرمي", description: "مسار الحياة، رقم التعبير، الروح، الديون الكرمية والقمم. الأرقام تكشف مهمتك.", icon: "chart" },
    { title: "العراف على مدار الساعة", description: "اطرح أسئلتك على العراف. يدمج خريطة ولادتك وعلم أعدادك ودوراتك الكرمية ليرشدك.", icon: "zap" },
    { title: "توافق كامل", description: "سيناستريا فلكية + توافق عددي. اكتشف نقاط القوة والتحديات في كل علاقة.", icon: "users" },
    { title: "تقويم كوني", description: "عبور يومي، تراجعات، أطوار قمرية وأيام شخصية عددية. خطط في اللحظة المناسبة.", icon: "search" },
    { title: "إرشاد كرمي", description: "العقد القمرية، دروس الحياة، دورات زحل. افهم من أين أتيت وإلى أين تذهب.", icon: "shield" },
  ],
  featuresTitle: "لماذا Karmastro؟",
  featuresSubtitle: "منظومة روحية تدمج 3 علوم لإرشاد متكامل",
  faq: [
    { question: "ما هو Karmastro؟", answer: "Karmastro هي منظومة روحية ذكية تدمج التنجيم وعلم الأعداد والإرشاد الكرمي. تحصل على ملف شخصي كوني كامل بناءً على تاريخ وساعة ومكان ولادتك، مع عراف متاح على مدار الساعة." },
    { question: "كيف يعمل العراف؟", answer: "العراف يحلل خريطة ولادتك، مسار حياتك العددي والعقد القمرية الكرمية ليعطيك إجابات شخصية. يمكنك الاختيار من 4 مرشدين: Sibylle، Orion، Séléné أو Pythia." },
    { question: "هل Karmastro مجاني؟", answer: "نعم، طريق الصحوة هدية من النجوم: ملف كوني كامل، برج يومي و3 رسائل من العراف يومياً. طريق النجمة بـ 5,99€/شهرياً يفتح العراف اللامحدود والكثير غير ذلك." },
    { question: "ما الفرق عن برج تقليدي؟", answer: "البرج التقليدي يعتمد على البرج الشمسي فقط. Karmastro يدمج 3 علوم: التنجيم (12 كوكباً، جوانب، بيوت)، علم الأعداد (مسار حياة، تعبير، روح) والإرشاد الكرمي (عقد قمرية، ديون، دورات)." },
    { question: "هل بياناتي محمية؟", answer: "نعم. بياناتك الشخصية وملفك الكوني مشفرة ومخزنة بأمان. Karmastro متوافق مع GDPR. لا تتم مشاركة أي بيانات مع أطراف ثالثة." },
  ],
  faqTitle: "أسئلة شائعة",
  ctaTitle: "ابدأ صحوتك الكونية",
  ctaSubtitle: "خريطة ولادة، مسار حياة، إرشاد كرمي. النجوم تنتظرك.",
  ctaButton: "ابدأ صحوتي",
  ctaNoCard: "لا حاجة لبطاقة بنكية",
  statsTitle: "إرشاد بدقة",
  statsSubtitle: "بيانات فلكية حقيقية، تقليد يمتد لآلاف السنين، أدوات حديثة. كل ما تحتاجه لفهم سماءك الداخلية.",
  statsLabels: { planets: "كواكب محللة", houses: "بيوت فلكية", years: "سنوات تقليد", precision: "دقة بثانية قوسية", tools: "حاسبات مجانية", guides: "مرشدون كونيون" },
  statsDescriptions: {
    planets: "من الشمس إلى بلوتو، كل كواكب البروج تدخل ملفك الشخصي",
    houses: "الـ 12 مجالاً من الحياة مُرسَّمة في خريطة ولادتك",
    years: "من بلاد ما بين النهرين إلى كبلر و Swiss Ephemeris",
    precision: "مستوى مختبر الدفع النفاث التابع لناسا",
    tools: "مسار الحياة، خريطة ولادة، الطالع، التوافق والمزيد",
    guides: "Sibylle، Orion، Séléné، Pythia · اختر من يخاطبك",
  },
  footerLegalTitle: "معلومات قانونية",
  footerExploreTitle: "استكشف",
  footerCopyright: "جميع الحقوق محفوظة",
  seo: {
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
  },
};

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

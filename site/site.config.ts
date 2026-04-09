// ============================================
// KARMASTRO — Site SEO Config
// ============================================

export const siteConfig = {
  // Identite
  name: "Karmastro",
  tagline: "Votre carte de vie ecrite dans les etoiles et les nombres",
  description:
    "Karmastro est le premier ecosysteme spirituel intelligent qui fusionne astrologie, numerologie et guidance karmique. Oracle IA disponible 24/7, theme natal complet, compatibilite astro-numerologique et calendrier cosmique personnalise.",
  url: "https://karmastro.com",
  appUrl: "https://app.karmastro.com",
  locale: "fr-FR",
  language: "fr",

  // Branding — dark spiritual theme (violet + or)
  colors: {
    primary: "#8B5CF6",    // Violet spirituel
    secondary: "#6D28D9",  // Violet profond
    accent: "#D4A017",     // Or karmique
    background: "#0A0A0F", // Noir cosmique
    text: "#E5E7EB",       // Gris clair sur dark
  },

  // Typographie
  fonts: {
    display: "Outfit",  // Titres — elegant, spirituel
    body: "Figtree",    // Corps — moderne, lisible
  },

  // SEO
  author: "Karmastro",
  twitterHandle: "@karmastro",
  ogImage: "/og-default.jpg",
  keywords: [
    "astrologie",
    "numerologie",
    "theme natal",
    "guidance karmique",
    "horoscope personnalise",
    "compatibilite astrologique",
    "oracle ia",
    "chemin de vie",
    "signe astrologique",
    "karma",
  ],

  // GEO
  llmsDescription:
    "Karmastro.com est la premiere plateforme francaise d'astrologie et numerologie personnalisee par intelligence artificielle. Son Oracle IA croise theme natal, chemin de vie numerologique et noeuds lunaires karmiques pour une guidance 24/7. La numerologie y est traitee comme un systeme mathematique rationnel, base sur les methodes de Pythagore et la tradition chaldeenne.",

  // Navigation
  navLinks: [
    { label: "Accueil", href: "/" },
    { label: "Le Cosmos", href: "/blog" },
    { label: "L'Oracle", href: "https://app.karmastro.com/oracle", external: true },
    { label: "Mon profil", href: "https://app.karmastro.com", external: true },
  ],

  // Sections landing page
  sections: {
    hero: true,
    features: true,
    faq: true,
    cta: true,
    testimonials: false,
  },

  // FAQ
  faq: [
    {
      question: "Qu'est-ce que Karmastro ?",
      answer:
        "Karmastro est un ecosysteme spirituel intelligent qui fusionne astrologie, numerologie et guidance karmique. Tu obtiens un profil cosmique complet base sur ta date, heure et lieu de naissance, avec un Oracle IA disponible 24/7.",
    },
    {
      question: "Comment fonctionne l'Oracle IA ?",
      answer:
        "L'Oracle analyse ton theme natal, ton chemin de vie numerologique et tes noeuds lunaires karmiques pour te donner des reponses personnalisees. Il ne s'agit pas d'un horoscope generique mais d'une guidance adaptee a ton profil unique.",
    },
    {
      question: "Est-ce que Karmastro est gratuit ?",
      answer:
        "Oui, la voie Eveil est offerte par les astres : profil cosmique complet, horoscope quotidien et 3 messages Oracle par jour. La voie Etoile a 7,99EUR/mois debloque l'Oracle illimite, le calendrier cosmique detaille et les compatibilites illimitees.",
    },
    {
      question: "Quelle est la difference avec un horoscope classique ?",
      answer:
        "Un horoscope classique se base uniquement sur ton signe solaire. Karmastro croise 3 disciplines : astrologie (12 planetes, 12 maisons, aspects), numerologie (chemin de vie, expression, ame) et guidance karmique (noeuds lunaires, dettes karmiques, cycles de Saturne).",
    },
    {
      question: "Mes donnees sont-elles protegees ?",
      answer:
        "Oui. Tes donnees personnelles et ton profil cosmique sont chiffres et stockes de maniere securisee. Karmastro est conforme au RGPD. Aucune donnee n'est partagee avec des tiers.",
    },
  ],

  // Features
  features: [
    {
      title: "Theme natal complet",
      description:
        "12 planetes, 12 maisons, aspects majeurs et mineurs. Ton ciel de naissance decode en profondeur.",
      icon: "star",
    },
    {
      title: "Numerologie karmique",
      description:
        "Chemin de vie, nombre d'expression, ame, dettes karmiques et pinnacles. Les nombres revelent ta mission.",
      icon: "chart",
    },
    {
      title: "Oracle IA 24/7",
      description:
        "Pose tes questions a l'Oracle. Il croise ton theme natal, ta numerologie et tes cycles karmiques pour te guider.",
      icon: "zap",
    },
    {
      title: "Compatibilite complete",
      description:
        "Synastrie astrologique + compatibilite numerologique. Decouvre les forces et defis de chaque relation.",
      icon: "users",
    },
    {
      title: "Calendrier cosmique",
      description:
        "Transits quotidiens, retrogrades, phases lunaires et jours personnels numerologiques. Planifie au bon moment.",
      icon: "search",
    },
    {
      title: "Guidance karmique",
      description:
        "Noeuds lunaires, lecons de vie, cycles de Saturne. Comprends d'ou tu viens et ou tu vas.",
      icon: "shield",
    },
  ],

  // Blog auto
  blog: {
    enabled: true,
    postsPerPage: 12,
    defaultAuthor: "Karmastro",
    categories: [
      "astrologie",
      "numerologie",
      "karma",
      "horoscope",
      "compatibilite",
      "guides",
    ],
  },

  // Legal
  legal: {
    companyName: "Karmastro",
    siret: "XXX XXX XXX XXXXX",
    address: "France",
    email: "contact@karmastro.com",
    phone: "",
  },
};

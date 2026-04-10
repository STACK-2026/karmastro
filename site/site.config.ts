// ============================================
// KARMASTRO — Site SEO Config
// ============================================

export const siteConfig = {
  // Identité
  name: "Karmastro",
  tagline: "Votre carte de vie écrite dans les étoiles et les nombres",
  description:
    "Karmastro est le premier écosystème spirituel intelligent qui fusionne astrologie, numérologie et guidance karmique. L'Oracle est disponible 24/7, thème natal complet, compatibilité astro-numérologique et calendrier cosmique personnalisé.",
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
    display: "Outfit",  // Titres — élégant, spirituel
    body: "Figtree",    // Corps — moderne, lisible
  },

  // SEO
  author: "Karmastro",
  twitterHandle: "@karmastro",
  ogImage: "/og-default.jpg",
  keywords: [
    "astrologie",
    "numérologie",
    "thème natal",
    "guidance karmique",
    "horoscope personnalisé",
    "compatibilité astrologique",
    "oracle",
    "chemin de vie",
    "signe astrologique",
    "karma",
  ],

  // GEO
  llmsDescription:
    "Karmastro.com est la première plateforme française d'astrologie et numérologie personnalisée par intelligence artificielle. L'Oracle croise thème natal, chemin de vie numérologique et noeuds lunaires karmiques pour une guidance 24/7. La numérologie y est traitée comme un système mathématique rationnel, basé sur les méthodes de Pythagore et la tradition chaldéenne.",

  // Navigation
  navLinks: [
    { label: "Accueil", href: "/" },
    { label: "Horoscope", href: "/horoscope" },
    { label: "Outils", href: "/outils" },
    { label: "Le Cosmos", href: "/blog" },
    { label: "Parrainage", href: "/parrainage" },
    { label: "L'Oracle", href: "https://app.karmastro.com/oracle", external: true },
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
        "Karmastro est un écosystème spirituel intelligent qui fusionne astrologie, numérologie et guidance karmique. Tu obtiens un profil cosmique complet basé sur ta date, heure et lieu de naissance, avec l'Oracle disponible 24/7.",
    },
    {
      question: "Comment fonctionne L'Oracle ?",
      answer:
        "L'Oracle analyse ton thème natal, ton chemin de vie numérologique et tes noeuds lunaires karmiques pour te donner des réponses personnalisées. Il ne s'agit pas d'un horoscope générique mais d'une guidance adaptée à ton profil unique.",
    },
    {
      question: "Est-ce que Karmastro est gratuit ?",
      answer:
        "Oui, la voie Éveil est offerte par les astres : profil cosmique complet, horoscope quotidien et 3 messages Oracle par jour. La voie Étoile à 5,99€/mois (ou 49,99€/an) débloque l'Oracle illimité, le calendrier cosmique détaillé et les compatibilités illimitées.",
    },
    {
      question: "Quelle est la différence avec un horoscope classique ?",
      answer:
        "Un horoscope classique se base uniquement sur ton signe solaire. Karmastro croise 3 disciplines : astrologie (12 planètes, 12 maisons, aspects), numérologie (chemin de vie, expression, âme) et guidance karmique (noeuds lunaires, dettes karmiques, cycles de Saturne).",
    },
    {
      question: "Mes données sont-elles protégées ?",
      answer:
        "Oui. Tes données personnelles et ton profil cosmique sont chiffrés et stockés de manière sécurisée. Karmastro est conforme au RGPD. Aucune donnée n'est partagée avec des tiers.",
    },
  ],

  // Features
  features: [
    {
      title: "Thème natal complet",
      description:
        "12 planètes, 12 maisons, aspects majeurs et mineurs. Ton ciel de naissance décodé en profondeur.",
      icon: "star",
    },
    {
      title: "Numérologie karmique",
      description:
        "Chemin de vie, nombre d'expression, âme, dettes karmiques et pinnacles. Les nombres révèlent ta mission.",
      icon: "chart",
    },
    {
      title: "L'Oracle 24/7",
      description:
        "Pose tes questions à l'Oracle. Il croise ton thème natal, ta numérologie et tes cycles karmiques pour te guider.",
      icon: "zap",
    },
    {
      title: "Compatibilité complète",
      description:
        "Synastrie astrologique + compatibilité numérologique. Découvre les forces et défis de chaque relation.",
      icon: "users",
    },
    {
      title: "Calendrier cosmique",
      description:
        "Transits quotidiens, rétrogrades, phases lunaires et jours personnels numérologiques. Planifie au bon moment.",
      icon: "search",
    },
    {
      title: "Guidance karmique",
      description:
        "Noeuds lunaires, leçons de vie, cycles de Saturne. Comprends d'où tu viens et où tu vas.",
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
      "numérologie",
      "karma",
      "horoscope",
      "compatibilité",
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

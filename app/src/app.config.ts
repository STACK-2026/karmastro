// ============================================
// KARMASTRO — App Config
// ============================================

export const appConfig = {
  name: "Karmastro",
  siteUrl: "https://karmastro.com",
  appUrl: "https://app.karmastro.com",
  supabaseUrl: "https://ytyujdkjwkupqfnwewfb.supabase.co",
  supabaseAnonKey: "", // A remplir
  stripePublicKey: "", // A remplir quand pricing actif

  // Branding (dark spiritual theme)
  colors: {
    primary: "#8B5CF6",
    secondary: "#6D28D9",
    accent: "#D4A017",
  },

  // Auth
  auth: {
    providers: ["email"] as Array<"email" | "google" | "magic_link">,
    redirectAfterLogin: "/dashboard",
  },

  // Plans
  plans: [
    {
      id: "free",
      name: "Gratuit",
      price: 0,
      features: [
        "Profil cosmique complet",
        "Horoscope quotidien court",
        "3 messages Oracle/jour",
        "1 compatibilite",
        "Guides educatifs",
      ],
    },
    {
      id: "premium",
      name: "Etoile Premium",
      price: 7.99,
      features: [
        "Tout Gratuit +",
        "Oracle IA illimite",
        "Calendrier cosmique detaille",
        "Compatibilites illimitees",
        "Calculateur de timing optimal",
        "Export PDF",
        "Sans publicite",
      ],
    },
    {
      id: "ame-soeur",
      name: "Pack Ame Soeur",
      price: 2.99,
      features: [
        "Rapport compatibilite 15 pages",
        "Synastrie complete",
        "Guidance karmique couple",
        "Export PDF",
      ],
    },
  ],
};

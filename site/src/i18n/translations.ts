// Karmastro translations - UI strings + key page content
// 11 languages targeted: FR (default), EN, ES, PT, DE, IT, TR, AR, JA, PL, RU
// Progressive translation : FR + EN complete, ES/PT/DE/IT in progress, others = fallback FR

import type { Locale } from "./config";

export type TranslationKeys = {
  // ===== Navigation =====
  "nav.home": string;
  "nav.horoscope": string;
  "nav.tools": string;
  "nav.blog": string;
  "nav.referral": string;
  "nav.oracle": string;
  "nav.profile": string;
  "nav.about": string;

  // ===== Header / common =====
  "common.menu": string;
  "common.close": string;
  "common.free": string;
  "common.loading": string;
  "common.error": string;
  "common.retry": string;
  "common.back": string;
  "common.share": string;
  "common.download_pdf": string;
  "common.calculate": string;
  "common.copy_link": string;
  "common.copied": string;
  "common.learn_more": string;
  "common.get_started": string;
  "common.cta_app": string;

  // ===== Footer =====
  "footer.tagline": string;
  "footer.about": string;
  "footer.legal": string;
  "footer.contact": string;
  "footer.cgv": string;
  "footer.privacy": string;
  "footer.terms": string;
  "footer.quote": string;
  "footer.quote_author": string;

  // ===== Hero (homepage) =====
  "hero.title": string;
  "hero.subtitle": string;
  "hero.cta_primary": string;
  "hero.cta_secondary": string;
  "hero.free_badge": string;

  // ===== Pricing =====
  "pricing.title": string;
  "pricing.free": string;
  "pricing.monthly": string;
  "pricing.annual": string;
  "pricing.one_time": string;
  "pricing.per_month": string;
  "pricing.per_year": string;
  "pricing.most_popular": string;
  "pricing.current_plan": string;
  "pricing.eveil_name": string;
  "pricing.eveil_desc": string;
  "pricing.etoile_name": string;
  "pricing.etoile_desc": string;
  "pricing.ame_soeur_name": string;
  "pricing.ame_soeur_desc": string;
  "pricing.no_commitment": string;
  "pricing.secure_payment": string;

  // ===== Oracle =====
  "oracle.ask": string;
  "oracle.thinking": string;
  "oracle.ask_placeholder": string;
  "oracle.feedback_resonates": string;
  "oracle.feedback_interesting": string;
  "oracle.feedback_not_this_time": string;
  "oracle.choose_guide": string;
  "oracle.change_guide": string;

  // ===== Horoscope =====
  "horoscope.daily": string;
  "horoscope.title": string;
  "horoscope.love": string;
  "horoscope.work": string;
  "horoscope.energy": string;
  "horoscope.intuition": string;
  "horoscope.lucky_number": string;
  "horoscope.color": string;
  "horoscope.mantra": string;

  // ===== Tools =====
  "tools.title": string;
  "tools.subtitle": string;
  "tools.cta_oracle": string;
  "tools.share_result": string;
  "tools.full_profile": string;

  // ===== Signs =====
  "signs.aries": string;
  "signs.taurus": string;
  "signs.gemini": string;
  "signs.cancer": string;
  "signs.leo": string;
  "signs.virgo": string;
  "signs.libra": string;
  "signs.scorpio": string;
  "signs.sagittarius": string;
  "signs.capricorn": string;
  "signs.aquarius": string;
  "signs.pisces": string;

  // ===== Language switcher =====
  "lang.select": string;
  "lang.current": string;

  // ===== Errors =====
  "error.generic": string;
  "error.network": string;
  "error.auth_required": string;
  "error.payment_failed": string;
};

// ============================================================
// FR (default / baseline)
// ============================================================

const fr: TranslationKeys = {
  "nav.home": "Accueil",
  "nav.horoscope": "Horoscope",
  "nav.tools": "Outils",
  "nav.blog": "Le Cosmos",
  "nav.referral": "Parrainage",
  "nav.oracle": "L'Oracle",
  "nav.profile": "Mon profil",
  "nav.about": "Notre histoire",

  "common.menu": "Menu",
  "common.close": "Fermer",
  "common.free": "Gratuit",
  "common.loading": "Chargement...",
  "common.error": "Une erreur est survenue",
  "common.retry": "Réessayer",
  "common.back": "Retour",
  "common.share": "Partager",
  "common.download_pdf": "Télécharger PDF",
  "common.calculate": "Calculer",
  "common.copy_link": "Copier le lien",
  "common.copied": "Copié",
  "common.learn_more": "En savoir plus",
  "common.get_started": "Commencer",
  "common.cta_app": "Mon profil cosmique",

  "footer.tagline": "Ta carte de vie écrite dans les étoiles et les nombres",
  "footer.about": "Notre histoire",
  "footer.legal": "Mentions légales",
  "footer.contact": "Contact",
  "footer.cgv": "CGV",
  "footer.privacy": "Politique de confidentialité",
  "footer.terms": "Conditions d'utilisation",
  "footer.quote": "Les astres inclinent, mais ne déterminent pas",
  "footer.quote_author": "Thomas d'Aquin",

  "hero.title": "Ta carte de vie cosmique, décodée",
  "hero.subtitle": "L'Oracle croise ton thème natal, ta numérologie et ta guidance karmique en temps réel. Swiss Ephemeris, précision niveau NASA.",
  "hero.cta_primary": "Découvrir mon profil",
  "hero.cta_secondary": "Voir les outils gratuits",
  "hero.free_badge": "Gratuit pour commencer",

  "pricing.title": "Trois voies, une constellation",
  "pricing.free": "Gratuit",
  "pricing.monthly": "Mensuel",
  "pricing.annual": "Annuel",
  "pricing.one_time": "Paiement unique",
  "pricing.per_month": "par mois",
  "pricing.per_year": "par an",
  "pricing.most_popular": "Le plus populaire",
  "pricing.current_plan": "Plan actuel",
  "pricing.eveil_name": "Éveil",
  "pricing.eveil_desc": "Profil cosmique complet, 3 consultations Oracle par jour, horoscope quotidien",
  "pricing.etoile_name": "Étoile",
  "pricing.etoile_desc": "Oracle illimité, compatibilités illimitées, calendrier cosmique détaillé",
  "pricing.ame_soeur_name": "Âme Sœur",
  "pricing.ame_soeur_desc": "Rituel unique : analyse karmique d'une relation + synastrie complète",
  "pricing.no_commitment": "Sans engagement, résiliable à tout moment",
  "pricing.secure_payment": "Paiement sécurisé par Stripe",

  "oracle.ask": "Pose ta question",
  "oracle.thinking": "L'Oracle consulte les étoiles...",
  "oracle.ask_placeholder": "Pose ta question à l'Oracle...",
  "oracle.feedback_resonates": "Ça résonne",
  "oracle.feedback_interesting": "Intéressant, dis-m'en plus",
  "oracle.feedback_not_this_time": "Pas cette fois",
  "oracle.choose_guide": "À qui veux-tu parler ?",
  "oracle.change_guide": "Changer de guide",

  "horoscope.daily": "Horoscope du jour",
  "horoscope.title": "Horoscope",
  "horoscope.love": "Amour",
  "horoscope.work": "Travail",
  "horoscope.energy": "Énergie",
  "horoscope.intuition": "Intuition",
  "horoscope.lucky_number": "Chiffre chanceux",
  "horoscope.color": "Couleur",
  "horoscope.mantra": "Mantra",

  "tools.title": "Calculateurs gratuits",
  "tools.subtitle": "Tous nos calculateurs sont basés sur des méthodes vérifiables : numérologie pythagoricienne et Swiss Ephemeris pour l'astrologie.",
  "tools.cta_oracle": "Parler à l'Oracle",
  "tools.share_result": "Partager mon résultat",
  "tools.full_profile": "Voir mon profil complet",

  "signs.aries": "Bélier",
  "signs.taurus": "Taureau",
  "signs.gemini": "Gémeaux",
  "signs.cancer": "Cancer",
  "signs.leo": "Lion",
  "signs.virgo": "Vierge",
  "signs.libra": "Balance",
  "signs.scorpio": "Scorpion",
  "signs.sagittarius": "Sagittaire",
  "signs.capricorn": "Capricorne",
  "signs.aquarius": "Verseau",
  "signs.pisces": "Poissons",

  "lang.select": "Choisir la langue",
  "lang.current": "Langue actuelle",

  "error.generic": "Une erreur est survenue",
  "error.network": "Problème de connexion",
  "error.auth_required": "Connexion requise",
  "error.payment_failed": "Le paiement a échoué",
};

// ============================================================
// EN (English) - passe 1 complete, review native à venir
// ============================================================

const en: TranslationKeys = {
  "nav.home": "Home",
  "nav.horoscope": "Horoscope",
  "nav.tools": "Tools",
  "nav.blog": "The Cosmos",
  "nav.referral": "Referral",
  "nav.oracle": "The Oracle",
  "nav.profile": "My profile",
  "nav.about": "Our story",

  "common.menu": "Menu",
  "common.close": "Close",
  "common.free": "Free",
  "common.loading": "Loading...",
  "common.error": "An error occurred",
  "common.retry": "Retry",
  "common.back": "Back",
  "common.share": "Share",
  "common.download_pdf": "Download PDF",
  "common.calculate": "Calculate",
  "common.copy_link": "Copy link",
  "common.copied": "Copied",
  "common.learn_more": "Learn more",
  "common.get_started": "Get started",
  "common.cta_app": "My cosmic profile",

  "footer.tagline": "Your life map written in the stars and numbers",
  "footer.about": "Our story",
  "footer.legal": "Legal notice",
  "footer.contact": "Contact",
  "footer.cgv": "Terms of sale",
  "footer.privacy": "Privacy policy",
  "footer.terms": "Terms of use",
  "footer.quote": "The stars incline, but do not compel",
  "footer.quote_author": "Thomas Aquinas",

  "hero.title": "Your cosmic life map, decoded",
  "hero.subtitle": "The Oracle crosses your birth chart, numerology, and karmic guidance in real time. Swiss Ephemeris, NASA-grade precision.",
  "hero.cta_primary": "Discover my profile",
  "hero.cta_secondary": "See the free tools",
  "hero.free_badge": "Free to start",

  "pricing.title": "Three paths, one constellation",
  "pricing.free": "Free",
  "pricing.monthly": "Monthly",
  "pricing.annual": "Yearly",
  "pricing.one_time": "One-time payment",
  "pricing.per_month": "per month",
  "pricing.per_year": "per year",
  "pricing.most_popular": "Most popular",
  "pricing.current_plan": "Current plan",
  "pricing.eveil_name": "Awakening",
  "pricing.eveil_desc": "Full cosmic profile, 3 Oracle consultations per day, daily horoscope",
  "pricing.etoile_name": "Star",
  "pricing.etoile_desc": "Unlimited Oracle, unlimited compatibilities, detailed cosmic calendar",
  "pricing.ame_soeur_name": "Soulmate",
  "pricing.ame_soeur_desc": "One-time ritual: karmic analysis of a relationship + complete synastry",
  "pricing.no_commitment": "No commitment, cancel anytime",
  "pricing.secure_payment": "Secure payment via Stripe",

  "oracle.ask": "Ask your question",
  "oracle.thinking": "The Oracle consults the stars...",
  "oracle.ask_placeholder": "Ask the Oracle a question...",
  "oracle.feedback_resonates": "It resonates",
  "oracle.feedback_interesting": "Interesting, tell me more",
  "oracle.feedback_not_this_time": "Not this time",
  "oracle.choose_guide": "Who do you want to talk to?",
  "oracle.change_guide": "Change guide",

  "horoscope.daily": "Daily horoscope",
  "horoscope.title": "Horoscope",
  "horoscope.love": "Love",
  "horoscope.work": "Work",
  "horoscope.energy": "Energy",
  "horoscope.intuition": "Intuition",
  "horoscope.lucky_number": "Lucky number",
  "horoscope.color": "Color",
  "horoscope.mantra": "Mantra",

  "tools.title": "Free calculators",
  "tools.subtitle": "All our calculators use verifiable methods: Pythagorean numerology and Swiss Ephemeris for astrology.",
  "tools.cta_oracle": "Talk to the Oracle",
  "tools.share_result": "Share my result",
  "tools.full_profile": "See my full profile",

  "signs.aries": "Aries",
  "signs.taurus": "Taurus",
  "signs.gemini": "Gemini",
  "signs.cancer": "Cancer",
  "signs.leo": "Leo",
  "signs.virgo": "Virgo",
  "signs.libra": "Libra",
  "signs.scorpio": "Scorpio",
  "signs.sagittarius": "Sagittarius",
  "signs.capricorn": "Capricorn",
  "signs.aquarius": "Aquarius",
  "signs.pisces": "Pisces",

  "lang.select": "Choose language",
  "lang.current": "Current language",

  "error.generic": "An error occurred",
  "error.network": "Network issue",
  "error.auth_required": "Login required",
  "error.payment_failed": "Payment failed",
};

// ============================================================
// ES (Español) - passe 1 complete
// ============================================================

const es: TranslationKeys = {
  "nav.home": "Inicio",
  "nav.horoscope": "Horóscopo",
  "nav.tools": "Herramientas",
  "nav.blog": "El Cosmos",
  "nav.referral": "Referidos",
  "nav.oracle": "El Oráculo",
  "nav.profile": "Mi perfil",
  "nav.about": "Nuestra historia",

  "common.menu": "Menú",
  "common.close": "Cerrar",
  "common.free": "Gratis",
  "common.loading": "Cargando...",
  "common.error": "Se produjo un error",
  "common.retry": "Reintentar",
  "common.back": "Atrás",
  "common.share": "Compartir",
  "common.download_pdf": "Descargar PDF",
  "common.calculate": "Calcular",
  "common.copy_link": "Copiar enlace",
  "common.copied": "Copiado",
  "common.learn_more": "Saber más",
  "common.get_started": "Empezar",
  "common.cta_app": "Mi perfil cósmico",

  "footer.tagline": "Tu mapa de vida escrito en las estrellas y los números",
  "footer.about": "Nuestra historia",
  "footer.legal": "Aviso legal",
  "footer.contact": "Contacto",
  "footer.cgv": "Términos de venta",
  "footer.privacy": "Política de privacidad",
  "footer.terms": "Términos de uso",
  "footer.quote": "Los astros inclinan, pero no determinan",
  "footer.quote_author": "Santo Tomás de Aquino",

  "hero.title": "Tu mapa de vida cósmico, descifrado",
  "hero.subtitle": "El Oráculo cruza tu carta natal, tu numerología y tu guía kármica en tiempo real. Swiss Ephemeris, precisión nivel NASA.",
  "hero.cta_primary": "Descubrir mi perfil",
  "hero.cta_secondary": "Ver las herramientas gratuitas",
  "hero.free_badge": "Gratis para empezar",

  "pricing.title": "Tres caminos, una constelación",
  "pricing.free": "Gratis",
  "pricing.monthly": "Mensual",
  "pricing.annual": "Anual",
  "pricing.one_time": "Pago único",
  "pricing.per_month": "al mes",
  "pricing.per_year": "al año",
  "pricing.most_popular": "Más popular",
  "pricing.current_plan": "Plan actual",
  "pricing.eveil_name": "Despertar",
  "pricing.eveil_desc": "Perfil cósmico completo, 3 consultas al Oráculo al día, horóscopo diario",
  "pricing.etoile_name": "Estrella",
  "pricing.etoile_desc": "Oráculo ilimitado, compatibilidades ilimitadas, calendario cósmico detallado",
  "pricing.ame_soeur_name": "Alma Gemela",
  "pricing.ame_soeur_desc": "Ritual único: análisis kármico de una relación + sinastría completa",
  "pricing.no_commitment": "Sin compromiso, cancela cuando quieras",
  "pricing.secure_payment": "Pago seguro vía Stripe",

  "oracle.ask": "Haz tu pregunta",
  "oracle.thinking": "El Oráculo consulta a las estrellas...",
  "oracle.ask_placeholder": "Haz tu pregunta al Oráculo...",
  "oracle.feedback_resonates": "Me resuena",
  "oracle.feedback_interesting": "Interesante, cuéntame más",
  "oracle.feedback_not_this_time": "Esta vez no",
  "oracle.choose_guide": "¿Con quién quieres hablar?",
  "oracle.change_guide": "Cambiar de guía",

  "horoscope.daily": "Horóscopo del día",
  "horoscope.title": "Horóscopo",
  "horoscope.love": "Amor",
  "horoscope.work": "Trabajo",
  "horoscope.energy": "Energía",
  "horoscope.intuition": "Intuición",
  "horoscope.lucky_number": "Número de la suerte",
  "horoscope.color": "Color",
  "horoscope.mantra": "Mantra",

  "tools.title": "Calculadoras gratuitas",
  "tools.subtitle": "Todas nuestras calculadoras usan métodos verificables: numerología pitagórica y Swiss Ephemeris para la astrología.",
  "tools.cta_oracle": "Hablar con el Oráculo",
  "tools.share_result": "Compartir mi resultado",
  "tools.full_profile": "Ver mi perfil completo",

  "signs.aries": "Aries",
  "signs.taurus": "Tauro",
  "signs.gemini": "Géminis",
  "signs.cancer": "Cáncer",
  "signs.leo": "Leo",
  "signs.virgo": "Virgo",
  "signs.libra": "Libra",
  "signs.scorpio": "Escorpio",
  "signs.sagittarius": "Sagitario",
  "signs.capricorn": "Capricornio",
  "signs.aquarius": "Acuario",
  "signs.pisces": "Piscis",

  "lang.select": "Elegir idioma",
  "lang.current": "Idioma actual",

  "error.generic": "Se produjo un error",
  "error.network": "Problema de conexión",
  "error.auth_required": "Inicio de sesión requerido",
  "error.payment_failed": "El pago ha fallado",
};

// ============================================================
// PT (Português) - passe 1 complete
// ============================================================

const pt: TranslationKeys = {
  "nav.home": "Início",
  "nav.horoscope": "Horóscopo",
  "nav.tools": "Ferramentas",
  "nav.blog": "O Cosmos",
  "nav.referral": "Indicações",
  "nav.oracle": "O Oráculo",
  "nav.profile": "O meu perfil",
  "nav.about": "A nossa história",

  "common.menu": "Menu",
  "common.close": "Fechar",
  "common.free": "Grátis",
  "common.loading": "A carregar...",
  "common.error": "Ocorreu um erro",
  "common.retry": "Tentar novamente",
  "common.back": "Voltar",
  "common.share": "Partilhar",
  "common.download_pdf": "Descarregar PDF",
  "common.calculate": "Calcular",
  "common.copy_link": "Copiar link",
  "common.copied": "Copiado",
  "common.learn_more": "Saber mais",
  "common.get_started": "Começar",
  "common.cta_app": "O meu perfil cósmico",

  "footer.tagline": "O teu mapa de vida escrito nas estrelas e nos números",
  "footer.about": "A nossa história",
  "footer.legal": "Aviso legal",
  "footer.contact": "Contacto",
  "footer.cgv": "Termos de venda",
  "footer.privacy": "Política de privacidade",
  "footer.terms": "Termos de utilização",
  "footer.quote": "Os astros inclinam, mas não determinam",
  "footer.quote_author": "Tomás de Aquino",

  "hero.title": "O teu mapa de vida cósmico, descodificado",
  "hero.subtitle": "O Oráculo cruza o teu mapa natal, a tua numerologia e a tua orientação kármica em tempo real. Swiss Ephemeris, precisão nível NASA.",
  "hero.cta_primary": "Descobrir o meu perfil",
  "hero.cta_secondary": "Ver as ferramentas gratuitas",
  "hero.free_badge": "Grátis para começar",

  "pricing.title": "Três caminhos, uma constelação",
  "pricing.free": "Grátis",
  "pricing.monthly": "Mensal",
  "pricing.annual": "Anual",
  "pricing.one_time": "Pagamento único",
  "pricing.per_month": "por mês",
  "pricing.per_year": "por ano",
  "pricing.most_popular": "Mais popular",
  "pricing.current_plan": "Plano atual",
  "pricing.eveil_name": "Despertar",
  "pricing.eveil_desc": "Perfil cósmico completo, 3 consultas ao Oráculo por dia, horóscopo diário",
  "pricing.etoile_name": "Estrela",
  "pricing.etoile_desc": "Oráculo ilimitado, compatibilidades ilimitadas, calendário cósmico detalhado",
  "pricing.ame_soeur_name": "Alma Gémea",
  "pricing.ame_soeur_desc": "Ritual único: análise kármica de uma relação + sinastria completa",
  "pricing.no_commitment": "Sem compromisso, cancela quando quiseres",
  "pricing.secure_payment": "Pagamento seguro via Stripe",

  "oracle.ask": "Faz a tua pergunta",
  "oracle.thinking": "O Oráculo consulta as estrelas...",
  "oracle.ask_placeholder": "Faz a tua pergunta ao Oráculo...",
  "oracle.feedback_resonates": "Ressoa comigo",
  "oracle.feedback_interesting": "Interessante, conta-me mais",
  "oracle.feedback_not_this_time": "Desta vez não",
  "oracle.choose_guide": "Com quem queres falar?",
  "oracle.change_guide": "Mudar de guia",

  "horoscope.daily": "Horóscopo do dia",
  "horoscope.title": "Horóscopo",
  "horoscope.love": "Amor",
  "horoscope.work": "Trabalho",
  "horoscope.energy": "Energia",
  "horoscope.intuition": "Intuição",
  "horoscope.lucky_number": "Número da sorte",
  "horoscope.color": "Cor",
  "horoscope.mantra": "Mantra",

  "tools.title": "Calculadoras gratuitas",
  "tools.subtitle": "Todas as nossas calculadoras usam métodos verificáveis: numerologia pitagórica e Swiss Ephemeris para a astrologia.",
  "tools.cta_oracle": "Falar com o Oráculo",
  "tools.share_result": "Partilhar o meu resultado",
  "tools.full_profile": "Ver o meu perfil completo",

  "signs.aries": "Carneiro",
  "signs.taurus": "Touro",
  "signs.gemini": "Gémeos",
  "signs.cancer": "Caranguejo",
  "signs.leo": "Leão",
  "signs.virgo": "Virgem",
  "signs.libra": "Balança",
  "signs.scorpio": "Escorpião",
  "signs.sagittarius": "Sagitário",
  "signs.capricorn": "Capricórnio",
  "signs.aquarius": "Aquário",
  "signs.pisces": "Peixes",

  "lang.select": "Escolher idioma",
  "lang.current": "Idioma atual",

  "error.generic": "Ocorreu um erro",
  "error.network": "Problema de rede",
  "error.auth_required": "Login necessário",
  "error.payment_failed": "Pagamento falhou",
};

// ============================================================
// DE (Deutsch) - passe 1 complete
// ============================================================

const de: TranslationKeys = {
  "nav.home": "Startseite",
  "nav.horoscope": "Horoskop",
  "nav.tools": "Werkzeuge",
  "nav.blog": "Der Kosmos",
  "nav.referral": "Empfehlung",
  "nav.oracle": "Das Orakel",
  "nav.profile": "Mein Profil",
  "nav.about": "Unsere Geschichte",

  "common.menu": "Menü",
  "common.close": "Schließen",
  "common.free": "Kostenlos",
  "common.loading": "Lädt...",
  "common.error": "Ein Fehler ist aufgetreten",
  "common.retry": "Erneut versuchen",
  "common.back": "Zurück",
  "common.share": "Teilen",
  "common.download_pdf": "PDF herunterladen",
  "common.calculate": "Berechnen",
  "common.copy_link": "Link kopieren",
  "common.copied": "Kopiert",
  "common.learn_more": "Mehr erfahren",
  "common.get_started": "Los geht's",
  "common.cta_app": "Mein kosmisches Profil",

  "footer.tagline": "Deine Lebenskarte in den Sternen und Zahlen geschrieben",
  "footer.about": "Unsere Geschichte",
  "footer.legal": "Impressum",
  "footer.contact": "Kontakt",
  "footer.cgv": "AGB",
  "footer.privacy": "Datenschutz",
  "footer.terms": "Nutzungsbedingungen",
  "footer.quote": "Die Sterne neigen, aber sie zwingen nicht",
  "footer.quote_author": "Thomas von Aquin",

  "hero.title": "Deine kosmische Lebenskarte, entschlüsselt",
  "hero.subtitle": "Das Orakel verknüpft dein Geburtshoroskop, deine Numerologie und deine karmische Führung in Echtzeit. Swiss Ephemeris, NASA-Präzision.",
  "hero.cta_primary": "Mein Profil entdecken",
  "hero.cta_secondary": "Kostenlose Werkzeuge ansehen",
  "hero.free_badge": "Kostenlos starten",

  "pricing.title": "Drei Wege, eine Konstellation",
  "pricing.free": "Kostenlos",
  "pricing.monthly": "Monatlich",
  "pricing.annual": "Jährlich",
  "pricing.one_time": "Einmalzahlung",
  "pricing.per_month": "pro Monat",
  "pricing.per_year": "pro Jahr",
  "pricing.most_popular": "Am beliebtesten",
  "pricing.current_plan": "Aktueller Plan",
  "pricing.eveil_name": "Erwachen",
  "pricing.eveil_desc": "Vollständiges kosmisches Profil, 3 Orakel-Konsultationen pro Tag, tägliches Horoskop",
  "pricing.etoile_name": "Stern",
  "pricing.etoile_desc": "Unbegrenztes Orakel, unbegrenzte Kompatibilitäten, detaillierter kosmischer Kalender",
  "pricing.ame_soeur_name": "Seelenverwandte",
  "pricing.ame_soeur_desc": "Einmaliges Ritual: karmische Analyse einer Beziehung + vollständige Synastrie",
  "pricing.no_commitment": "Keine Verpflichtung, jederzeit kündbar",
  "pricing.secure_payment": "Sichere Zahlung über Stripe",

  "oracle.ask": "Stelle deine Frage",
  "oracle.thinking": "Das Orakel befragt die Sterne...",
  "oracle.ask_placeholder": "Stelle dem Orakel eine Frage...",
  "oracle.feedback_resonates": "Es trifft zu",
  "oracle.feedback_interesting": "Interessant, erzähl mir mehr",
  "oracle.feedback_not_this_time": "Diesmal nicht",
  "oracle.choose_guide": "Mit wem möchtest du sprechen?",
  "oracle.change_guide": "Führer wechseln",

  "horoscope.daily": "Tageshoroskop",
  "horoscope.title": "Horoskop",
  "horoscope.love": "Liebe",
  "horoscope.work": "Arbeit",
  "horoscope.energy": "Energie",
  "horoscope.intuition": "Intuition",
  "horoscope.lucky_number": "Glückszahl",
  "horoscope.color": "Farbe",
  "horoscope.mantra": "Mantra",

  "tools.title": "Kostenlose Rechner",
  "tools.subtitle": "Alle unsere Rechner verwenden überprüfbare Methoden: pythagoräische Numerologie und Swiss Ephemeris für die Astrologie.",
  "tools.cta_oracle": "Mit dem Orakel sprechen",
  "tools.share_result": "Mein Ergebnis teilen",
  "tools.full_profile": "Mein vollständiges Profil ansehen",

  "signs.aries": "Widder",
  "signs.taurus": "Stier",
  "signs.gemini": "Zwillinge",
  "signs.cancer": "Krebs",
  "signs.leo": "Löwe",
  "signs.virgo": "Jungfrau",
  "signs.libra": "Waage",
  "signs.scorpio": "Skorpion",
  "signs.sagittarius": "Schütze",
  "signs.capricorn": "Steinbock",
  "signs.aquarius": "Wassermann",
  "signs.pisces": "Fische",

  "lang.select": "Sprache wählen",
  "lang.current": "Aktuelle Sprache",

  "error.generic": "Ein Fehler ist aufgetreten",
  "error.network": "Verbindungsproblem",
  "error.auth_required": "Anmeldung erforderlich",
  "error.payment_failed": "Zahlung fehlgeschlagen",
};

// ============================================================
// IT (Italiano) - passe 1 complete
// ============================================================

const it: TranslationKeys = {
  "nav.home": "Home",
  "nav.horoscope": "Oroscopo",
  "nav.tools": "Strumenti",
  "nav.blog": "Il Cosmo",
  "nav.referral": "Invita",
  "nav.oracle": "L'Oracolo",
  "nav.profile": "Il mio profilo",
  "nav.about": "La nostra storia",

  "common.menu": "Menu",
  "common.close": "Chiudi",
  "common.free": "Gratis",
  "common.loading": "Caricamento...",
  "common.error": "Si è verificato un errore",
  "common.retry": "Riprova",
  "common.back": "Indietro",
  "common.share": "Condividi",
  "common.download_pdf": "Scarica PDF",
  "common.calculate": "Calcola",
  "common.copy_link": "Copia link",
  "common.copied": "Copiato",
  "common.learn_more": "Scopri di più",
  "common.get_started": "Inizia",
  "common.cta_app": "Il mio profilo cosmico",

  "footer.tagline": "La tua mappa di vita scritta nelle stelle e nei numeri",
  "footer.about": "La nostra storia",
  "footer.legal": "Note legali",
  "footer.contact": "Contatto",
  "footer.cgv": "Termini di vendita",
  "footer.privacy": "Informativa sulla privacy",
  "footer.terms": "Termini d'uso",
  "footer.quote": "Gli astri inclinano, ma non determinano",
  "footer.quote_author": "Tommaso d'Aquino",

  "hero.title": "La tua mappa di vita cosmica, decodificata",
  "hero.subtitle": "L'Oracolo incrocia il tuo tema natale, la tua numerologia e la tua guida karmica in tempo reale. Swiss Ephemeris, precisione da NASA.",
  "hero.cta_primary": "Scopri il mio profilo",
  "hero.cta_secondary": "Vedi gli strumenti gratuiti",
  "hero.free_badge": "Gratis per iniziare",

  "pricing.title": "Tre vie, una costellazione",
  "pricing.free": "Gratis",
  "pricing.monthly": "Mensile",
  "pricing.annual": "Annuale",
  "pricing.one_time": "Pagamento unico",
  "pricing.per_month": "al mese",
  "pricing.per_year": "all'anno",
  "pricing.most_popular": "Più popolare",
  "pricing.current_plan": "Piano attuale",
  "pricing.eveil_name": "Risveglio",
  "pricing.eveil_desc": "Profilo cosmico completo, 3 consultazioni all'Oracolo al giorno, oroscopo quotidiano",
  "pricing.etoile_name": "Stella",
  "pricing.etoile_desc": "Oracolo illimitato, compatibilità illimitate, calendario cosmico dettagliato",
  "pricing.ame_soeur_name": "Anima Gemella",
  "pricing.ame_soeur_desc": "Rituale unico: analisi karmica di una relazione + sinastria completa",
  "pricing.no_commitment": "Nessun impegno, disdici in qualsiasi momento",
  "pricing.secure_payment": "Pagamento sicuro tramite Stripe",

  "oracle.ask": "Fai la tua domanda",
  "oracle.thinking": "L'Oracolo consulta le stelle...",
  "oracle.ask_placeholder": "Fai una domanda all'Oracolo...",
  "oracle.feedback_resonates": "Mi risuona",
  "oracle.feedback_interesting": "Interessante, dimmi di più",
  "oracle.feedback_not_this_time": "Non questa volta",
  "oracle.choose_guide": "Con chi vuoi parlare?",
  "oracle.change_guide": "Cambia guida",

  "horoscope.daily": "Oroscopo del giorno",
  "horoscope.title": "Oroscopo",
  "horoscope.love": "Amore",
  "horoscope.work": "Lavoro",
  "horoscope.energy": "Energia",
  "horoscope.intuition": "Intuizione",
  "horoscope.lucky_number": "Numero fortunato",
  "horoscope.color": "Colore",
  "horoscope.mantra": "Mantra",

  "tools.title": "Calcolatori gratuiti",
  "tools.subtitle": "Tutti i nostri calcolatori usano metodi verificabili: numerologia pitagorica e Swiss Ephemeris per l'astrologia.",
  "tools.cta_oracle": "Parlare con l'Oracolo",
  "tools.share_result": "Condividi il mio risultato",
  "tools.full_profile": "Vedi il mio profilo completo",

  "signs.aries": "Ariete",
  "signs.taurus": "Toro",
  "signs.gemini": "Gemelli",
  "signs.cancer": "Cancro",
  "signs.leo": "Leone",
  "signs.virgo": "Vergine",
  "signs.libra": "Bilancia",
  "signs.scorpio": "Scorpione",
  "signs.sagittarius": "Sagittario",
  "signs.capricorn": "Capricorno",
  "signs.aquarius": "Acquario",
  "signs.pisces": "Pesci",

  "lang.select": "Scegli la lingua",
  "lang.current": "Lingua attuale",

  "error.generic": "Si è verificato un errore",
  "error.network": "Problema di connessione",
  "error.auth_required": "Accesso richiesto",
  "error.payment_failed": "Pagamento fallito",
};

// ============================================================
// Fallback (FR) for languages still pending translation
// ============================================================

export const translations: Record<Locale, TranslationKeys> = {
  fr,
  en,
  es,
  pt,
  de,
  it,
  tr: { ...fr }, // TODO passe 1
  ar: { ...fr }, // TODO passe 1 + RTL testing
  ja: { ...fr }, // TODO passe 1 + wordwrap
  pl: { ...fr }, // TODO passe 1
  ru: { ...fr }, // TODO passe 1 + pluralization rules
};

// Simple t() helper
export function t(key: keyof TranslationKeys, locale: Locale): string {
  return translations[locale]?.[key] || translations.fr[key] || key;
}

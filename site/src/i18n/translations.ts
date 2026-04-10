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
  "horoscope.cosmic_energy": string;
  "horoscope.signed_by": string;
  "horoscope.share_this": string;
  "horoscope.personalised_cta_title": string;
  "horoscope.personalised_cta_desc": string;
  "horoscope.personalised_cta_button": string;
  "horoscope.compatibilities_of": string;
  "horoscope.recent_archives": string;
  "horoscope.past_readings": string;
  "horoscope.no_reading": string;
  "horoscope.reading_in_progress": string;
  "horoscope.come_back_midnight": string;
  "horoscope.tomorrow": string;
  "horoscope.premium_preview_badge": string;
  "horoscope.cosmic_energy_tomorrow": string;
  "horoscope.paywall_title": string;
  "horoscope.paywall_desc": string;
  "horoscope.paywall_cta": string;
  "horoscope.paywall_available_in": string;
  "horoscope.fr_translation_note": string;
  "horoscope.archive_of": string;
  "horoscope.preview_of": string;
  "horoscope.back_to_today": string;

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
  "horoscope.cosmic_energy": "Énergie cosmique du jour",
  "horoscope.signed_by": "Lecture signée par",
  "horoscope.share_this": "Partager cet horoscope",
  "horoscope.personalised_cta_title": "Besoin d'une lecture plus personnelle ?",
  "horoscope.personalised_cta_desc": "L'horoscope est une lecture générale. Pour une guidance qui prend en compte ton thème natal complet, pose ta question à l'un de nos quatre guides.",
  "horoscope.personalised_cta_button": "Pose ta question à l'Oracle",
  "horoscope.compatibilities_of": "Compatibilités du",
  "horoscope.recent_archives": "Archives récentes",
  "horoscope.past_readings": "lectures passées",
  "horoscope.no_reading": "Les astres écrivent encore ta lecture du jour. Reviens dans quelques heures.",
  "horoscope.reading_in_progress": "Les astres écrivent encore ta lecture de demain",
  "horoscope.come_back_midnight": "Reviens à partir de minuit pour la découvrir",
  "horoscope.tomorrow": "Demain",
  "horoscope.premium_preview_badge": "Avant-première Étoile",
  "horoscope.cosmic_energy_tomorrow": "Énergie cosmique de demain",
  "horoscope.paywall_title": "Accès en avant-première",
  "horoscope.paywall_desc": "L'horoscope de demain est offert aux voyageuses et voyageurs Étoile. Lis-le dès maintenant, sans attendre minuit.",
  "horoscope.paywall_cta": "Passer en Étoile",
  "horoscope.paywall_available_in": "ou disponible dans",
  "horoscope.fr_translation_note": "Lecture originale en français, traduction complète bientôt disponible",
  "horoscope.archive_of": "Archive du",
  "horoscope.preview_of": "Avant-première du",
  "horoscope.back_to_today": "Retour à l'horoscope du jour",

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
  "horoscope.cosmic_energy": "Cosmic energy of the day",
  "horoscope.signed_by": "Reading signed by",
  "horoscope.share_this": "Share this horoscope",
  "horoscope.personalised_cta_title": "Need a more personal reading?",
  "horoscope.personalised_cta_desc": "The horoscope is a general reading. For guidance that takes into account your complete birth chart, ask one of our four cosmic guides.",
  "horoscope.personalised_cta_button": "Ask the Oracle",
  "horoscope.compatibilities_of": "Compatibilities of",
  "horoscope.recent_archives": "Recent archives",
  "horoscope.past_readings": "past readings",
  "horoscope.no_reading": "The stars are still writing your reading of the day. Come back in a few hours.",
  "horoscope.reading_in_progress": "The stars are still writing tomorrow's reading",
  "horoscope.come_back_midnight": "Come back after midnight to discover it",
  "horoscope.tomorrow": "Tomorrow",
  "horoscope.premium_preview_badge": "Star early access",
  "horoscope.cosmic_energy_tomorrow": "Tomorrow's cosmic energy",
  "horoscope.paywall_title": "Early access",
  "horoscope.paywall_desc": "Tomorrow's horoscope is offered to Star travelers. Read it now, without waiting for midnight.",
  "horoscope.paywall_cta": "Go Star",
  "horoscope.paywall_available_in": "or available in",
  "horoscope.fr_translation_note": "Original reading in French, full translation coming soon",
  "horoscope.archive_of": "Archive of",
  "horoscope.preview_of": "Preview of",
  "horoscope.back_to_today": "Back to today's horoscope",

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
  "horoscope.cosmic_energy": "Energía cósmica del día",
  "horoscope.signed_by": "Lectura firmada por",
  "horoscope.share_this": "Compartir este horóscopo",
  "horoscope.personalised_cta_title": "¿Necesitas una lectura más personal?",
  "horoscope.personalised_cta_desc": "El horóscopo es una lectura general. Para una guía que tenga en cuenta tu carta astral completa, haz tu pregunta a uno de nuestros cuatro guías cósmicos.",
  "horoscope.personalised_cta_button": "Pregunta al Oráculo",
  "horoscope.compatibilities_of": "Compatibilidades de",
  "horoscope.recent_archives": "Archivos recientes",
  "horoscope.past_readings": "lecturas pasadas",
  "horoscope.no_reading": "Los astros aún escriben tu lectura del día. Vuelve en unas horas.",
  "horoscope.reading_in_progress": "Los astros aún escriben tu lectura de mañana",
  "horoscope.come_back_midnight": "Vuelve a partir de medianoche para descubrirla",
  "horoscope.tomorrow": "Mañana",
  "horoscope.premium_preview_badge": "Avance Estrella",
  "horoscope.cosmic_energy_tomorrow": "Energía cósmica de mañana",
  "horoscope.paywall_title": "Acceso anticipado",
  "horoscope.paywall_desc": "El horóscopo de mañana es un regalo para las viajeras y viajeros Estrella. Léelo ahora, sin esperar a medianoche.",
  "horoscope.paywall_cta": "Pasar a Estrella",
  "horoscope.paywall_available_in": "o disponible en",
  "horoscope.fr_translation_note": "Lectura original en francés, traducción completa próximamente",
  "horoscope.archive_of": "Archivo del",
  "horoscope.preview_of": "Avance del",
  "horoscope.back_to_today": "Volver al horóscopo del día",

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
  "horoscope.cosmic_energy": "Energia cósmica do dia",
  "horoscope.signed_by": "Leitura assinada por",
  "horoscope.share_this": "Partilhar este horóscopo",
  "horoscope.personalised_cta_title": "Precisas de uma leitura mais pessoal?",
  "horoscope.personalised_cta_desc": "O horóscopo é uma leitura geral. Para um guia que tenha em conta o teu mapa astral completo, faz a tua pergunta a um dos nossos quatro guias cósmicos.",
  "horoscope.personalised_cta_button": "Pergunta ao Oráculo",
  "horoscope.compatibilities_of": "Compatibilidades do",
  "horoscope.recent_archives": "Arquivos recentes",
  "horoscope.past_readings": "leituras passadas",
  "horoscope.no_reading": "Os astros ainda escrevem a tua leitura do dia. Volta daqui a algumas horas.",
  "horoscope.reading_in_progress": "Os astros ainda escrevem a tua leitura de amanhã",
  "horoscope.come_back_midnight": "Volta a partir da meia-noite para a descobrires",
  "horoscope.tomorrow": "Amanhã",
  "horoscope.premium_preview_badge": "Antecipação Estrela",
  "horoscope.cosmic_energy_tomorrow": "Energia cósmica de amanhã",
  "horoscope.paywall_title": "Acesso antecipado",
  "horoscope.paywall_desc": "O horóscopo de amanhã é oferecido às viajantes e aos viajantes Estrela. Lê-o agora, sem esperar pela meia-noite.",
  "horoscope.paywall_cta": "Passar a Estrela",
  "horoscope.paywall_available_in": "ou disponível em",
  "horoscope.fr_translation_note": "Leitura original em francês, tradução completa em breve",
  "horoscope.archive_of": "Arquivo do",
  "horoscope.preview_of": "Antecipação do",
  "horoscope.back_to_today": "Voltar ao horóscopo do dia",

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
  "horoscope.cosmic_energy": "Kosmische Energie des Tages",
  "horoscope.signed_by": "Lesung signiert von",
  "horoscope.share_this": "Dieses Horoskop teilen",
  "horoscope.personalised_cta_title": "Brauchst du eine persönlichere Lesung?",
  "horoscope.personalised_cta_desc": "Das Horoskop ist eine allgemeine Lesung. Für eine Führung, die dein komplettes Geburtshoroskop berücksichtigt, stelle deine Frage an einen unserer vier kosmischen Führer.",
  "horoscope.personalised_cta_button": "Frage das Orakel",
  "horoscope.compatibilities_of": "Kompatibilitäten des",
  "horoscope.recent_archives": "Aktuelle Archive",
  "horoscope.past_readings": "vergangene Lesungen",
  "horoscope.no_reading": "Die Sterne schreiben noch deine Lesung des Tages. Komm in ein paar Stunden wieder.",
  "horoscope.reading_in_progress": "Die Sterne schreiben noch deine Lesung von morgen",
  "horoscope.come_back_midnight": "Komm ab Mitternacht zurück, um sie zu entdecken",
  "horoscope.tomorrow": "Morgen",
  "horoscope.premium_preview_badge": "Stern Vorschau",
  "horoscope.cosmic_energy_tomorrow": "Kosmische Energie von morgen",
  "horoscope.paywall_title": "Vorschau-Zugang",
  "horoscope.paywall_desc": "Das Horoskop von morgen ist den Stern-Reisenden vorbehalten. Lies es jetzt, ohne auf Mitternacht zu warten.",
  "horoscope.paywall_cta": "Zu Stern wechseln",
  "horoscope.paywall_available_in": "oder verfügbar in",
  "horoscope.fr_translation_note": "Original-Lesung auf Französisch, vollständige Übersetzung bald verfügbar",
  "horoscope.archive_of": "Archiv vom",
  "horoscope.preview_of": "Vorschau vom",
  "horoscope.back_to_today": "Zurück zum Horoskop des Tages",

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
  "horoscope.cosmic_energy": "Energia cosmica del giorno",
  "horoscope.signed_by": "Lettura firmata da",
  "horoscope.share_this": "Condividi questo oroscopo",
  "horoscope.personalised_cta_title": "Hai bisogno di una lettura più personale?",
  "horoscope.personalised_cta_desc": "L'oroscopo è una lettura generale. Per una guida che tenga conto del tuo tema natale completo, fai la tua domanda a una delle nostre quattro guide cosmiche.",
  "horoscope.personalised_cta_button": "Chiedi all'Oracolo",
  "horoscope.compatibilities_of": "Compatibilità del",
  "horoscope.recent_archives": "Archivi recenti",
  "horoscope.past_readings": "letture passate",
  "horoscope.no_reading": "Gli astri stanno ancora scrivendo la tua lettura del giorno. Torna tra qualche ora.",
  "horoscope.reading_in_progress": "Gli astri stanno ancora scrivendo la tua lettura di domani",
  "horoscope.come_back_midnight": "Torna a partire da mezzanotte per scoprirla",
  "horoscope.tomorrow": "Domani",
  "horoscope.premium_preview_badge": "Anteprima Stella",
  "horoscope.cosmic_energy_tomorrow": "Energia cosmica di domani",
  "horoscope.paywall_title": "Accesso in anteprima",
  "horoscope.paywall_desc": "L'oroscopo di domani è offerto alle viaggiatrici e ai viaggiatori Stella. Leggilo ora, senza aspettare mezzanotte.",
  "horoscope.paywall_cta": "Passare a Stella",
  "horoscope.paywall_available_in": "o disponibile tra",
  "horoscope.fr_translation_note": "Lettura originale in francese, traduzione completa presto disponibile",
  "horoscope.archive_of": "Archivio del",
  "horoscope.preview_of": "Anteprima del",
  "horoscope.back_to_today": "Torna all'oroscopo del giorno",

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

// ============================================================
// TR (Türkçe) - passe 1 complete
// ============================================================

const tr: TranslationKeys = {
  "nav.home": "Ana Sayfa",
  "nav.horoscope": "Burç",
  "nav.tools": "Araçlar",
  "nav.blog": "Kozmos",
  "nav.referral": "Davet",
  "nav.oracle": "Kahin",
  "nav.profile": "Profilim",
  "nav.about": "Hikayemiz",

  "common.menu": "Menü",
  "common.close": "Kapat",
  "common.free": "Ücretsiz",
  "common.loading": "Yükleniyor...",
  "common.error": "Bir hata oluştu",
  "common.retry": "Tekrar dene",
  "common.back": "Geri",
  "common.share": "Paylaş",
  "common.download_pdf": "PDF indir",
  "common.calculate": "Hesapla",
  "common.copy_link": "Bağlantıyı kopyala",
  "common.copied": "Kopyalandı",
  "common.learn_more": "Daha fazla bilgi",
  "common.get_started": "Başla",
  "common.cta_app": "Kozmik profilim",

  "footer.tagline": "Yıldızlara ve sayılara yazılmış hayat haritan",
  "footer.about": "Hikayemiz",
  "footer.legal": "Yasal Uyarı",
  "footer.contact": "İletişim",
  "footer.cgv": "Satış Koşulları",
  "footer.privacy": "Gizlilik Politikası",
  "footer.terms": "Kullanım Koşulları",
  "footer.quote": "Yıldızlar eğilim verir ama belirlemez",
  "footer.quote_author": "Aziz Thomas Aquinas",

  "hero.title": "Kozmik hayat haritan, çözüldü",
  "hero.subtitle": "Kahin, doğum haritanı, numerolojini ve karmik rehberliğini gerçek zamanlı olarak birleştirir. Swiss Ephemeris, NASA seviyesinde hassasiyet.",
  "hero.cta_primary": "Profilimi keşfet",
  "hero.cta_secondary": "Ücretsiz araçları gör",
  "hero.free_badge": "Başlamak ücretsiz",

  "pricing.title": "Üç yol, bir takımyıldız",
  "pricing.free": "Ücretsiz",
  "pricing.monthly": "Aylık",
  "pricing.annual": "Yıllık",
  "pricing.one_time": "Tek seferlik ödeme",
  "pricing.per_month": "aylık",
  "pricing.per_year": "yıllık",
  "pricing.most_popular": "En popüler",
  "pricing.current_plan": "Mevcut plan",
  "pricing.eveil_name": "Uyanış",
  "pricing.eveil_desc": "Tam kozmik profil, günde 3 Kahin danışması, günlük burç",
  "pricing.etoile_name": "Yıldız",
  "pricing.etoile_desc": "Sınırsız Kahin, sınırsız uyumluluk, detaylı kozmik takvim",
  "pricing.ame_soeur_name": "Ruh Eşi",
  "pricing.ame_soeur_desc": "Tek seferlik ritüel: bir ilişkinin karmik analizi + tam sinastri",
  "pricing.no_commitment": "Taahhüt yok, istediğin zaman iptal",
  "pricing.secure_payment": "Stripe ile güvenli ödeme",

  "oracle.ask": "Sorunu sor",
  "oracle.thinking": "Kahin yıldızlara danışıyor...",
  "oracle.ask_placeholder": "Kahin'e bir soru sor...",
  "oracle.feedback_resonates": "Beni etkiliyor",
  "oracle.feedback_interesting": "İlginç, daha fazla anlat",
  "oracle.feedback_not_this_time": "Bu sefer değil",
  "oracle.choose_guide": "Kiminle konuşmak istiyorsun?",
  "oracle.change_guide": "Rehberi değiştir",

  "horoscope.daily": "Günlük burç",
  "horoscope.title": "Burç",
  "horoscope.love": "Aşk",
  "horoscope.work": "İş",
  "horoscope.energy": "Enerji",
  "horoscope.intuition": "Sezgi",
  "horoscope.lucky_number": "Şanslı sayı",
  "horoscope.color": "Renk",
  "horoscope.mantra": "Mantra",
  "horoscope.cosmic_energy": "Günün kozmik enerjisi",
  "horoscope.signed_by": "Okuma imzaladı",
  "horoscope.share_this": "Bu burcu paylaş",
  "horoscope.personalised_cta_title": "Daha kişisel bir okumaya mı ihtiyacın var?",
  "horoscope.personalised_cta_desc": "Burç genel bir okumadır. Tam doğum haritanı dikkate alan bir rehberlik için, dört kozmik rehberimizden birine soru sor.",
  "horoscope.personalised_cta_button": "Kahin'e sor",
  "horoscope.compatibilities_of": "Uyumluluklar",
  "horoscope.recent_archives": "Son arşivler",
  "horoscope.past_readings": "geçmiş okumalar",
  "horoscope.no_reading": "Yıldızlar hâlâ günün okumanı yazıyor. Birkaç saat sonra dön.",
  "horoscope.reading_in_progress": "Yıldızlar hâlâ yarının okumanı yazıyor",
  "horoscope.come_back_midnight": "Keşfetmek için gece yarısından sonra dön",
  "horoscope.tomorrow": "Yarın",
  "horoscope.premium_preview_badge": "Yıldız Önizleme",
  "horoscope.cosmic_energy_tomorrow": "Yarının kozmik enerjisi",
  "horoscope.paywall_title": "Önizleme erişimi",
  "horoscope.paywall_desc": "Yarının burcu Yıldız yolcularına sunulur. Gece yarısını beklemeden şimdi oku.",
  "horoscope.paywall_cta": "Yıldız'a geç",
  "horoscope.paywall_available_in": "veya şu sürede:",
  "horoscope.fr_translation_note": "Orijinal Fransızca okuma, tam çeviri yakında",
  "horoscope.archive_of": "Arşiv tarihi",
  "horoscope.preview_of": "Önizleme tarihi",
  "horoscope.back_to_today": "Günün burcuna dön",

  "tools.title": "Ücretsiz hesaplayıcılar",
  "tools.subtitle": "Tüm hesaplayıcılarımız doğrulanabilir yöntemler kullanır: numeroloji için Pisagor yöntemi ve astroloji için Swiss Ephemeris.",
  "tools.cta_oracle": "Kahin ile konuş",
  "tools.share_result": "Sonucumu paylaş",
  "tools.full_profile": "Tam profilimi gör",

  "signs.aries": "Koç",
  "signs.taurus": "Boğa",
  "signs.gemini": "İkizler",
  "signs.cancer": "Yengeç",
  "signs.leo": "Aslan",
  "signs.virgo": "Başak",
  "signs.libra": "Terazi",
  "signs.scorpio": "Akrep",
  "signs.sagittarius": "Yay",
  "signs.capricorn": "Oğlak",
  "signs.aquarius": "Kova",
  "signs.pisces": "Balık",

  "lang.select": "Dil seç",
  "lang.current": "Mevcut dil",

  "error.generic": "Bir hata oluştu",
  "error.network": "Bağlantı sorunu",
  "error.auth_required": "Giriş gerekli",
  "error.payment_failed": "Ödeme başarısız oldu",
};

// ============================================================
// PL (Polski) - passe 1 complete
// ============================================================

const pl: TranslationKeys = {
  "nav.home": "Strona główna",
  "nav.horoscope": "Horoskop",
  "nav.tools": "Narzędzia",
  "nav.blog": "Kosmos",
  "nav.referral": "Polecenia",
  "nav.oracle": "Wyrocznia",
  "nav.profile": "Mój profil",
  "nav.about": "Nasza historia",

  "common.menu": "Menu",
  "common.close": "Zamknij",
  "common.free": "Darmowe",
  "common.loading": "Ładowanie...",
  "common.error": "Wystąpił błąd",
  "common.retry": "Spróbuj ponownie",
  "common.back": "Wstecz",
  "common.share": "Udostępnij",
  "common.download_pdf": "Pobierz PDF",
  "common.calculate": "Oblicz",
  "common.copy_link": "Kopiuj link",
  "common.copied": "Skopiowano",
  "common.learn_more": "Dowiedz się więcej",
  "common.get_started": "Zacznij",
  "common.cta_app": "Mój kosmiczny profil",

  "footer.tagline": "Twoja mapa życia zapisana w gwiazdach i liczbach",
  "footer.about": "Nasza historia",
  "footer.legal": "Informacje prawne",
  "footer.contact": "Kontakt",
  "footer.cgv": "Warunki sprzedaży",
  "footer.privacy": "Polityka prywatności",
  "footer.terms": "Warunki użytkowania",
  "footer.quote": "Gwiazdy skłaniają, ale nie determinują",
  "footer.quote_author": "Tomasz z Akwinu",

  "hero.title": "Twoja kosmiczna mapa życia, odszyfrowana",
  "hero.subtitle": "Wyrocznia łączy Twój horoskop urodzeniowy, numerologię i przewodnictwo karmiczne w czasie rzeczywistym. Swiss Ephemeris, precyzja na poziomie NASA.",
  "hero.cta_primary": "Odkryj mój profil",
  "hero.cta_secondary": "Zobacz darmowe narzędzia",
  "hero.free_badge": "Darmowy start",

  "pricing.title": "Trzy ścieżki, jedna konstelacja",
  "pricing.free": "Darmowe",
  "pricing.monthly": "Miesięcznie",
  "pricing.annual": "Rocznie",
  "pricing.one_time": "Jednorazowa płatność",
  "pricing.per_month": "miesięcznie",
  "pricing.per_year": "rocznie",
  "pricing.most_popular": "Najpopularniejszy",
  "pricing.current_plan": "Obecny plan",
  "pricing.eveil_name": "Przebudzenie",
  "pricing.eveil_desc": "Pełny profil kosmiczny, 3 konsultacje Wyroczni dziennie, codzienny horoskop",
  "pricing.etoile_name": "Gwiazda",
  "pricing.etoile_desc": "Nielimitowana Wyrocznia, nielimitowane kompatybilności, szczegółowy kalendarz kosmiczny",
  "pricing.ame_soeur_name": "Bratnia Dusza",
  "pricing.ame_soeur_desc": "Jednorazowy rytuał: analiza karmiczna relacji + pełna synastria",
  "pricing.no_commitment": "Bez zobowiązań, anuluj w każdej chwili",
  "pricing.secure_payment": "Bezpieczna płatność przez Stripe",

  "oracle.ask": "Zadaj pytanie",
  "oracle.thinking": "Wyrocznia konsultuje się z gwiazdami...",
  "oracle.ask_placeholder": "Zadaj pytanie Wyroczni...",
  "oracle.feedback_resonates": "Przemawia do mnie",
  "oracle.feedback_interesting": "Ciekawe, opowiedz więcej",
  "oracle.feedback_not_this_time": "Nie tym razem",
  "oracle.choose_guide": "Z kim chcesz porozmawiać?",
  "oracle.change_guide": "Zmień przewodnika",

  "horoscope.daily": "Horoskop dzienny",
  "horoscope.title": "Horoskop",
  "horoscope.love": "Miłość",
  "horoscope.work": "Praca",
  "horoscope.energy": "Energia",
  "horoscope.intuition": "Intuicja",
  "horoscope.lucky_number": "Szczęśliwa liczba",
  "horoscope.color": "Kolor",
  "horoscope.mantra": "Mantra",
  "horoscope.cosmic_energy": "Kosmiczna energia dnia",
  "horoscope.signed_by": "Czytanie podpisane przez",
  "horoscope.share_this": "Udostępnij ten horoskop",
  "horoscope.personalised_cta_title": "Potrzebujesz bardziej osobistej lektury?",
  "horoscope.personalised_cta_desc": "Horoskop to ogólna lektura. Aby uzyskać wskazówki uwzględniające pełny horoskop urodzeniowy, zadaj pytanie jednemu z naszych czterech kosmicznych przewodników.",
  "horoscope.personalised_cta_button": "Zapytaj Wyrocznię",
  "horoscope.compatibilities_of": "Kompatybilności",
  "horoscope.recent_archives": "Ostatnie archiwa",
  "horoscope.past_readings": "poprzednie czytania",
  "horoscope.no_reading": "Gwiazdy wciąż piszą twoje dzisiejsze czytanie. Wróć za kilka godzin.",
  "horoscope.reading_in_progress": "Gwiazdy wciąż piszą twoje jutrzejsze czytanie",
  "horoscope.come_back_midnight": "Wróć po północy, aby je odkryć",
  "horoscope.tomorrow": "Jutro",
  "horoscope.premium_preview_badge": "Podgląd Gwiazda",
  "horoscope.cosmic_energy_tomorrow": "Kosmiczna energia jutra",
  "horoscope.paywall_title": "Dostęp w przedpremierze",
  "horoscope.paywall_desc": "Jutrzejszy horoskop jest oferowany podróżnikom Gwiazda. Przeczytaj go teraz, bez czekania do północy.",
  "horoscope.paywall_cta": "Przejdź na Gwiazdę",
  "horoscope.paywall_available_in": "lub dostępne za",
  "horoscope.fr_translation_note": "Oryginalne czytanie po francusku, pełne tłumaczenie wkrótce",
  "horoscope.archive_of": "Archiwum z",
  "horoscope.preview_of": "Zapowiedź z",
  "horoscope.back_to_today": "Wróć do dzisiejszego horoskopu",

  "tools.title": "Darmowe kalkulatory",
  "tools.subtitle": "Wszystkie nasze kalkulatory używają sprawdzalnych metod: numerologia pitagorejska i Swiss Ephemeris dla astrologii.",
  "tools.cta_oracle": "Porozmawiaj z Wyrocznią",
  "tools.share_result": "Udostępnij mój wynik",
  "tools.full_profile": "Zobacz mój pełny profil",

  "signs.aries": "Baran",
  "signs.taurus": "Byk",
  "signs.gemini": "Bliźnięta",
  "signs.cancer": "Rak",
  "signs.leo": "Lew",
  "signs.virgo": "Panna",
  "signs.libra": "Waga",
  "signs.scorpio": "Skorpion",
  "signs.sagittarius": "Strzelec",
  "signs.capricorn": "Koziorożec",
  "signs.aquarius": "Wodnik",
  "signs.pisces": "Ryby",

  "lang.select": "Wybierz język",
  "lang.current": "Obecny język",

  "error.generic": "Wystąpił błąd",
  "error.network": "Problem z połączeniem",
  "error.auth_required": "Wymagane logowanie",
  "error.payment_failed": "Płatność nie powiodła się",
};

// ============================================================
// RU (Русский) - passe 1 complete
// ============================================================

const ru: TranslationKeys = {
  "nav.home": "Главная",
  "nav.horoscope": "Гороскоп",
  "nav.tools": "Инструменты",
  "nav.blog": "Космос",
  "nav.referral": "Приглашения",
  "nav.oracle": "Оракул",
  "nav.profile": "Мой профиль",
  "nav.about": "Наша история",

  "common.menu": "Меню",
  "common.close": "Закрыть",
  "common.free": "Бесплатно",
  "common.loading": "Загрузка...",
  "common.error": "Произошла ошибка",
  "common.retry": "Повторить",
  "common.back": "Назад",
  "common.share": "Поделиться",
  "common.download_pdf": "Скачать PDF",
  "common.calculate": "Рассчитать",
  "common.copy_link": "Скопировать ссылку",
  "common.copied": "Скопировано",
  "common.learn_more": "Узнать больше",
  "common.get_started": "Начать",
  "common.cta_app": "Мой космический профиль",

  "footer.tagline": "Твоя карта жизни, написанная в звёздах и числах",
  "footer.about": "Наша история",
  "footer.legal": "Юридическая информация",
  "footer.contact": "Контакт",
  "footer.cgv": "Условия продажи",
  "footer.privacy": "Политика конфиденциальности",
  "footer.terms": "Условия использования",
  "footer.quote": "Звёзды склоняют, но не определяют",
  "footer.quote_author": "Фома Аквинский",

  "hero.title": "Твоя космическая карта жизни, расшифрована",
  "hero.subtitle": "Оракул объединяет твою натальную карту, нумерологию и кармическое руководство в реальном времени. Swiss Ephemeris, точность уровня NASA.",
  "hero.cta_primary": "Открыть мой профиль",
  "hero.cta_secondary": "Посмотреть бесплатные инструменты",
  "hero.free_badge": "Бесплатный старт",

  "pricing.title": "Три пути, одно созвездие",
  "pricing.free": "Бесплатно",
  "pricing.monthly": "Ежемесячно",
  "pricing.annual": "Ежегодно",
  "pricing.one_time": "Единоразовый платёж",
  "pricing.per_month": "в месяц",
  "pricing.per_year": "в год",
  "pricing.most_popular": "Самый популярный",
  "pricing.current_plan": "Текущий план",
  "pricing.eveil_name": "Пробуждение",
  "pricing.eveil_desc": "Полный космический профиль, 3 консультации Оракула в день, ежедневный гороскоп",
  "pricing.etoile_name": "Звезда",
  "pricing.etoile_desc": "Безлимитный Оракул, безлимитные совместимости, детальный космический календарь",
  "pricing.ame_soeur_name": "Родственная душа",
  "pricing.ame_soeur_desc": "Единоразовый ритуал: кармический анализ отношений + полная синастрия",
  "pricing.no_commitment": "Без обязательств, отмена в любое время",
  "pricing.secure_payment": "Безопасный платёж через Stripe",

  "oracle.ask": "Задай вопрос",
  "oracle.thinking": "Оракул советуется со звёздами...",
  "oracle.ask_placeholder": "Задай вопрос Оракулу...",
  "oracle.feedback_resonates": "Откликается",
  "oracle.feedback_interesting": "Интересно, расскажи больше",
  "oracle.feedback_not_this_time": "Не в этот раз",
  "oracle.choose_guide": "С кем хочешь поговорить?",
  "oracle.change_guide": "Сменить проводника",

  "horoscope.daily": "Гороскоп дня",
  "horoscope.title": "Гороскоп",
  "horoscope.love": "Любовь",
  "horoscope.work": "Работа",
  "horoscope.energy": "Энергия",
  "horoscope.intuition": "Интуиция",
  "horoscope.lucky_number": "Счастливое число",
  "horoscope.color": "Цвет",
  "horoscope.mantra": "Мантра",
  "horoscope.cosmic_energy": "Космическая энергия дня",
  "horoscope.signed_by": "Чтение подписано",
  "horoscope.share_this": "Поделиться этим гороскопом",
  "horoscope.personalised_cta_title": "Нужно более личное чтение?",
  "horoscope.personalised_cta_desc": "Гороскоп - это общее чтение. Для руководства, учитывающего твою полную натальную карту, задай вопрос одному из наших четырёх космических проводников.",
  "horoscope.personalised_cta_button": "Спроси Оракула",
  "horoscope.compatibilities_of": "Совместимости",
  "horoscope.recent_archives": "Недавние архивы",
  "horoscope.past_readings": "прошлые чтения",
  "horoscope.no_reading": "Звёзды ещё пишут твоё чтение дня. Возвращайся через несколько часов.",
  "horoscope.reading_in_progress": "Звёзды ещё пишут твоё чтение на завтра",
  "horoscope.come_back_midnight": "Возвращайся после полуночи, чтобы открыть его",
  "horoscope.tomorrow": "Завтра",
  "horoscope.premium_preview_badge": "Предпросмотр Звезда",
  "horoscope.cosmic_energy_tomorrow": "Космическая энергия завтра",
  "horoscope.paywall_title": "Ранний доступ",
  "horoscope.paywall_desc": "Гороскоп на завтра предложен путешественницам и путешественникам Звезда. Читай сейчас, не дожидаясь полуночи.",
  "horoscope.paywall_cta": "Перейти на Звезду",
  "horoscope.paywall_available_in": "или доступно через",
  "horoscope.fr_translation_note": "Оригинальное чтение на французском, полный перевод скоро",
  "horoscope.archive_of": "Архив от",
  "horoscope.preview_of": "Предпросмотр от",
  "horoscope.back_to_today": "Вернуться к гороскопу дня",

  "tools.title": "Бесплатные калькуляторы",
  "tools.subtitle": "Все наши калькуляторы используют проверяемые методы: пифагорейская нумерология и Swiss Ephemeris для астрологии.",
  "tools.cta_oracle": "Поговорить с Оракулом",
  "tools.share_result": "Поделиться результатом",
  "tools.full_profile": "Посмотреть полный профиль",

  "signs.aries": "Овен",
  "signs.taurus": "Телец",
  "signs.gemini": "Близнецы",
  "signs.cancer": "Рак",
  "signs.leo": "Лев",
  "signs.virgo": "Дева",
  "signs.libra": "Весы",
  "signs.scorpio": "Скорпион",
  "signs.sagittarius": "Стрелец",
  "signs.capricorn": "Козерог",
  "signs.aquarius": "Водолей",
  "signs.pisces": "Рыбы",

  "lang.select": "Выбрать язык",
  "lang.current": "Текущий язык",

  "error.generic": "Произошла ошибка",
  "error.network": "Проблема с сетью",
  "error.auth_required": "Требуется вход",
  "error.payment_failed": "Платёж не прошёл",
};

// ============================================================
// JA (日本語) - passe 1 complete
// ============================================================

const ja: TranslationKeys = {
  "nav.home": "ホーム",
  "nav.horoscope": "ホロスコープ",
  "nav.tools": "ツール",
  "nav.blog": "コスモス",
  "nav.referral": "紹介",
  "nav.oracle": "オラクル",
  "nav.profile": "プロフィール",
  "nav.about": "私たちについて",

  "common.menu": "メニュー",
  "common.close": "閉じる",
  "common.free": "無料",
  "common.loading": "読み込み中...",
  "common.error": "エラーが発生しました",
  "common.retry": "再試行",
  "common.back": "戻る",
  "common.share": "シェア",
  "common.download_pdf": "PDFをダウンロード",
  "common.calculate": "計算する",
  "common.copy_link": "リンクをコピー",
  "common.copied": "コピーしました",
  "common.learn_more": "詳しく知る",
  "common.get_started": "始める",
  "common.cta_app": "私のコスミックプロフィール",

  "footer.tagline": "星と数に書かれたあなたの人生地図",
  "footer.about": "私たちについて",
  "footer.legal": "法的通知",
  "footer.contact": "お問い合わせ",
  "footer.cgv": "販売条件",
  "footer.privacy": "プライバシーポリシー",
  "footer.terms": "利用規約",
  "footer.quote": "星は傾けるが、強制しない",
  "footer.quote_author": "トマス・アクィナス",

  "hero.title": "解読された、あなたのコスミック人生地図",
  "hero.subtitle": "オラクルは、あなたの出生図、数秘術、カルマ的ガイダンスをリアルタイムで統合します。Swiss Ephemeris、NASA級の精度。",
  "hero.cta_primary": "プロフィールを発見する",
  "hero.cta_secondary": "無料ツールを見る",
  "hero.free_badge": "無料で始められます",

  "pricing.title": "3つの道、1つの星座",
  "pricing.free": "無料",
  "pricing.monthly": "月額",
  "pricing.annual": "年額",
  "pricing.one_time": "1回払い",
  "pricing.per_month": "/月",
  "pricing.per_year": "/年",
  "pricing.most_popular": "最も人気",
  "pricing.current_plan": "現在のプラン",
  "pricing.eveil_name": "覚醒",
  "pricing.eveil_desc": "完全なコスミックプロフィール、1日3回のオラクル相談、毎日のホロスコープ",
  "pricing.etoile_name": "星",
  "pricing.etoile_desc": "無制限のオラクル、無制限の相性、詳細なコスミックカレンダー",
  "pricing.ame_soeur_name": "ソウルメイト",
  "pricing.ame_soeur_desc": "ワンタイム儀式:関係のカルマ分析 + 完全なシナストリー",
  "pricing.no_commitment": "契約なし、いつでもキャンセル可",
  "pricing.secure_payment": "Stripeによる安全な支払い",

  "oracle.ask": "質問をどうぞ",
  "oracle.thinking": "オラクルが星々に相談しています...",
  "oracle.ask_placeholder": "オラクルに質問する...",
  "oracle.feedback_resonates": "響きます",
  "oracle.feedback_interesting": "興味深い、もっと教えて",
  "oracle.feedback_not_this_time": "今回は違う",
  "oracle.choose_guide": "誰と話したいですか?",
  "oracle.change_guide": "ガイドを変更",

  "horoscope.daily": "今日のホロスコープ",
  "horoscope.title": "ホロスコープ",
  "horoscope.love": "恋愛",
  "horoscope.work": "仕事",
  "horoscope.energy": "エネルギー",
  "horoscope.intuition": "直感",
  "horoscope.lucky_number": "ラッキーナンバー",
  "horoscope.color": "色",
  "horoscope.mantra": "マントラ",
  "horoscope.cosmic_energy": "今日のコズミックエネルギー",
  "horoscope.signed_by": "署名者",
  "horoscope.share_this": "この占いをシェア",
  "horoscope.personalised_cta_title": "もっとパーソナルな占いが必要?",
  "horoscope.personalised_cta_desc": "ホロスコープは一般的な占いです。あなたの完全な出生図を考慮したガイダンスのために、4人のコスミックガイドの一人に質問してください。",
  "horoscope.personalised_cta_button": "オラクルに質問",
  "horoscope.compatibilities_of": "相性",
  "horoscope.recent_archives": "最近のアーカイブ",
  "horoscope.past_readings": "過去の占い",
  "horoscope.no_reading": "星々はまだ今日の占いを書いています。数時間後に戻ってきてください。",
  "horoscope.reading_in_progress": "星々はまだ明日の占いを書いています",
  "horoscope.come_back_midnight": "発見するには真夜中以降に戻ってきてください",
  "horoscope.tomorrow": "明日",
  "horoscope.premium_preview_badge": "スター先行プレビュー",
  "horoscope.cosmic_energy_tomorrow": "明日のコズミックエネルギー",
  "horoscope.paywall_title": "先行アクセス",
  "horoscope.paywall_desc": "明日のホロスコープはスター旅人に提供されます。真夜中を待たずに今すぐお読みください。",
  "horoscope.paywall_cta": "スターに変更",
  "horoscope.paywall_available_in": "または",
  "horoscope.fr_translation_note": "原文はフランス語、完全翻訳は近日公開",
  "horoscope.archive_of": "アーカイブ:",
  "horoscope.preview_of": "プレビュー:",
  "horoscope.back_to_today": "今日のホロスコープに戻る",

  "tools.title": "無料計算機",
  "tools.subtitle": "全ての計算機は検証可能な方法を使用:数秘術はピタゴラス式、占星術は Swiss Ephemeris。",
  "tools.cta_oracle": "オラクルと話す",
  "tools.share_result": "結果をシェア",
  "tools.full_profile": "完全なプロフィールを見る",

  "signs.aries": "牡羊座",
  "signs.taurus": "牡牛座",
  "signs.gemini": "双子座",
  "signs.cancer": "蟹座",
  "signs.leo": "獅子座",
  "signs.virgo": "乙女座",
  "signs.libra": "天秤座",
  "signs.scorpio": "蠍座",
  "signs.sagittarius": "射手座",
  "signs.capricorn": "山羊座",
  "signs.aquarius": "水瓶座",
  "signs.pisces": "魚座",

  "lang.select": "言語を選択",
  "lang.current": "現在の言語",

  "error.generic": "エラーが発生しました",
  "error.network": "ネットワークの問題",
  "error.auth_required": "ログインが必要",
  "error.payment_failed": "支払いに失敗しました",
};

// ============================================================
// AR (العربية) - passe 1 complete, RTL
// ============================================================

const ar: TranslationKeys = {
  "nav.home": "الرئيسية",
  "nav.horoscope": "الأبراج",
  "nav.tools": "الأدوات",
  "nav.blog": "الكون",
  "nav.referral": "الإحالة",
  "nav.oracle": "العرّاف",
  "nav.profile": "ملفي",
  "nav.about": "قصتنا",

  "common.menu": "القائمة",
  "common.close": "إغلاق",
  "common.free": "مجاني",
  "common.loading": "جار التحميل...",
  "common.error": "حدث خطأ",
  "common.retry": "إعادة المحاولة",
  "common.back": "رجوع",
  "common.share": "مشاركة",
  "common.download_pdf": "تحميل PDF",
  "common.calculate": "احسب",
  "common.copy_link": "نسخ الرابط",
  "common.copied": "تم النسخ",
  "common.learn_more": "اعرف المزيد",
  "common.get_started": "ابدأ",
  "common.cta_app": "ملفي الكوني",

  "footer.tagline": "خريطة حياتك مكتوبة في النجوم والأرقام",
  "footer.about": "قصتنا",
  "footer.legal": "إشعار قانوني",
  "footer.contact": "اتصل بنا",
  "footer.cgv": "شروط البيع",
  "footer.privacy": "سياسة الخصوصية",
  "footer.terms": "شروط الاستخدام",
  "footer.quote": "النجوم تميل ولكن لا تُحتّم",
  "footer.quote_author": "توما الأكويني",

  "hero.title": "خريطة حياتك الكونية، مفكّكة",
  "hero.subtitle": "العرّاف يدمج خريطتك الفلكية وعلم الأعداد والإرشاد الكرمي في الوقت الفعلي. Swiss Ephemeris، دقة مستوى NASA.",
  "hero.cta_primary": "اكتشف ملفي",
  "hero.cta_secondary": "شاهد الأدوات المجانية",
  "hero.free_badge": "ابدأ مجاناً",

  "pricing.title": "ثلاث طرق، كوكبة واحدة",
  "pricing.free": "مجاني",
  "pricing.monthly": "شهري",
  "pricing.annual": "سنوي",
  "pricing.one_time": "دفعة واحدة",
  "pricing.per_month": "شهرياً",
  "pricing.per_year": "سنوياً",
  "pricing.most_popular": "الأكثر شعبية",
  "pricing.current_plan": "الخطة الحالية",
  "pricing.eveil_name": "الصحوة",
  "pricing.eveil_desc": "ملف كوني كامل، 3 استشارات مع العرّاف يومياً، برج يومي",
  "pricing.etoile_name": "النجم",
  "pricing.etoile_desc": "عرّاف غير محدود، توافقات غير محدودة، تقويم كوني مفصل",
  "pricing.ame_soeur_name": "توأم الروح",
  "pricing.ame_soeur_desc": "طقس لمرة واحدة: تحليل كرمي لعلاقة + توافق فلكي كامل",
  "pricing.no_commitment": "بدون التزام، إلغاء في أي وقت",
  "pricing.secure_payment": "دفع آمن عبر Stripe",

  "oracle.ask": "اطرح سؤالك",
  "oracle.thinking": "العرّاف يستشير النجوم...",
  "oracle.ask_placeholder": "اطرح سؤالاً على العرّاف...",
  "oracle.feedback_resonates": "يلامسني",
  "oracle.feedback_interesting": "مثير للاهتمام، أخبرني المزيد",
  "oracle.feedback_not_this_time": "ليست هذه المرة",
  "oracle.choose_guide": "مع من تريد التحدث؟",
  "oracle.change_guide": "تغيير المرشد",

  "horoscope.daily": "برج اليوم",
  "horoscope.title": "الأبراج",
  "horoscope.love": "الحب",
  "horoscope.work": "العمل",
  "horoscope.energy": "الطاقة",
  "horoscope.intuition": "الحدس",
  "horoscope.lucky_number": "الرقم المحظوظ",
  "horoscope.color": "اللون",
  "horoscope.mantra": "المنترا",
  "horoscope.cosmic_energy": "الطاقة الكونية لليوم",
  "horoscope.signed_by": "قراءة موقعة من",
  "horoscope.share_this": "شارك هذا البرج",
  "horoscope.personalised_cta_title": "هل تحتاج إلى قراءة أكثر شخصية؟",
  "horoscope.personalised_cta_desc": "البرج قراءة عامة. للحصول على إرشاد يأخذ في الاعتبار خريطة ميلادك الكاملة، اطرح سؤالك على أحد مرشدينا الكونيين الأربعة.",
  "horoscope.personalised_cta_button": "اسأل العرّاف",
  "horoscope.compatibilities_of": "توافقات",
  "horoscope.recent_archives": "الأرشيف الحديث",
  "horoscope.past_readings": "قراءات سابقة",
  "horoscope.no_reading": "النجوم لا تزال تكتب قراءتك لليوم. عد بعد ساعات قليلة.",
  "horoscope.reading_in_progress": "النجوم لا تزال تكتب قراءتك للغد",
  "horoscope.come_back_midnight": "عد بعد منتصف الليل لاكتشافها",
  "horoscope.tomorrow": "غداً",
  "horoscope.premium_preview_badge": "معاينة النجم",
  "horoscope.cosmic_energy_tomorrow": "الطاقة الكونية للغد",
  "horoscope.paywall_title": "وصول مبكر",
  "horoscope.paywall_desc": "برج الغد مقدم لمسافرات ومسافري النجم. اقرأه الآن، دون انتظار منتصف الليل.",
  "horoscope.paywall_cta": "الانتقال إلى النجم",
  "horoscope.paywall_available_in": "أو متاح خلال",
  "horoscope.fr_translation_note": "قراءة أصلية بالفرنسية، الترجمة الكاملة قريباً",
  "horoscope.archive_of": "أرشيف من",
  "horoscope.preview_of": "معاينة من",
  "horoscope.back_to_today": "العودة إلى برج اليوم",

  "tools.title": "حاسبات مجانية",
  "tools.subtitle": "جميع حاسباتنا تستخدم طرقاً قابلة للتحقق: علم الأعداد الفيثاغوري و Swiss Ephemeris للتنجيم.",
  "tools.cta_oracle": "تحدث إلى العرّاف",
  "tools.share_result": "شارك نتيجتي",
  "tools.full_profile": "شاهد ملفي الكامل",

  "signs.aries": "الحمل",
  "signs.taurus": "الثور",
  "signs.gemini": "الجوزاء",
  "signs.cancer": "السرطان",
  "signs.leo": "الأسد",
  "signs.virgo": "العذراء",
  "signs.libra": "الميزان",
  "signs.scorpio": "العقرب",
  "signs.sagittarius": "القوس",
  "signs.capricorn": "الجدي",
  "signs.aquarius": "الدلو",
  "signs.pisces": "الحوت",

  "lang.select": "اختر اللغة",
  "lang.current": "اللغة الحالية",

  "error.generic": "حدث خطأ",
  "error.network": "مشكلة في الشبكة",
  "error.auth_required": "تسجيل الدخول مطلوب",
  "error.payment_failed": "فشل الدفع",
};

// ============================================================
// Translations map
// ============================================================

export const translations: Record<Locale, TranslationKeys> = {
  fr,
  en,
  es,
  pt,
  de,
  it,
  tr,
  ar,
  ja,
  pl,
  ru,
};

// Simple t() helper
export function t(key: keyof TranslationKeys, locale: Locale): string {
  return translations[locale]?.[key] || translations.fr[key] || key;
}

// Karmastro app UI translations.
// Mirror of the site/src/i18n/translations.ts philosophy, but focused on
// in-app strings (forms, CTAs, toasts, paywalls, dashboard, oracle, onboarding, ...).
//
// Nav + footer strings remain in nav.ts (shared with AppHeader/AppFooter).
// Zodiac/numerology data labels remain in lib/numerology.ts (separate concern).
// Admin page is intentionally NOT translated (staff-only, FR baseline).
//
// Pattern :
//   import { t } from "@/i18n/ui";
//   t("auth.title_login", locale)                          -> "Bon retour"
//   t("oracle.empty_listens", locale, { name: "Sibylle" }) -> "Sibylle t'ecoute"
//
// React hook sugar :
//   import { useT } from "@/i18n/ui";
//   const { t, locale } = useT();
//   <h1>{t("auth.title_login")}</h1>

import { useEffect, useState } from "react";
import { detectLocale, type AppLocale } from "@/lib/locale";

// ────────────────────────────────────────────────────────────────
// Key type registry
// Kept flat with dotted namespaces so IDE autocomplete works.
// ────────────────────────────────────────────────────────────────

export type UiKey =
  // common (in-app)
  | "common.loading"
  | "common.save"
  | "common.cancel"
  | "common.back"
  | "common.continue"
  | "common.retry"
  | "common.error_generic"
  | "common.date_placeholder"
  | "common.date_error_format"
  | "common.onboarding_loading"

  // cookie banner
  | "cookie.title"
  | "cookie.desc"
  | "cookie.learn_more"
  | "cookie.accept_all"
  | "cookie.essentials_only"
  | "cookie.refuse"

  // bottom nav (mobile)
  | "bottomnav.home"
  | "bottomnav.oracle"
  | "bottomnav.calendar"
  | "bottomnav.profile"
  | "bottomnav.more"

  // auth
  | "auth.back"
  | "auth.title_login"
  | "auth.title_signup"
  | "auth.subtitle_login"
  | "auth.subtitle_signup"
  | "auth.referral_invited"
  | "auth.referral_with_code"
  | "auth.continue_google"
  | "auth.separator_or"
  | "auth.email_placeholder"
  | "auth.password_placeholder"
  | "auth.forgot_password"
  | "auth.submit_login"
  | "auth.submit_signup"
  | "auth.loading"
  | "auth.no_account"
  | "auth.have_account"
  | "auth.switch_signup"
  | "auth.switch_login"
  | "auth.toast_account_created_title"
  | "auth.toast_welcome_invited"
  | "auth.toast_verify_email"
  | "auth.toast_error_title"
  | "auth.toast_google_error_title"
  | "auth.toast_google_error_desc"
  | "auth.toast_enter_email"
  | "auth.toast_email_sent_title"
  | "auth.toast_email_sent_desc"

  // onboarding
  | "onboarding.step0_title"
  | "onboarding.step0_subtitle"
  | "onboarding.birth_date_label"
  | "onboarding.birth_time_label"
  | "onboarding.birth_time_none"
  | "onboarding.birth_time_unknown"
  | "onboarding.birth_time_known"
  | "onboarding.birth_place_label"
  | "onboarding.birth_place_placeholder"
  | "onboarding.birth_place_not_found"
  | "onboarding.step1_title"
  | "onboarding.step1_subtitle"
  | "onboarding.first_name_label"
  | "onboarding.first_name_placeholder"
  | "onboarding.last_name_label"
  | "onboarding.last_name_placeholder"
  | "onboarding.birth_name_label"
  | "onboarding.birth_name_placeholder"
  | "onboarding.current_name_label"
  | "onboarding.step2_title"
  | "onboarding.step2_subtitle"
  | "onboarding.gender_label"
  | "onboarding.gender_female"
  | "onboarding.gender_male"
  | "onboarding.gender_nonbinary"
  | "onboarding.gender_other"
  | "onboarding.interests_label"
  | "onboarding.interest_astro"
  | "onboarding.interest_numero"
  | "onboarding.interest_tarot"
  | "onboarding.interest_karma"
  | "onboarding.interest_lune"
  | "onboarding.interest_meditation"
  | "onboarding.level_label"
  | "onboarding.level_beginner"
  | "onboarding.level_beginner_desc"
  | "onboarding.level_intermediate"
  | "onboarding.level_intermediate_desc"
  | "onboarding.level_advanced"
  | "onboarding.level_advanced_desc"
  | "onboarding.scan_1"
  | "onboarding.scan_1_sub"
  | "onboarding.scan_2"
  | "onboarding.scan_2_sub"
  | "onboarding.scan_3"
  | "onboarding.scan_3_sub"
  | "onboarding.scan_4"
  | "onboarding.scan_4_sub"
  | "onboarding.precision_badge"
  | "onboarding.reveal_title"
  | "onboarding.reveal_subtitle"
  | "onboarding.card_sun_sign"
  | "onboarding.card_life_path"
  | "onboarding.card_via"
  | "onboarding.card_expression"
  | "onboarding.card_soul_urge"
  | "onboarding.card_personal_year"
  | "onboarding.card_karmic_debts"
  | "onboarding.karmic_none"
  | "onboarding.nav_back"
  | "onboarding.nav_continue"
  | "onboarding.cta_saving"
  | "onboarding.cta_finish"
  | "onboarding.toast_login_required"
  | "onboarding.toast_error_title"

  // pricing
  | "pricing.header_title"
  | "pricing.header_subtitle"
  | "pricing.current_plan_prefix"
  | "pricing.current_plan_etoile"
  | "pricing.current_plan_ame_soeur"
  | "pricing.current_credits"
  | "pricing.period_monthly"
  | "pricing.period_annual"
  | "pricing.period_annual_badge"
  | "pricing.tier_eveil"
  | "pricing.tier_eveil_price"
  | "pricing.tier_eveil_price_hint"
  | "pricing.tier_eveil_current"
  | "pricing.tier_eveil_f1"
  | "pricing.tier_eveil_f2"
  | "pricing.tier_eveil_f3"
  | "pricing.tier_eveil_f4"
  | "pricing.most_popular"
  | "pricing.tier_etoile"
  | "pricing.per_month"
  | "pricing.per_year"
  | "pricing.annual_saves"
  | "pricing.tier_etoile_f1"
  | "pricing.tier_etoile_f2"
  | "pricing.tier_etoile_f3"
  | "pricing.tier_etoile_f4"
  | "pricing.tier_etoile_f5"
  | "pricing.tier_etoile_f6"
  | "pricing.cta_loading"
  | "pricing.cta_etoile_monthly"
  | "pricing.cta_etoile_annual"
  | "pricing.cta_current_plan"
  | "pricing.tier_ame_soeur"
  | "pricing.tier_ame_soeur_kind"
  | "pricing.once_only"
  | "pricing.tier_ame_soeur_f1"
  | "pricing.tier_ame_soeur_f2"
  | "pricing.tier_ame_soeur_f3"
  | "pricing.tier_ame_soeur_f4"
  | "pricing.cta_ame_soeur"
  | "pricing.credit_packs_title"
  | "pricing.credit_intro"
  | "pricing.pack_lune"
  | "pricing.pack_soleil"
  | "pricing.pack_cosmos"
  | "pricing.pack_best_value"
  | "pricing.pack_credits"
  | "pricing.faq_no_commit_title"
  | "pricing.faq_no_commit_desc"
  | "pricing.faq_stripe_title"
  | "pricing.faq_stripe_desc"
  | "pricing.faq_referral_title"
  | "pricing.faq_referral_desc"
  | "pricing.toast_auth_required_title"
  | "pricing.toast_auth_required_desc"
  | "pricing.toast_checkout_error_title"
  | "pricing.checkout_session_expired"
  | "pricing.checkout_create_failed"

  // oracle (guides + UI)
  | "oracle.guide_sibylle_name"
  | "oracle.guide_sibylle_title"
  | "oracle.guide_sibylle_desc"
  | "oracle.guide_sibylle_strengths"
  | "oracle.guide_sibylle_opener"
  | "oracle.guide_sibylle_sugg1"
  | "oracle.guide_sibylle_sugg2"
  | "oracle.guide_sibylle_sugg3"
  | "oracle.guide_sibylle_sugg4"
  | "oracle.guide_orion_name"
  | "oracle.guide_orion_title"
  | "oracle.guide_orion_desc"
  | "oracle.guide_orion_strengths"
  | "oracle.guide_orion_opener"
  | "oracle.guide_orion_sugg1"
  | "oracle.guide_orion_sugg2"
  | "oracle.guide_orion_sugg3"
  | "oracle.guide_orion_sugg4"
  | "oracle.guide_selene_name"
  | "oracle.guide_selene_title"
  | "oracle.guide_selene_desc"
  | "oracle.guide_selene_strengths"
  | "oracle.guide_selene_opener"
  | "oracle.guide_selene_sugg1"
  | "oracle.guide_selene_sugg2"
  | "oracle.guide_selene_sugg3"
  | "oracle.guide_selene_sugg4"
  | "oracle.guide_pythia_name"
  | "oracle.guide_pythia_title"
  | "oracle.guide_pythia_desc"
  | "oracle.guide_pythia_strengths"
  | "oracle.guide_pythia_opener"
  | "oracle.guide_pythia_sugg1"
  | "oracle.guide_pythia_sugg2"
  | "oracle.guide_pythia_sugg3"
  | "oracle.guide_pythia_sugg4"
  | "oracle.header_title"
  | "oracle.header_subtitle_picker"
  | "oracle.picker_title"
  | "oracle.picker_subtitle"
  | "oracle.picker_change_note"
  | "oracle.guide_pill_talking_to"
  | "oracle.guide_pill_change"
  | "oracle.empty_listens"
  | "oracle.paywall_title"
  | "oracle.paywall_default_msg"
  | "oracle.paywall_cta_etoile"
  | "oracle.paywall_cta_credits"
  | "oracle.feedback_prompt"
  | "oracle.feedback_resonates"
  | "oracle.feedback_interesting"
  | "oracle.feedback_not_now"
  | "oracle.feedback_expanded_r3"
  | "oracle.feedback_expanded_r2"
  | "oracle.feedback_expanded_r1"
  | "oracle.feedback_optional"
  | "oracle.feedback_placeholder"
  | "oracle.feedback_skip"
  | "oracle.feedback_send"
  | "oracle.feedback_submitted"
  | "oracle.feedback_toast_title"
  | "oracle.feedback_toast_desc"
  | "oracle.feedback_error_title"
  | "oracle.feedback_error_desc"
  | "oracle.input_placeholder"
  | "oracle.error_unreachable"
  | "oracle.error_fallback_msg"
  | "oracle.error_no_stream"
  | "oracle.error_generic"

  // dashboard
  | "dashboard.greeting"
  | "dashboard.badge_cv"
  | "dashboard.badge_py"
  | "dashboard.rdv_title"
  | "dashboard.retrograde_pill"
  | "dashboard.personal_day_pill"
  | "dashboard.premium_locked_sections"
  | "dashboard.read_more"
  | "dashboard.read_less"
  | "dashboard.affirmation_prefix"
  | "dashboard.do_title"
  | "dashboard.tap_for_why"
  | "dashboard.do_today"
  | "dashboard.dont_today"
  | "dashboard.energy_title"
  | "dashboard.energy_sante"
  | "dashboard.energy_spiritu"
  | "dashboard.day_number_title"
  | "dashboard.day_number_keyword"
  | "dashboard.moon_title"
  | "dashboard.moon_phase_generic"
  | "dashboard.cosmic_tip_title"
  | "dashboard.cosmic_tip_default"
  | "dashboard.transits_title"
  | "dashboard.transits_gated"
  | "dashboard.cta_banner_title"
  | "dashboard.cta_banner_desc"
  | "dashboard.cta_chip_oracle"
  | "dashboard.cta_chip_transits"
  | "dashboard.cta_chip_numero"
  | "dashboard.cta_chip_karmic"
  | "dashboard.cta_chip_calendar"
  | "dashboard.cta_chip_compat"
  | "dashboard.cta_etoile"
  | "dashboard.quick_access_title"
  | "dashboard.quick_astral"
  | "dashboard.quick_numerology"
  | "dashboard.quick_compat"
  | "dashboard.quick_oracle"
  | "dashboard.quick_calendar"
  | "dashboard.quick_learn"
  | "dashboard.history_title"
  | "dashboard.premium_label"
  | "dashboard.locked_cta"
  | "dashboard.locked_etoile"

  // astral
  | "astral.header_title"
  | "astral.label_sun"
  | "astral.label_moon"
  | "astral.label_ascendant"
  | "astral.positions_title"
  | "astral.aspects_title"
  | "astral.houses_title"

  // compat (in-app)
  | "compat.header_title"
  | "compat.add_person"
  | "compat.score_global"
  | "compat.see_analysis"
  | "compat.strengths"
  | "compat.frictions"
  | "compat.karmic_guidance"

  // numerology
  | "numerology.header_title"
  | "numerology.core_title"
  | "numerology.label_life_path"
  | "numerology.label_expression"
  | "numerology.label_soul_urge"
  | "numerology.label_personality"
  | "numerology.label_birthday"
  | "numerology.birthday_desc"
  | "numerology.full_interpretation"
  | "numerology.dynamic_title"
  | "numerology.label_personal_year"
  | "numerology.label_personal_month"
  | "numerology.label_personal_day"
  | "numerology.inclusion_title"
  | "numerology.inclusion_desc"
  | "numerology.absent"
  | "numerology.mini_calendar_title"
  | "numerology.see_all"

  // learn
  | "learn.header_title"
  | "learn.intro"
  | "learn.count_articles"
  | "learn.count_guide"
  | "learn.guide_zodiac_title"
  | "learn.guide_zodiac_desc"
  | "learn.guide_planets_title"
  | "learn.guide_planets_desc"
  | "learn.guide_houses_title"
  | "learn.guide_houses_desc"
  | "learn.guide_aspects_title"
  | "learn.guide_aspects_desc"
  | "learn.guide_numerology_title"
  | "learn.guide_numerology_desc"
  | "learn.guide_lifepaths_title"
  | "learn.guide_lifepaths_desc"
  | "learn.guide_karma_title"
  | "learn.guide_karma_desc"
  | "learn.guide_transits_title"
  | "learn.guide_transits_desc"
  | "learn.guide_moon_title"
  | "learn.guide_moon_desc"
  | "learn.guide_compat_title"
  | "learn.guide_compat_desc"

  // profile
  | "profile.header_title"
  | "profile.year_label"
  | "profile.karmic_debt"
  | "profile.north_node"
  | "profile.referral_title"
  | "profile.referral_intro"
  | "profile.copy_link"
  | "profile.copied"
  | "profile.share"
  | "profile.godchildren_count"
  | "profile.pending_count"
  | "profile.next_badge"
  | "profile.all_badges_done"
  | "profile.badges_title"
  | "profile.badge_eclaireur"
  | "profile.badge_guide"
  | "profile.badge_constellation"
  | "profile.badge_nebuleuse"
  | "profile.quick_astral_full"
  | "profile.quick_numero_full"
  | "profile.quick_calendar"
  | "profile.quick_compat"
  | "profile.quick_learn"
  | "profile.toast_link_copied_title"
  | "profile.toast_link_copied_desc"
  | "profile.share_title"
  | "profile.share_text"

  // settings
  | "settings.header_title"
  | "settings.language"
  | "settings.notifications"
  | "settings.notifications_on"
  | "settings.theme"
  | "settings.theme_night"
  | "settings.detail_level"
  | "settings.detail_intermediate"
  | "settings.upgrade_cta"
  | "settings.logout"
  | "settings.footer_version"

  // calendar
  | "calendar.header_title"
  | "calendar.legend_favorable"
  | "calendar.legend_warning"
  | "calendar.legend_spiritual"
  | "calendar.day_label"
  | "calendar.day_prefix"
  | "calendar.day_generic"

  // notfound
  | "notfound.title"
  | "notfound.message"
  | "notfound.cta_home"

  // reset password
  | "reset.title"
  | "reset.placeholder"
  | "reset.loading"
  | "reset.submit"
  | "reset.toast_success_title"
  | "reset.toast_error_title"

  // admin (restricted-access only, the admin UI itself stays FR)
  | "admin.restricted_title"
  | "admin.restricted_desc"
  | "admin.restricted_back"
  | "admin.loading"

  // landing (marketing page served by the app when site redirect fails)
  | "landing.header_login"
  | "landing.header_start"
  | "landing.hero_title_1"
  | "landing.hero_title_2"
  | "landing.hero_title_3"
  | "landing.hero_tagline"
  | "landing.hero_precision_badge"
  | "landing.calc_title"
  | "landing.calc_firstname_placeholder"
  | "landing.calc_discover"
  | "landing.calc_full_profile"
  | "landing.pillars_title_1"
  | "landing.pillars_title_2"
  | "landing.pillars_click_hint"
  | "landing.pillar_click_flip"
  | "landing.oracle_title_1"
  | "landing.oracle_title_2"
  | "landing.oracle_subtitle"
  | "landing.oracle_live_label"
  | "landing.oracle_live_next"
  | "landing.oracle_cta"
  | "landing.oracle_footnote"
  | "landing.testi_title_1"
  | "landing.testi_title_2"
  | "landing.pricing_title_1"
  | "landing.pricing_title_2"
  | "landing.pricing_eveil_title"
  | "landing.pricing_eveil_price"
  | "landing.pricing_eveil_cta"
  | "landing.pricing_etoile_badge"
  | "landing.pricing_etoile_title"
  | "landing.pricing_etoile_per_month"
  | "landing.pricing_etoile_annual_hint"
  | "landing.pricing_etoile_cta"
  | "landing.pricing_ame_title"
  | "landing.pricing_ame_unit"
  | "landing.pricing_ame_cta";

export type UiStrings = Record<UiKey, string>;

// ────────────────────────────────────────────────────────────────
// FR baseline (source of truth)
// ────────────────────────────────────────────────────────────────

export const fr: UiStrings = {
  "common.loading": "Chargement...",
  "common.save": "Enregistrer",
  "common.cancel": "Annuler",
  "common.back": "Retour",
  "common.continue": "Continuer",
  "common.retry": "Réessayer",
  "common.error_generic": "Une erreur est survenue",
  "common.date_placeholder": "JJ/MM/AAAA",
  "common.date_error_format": "Format attendu : JJ/MM/AAAA",
  "common.onboarding_loading": "Alignement des astres...",

  "cookie.title": "Les astres utilisent des cookies",
  "cookie.desc": "On utilise quelques cookies pour que ton expérience cosmique soit fluide. Rien de louche, promis : même si Mercure rétrograde, elle ne pourrait pas y accéder.",
  "cookie.learn_more": "En savoir plus",
  "cookie.accept_all": "Accepter tout",
  "cookie.essentials_only": "Essentiels uniquement",
  "cookie.refuse": "Refuser",

  "bottomnav.home": "Accueil",
  "bottomnav.oracle": "Oracle",
  "bottomnav.calendar": "Calendrier",
  "bottomnav.profile": "Profil",
  "bottomnav.more": "Plus",

  "auth.back": "Retour",
  "auth.title_login": "Bon retour",
  "auth.title_signup": "Bienvenue",
  "auth.subtitle_login": "Retrouve ton cosmos",
  "auth.subtitle_signup": "Commence ton voyage cosmique",
  "auth.referral_invited": "{name} t'a invité(e) sur Karmastro ✨",
  "auth.referral_with_code": "Tu arrives avec le code {code}",
  "auth.continue_google": "Continuer avec Google",
  "auth.separator_or": "ou",
  "auth.email_placeholder": "Email",
  "auth.password_placeholder": "Mot de passe",
  "auth.forgot_password": "Mot de passe oublié ?",
  "auth.submit_login": "Se connecter",
  "auth.submit_signup": "Créer mon compte",
  "auth.loading": "...",
  "auth.no_account": "Pas encore de compte ?",
  "auth.have_account": "Déjà un compte ?",
  "auth.switch_signup": "S'inscrire",
  "auth.switch_login": "Se connecter",
  "auth.toast_account_created_title": "Compte créé ✨",
  "auth.toast_welcome_invited": "Bienvenue ! Tu as été invité(e) par {name}.",
  "auth.toast_verify_email": "Vérifie ton email pour confirmer ton inscription.",
  "auth.toast_error_title": "Erreur",
  "auth.toast_google_error_title": "Connexion Google impossible",
  "auth.toast_google_error_desc": "Réessaie dans un instant.",
  "auth.toast_enter_email": "Entre ton email",
  "auth.toast_email_sent_title": "Email envoyé",
  "auth.toast_email_sent_desc": "Vérifie ta boîte de réception.",

  "onboarding.step0_title": "Tes coordonnées cosmiques",
  "onboarding.step0_subtitle": "Le ciel au moment de ta naissance",
  "onboarding.birth_date_label": "Date de naissance *",
  "onboarding.birth_time_label": "Heure de naissance",
  "onboarding.birth_time_none": "Pas de souci, nous utiliserons midi solaire",
  "onboarding.birth_time_unknown": "Je ne connais pas mon heure",
  "onboarding.birth_time_known": "Je connais mon heure",
  "onboarding.birth_place_label": "Lieu de naissance",
  "onboarding.birth_place_placeholder": "Paris, Lyon, Marseille...",
  "onboarding.birth_place_not_found": "Lieu non trouvé, précise ville + pays pour un ascendant exact",
  "onboarding.step1_title": "Ton identité vibratoire",
  "onboarding.step1_subtitle": "Chaque lettre porte une fréquence numérologique",
  "onboarding.first_name_label": "Prénom *",
  "onboarding.first_name_placeholder": "Léa",
  "onboarding.last_name_label": "Nom de famille",
  "onboarding.last_name_placeholder": "Moreau",
  "onboarding.birth_name_label": "Nom de naissance (si différent)",
  "onboarding.birth_name_placeholder": "Optionnel",
  "onboarding.current_name_label": "Nom d'usage actuel (si différent)",
  "onboarding.step2_title": "Personnalise ton cosmos",
  "onboarding.step2_subtitle": "Pour une expérience sur mesure",
  "onboarding.gender_label": "Genre",
  "onboarding.gender_female": "Femme",
  "onboarding.gender_male": "Homme",
  "onboarding.gender_nonbinary": "Non-binaire",
  "onboarding.gender_other": "Préfère ne pas dire",
  "onboarding.interests_label": "Centres d'intérêt",
  "onboarding.interest_astro": "Astrologie",
  "onboarding.interest_numero": "Numérologie",
  "onboarding.interest_tarot": "Tarot",
  "onboarding.interest_karma": "Karma et vies passées",
  "onboarding.interest_lune": "Cycles lunaires",
  "onboarding.interest_meditation": "Méditation",
  "onboarding.level_label": "Niveau",
  "onboarding.level_beginner": "Débutant",
  "onboarding.level_beginner_desc": "Je découvre",
  "onboarding.level_intermediate": "Intermédiaire",
  "onboarding.level_intermediate_desc": "J'ai des bases",
  "onboarding.level_advanced": "Avancé",
  "onboarding.level_advanced_desc": "Je pratique régulièrement",
  "onboarding.scan_1": "Alignement avec les éphémérides",
  "onboarding.scan_1_sub": "Positions planétaires Swiss Ephemeris",
  "onboarding.scan_2": "Calcul de ton thème natal",
  "onboarding.scan_2_sub": "12 planètes, 12 maisons, aspects majeurs",
  "onboarding.scan_3": "Connexion aux noeuds lunaires",
  "onboarding.scan_3_sub": "Trajectoire karmique et mission d'âme",
  "onboarding.scan_4": "Réduction pythagoricienne",
  "onboarding.scan_4_sub": "Chemin de vie, expression, âme",
  "onboarding.precision_badge": "Précision 0.001\" · Niveau NASA JPL",
  "onboarding.reveal_title": "Ton profil cosmique",
  "onboarding.reveal_subtitle": "{firstName}, voici ton empreinte céleste",
  "onboarding.card_sun_sign": "Signe solaire",
  "onboarding.card_life_path": "Chemin de vie",
  "onboarding.card_via": "Via {value}",
  "onboarding.card_expression": "Expression",
  "onboarding.card_soul_urge": "Nombre intime",
  "onboarding.card_personal_year": "Année personnelle",
  "onboarding.card_karmic_debts": "Dettes karmiques",
  "onboarding.karmic_none": "Aucune",
  "onboarding.nav_back": "Retour",
  "onboarding.nav_continue": "Continuer",
  "onboarding.cta_saving": "Enregistrement...",
  "onboarding.cta_finish": "Entrer dans mon cosmos",
  "onboarding.toast_login_required": "Connectez-vous d'abord",
  "onboarding.toast_error_title": "Erreur",

  "pricing.header_title": "Tarifs",
  "pricing.header_subtitle": "Choisis ton chemin",
  "pricing.current_plan_prefix": "Tu es actuellement en",
  "pricing.current_plan_etoile": "Étoile",
  "pricing.current_plan_ame_soeur": "Âme Soeur",
  "pricing.current_credits": "{count} crédits",
  "pricing.period_monthly": "Mensuel",
  "pricing.period_annual": "Annuel",
  "pricing.period_annual_badge": "-30%",
  "pricing.tier_eveil": "Éveil",
  "pricing.tier_eveil_price": "Gratuit",
  "pricing.tier_eveil_price_hint": "offert par les astres",
  "pricing.tier_eveil_current": "Plan actuel",
  "pricing.tier_eveil_f1": "Profil cosmique complet (thème natal + numérologie)",
  "pricing.tier_eveil_f2": "3 messages Oracle par jour",
  "pricing.tier_eveil_f3": "Horoscope quotidien détaillé",
  "pricing.tier_eveil_f4": "Calendrier cosmique basique",
  "pricing.most_popular": "★ Le plus populaire",
  "pricing.tier_etoile": "Étoile",
  "pricing.per_month": "/ mois",
  "pricing.per_year": "/ an",
  "pricing.annual_saves": "{price}/mois, économise 2 mois",
  "pricing.tier_etoile_f1": "Tout Éveil, plus :",
  "pricing.tier_etoile_f2": "Oracle illimité (4 guides au choix)",
  "pricing.tier_etoile_f3": "Compatibilité astro-numérologique illimitée",
  "pricing.tier_etoile_f4": "Calendrier cosmique détaillé (transits, rétrogrades)",
  "pricing.tier_etoile_f5": "Notifications transits en temps réel",
  "pricing.tier_etoile_f6": "Sans engagement, résiliable à tout moment",
  "pricing.cta_loading": "Chargement...",
  "pricing.cta_etoile_monthly": "Passer en Étoile",
  "pricing.cta_etoile_annual": "Étoile annuel, économise 20€",
  "pricing.cta_current_plan": "Plan actuel",
  "pricing.tier_ame_soeur": "Âme Soeur",
  "pricing.tier_ame_soeur_kind": "Rituel unique",
  "pricing.once_only": "une seule fois",
  "pricing.tier_ame_soeur_f1": "Analyse karmique approfondie d'une relation",
  "pricing.tier_ame_soeur_f2": "Synastrie astrologique complète",
  "pricing.tier_ame_soeur_f3": "Compatibilité numérologique détaillée",
  "pricing.tier_ame_soeur_f4": "Guidance karmique personnalisée par Séléné",
  "pricing.cta_ame_soeur": "Débloquer ce rituel",
  "pricing.credit_packs_title": "Packs de crédits",
  "pricing.credit_intro": "1 crédit = 1 consultation approfondie avec l'Oracle. Parfait pour les questions ponctuelles sans engagement.",
  "pricing.pack_lune": "Lune",
  "pricing.pack_soleil": "Soleil",
  "pricing.pack_cosmos": "Cosmos",
  "pricing.pack_best_value": "★ Best value",
  "pricing.pack_credits": "crédits",
  "pricing.faq_no_commit_title": "Sans engagement",
  "pricing.faq_no_commit_desc": "Tu peux résilier ou changer de plan à tout moment depuis ton profil.",
  "pricing.faq_stripe_title": "Paiement sécurisé par Stripe",
  "pricing.faq_stripe_desc": "Aucune donnée bancaire stockée chez Karmastro. Compatible CB, Apple Pay, Google Pay.",
  "pricing.faq_referral_title": "Récompenses parrainage",
  "pricing.faq_referral_desc": "Invite tes proches et gagnez tous les deux des bonus. Voir ton code dans ton profil.",
  "pricing.toast_auth_required_title": "Connexion requise",
  "pricing.toast_auth_required_desc": "Crée un compte pour débloquer cette offre.",
  "pricing.toast_checkout_error_title": "Erreur checkout",
  "pricing.checkout_session_expired": "Session expirée",
  "pricing.checkout_create_failed": "Impossible de créer la session",

  "oracle.guide_sibylle_name": "Sibylle",
  "oracle.guide_sibylle_title": "L'Oracle mystique",
  "oracle.guide_sibylle_desc": "Astrologue, poétique, profonde. Héritière des Sibylles antiques, prophétesses d'Apollon.",
  "oracle.guide_sibylle_strengths": "Astrologie profonde · Sens de la vie · Mythologie",
  "oracle.guide_sibylle_opener": "Sibylle consulte les astres...",
  "oracle.guide_sibylle_sugg1": "Que me dit mon thème natal sur ma mission de vie ?",
  "oracle.guide_sibylle_sugg2": "Comment interpréter ma Lune en opposition à Pluton ?",
  "oracle.guide_sibylle_sugg3": "Que raconte mon Saturne en maison VII ?",
  "oracle.guide_sibylle_sugg4": "Quel sens donner à mes transits actuels ?",
  "oracle.guide_orion_name": "Orion",
  "oracle.guide_orion_title": "L'Oracle analytique",
  "oracle.guide_orion_desc": "Astronome, clair, structuré. Maître des nombres et des chemins rationnels.",
  "oracle.guide_orion_strengths": "Numérologie · Calculs précis · Analyse",
  "oracle.guide_orion_opener": "Orion calcule ton empreinte...",
  "oracle.guide_orion_sugg1": "Quel est mon chemin de vie et que signifie-t-il ?",
  "oracle.guide_orion_sugg2": "Explique-moi ma numérologie complète.",
  "oracle.guide_orion_sugg3": "Comment aborder mon année personnelle ?",
  "oracle.guide_orion_sugg4": "Quels sont mes atouts numérologiques cachés ?",
  "oracle.guide_selene_name": "Séléné",
  "oracle.guide_selene_title": "L'Oracle karmique",
  "oracle.guide_selene_desc": "Âme ancienne, douce, profonde. Guide dans les mémoires et les leçons karmiques.",
  "oracle.guide_selene_strengths": "Karma · Vies passées · Guérison",
  "oracle.guide_selene_opener": "Séléné écoute ton âme...",
  "oracle.guide_selene_sugg1": "Quelles leçons karmiques dois-je intégrer cette vie ?",
  "oracle.guide_selene_sugg2": "Ai-je des blessures d'âme à guérir ?",
  "oracle.guide_selene_sugg3": "Que signifie mon noeud nord ?",
  "oracle.guide_selene_sugg4": "Comment libérer un schéma karmique récurrent ?",
  "oracle.guide_pythia_name": "Pythia",
  "oracle.guide_pythia_title": "L'Oracle pragmatique",
  "oracle.guide_pythia_desc": "Pythagoricienne, directe, actionable. Traduit le cosmos en décisions concrètes.",
  "oracle.guide_pythia_strengths": "Décisions · Stratégie · Concret",
  "oracle.guide_pythia_opener": "Pythia tranche le noeud...",
  "oracle.guide_pythia_sugg1": "Dois-je changer de travail en ce moment ?",
  "oracle.guide_pythia_sugg2": "Est-ce le bon moment pour une grande décision ?",
  "oracle.guide_pythia_sugg3": "Comment structurer ma semaine selon mon énergie ?",
  "oracle.guide_pythia_sugg4": "Que prioriser ce mois-ci ?",
  "oracle.header_title": "L'Oracle",
  "oracle.header_subtitle_picker": "Choisis ton guide",
  "oracle.picker_title": "À qui veux-tu parler ?",
  "oracle.picker_subtitle": "Quatre guides, quatre voix, quatre façons d'éclairer ton chemin. Choisis celui qui résonne avec ce que tu cherches aujourd'hui.",
  "oracle.picker_change_note": "Tu pourras changer de guide à tout moment depuis le chat.",
  "oracle.guide_pill_talking_to": "Tu parles à {name}",
  "oracle.guide_pill_change": "Changer",
  "oracle.empty_listens": "{name} t'écoute",
  "oracle.paywall_title": "Les astres ne dorment jamais",
  "oracle.paywall_default_msg": "Tu as atteint ta limite quotidienne.",
  "oracle.paywall_cta_etoile": "Passer en Étoile",
  "oracle.paywall_cta_credits": "Recharger en crédits",
  "oracle.feedback_prompt": "Cette lecture t'a parlé ?",
  "oracle.feedback_resonates": "Ça résonne",
  "oracle.feedback_interesting": "Intéressant, dis-m'en plus",
  "oracle.feedback_not_now": "Pas cette fois",
  "oracle.feedback_expanded_r3": "Heureux que ça t'ait parlé.",
  "oracle.feedback_expanded_r2": "Dis-moi ce qui manquait, j'affine.",
  "oracle.feedback_expanded_r1": "Explique-moi pour que je fasse mieux.",
  "oracle.feedback_optional": "(optionnel)",
  "oracle.feedback_placeholder": "Ton retour en quelques mots...",
  "oracle.feedback_skip": "Passer",
  "oracle.feedback_send": "Envoyer",
  "oracle.feedback_submitted": "Merci, ton retour a été transmis à {name}.",
  "oracle.feedback_toast_title": "Merci pour ton retour",
  "oracle.feedback_toast_desc": "Ta voix aide {name} à mieux te guider.",
  "oracle.feedback_error_title": "Retour non enregistré",
  "oracle.feedback_error_desc": "Réessaie dans un instant.",
  "oracle.input_placeholder": "Pose ta question à {name}...",
  "oracle.error_unreachable": "{name} est injoignable",
  "oracle.error_fallback_msg": "Une perturbation cosmique m'empêche de te répondre. Réessaie dans un instant.",
  "oracle.error_no_stream": "Pas de stream",
  "oracle.error_generic": "Erreur {status}",

  "dashboard.greeting": "Bonjour {firstName}",
  "dashboard.badge_cv": "CV {number}",
  "dashboard.badge_py": "AP {number}",
  "dashboard.rdv_title": "Ton rendez-vous du jour",
  "dashboard.retrograde_pill": "Rétrograde",
  "dashboard.personal_day_pill": "Jour {n}",
  "dashboard.premium_locked_sections": "3 sections verrouillées",
  "dashboard.read_more": "Lire la suite",
  "dashboard.read_less": "Réduire",
  "dashboard.affirmation_prefix": "✨ « {text} »",
  "dashboard.do_title": "À faire / Éviter",
  "dashboard.tap_for_why": "Appuyez pour le pourquoi",
  "dashboard.do_today": "✓ Faire aujourd'hui",
  "dashboard.dont_today": "✗ Éviter aujourd'hui",
  "dashboard.energy_title": "Énergie du jour",
  "dashboard.energy_sante": "Santé",
  "dashboard.energy_spiritu": "Spiritu.",
  "dashboard.day_number_title": "Nombre du jour",
  "dashboard.day_number_keyword": "Achèvement",
  "dashboard.moon_title": "Lune du jour",
  "dashboard.moon_phase_generic": "Gibbeuse croissante",
  "dashboard.cosmic_tip_title": "Conseil cosmique",
  "dashboard.cosmic_tip_default": "Écoute ton intuition aujourd'hui, elle est ta meilleure alliée.",
  "dashboard.transits_title": "Transits du jour",
  "dashboard.transits_gated": "2 sur 3",
  "dashboard.cta_banner_title": "Débloque ton potentiel complet",
  "dashboard.cta_banner_desc": "Transits détaillés · Conseils karmiques exclusifs · Oracle illimité · Numérologie dynamique",
  "dashboard.cta_chip_oracle": "Oracle illimité",
  "dashboard.cta_chip_transits": "Transits complets",
  "dashboard.cta_chip_numero": "Numérologie avancée",
  "dashboard.cta_chip_karmic": "Conseils karmiques",
  "dashboard.cta_chip_calendar": "Calendrier détaillé",
  "dashboard.cta_chip_compat": "Compatibilité étendue",
  "dashboard.cta_etoile": "Passer en Étoile",
  "dashboard.quick_access_title": "Accès rapides",
  "dashboard.quick_astral": "Profil astral",
  "dashboard.quick_numerology": "Numérologie",
  "dashboard.quick_compat": "Compatibilité",
  "dashboard.quick_oracle": "Oracle",
  "dashboard.quick_calendar": "Calendrier",
  "dashboard.quick_learn": "Apprendre",
  "dashboard.history_title": "Jours précédents",
  "dashboard.premium_label": "Premium",
  "dashboard.locked_cta": "Débloquer avec Premium",
  "dashboard.locked_etoile": "Étoile",

  "astral.header_title": "Profil astral",
  "astral.label_sun": "Soleil",
  "astral.label_moon": "Lune",
  "astral.label_ascendant": "Ascendant",
  "astral.positions_title": "Positions planétaires",
  "astral.aspects_title": "Aspects majeurs",
  "astral.houses_title": "Les 12 maisons",

  "compat.header_title": "Compatibilité",
  "compat.add_person": "Ajouter une personne",
  "compat.score_global": "Global",
  "compat.see_analysis": "Voir l'analyse",
  "compat.strengths": "Forces",
  "compat.frictions": "Points de friction",
  "compat.karmic_guidance": "Guidance karmique",

  "numerology.header_title": "Numérologie",
  "numerology.core_title": "Nombres fondamentaux",
  "numerology.label_life_path": "Chemin de vie",
  "numerology.label_expression": "Expression",
  "numerology.label_soul_urge": "Nombre intime",
  "numerology.label_personality": "Personnalité",
  "numerology.label_birthday": "Anniversaire",
  "numerology.birthday_desc": "Talents naturels",
  "numerology.full_interpretation": "Interprétation complète",
  "numerology.dynamic_title": "Numérologie dynamique",
  "numerology.label_personal_year": "Année personnelle",
  "numerology.label_personal_month": "Mois personnel",
  "numerology.label_personal_day": "Jour personnel",
  "numerology.inclusion_title": "Table d'inclusion",
  "numerology.inclusion_desc": "Fréquence de chaque nombre dans ton nom complet",
  "numerology.absent": "absent",
  "numerology.mini_calendar_title": "Calendrier numérologique",
  "numerology.see_all": "Voir tout",

  "learn.header_title": "Apprendre",
  "learn.intro": "Explore les guides pour approfondir tes connaissances en astrologie, numérologie et spiritualité.",
  "learn.count_articles": "{n} articles",
  "learn.count_guide": "Guide",
  "learn.guide_zodiac_title": "Les 12 signes du zodiaque",
  "learn.guide_zodiac_desc": "Personnalité, compatibilités, symbolique : tout comprendre sur les 12 archétypes.",
  "learn.guide_planets_title": "Les 10 planètes",
  "learn.guide_planets_desc": "Soleil, Lune, Mercure, Vénus, Mars, Jupiter, Saturne, Uranus, Neptune, Pluton.",
  "learn.guide_houses_title": "Les 12 maisons astrologiques",
  "learn.guide_houses_desc": "Les secteurs de vie dans ton thème natal : carrière, amour, famille, spirituel.",
  "learn.guide_aspects_title": "Les aspects majeurs",
  "learn.guide_aspects_desc": "Conjonction, carré, trigone, opposition, sextile : comment les planètes dialoguent.",
  "learn.guide_numerology_title": "Initiation à la numérologie",
  "learn.guide_numerology_desc": "Les nombres de 1 à 9, les nombres maîtres, les systèmes pythagoricien et chaldéen.",
  "learn.guide_lifepaths_title": "Les 9 chemins de vie",
  "learn.guide_lifepaths_desc": "Mission d'âme, forces, défis, compatibilités : un archétype par chemin.",
  "learn.guide_karma_title": "Karma et vies passées",
  "learn.guide_karma_desc": "Dettes karmiques, noeuds lunaires, mémoires d'âme : comprendre tes schémas.",
  "learn.guide_transits_title": "Comprendre les transits",
  "learn.guide_transits_desc": "Comment lire les mouvements planétaires qui affectent ton thème natal aujourd'hui.",
  "learn.guide_moon_title": "Les cycles lunaires",
  "learn.guide_moon_desc": "Nouvelle lune, pleine lune, phases, éclipses : rituels et intentions.",
  "learn.guide_compat_title": "Compatibilité astro-numéro",
  "learn.guide_compat_desc": "Synastrie, éléments, nombres : comment deux thèmes interagissent vraiment.",

  "profile.header_title": "Mon profil",
  "profile.year_label": "Année {year}",
  "profile.karmic_debt": "Dette karmique : {list}",
  "profile.north_node": "☊ Noeud Nord : {sign} M{house} - {lesson}",
  "profile.referral_title": "Étoiles Jumelles",
  "profile.referral_intro": "Invite tes proches sur Karmastro. Vous recevez tous les deux (toi + ton filleul) des bonus cosmiques et tu débloques des badges en grandissant ta constellation.",
  "profile.copy_link": "Copier le lien",
  "profile.copied": "Copié",
  "profile.share": "Partager",
  "profile.godchildren_count": "{n} filleul(s) validé(s)",
  "profile.pending_count": "{n} en attente (7j)",
  "profile.next_badge": "{n} de plus → {badge}",
  "profile.all_badges_done": "Tous les badges débloqués ✦",
  "profile.badges_title": "Badges débloqués",
  "profile.badge_eclaireur": "Éclaireur Cosmique",
  "profile.badge_guide": "Guide des Étoiles",
  "profile.badge_constellation": "Constellation Vivante",
  "profile.badge_nebuleuse": "Nébuleuse Maîtresse",
  "profile.quick_astral_full": "Mon profil astral complet",
  "profile.quick_numero_full": "Ma numérologie complète",
  "profile.quick_calendar": "Calendrier cosmique",
  "profile.quick_compat": "Compatibilités",
  "profile.quick_learn": "Apprendre",
  "profile.toast_link_copied_title": "Lien copié ✦",
  "profile.toast_link_copied_desc": "Partage-le avec qui tu veux.",
  "profile.share_title": "Rejoins-moi sur Karmastro",
  "profile.share_text": "Rejoins-moi sur Karmastro, la plateforme de guidance cosmique qui croise astrologie, numérologie et karma. Utilise mon lien de parrainage ✨",

  "settings.header_title": "Réglages",
  "settings.language": "Langue",
  "settings.notifications": "Notifications",
  "settings.notifications_on": "Activées",
  "settings.theme": "Thème",
  "settings.theme_night": "Nuit (défaut)",
  "settings.detail_level": "Niveau de détail",
  "settings.detail_intermediate": "Intermédiaire",
  "settings.upgrade_cta": "Passer en Étoile",
  "settings.logout": "Déconnexion",
  "settings.footer_version": "Karmastro v1.0 · « Les astres inclinent, mais ne déterminent pas » - Thomas d'Aquin",

  "calendar.header_title": "Calendrier cosmique",
  "calendar.legend_favorable": "Favorable",
  "calendar.legend_warning": "Attention",
  "calendar.legend_spiritual": "Spirituel",
  "calendar.day_label": "{day} {month} {year}",
  "calendar.day_prefix": "Jour {n} - {keyword}",
  "calendar.day_generic": "Ton jour personnel {n} t'invite à {keyword}.",

  "notfound.title": "404",
  "notfound.message": "Oops ! Page introuvable",
  "notfound.cta_home": "Retour à l'accueil",

  "reset.title": "Nouveau mot de passe",
  "reset.placeholder": "Nouveau mot de passe",
  "reset.loading": "...",
  "reset.submit": "Mettre à jour",
  "reset.toast_success_title": "Mot de passe mis à jour ✨",
  "reset.toast_error_title": "Erreur",

  "admin.restricted_title": "Accès restreint",
  "admin.restricted_desc": "Cette zone est réservée à l'équipe Karmastro.",
  "admin.restricted_back": "Retour au dashboard",
  "admin.loading": "Vérification des accès cosmiques...",

  "landing.header_login": "Connexion",
  "landing.header_start": "Commencer",
  "landing.hero_title_1": "Ta carte de vie.",
  "landing.hero_title_2": "Écrite dans les étoiles",
  "landing.hero_title_3": "et les nombres.",
  "landing.hero_tagline": "Astrologie + Numérologie + Guidance karmique. Un seul profil. Un rendez-vous quotidien. L'Oracle disponible 24/7.",
  "landing.hero_precision_badge": "Calculs astronomiques précision NASA",
  "landing.calc_title": "Découvre ton profil en 10 secondes",
  "landing.calc_firstname_placeholder": "Prénom",
  "landing.calc_discover": "Découvrir",
  "landing.calc_full_profile": "Profil complet",
  "landing.pillars_title_1": "3 piliers,",
  "landing.pillars_title_2": "1 profil",
  "landing.pillars_click_hint": "Clique sur une carte pour en savoir plus",
  "landing.pillar_click_flip": "Clique pour retourner",
  "landing.oracle_title_1": "L'Oracle",
  "landing.oracle_title_2": "te répond",
  "landing.oracle_subtitle": "Pas un horoscope générique. Un guide personnel qui calcule, croise et explique.",
  "landing.oracle_live_label": "L'Oracle",
  "landing.oracle_live_next": " · lecture suivante...",
  "landing.oracle_cta": "Poser ta question à l'Oracle",
  "landing.oracle_footnote": "Positions planétaires Swiss Ephemeris, précision 0.001\"",
  "landing.testi_title_1": "Ils ont trouvé",
  "landing.testi_title_2": "leur chemin",
  "landing.pricing_title_1": "Choisis ta",
  "landing.pricing_title_2": "voie",
  "landing.pricing_eveil_title": "Éveil",
  "landing.pricing_eveil_price": "Offert par les astres",
  "landing.pricing_eveil_cta": "Commencer mon éveil",
  "landing.pricing_etoile_badge": "Le plus choisi",
  "landing.pricing_etoile_title": "Étoile",
  "landing.pricing_etoile_per_month": "/mois",
  "landing.pricing_etoile_annual_hint": "ou 49,99€/an (2 mois offerts)",
  "landing.pricing_etoile_cta": "7 jours offerts par les astres",
  "landing.pricing_ame_title": "Âme Soeur",
  "landing.pricing_ame_unit": "rituel unique",
  "landing.pricing_ame_cta": "Recevoir mon rituel",
};

// ────────────────────────────────────────────────────────────────
// Non-FR locales : populated by translation agents.
// Until a key is filled, fallback is FR (so UI never breaks).
// ────────────────────────────────────────────────────────────────

export const en: Partial<UiStrings> = {};
export const es: Partial<UiStrings> = {};
export const pt: Partial<UiStrings> = {};
export const de: Partial<UiStrings> = {};
export const it: Partial<UiStrings> = {};
export const tr: Partial<UiStrings> = {};
export const pl: Partial<UiStrings> = {};
export const ru: Partial<UiStrings> = {};
export const ja: Partial<UiStrings> = {};
export const ar: Partial<UiStrings> = {};

const DICT: Record<AppLocale, Partial<UiStrings>> = { fr, en, es, pt, de, it, tr, pl, ru, ja, ar };

// ────────────────────────────────────────────────────────────────
// t() with interpolation ({name}, {count}, ...) and FR fallback
// ────────────────────────────────────────────────────────────────

export function t(
  key: UiKey,
  locale: AppLocale,
  params?: Record<string, string | number>
): string {
  const value = DICT[locale]?.[key] ?? fr[key] ?? key;
  if (!params) return value;
  return value.replace(/\{(\w+)\}/g, (match, p) =>
    params[p] !== undefined ? String(params[p]) : match
  );
}

// ────────────────────────────────────────────────────────────────
// React hook sugar
// ────────────────────────────────────────────────────────────────

export function useT(): {
  locale: AppLocale;
  t: (key: UiKey, params?: Record<string, string | number>) => string;
} {
  const [locale, setLocale] = useState<AppLocale>("fr");

  useEffect(() => {
    setLocale(detectLocale());
  }, []);

  return {
    locale,
    t: (key, params) => t(key, locale, params),
  };
}

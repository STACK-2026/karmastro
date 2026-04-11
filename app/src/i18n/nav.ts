// App nav + footer translations.
// Mirrors the relevant keys from site/src/i18n/translations.ts.
// Shared philosophy : same wording, same order, strict parite with site.

import type { AppLocale } from "@/lib/locale";

type NavKeys = {
  "nav.home": string;
  "nav.horoscope": string;
  "nav.tools": string;
  "nav.blog": string;
  "nav.referral": string;
  "nav.oracle": string;
  "nav.profile": string;
  "nav.about": string;
  "nav.glossary": string;
  "nav.precision": string;
  "common.login": string;
  "common.my_profile": string;
  "common.menu": string;
  "common.close": string;
  "footer.tagline": string;
  "footer.legal_title": string;
  "footer.explore_title": string;
  "footer.legal": string;
  "footer.cgv": string;
  "footer.privacy": string;
  "footer.quote": string;
  "footer.quote_author": string;
  "footer.copyright": string;
};

const fr: NavKeys = {
  "nav.home": "Accueil",
  "nav.horoscope": "Horoscope",
  "nav.tools": "Outils",
  "nav.blog": "Le Cosmos",
  "nav.referral": "Parrainage",
  "nav.oracle": "L'Oracle",
  "nav.profile": "Mon profil",
  "nav.about": "Notre histoire",
  "nav.glossary": "Glossaire",
  "nav.precision": "Précision",
  "common.login": "Connexion",
  "common.my_profile": "Mon profil",
  "common.menu": "Menu",
  "common.close": "Fermer",
  "footer.tagline": "Astrologie et numérologie au service de ton évolution personnelle.",
  "footer.legal_title": "Informations légales",
  "footer.explore_title": "Explorer",
  "footer.legal": "Mentions légales",
  "footer.cgv": "Conditions générales",
  "footer.privacy": "Confidentialité",
  "footer.quote": "Astra inclinant, sed non necessitant",
  "footer.quote_author": "Thomas d'Aquin",
  "footer.copyright": "Tous droits réservés",
};

const en: NavKeys = {
  "nav.home": "Home",
  "nav.horoscope": "Horoscope",
  "nav.tools": "Tools",
  "nav.blog": "The Cosmos",
  "nav.referral": "Referral",
  "nav.oracle": "The Oracle",
  "nav.profile": "My profile",
  "nav.about": "Our story",
  "nav.glossary": "Glossary",
  "nav.precision": "Accuracy",
  "common.login": "Sign in",
  "common.my_profile": "My profile",
  "common.menu": "Menu",
  "common.close": "Close",
  "footer.tagline": "Astrology and numerology for your personal evolution.",
  "footer.legal_title": "Legal",
  "footer.explore_title": "Explore",
  "footer.legal": "Legal notice",
  "footer.cgv": "Terms",
  "footer.privacy": "Privacy",
  "footer.quote": "The stars incline, they do not compel",
  "footer.quote_author": "Thomas Aquinas",
  "footer.copyright": "All rights reserved",
};

const es: NavKeys = {
  "nav.home": "Inicio",
  "nav.horoscope": "Horóscopo",
  "nav.tools": "Herramientas",
  "nav.blog": "El Cosmos",
  "nav.referral": "Apadrinamiento",
  "nav.oracle": "El Oráculo",
  "nav.profile": "Mi perfil",
  "nav.about": "Nuestra historia",
  "nav.glossary": "Glosario",
  "nav.precision": "Precisión",
  "common.login": "Iniciar sesión",
  "common.my_profile": "Mi perfil",
  "common.menu": "Menú",
  "common.close": "Cerrar",
  "footer.tagline": "Astrología y numerología al servicio de tu evolución personal.",
  "footer.legal_title": "Información legal",
  "footer.explore_title": "Explorar",
  "footer.legal": "Aviso legal",
  "footer.cgv": "Términos y condiciones",
  "footer.privacy": "Privacidad",
  "footer.quote": "Los astros inclinan, no determinan",
  "footer.quote_author": "Tomás de Aquino",
  "footer.copyright": "Todos los derechos reservados",
};

const pt: NavKeys = {
  "nav.home": "Início",
  "nav.horoscope": "Horóscopo",
  "nav.tools": "Ferramentas",
  "nav.blog": "O Cosmos",
  "nav.referral": "Apadrinhamento",
  "nav.oracle": "O Oráculo",
  "nav.profile": "O meu perfil",
  "nav.about": "A nossa história",
  "nav.glossary": "Glossário",
  "nav.precision": "Precisão",
  "common.login": "Entrar",
  "common.my_profile": "O meu perfil",
  "common.menu": "Menu",
  "common.close": "Fechar",
  "footer.tagline": "Astrologia e numerologia ao serviço da tua evolução pessoal.",
  "footer.legal_title": "Informações legais",
  "footer.explore_title": "Explorar",
  "footer.legal": "Aviso legal",
  "footer.cgv": "Termos e condições",
  "footer.privacy": "Privacidade",
  "footer.quote": "Os astros inclinam, não determinam",
  "footer.quote_author": "Tomás de Aquino",
  "footer.copyright": "Todos os direitos reservados",
};

const de: NavKeys = {
  "nav.home": "Start",
  "nav.horoscope": "Horoskop",
  "nav.tools": "Werkzeuge",
  "nav.blog": "Der Kosmos",
  "nav.referral": "Empfehlung",
  "nav.oracle": "Das Orakel",
  "nav.profile": "Mein Profil",
  "nav.about": "Unsere Geschichte",
  "nav.glossary": "Glossar",
  "nav.precision": "Genauigkeit",
  "common.login": "Anmelden",
  "common.my_profile": "Mein Profil",
  "common.menu": "Menü",
  "common.close": "Schließen",
  "footer.tagline": "Astrologie und Numerologie im Dienst deiner persönlichen Entwicklung.",
  "footer.legal_title": "Rechtliche Hinweise",
  "footer.explore_title": "Entdecken",
  "footer.legal": "Impressum",
  "footer.cgv": "AGB",
  "footer.privacy": "Datenschutz",
  "footer.quote": "Die Sterne neigen, sie zwingen nicht",
  "footer.quote_author": "Thomas von Aquin",
  "footer.copyright": "Alle Rechte vorbehalten",
};

const it: NavKeys = {
  "nav.home": "Home",
  "nav.horoscope": "Oroscopo",
  "nav.tools": "Strumenti",
  "nav.blog": "Il Cosmo",
  "nav.referral": "Referral",
  "nav.oracle": "L'Oracolo",
  "nav.profile": "Il mio profilo",
  "nav.about": "La nostra storia",
  "nav.glossary": "Glossario",
  "nav.precision": "Precisione",
  "common.login": "Accedi",
  "common.my_profile": "Il mio profilo",
  "common.menu": "Menu",
  "common.close": "Chiudi",
  "footer.tagline": "Astrologia e numerologia al servizio della tua evoluzione personale.",
  "footer.legal_title": "Informazioni legali",
  "footer.explore_title": "Esplora",
  "footer.legal": "Note legali",
  "footer.cgv": "Termini e condizioni",
  "footer.privacy": "Privacy",
  "footer.quote": "Gli astri inclinano, non determinano",
  "footer.quote_author": "Tommaso d'Aquino",
  "footer.copyright": "Tutti i diritti riservati",
};

const tr: NavKeys = {
  "nav.home": "Ana Sayfa",
  "nav.horoscope": "Burç",
  "nav.tools": "Araçlar",
  "nav.blog": "Kozmos",
  "nav.referral": "Yönlendirme",
  "nav.oracle": "Kahin",
  "nav.profile": "Profilim",
  "nav.about": "Hikayemiz",
  "nav.glossary": "Sözlük",
  "nav.precision": "Doğruluk",
  "common.login": "Giriş",
  "common.my_profile": "Profilim",
  "common.menu": "Menü",
  "common.close": "Kapat",
  "footer.tagline": "Kişisel gelişimin için astroloji ve numeroloji.",
  "footer.legal_title": "Yasal bilgiler",
  "footer.explore_title": "Keşfet",
  "footer.legal": "Yasal uyarı",
  "footer.cgv": "Koşullar",
  "footer.privacy": "Gizlilik",
  "footer.quote": "Yıldızlar eğilir, zorlamaz",
  "footer.quote_author": "Thomas Aquinas",
  "footer.copyright": "Tüm hakları saklıdır",
};

const pl: NavKeys = {
  "nav.home": "Strona główna",
  "nav.horoscope": "Horoskop",
  "nav.tools": "Narzędzia",
  "nav.blog": "Kosmos",
  "nav.referral": "Polecenie",
  "nav.oracle": "Wyrocznia",
  "nav.profile": "Mój profil",
  "nav.about": "Nasza historia",
  "nav.glossary": "Słownik",
  "nav.precision": "Dokładność",
  "common.login": "Zaloguj",
  "common.my_profile": "Mój profil",
  "common.menu": "Menu",
  "common.close": "Zamknij",
  "footer.tagline": "Astrologia i numerologia dla twojej osobistej ewolucji.",
  "footer.legal_title": "Informacje prawne",
  "footer.explore_title": "Odkrywaj",
  "footer.legal": "Nota prawna",
  "footer.cgv": "Regulamin",
  "footer.privacy": "Prywatność",
  "footer.quote": "Gwiazdy skłaniają, nie zmuszają",
  "footer.quote_author": "Tomasz z Akwinu",
  "footer.copyright": "Wszelkie prawa zastrzeżone",
};

const ru: NavKeys = {
  "nav.home": "Главная",
  "nav.horoscope": "Гороскоп",
  "nav.tools": "Инструменты",
  "nav.blog": "Космос",
  "nav.referral": "Рефералы",
  "nav.oracle": "Оракул",
  "nav.profile": "Мой профиль",
  "nav.about": "Наша история",
  "nav.glossary": "Глоссарий",
  "nav.precision": "Точность",
  "common.login": "Войти",
  "common.my_profile": "Мой профиль",
  "common.menu": "Меню",
  "common.close": "Закрыть",
  "footer.tagline": "Астрология и нумерология для твоего личного развития.",
  "footer.legal_title": "Правовая информация",
  "footer.explore_title": "Исследовать",
  "footer.legal": "Юридическая информация",
  "footer.cgv": "Условия",
  "footer.privacy": "Конфиденциальность",
  "footer.quote": "Звёзды склоняют, не принуждают",
  "footer.quote_author": "Фома Аквинский",
  "footer.copyright": "Все права защищены",
};

const ja: NavKeys = {
  "nav.home": "ホーム",
  "nav.horoscope": "ホロスコープ",
  "nav.tools": "診断ツール",
  "nav.blog": "コスモス",
  "nav.referral": "紹介",
  "nav.oracle": "オラクル",
  "nav.profile": "マイプロフィール",
  "nav.about": "私たちについて",
  "nav.glossary": "用語集",
  "nav.precision": "精度",
  "common.login": "ログイン",
  "common.my_profile": "マイプロフィール",
  "common.menu": "メニュー",
  "common.close": "閉じる",
  "footer.tagline": "あなたの個人的な成長のための占星術と数秘術。",
  "footer.legal_title": "法的情報",
  "footer.explore_title": "探索",
  "footer.legal": "法的通知",
  "footer.cgv": "利用規約",
  "footer.privacy": "プライバシー",
  "footer.quote": "星は傾けるが、強制しない",
  "footer.quote_author": "トマス・アクィナス",
  "footer.copyright": "全著作権所有",
};

const ar: NavKeys = {
  "nav.home": "الرئيسية",
  "nav.horoscope": "الأبراج",
  "nav.tools": "الأدوات",
  "nav.blog": "الكون",
  "nav.referral": "إحالة",
  "nav.oracle": "العرّاف",
  "nav.profile": "ملفي الشخصي",
  "nav.about": "قصتنا",
  "nav.glossary": "قاموس",
  "nav.precision": "الدقة",
  "common.login": "تسجيل الدخول",
  "common.my_profile": "ملفي الشخصي",
  "common.menu": "القائمة",
  "common.close": "إغلاق",
  "footer.tagline": "علم التنجيم وعلم الأعداد في خدمة تطورك الشخصي.",
  "footer.legal_title": "المعلومات القانونية",
  "footer.explore_title": "استكشف",
  "footer.legal": "إشعار قانوني",
  "footer.cgv": "الشروط والأحكام",
  "footer.privacy": "الخصوصية",
  "footer.quote": "النجوم تميل ولا تُجبر",
  "footer.quote_author": "توماس الأكويني",
  "footer.copyright": "جميع الحقوق محفوظة",
};

const DICT: Record<AppLocale, NavKeys> = { fr, en, es, pt, de, it, tr, pl, ru, ja, ar };

export function tNav(key: keyof NavKeys, locale: AppLocale): string {
  return DICT[locale]?.[key] ?? DICT.fr[key];
}

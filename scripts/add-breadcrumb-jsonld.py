#!/usr/bin/env python3
"""
Chirurgical BreadcrumbList injection into the 72 tool pages.

Adds one BreadcrumbList entry into each page's `const jsonLd = [ ... ]`
array, with labels translated per locale. Skips pages that already carry a
BreadcrumbList (10 localised hubs + compat/horoscope pages).
"""
from __future__ import annotations
import json
import re
from pathlib import Path

SITE_ROOT = Path("/Users/lestoilettesdeminette/stack-2026/karmastro/site")
SITE_URL = "https://karmastro.com"

# Labels : breadcrumb item names localized. Matches the site's existing copy.
LABELS: dict[str, dict[str, str]] = {
    "fr": {"home": "Accueil", "tools": "Outils"},
    "en": {"home": "Home", "tools": "Tools"},
    "es": {"home": "Inicio", "tools": "Herramientas"},
    "pt": {"home": "Início", "tools": "Ferramentas"},
    "de": {"home": "Startseite", "tools": "Werkzeuge"},
    "it": {"home": "Home", "tools": "Strumenti"},
    "tr": {"home": "Ana sayfa", "tools": "Araçlar"},
    "pl": {"home": "Strona główna", "tools": "Narzędzia"},
    "ru": {"home": "Главная", "tools": "Инструменты"},
    "ja": {"home": "ホーム", "tools": "ツール"},
    "ar": {"home": "الرئيسية", "tools": "الأدوات"},
}

# Tool-page slug → localized page name (3rd breadcrumb item).
TOOL_NAMES: dict[str, dict[str, str]] = {
    # FR slugs
    "dette-karmique":      {"fr": "Dette karmique"},
    "theme-natal":         {"fr": "Thème natal"},
    "ascendant":           {"fr": "Ascendant"},
    "chemin-de-vie":       {"fr": "Chemin de vie"},
    "nombre-expression":   {"fr": "Nombre d'expression"},
    "annee-personnelle":   {"fr": "Année personnelle"},
    "transits":            {"fr": "Transits du jour"},
    "compatibilite":       {"fr": "Compatibilité"},
    "synastrie":           {"fr": "Synastrie"},
    # EN slugs
    "karmic-debt":         {"en": "Karmic debt"},
    "birth-chart":         {"en": "Birth chart"},
    "rising-sign":         {"en": "Rising sign"},
    "life-path-number":    {"en": "Life path number"},
    "expression-number":   {"en": "Expression number"},
    "personal-year":       {"en": "Personal year"},
    "compatibility":       {"en": "Compatibility"},
    "synastry":            {"en": "Synastry"},
    "transits":            {"fr": "Transits du jour", "en": "Daily transits", "es": "Tránsitos", "pt": "Trânsitos", "de": "Tagestransite", "it": "Transiti", "tr": "Günün transitleri", "pl": "Tranzyty dnia", "ru": "Транзиты дня", "ja": "今日のトランジット", "ar": "عبور اليوم"},
    # ES slugs
    "deuda-karmica":       {"es": "Deuda kármica"},
    "carta-natal":         {"es": "Carta natal"},
    "ascendente":          {"es": "Ascendente", "pt": "Ascendente", "it": "Ascendente"},
    "camino-de-vida":      {"es": "Camino de vida"},
    "numero-expresion":    {"es": "Número de expresión"},
    "ano-personal":        {"es": "Año personal"},
    "compatibilidad":      {"es": "Compatibilidad"},
    # PT slugs
    "divida-karmica":      {"pt": "Dívida cármica"},
    "mapa-natal":          {"pt": "Mapa natal"},
    "numero-do-caminho-de-vida": {"pt": "Número do caminho de vida"},
    "numero-expressao":    {"pt": "Número de expressão"},
    "ano-pessoal":         {"pt": "Ano pessoal"},
    "compatibilidade":     {"pt": "Compatibilidade"},
    # DE slugs
    "karmische-schuld":    {"de": "Karmische Schuld"},
    "geburtshoroskop":     {"de": "Geburtshoroskop"},
    "aszendent":           {"de": "Aszendent"},
    "lebenszahl":          {"de": "Lebenszahl"},
    "ausdruckszahl":       {"de": "Ausdruckszahl"},
    "personliches-jahr":   {"de": "Persönliches Jahr"},
    "partnerhoroskop":     {"de": "Partnerhoroskop"},
    # IT slugs
    "debito-karmico":      {"it": "Debito karmico"},
    "tema-natale":         {"it": "Tema natale"},
    "numero-del-cammino-di-vita": {"it": "Numero del cammino di vita"},
    "numero-espressione":  {"it": "Numero di espressione"},
    "anno-personale":      {"it": "Anno personale"},
    "compatibilita":       {"it": "Compatibilità"},
    # TR slugs
    "karmik-borc":         {"tr": "Karmik borç"},
    "dogum-haritasi":      {"tr": "Doğum haritası"},
    "yukselen-burc":       {"tr": "Yükselen burç"},
    "yasam-yolu-sayisi":   {"tr": "Yaşam yolu sayısı"},
    "ifade-sayisi":        {"tr": "İfade sayısı"},
    "kisisel-yil":         {"tr": "Kişisel yıl"},
    "uyumluluk":           {"tr": "Uyumluluk"},
    # PL slugs
    "dlug-karmiczny":      {"pl": "Dług karmiczny"},
    "horoskop-natalny":    {"pl": "Horoskop natalny"},
    "wschodzacy-znak":     {"pl": "Wschodzący znak"},
    "liczba-drogi-zycia":  {"pl": "Liczba drogi życia"},
    "liczba-ekspresji":    {"pl": "Liczba ekspresji"},
    "rok-osobisty":        {"pl": "Rok osobisty"},
    "kompatybilnosc":      {"pl": "Kompatybilność"},
    # RU slugs
    "karmicheskiy-dolg":   {"ru": "Кармический долг"},
    "natalnaya-karta":     {"ru": "Натальная карта"},
    "voskhodyaschiy-znak": {"ru": "Восходящий знак"},
    "chislo-zhiznennogo-puti": {"ru": "Число жизненного пути"},
    "chislo-vyrazheniya":  {"ru": "Число выражения"},
    "lichnyi-god":         {"ru": "Личный год"},
    "sovmestimost":        {"ru": "Совместимость"},
    # JA slugs
    "karuma-fusai":        {"ja": "カルマの負債"},
    "shusseizu":           {"ja": "出生図"},
    "asendanto":           {"ja": "アセンダント"},
    "raifu-pasu-nanbaa":   {"ja": "ライフパスナンバー"},
    "hyougen-suu":         {"ja": "表現数"},
    "kojin-toshi":         {"ja": "個人年"},
    "aishou-shindan":      {"ja": "相性診断"},
    # AR slugs
    "dayn-kharmi":         {"ar": "الدين الكارمي"},
    "kharitat-mawlid":     {"ar": "خريطة المولد"},
    "al-taaali":           {"ar": "البرج الطالع"},
    "raqm-masar-al-hayat": {"ar": "رقم مسار الحياة"},
    "raqm-tabir":          {"ar": "رقم التعبير"},
    "sanat-shakhseya":     {"ar": "السنة الشخصية"},
    "tawafuq-azwaj":       {"ar": "توافق الأزواج"},
}

# Directory → (locale, base URL path to the tools hub)
DIRS = [
    ("fr", "outils",         "/outils"),
    ("en", "en/tools",       "/en/tools"),
    ("es", "es/herramientas","/es/herramientas"),
    ("pt", "pt/ferramentas", "/pt/ferramentas"),
    ("de", "de/werkzeuge",   "/de/werkzeuge"),
    ("it", "it/strumenti",   "/it/strumenti"),
    ("tr", "tr/araclar",     "/tr/araclar"),
    ("pl", "pl/narzedzia",   "/pl/narzedzia"),
    ("ru", "ru/instrumenty", "/ru/instrumenty"),
    ("ja", "ja/shindan",     "/ja/shindan"),
    ("ar", "ar/adawat",      "/ar/adawat"),
]


def build_breadcrumb_js(locale: str, hub_path: str, page_slug: str, page_name: str) -> str:
    """Return the BreadcrumbList as a JS object literal (formatted nicely)."""
    home_url = f"{SITE_URL}/" if locale == "fr" else f"{SITE_URL}/{locale}/"
    hub_url = f"{SITE_URL}{hub_path}"
    page_url = f"{SITE_URL}{hub_path}/{page_slug}"
    home_label = LABELS[locale]["home"]
    tools_label = LABELS[locale]["tools"]

    # JSON serialisation gives us the correct JS-compatible output for strings
    # that contain non-ASCII characters (Arabic, Japanese, etc.). JSON is a
    # valid subset of JS object literals for our use case.
    obj = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": home_label, "item": home_url},
            {"@type": "ListItem", "position": 2, "name": tools_label, "item": hub_url},
            {"@type": "ListItem", "position": 3, "name": page_name, "item": page_url},
        ],
    }
    return json.dumps(obj, ensure_ascii=False, indent=2)


def patch_file(path: Path, locale: str, hub_path: str) -> str:
    text = path.read_text()
    # Skip if already patched
    if "BreadcrumbList" in text:
        return "skip-already"

    # Derive slug from filename
    slug = path.stem
    if slug == "index":
        return "skip-index"

    page_name = TOOL_NAMES.get(slug, {}).get(locale)
    if not page_name:
        return f"skip-no-name:{slug}@{locale}"

    bc_obj = build_breadcrumb_js(locale, hub_path, slug, page_name)

    # Inject into `const jsonLd = [` ... `];`
    # We insert right after the opening `[`. The pattern must be tolerant to
    # whitespace/newlines.
    pattern = re.compile(r"(const\s+jsonLd\s*=\s*\[)", re.MULTILINE)
    if not pattern.search(text):
        return f"skip-no-jsonLd:{path.name}"

    # Indent each breadcrumb line by 2 spaces to match array-entry style
    indented = "\n".join("  " + line if line.strip() else line for line in bc_obj.splitlines())
    injection = f"\\1\n  {bc_obj.strip()},"
    new_text, n = pattern.subn(injection, text, count=1)
    if n == 0:
        return f"skip-no-replace:{path.name}"

    path.write_text(new_text)
    return "patched"


def main() -> None:
    stats: dict[str, int] = {}
    for locale, subdir, hub_path in DIRS:
        dir_path = SITE_ROOT / "src" / "pages" / subdir
        if not dir_path.exists():
            continue
        for page in sorted(dir_path.glob("*.astro")):
            result = patch_file(page, locale, hub_path)
            stats[result] = stats.get(result, 0) + 1
            print(f"  {result:30s} {page.relative_to(SITE_ROOT)}")
    print("\nSummary :")
    for k, v in sorted(stats.items()):
        print(f"  {k:30s} {v}")


if __name__ == "__main__":
    main()

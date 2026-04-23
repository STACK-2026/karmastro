#!/usr/bin/env python3
"""Densify the 8 remaining thin tool locales via Mistral alone (zero
Anthropic API cost). We review the output in session before commit.

For each (locale, tool) combo :
  1. Build a prompt that hands Mistral the FR reference content and a
     strict JSON schema (intro, sections[], faq[], sources[], labels).
  2. Call mistral-large-latest with response_format=json_object.
  3. Validate : expected locale charset, length, em-dash absence, 3+
     sections, 3+ faq entries.
  4. Retry once with a harder prompt on validation failure.
  5. Append to a single merged JSON file the inject step consumes.

Usage :
    export MISTRAL_API_KEY=...   # from ~/stack-2026/.env.master
    python3 scripts/densify_tool_editorials.py [--only locale] [--tools k1,k2]

Output :
    scripts/generated_tool_editorials.json
"""
from __future__ import annotations

import argparse
import concurrent.futures
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_MODEL = "mistral-large-latest"
MISTRAL_KEY = os.environ.get("MISTRAL_API_KEY")
if not MISTRAL_KEY:
    sys.exit("[fatal] MISTRAL_API_KEY missing")

# ---------------------------------------------------------------------------
# Target matrix : 8 locales × 6 tools + 3 EN thin entries.
# ---------------------------------------------------------------------------

TOOLS = [
    "life-path",
    "expression-number",
    "personal-year",
    "birth-chart",
    "rising-sign",
    "compatibility",
]

LOCALES = [
    # code, language name for the prompt, labels (faq, sources), expected script
    ("de", "German (Deutsch)", {"faq": "Häufig gestellte Fragen", "sources": "Quellen"}, "latin"),
    ("it", "Italian (italiano)", {"faq": "Domande frequenti", "sources": "Fonti"}, "latin"),
    ("es", "Spanish (español)", {"faq": "Preguntas frecuentes", "sources": "Fuentes"}, "latin"),
    ("pt", "Portuguese (português de Portugal)", {"faq": "Perguntas frequentes", "sources": "Fontes"}, "latin"),
    ("tr", "Turkish (türkçe)", {"faq": "Sıkça sorulan sorular", "sources": "Kaynaklar"}, "latin"),
    ("pl", "Polish (polski)", {"faq": "Często zadawane pytania", "sources": "Źródła"}, "latin"),
    ("ru", "Russian (русский)", {"faq": "Частые вопросы", "sources": "Источники"}, "cyrillic"),
    ("ar", "Arabic (العربية, standard MSA)", {"faq": "الأسئلة الشائعة", "sources": "المصادر"}, "arabic"),
]

# Three EN pages flagged thin in the audit.
EN_THIN = ["expression-number", "karmic-debt", "personal-year"]

# ---------------------------------------------------------------------------
# Tool reference definitions : title + angle + the core FR content axis.
# Mistral rewrites these into the target locale. Numbers/calculations stay
# factual across locales; the voice adapts.
# ---------------------------------------------------------------------------

TOOL_REFS = {
    "life-path": {
        "title_fr": "Chemin de vie (numérologie pythagoricienne)",
        "angle_fr": "Calcul à partir de la date de naissance, 12 nombres possibles incluant les maîtres nombres 11/22/33. Origine pythagoricienne (580 av. J.-C.). Méthode transmise par le monde arabo-musulman médiéval.",
        "themes": ["histoire pythagoricienne", "méthode de calcul", "12 nombres et leurs archétypes", "maîtres nombres", "destin vs tendance"],
        "authoritative_sources": [
            ("Wikipedia Numerology", "https://en.wikipedia.org/wiki/Numerology"),
            ("Britannica Numerology", "https://www.britannica.com/topic/numerology"),
            ("Stanford Encyclopedia: Pythagoreanism", "https://plato.stanford.edu/entries/pythagoreanism/"),
            ("Wikipedia Pythagoras", "https://en.wikipedia.org/wiki/Pythagoras"),
        ],
    },
    "expression-number": {
        "title_fr": "Nombre d'expression (prénom + nom complet)",
        "angle_fr": "Calcul à partir des lettres de la fullname de naissance avec la table pythagoricienne (A=1..Z=26, réduit). Compléte la lecture du chemin de vie. Se décompose en soul urge (voyelles) et personnalité (consonnes).",
        "themes": ["table pythagoricienne", "lien avec chemin de vie", "décomposition voyelles/consonnes", "impact sur carrière"],
        "authoritative_sources": [
            ("Wikipedia Numerology", "https://en.wikipedia.org/wiki/Numerology"),
            ("Britannica Numerology", "https://www.britannica.com/topic/numerology"),
        ],
    },
    "personal-year": {
        "title_fr": "Année personnelle (cycle de 9 ans)",
        "angle_fr": "Somme de la date de naissance (jour+mois) + année courante, réduit à 1-9. Cycle répétitif de 9 années avec une thématique par an. Pratique pour orienter les décisions année par année.",
        "themes": ["méthode de calcul", "cycle de 9 ans", "thème de chaque année 1-9", "croisement avec transits astro", "individualisation par mois et jour personnels"],
        "authoritative_sources": [
            ("Wikipedia Numerology", "https://en.wikipedia.org/wiki/Numerology"),
            ("Britannica Numerology", "https://www.britannica.com/topic/numerology"),
        ],
    },
    "birth-chart": {
        "title_fr": "Thème natal (carte du ciel)",
        "angle_fr": "Photo du ciel à la minute et au lieu de naissance. 10 planètes, 12 signes, 12 maisons, aspects. Swiss Ephemeris précision 0.001 seconde d'arc (niveau NASA JPL).",
        "themes": ["trois piliers Soleil/Lune/Ascendant", "10 planètes et leurs domaines", "12 maisons", "aspects et leur dynamique", "fiabilité Swiss Ephemeris"],
        "authoritative_sources": [
            ("Wikipedia Astrology", "https://en.wikipedia.org/wiki/Astrology"),
            ("NASA Solar System", "https://science.nasa.gov/solar-system/planets/"),
            ("Swiss Ephemeris (Astrodienst)", "https://www.astro.com/swisseph/"),
            ("Britannica Astrology", "https://www.britannica.com/topic/astrology"),
        ],
    },
    "rising-sign": {
        "title_fr": "Ascendant (rising sign)",
        "angle_fr": "Signe qui se levait à l'est à la minute de naissance. Change toutes les 2h environ. Dicte la maison 1 et la rotation de toutes les autres maisons du thème natal.",
        "themes": ["comment il se calcule", "trio Soleil-Lune-Ascendant", "première impression et les 12 signes", "importance de l'heure exacte", "rectification si heure incertaine"],
        "authoritative_sources": [
            ("Wikipedia Ascendant", "https://en.wikipedia.org/wiki/Ascendant_(astrology)"),
            ("Britannica Astrology", "https://www.britannica.com/topic/astrology"),
        ],
    },
    "compatibility": {
        "title_fr": "Compatibilité amoureuse (synastrie)",
        "angle_fr": "Superposition de deux thèmes natals. Vénus, Mars, Lune et Ascendant sont les vraies clés, pas le seul signe solaire. Aspects et overlays de maisons.",
        "themes": ["limites de la comparaison des seuls signes solaires", "Vénus/Mars/Lune comme vraies clés", "aspects inter-thèmes", "overlays de maisons", "relations karmiques"],
        "authoritative_sources": [
            ("Wikipedia Synastry", "https://en.wikipedia.org/wiki/Synastry"),
            ("Britannica Astrology", "https://www.britannica.com/topic/astrology"),
        ],
    },
    "karmic-debt": {
        "title_fr": "Dettes karmiques (13, 14, 16, 19)",
        "angle_fr": "Nombres intermédiaires 13/4, 14/5, 16/7, 19/1 dans la numérologie pythagoricienne. Chacun correspond à un schéma de vie à guérir. Se détecte dans les étapes intermédiaires du calcul, pas dans le résultat réduit.",
        "themes": ["qu'est-ce qu'une dette karmique", "les 4 dettes 13/14/16/19", "comment les détecter", "comment les intégrer"],
        "authoritative_sources": [
            ("Wikipedia Numerology", "https://en.wikipedia.org/wiki/Numerology"),
            ("Britannica Numerology", "https://www.britannica.com/topic/numerology"),
        ],
    },
}


# ---------------------------------------------------------------------------
# Prompt builder. Hands Mistral a strict JSON contract and the FR axis so
# content stays grounded. The system message forbids em/en dashes and
# requires the target locale's script.
# ---------------------------------------------------------------------------

SYSTEM = """You are a senior editor for Karmastro (astrology + numerology site). You write long-form editorial blocks for tool pages.

ABSOLUTE RULES:
- Output MUST be a single valid JSON object, no prose before or after.
- Entire output MUST be in the target language. Not a single phrase in another language.
- ZERO em-dash (—, U+2014), ZERO en-dash (–, U+2013), ZERO horizontal bar (―). Use commas, colons, periods, hyphens.
- Numbers and calculations stay factually correct across all languages.
- Cite only real authorities (Wikipedia, Britannica, NASA, Stanford, Swiss Ephemeris). Exact URLs will be provided.
- Tone : humane, grounded, pedagogical. Never moralistic, never spiritualist kitsch.
- Use the exact JSON schema below.

JSON SCHEMA (strict):
{
  "intro": "60 to 120 words, a single paragraph, opens the editorial block. Uses <strong>key term</strong> at least once. Speakable by screen readers.",
  "sections": [
    {"title": "H2 title, 4 to 10 words", "body": "80 to 200 words. May contain inline HTML like <strong>, <em>. No lists."},
    ... 4 sections total
  ],
  "faq": [
    {"q": "question 8-15 words", "a": "answer 40-90 words, may contain <strong>"},
    ... 3 or 4 FAQ items total
  ],
  "sources": [
    {"title": "Human readable source name", "url": "https://..."},
    ... the authoritative sources list provided in the user prompt, verbatim
  ],
  "labels": {"faq": "<localized FAQ label>", "sources": "<localized Sources label>"}
}
"""


def build_user_prompt(locale_code: str, locale_name: str, labels: dict, tool_key: str, ref: dict) -> str:
    srcs = "\n".join(f"- {t} : {u}" for t, u in ref["authoritative_sources"])
    themes = "; ".join(ref["themes"])
    return f"""Write the editorial body for the tool page "{ref['title_fr']}" in {locale_name} (ISO code: {locale_code}).

TOOL ANGLE (in French, for grounding, do NOT translate verbatim):
{ref['angle_fr']}

COVER THESE THEMES IN THE 4 H2 SECTIONS (each ~120-180 words):
{themes}

AUTHORITATIVE SOURCES (copy verbatim into "sources"):
{srcs}

LOCALIZED LABELS (use exactly these strings in "labels"):
- faq: "{labels['faq']}"
- sources: "{labels['sources']}"

OUTPUT: single JSON object, schema as defined in system prompt. Everything in {locale_name}. Zero em-dash or en-dash. Keep "<strong>" / "<em>" as literal HTML tags."""


def call_mistral(system: str, user: str, max_tokens: int = 4096, retries: int = 3) -> dict:
    body = json.dumps({
        "model": MISTRAL_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "temperature": 0.3,
        "max_tokens": max_tokens,
        "response_format": {"type": "json_object"},
    }).encode()

    last_err = None
    for attempt in range(retries):
        req = urllib.request.Request(
            MISTRAL_URL,
            data=body,
            headers={
                "Authorization": f"Bearer {MISTRAL_KEY}",
                "Content-Type": "application/json",
                "User-Agent": "karmastro-densify/1.0",
            },
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                raw = resp.read().decode()
            data = json.loads(raw)
            content = data["choices"][0]["message"]["content"]
            return json.loads(content)
        except (urllib.error.HTTPError, urllib.error.URLError, json.JSONDecodeError) as e:
            last_err = e
            time.sleep(1 + attempt * 2)
    raise RuntimeError(f"mistral failed after {retries} retries: {last_err}")


# ---------------------------------------------------------------------------
# Validators. Cheap gates we run on every generated block.
# ---------------------------------------------------------------------------

FORBIDDEN_CHARS = ["—", "–", "―"]


def sanitize_dashes(block: dict) -> dict:
    """Rewrite forbidden dashes to commas / hyphens everywhere in the block.
    Mistral occasionally slips em-dashes in even when the prompt forbids
    them (especially in Spanish, Russian, Polish). We fix at the server
    instead of bouncing and wasting tokens."""
    def fix(s):
        if not isinstance(s, str):
            return s
        return s.replace("—", ", ").replace("–", "-").replace("―", ", ").replace("﹘", "-").replace("－", "-")
    if isinstance(block.get("intro"), str):
        block["intro"] = fix(block["intro"])
    for s in block.get("sections", []):
        s["title"] = fix(s.get("title", ""))
        s["body"] = fix(s.get("body", ""))
    for f in block.get("faq", []):
        f["q"] = fix(f.get("q", ""))
        f["a"] = fix(f.get("a", ""))
    for src in block.get("sources", []):
        src["title"] = fix(src.get("title", ""))
    labels = block.get("labels") or {}
    for k in list(labels.keys()):
        labels[k] = fix(labels[k])
    return block


SCRIPT_PATTERNS = {
    "latin": re.compile(r"[A-Za-zÀ-ÿŁ-żĄ-ŻĞ-ğİ-ıŞ-şÇ-çÖ-öÜ-üß]"),
    "cyrillic": re.compile(r"[А-Яа-яЁё]"),
    "arabic": re.compile(r"[؀-ۿ]"),
    "cjk": re.compile(r"[一-鿿぀-ゟ゠-ヿ]"),
}


def validate(block: dict, script: str, locale: str, tool: str) -> list[str]:
    errs: list[str] = []
    required = ["intro", "sections", "faq", "sources", "labels"]
    for k in required:
        if k not in block:
            errs.append(f"missing key: {k}")
    if errs:
        return errs
    if not isinstance(block["intro"], str) or len(block["intro"]) < 60:
        errs.append(f"intro too short: {len(block.get('intro', ''))} chars")
    if not isinstance(block["sections"], list) or len(block["sections"]) < 3:
        errs.append(f"sections: {len(block.get('sections', []))} < 3")
    if not isinstance(block["faq"], list) or len(block["faq"]) < 3:
        errs.append(f"faq: {len(block.get('faq', []))} < 3")

    all_text = json.dumps(block, ensure_ascii=False)
    for c in FORBIDDEN_CHARS:
        if c in all_text:
            errs.append(f"forbidden dash '{c}' present")

    pattern = SCRIPT_PATTERNS.get(script)
    if pattern and not pattern.search(block.get("intro", "")):
        errs.append(f"intro doesn't seem to be in {script} script")

    return errs


# ---------------------------------------------------------------------------
# Driver
# ---------------------------------------------------------------------------


def generate_one(locale_code: str, locale_name: str, labels: dict, script: str, tool_key: str) -> dict:
    ref = TOOL_REFS[tool_key]
    user = build_user_prompt(locale_code, locale_name, labels, tool_key, ref)
    for attempt in range(2):
        try:
            block = call_mistral(SYSTEM, user)
            block = sanitize_dashes(block)
            errs = validate(block, script, locale_code, tool_key)
            if not errs:
                return {"ok": True, "block": block, "locale": locale_code, "tool": tool_key}
            # retry with stricter prompt on validation failure
            user = user + "\n\nPREVIOUS ATTEMPT FAILED validation: " + "; ".join(errs) + "\nFix and try again. Same schema."
        except Exception as e:
            return {"ok": False, "error": str(e), "locale": locale_code, "tool": tool_key}
    return {"ok": False, "error": "validation: " + "; ".join(errs), "locale": locale_code, "tool": tool_key}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="locale filter (eg 'de'), repeatable as comma list")
    ap.add_argument("--tools", help="tool filter comma-separated")
    ap.add_argument("--out", default="scripts/generated_tool_editorials.json")
    ap.add_argument("--concurrency", type=int, default=4)
    args = ap.parse_args()

    only_locales = set(args.only.split(",")) if args.only else None
    only_tools = set(args.tools.split(",")) if args.tools else None

    combos: list[tuple] = []
    for code, name, labels, script in LOCALES:
        if only_locales and code not in only_locales:
            continue
        for tool in TOOLS:
            if only_tools and tool not in only_tools:
                continue
            combos.append((code, name, labels, script, tool))

    # EN thin entries use English labels + latin script
    if not only_locales or "en" in only_locales:
        en_labels = {"faq": "Frequently asked questions", "sources": "Sources"}
        for tool in EN_THIN:
            if only_tools and tool not in only_tools:
                continue
            combos.append(("en", "English (US)", en_labels, "latin", tool))

    out_path = Path(args.out)
    existing: dict = {}
    if out_path.exists():
        existing = json.loads(out_path.read_text())

    results = {k: v for k, v in existing.items()}
    failed: list[str] = []
    t0 = time.time()

    with concurrent.futures.ThreadPoolExecutor(max_workers=args.concurrency) as pool:
        futs = {}
        for code, name, labels, script, tool in combos:
            key = f"{code}:{tool}"
            if key in results and results[key].get("ok"):
                continue
            futs[pool.submit(generate_one, code, name, labels, script, tool)] = key

        for fut in concurrent.futures.as_completed(futs):
            key = futs[fut]
            r = fut.result()
            results[key] = r
            if r.get("ok"):
                intro_len = len(r["block"].get("intro", ""))
                print(f"[ok]   {key:40} intro={intro_len}")
            else:
                failed.append(key)
                print(f"[FAIL] {key:40} {r.get('error')}")
            # checkpoint after every result
            out_path.write_text(json.dumps(results, ensure_ascii=False, indent=2))

    elapsed = time.time() - t0
    ok = sum(1 for v in results.values() if v.get("ok"))
    print(f"\ndone in {elapsed:.1f}s: {ok}/{len(results)} ok, {len(failed)} failed")
    if failed:
        print("failed:", ", ".join(failed))
        sys.exit(1)


if __name__ == "__main__":
    main()

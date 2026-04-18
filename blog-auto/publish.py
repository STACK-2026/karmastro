#!/usr/bin/env python3
"""
Blog Auto — Pipeline de publication automatique
Genere un article SEO via Claude API → commit Markdown → git push → Cloudflare Pages rebuild

Architecture commune a tous les projets STACK-2026.
Adapte de la pipeline Shopify (publish.py) vers Astro + Git.

Usage:
  python publish.py           # Publication normale (article planifie)
  python publish.py --force   # Force la publication du prochain article
  python publish.py --dry-run # Genere sans publier
"""

import os
import sys
import json
import re
import time
import unicodedata
import subprocess
import logging
from datetime import datetime, timezone
from pathlib import Path

import requests
from dotenv import load_dotenv

# ============================================
# CONFIG
# ============================================

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")

# Paths
SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent  # Root of the site repo
ARTICLES_FILE = SCRIPT_DIR / "articles.json"
PROMPT_FILE = SCRIPT_DIR / "prompts" / "article-seo.md"
BLOG_DIR = REPO_DIR / "site" / "src" / "content" / "blog"
LOG_FILE = SCRIPT_DIR / "logs" / "publications.log"

# Claude API
CLAUDE_MODEL = "claude-sonnet-4-6"
CLAUDE_MAX_TOKENS = 16000
CLAUDE_TIMEOUT = 300  # 5 minutes

# Mistral API (cheaper, used as default engine for drafting; Claude only audits)
MISTRAL_URL = "https://api.mistral.ai/v1/chat/completions"
MISTRAL_SMALL = "mistral-small-latest"
MISTRAL_LARGE = "mistral-large-latest"
MISTRAL_TIMEOUT = 300

# Retry config (429/529)
MAX_RETRIES = 3
RETRY_BASE_WAIT = 10  # seconds, multiplied by 2^attempt

# Slug config
SLUG_MAX_LEN = 60
SLUG_MAX_WORDS = 7
# Stop words — GARDER les mots d'intention SEO (comment, pourquoi, prix, guide, meilleur, quel)
STOP_WORDS_FR = {
    "de", "du", "des", "le", "la", "les", "un", "une", "et", "ou",
    "a", "au", "aux", "par", "sur", "avec", "dans", "ne",
    "pas", "se", "ce", "que", "qui", "dont", "son", "sa", "ses",
    "vs", "en", "est", "il", "elle", "nous", "vous", "ils", "elles",
    "etre", "avoir", "faire", "dit", "peut", "plus", "moins", "tout",
    "bien", "mal", "tres", "trop", "quoi", "qu",
    "quand", "votre", "notre", "leur", "cette", "ces", "mon", "ton",
}
# JAMAIS dans stop words : comment, pourquoi, prix, guide, meilleur, quel, combien, top, avis

# ============================================
# LOGGING
# ============================================

LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
log = logging.getLogger("blog-auto")


# ============================================
# TIMEZONE
# ============================================

def now_paris() -> datetime:
    """Current time in Paris timezone."""
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("Europe/Paris"))
    except ImportError:
        import pytz
        return datetime.now(pytz.timezone("Europe/Paris"))


# ============================================
# SLUG GENERATION
# ============================================

def generate_slug(title: str, max_len: int = SLUG_MAX_LEN) -> str:
    """Generate URL-safe slug from title. Max 60 chars, 7 words, no stop words."""
    slug = title.lower()

    # Clean French contractions BEFORE unicode normalization
    slug = re.sub(r"qu[''\u2019]est[- ]ce que", "", slug)  # "qu'est-ce que" → removed
    slug = re.sub(r"[ldsn][''\u2019]", " ", slug)  # l'astrologie → astrologie
    slug = re.sub(r"aujourd[''\u2019]hui", "aujourdhui", slug)

    # Unicode normalize (accents → ascii)
    slug = unicodedata.normalize("NFKD", slug).encode("ascii", "ignore").decode("ascii")
    slug = re.sub(r"[^a-z0-9\s]", " ", slug)

    # Filter stop words, keep SEO intent words, min 2 chars
    words = [w for w in slug.split() if w not in STOP_WORDS_FR and len(w) > 2]

    parts = []
    length = 0
    for w in words[:SLUG_MAX_WORDS]:
        new_length = length + len(w) + (1 if parts else 0)
        if new_length > max_len:
            break
        parts.append(w)
        length = new_length

    return "-".join(parts)


def slug_exists_in_blog(slug: str) -> bool:
    """Check if a markdown file with this slug already exists."""
    return (BLOG_DIR / f"{slug}.md").exists()


# ============================================
# ARTICLES PLANNING
# ============================================

def load_articles() -> list[dict]:
    """Load articles plan from JSON."""
    with open(ARTICLES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_articles(articles: list[dict]) -> None:
    """Save articles plan to JSON."""
    with open(ARTICLES_FILE, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)


def get_due_article(articles: list[dict], force: bool = False) -> dict | None:
    """Find the next article to publish."""
    now = now_paris()
    for article in articles:
        if not article.get("published", False):
            if force:
                return article
            scheduled = datetime.fromisoformat(article["scheduled_datetime"])
            if now.replace(tzinfo=None) >= scheduled.replace(tzinfo=None):
                return article
    return None


# ============================================
# CLAUDE API
# ============================================

def load_system_prompt() -> str:
    """Load the system prompt template."""
    with open(PROMPT_FILE, "r", encoding="utf-8") as f:
        return f.read()



def _build_serp_enrichment(article):
    """Returns SERP brief enrichment text to append to user_prompt, or empty string."""
    serp_brief = (article.get("serp_brief") or {}).get("brief")
    if not serp_brief:
        return ""
    top10 = serp_brief.get("top10", [])
    weak_angles = serp_brief.get("weak_angles", [])
    winning_moves = serp_brief.get("winning_moves", [])
    must_sections = serp_brief.get("must_include_sections", [])
    citable_facts = serp_brief.get("citable_facts_to_verify", [])
    entities = serp_brief.get("entities_to_mention", [])
    target_words = serp_brief.get("target_word_count", 3500)
    intent = serp_brief.get("intent_type", "informational")
    snippet_opp = serp_brief.get("featured_snippet_opportunity", "")
    serp_features = serp_brief.get("serp_features_detected", [])
    competitors_block = "\n".join(
        f"  #{c.get('rank','?')} {c.get('domain','?')} : angle=\"{c.get('main_angle','')[:120]}\" | weakness=\"{c.get('weakness','')[:100]}\""
        for c in top10[:10]
    )
    return f"""

BRIEF SERP (analyse Gemini + Google Search grounding, top 10)
=============================================================

INTENT : {intent}
TARGET WORDS : {target_words} (>= 3500 requis pour standard STACK-2026)
SERP FEATURES : {", ".join(serp_features) if serp_features else "aucune"}
FEATURED SNIPPET : {snippet_opp}

TOP 10 CONCURRENTS :
{competitors_block}

ANGLES FAIBLES A EXPLOITER :
""" + "\n".join(f"  - {a}" for a in weak_angles) + f"""

WINNING MOVES (pour battre le top 3) :
""" + "\n".join(f"  - {m}" for m in winning_moves) + f"""

SECTIONS H2 OBLIGATOIRES (inspire-toi, reformule pour ta voix) :
""" + "\n".join(f"  - {s}" for s in must_sections) + f"""

FAITS CITABLES (verifie avant de reutiliser) :
""" + "\n".join(f"  - {fact}" for fact in citable_facts) + f"""

ENTITES A MENTIONNER : {", ".join(entities)}

REGLE : ton article doit etre SUPERIEUR au top 3 en (1) profondeur sur les weak_angles, (2) execution des winning_moves, (3) clarte/citabilite LLM, (4) E-E-A-T."""



def generate_article(article: dict, system_prompt: str) -> dict:
    """
    Call Claude API to generate an article.
    Returns dict with title_tag, meta_description, content (markdown).
    Retries on 429/529 with exponential backoff.
    """
    user_prompt = f"""Ecris un article SEO profond, humain et optimise pour ranker sur ce sujet :

Titre : {article['title']}
Mots-cles : {article.get('keywords', '')}
Categorie : {article.get('category', '')}
Date : {article.get('scheduled_date', '')}

STANDARDS QUALITE STACK-2026 (OBLIGATOIRES, article rejete sinon) :
1. LONGUEUR : 3500+ mots dans le corps.
2. TL;DR : bloc "**TL;DR**" au tout debut (avant 1ere H2) avec 3-5 bullets resumant l'essentiel.
3. STRUCTURE : intro 200-300 mots, minimum 6 sections H2, sous-sections H3 quand pertinent.
4. FAQ : section "## FAQ" a la fin avec 5 questions + reponses 80-150 mots chacune.
5. SOURCES : section "## Sources" avec minimum 5 references externes verifiables (format: "- [Titre](URL) - Organisme, Date").
6. LIENS EXTERNES : minimum 5 liens dans le corps vers autorites reelles (.gov, .edu, journaux reconnus, entreprises leaders). PAS d'inventer d'URL.
7. LIENS INTERNES : minimum 10 liens relatifs vers /blog/..., /tarifs, /outils, /methode, /contact.
8. E-E-A-T : demontre expertise avec exemples concrets, cas clients anonymises, chiffres sources, nuances pro/contra.

REGLES STYLE :
- Jamais de tiret cadratin ni en dash. Virgule/deux-points/tiret simple (-).
- Accents FR systematiques.
- Chiffres precis UNIQUEMENT si source adjacente (ex: "selon l'INSEE 2024 : 23 %").
- Interdit "les etudes montrent" sans source.
- Zero tableau repete.

Commence par ces 2 lignes EXACTEMENT :
TITLE_TAG: [< 60 chars, mot-cle principal en debut]
META_DESCRIPTION: [150-160 chars, reponse directe, chiffre si possible]

Puis "**TL;DR**" + bullets, puis l'intro, puis les H2.
"""
    user_prompt = user_prompt + _build_serp_enrichment(article)

    for attempt in range(MAX_RETRIES):
        try:
            response = requests.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": CLAUDE_MODEL,
                    "max_tokens": CLAUDE_MAX_TOKENS,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_prompt}],
                },
                timeout=CLAUDE_TIMEOUT,
            )

            if response.status_code in (429, 529, 500, 502, 503):
                wait = RETRY_BASE_WAIT * (2 ** attempt)
                log.warning(f"HTTP {response.status_code} — retry {attempt + 1}/{MAX_RETRIES} dans {wait}s")
                time.sleep(wait)
                continue

            response.raise_for_status()
            break

        except requests.exceptions.Timeout:
            wait = RETRY_BASE_WAIT * (2 ** attempt)
            log.warning(f"Timeout — retry {attempt + 1}/{MAX_RETRIES} dans {wait}s")
            time.sleep(wait)
    else:
        raise Exception(f"Echec apres {MAX_RETRIES} tentatives")

    # Parse response
    data = response.json()
    text = data["content"][0]["text"]

    return parse_claude_response(text, article)


# ============================================
# MISTRAL PIPELINE (Mistral draft + Claude grounding audit + Mistral fix)
# Port depuis adapte-toi/actu_watch_mistral.py. Reduction ~65% spend Claude.
# ============================================

def mistral_call(messages: list, model: str = MISTRAL_SMALL, temperature: float = 0.4,
                 max_tokens: int = 6000, json_mode: bool = False, retries: int = 3) -> str:
    if not MISTRAL_API_KEY:
        raise RuntimeError("MISTRAL_API_KEY manquant")
    payload = {"model": model, "messages": messages, "temperature": temperature, "max_tokens": max_tokens}
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    last = None
    for attempt in range(retries):
        try:
            r = requests.post(MISTRAL_URL, json=payload, headers={
                "Authorization": f"Bearer {MISTRAL_API_KEY}",
                "Content-Type": "application/json",
            }, timeout=MISTRAL_TIMEOUT)
            if r.status_code in (429, 503):
                wait = 5 * (2 ** attempt)
                log.warning(f"Mistral {r.status_code}, retry {wait}s")
                time.sleep(wait)
                continue
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
        except Exception as e:
            last = e
            log.warning(f"Mistral error attempt {attempt+1}: {e}")
            time.sleep(3)
    raise last or RuntimeError("Mistral failed")


def claude_audit_call(system: str, user: str, max_tokens: int = 2500, retries: int = 3) -> str:
    if not ANTHROPIC_API_KEY:
        raise RuntimeError("ANTHROPIC_API_KEY manquant pour audit")
    payload = {"model": CLAUDE_MODEL, "max_tokens": max_tokens, "system": system,
               "messages": [{"role": "user", "content": user}]}
    last = None
    for attempt in range(retries):
        try:
            r = requests.post("https://api.anthropic.com/v1/messages", json=payload, headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            }, timeout=CLAUDE_TIMEOUT)
            if r.status_code in (429, 529):
                wait = 10 * (2 ** attempt)
                log.warning(f"Claude audit {r.status_code}, retry {wait}s")
                time.sleep(wait)
                continue
            r.raise_for_status()
            j = r.json()
            return "".join(b.get("text", "") for b in j.get("content", []) if b.get("type") == "text")
        except Exception as e:
            last = e
            log.warning(f"Claude audit error attempt {attempt+1}: {e}")
            time.sleep(3)
    raise last or RuntimeError("Claude audit failed")


DRAFT_SYSTEM_SUFFIX = """

STANDARDS QUALITE OBLIGATOIRES STACK-2026 (article rejete si non respectes):
- LONGUEUR : 3500+ mots strict dans le corps (hors frontmatter).
- TL;DR : bloc "**TL;DR**" au debut de l'article (avant la 1ere H2) resumant l'essentiel en 3-5 bullets.
- STRUCTURE : intro 200-300 mots, minimum 6 sections H2, sous-sections H3.
- FAQ : section H2 "## FAQ" a la fin avec 5 questions + reponses 80-150 mots chacune.
- SOURCES : section H2 "## Sources" a la fin avec minimum 5 references markdown vers autorites reelles (format: "- [Titre](URL) - Organisme, Date").
- MAILLAGE EXTERNE : minimum 5 liens vers domaines autorites (.gov, .edu, journaux, entreprises leaders VERIFIABLES). JAMAIS inventer d'URL.
- MAILLAGE INTERNE : minimum 10 liens relatifs (/blog/..., /tarifs, /outils, /methode, /contact).
- JAMAIS de tiret cadratin (em U+2014) ni en (en U+2013). Remplace par virgule, deux-points, point ou tiret simple (-).
- Chiffres precis UNIQUEMENT si verifiables avec source adjacente. Sinon reformule en tendance.
- Interdit les claims vagues ("les etudes montrent", "les experts disent") sans source.
- Sortie STRICTEMENT en Markdown, sans wrapper triple-backticks.
- E-E-A-T : demontre l'expertise avec exemples concrets, cas clients, chiffres sources, nuances.
"""

AUDIT_SYSTEM = """Tu es auditeur QUALITE SEO pour standards STACK-2026.

Audite le DRAFT contre les CRITERES OBJECTIFS. Retourne JSON strict.

SEUILS DURS (MAJOR si non respectes):
1. LONGUEUR corps : 3500+ mots. MINOR si 3000-3499, MAJOR si < 3000.
2. TL;DR : bloc "**TL;DR**" ou "TL;DR:" present avant la 1ere H2.
3. FAQ : section "## FAQ" avec au moins 5 questions.
4. SOURCES : section "## Sources" avec au moins 5 references markdown.
5. LIENS EXTERNES : minimum 5 liens [...](https://...) vers domaines differents du site courant.
6. LIENS INTERNES : minimum 10 liens [...](/...) relatifs.
7. HALLUCINATIONS : chiffres precis sans source adjacente, citations sans attribution, noms/lois inventees.
8. TIRETS : em dash (U+2014) ou en dash (U+2013) present = MAJOR.

Retourne UNIQUEMENT ce JSON :
{
  "word_count_body": 0,
  "has_tldr": false,
  "has_faq": false,
  "faq_questions_count": 0,
  "has_sources": false,
  "sources_count": 0,
  "external_links_count": 0,
  "internal_links_count": 0,
  "em_dashes_present": false,
  "hallucinations": [{"claim": "max 180 chars", "type": "chiffre|citation|nom|date|loi", "reason": "..."}],
  "issues": [{"field": "word_count|tldr|faq|sources|external_links|internal_links|hallucinations|dashes", "severity": "MINOR|MAJOR", "description": "..."}],
  "verdict": "CLEAN|MINOR|MAJOR"
}

VERDICT :
- CLEAN = 0 issue.
- MINOR = 1-3 issues non critiques (3000-3499 mots, 4 liens ext, 9 liens int).
- MAJOR = au moins 1 critique : pas FAQ/Sources/TL;DR, mots<3000, hallucination grave, em-dash present, liens < minima durs.

IGNORE: opinions, style, choix editoriaux."""


def generate_article_mistral(article: dict, system_prompt: str) -> dict:
    """Draft article via Mistral-large (replaces Claude for draft)."""
    user_prompt = f"""Ecris un article SEO complet sur le sujet suivant :

Titre : {article['title']}
Mots-cles : {article.get('keywords', '')}
Categorie : {article.get('category', '')}
Blog : {article.get('blog', 'principal')}
Date de publication : {article.get('scheduled_date', '')}

IMPORTANT : L'article doit etre en Markdown (PAS en HTML).
Commence ta reponse avec exactement ces 2 lignes :
TITLE_TAG: [titre SEO optimise < 60 caracteres]
META_DESCRIPTION: [meta description 150-160 caracteres]

Puis le contenu Markdown de l'article (sans H1, commence directement par le sommaire puis les H2).
"""
    user_prompt = user_prompt + _build_serp_enrichment(article)
    log.info("Mistral-large draft...")
    text = mistral_call(
        [{"role": "system", "content": system_prompt + DRAFT_SYSTEM_SUFFIX},
         {"role": "user", "content": user_prompt}],
        model=MISTRAL_LARGE, temperature=0.4, max_tokens=14000,
    )
    text = _strip_md_fence(text)
    parsed = parse_claude_response(text, article)

    # Optional grounding audit (only if ANTHROPIC_API_KEY present)
    if ANTHROPIC_API_KEY:
        try:
            log.info("Claude grounding audit...")
            audit = _audit_draft(parsed["content"])
            verdict = audit.get("verdict", "UNKNOWN")
            halls = audit.get("hallucinations", [])
            log.info(f"  verdict={verdict} hallucinations={len(halls)}")
            if verdict == "MAJOR" or (audit.get("issues") or halls):
                log.info("Mistral-large fix hallucinations...")
                fixed_text = _fix_issues(text, audit)
                fixed_text = _strip_md_fence(fixed_text)
                parsed = parse_claude_response(fixed_text, article)
        except Exception as e:
            log.warning(f"Audit skipped: {e}")
    else:
        log.info("No ANTHROPIC_API_KEY, audit skipped (Mistral-only mode)")

    return parsed


def _strip_md_fence(text: str) -> str:
    text = re.sub(r"^```(?:markdown|md|yaml)?\s*\n", "", text.strip())
    text = re.sub(r"\n```\s*$", "", text)
    return text


def _audit_draft(draft: str) -> dict:
    user = f"DRAFT A AUDITER :\n\n{draft[:10000]}\n\nRetourne le JSON d'audit uniquement."
    content = claude_audit_call(AUDIT_SYSTEM, user, max_tokens=2000)
    m = re.search(r"\{[\s\S]*\}", content)
    if not m:
        return {"verdict": "UNKNOWN", "hallucinations": []}
    try:
        return json.loads(m.group())
    except json.JSONDecodeError:
        return {"verdict": "UNKNOWN", "hallucinations": []}


def _fix_issues(draft: str, audit: dict) -> str:
    """Mistral-large fix based on audit issues. Replaces _fix_hallucinations (broader scope)."""
    issues = list(audit.get("issues", [])) + [
        {"field": "hallucination", "severity": "MAJOR",
         "description": f"Claim: {h.get('claim','')[:150]} | Raison: {h.get('reason','')}"}
        for h in audit.get("hallucinations", [])
    ]
    if not issues:
        return draft
    issues_text = "
".join(
        f"- [{i.get('severity','?')}] {i.get('field','?')}: {i.get('description','')}"
        for i in issues[:25]
    )
    wc = audit.get("word_count_body", 0)
    user = f"""Auditeur a flagge {len(issues)} problemes dans le DRAFT. Corrige-les en developpant intelligemment.

PROBLEMES :
{issues_text}

Longueur actuelle : {wc} mots.

DIRECTIVES DURES :
- Si word_count < 3500 : DEVELOPPE chaque section existante avec exemples concrets, chiffres sources, nuances. Ajoute des H2/H3 supplementaires si besoin. Ecris jusqu'a atteindre 3500+ mots.
- Si TL;DR absent : ajoute un bloc "**TL;DR**" (3-5 bullets) au tout debut avant la 1ere H2.
- Si FAQ absente ou < 5 questions : ajoute/etend "## FAQ" avec 5 questions + reponses 80-150 mots.
- Si Sources absente ou < 5 references : ajoute/etend "## Sources" avec liens reels (format markdown).
- Si liens externes < 5 : injecte des liens vers autorites reelles (.gov, .edu, journaux, leaders secteur) dans le corps.
- Si liens internes < 10 : injecte des liens relatifs vers /blog/..., /tarifs, /outils, /methode, /contact.
- Si em/en dash : remplace TOUS par virgule, deux-points, point ou tiret simple (-).
- Si hallucinations : retire les chiffres/citations douteux ou reformule en tendance (ex: "plusieurs etudes" sans chiffre precis) ou attribue a une source reelle verifiable.

CONSERVE le frontmatter (TITLE_TAG + META_DESCRIPTION) INTACT. Garde la structure, le style, le ton. Modifie UNIQUEMENT ce qui est flagge.

DRAFT :
{draft}

Retourne le draft corrige COMPLET, sans commentaire, sans triple-backticks."""
    return mistral_call(
        [{"role": "system", "content": "Tu corriges les issues flaggees en developpant le contenu pour atteindre les standards STACK-2026."},
         {"role": "user", "content": user}],
        model=MISTRAL_LARGE, temperature=0.25, max_tokens=14000,
    )


def parse_claude_response(text: str, article: dict) -> dict:
    """Extract title_tag, meta_description and markdown content from Claude response."""
    lines = text.strip().split("\n")

    title_tag = article["title"]  # fallback
    meta_description = ""
    content_start = 0

    for i, line in enumerate(lines):
        if line.startswith("TITLE_TAG:"):
            title_tag = line.replace("TITLE_TAG:", "").strip()
        elif line.startswith("META_DESCRIPTION:"):
            meta_description = line.replace("META_DESCRIPTION:", "").strip()
        else:
            content_start = i
            break

    content = "\n".join(lines[content_start:]).strip()

    return {
        "title_tag": title_tag[:60],
        "meta_description": meta_description[:160],
        "content": content,
    }


# ============================================
# IMAGE HANDLING
# ============================================

def fetch_unsplash_image(query: str, article_index: int = 0) -> dict | None:
    """Fetch a featured image from Unsplash API."""
    if not UNSPLASH_ACCESS_KEY:
        return None

    try:
        response = requests.get(
            "https://api.unsplash.com/search/photos",
            params={
                "query": query,
                "per_page": 5,
                "page": (article_index // 5) + 1,
                "orientation": "landscape",
            },
            headers={"Authorization": f"Client-ID {UNSPLASH_ACCESS_KEY}"},
            timeout=15,
        )
        response.raise_for_status()
        results = response.json().get("results", [])

        if results:
            photo = results[article_index % len(results)]
            return {
                "url": f"{photo['urls']['raw']}&w=1200&h=630&fit=crop&crop=center&q=80",
                "alt": photo.get("alt_description", query),
                "photographer": photo["user"]["name"],
                "photographer_url": photo["user"]["links"]["html"],
            }
    except Exception as e:
        log.warning(f"Unsplash failed: {e}")

    return None


# ============================================
# AUTHORS (rotation)
# ============================================

AUTHORS = [
    {"name": "Sibylle", "role": "Astrologue"},
    {"name": "Orion", "role": "Guide karmique"},
    {"name": "Séléné", "role": "Guidance relationnelle"},
    {"name": "Pythia", "role": "Numérologue"},
]

# Category → preferred author mapping
AUTHOR_BY_CATEGORY = {
    "astrologie": "Sibylle",
    "numerologie": "Pythia",
    "karma": "Orion",
    "horoscope": "Sibylle",
    "compatibilite": "Séléné",
    "guides": "Orion",
    "amour": "Séléné",
    "relations": "Séléné",
}


def get_author(article: dict, index: int) -> str:
    """Get author name based on category or rotation."""
    category = article.get("category", "")
    if category in AUTHOR_BY_CATEGORY:
        return AUTHOR_BY_CATEGORY[category]
    return AUTHORS[index % len(AUTHORS)]["name"]


# ============================================
# MARKDOWN FILE GENERATION
# ============================================

def generate_frontmatter(article: dict, generated: dict, image: dict | None) -> str:
    """Generate YAML frontmatter for the markdown file."""
    tags = [t.strip() for t in article.get("keywords", "").split(",") if t.strip()]
    author = get_author(article, article.get("index", 0))

    fm = f"""---
title: "{generated['title_tag']}"
description: "{generated['meta_description']}"
date: {article.get('scheduled_date', datetime.now().strftime('%Y-%m-%d'))}
author: "{author}"
category: "{article.get('category', '')}"
tags: {json.dumps(tags, ensure_ascii=False)}
keywords: "{article.get('keywords', '')}"
draft: false"""

    if image:
        fm += f'\nimage: "{image["url"]}"'
        fm += f'\nimageAlt: "{image["alt"]}"'

    fm += "\n---"
    return fm


def write_article_file(slug: str, frontmatter: str, content: str) -> Path:
    """Write the markdown article file."""
    BLOG_DIR.mkdir(parents=True, exist_ok=True)
    filepath = BLOG_DIR / f"{slug}.md"
    filepath.write_text(f"{frontmatter}\n\n{content}\n", encoding="utf-8")
    return filepath


# ============================================
# GIT OPERATIONS
# ============================================

def git_push(slug: str) -> bool:
    """Git add, commit and push the new article."""
    try:
        subprocess.run(
            ["git", "add", f"site/src/content/blog/{slug}.md"],
            cwd=REPO_DIR, check=True, capture_output=True,
        )
        subprocess.run(
            ["git", "commit", "-m", f"blog: {slug} [{now_paris().strftime('%Y-%m-%d %H:%M')}]"],
            cwd=REPO_DIR, check=True, capture_output=True,
        )
        subprocess.run(
            ["git", "push", "origin", "main"],
            cwd=REPO_DIR, check=True, capture_output=True,
        )
        log.info(f"Git push OK — {slug}")
        return True
    except subprocess.CalledProcessError as e:
        log.error(f"Git error: {e.stderr.decode() if e.stderr else e}")
        return False


def git_push_articles_json() -> None:
    """Commit and push the updated articles.json."""
    try:
        subprocess.run(
            ["git", "add", "blog-auto/articles.json"],
            cwd=REPO_DIR, check=True, capture_output=True,
        )
        subprocess.run(
            ["git", "commit", "-m", f"blog-auto: update articles.json [{now_paris().strftime('%Y-%m-%d %H:%M')}]"],
            cwd=REPO_DIR, check=True, capture_output=True,
        )
        subprocess.run(
            ["git", "push", "origin", "main"],
            cwd=REPO_DIR, check=True, capture_output=True,
        )
    except subprocess.CalledProcessError:
        pass  # Non-blocking


# ============================================
# INDEXNOW
# ============================================

def submit_indexnow(url: str, site_url: str, indexnow_key: str) -> None:
    """Submit URL to IndexNow (Bing, DuckDuckGo, Yandex, Ecosia)."""
    if not indexnow_key:
        return

    try:
        host = site_url.replace("https://", "").replace("http://", "").rstrip("/")
        response = requests.post(
            "https://api.indexnow.org/indexnow",
            json={
                "host": host,
                "key": indexnow_key,
                "keyLocation": f"{site_url}/{indexnow_key}.txt",
                "urlList": [url],
            },
            headers={"Content-Type": "application/json"},
            timeout=15,
        )
        log.info(f"IndexNow: {response.status_code}")
    except Exception as e:
        log.warning(f"IndexNow failed: {e}")


def ping_sitemaps(site_url: str) -> None:
    """Ping Google and Bing with sitemap."""
    sitemap = f"{site_url}/sitemap-index.xml"
    engines = [
        ("Google", f"https://www.google.com/ping?sitemap={sitemap}"),
        ("Bing", f"https://www.bing.com/ping?sitemap={sitemap}"),
    ]
    for name, url in engines:
        try:
            r = requests.get(url, timeout=10)
            log.info(f"Sitemap ping {name}: {r.status_code}")
        except Exception as e:
            log.warning(f"Sitemap ping {name} failed: {e}")


# ============================================
# MAILLAGE INTERNE (POST-PUBLICATION)
# ============================================

def find_related_articles(
    current: dict,
    articles: list[dict],
    max_related: int = 3,
) -> list[dict]:
    """Find top related published articles by keyword overlap."""
    current_kw = set(
        k.strip().lower()
        for k in current.get("keywords", "").split(",") if k.strip()
    )
    current_cat = current.get("category", "").lower()

    scored = []
    for art in articles:
        if art.get("slug") == current.get("slug"):
            continue
        if not art.get("published"):
            continue

        score = 0
        art_kw = set(
            k.strip().lower()
            for k in art.get("keywords", "").split(",") if k.strip()
        )

        # Shared keywords (root matching, 4+ chars)
        for ck in current_kw:
            for ak in art_kw:
                root = min(len(ck), len(ak), 4)
                if ck[:root] == ak[:root] and root >= 4:
                    score += 1

        # Same category
        if art.get("category", "").lower() == current_cat and current_cat:
            score += 5

        # Same blog
        if art.get("blog") == current.get("blog"):
            score += 3

        if score > 0:
            scored.append((score, art))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [art for _, art in scored[:max_related]]


def inject_related_links(
    content: str, related: list[dict], site_url: str
) -> str:
    """Append 'Articles similaires' section to markdown content."""
    if not related:
        return content

    section = "\n\n---\n\n## Articles similaires\n\n"
    for art in related:
        slug = art.get("slug", "")
        title = art.get("title", slug)
        section += f"- [{title}]({site_url}/blog/{slug})\n"

    return content + section


# ============================================
# MAIN PIPELINE
# ============================================

def _arg_value(flag: str, default: str) -> str:
    """Extract `--flag value` from sys.argv; returns default if not found."""
    if flag in sys.argv:
        idx = sys.argv.index(flag)
        if idx + 1 < len(sys.argv):
            return sys.argv[idx + 1]
    return default


def main():
    force = "--force" in sys.argv
    dry_run = "--dry-run" in sys.argv
    engine = _arg_value("--engine", "mistral").lower()  # mistral (default) | claude

    log.info("=" * 60)
    log.info(f"Blog Auto — {now_paris().strftime('%Y-%m-%d %H:%M:%S')}")
    log.info(f"Mode: {'FORCE' if force else 'DRY-RUN' if dry_run else 'normal'}")

    # Validate config
    if not ANTHROPIC_API_KEY:
        log.error("ANTHROPIC_API_KEY manquant dans .env")
        sys.exit(1)

    if not PROMPT_FILE.exists():
        log.error(f"Prompt file manquant: {PROMPT_FILE}")
        sys.exit(1)

    # Load articles
    articles = load_articles()
    total = len(articles)
    published = sum(1 for a in articles if a.get("published"))
    log.info(f"Articles: {published}/{total} publies")

    # Find due article
    article = get_due_article(articles, force=force)
    if not article:
        log.info("Pas d'article a publier maintenant")
        return

    log.info(f"Article a publier: {article['title']}")

    # Generate slug
    slug = article.get("slug") or generate_slug(article["title"])
    article["slug"] = slug
    log.info(f"Slug: {slug}")

    # Anti-doublon
    if slug_exists_in_blog(slug):
        log.warning(f"DOUBLON EVITE — l'article '{slug}' existe deja")
        article["published"] = True
        article["published_at"] = now_paris().isoformat()
        save_articles(articles)
        return

    # Load system prompt
    system_prompt = load_system_prompt()

    # Dispatch based on --engine flag (mistral default, claude fallback)
    if engine == "mistral" and MISTRAL_API_KEY:
        log.info("Generation via Mistral-large + Claude audit (engine=mistral)...")
        generated = generate_article_mistral(article, system_prompt)
    else:
        log.info("Generation via Claude Sonnet (engine=claude)...")
        generated = generate_article(article, system_prompt)
    log.info(f"Title tag: {generated['title_tag']}")
    log.info(f"Meta desc: {generated['meta_description'][:80]}...")

    # Fetch featured image
    image = None
    if UNSPLASH_ACCESS_KEY:
        query = article.get("keywords", article["title"]).split(",")[0].strip()
        image = fetch_unsplash_image(query, article.get("index", 0))
        if image:
            log.info(f"Image: {image['photographer']} (Unsplash)")

    # Find related articles for maillage
    related = find_related_articles(article, articles)
    if related:
        log.info(f"Maillage: {len(related)} articles lies")

    # Inject related links
    # Read SITE_URL from the site config or env
    site_url = os.getenv("SITE_URL", "https://domaine.fr")
    content_with_links = inject_related_links(
        generated["content"], related, site_url
    )

    # Generate frontmatter + write file
    frontmatter = generate_frontmatter(article, generated, image)
    filepath = write_article_file(slug, frontmatter, content_with_links)
    log.info(f"Fichier cree: {filepath}")

    if dry_run:
        log.info("DRY-RUN — pas de git push ni indexation")
        return

    # Git push
    if git_push(slug):
        log.info("Deploiement Cloudflare Pages en cours (~30s)")
    else:
        log.error("Git push echoue — article cree localement mais non deploye")

    # Update articles.json
    article["published"] = True
    article["published_at"] = now_paris().isoformat()
    article["title_tag"] = generated["title_tag"]
    article["meta_description"] = generated["meta_description"]
    if image:
        article["featured_image_url"] = image["url"]
    save_articles(articles)
    git_push_articles_json()

    # IndexNow
    article_url = f"{site_url}/blog/{slug}"
    indexnow_key = os.getenv("INDEXNOW_KEY", "")
    submit_indexnow(article_url, site_url, indexnow_key)

    # Sitemap ping
    ping_sitemaps(site_url)

    # Final log
    log.info(f"Publication terminee avec succes: {article_url}")
    log.info(f"Progression: {published + 1}/{total}")


if __name__ == "__main__":
    main()

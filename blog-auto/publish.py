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
UNSPLASH_ACCESS_KEY = os.getenv("UNSPLASH_ACCESS_KEY", "")

# Paths
SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent  # Root of the site repo
ARTICLES_FILE = SCRIPT_DIR / "articles.json"
PROMPT_FILE = SCRIPT_DIR / "prompts" / "article-seo.md"
BLOG_DIR = REPO_DIR / "src" / "content" / "blog"
LOG_FILE = SCRIPT_DIR / "logs" / "publications.log"

# Claude API
CLAUDE_MODEL = "claude-sonnet-4-20250514"
CLAUDE_MAX_TOKENS = 16000
CLAUDE_TIMEOUT = 300  # 5 minutes

# Retry config (429/529)
MAX_RETRIES = 3
RETRY_BASE_WAIT = 10  # seconds, multiplied by 2^attempt

# Slug config
SLUG_MAX_LEN = 60
SLUG_MAX_WORDS = 7
STOP_WORDS_FR = {
    "de", "du", "des", "le", "la", "les", "un", "une", "et", "ou",
    "a", "au", "aux", "par", "pour", "sur", "avec", "dans", "ne",
    "pas", "se", "ce", "que", "qui", "dont", "son", "sa", "ses",
    "vs", "en", "est", "il", "elle", "nous", "vous", "ils", "elles",
    "etre", "avoir", "faire", "dit", "peut", "plus", "moins", "tout",
    "bien", "mal", "tres", "trop", "quoi", "comment", "pourquoi",
    "quand", "votre", "notre", "leur", "cette", "ces", "mon", "ton",
}

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
    slug = unicodedata.normalize("NFKD", title).encode("ascii", "ignore").decode("ascii")
    slug = slug.lower()
    slug = re.sub(r"[^a-z0-9\s]", " ", slug)
    words = [w for w in slug.split() if w not in STOP_WORDS_FR and len(w) > 1]

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


def generate_article(article: dict, system_prompt: str) -> dict:
    """
    Call Claude API to generate an article.
    Returns dict with title_tag, meta_description, content (markdown).
    Retries on 429/529 with exponential backoff.
    """
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
# MARKDOWN FILE GENERATION
# ============================================

def generate_frontmatter(article: dict, generated: dict, image: dict | None) -> str:
    """Generate YAML frontmatter for the markdown file."""
    tags = [t.strip() for t in article.get("keywords", "").split(",") if t.strip()]

    fm = f"""---
title: "{generated['title_tag']}"
description: "{generated['meta_description']}"
date: {article.get('scheduled_date', datetime.now().strftime('%Y-%m-%d'))}
author: "{article.get('author', 'Auteur')}"
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
            ["git", "add", f"src/content/blog/{slug}.md"],
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

def main():
    force = "--force" in sys.argv
    dry_run = "--dry-run" in sys.argv

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

    # Generate article via Claude API
    log.info("Generation via Claude API...")
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

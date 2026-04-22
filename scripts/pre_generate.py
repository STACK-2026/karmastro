"""Pre-generation karmastro avec quality gate stricte STACK-2026.

Pour chaque article non-publie sans queue_file :
1. SERP brief Gemini OBLIGATOIRE (sauf --no-serp explicite)
2. Genere via Mistral-large + Claude Sonnet audit
3. Quality gate : 3000+ mots, 10+ liens internes, 5+ liens externes autorite, Sources H2, FAQ 5+, TL;DR, 0 em-dash
4. Si fail : retry 1x via Claude direct, puis reject (log)
5. Sauvegarde dans blog-auto/queue/<slug>.md + articles.json[].queue_file

Objectif : chaque article doit RANKER fort. Pas de compromis qualite.

Usage:
  python3 scripts/pre_generate.py --count 5
  python3 scripts/pre_generate.py --index 15
  python3 scripts/pre_generate.py --count 3 --dry-run
"""
from __future__ import annotations
import argparse, json, logging, os, re, sys, subprocess, time
from pathlib import Path

try:
    from dotenv import load_dotenv
    ENV_MASTER = Path.home() / "stack-2026" / ".env.master"
    if ENV_MASTER.exists():
        load_dotenv(ENV_MASTER)
    load_dotenv()
except ImportError:
    pass

SCRIPT_DIR = Path(__file__).parent
REPO_DIR = SCRIPT_DIR.parent
BLOG_AUTO_DIR = REPO_DIR / "blog-auto"
QUEUE_DIR = BLOG_AUTO_DIR / "queue"
ARTICLES_FILE = BLOG_AUTO_DIR / "articles.json"

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("pre_generate")

sys.path.insert(0, str(BLOG_AUTO_DIR))
from publish import (
    generate_article_mistral,
    generate_article,
    load_system_prompt,
    generate_slug,
    MISTRAL_API_KEY,
    ANTHROPIC_API_KEY,
)

# ============================================
# QUALITY GATE : STACK-2026 rules
# ============================================
MIN_WORDS = 3000
MIN_INTERNAL_LINKS = 10
MIN_EXTERNAL_LINKS = 5
MIN_FAQ_QUESTIONS = 5

def quality_gate(content: str, article: dict) -> tuple[bool, list[str]]:
    """Verifie qu'un article respecte les regles STACK-2026 pour ranker fort."""
    errors = []
    # Strip frontmatter for word count
    body = re.sub(r'^---\n.*?\n---\n', '', content, count=1, flags=re.DOTALL)
    text_only = re.sub(r'<[^>]+>', ' ', body)
    text_only = re.sub(r'`[^`]+`', ' ', text_only)
    text_only = re.sub(r'\s+', ' ', text_only)
    words = len(text_only.split())
    if words < MIN_WORDS:
        errors.append(f"Mots: {words} < {MIN_WORDS}")

    # Internal links (href="/...") or karmastro.com
    internal = len(re.findall(r'href=["\'](/[^"\'#?]+|https://karmastro\.com[^"\']*)["\']', body))
    internal += len(re.findall(r'\]\((/[^)]+|https://karmastro\.com[^)]+)\)', body))  # markdown [text](/slug)
    if internal < MIN_INTERNAL_LINKS:
        errors.append(f"Liens internes: {internal} < {MIN_INTERNAL_LINKS}")

    # External links (https://...)
    external = len(re.findall(r'href=["\']https?://(?!karmastro\.com)[^"\']+["\']', body))
    external += len(re.findall(r'\]\(https?://(?!karmastro\.com)[^)]+\)', body))  # markdown
    if external < MIN_EXTERNAL_LINKS:
        errors.append(f"Liens externes autorite: {external} < {MIN_EXTERNAL_LINKS}")

    # FAQ section - count H3 with "?"
    faq_q = len(re.findall(r'(?:^|\n)##?#?\s*[^\n]*\?', body))
    if faq_q < MIN_FAQ_QUESTIONS:
        errors.append(f"Questions FAQ: {faq_q} < {MIN_FAQ_QUESTIONS}")

    # TL;DR (data-speakable or explicit block)
    has_tldr = bool(re.search(r'data-speakable|tl;dr|en bref|<aside', body, re.IGNORECASE))
    if not has_tldr:
        errors.append("TL;DR / data-speakable absent")

    # Sources section
    has_sources = bool(re.search(r'^##?\s*Sources?\s*$|^##?\s*R[ée]f[ée]rences?\s*$|^##?\s*Bibliographie\s*$', body, re.MULTILINE | re.IGNORECASE))
    if not has_sources:
        errors.append("Section Sources absente")

    # Em-dashes / en-dashes
    em_dashes = body.count("—") + body.count("–")
    if em_dashes > 0:
        errors.append(f"Tirets cadratins: {em_dashes} (regle absolue 0)")

    return (len(errors) == 0, errors)


def enrich_with_serp(article: dict) -> bool:
    """Run serp_brief for a single article. Returns True if enriched."""
    if article.get("serp_brief"):
        return True
    serp_script = SCRIPT_DIR / "serp_brief.py"
    if not serp_script.exists():
        log.warning("serp_brief.py not found, skipping")
        return False
    log.info(f"  [{article.get('index')}] Gemini SERP brief (grounded)...")
    try:
        idx = article.get("index")
        subprocess.run(["python3", str(serp_script), "--index", str(idx)], check=True, cwd=REPO_DIR, timeout=200)
        # Reload
        articles_reloaded = json.loads(ARTICLES_FILE.read_text(encoding="utf-8"))
        for a in articles_reloaded:
            if a.get("index") == idx and a.get("serp_brief"):
                article["serp_brief"] = a["serp_brief"]
                log.info(f"  SERP brief OK (target {a['serp_brief'].get('brief', {}).get('target_word_count', '?')} mots)")
                return True
        return False
    except subprocess.CalledProcessError as e:
        log.warning(f"  SERP brief failed: {e}")
        return False
    except subprocess.TimeoutExpired:
        log.warning(f"  SERP brief timeout")
        return False


def save_article_to_queue(article: dict, generated: dict) -> Path:
    slug = article.get("slug") or generate_slug(article["title"])
    article["slug"] = slug

    today = time.strftime("%Y-%m-%d")
    frontmatter_lines = ["---"]
    fm = {
        "title": generated.get("title_tag") or article["title"],
        "description": (generated.get("meta_description") or article["title"])[:160],
        "date": article.get("scheduled_date") or today,
        "lang": article.get("lang", "fr"),
        "author": article.get("author", "Karmastro"),
        "category": article.get("category", "astrologie"),
        "tags": article.get("tags", []),
        "keywords": article.get("keywords", ""),
        "slug": slug,
        "draft": False,
        "lastReviewed": today,
        "reviewedBy": article.get("reviewer") or article.get("author") or "Karmastro Editorial",
    }
    for k, v in fm.items():
        if isinstance(v, str):
            v = v.replace('"', "'").replace("—", "-").replace("–", "-")
            frontmatter_lines.append(f'{k}: "{v}"')
        elif isinstance(v, list):
            frontmatter_lines.append(f"{k}: {json.dumps(v, ensure_ascii=False)}")
        elif isinstance(v, bool):
            frontmatter_lines.append(f"{k}: {str(v).lower()}")
        else:
            frontmatter_lines.append(f"{k}: {v}")
    frontmatter_lines.append("---")
    frontmatter_lines.append("")

    body = generated.get("content", "") or ""
    body = body.replace("—", "-").replace("–", "-")

    full = "\n".join(frontmatter_lines) + body.strip() + "\n"

    QUEUE_DIR.mkdir(parents=True, exist_ok=True)
    qf = f"{slug}.md"
    path = QUEUE_DIR / qf
    path.write_text(full, encoding="utf-8")
    words = len(re.sub(r'<[^>]+>', ' ', body).split())
    log.info(f"  Saved queue/{qf} ({len(full)} bytes, ~{words} words)")
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=5)
    ap.add_argument("--index", type=int)
    ap.add_argument("--no-serp", action="store_true", help="Skip SERP brief (deconseille, moins pertinent)")
    ap.add_argument("--engine", default="mistral", choices=["mistral", "claude"])
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--skip-quality-gate", action="store_true", help="Save meme si quality gate fail (pour debug)")
    args = ap.parse_args()

    if not MISTRAL_API_KEY and args.engine == "mistral":
        log.error("MISTRAL_API_KEY manquant")
        sys.exit(1)
    if not ANTHROPIC_API_KEY:
        log.error("ANTHROPIC_API_KEY manquant")
        sys.exit(1)

    articles = json.loads(ARTICLES_FILE.read_text(encoding="utf-8"))

    targets = []
    for a in articles:
        if args.index is not None:
            if a.get("index") == args.index:
                targets = [a]; break
            continue
        if a.get("published"): continue
        if a.get("queue_file"): continue
        slug = a.get("slug") or generate_slug(a["title"])
        qf = f"{slug}.md"
        if (QUEUE_DIR / qf).exists():
            a["queue_file"] = qf
            continue
        targets.append(a)
    if args.index is None:
        targets = targets[: args.count]

    log.info(f"Pre-generation de {len(targets)} articles (min {MIN_WORDS} mots, {MIN_INTERNAL_LINKS}+ int, {MIN_EXTERNAL_LINKS}+ ext, FAQ {MIN_FAQ_QUESTIONS}+)")

    system_prompt = load_system_prompt()
    ok_count = 0; fail_count = 0

    for article in targets:
        try:
            log.info(f"=== [{article.get('index','?')}] {article['title'][:80]} ===")

            if not args.no_serp:
                enrich_with_serp(article)

            log.info(f"  Generating via {args.engine}...")
            t0 = time.time()
            if args.engine == "mistral" and MISTRAL_API_KEY:
                generated = generate_article_mistral(article, system_prompt)
            else:
                generated = generate_article(article, system_prompt)
            dur = int(time.time() - t0)
            log.info(f"  Generated in {dur}s")

            content = generated.get("content", "") or ""
            passed, errors = quality_gate(content, article)
            if not passed and not args.skip_quality_gate:
                log.warning(f"  Quality gate FAIL: {', '.join(errors)}")
                log.info(f"  Retry via Claude direct...")
                generated2 = generate_article(article, system_prompt)
                content2 = generated2.get("content", "") or ""
                passed2, errors2 = quality_gate(content2, article)
                if passed2:
                    generated = generated2
                    content = content2
                    passed = True
                    log.info(f"  Retry Claude OK, quality gate passed")
                else:
                    log.error(f"  Retry Claude aussi fail: {', '.join(errors2)}")
                    fail_count += 1
                    continue

            if args.dry_run:
                log.info(f"  [DRY-RUN] Would save ({len(content)} chars, gate={'OK' if passed else 'FAIL'})")
                continue

            generated["content"] = content
            path = save_article_to_queue(article, generated)
            article["queue_file"] = path.name
            article["pre_generated_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")

            ARTICLES_FILE.write_text(json.dumps(articles, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
            ok_count += 1
            log.info(f"  OK. ({path.name}) articles.json updated")
            time.sleep(3)

        except Exception as e:
            log.error(f"  FAIL: {e}")
            import traceback; traceback.print_exc()
            fail_count += 1
            continue

    log.info(f"\nBilan: {ok_count} OK, {fail_count} FAIL, sur {len(targets)} tentatives")


if __name__ == "__main__":
    main()

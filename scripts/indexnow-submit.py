#!/usr/bin/env python3
"""
Submit all Karmastro URLs to IndexNow (Bing, Yandex, Seznam, DuckDuckGo).

Usage:
    python indexnow-submit.py                    # Submit all pages
    python indexnow-submit.py --sitemap-only     # Fetch from sitemap
    python indexnow-submit.py --url https://karmastro.com/foo  # Single URL
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
import urllib.parse
import urllib.error
from typing import Iterable

INDEXNOW_KEY = "fb25c2eab5eb5d21087553dc56d0a1db"
HOST = "karmastro.com"
KEY_LOCATION = f"https://{HOST}/{INDEXNOW_KEY}.txt"
ENDPOINT = "https://api.indexnow.org/indexnow"

# All locales we support
LOCALES = ["en", "es", "pt", "de", "it", "tr", "ar", "ja", "pl", "ru"]

# Zodiac signs for horoscope pages
SIGNS = ["belier", "taureau", "gemeaux", "cancer", "lion", "vierge", "balance", "scorpion", "sagittaire", "capricorne", "verseau", "poissons"]

# Outils slugs
TOOLS = ["chemin-de-vie", "nombre-expression", "annee-personnelle", "dette-karmique", "ascendant", "theme-natal", "transits", "compatibilite", "synastrie"]


def build_url_list() -> list[str]:
    """Build the complete list of Karmastro URLs to submit."""
    urls: set[str] = set()

    # === FR (default, no prefix) ===
    urls.add(f"https://{HOST}/")
    urls.add(f"https://{HOST}/horoscope")
    urls.add(f"https://{HOST}/outils")
    urls.add(f"https://{HOST}/parrainage")
    urls.add(f"https://{HOST}/hall-des-constellations")
    urls.add(f"https://{HOST}/blog")
    urls.add(f"https://{HOST}/notre-histoire")
    urls.add(f"https://{HOST}/precision")
    urls.add(f"https://{HOST}/glossaire")
    urls.add(f"https://{HOST}/cgv")
    urls.add(f"https://{HOST}/mentions-legales")
    urls.add(f"https://{HOST}/politique-confidentialite")

    # Individual outils
    for tool in TOOLS:
        urls.add(f"https://{HOST}/outils/{tool}")

    # Individual horoscope signs
    for sign in SIGNS:
        urls.add(f"https://{HOST}/horoscope/{sign}")

    # === Per locale ===
    for lang in LOCALES:
        urls.add(f"https://{HOST}/{lang}")
        urls.add(f"https://{HOST}/{lang}/horoscope")
        urls.add(f"https://{HOST}/{lang}/outils")
        urls.add(f"https://{HOST}/{lang}/parrainage")

    return sorted(urls)


def submit_batch(urls: list[str]) -> None:
    """Submit a batch of URLs to IndexNow (max 10,000 per request)."""
    if not urls:
        return

    payload = {
        "host": HOST,
        "key": INDEXNOW_KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls,
    }

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={
            "Content-Type": "application/json; charset=utf-8",
            "User-Agent": "Karmastro-IndexNow/1.0",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            print(f"✓ HTTP {status} — {len(urls)} URLs submitted")
            if body:
                print(f"  Response: {body[:300]}")
    except urllib.error.HTTPError as e:
        status = e.code
        body = e.read().decode("utf-8")
        # IndexNow returns : 200 OK, 202 Accepted, 400/403/422/429 errors
        if status in (200, 202):
            print(f"✓ HTTP {status} — {len(urls)} URLs accepted")
        else:
            print(f"✗ HTTP {status}: {body[:500]}")
            # Don't raise - we want to continue with other batches
    except Exception as e:
        print(f"✗ Exception: {e}")


def main() -> int:
    parser = argparse.ArgumentParser(description="Submit Karmastro URLs to IndexNow")
    parser.add_argument("--url", help="Submit a single URL instead of all")
    parser.add_argument("--list-only", action="store_true", help="Just list URLs, don't submit")
    args = parser.parse_args()

    if args.url:
        urls = [args.url]
    else:
        urls = build_url_list()

    print(f"Karmastro IndexNow submitter")
    print(f"Key: {INDEXNOW_KEY}")
    print(f"KeyLocation: {KEY_LOCATION}")
    print(f"Total URLs: {len(urls)}")
    print()

    if args.list_only:
        for u in urls:
            print(f"  {u}")
        return 0

    # Submit in batches of 500 (API allows up to 10K per request but smaller batches are safer)
    BATCH_SIZE = 500
    for i in range(0, len(urls), BATCH_SIZE):
        batch = urls[i : i + BATCH_SIZE]
        print(f"Batch {i // BATCH_SIZE + 1} ({len(batch)} URLs)...")
        submit_batch(batch)

    print()
    print("Done. IndexNow notifies Bing, Yandex, Seznam, DuckDuckGo instantly.")
    print("Google does NOT support IndexNow (use Google Search Console separately).")
    return 0


if __name__ == "__main__":
    sys.exit(main())

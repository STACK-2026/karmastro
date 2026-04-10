#!/usr/bin/env python3
"""
Push all horoscope multilingual URLs to IndexNow for immediate crawl.
Submits 132 URLs (12 signs × 11 languages).
"""
import urllib.request
import json
import sys

INDEXNOW_KEY = "fb25c2eab5eb5d21087553dc56d0a1db"
SITE = "karmastro.com"

LOCALES = ["fr", "en", "es", "pt", "de", "it", "tr", "pl", "ru", "ja", "ar"]
SIGNS = ["belier", "taureau", "gemeaux", "cancer", "lion", "vierge", "balance", "scorpion", "sagittaire", "capricorne", "verseau", "poissons"]

urls = []
for lang in LOCALES:
    prefix = "" if lang == "fr" else f"/{lang}"
    for sign in SIGNS:
        urls.append(f"https://{SITE}{prefix}/horoscope/{sign}/")
    urls.append(f"https://{SITE}{prefix}/horoscope/")

# Also add blog index + 2 published articles
urls.append(f"https://{SITE}/blog/")
urls.append(f"https://{SITE}/blog/qu-numerologie-guide-complet-debuter/")
urls.append(f"https://{SITE}/blog/comment-calculer-chemin-de-vie-numerologie/")

payload = {
    "host": SITE,
    "key": INDEXNOW_KEY,
    "keyLocation": f"https://{SITE}/{INDEXNOW_KEY}.txt",
    "urlList": urls,
}

req = urllib.request.Request(
    "https://api.indexnow.org/IndexNow",
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
    method="POST",
)
try:
    with urllib.request.urlopen(req, timeout=30) as resp:
        print(f"IndexNow API: HTTP {resp.status}")
        print(f"Submitted {len(urls)} URLs")
        print(f"First 3: {urls[:3]}")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)

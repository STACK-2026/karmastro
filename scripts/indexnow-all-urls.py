#!/usr/bin/env python3
"""
Push ALL karmastro.com URLs to IndexNow.
Reads the Astro sitemap-index.xml and submits every URL found.
"""
import urllib.request
import urllib.error
import json
import re
import sys

INDEXNOW_KEY = "fb25c2eab5eb5d21087553dc56d0a1db"
SITE = "karmastro.com"
SITEMAP_INDEX = f"https://{SITE}/sitemap-index.xml"
BATCH_SIZE = 10000  # IndexNow max per request


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "karmastro-indexnow/1.0"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read().decode()


def extract_urls(xml: str) -> list[str]:
    return re.findall(r"<loc>([^<]+)</loc>", xml)


def main() -> int:
    print(f"Fetching sitemap index: {SITEMAP_INDEX}")
    try:
        idx = fetch(SITEMAP_INDEX)
    except urllib.error.HTTPError as e:
        print(f"Error fetching index: {e}")
        return 1

    sitemaps = extract_urls(idx)
    print(f"Found {len(sitemaps)} sitemap files")

    all_urls: set[str] = set()
    for sm in sitemaps:
        try:
            xml = fetch(sm)
            urls = extract_urls(xml)
            all_urls.update(urls)
            print(f"  {sm}: {len(urls)} URLs")
        except Exception as e:
            print(f"  {sm}: error {e}")

    all_urls_list = sorted(all_urls)
    print(f"\nTotal unique URLs: {len(all_urls_list)}")

    # Submit in batches
    total_submitted = 0
    for i in range(0, len(all_urls_list), BATCH_SIZE):
        batch = all_urls_list[i : i + BATCH_SIZE]
        payload = {
            "host": SITE,
            "key": INDEXNOW_KEY,
            "keyLocation": f"https://{SITE}/{INDEXNOW_KEY}.txt",
            "urlList": batch,
        }
        req = urllib.request.Request(
            "https://api.indexnow.org/IndexNow",
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                print(f"Batch {i // BATCH_SIZE + 1}: HTTP {resp.status} ({len(batch)} URLs)")
                total_submitted += len(batch)
        except urllib.error.HTTPError as e:
            print(f"Batch {i // BATCH_SIZE + 1}: HTTP {e.code} {e.reason}")
            print(f"  Body: {e.read()[:500]}")

    print(f"\nSubmitted {total_submitted}/{len(all_urls_list)} URLs to IndexNow")
    return 0


if __name__ == "__main__":
    sys.exit(main())

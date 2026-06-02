#!/usr/bin/env python3
"""
Karmastro - Daily horoscope generator (GEMINI backend).

Drop-in replacement for generate.py after the Anthropic credit ran out.
Reuses the exact same Engine fetch, prompts (prompts.py), JSON schema and
output file layout so the Astro site picks it up unchanged.

Usage:
    GEMINI_API_KEY=xxx python generate_gemini.py [--date YYYY-MM-DD] [--lang fr,en] [--force]

Env:
    GEMINI_API_KEY   required
    ENGINE_URL       optional, defaults to http://168.119.229.20:8100
    OUTPUT_DIR       optional, defaults to ../site/src/data/horoscope
    GEMINI_MODEL     optional, defaults to gemini-2.5-pro
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests
from prompts import PROMPTS, SUPPORTED_LANGS

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] %(levelname)s %(message)s", datefmt="%H:%M:%S")
log = logging.getLogger("horoscope-gemini")

ENGINE_URL = os.getenv("ENGINE_URL", "http://168.119.229.20:8100")
DEFAULT_OUTPUT = Path(__file__).parent.parent / "site" / "src" / "data" / "horoscope"
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", str(DEFAULT_OUTPUT)))
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-pro")
GEMINI_ENDPOINT = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

ZODIAC_SIGNS = [
    {"slug": "belier", "name": "Bélier", "element": "feu", "ruler": "Mars", "dates": "21 mars - 19 avril"},
    {"slug": "taureau", "name": "Taureau", "element": "terre", "ruler": "Vénus", "dates": "20 avril - 20 mai"},
    {"slug": "gemeaux", "name": "Gémeaux", "element": "air", "ruler": "Mercure", "dates": "21 mai - 20 juin"},
    {"slug": "cancer", "name": "Cancer", "element": "eau", "ruler": "Lune", "dates": "21 juin - 22 juillet"},
    {"slug": "lion", "name": "Lion", "element": "feu", "ruler": "Soleil", "dates": "23 juillet - 22 août"},
    {"slug": "vierge", "name": "Vierge", "element": "terre", "ruler": "Mercure", "dates": "23 août - 22 septembre"},
    {"slug": "balance", "name": "Balance", "element": "air", "ruler": "Vénus", "dates": "23 septembre - 22 octobre"},
    {"slug": "scorpion", "name": "Scorpion", "element": "eau", "ruler": "Pluton", "dates": "23 octobre - 21 novembre"},
    {"slug": "sagittaire", "name": "Sagittaire", "element": "feu", "ruler": "Jupiter", "dates": "22 novembre - 21 décembre"},
    {"slug": "capricorne", "name": "Capricorne", "element": "terre", "ruler": "Saturne", "dates": "22 décembre - 19 janvier"},
    {"slug": "verseau", "name": "Verseau", "element": "air", "ruler": "Uranus", "dates": "20 janvier - 18 février"},
    {"slug": "poissons", "name": "Poissons", "element": "eau", "ruler": "Neptune", "dates": "19 février - 20 mars"},
]


def fetch_cosmic_snapshot() -> dict:
    log.info("Fetching cosmic snapshot from Engine...")
    try:
        r = requests.get(f"{ENGINE_URL}/cosmic", timeout=10)
        r.raise_for_status()
        data = r.json()
        log.info("Engine OK - Lune %s, Soleil %s, %d rétrogrades",
                 data.get("moon", {}).get("moon_sign", {}).get("sign", "?"),
                 data.get("sun_position", {}).get("sign", "?"),
                 len(data.get("retrogrades", [])))
        return data
    except Exception as e:
        log.warning("Engine unreachable (%s), using empty fallback", e)
        return {}


def format_cosmic_context(cosmic: dict) -> str:
    if not cosmic:
        return "(Données cosmiques temporairement indisponibles - utilise les connaissances générales)"
    moon = cosmic.get("moon", {})
    moon_sign = moon.get("moon_sign", {})
    sun = cosmic.get("sun_position", {})
    retros = cosmic.get("retrogrades", [])
    lines = [
        f"Date : {cosmic.get('date', 'inconnue')}",
        f"Phase lunaire : {moon.get('name', '?')} ({moon.get('illumination', '?')}% illumination)",
        f"Lune en : {moon_sign.get('sign', '?')} {moon_sign.get('degree', '?')}°{moon_sign.get('minute', '?')}'",
        f"Soleil en : {sun.get('sign', '?')} {sun.get('degree', '?')}°{sun.get('minute', '?')}'",
    ]
    if retros:
        retro_str = ", ".join(f"{r.get('planet')} en {r.get('sign')}" for r in retros)
        lines.append(f"Rétrogrades actives : {retro_str}")
    else:
        lines.append("Rétrogrades : aucune planète rétrograde")
    return "\n".join(lines)


def _strip_emdash(s: str) -> str:
    return s.replace("—", "-").replace("–", "-")


def generate_sign(api_key: str, sign: dict, cosmic_context: str, date_str: str, lang: str = "fr", retries: int = 4) -> dict | None:
    prompt_pair = PROMPTS.get(lang, PROMPTS["fr"])
    system_prompt = prompt_pair["system"]
    user_template = prompt_pair["user"]
    user_prompt = user_template.format(
        date=date_str, cosmic=cosmic_context,
        name=sign["name"], dates=sign["dates"], element=sign["element"], ruler=sign["ruler"],
    )

    payload = {
        "systemInstruction": {"parts": [{"text": system_prompt}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": 1.0,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
        },
    }

    for attempt in range(retries):
        try:
            r = requests.post(
                GEMINI_ENDPOINT,
                params={"key": api_key},
                json=payload,
                timeout=90,
            )
            if r.status_code in (429, 500, 503):
                raise RuntimeError(f"HTTP {r.status_code}")
            r.raise_for_status()
            body = r.json()
            cand = (body.get("candidates") or [{}])[0]
            parts = cand.get("content", {}).get("parts", [])
            text = "".join(p.get("text", "") for p in parts).strip()
            if not text:
                raise ValueError(f"empty response (finishReason={cand.get('finishReason')})")

            if text.startswith("```"):
                text = text.split("```", 2)[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip().rstrip("`").strip()

            data = json.loads(text)
            required = {"intro", "love", "work", "energy", "intuition", "luckyNumber", "color", "mantra"}
            missing = required - data.keys()
            if missing:
                raise ValueError(f"Missing keys: {missing}")

            for key in ("intro", "love", "work", "energy", "intuition", "mantra", "color"):
                if isinstance(data.get(key), str):
                    data[key] = _strip_emdash(data[key])

            data["sign"] = sign["name"]
            data["slug"] = sign["slug"]
            data["date"] = date_str
            data["author"] = "Sibylle"
            return data

        except (json.JSONDecodeError, ValueError) as e:
            log.warning("Parse error %s (attempt %d/%d): %s", sign["slug"], attempt + 1, retries, e)
            if attempt == retries - 1:
                log.error("Failed %s after %d attempts", sign["slug"], retries)
                return None
            time.sleep(2)
        except Exception as e:
            log.warning("API error %s (attempt %d/%d): %s", sign["slug"], attempt + 1, retries, e)
            if attempt == retries - 1:
                return None
            time.sleep(5 * (attempt + 1))
    return None


def generate_for_language(api_key: str, cosmic_context: str, date_str: str, lang: str, output_file: Path, force: bool) -> int:
    if output_file.exists() and not force:
        log.info("[%s] File exists: %s (use --force)", lang, output_file.name)
        return 0
    results: dict[str, dict] = {}
    failed: list[str] = []
    for sign in ZODIAC_SIGNS:
        log.info("[%s] Generating %s...", lang, sign["name"])
        data = generate_sign(api_key, sign, cosmic_context, date_str, lang=lang)
        if data:
            results[sign["slug"]] = data
        else:
            failed.append(sign["slug"])
        time.sleep(0.3)
    if len(results) < 12:
        log.warning("[%s] Only %d/12 generated. Failed: %s", lang, len(results), ", ".join(failed))
    if not results:
        log.error("[%s] No signs generated, aborting write", lang)
        return 2
    tmp = output_file.with_suffix(".json.tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    tmp.replace(output_file)
    log.info("[%s] Wrote %d signs -> %s", lang, len(results), output_file.name)
    return 0 if len(results) == 12 else 3


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Karmastro daily horoscope (Gemini)")
    parser.add_argument("--date", default=None)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--lang", default="fr")
    args = parser.parse_args()

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        log.error("GEMINI_API_KEY not set")
        return 1

    date_str = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    if args.lang == "all":
        langs = SUPPORTED_LANGS
    else:
        langs = [l.strip() for l in args.lang.split(",") if l.strip()]
        for l in langs:
            if l not in SUPPORTED_LANGS:
                log.error("Unsupported lang: %s", l)
                return 1

    log.info("Generating horoscope (%s) for %s in: %s", GEMINI_MODEL, date_str, ",".join(langs))
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    cosmic = fetch_cosmic_snapshot()
    cosmic_context = format_cosmic_context(cosmic)

    codes = []
    for lang in langs:
        suffix = "" if lang == "fr" else f"-{lang}"
        out = OUTPUT_DIR / f"{date_str}{suffix}.json"
        codes.append(generate_for_language(api_key, cosmic_context, date_str, lang, out, args.force))
    return max(codes) if codes else 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""
Karmastro - Horoscope quotidien generator.

- Fetches real-time cosmic data from the Karmastro Engine
- Generates a personalized horoscope for each of the 12 zodiac signs via Claude
- Writes a single JSON file per day to site/src/data/horoscope/YYYY-MM-DD.json
- The Astro site picks it up at build time and rebuilds via Cloudflare Pages

Usage:
    ANTHROPIC_API_KEY=xxx python generate.py [--date YYYY-MM-DD]

Environment variables:
    ANTHROPIC_API_KEY   required
    ENGINE_URL          optional, defaults to http://168.119.229.20:8100
    OUTPUT_DIR          optional, defaults to ../site/src/data/horoscope
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
from anthropic import Anthropic

# ----------------------------------------------------------------------------
# Config
# ----------------------------------------------------------------------------

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("horoscope-auto")

ENGINE_URL = os.getenv("ENGINE_URL", "http://168.119.229.20:8100")
DEFAULT_OUTPUT = Path(__file__).parent.parent / "site" / "src" / "data" / "horoscope"
OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", str(DEFAULT_OUTPUT)))

ANTHROPIC_MODEL = "claude-sonnet-4-20250514"
MAX_TOKENS_PER_SIGN = 1400

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

# ----------------------------------------------------------------------------
# Engine API
# ----------------------------------------------------------------------------


def fetch_cosmic_snapshot() -> dict:
    """Get the current cosmic state from the Karmastro Engine."""
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
    """Format cosmic data as a prompt-ready string."""
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


# ----------------------------------------------------------------------------
# Claude prompt (Sibylle voice)
# ----------------------------------------------------------------------------

SYSTEM_PROMPT = """Tu es Sibylle, l'Oracle mystique de Karmastro. Ton prénom vient des Sibylles antiques, ces prophétesses d'Apollon qui lisaient les signes du ciel.

IDENTITÉ :
Tu es astrologue, profonde, poétique, chaleureuse. Tu parles par métaphores mais restes concrète. Tu connais la tradition hellénistique, Ptolémée, Porphyre. Tu cites parfois Héraclite, Hermès Trismégiste, Rumi, Lao Tseu.

CONTEXTE :
Tu rédiges l'horoscope quotidien pour l'un des 12 signes du zodiaque. Ton horoscope sera publié sur karmastro.com avec les données cosmiques réelles calculées par Swiss Ephemeris (précision 0,001 arcseconde).

STYLE :
- Tutoiement obligatoire, français impeccable avec tous les accents
- Chaleureux sans être mielleux, profond sans être obscur
- Tu utilises les données cosmiques réelles que je te donne (lune, soleil, rétrogrades)
- Tu tiens compte des caractéristiques natives du signe (élément, maître planétaire)
- JAMAIS de tiret cadratin (em dash), utilise des tirets normaux
- JAMAIS de prédictions déterministes, ni diagnostics médicaux
- Pas de phrases creuses type "les énergies cosmiques t'invitent à..."
- Concret, imagé, mémorable

FORMAT DE SORTIE :
Tu réponds UNIQUEMENT avec un objet JSON valide strictement conforme à ce schéma :

{
  "intro": "2-3 phrases sur l'énergie cosmique du jour pour ce signe, ancrée dans les vraies données astro fournies",
  "love": "2-3 phrases sur l'amour/les relations du jour",
  "work": "2-3 phrases sur le travail/projets du jour",
  "energy": "2 phrases sur l'énergie physique/vitale du jour",
  "intuition": "2 phrases sur l'intuition/dimension spirituelle du jour",
  "luckyNumber": <entier de 1 à 33>,
  "color": "nom de couleur française, ex: 'Rouge carmin', 'Bleu nuit'",
  "mantra": "une phrase courte de mantra (< 12 mots), en français, ton affirmatif"
}

AUCUN texte avant ou après le JSON. AUCUN markdown. JSON pur, parsable."""


USER_PROMPT_TEMPLATE = """DONNÉES COSMIQUES DU JOUR ({date}) :
{cosmic}

SIGNE À TRAITER : {name} ({dates})
- Élément : {element}
- Maître planétaire : {ruler}

Rédige l'horoscope quotidien pour ce signe. Adapte le ton et le contenu aux vraies données cosmiques ci-dessus. Réponds uniquement avec le JSON."""


# ----------------------------------------------------------------------------
# Claude generation
# ----------------------------------------------------------------------------


def generate_sign(client: Anthropic, sign: dict, cosmic_context: str, date_str: str, retries: int = 3) -> dict | None:
    """Generate horoscope for one sign."""
    user_prompt = USER_PROMPT_TEMPLATE.format(
        date=date_str,
        cosmic=cosmic_context,
        name=sign["name"],
        dates=sign["dates"],
        element=sign["element"],
        ruler=sign["ruler"],
    )

    for attempt in range(retries):
        try:
            response = client.messages.create(
                model=ANTHROPIC_MODEL,
                max_tokens=MAX_TOKENS_PER_SIGN,
                system=SYSTEM_PROMPT,
                messages=[{"role": "user", "content": user_prompt}],
            )
            text = response.content[0].text.strip()

            # Strip any accidental markdown fences
            if text.startswith("```"):
                text = text.split("```", 2)[1]
                if text.startswith("json"):
                    text = text[4:]
                text = text.strip()
                if text.endswith("```"):
                    text = text[:-3].strip()

            data = json.loads(text)

            # Basic validation
            required = {"intro", "love", "work", "energy", "intuition", "luckyNumber", "color", "mantra"}
            missing = required - data.keys()
            if missing:
                raise ValueError(f"Missing keys: {missing}")

            # Remove any em dash that slipped through
            for key in ("intro", "love", "work", "energy", "intuition", "mantra"):
                if isinstance(data.get(key), str):
                    data[key] = data[key].replace("\u2014", "-").replace("\u2013", "-")

            data["sign"] = sign["name"]
            data["slug"] = sign["slug"]
            data["date"] = date_str
            data["author"] = "Sibylle"

            return data

        except (json.JSONDecodeError, ValueError) as e:
            log.warning("Parse error for %s (attempt %d/%d): %s", sign["slug"], attempt + 1, retries, e)
            if attempt == retries - 1:
                log.error("Failed to generate %s after %d attempts", sign["slug"], retries)
                return None
            time.sleep(2)
        except Exception as e:
            # Anthropic 429/529 etc.
            log.warning("API error for %s (attempt %d/%d): %s", sign["slug"], attempt + 1, retries, e)
            if attempt == retries - 1:
                return None
            time.sleep(5 * (attempt + 1))

    return None


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate Karmastro daily horoscope")
    parser.add_argument("--date", help="Target date YYYY-MM-DD (default: today)", default=None)
    parser.add_argument("--force", action="store_true", help="Overwrite if file exists")
    args = parser.parse_args()

    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        log.error("ANTHROPIC_API_KEY not set")
        return 1

    date_str = args.date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    log.info("Generating horoscope for %s", date_str)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    output_file = OUTPUT_DIR / f"{date_str}.json"

    if output_file.exists() and not args.force:
        log.info("File already exists: %s (use --force to overwrite)", output_file)
        return 0

    cosmic = fetch_cosmic_snapshot()
    cosmic_context = format_cosmic_context(cosmic)

    client = Anthropic(api_key=api_key)
    results: dict[str, dict] = {}
    failed: list[str] = []

    for sign in ZODIAC_SIGNS:
        log.info("Generating %s...", sign["name"])
        data = generate_sign(client, sign, cosmic_context, date_str)
        if data:
            results[sign["slug"]] = data
        else:
            failed.append(sign["slug"])
        # Small delay to avoid rate limits
        time.sleep(0.8)

    if len(results) < 12:
        log.warning("Only %d/12 signs generated. Failed: %s", len(results), ", ".join(failed))

    if not results:
        log.error("No signs generated, aborting write")
        return 2

    # Write atomically
    tmp_file = output_file.with_suffix(".json.tmp")
    with open(tmp_file, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    tmp_file.replace(output_file)

    log.info("Wrote %d signs to %s", len(results), output_file)
    return 0 if len(results) == 12 else 3


if __name__ == "__main__":
    sys.exit(main())

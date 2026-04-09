#!/usr/bin/env python3
"""
Generate articles.json — Genere 100 sujets d'articles SEO via Claude API.

Usage:
  python generate_articles_json.py

Prerequis:
  - ANTHROPIC_API_KEY dans .env
  - Remplir SITE_CONTEXT ci-dessous avec les infos du projet
"""

import json
import os
import sys
from pathlib import Path

import requests
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
ARTICLES_FILE = Path(__file__).parent / "articles.json"

# ============================================
# A REMPLIR POUR CHAQUE PROJET
# ============================================
SITE_CONTEXT = """
Nom du projet : [NOM]
Secteur : [SECTEUR]
Description : [DESCRIPTION]
Mots-cles principaux : [MOT1, MOT2, MOT3, MOT4, MOT5]
Categories de blog : [CAT1, CAT2, CAT3]
Cible : [AUDIENCE CIBLE]
Langue : francais
"""


def generate_topics():
    """Call Claude to generate 100 article topics."""
    if not ANTHROPIC_API_KEY:
        print("Erreur: ANTHROPIC_API_KEY manquant dans .env")
        sys.exit(1)

    prompt = f"""Tu es un expert SEO francais. Genere exactement 100 sujets d'articles de blog SEO pour le projet suivant :

{SITE_CONTEXT}

Pour chaque article, donne :
- title : titre SEO accrocheur (< 70 caracteres)
- keywords : 3-5 mots-cles separes par des virgules
- category : une des categories listees
- blog : "principal" (ou le handle du blog si multi-blog)

Regles :
- Varie les intentions de recherche : informationnelle, transactionnelle, comparatif, guide, liste
- Inclus des articles locaux si pertinent (villes francaises)
- Inclus des articles "prix", "comparatif", "avis", "guide complet", "top N"
- Couvre tout le spectre des mots-cles du secteur
- JAMAIS de doublon de sujet
- Titres en francais avec accents corrects

Reponds UNIQUEMENT avec un JSON array valide, sans commentaire :
[
  {{"title": "...", "keywords": "...", "category": "...", "blog": "principal"}},
  ...
]
"""

    print("Generation de 100 sujets via Claude API...")
    response = requests.post(
        "https://api.anthropic.com/v1/messages",
        headers={
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
        },
        json={
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 16000,
            "messages": [{"role": "user", "content": prompt}],
        },
        timeout=300,
    )
    response.raise_for_status()

    text = response.json()["content"][0]["text"]

    # Extract JSON from response
    start = text.find("[")
    end = text.rfind("]") + 1
    if start == -1 or end == 0:
        print("Erreur: pas de JSON valide dans la reponse")
        print(text[:500])
        sys.exit(1)

    articles = json.loads(text[start:end])

    # Add metadata fields
    for i, article in enumerate(articles):
        article["index"] = i + 1
        article["published"] = False
        article["published_at"] = None
        article["slug"] = None
        article["scheduled_date"] = None
        article["scheduled_time"] = None
        article["scheduled_datetime"] = None
        article["title_tag"] = None
        article["meta_description"] = None
        article["featured_image_url"] = None

    # Save
    with open(ARTICLES_FILE, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    print(f"OK — {len(articles)} articles generes dans {ARTICLES_FILE}")
    print(f"\nProchaine etape : python scheduler.py")


if __name__ == "__main__":
    generate_topics()

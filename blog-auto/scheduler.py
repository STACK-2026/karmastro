#!/usr/bin/env python3
"""
Scheduler — Genere les dates/heures de publication dans articles.json

Regles :
- 30 premiers articles : 1/jour, lundi-vendredi, heure random 7h35-10h17
- 70 suivants : 1 tous les 2 jours, lundi-samedi, semaines alternees

Usage:
  python scheduler.py                # Genere les dates pour tous les articles non planifies
  python scheduler.py --regenerate   # Regenere toutes les dates
"""

import json
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path


ARTICLES_FILE = Path(__file__).parent / "articles.json"

# Publication window (Paris time)
HOUR_MIN = 7
MINUTE_MIN = 35
HOUR_MAX = 10
MINUTE_MAX = 17


def random_time() -> str:
    """Generate random time between 7h35 and 10h17."""
    total_min_start = HOUR_MIN * 60 + MINUTE_MIN  # 455
    total_min_end = HOUR_MAX * 60 + MINUTE_MAX    # 617
    total = random.randint(total_min_start, total_min_end)
    h = total // 60
    m = total % 60
    return f"{h:02d}:{m:02d}"


def next_weekday(d: datetime, weekdays: list[int]) -> datetime:
    """Find the next date that falls on one of the given weekdays (0=Monday)."""
    while d.weekday() not in weekdays:
        d += timedelta(days=1)
    return d


def schedule_articles(articles: list[dict], regenerate: bool = False) -> list[dict]:
    """Assign scheduled_date and scheduled_time to articles."""
    # Start from tomorrow
    start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    current_date = start

    for i, article in enumerate(articles):
        if not regenerate and article.get("scheduled_datetime"):
            continue

        if i < 30:
            # Phase 1: 1/day, Mon-Fri
            current_date = next_weekday(current_date, [0, 1, 2, 3, 4])
        else:
            # Phase 2: every 2 days, Mon-Sat, alternating weeks
            current_date += timedelta(days=1)
            current_date = next_weekday(current_date, [0, 1, 2, 3, 4, 5])
            # Skip a day for the "every 2 days" pattern
            if i > 30:
                current_date += timedelta(days=1)
                current_date = next_weekday(current_date, [0, 1, 2, 3, 4, 5])

        time_str = random_time()
        date_str = current_date.strftime("%Y-%m-%d")

        article["scheduled_date"] = date_str
        article["scheduled_time"] = time_str
        article["scheduled_datetime"] = f"{date_str}T{time_str}:00"
        article["index"] = i + 1

        # Move to next day for next article
        current_date += timedelta(days=1)

    return articles


def main():
    regenerate = "--regenerate" in sys.argv

    with open(ARTICLES_FILE, "r", encoding="utf-8") as f:
        articles = json.load(f)

    articles = schedule_articles(articles, regenerate=regenerate)

    with open(ARTICLES_FILE, "w", encoding="utf-8") as f:
        json.dump(articles, f, indent=2, ensure_ascii=False)

    scheduled = sum(1 for a in articles if a.get("scheduled_datetime"))
    print(f"Planification terminee : {scheduled}/{len(articles)} articles planifies")

    # Show next 5
    upcoming = [a for a in articles if not a.get("published") and a.get("scheduled_datetime")][:5]
    if upcoming:
        print("\nProchains articles :")
        for a in upcoming:
            print(f"  {a['scheduled_datetime']} — {a['title'][:60]}")


if __name__ == "__main__":
    main()

#!/usr/bin/env bash
# Backfill 30 days of horoscope in FR only (past archives)
# Non-FR langs get the FR fallback since they're historical.
# Running: ~30 × 3min = 90 min total

set -e
cd "$(dirname "$0")"
source .venv/bin/activate

# ANTHROPIC_API_KEY must be exported before running this script
if [ -z "$ANTHROPIC_API_KEY" ]; then
  echo "ERROR: ANTHROPIC_API_KEY not set" >&2
  exit 1
fi

# Start from 9 April (avant le lancement) and go back to 11 March (30 days)
# Skip dates that already exist
for i in $(seq 2 30); do
  d=$(python3 -c "from datetime import date, timedelta; print((date(2026, 4, 11) - timedelta(days=$i)).strftime('%Y-%m-%d'))")
  if [ -f "../site/src/data/horoscope/${d}.json" ]; then
    echo "[skip] $d already exists"
    continue
  fi
  echo "[gen] $d"
  python generate.py --date "$d" --lang fr 2>&1 | grep -E "(ERROR|Wrote)" || true
done

echo "=== DONE ==="
ls ../site/src/data/horoscope/ | sort

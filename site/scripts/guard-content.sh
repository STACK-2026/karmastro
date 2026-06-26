#!/usr/bin/env bash
# guard-content.sh — STACK-2026 blocking content gate, run as a prebuild step.
#
# Runs scripts/content_guard.py --check on the .md/.mdx files touched by the
# LAST commit (git diff HEAD~1 HEAD). If git is unavailable or no content file
# changed in that commit, it falls back to a full scan of the content dir.
# Cleanly skips (exit 0) if python3 is not installed, so a build host without
# python is never blocked.
#
# This is intentionally a thin wrapper so package.json stays portable.
set -u

# repo-root-relative; this script lives in <npm-cwd>/scripts/
HERE="$(cd "$(dirname "$0")" && pwd)"
GUARD="$HERE/content_guard.py"
ROOT="$(cd "$HERE/.." && pwd)"

# content dir for THIS repo (commandeici: only the blog collection has the

CONTENT_REL="src/content"
CONTENT_DIR="$ROOT/$CONTENT_REL"

if ! command -v python3 >/dev/null 2>&1; then
  echo "guard:content -> python3 not found, skipping (non-blocking)"
  exit 0
fi
if [ ! -f "$GUARD" ]; then
  echo "guard:content -> content_guard.py missing, skipping (non-blocking)"
  exit 0
fi

# Re-accent ASCII-folded FR files before the blocking --check, when a Gemini key
# is available. content_guard.py flags ACCENT_LOW but cannot fix it; reaccent_gemini.py
# (stdlib + Gemini REST, no pip deps) restores diacritics so a freshly-published
# unaccented FR article self-heals at build instead of blocking the deploy.
reaccent_low() {
  if [ -n "${GEMINI_API_KEY:-}" ]; then
    RX="$HOME/stack-2026/scripts/reaccent_gemini.py"
    if [ -f "$RX" ]; then
      BAD=$( ( cd "$ROOT" && python3 "$GUARD" --check "$@" ) 2>&1 | awk '/^\[FAIL\] /{f=$2} /ACCENT_LOW/{if(f)print f}' | sort -u || true )
      if [ -n "$BAD" ]; then
        echo "guard:content -> re-accenting ASCII-folded FR: $BAD"
        for f in $BAD; do
          ff="$f"; [ -f "$ff" ] || ff="$ROOT/$f"
          if [ -f "$ff" ]; then python3 "$RX" "$ff" || true; fi
        done
      fi
    fi
  fi
  return 0
}

# rel path of content dir from repo root, for filtering git diff output
REL_CONTENT="${CONTENT_DIR#$ROOT/}"

CHANGED=""
if git -C "$ROOT" rev-parse HEAD~1 >/dev/null 2>&1; then
  CHANGED="$(git -C "$ROOT" diff --name-only --diff-filter=ACMR HEAD~1 HEAD -- "$REL_CONTENT" \
    | grep -E '\.(md|mdx)$' || true)"
fi

if [ -n "$CHANGED" ]; then
  echo "guard:content -> checking $(echo "$CHANGED" | wc -l | tr -d ' ') file(s) from last commit"
  # shellcheck disable=SC2086
  reaccent_low $CHANGED
  # shellcheck disable=SC2046
  ( cd "$ROOT" && python3 "$GUARD" --check --strict-images $CHANGED )
else
  echo "guard:content -> no changed content file in last commit, full scan of $REL_CONTENT"
  reaccent_low "$CONTENT_DIR"
  python3 "$GUARD" --check "$CONTENT_DIR"
fi

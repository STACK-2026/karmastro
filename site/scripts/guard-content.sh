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

# rel path of content dir from repo root, for filtering git diff output
REL_CONTENT="${CONTENT_DIR#$ROOT/}"

CHANGED=""
if git -C "$ROOT" rev-parse HEAD~1 >/dev/null 2>&1; then
  CHANGED="$(git -C "$ROOT" diff --name-only --diff-filter=ACMR HEAD~1 HEAD -- "$REL_CONTENT" \
    | grep -E '\.(md|mdx)$' || true)"
fi

if [ -n "$CHANGED" ]; then
  echo "guard:content -> checking $(echo "$CHANGED" | wc -l | tr -d ' ') file(s) from last commit"
  # shellcheck disable=SC2046
  ( cd "$ROOT" && python3 "$GUARD" --check $CHANGED )
else
  echo "guard:content -> no changed content file in last commit, full scan of $REL_CONTENT"
  python3 "$GUARD" --check "$CONTENT_DIR"
fi

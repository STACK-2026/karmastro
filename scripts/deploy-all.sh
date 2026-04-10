#!/usr/bin/env bash
# Script de déploiement automatique pour Karmastro
# Usage : SUPABASE_ACCESS_TOKEN=sbp_xxx ./scripts/deploy-all.sh
#
# Génère un token frais sur https://supabase.com/dashboard/account/tokens
# Déploie :
#   - Migration SQL (les 3 tables analytics + save_natal_chart)
#   - Edge functions get-natal-chart + oracle-chat (recharge pour mise à jour)

set -e

PROJECT_REF="nkjbmbdrvejemzrggxvr"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../app" && pwd)"

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ SUPABASE_ACCESS_TOKEN non défini"
  echo ""
  echo "Usage :"
  echo "  1. Créer un fresh token : https://supabase.com/dashboard/account/tokens"
  echo "  2. Run : SUPABASE_ACCESS_TOKEN=sbp_xxx $0"
  exit 1
fi

export SUPABASE_ACCESS_TOKEN

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  KARMASTRO DEPLOY"
echo "  Project : $PROJECT_REF"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo

# Vérif CLI dispo (via npx pour pas dépendre du brew)
SUPABASE="npx --yes supabase@latest"

echo "▶ Test token Supabase..."
$SUPABASE projects list >/dev/null 2>&1 || { echo "❌ Token invalide ou expiré"; exit 1; }
echo "  ✓ Token valide"
echo

# ─── 1. DB push (migrations) ───────────────────────────
cd "$APP_DIR"

echo "▶ Link projet Supabase..."
$SUPABASE link --project-ref "$PROJECT_REF" 2>&1 | tail -3 || true
echo

echo "▶ Push migrations SQL..."
$SUPABASE db push 2>&1 | tail -20
echo

# ─── 2. Deploy edge functions ──────────────────────────
echo "▶ Deploy edge function : get-natal-chart"
$SUPABASE functions deploy get-natal-chart --no-verify-jwt 2>&1 | tail -5
echo

echo "▶ Deploy edge function : oracle-chat (update)"
$SUPABASE functions deploy oracle-chat --no-verify-jwt 2>&1 | tail -5
echo

# ─── 3. Audit final ────────────────────────────────────
echo "▶ Audit final..."
ANON="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ramJtYmRydmVqZW16cmdneHZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU3NzE1MjUsImV4cCI6MjA5MTM0NzUyNX0.KYc8rXIC0RPMskW6eJIE_EranUcLK6nckCAWEph-340"

for t in page_views analytics_events user_attribution; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://$PROJECT_REF.supabase.co/rest/v1/$t?limit=1" -H "apikey: $ANON" -H "Authorization: Bearer $ANON")
  [ "$code" = "200" ] && echo "  ✓ table $t" || echo "  ✗ table $t (HTTP $code)"
done

for fn in get-natal-chart oracle-chat; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://$PROJECT_REF.supabase.co/functions/v1/$fn" -H "Authorization: Bearer $ANON" -X POST -d '{}' --max-time 10)
  # 401/400 = function exists and responded, 404 = not deployed
  if [ "$code" = "404" ]; then
    echo "  ✗ edge $fn (not deployed)"
  else
    echo "  ✓ edge $fn (HTTP $code — deployed)"
  fi
done

echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DEPLOY DONE ✨"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

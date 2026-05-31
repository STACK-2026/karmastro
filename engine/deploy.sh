#!/usr/bin/env bash
# Déploie / redéploie le moteur Karmastro (FastAPI + Swiss Ephemeris) sur le serveur Hetzner.
# Incident 31/05/2026 : container disparu après reset du serveur + ufw bloquait 8100
#   → l'Oracle servait en mode "degraded" (pas de transits/lune temps réel).
# Le moteur n'a PAS d'auth (compute astro read-only, public par design pour Supabase Edge).
#
# Accès : clé SSH dédiée ~/.ssh/hetzner_copybot (root). Le code source = ce dossier.
# Usage : ./deploy.sh
set -euo pipefail

HOST="root@168.119.229.20"
KEY="$HOME/.ssh/hetzner_copybot"
DIR="/opt/karmastro-engine"
SSH="ssh -i $KEY -o BatchMode=yes"

cd "$(dirname "$0")"
echo "→ Copie du code vers $HOST:$DIR"
$SSH "$HOST" "mkdir -p $DIR"
scp -i "$KEY" -o BatchMode=yes main.py astrology.py numerology.py requirements.txt Dockerfile "$HOST:$DIR/"

echo "→ Build + run (restart unless-stopped) + ouverture ufw 8100"
$SSH "$HOST" "
  set -e
  cd $DIR
  docker build -t karmastro-engine .
  docker rm -f karmastro-engine 2>/dev/null || true
  docker run -d --name karmastro-engine --restart unless-stopped -p 8100:8100 karmastro-engine
  ufw allow 8100/tcp >/dev/null 2>&1 || true
  sleep 4
  curl -s -m 5 http://127.0.0.1:8100/health
"
echo
echo "→ Vérif externe /cosmic :"
curl -s -m 10 "http://168.119.229.20:8100/cosmic" -w "\nHTTP %{http_code}\n" | head -c 200
echo
echo "OK. L'Oracle (oracle-chat) repassera engine_status=ok automatiquement."

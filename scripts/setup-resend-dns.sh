#!/usr/bin/env bash
# Setup Resend DNS records on karmastro.com via Cloudflare API
#
# Prerequisites :
# - Sign up at https://resend.com, add the domain karmastro.com
# - Resend will give you DNS records to add (SPF, DKIM, DMARC)
# - Run this script with those values as arguments
#
# Usage :
#   ./setup-resend-dns.sh \
#     --dkim-name "resend._domainkey" \
#     --dkim-value "p=MIGfMA0GCSqGSIb3DQEBAQUA..." \
#     --dmarc "v=DMARC1; p=none;"
#
# Or interactively : just run it and paste the values when prompted.

set -euo pipefail

# Cloudflare credentials (from ~/stack-2026/.env.master)
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-cfat_jsNuPerpvfPhZ44GiIX1cwSwgaEXAVpiisEuyscB133d30bc}"
ZONE_ID="ce734296ae8a9f121a928ce929903f37"  # karmastro.com zone ID (from memory)

CF_API="https://api.cloudflare.com/client/v4"

# Parse args
DKIM_NAME=""
DKIM_VALUE=""
DMARC_VALUE="v=DMARC1; p=none; rua=mailto:contact@karmastro.com"
SPF_VALUE="v=spf1 include:amazonses.com include:_spf.mx.cloudflare.net ~all"

while [[ $# -gt 0 ]]; do
  case $1 in
    --dkim-name) DKIM_NAME="$2"; shift 2 ;;
    --dkim-value) DKIM_VALUE="$2"; shift 2 ;;
    --dmarc) DMARC_VALUE="$2"; shift 2 ;;
    --spf) SPF_VALUE="$2"; shift 2 ;;
    *) echo "Unknown arg: $1"; exit 1 ;;
  esac
done

# Interactive mode if no DKIM provided
if [[ -z "$DKIM_NAME" ]]; then
  echo "=== Resend DNS setup pour karmastro.com ==="
  echo ""
  echo "Étape 1 : Va sur https://resend.com/domains, ajoute karmastro.com"
  echo "Résultat : Resend te donne des records DNS à ajouter (SPF, DKIM, DMARC)"
  echo ""
  read -p "DKIM record name (ex: resend._domainkey) : " DKIM_NAME
  echo "DKIM record value (le long TXT record p=...) : "
  read DKIM_VALUE
  read -p "DMARC value [default: $DMARC_VALUE] : " DMARC_INPUT
  DMARC_VALUE="${DMARC_INPUT:-$DMARC_VALUE}"
fi

if [[ -z "$DKIM_NAME" || -z "$DKIM_VALUE" ]]; then
  echo "ERROR: DKIM name + value required"
  exit 1
fi

# Function to create a TXT record
create_txt_record() {
  local name="$1"
  local content="$2"
  local comment="$3"

  echo "→ Création $comment (TXT $name)..."

  # Check if record already exists
  existing=$(curl -s "$CF_API/zones/$ZONE_ID/dns_records?type=TXT&name=$name.karmastro.com" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")

  existing_id=$(echo "$existing" | python3 -c "
import json, sys
d = json.load(sys.stdin)
if d.get('success') and d.get('result'):
    print(d['result'][0].get('id', ''))
")

  if [[ -n "$existing_id" ]]; then
    echo "  Record existe déjà (id: $existing_id), mise à jour..."
    curl -s -X PUT "$CF_API/zones/$ZONE_ID/dns_records/$existing_id" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"type\":\"TXT\",\"name\":\"$name\",\"content\":\"$content\",\"ttl\":3600,\"comment\":\"$comment\"}" \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ✓' if d.get('success') else '  ✗ ' + str(d.get('errors', [])))"
  else
    curl -s -X POST "$CF_API/zones/$ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      -d "{\"type\":\"TXT\",\"name\":\"$name\",\"content\":\"$content\",\"ttl\":3600,\"comment\":\"$comment\"}" \
      | python3 -c "import json,sys; d=json.load(sys.stdin); print('  ✓ créé' if d.get('success') else '  ✗ ' + str(d.get('errors', [])))"
  fi
}

echo ""
echo "=== Ajout des records DNS ==="

# SPF (on the root @) - check existing first
echo "→ Vérification SPF existant sur @..."
existing_spf=$(curl -s "$CF_API/zones/$ZONE_ID/dns_records?type=TXT&name=karmastro.com" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
has_spf=$(echo "$existing_spf" | python3 -c "
import json, sys
d = json.load(sys.stdin)
spf = [r for r in d.get('result', []) if 'v=spf1' in r.get('content', '')]
print('yes' if spf else 'no')
")
if [[ "$has_spf" == "no" ]]; then
  create_txt_record "@" "$SPF_VALUE" "Resend SPF"
else
  echo "  SPF déjà présent sur @. À mettre à jour manuellement si nécessaire pour inclure Resend."
fi

# DKIM
create_txt_record "$DKIM_NAME" "$DKIM_VALUE" "Resend DKIM"

# DMARC
create_txt_record "_dmarc" "$DMARC_VALUE" "DMARC policy"

echo ""
echo "=== Terminé ==="
echo ""
echo "Étape 2 : Retourne sur https://resend.com/domains et clique 'Verify DNS'"
echo "La propagation DNS peut prendre 5-10 minutes."
echo ""
echo "Étape 3 : Une fois vérifié, crée une API key sur https://resend.com/api-keys"
echo "Étape 4 : Stocke la clé dans Supabase :"
echo ""
echo "  curl -X POST https://api.supabase.com/v1/projects/nkjbmbdrvejemzrggxvr/secrets \\"
echo "    -H 'Authorization: Bearer sbp_2f9589f9cc9261ede0ea8184861753c4e720643e' \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '[{\"name\": \"RESEND_API_KEY\", \"value\": \"re_XXXXXXXX\"}]'"
echo ""

#!/usr/bin/env bash
# Configure les enregistrements DNS Resend de karmastro.com via Cloudflare.
#
# Usage :
#   CLOUDFLARE_API_TOKEN=... ./scripts/setup-resend-dns.sh \
#     --dkim-name "resend._domainkey" \
#     --dkim-value "p=MIGfMA0GCSqGSIb3DQEBAQUA..." \
#     --dmarc "v=DMARC1; p=none;"

set -euo pipefail

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" && -f "$HOME/stack-2026/.env.master" ]]; then
  set -a
  # shellcheck disable=SC1091
  source "$HOME/stack-2026/.env.master"
  set +a
fi

: "${CLOUDFLARE_API_TOKEN:?CLOUDFLARE_API_TOKEN est requis}"

ZONE_ID="${CLOUDFLARE_KARMASTRO_ZONE_ID:-ce734296ae8a9f121a928ce929903f37}"
CF_API="https://api.cloudflare.com/client/v4"
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
    *) printf 'Argument inconnu : %s\n' "$1"; exit 1 ;;
  esac
done

if [[ -z "$DKIM_NAME" ]]; then
  printf '=== Configuration DNS Resend pour karmastro.com ===\n\n'
  printf 'Ajoute karmastro.com dans Resend, puis colle les valeurs DNS demandées.\n\n'
  read -r -p "Nom DKIM (ex: resend._domainkey) : " DKIM_NAME
  read -r -p "Valeur DKIM : " DKIM_VALUE
  read -r -p "Valeur DMARC [$DMARC_VALUE] : " DMARC_INPUT
  DMARC_VALUE="${DMARC_INPUT:-$DMARC_VALUE}"
fi

if [[ -z "$DKIM_NAME" || -z "$DKIM_VALUE" ]]; then
  printf 'ERREUR : nom et valeur DKIM requis.\n'
  exit 1
fi

create_txt_record() {
  local name="$1"
  local content="$2"
  local comment="$3"
  local existing existing_id payload

  printf 'Création %s (TXT %s)...\n' "$comment" "$name"
  existing=$(curl -fsS "$CF_API/zones/$ZONE_ID/dns_records?type=TXT&name=$name.karmastro.com" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json")
  existing_id=$(printf '%s' "$existing" | jq -r '.result[0].id // empty')
  payload=$(jq -nc \
    --arg name "$name" \
    --arg content "$content" \
    --arg comment "$comment" \
    '{type:"TXT",name:$name,content:$content,ttl:3600,comment:$comment}')

  if [[ -n "$existing_id" ]]; then
    curl -fsS -X PUT "$CF_API/zones/$ZONE_ID/dns_records/$existing_id" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$payload" | jq -e '.success == true' >/dev/null
    printf '  mis à jour.\n'
  else
    curl -fsS -X POST "$CF_API/zones/$ZONE_ID/dns_records" \
      -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
      -H "Content-Type: application/json" \
      --data "$payload" | jq -e '.success == true' >/dev/null
    printf '  créé.\n'
  fi
}

printf 'Vérification du SPF racine...\n'
existing_spf=$(curl -fsS "$CF_API/zones/$ZONE_ID/dns_records?type=TXT&name=karmastro.com" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
has_spf=$(printf '%s' "$existing_spf" | jq -r '[.result[] | select(.content | contains("v=spf1"))] | length')
if [[ "$has_spf" = "0" ]]; then
  create_txt_record "@" "$SPF_VALUE" "Resend SPF"
else
  printf '  SPF déjà présent ; vérifie manuellement qu’il inclut Resend.\n'
fi

create_txt_record "$DKIM_NAME" "$DKIM_VALUE" "Resend DKIM"
create_txt_record "_dmarc" "$DMARC_VALUE" "DMARC policy"

printf '\nConfiguration terminée. Vérifie maintenant le domaine dans Resend.\n'
printf 'Stocke ensuite la clé sans la mettre dans Git :\n'
printf '  supabase secrets set RESEND_API_KEY=re_xxx --project-ref nkjbmbdrvejemzrggxvr\n'

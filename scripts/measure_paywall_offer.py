#!/usr/bin/env python3
"""Baseline + re-mesure du paywall-offer karmastro.

Succes = SIGNAL (willingness-to-pay) + CONTACT (emails a nourrir vers Etoile), PAS euros.
A 47 hits/14j x ~4,90 EUR, le one-shot ne remplit pas la caisse : sa valeur est le signal
et le contact. Ne PAS lire "quelques ventes" comme un echec.

Usage: python3 scripts/measure_paywall_offer.py [DAYS]
"""
import json
import subprocess
import sys
import urllib.request

REF = "nkjbmbdrvejemzrggxvr"
PAT = subprocess.check_output(
    ["bash", "-lc", "grep -E '^SUPABASE_PAT=' ~/stack-2026/.env.master | cut -d= -f2-"]
).decode().strip()


def q(sql):
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {PAT}",
            "Content-Type": "application/json",
            "User-Agent": "karmastro-measure/1.0",
        },
    )
    with urllib.request.urlopen(req) as r:
        return json.load(r)


DAYS = sys.argv[1] if len(sys.argv) > 1 else "14"

funnel = q(f"""
select event_name, count(*) n, count(distinct session_id) sessions
from analytics_events
where created_at > now() - interval '{DAYS} days'
  and event_name in ('paywall_viewed','paywall_offer_view','paywall_offer_date_entered',
                     'paywall_offer_checkout_click','paywall_email_captured','paywall_etoile_click')
group by event_name order by n desc;
""")

signal = q("""
select (select count(*) from readings where tool_type='chemin-de-vie') as chemin_readings_total,
       (select count(*) from stripe_events) as stripe_events_total,
       (select count(*) filter (where confirmed) from newsletter_subscribers) as contacts_confirmes;
""")

print(f"=== FUNNEL PAYWALL-OFFER ({DAYS}j) — SIGNAL ===")
print(json.dumps(funnel, indent=1, ensure_ascii=False))
print("=== CONTACT + SIGNAL DUR (tout l'historique) ===")
print(json.dumps(signal, indent=1, ensure_ascii=False))
print()
print("Lecture : offer_view -> checkout_click -> readings chemin-de-vie = signal WTP.")
print("          email_captured + contacts_confirmes = contact a nourrir vers Etoile.")
print("Ne PAS conclure sur la variable moment (test confondu : surface + execution changees).")

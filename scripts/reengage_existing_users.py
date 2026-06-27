#!/usr/bin/env python3
"""reengage_existing_users.py - invitation unique opt-in horoscope quotidien
aux comptes karmastro existants (rétention).

Cible : les comptes (auth.users + profiles) avec email + birth_date qui ne sont
PAS deja abonnes confirmes a la newsletter. Pour chacun :
  1. cree une ligne newsletter_subscribers (confirmed=false, token) via RPC,
     source='reengage_2026-06' (idempotent : skip si la ligne existe deja),
  2. envoie un email perso (signe calcule) : CTA "reprends l'Oracle" + lien
     une-clic "active mon horoscope quotidien" (confirme l'opt-in).

RGPD : double opt-in conserve (le compte clique pour confirmer). Envoi unique
(tag source). FROM = sous-domaine verifie Resend.

Usage :
  python3 reengage_existing_users.py            # DRY-RUN (n'envoie rien)
  python3 reengage_existing_users.py --send      # envoi reel
"""
import sys
import json
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path.home() / "stack-2026" / "scripts" / "intel"))
from _common import mgmt_query, ENV  # noqa: E402

REF = "nkjbmbdrvejemzrggxvr"
SOURCE = "reengage_2026-06"
SITE = "https://karmastro.com"
FROM_EMAIL = "Karmastro <oracle@mail.karmastro.com>"
RESEND_API_KEY = ENV.get("RESEND_API_KEY")
ORACLE_Q = "Que me réservent les astres aujourd'hui ?"

# Signes tropicaux (slug FR, comme le reste de karmastro).
SIGNS = [
    ("capricorne", "Capricorne", (12, 22), (1, 19)),
    ("verseau", "Verseau", (1, 20), (2, 18)),
    ("poissons", "Poissons", (2, 19), (3, 20)),
    ("belier", "Bélier", (3, 21), (4, 19)),
    ("taureau", "Taureau", (4, 20), (5, 20)),
    ("gemeaux", "Gémeaux", (5, 21), (6, 20)),
    ("cancer", "Cancer", (6, 21), (7, 22)),
    ("lion", "Lion", (7, 23), (8, 22)),
    ("vierge", "Vierge", (8, 23), (9, 22)),
    ("balance", "Balance", (9, 23), (10, 22)),
    ("scorpion", "Scorpion", (10, 23), (11, 21)),
    ("sagittaire", "Sagittaire", (11, 22), (12, 21)),
]


def sign_from_date(birth_date: str):
    """birth_date 'YYYY-MM-DD' -> (slug, nom). None si illisible."""
    try:
        parts = birth_date.strip().split("-")
        m, d = int(parts[1]), int(parts[2])
    except Exception:
        return None
    for slug, name, (sm, sd), (em, ed) in SIGNS:
        if sm <= em:  # plage dans la meme annee
            if (m == sm and d >= sd) or (m == em and d <= ed) or (sm < m < em):
                return slug, name
        else:  # capricorne (chevauche dec->jan)
            if (m == sm and d >= sd) or (m == em and d <= ed) or m > sm or m < em:
                return slug, name
    return None


def html_email(first_name, sign_name, confirm_url, unsub_url, oracle_url):
    hello = f"{first_name}, " if first_name else ""
    return f"""<!DOCTYPE html><html lang="fr"><body style="margin:0;background:#0f0a1e;font-family:Figtree,Helvetica,Arial,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:rgba(15,10,30,0.9);border:1px solid rgba(212,160,23,0.25);border-radius:16px;overflow:hidden;">
<tr><td style="padding:40px 40px 8px;text-align:center;">
<p style="margin:0;font-size:42px;">✦</p>
<h1 style="margin:12px 0 4px;font-family:Outfit,Georgia,serif;font-size:24px;color:#fbbf24;font-weight:600;">Tes astres t'attendent, {sign_name}</h1>
</td></tr>
<tr><td style="padding:8px 40px 24px;">
<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.85);">{hello}tu as découvert ton thème sur Karmastro. Les planètes, elles, n'arrêtent jamais de bouger : chaque matin, ta journée s'écrit différemment dans le ciel.</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.85);">Reçois ton horoscope personnalisé chaque matin, et reprends ta conversation avec l'Oracle quand tu veux.</p>
<div style="text-align:center;margin:24px 0 8px;">
<a href="{confirm_url}" style="display:inline-block;padding:13px 30px;background:linear-gradient(135deg,#a78bfa 0%,#fbbf24 100%);color:#0f0a1e;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;">Activer mon horoscope quotidien ✨</a>
</div>
<div style="text-align:center;margin:10px 0 8px;">
<a href="{oracle_url}" style="display:inline-block;padding:11px 26px;background:transparent;border:1px solid rgba(251,191,36,0.5);color:#fbbf24;text-decoration:none;border-radius:10px;font-weight:600;font-size:13px;">Reprendre avec l'Oracle ✦</a>
</div>
</td></tr>
<tr><td style="padding:20px 40px 32px;border-top:1px solid rgba(255,255,255,0.08);text-align:center;">
<p style="margin:0;font-size:10px;color:rgba(196,184,219,0.35);">
<a href="{unsub_url}" style="color:rgba(196,184,219,0.45);text-decoration:underline;">Ne plus recevoir</a> &middot;
<a href="{SITE}" style="color:rgba(196,184,219,0.45);text-decoration:none;">karmastro.com</a></p>
</td></tr>
</table></td></tr></table></body></html>"""


def resend_send(to_email, subject, html):
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=json.dumps({"from": FROM_EMAIL, "to": [to_email], "subject": subject, "html": html}).encode(),
        headers={"Authorization": f"Bearer {RESEND_API_KEY}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read().decode())


def main():
    send = "--send" in sys.argv
    rows = mgmt_query(REF, """
        SELECT u.email, p.first_name, p.birth_date
        FROM auth.users u JOIN profiles p ON p.user_id = u.id
        WHERE u.email IS NOT NULL AND p.birth_date IS NOT NULL
          AND lower(u.email) NOT IN (SELECT lower(email) FROM newsletter_subscribers WHERE confirmed)
          AND lower(u.email) NOT IN (SELECT lower(email) FROM newsletter_subscribers WHERE source = '%s')
        ORDER BY u.email;
    """ % SOURCE)
    print(f"{'[DRY-RUN] ' if not send else ''}{len(rows)} destinataire(s)\n")
    sent = skipped = failed = 0
    for r in rows:
        email = r["email"]
        sig = sign_from_date(r.get("birth_date") or "")
        if not sig:
            print(f"  skip {email}: birth_date illisible ({r.get('birth_date')})")
            skipped += 1
            continue
        slug, name = sig
        if not send:
            print(f"  WOULD SEND -> {email} ({name})")
            continue
        # 1. creer la ligne opt-in (token) via RPC
        mgmt_query(REF, "SELECT newsletter_subscribe(%s,'fr',%s,%s);" % (
            "'" + email.replace("'", "''") + "'", "'" + slug + "'", "'" + SOURCE + "'"))
        tok = mgmt_query(REF, "SELECT confirmation_token, unsubscribe_token FROM newsletter_subscribers WHERE lower(email)=lower('%s') ORDER BY created_at DESC LIMIT 1;" % email.replace("'", "''"))
        if not tok or not tok[0].get("confirmation_token"):
            print(f"  FAIL {email}: pas de token")
            failed += 1
            continue
        confirm_url = f"{SITE}/newsletter/confirm?token={tok[0]['confirmation_token']}"
        unsub_url = f"{SITE}/newsletter/unsubscribe?token={tok[0]['unsubscribe_token']}"
        oracle_url = f"{SITE}/oracle/?q=" + urllib.parse.quote(ORACLE_Q)
        html = html_email(r.get("first_name") or "", name, confirm_url, unsub_url, oracle_url)
        try:
            resend_send(email, f"{name}, tes astres t'attendent chaque matin ✦", html)
            print(f"  SENT -> {email} ({name})")
            sent += 1
        except Exception as e:
            print(f"  FAIL {email}: {str(e)[:120]}")
            failed += 1
    print(f"\nsent={sent} skipped={skipped} failed={failed}")


if __name__ == "__main__":
    import urllib.parse  # noqa: E402
    main()

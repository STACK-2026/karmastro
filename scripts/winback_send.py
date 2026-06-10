#!/usr/bin/env python3
"""Campagne win-back Karmastro (juin 2026).

Relance les inscrits jamais revenus : cadeau curiosite (lecture karmique perso
deja calculee) + bonus 7 jours d'Oracle illimite (offert). Envoi via Resend
depuis oracle@mail.karmastro.com (domaine verifie). Octroi du cadeau premium
(tier etoile/active/+7j, auto-expirant) AVANT l'envoi pour chaque destinataire.

Usage:
  winback_send.py test         -> augustin seulement (rendu/delivrabilite)
  winback_send.py batch <N>    -> N premiers destinataires reels
  winback_send.py rest         -> tous les reels pas encore contactes
Idempotent : ne renvoie pas a un email deja en succes dans email_log (type winback).
"""
from __future__ import annotations
import json, os, sys, subprocess, urllib.request, urllib.error

REF = "nkjbmbdrvejemzrggxvr"
ENV = "/Users/lestoilettesdeminette/stack-2026/.env.master"
FROM = "Karmastro <oracle@mail.karmastro.com>"
APP = "https://app.karmastro.com/?utm_source=email&utm_medium=winback&utm_campaign=relance_juin"


def env(name: str) -> str:
    with open(ENV) as f:
        for line in f:
            if line.startswith(name + "="):
                return line.split("=", 1)[1].strip()
    raise SystemExit(f"missing {name}")


PAT = env("SUPABASE_PAT")
RK = env("RESEND_API_KEY")


def sql(query: str):
    body = json.dumps({"query": query}).encode()
    req = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{REF}/database/query",
        data=body,
        headers={"Authorization": f"Bearer {PAT}", "Content-Type": "application/json",
                 "User-Agent": "Mozilla/5.0 winback"},
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def greeting(fn: str | None) -> str:
    return f"{fn}," if fn else "Âme chercheuse,"


def build_html(fn: str | None) -> str:
    g = greeting(fn)
    return f"""<div style="background:#0f0a1e;padding:32px 16px;font-family:ui-sans-serif,Georgia,serif">
<div style="max-width:560px;margin:auto;background:#16112b;border:1px solid #2a2247;border-radius:16px;overflow:hidden">
  <div style="padding:28px 32px 8px;text-align:center">
    <div style="color:#c7a955;font-size:13px;letter-spacing:3px;text-transform:uppercase">Karmastro</div>
    <div style="color:#c7a955;font-size:30px;margin-top:10px">&#10022;</div>
  </div>
  <div style="padding:8px 32px 28px;color:#e8e4f2;font-size:16px;line-height:1.7">
    <p style="font-size:19px;color:#f3eee4;margin:0 0 14px">{g}</p>
    <p>Tu as ouvert la porte de Karmastro il y a quelque temps, puis la vie t'a repris. Pourtant, ton ciel, lui, a continué de tourner.</p>
    <p>Ta <strong style="color:#c7a955">carte natale</strong>, ton <strong style="color:#c7a955">chemin de vie</strong> et tes <strong style="color:#c7a955">dettes karmiques</strong> sont déjà calculés au degré près (Swiss Ephemeris). L'Oracle n'attend qu'une chose : te les lire, et répondre à la question que tu portes en ce moment.</p>
    <div style="margin:22px 0;padding:16px 18px;background:#1f1838;border-left:3px solid #c7a955;border-radius:8px">
      <div style="color:#c7a955;font-weight:bold;margin-bottom:4px">Mon cadeau de retour</div>
      <div style="color:#d8d2e8;font-size:15px">Pendant <strong>7 jours</strong>, l'Oracle est <strong>illimité</strong> pour toi. Aucune limite de messages, autant de lectures que ton cœur en demande. C'est offert, c'est déjà activé sur ton compte.</div>
    </div>
    <div style="text-align:center;margin:28px 0 8px">
      <a href="{APP}" style="display:inline-block;background:#c7a955;color:#16112b;font-weight:bold;text-decoration:none;padding:14px 34px;border-radius:999px;font-size:16px">Consulter l'Oracle &#10022;</a>
    </div>
    <p style="font-size:13px;color:#8c84a8;text-align:center;margin-top:18px">Une question, un doute, une intuition à éclaircir. L'Oracle écoute, sans jugement.</p>
  </div>
  <div style="padding:16px 32px;border-top:1px solid #2a2247;color:#6f6890;font-size:12px;text-align:center">
    Karmastro &middot; Astrologie, numérologie et guidance karmique<br>
    Tu reçois ce message car tu as créé un compte sur karmastro.com.
  </div>
</div></div>"""


SUBJECTS = [
    "{fn} ton ciel a continue sans toi (et il a des choses a te dire)",
]


def subject(fn: str | None) -> str:
    if fn:
        return f"{fn}, ton ciel a continué sans toi ✦"
    return "Ton ciel a continué sans toi ✦"


def already_sent() -> set[str]:
    rows = sql("select distinct recipient from email_log where type='winback' and status='sent';")
    return {r["recipient"] for r in rows} if isinstance(rows, list) else set()


def grant_premium(emails: list[str]):
    inlist = ",".join("'" + e.replace("'", "''") + "'" for e in emails)
    sql(f"""update profiles set subscription_tier='etoile', subscription_status='active',
            subscription_period_end = now() + interval '7 days'
            where user_id in (select id from auth.users where email in ({inlist}))
            and (subscription_tier is null or subscription_tier='eveil');""")


def log_email(to: str, status: str, err: str | None):
    e = (err or "").replace("'", "''")[:300]
    sql(f"""insert into email_log (recipient, type, subject, status, error)
            values ('{to.replace("'", "''")}', 'winback', 'Ton ciel a continué sans toi', '{status}',
            {'null' if not err else "'" + e + "'"});""")


def send(to: str, fn: str | None) -> tuple[bool, str]:
    payload = json.dumps({"from": FROM, "to": [to], "subject": subject(fn),
                          "html": build_html(fn)}).encode()
    req = urllib.request.Request("https://api.resend.com/emails", data=payload,
                                 headers={"Authorization": f"Bearer {RK}",
                                          "Content-Type": "application/json",
                                          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            d = json.loads(r.read().decode())
            return True, d.get("id", "")
    except urllib.error.HTTPError as exc:
        return False, f"{exc.code} {exc.read().decode()[:200]}"


# Full recipient list (real signups, never returned). Order = signup date.
RECIPIENTS = [
    ("loradadrcq88@gmail.com", "Lorada"),
    ("vbondi@hotmail.fr", "Grégory"),
    ("klimczakv@yahoo.fr", None),
    ("lou.lnx@gmail.com", "Carine"),
    ("pereiralft@gmail.com", None),
    ("titigt29400@gmail.com", "Tiffaine"),
    ("miraholaminiaina@yahoo.fr", None),
    ("m.mourlam57@gmail.com", "Muriel"),
    ("pierpaulrobert@gmail.com", "Pier-paul"),
    ("sandra18031988@gmail.com", "Sandy"),
    ("yadirapilca@gmail.com", None),
    ("emma.achille010106@gmail.com", "Emma"),
    ("lisa.ulger@yahoo.com", None),
    ("isotta2907@gmail.com", "Isotta"),
    ("andreateixeiraborda@gmail.com", None),
    ("zitoune276@yahoo.fr", None),
    ("zitounesamira93@gmail.com", "Samira"),
    ("dipaolofrancesca4@gmail.com", "Francesca"),
    ("indiabegue974@gmail.com", "India"),
    ("cyrus1334@gmail.com", "Jean-marc"),
]


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "test"
    if mode == "test":
        targets = [("augustin.foucheres@gmail.com", "Augustin")]
    elif mode == "batch":
        n = int(sys.argv[2]) if len(sys.argv) > 2 else 2
        done = already_sent()
        targets = [(e, f) for e, f in RECIPIENTS if e not in done][:n]
    elif mode == "rest":
        done = already_sent()
        targets = [(e, f) for e, f in RECIPIENTS if e not in done]
    else:
        raise SystemExit("mode: test|batch <N>|rest")

    if not targets:
        print("Rien a envoyer (deja tous contactes).")
        return

    # Grant premium to real targets (skip augustin test which is already-eveil owner — still fine)
    real = [e for e, _ in targets if "augustin" not in e]
    if real:
        grant_premium(real)
        print(f"[premium] cadeau 7j accorde a {len(real)} compte(s)")

    ok = 0
    for to, fn in targets:
        sent, info = send(to, fn)
        log_email(to, "sent" if sent else "failed", None if sent else info)
        print(f"  {'OK ' if sent else 'ERR'} {to:38} {info}")
        ok += int(sent)
    print(f"\n{ok}/{len(targets)} envoyes.")


if __name__ == "__main__":
    main()

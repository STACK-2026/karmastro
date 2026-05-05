#!/usr/bin/env python3
"""Alerte daily si le nombre de ratings 1/3 sur l'oracle dépasse un seuil.

Query Supabase pour les `oracle_feedback` des dernières 24h, filtre les
rating=1, récupère les transcripts des conversations concernées, envoie un
email Resend à l'équipe. Non-bloquant : sort en 0 si le seuil n'est pas
atteint pour éviter un échec GitHub Actions inutile.

Env vars attendues (GH secrets) :
  SUPABASE_KARMASTRO_URL          -> https://<ref>.supabase.co
  SUPABASE_KARMASTRO_SERVICE_KEY  -> service_role JWT
  RESEND_API_KEY                  -> clé compte partagé stack-2026
  ORACLE_ALERT_TO                 -> augustin.foucheres@gmail.com (défaut)
  ORACLE_ALERT_FROM               -> "Karmastro Alerts <alerts@mail.karmastro.com>"
  ORACLE_ALERT_THRESHOLD          -> 3 (défaut)
"""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone

DEFAULT_THRESHOLD = 3
DEFAULT_TO = "augustin.foucheres@gmail.com"
DEFAULT_FROM = "Karmastro Alerts <alerts@mail.karmastro.com>"


def env(name: str, default: str | None = None) -> str:
    val = os.environ.get(name, default)
    if val is None:
        print(f"[oracle-alert] missing env {name}", file=sys.stderr)
        sys.exit(1)
    return val


def sb_get(path: str, service_key: str, supabase_url: str) -> list[dict]:
    url = f"{supabase_url.rstrip('/')}/rest/v1/{path}"
    req = urllib.request.Request(
        url,
        headers={
            "apikey": service_key,
            "Authorization": f"Bearer {service_key}",
            "Accept": "application/json",
            "User-Agent": "karmastro-oracle-alert/1.0",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return json.loads(resp.read().decode("utf-8"))


def send_email(api_key: str, frm: str, to: str, subject: str, html: str) -> None:
    body = json.dumps({"from": frm, "to": to, "subject": subject, "html": html}).encode()
    req = urllib.request.Request(
        "https://api.resend.com/emails",
        data=body,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "karmastro-oracle-alert/1.0",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            resp.read()
    except urllib.error.HTTPError as exc:
        print(f"[oracle-alert] resend error: {exc.code} {exc.read()!r}", file=sys.stderr)
        raise


def fmt_conversation(messages: list[dict]) -> str:
    parts = []
    for m in messages[-10:]:
        role = m.get("role", "?")
        content = (m.get("content") or "").replace("\n", "<br>")[:800]
        color = "#c7a955" if role == "assistant" else "#93c5fd"
        parts.append(
            f'<div style="margin:8px 0;padding:8px 10px;border-left:2px solid {color};background:#0f0a1e;color:#eee">'
            f'<strong style="color:{color}">{role}</strong><br>{content}'
            f'</div>'
        )
    return "".join(parts)


def main() -> int:
    threshold = int(os.environ.get("ORACLE_ALERT_THRESHOLD", str(DEFAULT_THRESHOLD)))
    alert_to = os.environ.get("ORACLE_ALERT_TO", DEFAULT_TO)
    alert_from = os.environ.get("ORACLE_ALERT_FROM", DEFAULT_FROM)

    supabase_url = env("SUPABASE_KARMASTRO_URL")
    service_key = env("SUPABASE_KARMASTRO_SERVICE_KEY")
    resend_key = env("RESEND_API_KEY")

    since = (datetime.now(timezone.utc) - timedelta(hours=24)).isoformat()
    base_select = "id,guide,rating,text,user_message,assistant_message,created_at"
    try:
        feedbacks = sb_get(
            f"oracle_feedback?rating=eq.1&created_at=gte.{since}&select={base_select},conversation_id:oracle_messages!inner(conversation_id)&order=created_at.desc",
            service_key,
            supabase_url,
        )
    except urllib.error.HTTPError as exc:
        # PostgREST returns 400 if the embedded join target doesn't exist; fall back without it.
        print(f"[oracle-alert] embed join unavailable ({exc.code}), querying without join", file=sys.stderr)
        feedbacks = []
    if not feedbacks:
        feedbacks = sb_get(
            f"oracle_feedback?rating=eq.1&created_at=gte.{since}&select={base_select}&order=created_at.desc",
            service_key,
            supabase_url,
        )

    count = len(feedbacks)
    print(f"[oracle-alert] {count} rating 1 in last 24h (threshold {threshold})")
    if count < threshold:
        return 0

    cards = []
    for f in feedbacks:
        guide = f.get("guide", "?")
        created = f.get("created_at", "")
        user_msg = (f.get("user_message") or "").replace("\n", "<br>")[:500]
        ass_msg = (f.get("assistant_message") or "").replace("\n", "<br>")[:1500]
        comment = (f.get("text") or "").replace("\n", "<br>")[:500]
        cards.append(
            f'<div style="margin:14px 0;padding:12px;border:1px solid #333;border-radius:8px;background:#1a1530;color:#e5e5e5">'
            f'<div style="font-size:11px;color:#888;margin-bottom:6px">{created} · guide <strong style="color:#c7a955">{guide}</strong></div>'
            f'<div style="margin-bottom:8px"><strong style="color:#93c5fd">User :</strong><br>{user_msg}</div>'
            f'<div style="margin-bottom:8px"><strong style="color:#c7a955">Oracle :</strong><br>{ass_msg}</div>'
            + (f'<div style="margin-top:8px;padding-top:8px;border-top:1px dashed #555"><strong style="color:#f87171">Commentaire user :</strong><br>{comment}</div>' if comment else '')
            + '</div>'
        )

    html = (
        f'<div style="font-family:ui-sans-serif,system-ui;color:#e5e5e5;background:#0f0a1e;padding:24px;max-width:720px;margin:auto">'
        f'<h2 style="color:#c7a955;margin:0 0 8px">⚠ Oracle Karmastro : {count} retours négatifs en 24h</h2>'
        f'<p style="color:#ccc;font-size:14px">Seuil alerte : {threshold}. Check the transcripts below and adjust the guide prompt if a pattern emerges.</p>'
        + "".join(cards) +
        f'<p style="color:#888;font-size:12px;margin-top:24px">Admin dashboard : <a style="color:#c7a955" href="https://app.karmastro.com/admin">app.karmastro.com/admin</a></p>'
        f'</div>'
    )

    subject = f"[Karmastro] Oracle : {count} ratings négatifs en 24h"
    send_email(resend_key, alert_from, alert_to, subject, html)
    print("[oracle-alert] email sent")
    return 0


if __name__ == "__main__":
    sys.exit(main())

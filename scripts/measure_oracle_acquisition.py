#!/usr/bin/env python3
"""Measure the public tools -> Oracle acquisition funnel without exposing PII.

The report only prints aggregate counts. Event windows are explicitly bounded
so an event is never interpreted before its production introduction date.

Usage:
  python3 scripts/measure_oracle_acquisition.py [YYYY-MM-DD]
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import sys
import urllib.request


PROJECT_REF = "nkjbmbdrvejemzrggxvr"
DEFAULT_START = "2026-07-19"
FRENCH_TOOLS = (
    "annee-personnelle",
    "ascendant",
    "chemin-de-vie",
    "compatibilite",
    "dette-karmique",
    "nombre-expression",
    "synastrie",
    "theme-natal",
    "transits",
)
EVENTS = (
    "tool_calculated",
    "oracle_cta_view",
    "oracle_cta_click",
    "oracle_entry_viewed",
    "oracle_first_question_submitted",
    "oracle_first_response",
    "oracle_acquisition_cta_viewed_v1",
    "oracle_acquisition_cta_clicked_v1",
    "oracle_entry_viewed_v2",
    "oracle_first_question_submitted_v1",
    "oracle_first_response_delivered_v1",
)


def load_pat() -> str:
    token = os.environ.get("SUPABASE_PAT", "").strip()
    if token:
        return token

    env_file = Path.home() / "stack-2026" / ".env.master"
    for line in env_file.read_text(encoding="utf-8").splitlines():
        if line.startswith("SUPABASE_PAT="):
            return line.split("=", 1)[1].strip().strip("\"'")
    raise RuntimeError("SUPABASE_PAT is missing")


def query(sql: str) -> list[dict[str, object]]:
    request = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {load_pat()}",
            "Content-Type": "application/json",
            "User-Agent": "karmastro-oracle-acquisition-measure/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.load(response)


def validate_start(value: str) -> str:
    if len(value) != 10 or value[4] != "-" or value[7] != "-":
        raise SystemExit("Start date must use YYYY-MM-DD")
    parts = value.split("-")
    if not all(part.isdigit() for part in parts):
        raise SystemExit("Start date must use YYYY-MM-DD")
    return value


start = validate_start(sys.argv[1] if len(sys.argv) > 1 else DEFAULT_START)
event_names = ", ".join(f"'{name}'" for name in EVENTS)
tool_names = ", ".join(f"'{name}'" for name in FRENCH_TOOLS)

coverage = query(
    f"""
    select event_name,
           min(created_at)::date as first_seen,
           max(created_at)::date as last_seen,
           count(*)::int as events,
           count(distinct session_id)::int as sessions
    from analytics_events
    where event_name in ({event_names})
    group by event_name
    order by event_name;
    """
)

tool_funnel = query(
    f"""
    with scoped as (
      select session_id,
             event_name,
             coalesce(
               nullif(properties->>'tool', ''),
               nullif(properties->>'source', '')
             ) as tool
      from analytics_events
      where created_at >= '{start}'::timestamptz
        and event_name in ('tool_calculated', 'oracle_cta_view', 'oracle_cta_click')
    )
    select tool,
           count(distinct session_id) filter (
             where event_name = 'tool_calculated'
           )::int as calculated_sessions,
           count(distinct session_id) filter (
             where event_name = 'oracle_cta_view'
           )::int as cta_view_sessions,
           count(distinct session_id) filter (
             where event_name = 'oracle_cta_click'
           )::int as cta_click_sessions
    from scoped
    where tool in ({tool_names})
    group by tool
    order by calculated_sessions desc, tool;
    """
)

oracle_funnel = query(
    f"""
    with scoped as (
      select session_id,
             event_name,
             coalesce(nullif(properties->>'source', ''), 'unknown') as source
      from analytics_events
      where created_at >= greatest(
        '{start}'::timestamptz,
        '2026-07-17'::timestamptz
      )
        and event_name in (
          'oracle_entry_viewed',
          'oracle_first_question_submitted',
          'oracle_first_response'
        )
    )
    select source,
           count(distinct session_id) filter (
             where event_name = 'oracle_entry_viewed'
           )::int as entry_sessions,
           count(distinct session_id) filter (
             where event_name = 'oracle_first_question_submitted'
           )::int as first_question_sessions,
           count(distinct session_id) filter (
             where event_name = 'oracle_first_response'
           )::int as first_response_sessions
    from scoped
    group by source
    order by entry_sessions desc, source;
    """
)

clean_funnel = query(
    f"""
    with scoped as (
      select session_id,
             event_name,
             coalesce(
               nullif(properties->>'tool', ''),
               nullif(properties->>'source', '')
             ) as tool
      from analytics_events
      where created_at >= greatest(
        '{start}'::timestamptz,
        '2026-07-27'::timestamptz
      )
        and event_name in (
          'oracle_acquisition_cta_viewed_v1',
          'oracle_acquisition_cta_clicked_v1',
          'oracle_entry_viewed_v2',
          'oracle_first_question_submitted_v1',
          'oracle_first_response_delivered_v1'
        )
    )
    select tool,
           count(distinct session_id) filter (
             where event_name = 'oracle_acquisition_cta_viewed_v1'
           )::int as cta_view_sessions,
           count(distinct session_id) filter (
             where event_name = 'oracle_acquisition_cta_clicked_v1'
           )::int as cta_click_sessions,
           count(distinct session_id) filter (
             where event_name = 'oracle_entry_viewed_v2'
           )::int as entry_sessions,
           count(distinct session_id) filter (
             where event_name = 'oracle_first_question_submitted_v1'
           )::int as first_question_sessions,
           count(distinct session_id) filter (
             where event_name = 'oracle_first_response_delivered_v1'
           )::int as first_response_sessions
    from scoped
    where tool is not null
    group by tool
    order by cta_view_sessions desc, tool;
    """
)

page_mix = query(
    f"""
    select path,
           count(distinct session_id)::int as sessions
    from page_views
    where created_at >= '{start}'::timestamptz
      and path like '/outils/%'
    group by path
    order by sessions desc
    limit 20;
    """
)

print(f"=== ORACLE ACQUISITION BASELINE (from {start}) ===")
print("Event coverage:")
print(json.dumps(coverage, indent=2, ensure_ascii=False, default=str))
print("Tool result funnel:")
print(json.dumps(tool_funnel, indent=2, ensure_ascii=False, default=str))
print("Oracle funnel by source:")
print(json.dumps(oracle_funnel, indent=2, ensure_ascii=False, default=str))
print("Clean Lot C funnel (introduced 2026-07-27):")
print(json.dumps(clean_funnel, indent=2, ensure_ascii=False, default=str))
print("Top French tool paths:")
print(json.dumps(page_mix, indent=2, ensure_ascii=False, default=str))

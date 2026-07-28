#!/usr/bin/env python3
"""Aggregate-only measurement for the Karmastro Étoile Pass experiment.

The report contains no email address, user UUID, profile field, free text or
conversation content. Database grants and authorized turns are authoritative;
client analytics are shown separately as directional funnel signals.
"""

from __future__ import annotations

import json
import os
from pathlib import Path
import sys
import urllib.request

PROJECT_REF = "nkjbmbdrvejemzrggxvr"
CAMPAIGN = "etoile_pass_48h_v1"


def load_pat() -> str:
    value = os.environ.get("SUPABASE_PAT", "").strip()
    if value:
        return value
    env_file = Path("/Users/lestoilettesdeminette/stack-2026/.env.master")
    for line in env_file.read_text().splitlines():
        if line.startswith("SUPABASE_PAT="):
            return line.split("=", 1)[1].strip().strip("\"'")
    raise RuntimeError("SUPABASE_PAT missing")


def query(sql: str) -> list[dict[str, object]]:
    request = urllib.request.Request(
        f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query",
        data=json.dumps({"query": sql}).encode(),
        headers={
            "Authorization": f"Bearer {load_pat()}",
            "Content-Type": "application/json",
            "User-Agent": "karmastro-measure-etoile-pass/1.0",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read() or b"[]")


def main() -> None:
    if len(sys.argv) > 1:
        raise SystemExit("usage: python3 scripts/measure_etoile_pass.py")

    campaign = query(
        f"""
        select
          code,
          issuance_enabled,
          starts_at,
          offer_ends_at,
          max_grants,
          oracle_hourly_cap,
          oracle_total_cap,
          statement_timestamp() as measured_at
        from public.promotion_campaigns
        where code = '{CAMPAIGN}';
        """
    )
    if len(campaign) != 1:
        raise RuntimeError("campaign missing")

    grants = query(
        f"""
        select
          count(*)::integer as assigned,
          count(*) filter (where status = 'offered')::integer as offered,
          count(*) filter (where status = 'active')::integer as active,
          count(*) filter (
            where status = 'active' and expires_at <= statement_timestamp()
          )::integer as expired,
          count(*) filter (where status = 'revoked')::integer as revoked,
          round(
            100.0 * count(*) filter (where activated_at is not null)
            / nullif(count(*), 0),
            1
          ) as activation_rate_percent
        from public.promotion_grants
        where campaign_code = '{CAMPAIGN}';
        """
    )

    funnel = query(
        f"""
        select
          event.event_name,
          count(*)::integer as events,
          count(distinct event.user_id)::integer as users
        from public.analytics_events event
        join public.promotion_grants grant_row
          on grant_row.user_id = event.user_id
         and grant_row.campaign_code = '{CAMPAIGN}'
        join public.promotion_campaigns campaign
          on campaign.code = grant_row.campaign_code
        where event.created_at >= campaign.starts_at
          and event.event_name in (
            'etoile_pass_offer_viewed',
            'etoile_pass_activation_requested',
            'etoile_pass_activation_succeeded',
            'etoile_pass_activation_failed'
          )
        group by event.event_name
        order by event.event_name;
        """
    )

    usage = query(
        f"""
        with per_grant as (
          select
            grant_row.id,
            count(turn_row.id)::integer as turns
          from public.promotion_grants grant_row
          left join public.promotion_grant_oracle_turns turn_row
            on turn_row.grant_id = grant_row.id
          where grant_row.campaign_code = '{CAMPAIGN}'
          group by grant_row.id
        )
        select
          coalesce(sum(turns), 0)::integer as authorized_turns,
          count(*) filter (where turns > 0)::integer as users_with_turns,
          coalesce(round(avg(turns) filter (where turns > 0), 2), 0) as
            average_turns_per_engaged_user,
          coalesce(max(turns), 0)::integer as max_turns_for_one_user,
          count(*) filter (where turns >= 80)::integer as users_at_80_percent
        from per_grant;
        """
    )

    conversations = query(
        f"""
        select
          count(distinct conversation.id)::integer as conversations,
          count(distinct conversation.user_id)::integer as users,
          count(message.id)::integer as persisted_messages
        from public.oracle_conversations conversation
        join public.promotion_grants grant_row
          on grant_row.user_id = conversation.user_id
         and grant_row.campaign_code = '{CAMPAIGN}'
        join public.promotion_campaigns campaign
          on campaign.code = grant_row.campaign_code
        left join public.oracle_messages message
          on message.conversation_id = conversation.id
        where conversation.created_at >= campaign.starts_at;
        """
    )

    onboarding = query(
        """
        select
          event_name,
          count(*)::integer as events,
          count(distinct user_id)::integer as users
        from public.analytics_events
        where created_at >= timestamptz '2026-07-28 22:03:48+00'
          and event_name in (
            'onboarding_viewed_v2',
            'onboarding_essential_started_v1',
            'onboarding_essential_completed_v1',
            'onboarding_advanced_opened_v1',
            'onboarding_skipped_v1',
            'onboarding_destination_reached_v1'
          )
        group by event_name
        order by event_name;
        """
    )

    print(
        json.dumps(
            {
                "campaign": campaign[0],
                "authoritative_grants": grants[0],
                "directional_client_funnel": funnel,
                "authoritative_oracle_usage": usage[0],
                "cohort_conversations": conversations[0],
                "progressive_onboarding_since_deploy": onboarding,
                "privacy": (
                    "aggregate only: no email, UUID, profile field, prompt, "
                    "response or conversation content"
                ),
            },
            indent=2,
            ensure_ascii=False,
            default=str,
        )
    )


if __name__ == "__main__":
    main()

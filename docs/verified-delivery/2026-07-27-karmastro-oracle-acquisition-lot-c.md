# Karmastro Oracle acquisition Lot C

Date: 2026-07-27

Status: ready for pull request

Owner: Codex

## Outcome

Lead people from a completed French calculator result to the Oracle with one
clear decision per context. Keep every free result and calculation unchanged.
Measure the path from a visible result CTA to a first delivered Oracle response
without placing personal data in URLs, analytics, or logs.

## Source of truth and rollback

- Repository baseline: `77a1c0d07fec70ed9c66f7ae3b21fc3d1447cf5f`
- Product contract:
  `Premier coffre/Projets/karmastro.com/2026-07-27-oracle-conversion-consigne-execution.md`
- Journey version: `oracle_acquisition_v1`
- Rollback: revert the Lot C commit and redeploy the preceding `main` artifact.
- No database migration, price change, Stripe transaction, email, or model
  prompt change belongs to this lot.

## Factual baseline

The reproducible report is `scripts/measure_oracle_acquisition.py`. It only
prints aggregates and defaults to 2026-07-19, the first day
`oracle_cta_view` was observed.

From 2026-07-19 through the measurement on 2026-07-27:

- French tool traffic was led by synastry (89 sessions), ascendant (76), karmic
  debt (54), compatibility (25), and natal chart (16).
- Legacy CTA measurement is not usable as a result-level denominator:
  ascendant produced 63 CTA-view sessions for only 3 measured calculations,
  and synastry produced 74 CTA-view sessions for 0 measured calculations.
- The cause is visible in code: legacy instrumentation observes every
  `.km-oracle`, including helper and editorial links outside a completed result.
- `oracle_first_question_submitted` was introduced on 2026-07-27 and therefore
  has no pre-Lot-C baseline.

This lot does not claim an uplift against those mixed legacy events. It creates
a clean, dated funnel.

## Explicit offer configuration

| Tool | Intent | Primary offer after complete result | Secondary action |
|---|---|---|---|
| `annee-personnelle` | exploratory | Oracle | one-time reading |
| `ascendant` | exploratory | Oracle | one-time reading |
| `chemin-de-vie` | exploratory | Oracle | one-time reading |
| `dette-karmique` | exploratory | Oracle | one-time reading |
| `nombre-expression` | exploratory | Oracle | one-time reading |
| `theme-natal` | exploratory | Oracle | one-time reading |
| `transits` | exploratory | Oracle | one-time reading |
| `compatibilite` | transactional | one-time reading | Oracle text link |
| `synastrie` | transactional | one-time reading | Oracle text link |

The configuration is authored in templates. The model never chooses the
primary offer. Share and download controls remain utilities, not competing
commercial cards.

## Versioned funnel

All five events have `introduced_at: 2026-07-27` and
`journey_version: oracle_acquisition_v1`:

1. `oracle_acquisition_cta_viewed_v1`
2. `oracle_acquisition_cta_clicked_v1`
3. `oracle_entry_viewed_v2`
4. `oracle_first_question_submitted_v1`
5. `oracle_first_response_delivered_v1`

Allowed dimensions are limited to source/tool, locale, primary offer,
handoff presence, latency bucket, and journey version. Question text, name,
birth date, birth time, place, email, conversation ID, and URL query values are
forbidden.

Legacy events stay active for continuity. The clean acquisition events fire
only when the result CTA carries the Lot C marker through the same-origin,
single-use session handoff.

The handoff carries allowlisted calculator context and may retain optional
profile fields already held locally in session storage. The public Oracle does
not submit those profile fields anonymously and explicitly tells the person
that the calculator result was not transmitted. It deliberately drops the
template's suggested question and opens on free text so the first measured
question is the person's own wording, not a sentence injected by the
interface.

## Acceptance criteria

- The nine French calculators contain one acquisition surface after all result
  fields.
- Exactly one element is marked as the primary acquisition action per result.
- Exploratory tools make Oracle primary; compatibility and synastry make the
  one-time reading primary.
- No new result CTA uses a `q` URL parameter.
- The calculator script hash for eight pages matches the pre-change baseline.
  Karmic debt is the documented exception: its existing blurred challenge and
  healing fields become visible so the free result satisfies the integrity
  rule; the calculation and checkout payloads stay unchanged.
- The event registry dates and versions all clean-funnel events.
- The handoff accepts only allowlisted acquisition metadata and retains its
  existing 30-minute, single-use behavior.
- Local tests, content guard, Astro build, privacy scans, independent review,
  preview smoke, and live smoke pass.

## Deployment and canary

Deploy through a pull request and the existing Cloudflare Pages workflow.
Before merge, verify preview HTML for all nine pages plus `/oracle/`. After
merge, repeat HTTP checks against production and confirm the deployed tracker
contains all five event names.

The canary is synthetic and must be excluded from product interpretation. No
real payment or personal profile data is used.

## Independent review

The first independent review found two P2 measurement defects:

- the first delivered acquisition response could be missed after a failed
  initial request;
- a custom report start date was not applied to the clean funnel.

Both are fixed and covered by the Lot C contract test. A second review found
and prompted fixes for the karmic-debt no-result wording and paid-click
attribution. The final static review found the app event-registry test still
rejected the new journey version; its allowlist is now aligned. The full app
suite (89 tests), lint, typecheck, app build, site guards (19 tests), and
8,053-page Astro build all pass after the fix.

## Production evidence

- Product pull request:
  [#51](https://github.com/STACK-2026/karmastro/pull/51).
- Reviewed head:
  `153abd81ebf27a3ea1e801346852e59671705bcb`.
- Merge commit on `main`:
  `8c2611ddf6c5bc5e758d0efe03e0b6e3ea77da7e`.
- Every pull-request check passed before merge: Astro and Vite builds, i18n,
  content standards, dash guard, cross-project scan, blog smoke, and both
  Cloudflare project checks.
- Cloudflare's Git integration published the merge while the shared
  self-hosted runners were occupied. Direct production probes confirmed the
  new tracker and pages before the queued deploy workflow started.
- Cloudflare Pages deployment
  `1c52b080-0a08-403c-a274-3f883bc642a1` completed successfully for production
  branch `main` and exact commit
  `8c2611ddf6c5bc5e758d0efe03e0b6e3ea77da7e`.
- All nine French tool URLs returned HTTP 200. Each rendered exactly one
  `data-oracle-acquisition-cta`, exactly one
  `data-acquisition-primary="true"`, and no `/oracle/?q` URL.
- `/oracle/` returned HTTP 200. Its deployed bundle contained all three
  downstream clean-funnel events and the explicit sentence
  `Ton résultat n'est pas transmis`.
- The deployed tracker contained both
  `oracle_acquisition_cta_viewed_v1` and the explicit
  `intersectionRatio < 0.4` guard.
- The two `blur-*` occurrences on the karmic-debt page belong only to the
  language menu's `backdrop-blur-xl`; no free result field remains blurred.
- The first aggregate read after deployment returned an empty clean Lot C
  funnel, which is the expected zero state before a real post-deploy
  impression. It must not be combined with legacy events.

This evidence proves publication and measurement readiness. It does not prove
a conversion uplift. Product evaluation starts with real impressions dated on
or after 2026-07-27.

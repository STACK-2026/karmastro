# Karmastro welcome email reliability and localization

Date: 2026-07-31
Owner: Codex, with Augustin as production approver
Environment: isolated worktree from `origin/main` at `ff641a6`; production
Supabase project `nkjbmbdrvejemzrggxvr` observed read-only

## Goal and non-goals

Restore one reliable welcome email for each new authenticated account, in the
user's selected app language, while preserving the fail-closed protection on
the internal `send-email` function.

This change does not send a backfill, rotate a secret, deploy an Edge Function,
apply a migration, or publish the app without an explicit production gate.
It does not redesign payment, reading, newsletter, or horoscope emails.

## Current behavior and evidence

- Production `send-email` v31 was deployed on 2026-07-30 at 16:43 Europe/Paris.
  It correctly rejects callers that do not present the service-role key or the
  dedicated internal secret.
- The database trigger `on_auth_user_created` still presents its historical
  token. The latest signup request received HTTP 401 from `send-email`.
- Welcome delivery matched every signup from 2026-07-22 through 2026-07-29,
  then only 4 of 6 on 2026-07-30 and 0 of 1 on 2026-07-31. Over the latest 24
  hours, 0 of 4 signups had a matching welcome attempt.
- Supabase and Resend are otherwise available: the required secrets exist,
  `send-email` is ACTIVE, and `mail.karmastro.com` is verified.
- All 54 welcome log rows in the latest 30 days used the French subject. All 57
  recent profiles have `language=fr`; signup metadata contains no locale.
- The repository does not contain the live authentication hardening or the
  live welcome trigger migration. Production and Git are therefore divergent.

## Constraints and invariants

- `send-email` remains internal and fail-closed. Anonymous/user tokens cannot
  turn it into an email relay.
- A client never supplies the destination address. The server resolves it from
  the authenticated Supabase user.
- At most one welcome is sent per auth user, including React Strict Mode,
  callback reloads, and provider retries.
- Existing accounts are not silently turned into a bulk backfill. Only accounts
  created within the configured onboarding window are eligible.
- Locale priority is the explicit app locale, then profile/user metadata, then
  French. Legacy two-letter values normalize into the canonical app catalog.
- Supported welcome locales are the 28 canonical app locales: `fr-FR`, `en-US`,
  `es-ES`, `es-MX`, `de-DE`, `it-IT`, `pt-BR`, `nl-NL`, `ja-JP`, `ko-KR`,
  `zh-Hans`, `ar`, `tr-TR`, `pl-PL`, `ru-RU`, `uk-UA`, `cs-CZ`, `hu-HU`,
  `ro-RO`, `sv-SE`, `da-DK`, `nb-NO`, `fi-FI`, `el-GR`, `th-TH`, `vi-VN`,
  `id-ID`, and `ms-MY`. `es-MX` stays distinct; European Portuguese and
  unsupported Traditional Chinese fall back to the complete French template
  instead of being mislabeled as Brazilian Portuguese or Simplified Chinese.
- The delivery ledger stores the exact canonical locale. The existing
  `profiles.language` column receives the language subtag (`es`, `pt`, etc.) so
  current monthly-email and checkout consumers remain backward compatible.
  Arabic HTML is RTL.
- User-controlled names are escaped in HTML, stripped of control characters in
  subjects/plain text, and length-bounded.
- No recipient address, token, or secret is written to documentation or logs.

## Options considered

1. Reopen `send-email` to the legacy trigger token. Rejected because that token
   was the exact open-relay weakness fixed by v31.
2. Put the service-role key directly in the database trigger. Rejected because
   it persists a broad credential in function source and does not solve OAuth
   localization.
3. Keep signup-trigger delivery and infer country from the Supabase server.
   Rejected because the request no longer carries the user's browser locale or
   country; Google/Apple metadata currently contains neither.
4. Send through an authenticated, idempotent welcome endpoint after first sign
   in. Chosen because the browser locale and verified user identity are both
   available, and all auth providers converge on the same event.

## Chosen architecture

`AuthContext` reacts only to Supabase `SIGNED_IN` and calls a small client helper
with the session access token and `detectLocale()`. A new `send-welcome` Edge
Function verifies that token with Supabase Auth, rejects accounts outside the
new-account window, resolves the user's email server-side, records an atomic
per-user delivery claim, persists the selected profile language, and invokes
the protected `send-email` function with the service-role credential.

`send-email` keeps the live internal authorization guard, now persisted in Git,
and passes `data.locale` to a 28-locale welcome template.

A migration creates `welcome_email_deliveries` with a primary key on `user_id`,
RLS enabled and no client policy, then removes the obsolete email POST from
`handle_new_user`; profile creation remains intact. Deployment order is:

1. migration for the idempotency table only;
2. `send-email` and `send-welcome` Edge Functions;
3. app artifact containing the `SIGNED_IN` call;
4. migration that removes the legacy trigger POST, after the app is live.

For repository reproducibility the final SQL is one idempotent migration, but
the production runbook must split/gate the trigger replacement if the platform
cannot apply it after the app artifact.

## Error handling and observability

- Unauthorized and ineligible requests return without invoking `send-email`.
- A unique `user_id` claim makes repeat callbacks return `already_sent` or
  `in_progress` without a second external call.
- `send-email` forwards `welcome-user/<user_id>` as Resend's `Idempotency-Key`.
  Resend retains those keys for 24 hours, covering retries after an ambiguous
  network result while the permanent SQL ledger covers later callbacks.
- Failed calls are marked `failed` with a bounded error and may be retried; a
  stale `pending` claim is reclaimable after ten minutes.
- `send-email` remains the source for delivery attempt/sent/failed audit rows.
- Live verification uses an explicitly authorized canary only. Anonymous calls
  must remain 401.

## Rollout, rollback, and monitoring

- Rollback app: redeploy the prior app artifact.
- Rollback functions: redeploy the captured v31 bundle/source behavior; never
  roll back to the pre-auth open relay.
- Rollback migration: restore only the prior `handle_new_user` profile insert;
  keep the delivery table because it is harmless and preserves idempotency
  evidence.
- Stop rollout on any anonymous 2xx from `send-email`, duplicate welcome for the
  canary user, nonlocalized content, or signup failure.
- Re-measure after 24 hours: new accounts, welcome claims, email log sent/failed,
  and detected locale distribution, all as aggregates.

## Acceptance criteria

- The production regression has an executable test showing the legacy trigger
  cannot call the guarded endpoint.
- `send-email` rejects missing/wrong credentials and accepts the internal paths.
- One new user can request one welcome only, and cannot choose another address.
- All 28 locales produce localized subject, HTML, text, CTA, footer language
  and document direction where applicable.
- Unknown/regional locales normalize deterministically.
- Final focused tests, complete app tests, lint, typecheck, build, Edge checks,
  migration checks, diff review, and secret scan pass before a deployment gate.

## Open decisions

None for local implementation. Production deployment, canary recipient, and
any historical backfill remain explicit approval gates.

## Production gate and rollback

No step below is authorized by the local implementation alone.

1. Capture the active `send-email` v31 bundle and current database function as
   rollback artifacts.
2. Deploy the guarded `send-email` and the new `send-welcome` functions. The app
   does not call the new endpoint yet, so a missing ledger cannot affect users.
3. Apply the migration to create/seed the private delivery ledger and replace
   only the already-broken direct email POST with profile-only creation.
4. Deploy the app artifact containing the authenticated `SIGNED_IN` call.
5. Verify an anonymous `send-email` request still returns 401, then use one
   explicitly approved new canary account in a non-French locale. Confirm one
   provider delivery, one `sent` ledger row, the canonical locale, the legacy
   profile language, and no duplicate after a second request.

Rollback keeps the security guard and profile-only signup trigger. Revert the
app artifact first, restore the captured v31 Edge bundle if required, and leave
the private ledger in place until a separately reviewed cleanup migration. Do
not restore the stale trigger token or reopen `send-email`.

## Local verification evidence

- Focused welcome/security coverage: 7 files, 52 tests passed.
- Complete app suite after final migration portability fix: 36 files, 164 tests
  passed.
- ESLint, `tsc -b --noEmit`, and the production Vite build passed.
- Both Edge entry points bundled successfully with esbuild.
- Migration structure, canonical locale catalog, RLS/no-policy posture,
  historical success seeding, and absence of `net.http_post` have executable
  tests.
- `git diff --check` and a targeted secret-pattern scan passed.
- Deno and a running local Docker daemon were unavailable, so no Deno-native or
  ephemeral local-Supabase migration execution is claimed.

## Production gate evidence, 2026-07-31

- Git source matched fresh `origin/main` at `ff641a6` before integration.
- Active `send-email` rollback target: version 31, platform bundle hash
  `5d58a45a55886338fa01bae21d38440b6139e1d2e0c2e178eb4c20a8a93c55fb`;
  downloaded ESZIP SHA-256
  `8dcb72f3a7675e328c3038e2867719dcacad9089fc1d9d0932cd6509bce4e90a`.
- Active app rollback target: Cloudflare deployment
  `c2d85ad4-a568-4bde-a7f0-84a201924397`, source `ff641a6`; live HTML SHA-256
  `bfd9cf77d63387d370985f62f36d8c0d795eee56565722ba36515b5dd1faba7b`.
- Database baseline at `2026-07-31T15:10:41Z`: 89 auth users, 89 profiles,
  43 distinct successful welcome recipients, four accounts created in the
  preceding 24 hours without a successful welcome, no ledger, and the legacy
  `net.http_post` still present.
- The first exact production transaction dry-run failed safely and rolled back
  because the live schema lacked the repository's historical generic
  `update_updated_at_column()` function. The migration now defines a scoped
  `set_welcome_email_delivery_updated_at()` trigger function and a regression
  test locks that portability requirement.
- The corrected exact migration then passed all live assertions inside a
  transaction and rolled back: ledger creation, zero client policies,
  historical seed parity, and removal of `net.http_post`.
- Fresh final gates after that correction: 36 test files / 164 tests, lint,
  typecheck, Vite production build, and Edge bundles all passed.
- Production deployment was explicitly approved by Augustin. No canary or
  historical backfill email is approved without a separate exact recipient
  authorization.

# Karmastro Oracle conversion: execution ledger

Date: 2026-07-27
Owner: Codex
Base: `origin/main` at `fdb9c361aff4dba3fbbec920e907eb58ab5c1417`
Branch: `codex/karmastro-oracle-conversion-20260727`
Worktree: isolated and clean at creation
Canonical design: Obsidian `Projets/karmastro.com/2026-07-27-oracle-conversion-consigne-execution.md`

## Authority and boundaries

The user authorized local implementation and progressive production deployment.

Non-negotiable gates:

- no secret or PII in output, logs, analytics, or diffs;
- test RED before each behavior change;
- worker and public-site hotfix deploy independently;
- dry-run before any real monthly-guidance execution;
- no real payment or customer email as a development test;
- rollback artifact recorded before each production mutation;
- no changes in the dirty iOS and internationalization worktree.

## Baseline

Observed on 2026-07-27:

- shared worktree is dirty on unrelated iOS and internationalization work;
- `origin/main` contains the anonymous app policy and the hardened monthly worker;
- public `https://karmastro.com/oracle/` still exposes the anonymous birth-data form and false personalization promise;
- deployed `send-monthly-guidance` is active at version 7;
- deployed worker dry-run: 0 candidates, 0 eligible, 0 sent, 0 errors;
- local shared Deno suite: 41 passed, 0 failed;
- Stripe retrieval errors already skip sending in `origin/main`;
- explicit send kill switch, workflow concurrency, and non-200 incomplete-run signaling are still absent.

## Risk register

| Risk | Prevention | Detection | Rollback |
|---|---|---|---|
| Guidance sent without verified entitlement | Fail-closed Stripe policy and send kill switch | Structured counters and non-200 incomplete run | Disable send switch and redeploy prior function |
| Duplicate scheduled run | GitHub concurrency group | Workflow history and sent counters | Disable send switch |
| False anonymous personalization | Remove form, local profile storage, and profile payload | Contract test plus live HTML probe | Redeploy prior site artifact only during diagnosis |
| Unrelated user work overwritten | Isolated worktree from `origin/main` | Status and diff review | Discard only this isolated branch after approval |

## Lot U status

- [x] Source and live baseline
- [x] RED tests for worker controls
- [x] Worker implementation
- [x] Local verification and review
- [x] Worker production canary
- [x] RED contract for public Oracle
- [x] Public hotfix implementation
- [x] Build, review, deployment, and live smoke

## Rollback records

- Worker live baseline: Supabase function `send-monthly-guidance`, version 7.
- Public site rollback SHA: `fdb9c361aff4dba3fbbec920e907eb58ab5c1417`.

## Lot U1 evidence

- RED: shared worker test failed on missing `canExecuteGuidanceSend` and
  `guidanceRunHttpStatus` exports.
- GREEN: 43 shared Deno tests passed, 0 failed.
- Worker type check: passed with Deno 2.5.6 using `--no-config` to isolate the
  Edge Function from the repository's absent local npm installation.
- Workflow YAML: parsed successfully.
- Diff hygiene: `git diff --check` passed.
- Production default after deployment: live sends disabled until the exact
  `MONTHLY_GUIDANCE_SEND_ENABLED=true` secret is deliberately configured.
- Production canary: dry-run returned HTTP 200 with 0 candidates and
  `run_complete=true`; non-dry returned HTTP 503 `sending_disabled` before any
  database query or email.

## Lot U2 evidence

- RED: public Oracle contract detected the anonymous profile form and false
  personalization flow.
- Implementation removes the anonymous birth-data form, local profile reads and
  writes, profile injection into `oracle-chat`, and personal starter questions.
- Legacy `km_oracle_profile` data is actively deleted from returning browsers.
- The paid one-time Life Path reading keeps its own birth-date field because the
  purchased calculation genuinely requires it.
- Focused contract: 2 passed, 0 failed.
- Handoff regression suite: 10 passed, 0 failed.
- Cross-surface regression suite: 33 passed, 0 failed.
- Full static build: 8,053 pages generated; content, fragment, and app-link
  guards passed.
- PR 47 checks passed; merge SHA:
  `6df6a92805b8c621f62cedb1d9e9c5121e25c4bf`.
- Cloudflare production run `30263891027` passed.
- Live smoke: HTTP 200, free-profile CTA present, anonymous profile form and
  false promises absent; the deployed bundle only references the legacy profile
  key to delete it.

## Lot A local evidence

- RED: missing conversation policy module, unregistered events, message-sending
  starter buttons, and absent conversation persistence.
- Four optional categories are normalized as server-owned enums and rejected
  when arbitrary text is supplied.
- First-turn system prompt is autonomous from the legacy verbose checklist. It
  requires 70 to 110 words, reflection, one useful foothold and one question;
  it forbids sky-of-the-day commentary, citations, mystical appellatives, and
  automatic birth-date requests.
- Site and app category buttons set metadata without creating a user message.
- Shared event registry records `introduced_at`, allowed properties and
  `oracle_conversation_v1`.
- Anonymous conversation UUID persists without storing question text.
- Edge shared suite: 48 passed, 0 failed.
- App suite: 72 passed, 0 failed.
- App lint, repository typecheck command and Vite build passed.
- Oracle Edge Function typecheck passed.
- Site conversation and privacy contracts passed; Astro generated 8,053 pages.

## Lot A production evidence

- PR 48: <https://github.com/STACK-2026/karmastro/pull/48>
- Merge SHA: `fd58dc92e3be2b09dbe4f21572c81217317fb756`.
- Every required PR check passed on the final head, including the locked Deno
  Edge suite, app build, site build, translation parity, typography guard,
  cross-project guard, and both Cloudflare previews.
- `oracle-chat` production baseline was version 43. The final server revision
  is version 47 and is `ACTIVE`.
- The first live canary exposed a real prompt conflict: the legacy checklist
  restored Moon-in-Capricorn commentary. Clients were not merged. The first
  turn was isolated into its own system prompt and current-sky data was removed
  from that turn before proceeding.
- The next live canary returned 77 visible words, one practical foothold, one
  question, no citation, no transit and no personal-data request. It exposed
  French vouvoiement, which was then fixed and covered by a test.
- Repeated canaries then exposed the primary provider's exact production
  constraint: Gemini 2.5 Flash free tier allows 20 requests per day, per
  project and model. The logged Google error was
  `GenerateRequestsPerDayPerProjectPerModel-FreeTier`.
- A quota-only fallback to the current stable
  `gemini-3.5-flash-lite` model was added. It uses the existing Google key and
  does not silently reactivate the configured paid Anthropic provider.
- The fallback configuration is model-specific because the current model
  rejects the legacy `thinkingConfig`. Provider and policy tests pass.
- The anti-bypass IP cap correctly blocked further full-function canaries after
  six attempts. It was not bypassed. An exact-prompt direct fallback canary
  returned HTTP 200 with 105 visible words, tutoiement, one practical foothold,
  one question, three suggestions, no citation and no sky-of-the-day content.
- Cloudflare site production run `30269136280` passed, including build, deploy,
  cache purge, and IndexNow.
- Public live smoke: `https://karmastro.com/oracle/` returned HTTP 200; all four
  optional categories and free-text input were present. The referenced Oracle
  asset returned HTTP 200 after normal propagation and contained
  `km_oracle_conversation`, `oracle_conversation_v1`, and
  `oracle_first_question_submitted`.
- App live smoke: `https://app.karmastro.com/oracle` returned HTTP 200. Its
  deployed Oracle chunk returned HTTP 200 and contained all four category enums,
  `oracle_conversation_v1`, and `oracle_first_question_submitted`.

Residual operational risk: a model-specific free fallback restores availability
but does not make a free-tier quota production-grade. Paid Gemini capacity or an
explicitly costed provider policy must be decided before acquisition materially
increases Oracle traffic.

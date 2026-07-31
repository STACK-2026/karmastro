# Karmastro welcome email reliability: implementation plan

Goal: restore secure, idempotent, localized welcome delivery for future new
accounts without sending or deploying during local implementation.

## Global constraints

- Preserve the v31 fail-closed `send-email` guard.
- Resolve the recipient only from the verified auth user.
- Support the 28 canonical app locales, including distinct `es-MX`, `pt-BR`
  and `zh-Hans`, with a complete French fallback for unsupported variants.
- Do not modify unrelated iOS, Oracle, billing, site, or content work.

### Task 1: Persist and test internal email authorization

Files:
- create `app/supabase/functions/_shared/internal-auth.ts`
- create `app/supabase/functions/_shared/internal-auth.test.ts`
- modify `app/supabase/functions/send-email/index.ts`

- [x] Add the security tests from the verified v31 source and run them RED.
- [x] Persist the constant-time guard and dedicated-secret fallback.
- [x] Run the focused auth policy tests GREEN.

Rollback: revert only these three files; never deploy a public unguarded
`send-email`.

### Task 2: Localize and harden the welcome template

Files:
- modify `app/supabase/functions/_shared/email-templates.ts`
- create `app/src/test/welcome-email-localization.test.ts`
- modify `app/supabase/functions/send-email/index.ts`

- [x] Write failing coverage for 28 locales, locale normalization, Arabic
  direction, regional variants, French fallback, and name escaping.
- [x] Implement the canonical catalog and pass `data.locale` to `welcomeEmail`.
- [x] Run localization and existing commercial-copy tests GREEN.

Rollback: revert the template/catalog change; secure sending remains intact.

### Task 3: Add authenticated idempotent welcome orchestration

Files:
- create `app/supabase/functions/_shared/welcome-policy.ts`
- create `app/supabase/functions/send-welcome/index.ts`
- create `app/src/lib/welcome-email.ts`
- modify `app/src/contexts/AuthContext.tsx`
- create `app/src/test/welcome-email-request.test.ts`
- create `app/src/test/welcome-policy.test.ts`

- [x] Write RED tests for request construction, account-age eligibility, locale
  normalization, and idempotent claim decisions.
- [x] Implement the authenticated endpoint and `SIGNED_IN` client call.
- [x] Run focused tests and TypeScript checks GREEN.

Rollback: remove the client call and endpoint; no production mail is sent by
local tests.

### Task 4: Make database state reproducible and retire the broken trigger call

Files:
- create `app/supabase/migrations/20260731143000_welcome_email_delivery.sql`
- create `app/src/test/welcome-email-migration.test.ts`
- modify `app/supabase/config.toml`

- [x] Write a RED structural test for RLS, one-user uniqueness, safe profile
  creation, and absence of a direct `send-email` trigger call.
- [x] Add the idempotency table and idempotent `handle_new_user` definition.
- [x] Record function JWT modes explicitly.
- [x] Run migration structural tests GREEN.

Rollback: restore profile-only `handle_new_user`; retain or drop the empty
delivery table only through a separately approved migration.

### Task 5: Integrate, review, and prepare the production gate

- [x] Run focused tests, full app tests, lint, typecheck, build, Edge policy
  tests/typechecks where tooling is available, SQL checks, and secret scan.
- [x] Inspect the complete diff for scope and generated noise.
- [x] Compare function auth semantics to production v31.
- [x] Prepare exact deploy order, rollback artifacts, anonymous negative test,
  and one explicitly authorized canary. Do not deploy or send without approval.

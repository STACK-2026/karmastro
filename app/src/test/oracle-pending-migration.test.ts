import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  path.join(
    process.cwd(),
    "supabase/migrations/20260727030000_oracle_pending_turns_and_activation_grants.sql",
  ),
  "utf8",
);

describe("Oracle pending-turn migration", () => {
  it("stores ciphertext with a maximum 72-hour TTL and no plaintext column", () => {
    expect(migration).toContain("ciphertext text not null");
    expect(migration).toContain("iv text not null");
    expect(migration).toContain("expires_at <= created_at + interval '72 hours'");
    expect(migration).not.toMatch(/\bquestion_text\b|\bplaintext\b/);
  });

  it("keeps tables service-only and grants idempotent", () => {
    expect(migration).toContain("alter table public.oracle_pending_turns enable row level security");
    expect(migration).toContain("revoke all on public.oracle_pending_turns from anon, authenticated");
    expect(migration).toContain("unique (pending_turn_id)");
    expect(migration).toContain("claim_oracle_pending_turn");
    expect(migration).toContain("reserve_oracle_activation_grant");
    expect(migration).toContain("release_oracle_activation_grant");
    expect(migration).toContain("consume_oracle_activation_grant");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("set status = 'canceled'");
    expect(migration).toContain("set status = 'revoked'");
  });

  it("physically purges expired questions every day inside Postgres", () => {
    expect(migration).toContain("create extension if not exists pg_cron with schema extensions");
    expect(migration).toContain("'purge-expired-oracle-pending-turns'");
    expect(migration).toContain("'17 3 * * *'");
    expect(migration).toContain("select public.purge_expired_oracle_pending_turns()");
  });
});

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const APP_ROOT = resolve(import.meta.dirname, "../..");
const MIGRATIONS_ROOT = resolve(APP_ROOT, "supabase/migrations");
const FEEDBACK_MODULE = resolve(APP_ROOT, "src/lib/oracle-feedback.ts");
const ORACLE_PAGE = resolve(APP_ROOT, "src/pages/OraclePage.tsx");

function feedbackContractMigration(): string | null {
  const matches = readdirSync(MIGRATIONS_ROOT)
    .filter((name) => name.endsWith("_oracle_feedback_contract_v1.sql"));
  expect(matches, "one additive oracle feedback v1 migration").toHaveLength(1);
  return matches[0] ? readFileSync(resolve(MIGRATIONS_ROOT, matches[0]), "utf8") : null;
}

describe("Oracle feedback database contract v1", () => {
  it("accepts the single Oracle identity while preserving legacy rows", () => {
    const sql = feedbackContractMigration();
    if (!sql) return;

    expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS oracle_feedback_guide_check/i);
    expect(sql).toMatch(/ADD CONSTRAINT oracle_feedback_guide_check[\s\S]*'oracle'/i);
    for (const legacy of ["sibylle", "orion", "selene", "pythia"]) {
      expect(sql).toContain(`'${legacy}'`);
    }
  });

  it("binds inserts to the authenticated or anonymous identity", () => {
    const sql = feedbackContractMigration();
    if (!sql) return;

    expect(sql).not.toMatch(/oracle_feedback[\s\S]{0,300}WITH CHECK\s*\(\s*true\s*\)/i);
    expect(sql).toMatch(/TO authenticated[\s\S]*auth\.uid\(\)\s*=\s*user_id/i);
    expect(sql).toMatch(/TO anon[\s\S]*user_id IS NULL[\s\S]*session_id IS NOT NULL/i);
    expect(sql).toMatch(/TO anon[\s\S]*conversation_id IS NOT NULL[\s\S]*turn_index = 1/i);
    expect(sql).toMatch(/TO anon[\s\S]*user_message IS NULL[\s\S]*assistant_message IS NULL/i);
  });

  it("adds the measurable response identity without rewriting legacy feedback", () => {
    const sql = feedbackContractMigration();
    if (!sql) return;

    for (const column of ["conversation_id", "turn_index", "surface", "locale", "contract_version", "introduced_at"]) {
      expect(sql).toMatch(new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`, "i"));
    }
    expect(sql).toMatch(/UNIQUE INDEX[\s\S]*conversation_id[\s\S]*turn_index/i);
    expect(sql).not.toMatch(/ADD COLUMN IF NOT EXISTS contract_version[^,;]*NOT NULL/i);
    expect(sql).not.toMatch(/ADD COLUMN IF NOT EXISTS introduced_at[^,;]*NOT NULL/i);
  });
});

describe("Oracle feedback App contract v1", () => {
  it("builds a content-minimized, versioned insert payload", async () => {
    expect(existsSync(FEEDBACK_MODULE), "src/lib/oracle-feedback.ts exists").toBe(true);
    if (!existsSync(FEEDBACK_MODULE)) return;

    const { buildOracleFeedbackInsert } = await import("@/lib/oracle-feedback");
    const payload = buildOracleFeedbackInsert({
      userId: null,
      sessionId: "anon-session-123456",
      conversationId: "00000000-0000-4000-8000-000000000001",
      rating: 3,
      turnIndex: 1,
      locale: "fr-FR",
    });

    expect(payload).toEqual({
      user_id: null,
      session_id: "anon-session-123456",
      conversation_id: "00000000-0000-4000-8000-000000000001",
      guide: "oracle",
      rating: 3,
      turn_index: 1,
      surface: "app",
      locale: "fr-FR",
      contract_version: 1,
      introduced_at: "2026-08-02T13:34:17.000Z",
    });
    expect(payload).not.toHaveProperty("user_message");
    expect(payload).not.toHaveProperty("assistant_message");
    expect(payload).not.toHaveProperty("text");
  });

  it("shows the three choices only for the first completed response and persists on the first click", () => {
    const source = readFileSync(ORACLE_PAGE, "utf8");

    expect(source).toMatch(/const assistantTurnIndex[\s\S]{0,300}assistantTurnIndex === 1/);
    expect(source).toMatch(/handleFeedbackClick[\s\S]{0,300}submitFeedback\(messageIndex, rating/);
    expect(source).not.toMatch(/handleFeedbackClick[\s\S]{0,300}status:\s*"expanded"/);
    expect(source).toContain('oracle_feedback_viewed');
    expect(source).toMatch(/code === "23505"[\s\S]{0,200}status: "submitted"/);
  });
});

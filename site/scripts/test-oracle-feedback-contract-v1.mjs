import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const oracleFile = new URL("../src/pages/oracle.astro", import.meta.url);
const layoutFile = new URL("../src/layouts/BaseLayout.astro", import.meta.url);
const registryFile = new URL("../../analytics/oracle-events-v1.json", import.meta.url);
const deployWorkflowFile = new URL("../../.github/workflows/deploy-site.yml", import.meta.url);

test("site feedback persists the exact production contract before confirming", async () => {
  const oracle = await readFile(oracleFile, "utf8");
  assert.match(oracle, /ORACLE_FEEDBACK_CONTRACT_VERSION\s*=\s*1/);
  assert.match(oracle, /ORACLE_FEEDBACK_INTRODUCED_AT\s*=\s*"2026-08-02T13:34:17\.000Z"/);
  assert.match(oracle, /introduced_at:\s*ORACLE_FEEDBACK_INTRODUCED_AT/);
  assert.match(oracle, /conversation_id:\s*conversationId/);
  assert.match(oracle, /turn_index:\s*1/);
  assert.match(oracle, /if \(resp\.ok \|\| resp\.status === 409\)/);
});

test("feedback exposure, success and failure are content-free and measurable", async () => {
  const oracle = await readFile(oracleFile, "utf8");
  for (const event of [
    "oracle_feedback_viewed",
    "oracle_feedback",
    "oracle_feedback_submit_failed",
  ]) {
    assert.match(oracle, new RegExp(`trackOracleEvent\\(\"${event}\"`));
    assert.match(oracle, new RegExp(`khTrack\\?\\.\\(\"${event}\"`));
  }
  assert.match(oracle, /role="status"/);
  assert.match(oracle, /failure_type/);
  assert.doesNotMatch(oracle, /oracle_feedback[^\n]+(?:question|answer|message|birth|email|text)/i);
});

test("the registry and Site PostHog bootstrap cover the feedback funnel", async () => {
  const [layout, registry, deployWorkflow] = await Promise.all([
    readFile(layoutFile, "utf8"),
    readFile(registryFile, "utf8").then(JSON.parse),
    readFile(deployWorkflowFile, "utf8"),
  ]);
  const names = new Set(registry.events.map((event) => event.name));
  assert.equal(names.has("oracle_feedback_viewed"), true);
  assert.equal(names.has("oracle_feedback"), true);
  assert.equal(names.has("oracle_feedback_submit_failed"), true);
  assert.match(layout, /from "\.\.\/scripts\/posthog"/);
  for (const name of ["PUBLIC_POSTHOG_KEY", "PUBLIC_SUPABASE_URL", "PUBLIC_SUPABASE_ANON_KEY"]) {
    assert.match(deployWorkflow, new RegExp(`${name}: \\$\\{\\{ vars\\.${name} \\}\\}`));
  }
});

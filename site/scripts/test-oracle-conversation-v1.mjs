import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const oracleFile = new URL("../src/pages/oracle.astro", import.meta.url);
const registryFile = new URL("../../analytics/oracle-events-v1.json", import.meta.url);

test("category chips add server metadata without impersonating the user", async () => {
  const page = await readFile(oracleFile, "utf8");

  for (const category of [
    "clarity_decision",
    "relationship",
    "work_direction",
    "self_understanding",
  ]) {
    assert.match(page, new RegExp(`data-category="${category}"`));
  }
  assert.doesNotMatch(page, /class="oracle-chip[^"]*"[^>]*data-q=/);
  assert.match(page, /category:\s*selectedCategory/);
  assert.match(page, /oracle_category_selected/);
});

test("the anonymous conversation id survives navigation without user text", async () => {
  const page = await readFile(oracleFile, "utf8");

  assert.match(page, /km_oracle_conversation/);
  assert.match(page, /localStorage\.setItem\(CONVERSATION_KEY,\s*conversationId\)/);
  assert.doesNotMatch(page, /localStorage\.setItem\([^,]+,\s*cleanText\)/);
});

test("every Oracle event is dated and versioned in the shared registry", async () => {
  const registry = JSON.parse(await readFile(registryFile, "utf8"));
  const page = await readFile(oracleFile, "utf8");
  const names = new Set();

  for (const event of registry.events) {
    assert.equal(names.has(event.name), false);
    names.add(event.name);
    assert.match(event.introduced_at, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(
      [
        "oracle_conversation_v1",
        "oracle_activation_v1",
        "oracle_acquisition_v1",
        "etoile_pass_48h_v1",
      ].includes(event.journey_version),
      true,
    );
    assert.equal(event.allowed_properties.includes("journey_version"), true);
  }

  assert.equal(names.has("oracle_category_selected"), true);
  assert.equal(names.has("oracle_first_question_submitted"), true);
  assert.match(page, /ACTIVATION_JOURNEY_VERSION\s*=\s*"oracle_activation_v1"/);
  for (const match of page.matchAll(/trackOracleEvent\("([a-z_]+)"/g)) {
    assert.equal(names.has(match[1]), true, `${match[1]} is missing from the registry`);
  }
});

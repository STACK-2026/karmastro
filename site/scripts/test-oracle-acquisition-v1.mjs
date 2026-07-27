import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSite = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const readRoot = (path) => readFile(new URL(`../../${path}`, import.meta.url), "utf8");

const TOOLS = {
  "annee-personnelle": { primary: "oracle", lastResult: 'id="result-months"' },
  ascendant: { primary: "oracle", lastResult: 'id="result-challenges"' },
  "chemin-de-vie": { primary: "oracle", lastResult: 'id="result-mission"' },
  compatibilite: { primary: "reading", lastResult: 'id="lesson-text"' },
  "dette-karmique": { primary: "oracle", lastResult: 'id="result-list"' },
  "nombre-expression": { primary: "oracle", lastResult: 'id="result-callings"' },
  synastrie: { primary: "reading", lastResult: 'id="aspects-list"' },
  "theme-natal": { primary: "oracle", lastResult: 'id="aspects-list"' },
  transits: { primary: "oracle", lastResult: 'id="count-t"' },
};

const EVENTS = [
  "oracle_acquisition_cta_viewed_v1",
  "oracle_acquisition_cta_clicked_v1",
  "oracle_entry_viewed_v2",
  "oracle_first_question_submitted_v1",
  "oracle_first_response_delivered_v1",
];

test("every French calculator has one explicit post-result acquisition decision", async () => {
  for (const [tool, config] of Object.entries(TOOLS)) {
    const source = await readSite(`src/pages/outils/${tool}.astro`);
    const resultIndex = source.indexOf(config.lastResult);
    const acquisitionIndex = source.indexOf("data-oracle-acquisition-cta");

    assert.notEqual(resultIndex, -1, `${tool}: final result marker is missing`);
    assert.ok(
      acquisitionIndex > resultIndex,
      `${tool}: acquisition CTA must follow the complete result`,
    );
    assert.equal(
      source.match(/data-oracle-acquisition-cta/g)?.length,
      1,
      `${tool}: expected one acquisition surface`,
    );
    assert.equal(
      source.match(/data-acquisition-primary="true"/g)?.length,
      1,
      `${tool}: expected exactly one primary acquisition action`,
    );
    assert.match(source, new RegExp(`data-tool="${tool}"`));
    assert.match(source, new RegExp(`data-primary-offer="${config.primary}"`));
    assert.match(source, /data-journey-version="oracle_acquisition_v1"/);
    assert.doesNotMatch(source, /href="\/oracle\/\?q=/);
    assert.doesNotMatch(source, /il lit ton |il lit tes |prolonge ton résultat/);
  }
});

test("calculator behavior stays byte-identical to the production baseline", async () => {
  const baseline = JSON.parse(
    await readRoot("analytics/oracle-acquisition-result-baseline-v1.json"),
  );

  for (const tool of Object.keys(TOOLS)) {
    if (tool === "dette-karmique") continue;
    const source = await readSite(`src/pages/outils/${tool}.astro`);
    const scriptIndex = source.indexOf("<script");
    assert.notEqual(scriptIndex, -1, `${tool}: calculator script is missing`);
    const hash = createHash("sha256").update(source.slice(scriptIndex)).digest("hex");
    assert.equal(hash, baseline.sha256[tool], `${tool}: calculator behavior changed`);
  }

  const karmicDebt = await readSite("src/pages/outils/dette-karmique.astro");
  assert.match(karmicDebt, /const lockedStyle = ""/);
  assert.doesNotMatch(karmicDebt, /filter:\s*blur/);
  assert.match(karmicDebt, /id="km-buy-lifepath" data-code="chemin-de-vie"/);
  assert.match(karmicDebt, /Tu veux aller au-delà de ce résultat \?/);
  assert.doesNotMatch(karmicDebt, /comment ce schéma se manifeste-t-il/);
});

test("the clean acquisition funnel is dated, versioned, and privacy-bounded", async () => {
  const registry = JSON.parse(await readRoot("analytics/oracle-events-v1.json"));
  const byName = new Map(registry.events.map((event) => [event.name, event]));
  const forbiddenProperties = new Set([
    "question",
    "message",
    "name",
    "birth_date",
    "birth_time",
    "birth_place",
    "email",
    "conversation_id",
    "url",
  ]);

  for (const name of EVENTS) {
    const event = byName.get(name);
    assert.ok(event, `${name}: missing from event registry`);
    assert.equal(event.introduced_at, "2026-07-27");
    assert.equal(event.journey_version, "oracle_acquisition_v1");
    assert.equal(event.allowed_properties.includes("journey_version"), true);
    for (const property of event.allowed_properties) {
      assert.equal(
        forbiddenProperties.has(property),
        false,
        `${name}: forbidden property ${property}`,
      );
    }
  }
});

test("tracker and Oracle propagate only a marked acquisition handoff", async () => {
  const tracker = await readSite("public/tracker.js");
  const handoff = await readSite("public/oracle-handoff.js");
  const oracle = await readSite("src/pages/oracle.astro");
  const report = await readRoot("scripts/measure_oracle_acquisition.py");

  assert.match(tracker, /oracle_acquisition_cta_viewed_v1/);
  assert.match(tracker, /intersectionRatio\s*<\s*0\.4/);
  assert.match(tracker, /oracle_acquisition_cta_clicked_v1/);
  assert.match(tracker, /data-oracle-acquisition-cta/);
  assert.match(tracker, /The Oracle opens with free text still empty/);
  assert.match(tracker, /question = ""/);
  assert.match(handoff, /oracle_acquisition_v1/);
  assert.match(oracle, /oracle_entry_viewed_v2/);
  assert.match(oracle, /oracle_first_question_submitted_v1/);
  assert.match(oracle, /oracle_first_response_delivered_v1/);
  assert.match(oracle, /incomingHandoff\?\.acquisition/);
  assert.match(oracle, /turn === 1 \|\| acquisitionContext/);
  assert.match(oracle, /Ton résultat n'est pas transmis/);
  assert.match(oracle, /toolLabels\[acquisitionContext\.tool\]/);
  assert.match(
    report,
    /greatest\(\s*'\{start\}'::timestamptz,\s*'2026-07-27'::timestamptz\s*\)/,
  );
});

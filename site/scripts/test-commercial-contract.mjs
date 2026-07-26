import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("the delivered-reading upsell describes the current Star offer", () => {
  const source = read("src/pages/lecture.astro");
  assert.match(source, /5,99€\/mois/);
  assert.doesNotMatch(source, /4,90€\/mois/);
  assert.doesNotMatch(source, /Orion t'écrivait chaque mois/);
});

test("the homepage no longer presents four Oracle guides", () => {
  const source = read("src/components/StatsSection.astro");
  assert.match(source, /\{\s*value:\s*1,[^}\n]*labelKey:\s*"guides"/);
  assert.doesNotMatch(source, /\{\s*value:\s*4,[^}\n]*labelKey:\s*"guides"/);
});

test("current UI code never calls the legacy subscription checkout", () => {
  const paths = [
    "../app/src/pages/PricingPage.tsx",
    "../app/src/pages/OraclePage.tsx",
    "src/pages/abonnement.astro",
    "src/pages/lecture.astro",
  ];
  for (const path of paths) {
    const source = path.startsWith("../app/")
      ? readFileSync(new URL(`../../${path.slice(3)}`, import.meta.url), "utf8")
      : read(path);
    assert.doesNotMatch(source, /functions\/v1\/subscription-checkout/);
  }
});

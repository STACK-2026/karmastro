import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("the homepage profile promise enters onboarding and keeps tools secondary", async () => {
  const hero = await read("src/components/Hero.astro");

  assert.match(hero, /\/onboarding/);
  assert.match(hero, /data-app-cta/);
  assert.match(hero, /data-cta-destination="onboarding"/);
  assert.match(hero, /hero\.cta_secondary/);
  assert.match(hero, /TOOLS_HUB/);
});

test("the final awakening CTA enters the tracked onboarding funnel", async () => {
  const cta = await read("src/components/CTA.astro");

  assert.match(cta, /\/onboarding/);
  assert.match(cta, /data-app-cta/);
  assert.match(cta, /data-cta-destination="onboarding"/);
});

test("site tracking covers authored app links and CTA visibility", async () => {
  const tracker = await read("public/tracker.js");
  const newsletter = await read("src/components/NewsletterCapture.astro");

  assert.match(tracker, /a\[href\^=["']https:\/\/app\.karmastro\.com/);
  assert.match(tracker, /oracle_cta_view/);
  assert.match(tracker, /newsletter_cta_view/);
  assert.match(tracker, /sign_profile_cta_view/);
  assert.match(tracker, /sign_profile_cta_click/);
  assert.match(newsletter, /data-newsletter-source/);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const rootPageUrl = new URL("../src/pages/horoscope/[signe]/index.astro", import.meta.url);
const localizedPageUrl = new URL("../src/pages/[lang]/horoscope/[signe]/index.astro", import.meta.url);
const signProfileUrl = new URL("../src/components/SignProfile.astro", import.meta.url);

async function assertDailyActionOrder(pageUrl) {
  const source = await readFile(pageUrl, "utf8");
  const markers = [
    'data-horoscope-action="oracle"',
    'data-horoscope-action="newsletter"',
    'data-horoscope-action="profile"',
    'data-horoscope-section="tomorrow"',
  ];
  const positions = markers.map((marker) => source.indexOf(marker));

  assert.ok(positions.every((position) => position >= 0), `missing action marker in ${pageUrl.pathname}`);
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, `wrong daily action order in ${pageUrl.pathname}`);
  assert.match(source, /href="#profil-signe"/);
}

test("places Oracle, newsletter and sign profile link before tomorrow on the French horoscope", async () => {
  await assertDailyActionOrder(rootPageUrl);
});

test("keeps the same action hierarchy on localized horoscope routes", async () => {
  await assertDailyActionOrder(localizedPageUrl);

  const source = await readFile(localizedPageUrl, "utf8");
  for (const locale of ["en", "es", "it", "pt", "de", "tr", "pl", "ru", "ja", "ar"]) {
    assert.match(source, new RegExp(`\\b${locale}:`), `missing localized profile CTA for ${locale}`);
  }
});

test("exposes the sign profile as the profile CTA target", async () => {
  const source = await readFile(signProfileUrl, "utf8");
  assert.match(source, /<section id="profil-signe"/);
});

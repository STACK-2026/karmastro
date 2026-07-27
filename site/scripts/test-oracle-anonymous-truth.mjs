import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const oracleFile = new URL("../src/pages/oracle.astro", import.meta.url);

test("the public Oracle never pretends to personalise an anonymous exchange", async () => {
  const page = await readFile(oracleFile, "utf8");

  assert.doesNotMatch(page, /id="oracle-profile-form"/);
  assert.doesNotMatch(page, /id="oracle-first-name"/);
  assert.doesNotMatch(page, /id="oracle-birth-date"/);
  assert.doesNotMatch(page, /id="oracle-birth-time"/);
  assert.doesNotMatch(page, /id="oracle-birth-place"/);
  assert.doesNotMatch(page, /(?:getItem|setItem)\(\s*["']km_oracle_profile["']/);
  assert.match(page, /removeItem\(\s*["']km_oracle_profile["']\s*\)/);
  assert.doesNotMatch(page, /profile:\s*currentProfile\(\)/);
  assert.doesNotMatch(page, /Pour que l'Oracle parle vraiment de toi/);
  assert.doesNotMatch(page, /L'Oracle croise maintenant ton ciel et tes nombres/);

  assert.match(page, /Créer mon profil gratuit/);
  assert.match(page, /dans ton espace personnel/);
  assert.match(page, /Écris ensuite ta question avec tes propres mots/);
});

test("the one-time paid reading may still request the birth date it needs", async () => {
  const page = await readFile(oracleFile, "utf8");

  assert.match(page, /id="km-pw-birth"/);
  assert.match(page, /tool:\s*"chemin-de-vie",\s*birthDate/);
});

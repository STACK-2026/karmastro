// Guard: an indexed non-FR blog article must not keep a French title.
// Root cause: translated article bodies retained French frontmatter titles,
// causing search engines to show French titles on localized pages.
import { test } from "node:test";
import assert from "node:assert";
import { readFileSync, globSync } from "node:fs";

const NON_FR = new Set(["ar", "de", "en", "es", "it", "ja", "pl", "pt", "ru", "tr"]);

// Deliberately conservative French-only markers. Avoid Romance-language
// cognates such as "gratuito" and "tema" so legitimate local titles pass.
const FRENCH_ONLY = /quels? signes?|comment avoir|comment (?:calculer|gérer|interpréter)|chemin de vie|nombre d'expression|numéro d'expression|thème (?:astral|natal)|prévisions? astro|vies passées|pythagoricienne|karma astrologie|maisons astrologiques|année personnelle|signe lunaire|\bvos meilleurs\b|à 29 ans/i;

test("indexed non-FR blog articles do not keep a French title", () => {
  const offenders = [];

  for (const file of globSync("src/content/blog/*.md")) {
    const source = readFileSync(file, "utf8");
    const lang = (source.match(/^lang:\s*["']?([a-z-]+)/m)?.[1] ?? "").slice(0, 2);
    if (!NON_FR.has(lang)) continue;

    const title = source.match(/^title:\s*"(.+?)"\s*$/m)?.[1] ?? "";
    if (FRENCH_ONLY.test(title)) offenders.push(`[${lang}] ${file}: ${title}`);
  }

  assert.deepEqual(offenders, [], `French titles on non-FR pages:\n${offenders.join("\n")}`);
});

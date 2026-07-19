import assert from "node:assert/strict";
import test from "node:test";
import { auditMarkdown, collectTargets } from "./check-blog-fragments.mjs";

test("accepts the exact github-slugger id, including French accents", () => {
  const markdown = `
## Sommaire
- [Question](#quest-ce-quune-maison--définition)

## Qu'est-ce qu'une maison ? Définition
`;
  assert.deepEqual(auditMarkdown(markdown), []);
});

test("reports a fragment that differs from the rendered heading id", () => {
  const markdown = `
- [Les maisons](#les-maisons)

## Les maisons astrologiques : guide complet
`;
  assert.deepEqual(auditMarkdown(markdown), [{
    filename: "article.md",
    fragment: "les-maisons",
    label: "Les maisons",
  }]);
});

test("tracks duplicate heading ids like github-slugger", () => {
  const targets = collectTargets("## FAQ\n\n## FAQ\n\n## FAQ\n");
  assert.deepEqual([...targets], ["faq", "faq-1", "faq-2"]);
});

test("accepts an explicit HTML id as a stable target", () => {
  const markdown = `<a id="stable-section"></a>\n\n[Aller](#stable-section)\n`;
  assert.deepEqual(auditMarkdown(markdown), []);
});

test("matches Astro's trailing slug dash before an inline HTML tag", () => {
  const markdown = `
- [Section](#section-)

## Section <span aria-hidden="true"></span>
`;
  assert.deepEqual(auditMarkdown(markdown), []);
});

test("ignores fragment examples inside fenced code", () => {
  const markdown = "```md\n[Broken](#missing)\n## Missing\n```\n";
  assert.deepEqual(auditMarkdown(markdown), []);
});

import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { extname } from "node:path";
import test from "node:test";

const SITE_ROOT = new URL("../", import.meta.url);

async function filesBelow(relativeDir, extensions) {
  const output = [];

  async function walk(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const child = new URL(`${entry.name}${entry.isDirectory() ? "/" : ""}`, directory);
      if (entry.isDirectory()) await walk(child);
      else if (extensions.has(extname(entry.name))) output.push(child);
    }
  }

  await walk(new URL(relativeDir, SITE_ROOT));
  return output;
}

test("published pages contain no unsupported aggregate rating metadata", async () => {
  const pages = await filesBelow("src/pages/", new Set([".astro", ".js", ".ts"]));
  const offenders = [];

  for (const file of pages) {
    const source = await readFile(file, "utf8");
    if (/aggregateRating|ratingValue|ratingCount|reviewCount/.test(source)) {
      offenders.push(file.pathname.replace(SITE_ROOT.pathname, ""));
    }
  }

  assert.deepEqual(offenders, []);
});

test("blog frontmatter contains no unsupported reviewer claim", async () => {
  const posts = await filesBelow("src/content/blog/", new Set([".md", ".mdx"]));
  const offenders = [];

  for (const file of posts) {
    const source = await readFile(file, "utf8");
    if (/^reviewedBy\s*:/m.test(source)) {
      offenders.push(file.pathname.replace(SITE_ROOT.pathname, ""));
    }
  }

  assert.deepEqual(offenders, []);
});

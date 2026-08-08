#!/usr/bin/env node

import { readdir, readFile, writeFile } from "node:fs/promises";
import { extname } from "node:path";

const SITE_ROOT = new URL("../", import.meta.url);
const write = process.argv.includes("--write");

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

const inlineRating = /,\s*aggregateRating:\s*\{\s*"@type":\s*"AggregateRating",\s*ratingValue:\s*"[^"]+",\s*(?:ratingCount|reviewCount):\s*"[^"]+"\s*\}/g;
const multilineRating = /\n[ \t]*aggregateRating:\s*\{\s*\n[ \t]*"@type":\s*"AggregateRating",\s*\n[ \t]*ratingValue:\s*"[^"]+",\s*\n[ \t]*(?:ratingCount|reviewCount):\s*"[^"]+",?\s*\n[ \t]*\},?/g;
const reviewerLine = /^reviewedBy\s*:[^\n]*(?:\n|$)/gm;

const ratingFiles = await filesBelow("src/pages/", new Set([".astro", ".js", ".ts"]));
const blogFiles = await filesBelow("src/content/blog/", new Set([".md", ".mdx"]));
const changedFiles = new Set();
let ratingOccurrences = 0;
let reviewerOccurrences = 0;

for (const file of ratingFiles) {
  const source = await readFile(file, "utf8");
  const inlineMatches = source.match(inlineRating)?.length ?? 0;
  const multilineMatches = source.match(multilineRating)?.length ?? 0;
  const next = source.replace(inlineRating, "").replace(multilineRating, "");

  ratingOccurrences += inlineMatches + multilineMatches;
  if (next !== source) {
    changedFiles.add(file.pathname.replace(SITE_ROOT.pathname, ""));
    if (write) await writeFile(file, next);
  }
}

for (const file of blogFiles) {
  const source = await readFile(file, "utf8");
  const matches = source.match(reviewerLine)?.length ?? 0;
  const next = source.replace(reviewerLine, "");

  reviewerOccurrences += matches;
  if (next !== source) {
    changedFiles.add(file.pathname.replace(SITE_ROOT.pathname, ""));
    if (write) await writeFile(file, next);
  }
}

console.log(JSON.stringify({
  mode: write ? "write" : "dry-run",
  ratingOccurrences,
  reviewerOccurrences,
  changedFiles: changedFiles.size,
}, null, 2));

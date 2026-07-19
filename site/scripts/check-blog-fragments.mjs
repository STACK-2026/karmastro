#!/usr/bin/env node
/**
 * Block broken same-page fragment links in published Markdown articles.
 *
 * Astro generates heading ids with github-slugger. Importing the same slugger
 * (already installed by Astro) avoids the accent/punctuation drift that caused
 * manually simplified tables of contents to point at ids that do not exist.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";

const MARKDOWN_FRAGMENT_LINK_RE = /(!?\[((?:\\.|[^\]])*)\]\(\s*#)([^)\s"']+)((?:\s+["'][^)]*["'])?\s*\))/g;
const HTML_FRAGMENT_LINK_RE = /\bhref\s*=\s*["']#([^"']+)["']/gi;
const HTML_ID_RE = /\bid\s*=\s*["']([^"']+)["']/gi;

function decodeHtmlEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  };
  return value.replace(/&(#(?:x[0-9a-f]+|\d+)|[a-z]+);/gi, (entity, key) => {
    if (key[0] === "#") {
      const hex = key[1]?.toLowerCase() === "x";
      const codePoint = Number.parseInt(key.slice(hex ? 2 : 1), hex ? 16 : 10);
      return Number.isFinite(codePoint) ? String.fromCodePoint(codePoint) : entity;
    }
    return named[key.toLowerCase()] ?? entity;
  });
}

/** Return the plain text mdast uses for an ATX heading. */
export function headingText(markdown) {
  let value = markdown
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/<[^>]*>/g, "")
    .replace(/`+([^`]*)`+/g, "$1")
    .replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, "$1")
    .replace(/[*_~]/g, "");
  value = decodeHtmlEntities(value);
  // Do not trim after removing inline HTML. Astro preserves the text-node space
  // before an inline tag when it feeds github-slugger (and therefore emits a
  // trailing `-`). Keeping it here makes the guard match the rendered id.
  return value;
}

export function stripFrontmatter(markdown) {
  return markdown.replace(/^---\s*\n[\s\S]*?\n---\s*\n/, "");
}

/** Ignore fenced code so examples cannot create fake headings, links or ids. */
export function withoutFencedCode(markdown) {
  const lines = markdown.split("\n");
  let fence = null;
  return lines
    .map((line) => {
      const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
      if (marker) {
        const char = marker[1][0];
        if (fence === null) fence = char;
        else if (fence === char) fence = null;
        return "";
      }
      return fence === null ? line : "";
    })
    .join("\n");
}

export function collectHeadings(markdown) {
  const body = withoutFencedCode(stripFrontmatter(markdown));
  const slugger = new GithubSlugger();
  const headings = [];

  for (const line of body.split("\n")) {
    const heading = line.match(/^\s{0,3}(#{1,6})[\t ]+(.+?)[\t ]*#*[\t ]*$/);
    if (!heading) continue;
    const text = headingText(heading[2]);
    headings.push({ depth: heading[1].length, text, id: slugger.slug(text) });
  }
  return headings;
}

export function collectTargets(markdown) {
  const body = withoutFencedCode(stripFrontmatter(markdown));
  const targets = new Set(collectHeadings(markdown).map(({ id }) => id));

  for (const match of body.matchAll(HTML_ID_RE)) {
    targets.add(match[1]);
  }
  return targets;
}

function decodeFragment(fragment) {
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}

export function auditMarkdown(markdown, filename = "article.md") {
  const body = withoutFencedCode(stripFrontmatter(markdown));
  const targets = collectTargets(markdown);
  const broken = [];

  for (const match of body.matchAll(MARKDOWN_FRAGMENT_LINK_RE)) {
    if (match[1].startsWith("!")) continue;
    const fragment = decodeFragment(match[3]);
    if (!targets.has(fragment)) {
      broken.push({ filename, label: match[2], fragment });
    }
  }
  for (const match of body.matchAll(HTML_FRAGMENT_LINK_RE)) {
    const fragment = decodeFragment(match[1]);
    if (!targets.has(fragment)) {
      broken.push({ filename, label: "HTML href", fragment });
    }
  }
  return broken;
}

function markdownFiles(root) {
  if (!fs.existsSync(root)) return [];
  const stat = fs.statSync(root);
  if (stat.isFile()) return /\.mdx?$/.test(root) ? [root] : [];
  return fs.readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const candidate = path.join(root, entry.name);
    return entry.isDirectory() ? markdownFiles(candidate) : (/\.mdx?$/.test(entry.name) ? [candidate] : []);
  }).sort();
}

export function auditPaths(paths) {
  const files = paths.flatMap(markdownFiles);
  const broken = files.flatMap((filename) =>
    auditMarkdown(fs.readFileSync(filename, "utf8"), filename),
  );
  return { files, broken };
}

function main() {
  const roots = process.argv.slice(2);
  if (roots.length === 0) {
    console.error("Usage: node scripts/check-blog-fragments.mjs <markdown-file-or-directory> [...]");
    process.exit(2);
  }
  const { files, broken } = auditPaths(roots);
  if (broken.length > 0) {
    for (const issue of broken) {
      console.error(`[BROKEN_FRAGMENT] ${issue.filename}: #${issue.fragment} (${issue.label})`);
    }
    const affected = new Set(broken.map(({ filename }) => filename)).size;
    console.error(`\nBLOG FRAGMENT GUARD: ${broken.length} broken link(s) in ${affected}/${files.length} file(s).`);
    process.exit(1);
  }
  console.log(`BLOG FRAGMENT GUARD OK (${files.length} file(s), 0 broken fragments).`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();

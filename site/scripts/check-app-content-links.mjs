#!/usr/bin/env node
/** Block article links to app.karmastro.com paths that the SPA cannot handle. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const APP_URL_RE = /https:\/\/app\.karmastro\.com(?<path>\/[^\s)\]}>"']*)?/gi;

export function normalizeAppPath(rawPath = "/") {
  let pathname;
  try {
    pathname = new URL(`https://app.karmastro.com${rawPath}`).pathname;
  } catch {
    pathname = rawPath.split(/[?#]/, 1)[0] || "/";
  }
  try {
    pathname = decodeURIComponent(pathname);
  } catch {
    // Keep malformed percent encoding visible to the guard instead of hiding it.
  }
  return pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
}

export function extractActiveRoutes(appSource) {
  return new Set(
    [...appSource.matchAll(/<Route\b[^>]*\bpath\s*=\s*["']([^"']+)["']/g)]
      .map((match) => match[1])
      .filter((route) => route !== "/*" && route !== "*")
      .map(normalizeAppPath),
  );
}

export function extractLegacyRoutes(legacySource) {
  return new Set(
    [...legacySource.matchAll(/^\s*["'](\/[^"']*)["']\s*:/gm)]
      .map((match) => normalizeAppPath(match[1])),
  );
}

export function extractAppPaths(markdown) {
  return [...markdown.matchAll(APP_URL_RE)]
    .map((match) => normalizeAppPath(match.groups?.path ?? "/"));
}

export function auditAppLinks(markdown, allowed, filename = "article.md") {
  return extractAppPaths(markdown)
    .filter((appPath) => appPath !== "/" && !allowed.has(appPath))
    .map((appPath) => ({ filename, path: appPath }));
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

function main() {
  const [contentRoot, appFile, legacyFile] = process.argv.slice(2);
  if (!contentRoot || !appFile || !legacyFile) {
    console.error("Usage: node scripts/check-app-content-links.mjs <content-dir> <App.tsx> <legacy-routes.ts>");
    process.exit(2);
  }
  const active = extractActiveRoutes(fs.readFileSync(appFile, "utf8"));
  const legacy = extractLegacyRoutes(fs.readFileSync(legacyFile, "utf8"));
  const allowed = new Set([...active, ...legacy]);
  const files = markdownFiles(contentRoot);
  const broken = files.flatMap((filename) =>
    auditAppLinks(fs.readFileSync(filename, "utf8"), allowed, filename),
  );

  if (broken.length > 0) {
    for (const issue of broken) {
      console.error(`[ORPHAN_APP_ROUTE] ${issue.filename}: ${issue.path}`);
    }
    const uniquePaths = new Set(broken.map(({ path: appPath }) => appPath));
    console.error(`\nAPP CONTENT LINK GUARD: ${broken.length} orphan link(s), ${uniquePaths.size} unique path(s).`);
    process.exit(1);
  }
  console.log(`APP CONTENT LINK GUARD OK (${files.length} file(s), ${allowed.size} active/legacy paths).`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();

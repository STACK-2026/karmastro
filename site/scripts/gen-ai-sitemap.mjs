// Post-build : derive ai-sitemap.xml from the already-built main sitemap.
// Rationale : the @astrojs/sitemap output is the ground truth (real built pages,
// localized slugs correct, weak locales ar/ru/ja/tr/pl already excluded since
// they get noindex + no <loc>). Re-implementing the i18n URL generation by hand
// produced 404s (see src/data/tool-paths.ts). Deriving from the main sitemap is
// drift-proof and 404-proof. Runs after `astro build` (see package.json).

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const DIST = resolve(process.cwd(), "dist");

function readLocs(file) {
  const xml = readFileSync(file, "utf8");
  const out = [];
  const reUrl = /<url>([\s\S]*?)<\/url>/g;
  let m;
  while ((m = reUrl.exec(xml))) {
    const block = m[1];
    const loc = (block.match(/<loc>([^<]+)<\/loc>/) || [])[1];
    const lastmod = (block.match(/<lastmod>([^<]+)<\/lastmod>/) || [])[1];
    if (loc) out.push({ loc, lastmod });
  }
  return out;
}

// Follow the sitemap index to its children, fallback to sitemap-0.xml.
let urls = [];
const indexFile = resolve(DIST, "sitemap-index.xml");
if (existsSync(indexFile)) {
  const idx = readFileSync(indexFile, "utf8");
  for (const m of idx.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    const fname = m[1].split("/").pop();
    const child = resolve(DIST, fname);
    if (existsSync(child)) urls.push(...readLocs(child));
  }
}
if (!urls.length) {
  const f = resolve(DIST, "sitemap-0.xml");
  if (existsSync(f)) urls = readLocs(f);
}

if (!urls.length) {
  console.error("gen-ai-sitemap: no URLs found in dist sitemaps, aborting (ai-sitemap.xml left untouched)");
  process.exit(1);
}

// Dedupe by loc, keep order.
const seen = new Set();
urls = urls.filter((u) => (seen.has(u.loc) ? false : seen.add(u.loc)));

const today = new Date().toISOString().split("T")[0];
const body = urls
  .map((u) => `  <url><loc>${u.loc}</loc><lastmod>${(u.lastmod || today).split("T")[0]}</lastmod></url>`)
  .join("\n");
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
writeFileSync(resolve(DIST, "ai-sitemap.xml"), xml);
console.log(`gen-ai-sitemap: wrote ${urls.length} URLs to dist/ai-sitemap.xml (derived from main sitemap)`);

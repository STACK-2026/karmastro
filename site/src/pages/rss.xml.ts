import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import fs from "fs";
import path from "path";
import type { APIContext } from "astro";
import { siteConfig } from "../../site.config";

function parisDate(): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

const SIGNS = [
  { slug: "belier", name: "Bélier" },
  { slug: "taureau", name: "Taureau" },
  { slug: "gemeaux", name: "Gémeaux" },
  { slug: "cancer", name: "Cancer" },
  { slug: "lion", name: "Lion" },
  { slug: "vierge", name: "Vierge" },
  { slug: "balance", name: "Balance" },
  { slug: "scorpion", name: "Scorpion" },
  { slug: "sagittaire", name: "Sagittaire" },
  { slug: "capricorne", name: "Capricorne" },
  { slug: "verseau", name: "Verseau" },
  { slug: "poissons", name: "Poissons" },
];

export async function GET(context: APIContext) {
  const items: any[] = [];

  // ─── Blog posts (FR) ───
  const now = new Date();
  try {
    const posts = await getCollection("blog", ({ data }) => !data.draft && data.date.valueOf() <= now.valueOf());
    for (const post of posts) {
      items.push({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.date,
        link: `/blog/${post.id}/`,
        categories: ["blog", "le-cosmos"],
        author: `${post.data.author || "Karmastro"} (Karmastro)`,
      });
    }
  } catch (e) {}

  // ─── Horoscope du jour (12 signes) ───
  try {
    const dataDir = path.join(process.cwd(), "src/data/horoscope");
    const realToday = parisDate();
    const files = fs
      .readdirSync(dataDir)
      .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
      .sort();
    const pastFiles = files.filter((f) => f.replace(".json", "") <= realToday);
    if (pastFiles.length > 0) {
      const latestFile = pastFiles[pastFiles.length - 1];
      const date = latestFile.replace(".json", "");
      const data = JSON.parse(fs.readFileSync(path.join(dataDir, latestFile), "utf-8"));
      for (const sign of SIGNS) {
        const entry = data[sign.slug];
        if (!entry) continue;
        items.push({
          title: `Horoscope ${sign.name} du ${date}`,
          description: entry.intro || `Horoscope quotidien ${sign.name}`,
          pubDate: new Date(`${date}T06:00:00+02:00`),
          link: `/horoscope/${sign.slug}/`,
          categories: ["horoscope", "sibylle", sign.slug],
          author: `${entry.author || "Sibylle"} (Karmastro)`,
        });
      }
    }
  } catch (e) {}

  return rss({
    title: "Karmastro — Le Cosmos & Horoscope quotidien",
    description: "Horoscope quotidien des 12 signes + articles Le Cosmos (astrologie, numérologie, karma). Calculs Swiss Ephemeris, précision 0.001 arcseconde.",
    site: context.site ?? siteConfig.url,
    items: items.sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf()),
    customData: `<language>fr-FR</language>
<copyright>Karmastro © 2026</copyright>
<ttl>360</ttl>
<image>
  <url>${siteConfig.url}/favicon.svg</url>
  <title>Karmastro</title>
  <link>${siteConfig.url}</link>
</image>`,
  });
}

import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { siteConfig } from "../../site.config";
import { ZODIAC_SIGNS } from "../data/zodiac";
import { AUTHORS } from "../data/authors";

const STATIC_PAGES_FR = [
  "/",
  "/outils/",
  "/compatibilite/",
  "/horoscope/",
  "/blog/",
  "/guides/",
  "/precision/",
  "/glossaire/",
  "/notre-histoire/",
  "/parrainage/",
];

const STATIC_PAGES_EN = [
  "/en/",
  "/en/tools/",
  "/en/compatibilite/",
  "/en/horoscope/",
  "/en/blog/",
];

const TOOLS_FR = [
  "/outils/theme-natal/",
  "/outils/chemin-de-vie/",
  "/outils/synastrie/",
  "/outils/compatibilite/",
  "/outils/transits/",
  "/outils/ascendant/",
  "/outils/dette-karmique/",
  "/outils/annee-personnelle/",
  "/outils/nombre-expression/",
];

const TOOLS_EN = [
  "/en/tools/birth-chart/",
  "/en/tools/life-path-number/",
  "/en/tools/synastry/",
  "/en/tools/compatibility/",
  "/en/tools/transits/",
  "/en/tools/rising-sign/",
  "/en/tools/karmic-debt/",
  "/en/tools/personal-year/",
  "/en/tools/expression-number/",
];

const today = () => new Date().toISOString().split("T")[0];

const lastmodOf = (post: { data: { lastReviewed?: Date; date: Date } }) =>
  (post.data.lastReviewed ?? post.data.date).toISOString().split("T")[0];

export const GET: APIRoute = async () => {
  const now = new Date();
  const blogFr = await getCollection("blog", ({ data }) =>
    !data.draft && data.lang === "fr" && data.date.valueOf() <= now.valueOf()
  );
  const blogEn = await getCollection("blog", ({ data }) =>
    !data.draft && data.lang === "en" && data.date.valueOf() <= now.valueOf()
  );

  const entries: string[] = [];
  const url = (path: string, lastmod = today()) =>
    `  <url><loc>${siteConfig.url}${path}</loc><lastmod>${lastmod}</lastmod></url>`;

  for (const p of STATIC_PAGES_FR) entries.push(url(p));
  for (const p of STATIC_PAGES_EN) entries.push(url(p));
  for (const p of TOOLS_FR) entries.push(url(p));
  for (const p of TOOLS_EN) entries.push(url(p));

  for (const sign of ZODIAC_SIGNS) {
    entries.push(url(`/horoscope/${sign.slug}/`));
    entries.push(url(`/en/horoscope/${sign.slug}/`));
  }

  for (const a of ZODIAC_SIGNS) {
    for (const b of ZODIAC_SIGNS) {
      entries.push(url(`/compatibilite/${a.slug}-${b.slug}/`));
    }
  }

  for (const persona of Object.values(AUTHORS)) {
    entries.push(url(`/guides/${persona.slug}/`));
  }

  for (const post of blogFr.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())) {
    entries.push(url(`/blog/${post.id}/`, lastmodOf(post)));
  }
  for (const post of blogEn.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())) {
    entries.push(url(`/en/blog/${post.id}/`, lastmodOf(post)));
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
};

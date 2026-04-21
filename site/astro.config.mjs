// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Import site config for the URL
import { siteConfig } from "./site.config.ts";

export default defineConfig({
  site: siteConfig.url,
  integrations: [
    sitemap({
      i18n: {
        defaultLocale: "fr",
        locales: {
          fr: "fr-FR",
          en: "en-US",
          es: "es-ES",
          pt: "pt-PT",
          de: "de-DE",
          it: "it-IT",
          tr: "tr-TR",
          pl: "pl-PL",
          ru: "ru-RU",
          ja: "ja-JP",
          ar: "ar-SA",
        },
      },
      changefreq: "daily",
      priority: 0.7,
      lastmod: new Date(),
      serialize(item) {
        // Exclude dated horoscope archive/preview pages (thin content, soft paywall)
        // Matches /horoscope/{signe}/YYYY-MM-DD[/] across FR root and /[lang]/ variants
        if (/\/horoscope\/[^/]+\/\d{4}-\d{2}-\d{2}\/?$/.test(item.url)) {
          return undefined;
        }
        // Exclude transactional newsletter endpoints : /newsletter/confirm
        // and /newsletter/unsubscribe are reached exclusively through email
        // links with tokens, they have no standalone content worth indexing.
        if (/\/newsletter\/(confirm|unsubscribe)\/?$/.test(item.url)) {
          return undefined;
        }
        // Priority by path type
        if (item.url === siteConfig.url + "/") {
          item.priority = 1.0;
          item.changefreq = "daily";
        } else if (item.url.includes("/horoscope/")) {
          item.priority = 0.9;
          item.changefreq = "daily";
        } else if (item.url.includes("/compatibilite/")) {
          item.priority = 0.8;
          item.changefreq = "monthly";
        } else if (item.url.includes("/blog/")) {
          item.priority = 0.8;
          item.changefreq = "weekly";
        } else if (item.url.includes("/outils/")) {
          item.priority = 0.85;
          item.changefreq = "monthly";
        }
        // Inject hreflang x-default pointing to the fr-FR variant. @astrojs/sitemap
        // emits per-locale xhtml:link tags but no x-default, which Google expects
        // for international sites. We derive the fr-FR URL from the alternates it
        // has already computed, or fall back to the item itself when it's fr.
        if (Array.isArray(item.links) && item.links.length) {
          const frVariant = item.links.find((l) => l.lang === "fr-FR" || l.lang === "fr");
          const xDefaultUrl = frVariant?.url || item.url;
          if (!item.links.some((l) => l.lang === "x-default")) {
            item.links.push({ lang: "x-default", url: xDefaultUrl });
          }
        }
        return item;
      },
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});

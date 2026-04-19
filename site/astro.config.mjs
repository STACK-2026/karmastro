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

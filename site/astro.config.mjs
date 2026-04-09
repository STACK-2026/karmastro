// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

// Import site config for the URL
import { siteConfig } from "./site.config.ts";

export default defineConfig({
  site: siteConfig.url,
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
  // Markdown config for blog articles
  markdown: {
    shikiConfig: {
      theme: "github-dark",
    },
  },
});

import type { APIRoute } from "astro";
import fs from "fs";
import path from "path";

const LANGS = ["fr", "en", "es", "pt", "de", "it", "tr", "pl", "ru", "ja", "ar"];
const dataDir = path.join(process.cwd(), "src/data/horoscope");

export function getStaticPaths() {
  if (!fs.existsSync(dataDir)) return [];
  const files = fs.readdirSync(dataDir);
  const dates = new Set<string>();
  for (const f of files) {
    const match = f.match(/^(\d{4}-\d{2}-\d{2})(?:-[a-z]{2})?\.json$/);
    if (match) dates.add(match[1]);
  }
  return Array.from(dates).map((date) => ({ params: { date } }));
}

export const GET: APIRoute = ({ params }) => {
  const date = params.date;
  const payload: Record<string, unknown> = { date };

  for (const lang of LANGS) {
    const candidate = lang === "fr"
      ? path.join(dataDir, `${date}.json`)
      : path.join(dataDir, `${date}-${lang}.json`);
    if (fs.existsSync(candidate)) {
      try {
        payload[lang] = JSON.parse(fs.readFileSync(candidate, "utf-8"));
      } catch {}
    }
  }

  return new Response(JSON.stringify(payload), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

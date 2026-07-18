import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";

const toolFiles = {
  "chemin-de-vie": new URL("../src/pages/outils/chemin-de-vie.astro", import.meta.url),
  ascendant: new URL("../src/pages/outils/ascendant.astro", import.meta.url),
  compatibilite: new URL("../src/pages/outils/compatibilite.astro", import.meta.url),
  "theme-natal": new URL("../src/pages/outils/theme-natal.astro", import.meta.url),
  synastrie: new URL("../src/pages/outils/synastrie.astro", import.meta.url),
};

const enBirthChartFile = new URL("../src/pages/en/tools/birth-chart.astro", import.meta.url);
const headerFile = new URL("../src/components/Header.astro", import.meta.url);
const trackerFile = new URL("../public/tracker.js", import.meta.url);

async function loadModule(storage) {
  const source = await readFile(new URL("../public/oracle-handoff.js", import.meta.url), "utf8");
  const context = {
    URL,
    window: {
      location: { href: "https://karmastro.com/outils/theme-natal/" },
      sessionStorage: storage,
    },
  };
  vm.runInNewContext(source, context, { filename: "oracle-handoff.js" });
  return context.window.kmOracleHandoff;
}

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    has: (key) => values.has(key),
  };
}

test("normalise un transfert valide sans accepter de champs arbitraires", async () => {
  const storage = memoryStorage();
  const handoff = await loadModule(storage);
  const now = Date.UTC(2026, 6, 17, 10, 0, 0);
  const payload = handoff.store({
    source: "theme-natal",
    question: "  Que révèle   mon ciel ?  ",
    email: "private@example.com",
    profile: {
      birthDate: "1990-02-14",
      birthTime: "08:30",
      birthPlace: "  Lyon\nFrance  ",
      partnerBirthDate: "1992-04-03",
    },
  }, { now });

  assert.deepEqual(JSON.parse(JSON.stringify(payload)), {
    version: 1,
    createdAt: now,
    source: "theme-natal",
    question: "Que révèle mon ciel ?",
    profile: {
      birthDate: "1990-02-14",
      birthTime: "08:30",
      birthPlace: "Lyon France",
    },
  });
  assert.equal(JSON.stringify(payload).includes("private@example.com"), false);
  assert.equal(JSON.stringify(payload).includes("1992-04-03"), false);
});

test("rejette les dates impossibles, sources suspectes et questions trop longues", async () => {
  const handoff = await loadModule(memoryStorage());
  assert.equal(handoff.create({ source: "theme-natal", profile: { birthDate: "2026-02-31" } }), null);
  assert.equal(handoff.create({ source: "../oracle", question: "Bonjour" }), null);
  assert.equal(handoff.create({ source: "theme-natal", question: "x".repeat(501) }), null);
});

test("consomme une seule fois et supprime avant de retourner", async () => {
  const storage = memoryStorage();
  const handoff = await loadModule(storage);
  const now = Date.UTC(2026, 6, 17, 10, 0, 0);
  handoff.store({ source: "ascendant", question: "Explique mon ascendant" }, { now });

  const first = handoff.consume({ now: now + 1000 });
  const second = handoff.consume({ now: now + 2000 });

  assert.equal(first.source, "ascendant");
  assert.equal(second, null);
  assert.equal(storage.has(handoff.KEY), false);
});

test("rejette et supprime un transfert expiré, futur ou corrompu", async () => {
  const storage = memoryStorage();
  const handoff = await loadModule(storage);
  const now = Date.UTC(2026, 6, 17, 10, 0, 0);

  handoff.store({ source: "compatibilite", question: "Analyse ce lien" }, { now: now - handoff.TTL_MS - 1 });
  assert.equal(handoff.consume({ now }), null);

  handoff.store({ source: "compatibilite", question: "Analyse ce lien" }, { now: now + 5 * 60 * 1000 + 1 });
  assert.equal(handoff.consume({ now }), null);

  storage.setItem(handoff.KEY, "{not-json");
  assert.equal(handoff.consume({ now }), null);
  assert.equal(storage.has(handoff.KEY), false);
});

test("dégrade proprement si sessionStorage est indisponible", async () => {
  const storage = {
    getItem() { throw new Error("blocked"); },
    setItem() { throw new Error("blocked"); },
    removeItem() { throw new Error("blocked"); },
  };
  const handoff = await loadModule(storage);
  assert.equal(handoff.store({ source: "chemin-de-vie", question: "Ma voie ?" }), null);
  assert.equal(handoff.consume(), null);
});

test("nettoie les données privées de l'URL et ne garde qu'une source sûre", async () => {
  const handoff = await loadModule(memoryStorage());
  const href = handoff.cleanHref(
    "/oracle/?q=Question%20privée&birthDate=1990-02-14&utm_source=seo",
    "theme-natal",
    "https://karmastro.com/outils/theme-natal/",
  );
  assert.equal(href, "https://karmastro.com/oracle/?src=theme-natal");
  assert.equal(handoff.cleanHref("/oracle/?q=secret", "../bad", "https://karmastro.com/"), "https://karmastro.com/oracle/");
});

test("consomme et supprime la question historique nettoyée avant analytics", async () => {
  const storage = memoryStorage({ km_oracle_legacy_question: "  Une question   privée ?  " });
  const handoff = await loadModule(storage);
  assert.equal(handoff.consumeLegacyQuestion(), "Une question privée ?");
  assert.equal(handoff.consumeLegacyQuestion(), "");

  storage.setItem("km_oracle_legacy_question", "x".repeat(501));
  assert.equal(handoff.consumeLegacyQuestion(), "");
  assert.equal(storage.has("km_oracle_legacy_question"), false);
});

test("garde les cinq CTA sur la même origine et ne promeut jamais le partenaire en profil", async () => {
  for (const [source, file] of Object.entries(toolFiles)) {
    const page = await readFile(file, "utf8");
    assert.match(page, new RegExp(`data-oracle-source="${source}"`));
    assert.doesNotMatch(page, /oracle\/\?q=/);
    assert.doesNotMatch(page, /target="_blank"/);
  }

  const compatibility = await readFile(toolFiles.compatibilite, "utf8");
  assert.match(compatibility, /oracleProfile = JSON\.stringify\(\{ birthDate: dateA \}\)/);
  assert.doesNotMatch(compatibility, /oracleProfile = JSON\.stringify\([^\n]*dateB/);

  const synastry = await readFile(toolFiles.synastrie, "utf8");
  assert.match(synastry, /oracleProfile = JSON\.stringify\(\{ birthDate: p1Data\.date, birthTime: p1Data\.time, birthPlace: p1Data\.place \}\)/);
  assert.doesNotMatch(synastry, /oracleProfile = JSON\.stringify\([^\n]*p2Data/);
});

test("connecte le birth chart EN au profil astral de l'app sans détour francophone", async () => {
  const page = await readFile(enBirthChartFile, "utf8");
  assert.doesNotMatch(page, /href="(?:https:\/\/karmastro\.com)?\/oracle\/?"/);
  assert.match(page, /https:\/\/app\.karmastro\.com\/auth\?next=%2Fastral(?:&|&amp;)lang=en/);
  assert.match(page, /utm_campaign=tool_handoff/);
  assert.match(page, /utm_content=birth-chart-en/);
  assert.match(page, /data-app-cta/);
});

test("connecte directement la navigation EN et instrumente les CTA app", async () => {
  const header = await readFile(headerFile, "utf8");
  const tracker = await readFile(trackerFile, "utf8");
  assert.match(header, /tools:\s*locale === "en" \? "tools" : "outils"/);
  assert.doesNotMatch(header, /localizedPath\("\/outils"\)/);
  assert.match(header, /data-app-cta/);
  assert.match(tracker, /app_cta_view/);
  assert.match(tracker, /app_cta_click/);
  assert.match(tracker, /handoff_id/);
  assert.match(tracker, /keepalive: true/);
  assert.match(tracker, /\[data-app-cta\]/);
});

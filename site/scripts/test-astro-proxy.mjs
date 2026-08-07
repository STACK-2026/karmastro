import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(siteRoot, "..");
const proxyPath = path.join(repoRoot, "app/supabase/functions/astro-calculate/handler.mjs");
const functionUrl = "https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/astro-calculate";

const birthData = {
  year: 1990,
  month: 1,
  day: 2,
  hour: 12.5,
  latitude: 48.8566,
  longitude: 2.3522,
};

async function loadProxy() {
  return import(pathToFileURL(proxyPath).href);
}

function makeRequest(operation, body, headers = {}) {
  return new Request(functionUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://karmastro.com",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify({ operation, payload: body }),
  });
}

async function invoke({ operation, body, headers, upstream }) {
  const { handleAstroRequest } = await loadProxy();
  const calls = [];

  const fetchImpl = async (url, init) => {
    calls.push({ url: String(url), init });
    return upstream?.(url, init) ?? Response.json({ ok: true });
  };

  const response = await handleAstroRequest(makeRequest(operation, body, headers), {
    engineUrl: "http://engine.internal:8100/",
    fetchImpl,
  });
  return { response, calls };
}

test("les quatre calculateurs utilisent uniquement la fonction HTTPS autorisée", async () => {
  const expectedOperations = new Map([
    ["ascendant.astro", ["natal-chart"]],
    ["theme-natal.astro", ["natal-chart"]],
    ["transits.astro", ["transits"]],
    ["synastrie.astro", ["natal-chart", "compatibility"]],
  ]);

  for (const [file, operations] of expectedOperations) {
    const source = await readFile(path.join(siteRoot, "src/pages/outils", file), "utf8");
    assert.doesNotMatch(source, /http:\/\/168\.119\.229\.20:8100/, `${file} expose encore le moteur HTTP`);
    assert.doesNotMatch(source, /\/api\/astro\//, `${file} utilise encore le proxy Cloudflare incompatible`);
    assert.match(source, /https:\/\/nkjbmbdrvejemzrggxvr\.supabase\.co\/functions\/v1\/astro-calculate/);
    for (const operation of operations) assert.match(source, new RegExp(`["']${operation}["']`), `${file} doit appeler ${operation}`);
  }

  const supabaseConfig = await readFile(path.join(repoRoot, "app/supabase/config.toml"), "utf8");
  assert.match(supabaseConfig, /\[functions\.astro-calculate\]\s+verify_jwt\s*=\s*false/);
});

test("natal-chart transmet un payload validé à l'unique route amont autorisée", async () => {
  const { response, calls } = await invoke({ operation: "natal-chart", body: birthData });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Access-Control-Allow-Origin"), "https://karmastro.com");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://engine.internal:8100/natal-chart");
  assert.deepEqual(JSON.parse(calls[0].init.body), birthData);
});

test("le preflight CORS est limité aux origines Karmastro", async () => {
  const { handleAstroRequest } = await loadProxy();
  const allowed = await handleAstroRequest(new Request(functionUrl, {
    method: "OPTIONS",
    headers: { Origin: "https://karmastro.com" },
  }), { engineUrl: "http://engine.internal:8100" });
  assert.equal(allowed.status, 204);
  assert.equal(allowed.headers.get("Access-Control-Allow-Origin"), "https://karmastro.com");

  const rejected = await handleAstroRequest(new Request(functionUrl, {
    method: "OPTIONS",
    headers: { Origin: "https://example.com" },
  }), { engineUrl: "http://engine.internal:8100" });
  assert.equal(rejected.status, 403);
  assert.equal(rejected.headers.get("Access-Control-Allow-Origin"), null);
});

test("compatibility accepte exactement deux profils de naissance valides", async () => {
  const body = { person1: birthData, person2: { ...birthData, year: 1992 } };
  const { response, calls } = await invoke({ operation: "compatibility", body });

  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.deepEqual(JSON.parse(calls[0].init.body), body);
});

test("une opération inconnue est refusée sans appel amont", async () => {
  const { response, calls } = await invoke({ operation: "oracle-context", body: birthData });

  assert.equal(response.status, 404);
  assert.equal(calls.length, 0);
});

test("un profil invalide est refusé sans appel amont", async () => {
  const { response, calls } = await invoke({
    operation: "transits",
    body: { ...birthData, latitude: 123 },
  });

  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

test("une origine tierce est refusée sans appel amont", async () => {
  const { response, calls } = await invoke({
    operation: "natal-chart",
    body: birthData,
    headers: { Origin: "https://example.com" },
  });

  assert.equal(response.status, 403);
  assert.equal(calls.length, 0);
});

test("un corps non JSON ou trop grand est refusé sans appel amont", async () => {
  const malformed = await invoke({ operation: "natal-chart", body: "pas du json" });
  assert.equal(malformed.response.status, 400);
  assert.equal(malformed.calls.length, 0);

  const oversized = await invoke({
    operation: "natal-chart",
    body: JSON.stringify({ ...birthData, padding: "x".repeat(17_000) }),
  });
  assert.equal(oversized.response.status, 413);
  assert.equal(oversized.calls.length, 0);
});

test("une erreur du moteur reste neutre pour le navigateur", async () => {
  const { response } = await invoke({
    operation: "natal-chart",
    body: birthData,
    upstream: () => new Response("trace interne sensible", { status: 500 }),
  });

  assert.equal(response.status, 502);
  assert.deepEqual(await response.json(), { error: "astro_engine_unavailable" });
});

import assert from "node:assert/strict";
import test from "node:test";
import {
  auditAppLinks,
  extractActiveRoutes,
  extractLegacyRoutes,
  normalizeAppPath,
} from "./check-app-content-links.mjs";

test("extracts active SPA routes and both legacy-map key styles", () => {
  const active = extractActiveRoutes(`
    <Route path="/onboarding" element={<Page />} />
    <Route path="*" element={<NotFound />} />
  `);
  const legacy = extractLegacyRoutes(`
    "/profil-complet": "/onboarding",
    '/calculateur': 'https://karmastro.com/outils/',
  `);
  assert.deepEqual([...active], ["/onboarding"]);
  assert.deepEqual([...legacy], ["/profil-complet", "/calculateur"]);
});

test("accepts root, query strings, active routes and legacy routes", () => {
  const markdown = `
    [Accueil](https://app.karmastro.com?utm_source=article)
    [Profil](https://app.karmastro.com/onboarding/?utm_source=article)
    [Ancien outil](https://app.karmastro.com/calculateur)
  `;
  const allowed = new Set(["/onboarding", "/calculateur"]);
  assert.deepEqual(auditAppLinks(markdown, allowed), []);
});

test("reports an app path absent from active and legacy routes", () => {
  const issues = auditAppLinks(
    "[Fonction inventée](https://app.karmastro.com/fonction-inventee?ref=article)",
    new Set(["/onboarding"]),
  );
  assert.deepEqual(issues, [{ filename: "article.md", path: "/fonction-inventee" }]);
});

test("normalizes trailing slashes without losing nested paths", () => {
  assert.equal(normalizeAppPath("/numerologie/chemin-de-vie/?x=1"), "/numerologie/chemin-de-vie");
});

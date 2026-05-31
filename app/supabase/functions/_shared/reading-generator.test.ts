import { assert, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildKarmicDebtPrompt, buildFallbackReading, buildReadingPrompt } from "./reading-generator.ts";

Deno.test("buildKarmicDebtPrompt inclut prénom, code, chemin de vie", () => {
  const p = buildKarmicDebtPrompt({
    fullName: "Marie Dupont", birthDate: "1988-06-14", locale: "fr", debtCodes: ["14/5"],
  });
  assertStringIncludes(p, "Marie");        // personnalisation prénom
  assertStringIncludes(p, "14/5");         // dette détectée
  assertStringIncludes(p, "Chemin de vie"); // contexte numéro
  assertStringIncludes(p, "rituel");        // structure attendue
  assert(p.length > 500);
});

Deno.test("buildKarmicDebtPrompt sans nom reste valide", () => {
  const p = buildKarmicDebtPrompt({
    fullName: "", birthDate: "1988-06-14", locale: "fr", debtCodes: ["14/5"],
  });
  assertStringIncludes(p, "14/5");
  assertStringIncludes(p, "Nom complet non fourni");
});

Deno.test("buildKarmicDebtPrompt ancre la mémoire canonique de la dette", () => {
  const p = buildKarmicDebtPrompt({
    fullName: "Léa", birthDate: "1988-06-14", locale: "fr", debtCodes: ["14/5"],
  });
  assertStringIncludes(p, "abus de liberté"); // titre canonique 14/5
});

Deno.test("buildFallbackReading produit une lecture structurée 5 sections", () => {
  const r = buildFallbackReading({ fullName: "Marie Dupont", birthDate: "1988-06-14", locale: "fr", debtCodes: ["14/5"] });
  assertStringIncludes(r, "## 14/5");
  assertStringIncludes(r, "mémoire d'âme");
  assertStringIncludes(r, "rituel de la semaine");
  assertStringIncludes(r, "question à te poser");
  assertStringIncludes(r, "Marie");
  assertStringIncludes(r, "chemin de vie"); // life path injecté
  assert(r.length > 400);
});

Deno.test("buildFallbackReading tolère birthDate vide (pas de crash)", () => {
  const r = buildFallbackReading({ fullName: "", birthDate: "", locale: "fr", debtCodes: ["19/1"] });
  assertStringIncludes(r, "## 19/1");
});

Deno.test("buildKarmicDebtPrompt EN écrit en anglais", () => {
  const p = buildKarmicDebtPrompt({ fullName: "John Smith", birthDate: "1988-06-14", locale: "en", debtCodes: ["14/5"] });
  assertStringIncludes(p, "IN ENGLISH");
  assertStringIncludes(p, "Life path");
  assertStringIncludes(p, "John");
  assertStringIncludes(p, "14/5");
});

Deno.test("buildFallbackReading EN produit de l'anglais", () => {
  const r = buildFallbackReading({ fullName: "John Smith", birthDate: "1988-06-14", locale: "en", debtCodes: ["14/5"] });
  assertStringIncludes(r, "## 14/5");
  assertStringIncludes(r, "soul memory");
  assertStringIncludes(r, "ritual for the week");
  assertStringIncludes(r, "John");
  assert(!r.includes("mémoire d'âme")); // pas de FR
});

// ── Moteur universel (Phase 1 multi-outils) ──────────────────────────────────
Deno.test("buildReadingPrompt route karmic-debt vers le builder hérité", () => {
  const p = buildReadingPrompt({ tool: "karmic-debt", fullName: "Augustin", birthDate: "1990-03-14", locale: "fr", debtCodes: ["13/4"] });
  assertStringIncludes(p, "Dette(s) karmique(s)");
  assertStringIncludes(p, "13/4");
});

Deno.test("buildReadingPrompt chemin-de-vie injecte le nombre", () => {
  const p = buildReadingPrompt({ tool: "chemin-de-vie", fullName: "Augustin", birthDate: "1990-03-14", locale: "fr" });
  assertStringIncludes(p, "CHEMIN DE VIE");
  assertStringIncludes(p, "Nombre de chemin de vie");
});

Deno.test("buildReadingPrompt nombre-expression utilise le nom", () => {
  const p = buildReadingPrompt({ tool: "nombre-expression", fullName: "Marie Dupont", birthDate: "1988-06-14", locale: "fr" });
  assertStringIncludes(p, "NOMBRE D'EXPRESSION");
  assertStringIncludes(p, "Marie Dupont");
});

Deno.test("buildReadingPrompt annee-personnelle calcule l'année", () => {
  const p = buildReadingPrompt({ tool: "annee-personnelle", fullName: "Lea", birthDate: "1990-03-14", locale: "fr", currentYear: 2026 });
  assertStringIncludes(p, "ANNEE PERSONNELLE 2026");
});

Deno.test("buildReadingPrompt compatibilite inclut les deux chemins de vie", () => {
  const p = buildReadingPrompt({ tool: "compatibilite", fullName: "Augustin", birthDate: "1990-03-14", partnerBirthDate: "1992-07-21", locale: "fr" });
  assertStringIncludes(p, "COMPATIBILITE");
  assertStringIncludes(p, "chemin de vie");
});

Deno.test("buildReadingPrompt n'utilise aucun tiret cadratin/demi-cadratin", () => {
  for (const tool of ["chemin-de-vie", "nombre-expression", "annee-personnelle", "compatibilite"] as const) {
    const p = buildReadingPrompt({ tool, fullName: "Lea Martin", birthDate: "1990-03-14", partnerBirthDate: "1992-07-21", locale: "fr" });
    assert(!p.includes("—") && !p.includes("–"), `${tool} contient un tiret cadratin/demi`);
  }
});

Deno.test("buildReadingPrompt EN bascule en anglais", () => {
  const p = buildReadingPrompt({ tool: "chemin-de-vie", fullName: "John", birthDate: "1990-03-14", locale: "en" });
  assertStringIncludes(p, "IN ENGLISH");
  assertStringIncludes(p, "LIFE PATH");
});

Deno.test("buildReadingPrompt astro (ascendant) inclut le focus + les positions injectées", () => {
  const eng = "THÈME NATAL :\nAscendant : Cancer 2°9'\nSoleil : Poissons 23° — maison 10";
  const p = buildReadingPrompt({ tool: "ascendant", fullName: "Augustin", birthDate: "1990-03-14", birthTime: "10:30", latitude: 47.32, longitude: 5.04, locale: "fr" }, eng);
  assertStringIncludes(p, "ASCENDANT");
  assertStringIncludes(p, "Ascendant : Cancer");      // données moteur injectées
  assertStringIncludes(p, "n'invente jamais");
});

Deno.test("buildReadingPrompt synastrie inclut les deux personnes", () => {
  const p = buildReadingPrompt({ tool: "synastrie", fullName: "Augustin", birthDate: "1990-03-14", partnerName: "Lea", partnerBirthDate: "1992-07-21", locale: "fr" }, "ASPECTS...");
  assertStringIncludes(p, "SYNASTRIE");
  assertStringIncludes(p, "Augustin");
  assertStringIncludes(p, "Lea");
});

Deno.test("buildReadingPrompt transits sans données moteur reste valide (garde anti-invention)", () => {
  const p = buildReadingPrompt({ tool: "transits", fullName: "Augustin", birthDate: "1990-03-14", locale: "fr" }, "");
  assertStringIncludes(p, "TRANSITS");
  assert(!p.includes("—") && !p.includes("–"));
});

Deno.test("buildFallbackReading générique pour outil non-karmic", () => {
  const r = buildFallbackReading({ tool: "chemin-de-vie", fullName: "Augustin", birthDate: "1990-03-14", locale: "fr" });
  assertStringIncludes(r, "Augustin");
  assert(!r.includes("## 13/4") && !r.includes("dette"));
});

import { assert, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildKarmicDebtPrompt, buildFallbackReading } from "./reading-generator.ts";

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

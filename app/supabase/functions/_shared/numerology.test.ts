import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { reduceNumerology, calculateLifePath, calculateExpression, detectKarmicDebts } from "./numerology.ts";

Deno.test("reduceNumerology garde les maîtres nombres", () => {
  assertEquals(reduceNumerology(29), 11); // 2+9=11 conservé
  assertEquals(reduceNumerology(28), 1);  // 2+8=10 -> 1
  assertEquals(reduceNumerology(22), 22); // maître conservé
});

Deno.test("calculateLifePath 25/12/1990 -> 11 (maître)", () => {
  const r = calculateLifePath(25, 12, 1990);
  // jour 25->7, mois 12->3, année 1990 -> 19 -> 1 ; 7+3+1=11 (maître)
  assertEquals(r.number, 11);
  assertEquals(r.isMaster, true);
});

Deno.test("calculateExpression Jean -> 3", () => {
  // J=1 E=5 A=1 N=5 = 12 -> 3
  assertEquals(calculateExpression("Jean").number, 3);
});

Deno.test("calculateExpression strip accents (Léa -> 9)", () => {
  // L=3 E=5 A=1 = 9
  assertEquals(calculateExpression("Léa").number, 9);
});

Deno.test("calculateExpression nom vide -> fallback 1", () => {
  assertEquals(calculateExpression("").number, 1);
});

Deno.test("detectKarmicDebts jour 14/06/1988 -> 14/5", () => {
  const debts = detectKarmicDebts(14, 6, 1988);
  assert(debts.some((d) => d.code === "14/5"));
});

Deno.test("detectKarmicDebts 02/02/2000 -> aucune", () => {
  const debts = detectKarmicDebts(2, 2, 2000);
  assertEquals(debts.length, 0);
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  localizeOracleHref,
  oraclePaywallCopy,
  resolveOracleLocale,
} from "../src/utils/oracle-locale.mjs";

test("the explicit query locale wins and only public locales are accepted", () => {
  assert.equal(resolveOracleLocale({
    currentUrl: "https://karmastro.com/oracle/?lang=it",
    referrer: "https://karmastro.com/es/herramientas/",
    documentLang: "fr-FR",
  }), "it");
  assert.equal(resolveOracleLocale({
    currentUrl: "https://karmastro.com/oracle/?lang=../../evil",
    referrer: "https://evil.example/pt/ferramentas/",
    documentLang: "fr-FR",
  }), "fr");
});

test("a same-origin localized referrer repairs legacy Oracle links", () => {
  assert.equal(resolveOracleLocale({
    currentUrl: "https://karmastro.com/oracle/",
    referrer: "https://karmastro.com/pt/ferramentas/ascendente/",
    documentLang: "fr-FR",
  }), "pt");
  assert.equal(resolveOracleLocale({
    currentUrl: "https://karmastro.com/oracle/",
    referrer: "https://evil.example/it/strumenti/",
    documentLang: "es-MX",
  }), "es");
});

test("localized pages expose an explicit same-origin Oracle locale", () => {
  assert.equal(
    localizeOracleHref("https://karmastro.com/oracle/", "it-IT", "https://karmastro.com"),
    "https://karmastro.com/oracle/?lang=it",
  );
  assert.equal(
    localizeOracleHref("https://app.karmastro.com/oracle/", "it-IT", "https://karmastro.com"),
    "https://app.karmastro.com/oracle/",
  );
  assert.equal(
    localizeOracleHref("https://karmastro.com/oracle/", "fr-FR", "https://karmastro.com"),
    "https://karmastro.com/oracle/",
  );
});

test("the commercial wall stays in the Oracle locale through checkout", () => {
  const expectedCtas = {
    fr: "Débloquer l'Oracle illimité - 5,99 €/mois",
    en: "Unlock unlimited Oracle - €5.99/month",
    es: "Desbloquear el Oráculo ilimitado - 5,99 €/mes",
    it: "Sblocca l'Oracolo illimitato - 5,99 €/mese",
    pt: "Desbloquear o Oráculo ilimitado - 5,99 €/mês",
    de: "Unbegrenztes Orakel freischalten - 5,99 €/Monat",
  };

  for (const [locale, cta] of Object.entries(expectedCtas)) {
    const copy = oraclePaywallCopy(locale);
    assert.equal(copy.cta, cta);
    assert.equal(copy.features.length, 3);
    assert.equal(copy.message.length > 20, true);
    assert.equal(copy.security.length > 15, true);
  }
  assert.deepEqual(oraclePaywallCopy("ar"), oraclePaywallCopy("en"));
});

test("the shared resolver is wired into links and every Oracle payload", async () => {
  const [layout, oracle] = await Promise.all([
    readFile(new URL("../src/layouts/BaseLayout.astro", import.meta.url), "utf8"),
    readFile(new URL("../src/pages/oracle.astro", import.meta.url), "utf8"),
  ]);

  assert.match(layout, /localizeOracleHref/);
  assert.match(layout, /querySelectorAll<HTMLAnchorElement>\('a\[href\]'\)/);
  assert.match(oracle, /resolveOracleLocale/);
  assert.match(oracle, /const oracleLocale = resolveOracleLocale/);
  assert.match(oracle, /locale:\s*oracleLocale/);
});

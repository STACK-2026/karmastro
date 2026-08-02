import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const SITE_ROOT = new URL("../", import.meta.url);

async function read(relativePath) {
  return readFile(new URL(relativePath, SITE_ROOT), "utf8");
}

test("article authorship and editorial personas are disclosed without invented credentials", async () => {
  const [seo, authors, guideIndex, guidePage, story, precision] = await Promise.all([
    read("src/utils/seo.ts"),
    read("src/data/authors.ts"),
    read("src/pages/guides/index.astro"),
    read("src/pages/guides/[slug].astro"),
    read("src/content/pages/notre-histoire.md"),
    read("src/content/pages/precision.md"),
  ]);
  const inventedCredentials = /Sorbonne|Oxford|Jung-Institut|École Polytechnique|ENS Ulm|Al-Azhar|psychologue clinicienne|thérapeute de formation|ingénieure de formation|ancien professeur|quinze ans|vingt-cinq dernières années/i;

  assert.match(seo, /author:\s*\{\s*"@id": `\$\{siteConfig\.url\}\/\#organization` \}/);
  assert.match(seo, /creditText/);
  assert.doesNotMatch(seo, /jobTitle|worksFor/);
  assert.match(authors, /personas? éditoriales?/i);
  assert.doesNotMatch(authors, inventedCredentials);
  assert.match(guideIndex, /personas éditoriales/i);
  assert.match(guidePage, /Persona éditoriale de Karmastro/i);
  assert.doesNotMatch(`${guideIndex}\n${guidePage}`, /"@type":\s*"Person"/);
  assert.match(story, /intelligence artificielle/i);
  assert.match(story, /personas? éditoriales?/i);
  assert.doesNotMatch(story, inventedCredentials);
  assert.doesNotMatch(precision, /même moteur[^\n]*NASA|niveau[^\n]*NASA|précision[^\n]*NASA/i);
});

test("the leading karmic numerology article separates symbolic convention from evidence", async () => {
  const article = await read("src/content/blog/numerologie-karmique-decoder-dettes-spirituelles.md");
  const fabricatedEvidence = /15\s?000|statistiques? Karmastro|cas (?:recens[ée]s|étudiés)|études? de suivi|Lama Yeshe|Vers d'Or|tablettes? (?:cunéiformes )?de Babylone|première plateforme française|précision inégalée|augmente la fiabilité|rapportent une amélioration/i;

  assert.match(article, /^lastReviewed:\s*"2026-08-02"/m);
  assert.match(article, /pratique symbolique/i);
  assert.match(article, /(?:méthodes|conventions) varient/i);
  assert.match(article, /^## Questions fréquentes$/m);
  assert.match(article, /^## Sources et méthode éditoriale$/m);
  assert.match(article, /https:\/\/www\.cnrtl\.fr\/definition\/academie9\/num%C3%A9rologie/);
  assert.match(article, /https:\/\/plato\.stanford\.edu\/entries\/pythagoreanism\//);
  assert.doesNotMatch(article, fabricatedEvidence);
  assert.doesNotMatch(article, /\b\d+(?:[.,]\d+)?\s?%/);
});

test("the leading Italian compatibility article uses illustrative, non-deterministic evidence", async () => {
  const article = await read("src/content/blog/compatibilita-astrologica-quali-segni-si-attraggono.md");

  assert.match(article, /^lastReviewed:\s*"2026-08-02"/m);
  assert.match(article, /^## In breve$/m);
  assert.match(article, /data, ora e luogo di nascita/i);
  assert.match(article, /pratica simbolica/i);
  assert.match(article, /esempi illustrativi/i);
  assert.doesNotMatch(article, /Tre casi reali|Giorgia e Stefano|Sara e Camilla|Riccardo e Elena/);
  assert.doesNotMatch(article, /(?:15|40|50|60) per cento/i);
  assert.doesNotMatch(article, /Io sono Selene|parla con me/i);
});

test("the French relationship hub routes lived problems without fabricated certainty", async () => {
  const article = await read("src/content/blog/compatibilite-amoureuse-signes-astrologiques-qui-sattirent.md");
  const fabricatedCertainty = /(?:5\s?%|5-8 aspects|la plupart des couples durables|beaucoup de couples durables|empiriquement les couples durables|tient à un degré près|niveau que la NASA|sources? encyclop[ée]diques? et scientifiques? v[ée]rifiables?)/i;
  const oraclePersona = /Tu peux me poser|Je croise pour toi|je suis là|Séléné[^\n]*(?:guide relationnelle|Oracle)/i;

  assert.match(article, /^lastReviewed:\s*"2026-08-02"/m);
  assert.match(article, /^## En bref$/m);
  assert.match(article, /^## Partir du problème vécu$/m);
  assert.match(article, /^## Mon ex me manque: l'astrologie peut-elle guider une reprise de contact$/m);
  assert.match(article, /^## Peut-on savoir si une relation va durer$/m);
  assert.match(article, /pratique symbolique/i);
  assert.match(article, /\/outils\/synastrie/);
  assert.match(article, /\/outils\/compatibilite/);
  assert.match(article, /https:\/\/www\.arretonslesviolences\.gouv\.fr\/besoin-d-aide\/violences-au-sein-du-couple/);
  assert.match(article, /\b3919\b/);
  assert.match(article, /\b17\b/);
  assert.doesNotMatch(article, fabricatedCertainty);
  assert.doesNotMatch(article, oraclePersona);
  assert.doesNotMatch(article, /NASA/);
});

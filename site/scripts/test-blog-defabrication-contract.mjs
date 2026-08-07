import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const contracts = {
  "signo-ascendente-guia-completa-comprender-ascendente.md": [
    /garantiza la calidad/i,
  ],
  "maisons-astrologiques-guide-interpretation-complet.md": [
    /Statistique Karmastro/i,
    /analyse de 12 000 thèmes/i,
    /Selon l'OMS \(2023\)/i,
    /L'INSEE \(2024\) révèle/i,
    /étude LinkedIn \(2023\)/i,
    /étude Karmastro \(2025\)/i,
    /15 000 thèmes/i,
    /87% de concordance/i,
    /56% de différence/i,
    /23% de changement/i,
    /précision de 0,001°/i,
  ],
  "tema-natale-gratuito-interpretare-carta-astrale-completa.md": [
    /precisione NASA/i,
    /stesse effemeridi utilizzate da NASA/i,
    /affidabilità garantita/i,
    /0,001 secondi d'arco/i,
    /precisione massima/i,
  ],
  "venus-taureau-amour-sensualite.md": [
    /Selon une étude astronomique/i,
    /Une étude de l'INSEE \(2024\)/i,
    /76% des personnes/i,
  ],
  "aspetti-astrologici-congiunzione-quadratura-trigono-opposizione-sestile.md": [
    /Caso reale: Sarah/i,
    /Sarah, 32 anni/i,
    /garantire un'interpretazione accurata/i,
  ],
  "theme-natal-gratuit-interpreter-carte-ciel.md": [
    /Selon une étude IFOP/i,
    /41% des Français/i,
    /garantit des calculs exacts/i,
    /ignore 90%/i,
  ],
  "pleine-lune-gemeaux-communication-adaptabilite.md": [
    /Selon une étude de l'INSEE/i,
    /Sarah, utilisatrice Karmastro/i,
    /Institut de Recherche en Communication/i,
    /Diminution de 30%/i,
    /Augmentation de 15%/i,
    /18% d'engagement/i,
    /valide l'approche traditionnelle/i,
    /24h de potentiel maximal/i,
  ],
  "aspetos-astrologicos-conjuncao-quadratura-trigono-oposicao-sextil.md": [
    /Caso real: Sarah/i,
    /Sarah tem 32 anos/i,
  ],
  "lune-scorpion-emotions-intenses-transformation.md": [
    /étude de l'APEC \(2025\)/i,
    /Astrological Placements and Emotional Processing Patterns/i,
    /Étude sur 1200 sujets/i,
  ],
  "horoscope-du-jour-previsions-astrologiques-fiables.md": [
    /600 millions de personnes/i,
    /5 à 10% de l'information astrologique/i,
    /Les autres 90%/i,
    /même moteur de calcul que le Jet Propulsion Laboratory/i,
    /précision de 0,001 seconde d'arc/i,
  ],
  "signe-scorpion-mysteres-passion-transformation.md": [
    /58% des Français consultent leur horoscope/i,
    /IFOP - Les Français et l’astrologie/i,
  ],
  "compatibilite-taureau-scorpion-attraction-magnetique.md": [
    /\d+% des couples Taureau-Scorpion/i,
    /étude Astrodienst 2025/i,
    /enquête Karmastro 2025/i,
    /INSEE 2024/i,
    /compatibilité physique de 95%/i,
    /astro-thérapeute/i,
  ],
  "widder-sternzeichen-persoenlichkeit-kompatibilitaet.md": [
    /Leidenschaft garantiert/i,
    /Lena, 29, Grafikdesignerin/i,
  ],
  "signe-ascendant-guide-complet-comprendre-ascendant.md": [
    /Pas d'approximation, pas de marge d'erreur/i,
    /garantit la qualité de ce qu'elle produit/i,
    /Clara, 29 ans, ascendant Capricorne/i,
    /Thomas, 42 ans, ascendant Sagittaire/i,
    /Nora, 55 ans, ascendant Balance/i,
  ],
  "tarot-numerologique-fusion-deux-arts-divinatoires.md": [
    /58% des Français/i,
    /IFOP, 2025/i,
    /Marie, \*\*34 ans\*\*/i,
    /IFOP - Les Français et la divination/i,
  ],
  "compatibilite-amoureuse-signes-astrologiques-attirent.md": [
    /73% des Français/i,
    /plus de 10 000 thèmes de couples/i,
    /\d+% de compatibilité/i,
    /68% de réussite/i,
    /30% des couples heureux/i,
    /garantit des calculs au 1\/60ème de degré/i,
  ],
  "cammino-di-vita-1-leadership-indipendenza-numerologia.md": [
    /tre casi reali/i,
    /tre casi di cammino 1 puro veri/i,
    /Irene, 29 anni/i,
  ],
  "comment-calculer-chemin-de-vie-numerologie.md": [
    /Selon une étude IFOP publiée en 2023/i,
    /34% des Français/i,
    /40 000 recherches mensuelles/i,
    /moins de 1% de la population/i,
    /Plus de 10 000 personnes/i,
  ],
  "mapa-astral-gratis-interpretar-carta-natal-completo.md": [
    /precisão nível NASA/i,
    /precisão NASA/i,
    /0,001 segundo de arco/i,
    /Perdes 90% da informação/i,
    /garantir a exatidão/i,
  ],
  "signe-sagittaire-philosophie-soif-aventure.md": [
    /12 450 thèmes natals/i,
    /Selon une étude IFOP \(2024\)/i,
    /étude LinkedIn \(2025\)/i,
    /Université de Californie \(2023\)/i,
    /Thomas \(Sagittaire\) et Léa/i,
    /82% des Sagittaire/i,
    /37% plus de chances/i,
  ],
};

for (const [filename, forbidden] of Object.entries(contracts)) {
  test(`${filename} contains no known fabricated evidence`, () => {
    const source = readFileSync(`src/content/blog/${filename}`, "utf8");
    const matches = forbidden.filter((pattern) => pattern.test(source)).map(String);
    assert.deepEqual(matches, [], `Fabricated markers remain in ${filename}:\n${matches.join("\n")}`);
  });
}

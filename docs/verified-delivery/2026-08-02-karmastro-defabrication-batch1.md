# Karmastro: dé-fabrication éditoriale, batch 1

Date: 2 août 2026
État: branche isolée `codex/karmastro-defab-batch1-20260802`, aucun déploiement production

## Objectif

Retirer ou reformuler les études, statistiques, cas présentés comme réels, attributions et promesses non étayés, sans supprimer l'éditorial astrologique légitime ni changer les URL et intentions déjà indexées.

## Priorisation GSC

Fenêtre: 3 au 31 juillet 2026. La page relationnelle française à 327 impressions est exclue, car elle appartient déjà au lot SEO/GEO précédent.

| Priorité | Article | Impressions | Clics | Position |
|---:|---|---:|---:|---:|
| 1 | `signo-ascendente-guia-completa-comprender-ascendente.md` | 355 | 0 | 50,8 |
| 2 | `maisons-astrologiques-guide-interpretation-complet.md` | 299 | 4 | 12,7 |
| 3 | `tema-natale-gratuito-interpretare-carta-astrale-completa.md` | 166 | 1 | 27,2 |
| 4 | `venus-taureau-amour-sensualite.md` | 163 | 3 | 10,5 |
| 5 | `aspetti-astrologici-congiunzione-quadratura-trigono-opposizione-sestile.md` | 73 | 2 | 7,2 |
| 6 | `theme-natal-gratuit-interpreter-carte-ciel.md` | 68 | 3 | 20,1 |
| 7 | `pleine-lune-gemeaux-communication-adaptabilite.md` | 52 | 0 | 10,2 |
| 8 | `aspetos-astrologicos-conjuncao-quadratura-trigono-oposicao-sextil.md` | 32 | 0 | 6,8 |
| 9 | `lune-scorpion-emotions-intenses-transformation.md` | 29 | 0 | 18,7 |
| 10 | `horoscope-du-jour-previsions-astrologiques-fiables.md` | 21 | 0 | 26,9 |

## Contrats RED

- 10 tests sur 10 échouaient avant correction sur des marqueurs précis de fabrication;
- le garde-fou de langue échouait sur 49 titres français encore présents sur des pages indexées non françaises de `origin/main`;
- le lot de correction des titres appartient à Claude et doit être intégré avant de rendre cette garde bloquante globalement.

## Preuves GREEN

- contrat de dé-fabrication: 10 tests passés sur 10;
- garde de contenu complète: 276 contenus et 271 fragments blog vérifiés;
- garde des liens applicatifs: 271 contenus vérifiés contre 51 routes actives ou historiques;
- contrats de prébuild: 29 tests passés sur 29;
- garde Oracle antibot: 3 tests passés sur 3;
- build Astro: 7 923 pages générées et 1 231 URL dans le sitemap IA;
- `git diff --check`: aucune erreur;
- aucune modification du lock de dépendances.

Le build initial a exposé 19 liens vers six routes applicatives inexistantes dans l'article hebdomadaire. Les corrections déjà validées dans le lot SEO/GEO précédent ont été reprises à l'identique afin que cette branche reste vérifiable indépendamment.

## Vérifications factuelles particulières

- pleine lune du 24 novembre 2026 à 14h54 UTC confirmée par NASA Science;
- résultat Cajochen 2013 reformulé correctement: baisse de l'activité EEG delta en sommeil NREM, et non « 30 % de sommeil profond en moins »;
- résultat contextualisé par l'étude de population Haba-Rubio 2015, qui ne retrouve pas d'effet significatif;
- équivalences trompeuses entre Swiss Ephemeris et NASA supprimées.

## Revue indépendante

- Claude a approuvé les trois articles français les plus lourds après lecture et vérification des marqueurs;
- Claude a ensuite relu le diff complet des sept autres articles, le contrat, son branchement dans la garde et les 19 corrections de liens;
- verdict final direct: `APPROVED`, aucun finding bloquant et aucune sur-suppression détectée;
- le seul lien sémantiquement mal ciblé signalé dans l'article Vénus en Taureau a été corrigé vers le véritable guide du thème natal, puis les contrats, les liens et `git diff --check` ont été revérifiés.

## Conditions de sortie

- les 10 contrats de dé-fabrication passent;
- aucun tiret cadratin ajouté;
- garde de contenu, liens, fragments et build Astro passent;
- diff relu par Claude avec verdict explicite;
- publication sur branche uniquement, sans merge ni production.

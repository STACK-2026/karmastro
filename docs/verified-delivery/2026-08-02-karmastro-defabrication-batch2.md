# Karmastro: dé-fabrication éditoriale, batch 2

Date: 2 août 2026
État: branche empilée `codex/karmastro-defab-batch2-20260802`, aucun déploiement production

## Objectif

Retirer les statistiques, études, cas présentés comme réels, qualifications et garanties non étayés des dix articles suivants dans l'ordre de priorité GSC, sans modifier leurs URL, leur langue ni leur intention de recherche.

## Périmètre priorisé par GSC

Fenêtre: 3 au 31 juillet 2026. Le batch part du commit approuvé `2fff4d0`.

| Priorité | Article | Impressions | Clics | Position |
|---:|---|---:|---:|---:|
| 1 | `signe-scorpion-mysteres-passion-transformation.md` | 17 | 0 | 10,1 |
| 2 | `compatibilite-taureau-scorpion-attraction-magnetique.md` | 16 | 2 | 7,1 |
| 3 | `widder-sternzeichen-persoenlichkeit-kompatibilitaet.md` | 15 | 0 | 7,9 |
| 4 | `signe-ascendant-guide-complet-comprendre-ascendant.md` | 14 | 2 | 10,0 |
| 5 | `tarot-numerologique-fusion-deux-arts-divinatoires.md` | 8 | 4 | 17,2 |
| 6 | `compatibilite-amoureuse-signes-astrologiques-attirent.md` | 8 | 0 | 8,8 |
| 7 | `cammino-di-vita-1-leadership-indipendenza-numerologia.md` | 5 | 0 | 7,0 |
| 8 | `comment-calculer-chemin-de-vie-numerologie.md` | 5 | 0 | 11,2 |
| 9 | `mapa-astral-gratis-interpretar-carta-natal-completo.md` | 5 | 0 | 20,0 |
| 10 | `signe-sagittaire-philosophie-soif-aventure.md` | 5 | 0 | 6,2 |

## Contrats RED

- les 10 contrats du batch 1 passaient encore;
- les 10 nouveaux contrats échouaient avant correction, soit 10 PASS et 10 FAIL;
- chaque échec correspondait à un marqueur précis: faux IFOP, chiffres Astrodienst/INSEE/Karmastro, cas prétendument réels, précision « NASA », garanties ou déterminisme présenté comme factuel.

## Preuves GREEN avant revue

- contrat cumulatif de dé-fabrication: 20 tests passés sur 20;
- garde de contenu et de parcours: 39 tests passés sur 39;
- fragments blog: 271 contenus vérifiés, aucun fragment cassé;
- liens vers l'application: 271 contenus vérifiés contre 51 routes actives ou historiques;
- garde Oracle antibot: 3 tests passés sur 3;
- build Astro: 7 923 pages générées;
- sitemap IA: 1 231 URL générées depuis le sitemap principal;
- `git diff --check`: aucune erreur;
- aucun tiret cadratin dans les dix articles modifiés;
- aucune modification du lock de dépendances.

L'installation locale a signalé six vulnérabilités de dépendances déjà présentes dans l'arbre résolu. Aucun `npm audit fix` n'a été lancé dans ce lot éditorial.

## Revue indépendante

- Claude a d'abord relu cinq articles français, puis les cinq articles restants et le contrat cumulatif;
- une troisième passe a contrôlé exhaustivement le diff `2fff4d0..worktree`;
- aucun résidu IFOP, Astrodienst, INSEE, NASA, étude, statistique ronde ou pourcentage non sourcé n'a été retrouvé dans les dix articles;
- l'intégrité linguistique DE, IT et PT, les sources, les liens, la conservation du volume éditorial et le bornage santé ont été contrôlés;
- verdict final: `APPROVED`, zéro finding bloquant.

Claude a aussi demandé de ne pas multiplier les branches indépendantes. Le batch 2 est donc empilé sur le batch 1 et la prochaine étape sera une branche de convergence unique avant tout nouveau lot ou déploiement.

## Conditions de sortie

- les 20 contrats cumulés passent, dont les 10 nouveaux échouaient avant correction;
- URL, slug et intention de chaque article sont conservés;
- les scénarios nécessaires sont explicitement fictifs ou illustratifs;
- garde complète, liens, fragments et build Astro passent;
- Claude rend un verdict explicite avant commit et push;
- aucun merge ni déploiement production.

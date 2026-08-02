# Karmastro: convergence SEO, confiance et titres localisés

Date: 2 août 2026
État: branche isolée `codex/karmastro-content-cleanup-20260802`, aucun merge ni déploiement production

## Objectif

Réunir sur une seule branche vérifiable les deux lots de dé-fabrication éditoriale, le lot SEO/GEO déjà approuvé et les corrections de titres multilingues détenues par Claude. Cette convergence évite de reconstruire plus tard un état production à partir de branches divergentes.

## Graphe de convergence

- base: batch 1 `2fff4d0`, puis batch 2 `e3bac3c`;
- intégration du lot SEO/GEO `5fad36b` par cherry-pick;
- un seul conflit dans `site/scripts/guard-content.sh`;
- résolution: conservation du superset des contrats dé-fabrication, SEO technique et GEO éditorial;
- commit de convergence SEO/GEO: `5281fe2`.

Le fichier hebdomadaire modifié dans les deux branches ne produisait pas de conflit: les corrections de liens étaient déjà identiques dans la base empilée.

## Premier gate global

Avant les titres:

- garde cumulée: 45 tests passés sur 45;
- Oracle antibot: 3 tests passés sur 3;
- fragments blog: 271 contenus, zéro fragment cassé;
- liens applicatifs: 271 contenus contre 51 routes actives ou historiques;
- build Astro: 7 923 pages;
- sitemap IA: 1 231 URL;
- aucune modification du lock de dépendances.

## Patch titres Claude

- 89 titres localisés: DE 13, EN 11, ES 10, IT 15, PT 11, RU 10, PL 11, TR 8;
- chemins contrôlés: 89 noms de fichiers simples, aucun chemin absolu ou traversant;
- valeurs contrôlées: aucune quote double, barre oblique inverse ou nouvelle ligne susceptible de casser le frontmatter YAML;
- comparaison indépendante avec la source de vérité Claude: 89 titres sur 89 identiques;
- application: 87 lignes remplacées, 2 déjà à jour, aucun fichier manquant;
- l'unique avertissement concernait un titre italien déjà localisé lors du batch 1; le titre final correspond au mapping Claude;
- vérification après application mécanique: 89 titres sur 89 correspondaient au patch et les corps d'article restaient inchangés; trois fichiers ont seulement perdu une ligne blanche terminale en plus de leur ligne `title:`.

## Contrat RED / GREEN

- avant application, la garde conservatrice détectait 58 titres français sur des pages non françaises et échouait;
- après application, la garde passe;
- elle couvre toutes les langues non françaises publiées: AR, DE, EN, ES, IT, JA, PL, PT, RU et TR;
- les 20 contrats cumulés de dé-fabrication passent encore après les changements de titres.

## Revue linguistique croisée

Trois relectures indépendantes ont couvert les 89 titres par groupes DE/EN/ES, IT/PT et RU/PL/TR. Elles ont demandé 21 raffinements après le patch mécanique:

- restitution d'intentions importantes comme « quotidien »;
- suppression de promesses d'exactitude ou de fiabilité objective;
- correction de termes russes, polonais, allemands et turcs trop littéraux;
- harmonisation des huit titres portugais concernés avec le portugais européen et le tutoiement déjà utilisé dans les articles;
- amélioration d'une formulation italienne.

Chaque groupe a relu les titres corrigés et rendu un verdict final `APPROVED`. Aucun français résiduel n'a été détecté.

Le jeu final compte zéro titre dupliqué au sein d'une même langue; le titre le plus long mesure 68 caractères.

## Gate global final

- garde cumulée: 46 tests passés sur 46;
- garde Oracle antibot: 3 tests passés sur 3;
- 20 contrats de dé-fabrication toujours GREEN;
- garde des titres non français GREEN;
- fragments et liens applicatifs propres;
- build Astro final: 7 923 pages;
- sitemap IA final: 1 231 URL;
- `git diff --check`: aucune erreur;
- lock de dépendances inchangé.

## Contre-revue finale

Claude a relu en lecture seule le diff final depuis `5281fe2`:

- union des gardes confirmée sans perte de contrat;
- logique du nouveau test de langue approuvée;
- 87 fichiers vérifiés comme changements de titre uniquement, avec les trois lignes blanches terminales documentées;
- langues et absence de promesses excessives contrôlées sur les titres;
- statut Git conforme au périmètre annoncé;
- verdict final: `APPROVED`.

La branche est prête à être commitée et publiée. Aucun merge ni déploiement production.

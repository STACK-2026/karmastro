# Karmastro: reprise SEO, GEO et confiance avant production

Date: 8 août 2026
État: candidat de production validé localement

## Cause racine

Le travail SEO et GEO du 2 août existait dans quatre commits isolés, mais ces commits n'étaient pas ancêtres de `origin/main`. La branche n'avait jamais fait l'objet d'une pull request. La production continuait donc de servir les anciens contenus et des signaux de confiance non étayés.

Base de reprise et cible de retour arrière: `41f5e7b90dd448ab1b041ec282f1fe3dc00f1603`.

Commits historiques portés sur une branche fraîche:

- `2fff4d0` devient `8411650`, défabrication du premier lot de contenus;
- `e3bac3c` devient `5d0cbd1`, défabrication du second lot de contenus;
- `5281fe2` devient `2fb35d2`, noyau SEO, GEO et confiance;
- `bb8a010` devient `67c14f6`, titres localisés.

Le seul conflit concernait l'article d'horoscope hebdomadaire. La version plus récente de `main` a été conservée afin de ne pas perdre ses liens et son funnel d'acquisition.

## Nettoyage de confiance exhaustif

Le scan de la source après portage trouvait encore:

- 58 blocs `AggregateRating` sans preuve dans les outils localisés;
- 212 champs `reviewedBy` sans relecteur vérifiable dans les articles;
- 270 fichiers concernés au total.

Onze autres champs `reviewedBy` avaient déjà été retirés par les articles portés, ce qui explique l'écart avec les 223 occurrences présentes sur `main` avant reprise.

Un test de contrat a d'abord échoué avec les 270 fichiers fautifs. Le script de migration a ensuite supprimé les métadonnées, puis le même test est passé. Une seconde exécution du script en lecture seule renvoie zéro occurrence et zéro fichier à modifier, ce qui prouve son idempotence.

## Préservation des changements récents

- aucun delta par rapport à `origin/main` sur les fichiers du hotfix des quatre calculateurs français;
- PostHog reste initialisé dans `BaseLayout.astro` et présent dans le rendu compilé;
- le test de comportement confirme que les calculateurs restent identiques à la baseline de production;
- le conflit de portage a été résolu en faveur du contenu plus récent de `main`.

## Preuves fraîches

- garde de contenu: 48 tests passés sur 48;
- garde Oracle antibot: 3 tests passés sur 3;
- build Astro: 7 133 pages générées;
- sitemap IA: 1 233 URL;
- liens: 273 fragments blog et 273 contenus vérifiés contre 51 routes applicatives;
- rendu compilé: zéro `AggregateRating`, zéro propriété de note et zéro `reviewedBy`;
- page article vérifiée: auteur et éditeur pointent vers `https://karmastro.com/#organization`, avec la persona conservée comme simple crédit éditorial;
- page d'accueil vérifiée: une seule entité `Organization` cohérente;
- `git diff --check`: succès;
- ajout de tiret cadratin ou demi-cadratin dans le diff: zéro;
- recherche de secret dans les lignes ajoutées: aucun résultat.

La revue indépendante de Claude sur la source et la production a confirmé la cause racine, le risque d'indexation et la nécessité du portage. La revue finale du diff a aussi été demandée par le bus partagé. L'exécutable Claude local n'étant pas authentifié, aucune modification d'authentification n'a été tentée.

## Risques résiduels et mesure

`npm install` signale huit vulnérabilités de dépendances, dont six classées hautes. Elles ne sont pas introduites par ce diff, aucun verrou de dépendances n'a changé et un `npm audit fix` automatique n'est pas inclus dans cette livraison éditoriale.

L'effet SEO ou GEO ne peut pas être revendiqué au moment du déploiement. Les mêmes intentions doivent être remesurées dans GSC et les moteurs génératifs après indexation, avec une première lecture à J+7 puis une lecture consolidée à J+28.

## Retour arrière

En cas de régression mesurée, revenir au commit de base `41f5e7b90dd448ab1b041ec282f1fe3dc00f1603`. Les quatre lots portés restent séparés dans l'historique afin de permettre un diagnostic ou un retour arrière ciblé avant toute restauration globale.

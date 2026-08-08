# Karmastro: reprise SEO, GEO et confiance en production

Date: 8 août 2026
État: contenu livré par la PR #71, garde anti-régression isolée en follow-up

## Cause racine

Le travail SEO et GEO du 2 août existait dans quatre commits isolés, mais ces commits n'étaient pas ancêtres de `origin/main`. La branche n'avait jamais fait l'objet d'une pull request. La production continuait donc de servir les anciens contenus et des signaux de confiance non étayés.

Base de reprise et cible de retour arrière: `41f5e7b90dd448ab1b041ec282f1fe3dc00f1603`.

Commits historiques portés sur une branche fraîche:

- `2fff4d0` devient `241e579`, défabrication du premier lot de contenus;
- `e3bac3c` devient `3c829d5`, défabrication du second lot de contenus;
- `5281fe2` devient `2acddc6`, noyau SEO, GEO et confiance;
- `bb8a010` devient `4cff1d3`, titres localisés;
- le nettoyage exhaustif des locales est scellé par `cd5e72e`.

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

La revue indépendante de Claude sur la source et la production a confirmé la cause racine, le risque d'indexation et la nécessité du portage. Claude a ensuite publié la PR #71 pendant la contre-vérification Codex. Une comparaison arbre contre arbre montre que son contenu métier et le candidat Codex sont identiques. Seuls le test de contrat, son script de migration et cette preuve restent dans le follow-up.

## Déploiement et vérification publique

- PR livrée: `https://github.com/STACK-2026/karmastro/pull/71`;
- commit de merge: `f918cdd3aa7e1b2ee3b9e1678fb0638a0057f42b`;
- workflow Cloudflare Pages `31222451808`: terminé avec succès;
- cinq URL publiques vérifiées après déploiement: cinq réponses HTTP 200;
- outil anglais ascendant: zéro `AggregateRating` et zéro propriété de note;
- article anglais maisons astrologiques: zéro `reviewedBy` et zéro titre professionnel inventé;
- article français dette karmique: auteur Organization, crédit éditorial Orion et limites symboliques visibles;
- accueil: une seule entité `Organization` et PostHog toujours présent;
- hub relationnel: synastrie, âme sœur, Oracle et avertissements sur la violence présents.

Le workflow Quality Gates de la PR et du merge a échoué uniquement sur le contrôle de longueur des articles. La suppression d'une ligne de frontmatter a fait rescanner les 212 articles et a révélé des stubs préexistants sous le plancher de 1 000 mots. Les jobs build Site, build App, i18n, interdiction des tirets et fuite interprojets sont passés. Le déploiement Cloudflare a lui aussi réussi. Cette dette de contenu n'est pas masquée et doit être traitée comme un chantier éditorial séparé.

## Risques résiduels et mesure

`npm install` signale huit vulnérabilités de dépendances, dont six classées hautes. Elles ne sont pas introduites par ce diff, aucun verrou de dépendances n'a changé et un `npm audit fix` automatique n'est pas inclus dans cette livraison éditoriale.

L'effet SEO ou GEO ne peut pas être revendiqué au moment du déploiement. Les mêmes intentions doivent être remesurées dans GSC et les moteurs génératifs après indexation, avec une première lecture à J+7 puis une lecture consolidée à J+28.

La contre-revue a aussi identifié une bibliographie invérifiable dans `compatibilite-numerologique-calculer-harmonie-couple.md`, ainsi qu'un ensemble plus large d'articles mentionnant études, universités ou statistiques. Ce reliquat ne réintroduit pas les faux signaux structurés retirés ici, mais il doit être audité avant de revendiquer un assainissement éditorial exhaustif du corpus.

## Retour arrière

En cas de régression mesurée, revenir au commit de base `41f5e7b90dd448ab1b041ec282f1fe3dc00f1603`. Les quatre lots portés restent séparés dans l'historique afin de permettre un diagnostic ou un retour arrière ciblé avant toute restauration globale.

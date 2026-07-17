# Karmastro - Vérification de livraison adoption Oracle

> Date : 2026-07-17
> État : pré-live validé, prêt au déploiement contrôlé
> Risque : élevé et borné
> Références : [[2026-07-16-karmastro-audit-profond]], [[2026-07-17-oracle-adoption-observability-design]], [[2026-07-17-oracle-adoption-observability]]

## Résultat

Le lot traite le principal trou vérifié du funnel : 198 calculs d'outil pour seulement 34 clics vers l'Oracle, soit environ 17 pour cent. Il ne modifie ni prix, ni quota, ni produit Stripe, ni webhook, ni contrat d'authentification.

Le parcours des cinq outils prioritaires vers l'Oracle conserve maintenant le contexte utile dans le même onglet et sur la même origine, sans exposer de question ou de donnée de naissance dans l'URL ou les analytics. L'Oracle préremplit le profil et attend le prénom avant d'envoyer une question personnelle.

Le bundle app principal passe de 872,34 Ko et 273,12 Ko gzip à 521,85 Ko et 156,62 Ko gzip. La réduction gzip est de 42,7 pour cent. Chaque visite ne charge plus les onze dictionnaires complets : le français est embarqué et une seule langue supplémentaire est chargée à la demande.

## Matrice exigences vers preuves

| Exigence | Implémentation | Preuve fraîche | Verdict |
|---|---|---|---|
| Aucun profil dans l'URL | transfert versionné `sessionStorage`, URL limitée à `src` | 8 tests Node + 2 tests Chromium | PASS |
| Transfert éphémère | TTL 30 min, skew futur 5 min, suppression avant parse | cas valide, expiré, futur, corrompu et storage bloqué | PASS |
| Cinq outils raccordés | Chemin de vie, Ascendant, Compatibilité, Thème natal, Synastrie | test de contrat source sur les 5 fichiers | PASS |
| Même origine et même onglet | liens `/oracle/?src=slug`, aucun `_blank` | scan statique + navigation Chromium | PASS |
| Partenaire non promu | compatibilité utilise `dateA`, synastrie utilise `p1Data` | test négatif source + revue indépendante | PASS |
| Pas d'auto-envoi personnel incomplet | `currentProfile()` exige prénom et date | Chromium : 0 appel chat avant prénom | PASS |
| Ancien `q` privé nettoyé | script synchrone au début du `<head>` | Chromium : URL nettoyée et analytics sans contenu | PASS |
| Analytics sans PII | propriétés catégorielles et `location.pathname` | inspection payloads interceptés | PASS |
| Premier aha mesurable | entrée, premier retour, second tour, limite, paywall | événements présents dans le code et test navigateur | PASS |
| Oracle unique | anciennes promesses Sibylle et Séléné retirées des 5 pages | scan ciblé sans résultat | PASS |
| Onze langues complètes | 545 clés identiques dans chaque locale | test parité stricte 545 x 11 + gate CI | PASS |
| Aucune mauvaise langue durable | provider attend le dictionnaire avant de rendre | test React non-FR avec fallback neutre | PASS |
| Performance app | dictionnaires dynamiques, Vite 8 | 521,85 Ko / 156,62 Ko gzip | PASS |
| Money-path inchangé | aucun fichier checkout, Stripe, webhook ou prix modifié | revue du diff Claude + scan fichiers | PASS |
| Build global | app, site, contenu, types | 18 tests app, ESLint, TypeScript, 8 050 pages | PASS |

## Vérifications exécutées

### App

- `npm test` : 5 fichiers, 18 tests, 18 PASS.
- `npx tsc --noEmit` : PASS.
- ESLint ciblé sur app, i18n, tests et configuration : PASS.
- `npm run build` avec Vite 8.1.5 : PASS en 855 ms sur la dernière exécution.
- Dictionnaires : 545 clés exactes dans chacune des 11 langues.
- Bundle principal : 521,85 Ko, 156,62 Ko gzip.
- `npm audit --audit-level=high` : 0 vulnérabilité.

### Site

- `npm run test:oracle-handoff` : 8 tests, 8 PASS.
- `npm run guard:content` : PASS, 13 alertes historiques de titres longs en mode informatif seulement.
- `npm run build` avec Astro 6.4.8 : 8 050 pages, PASS.
- Sitemap IA : 1 226 URL générées.
- `npm audit --audit-level=high` : aucun constat haut, modéré ou critique.

Deux alertes basses restent dans l'esbuild interne d'Astro pour un serveur de développement Windows. Karmastro construit sur Node 22 et déploie un artefact statique sur Cloudflare Pages ; ce serveur n'est pas exposé en production et l'environnement de travail vérifié est macOS. La correction imposerait Astro 7.1, changement majeur non nécessaire pour ce risque non exposé. Décision : risque bas accepté, réévaluation lors de la migration Astro 7.

### Navigateur

Les appels Supabase ont été interceptés localement. Aucune donnée, aucun message et aucun événement réel n'a été écrit.

1. Calcul Chemin de vie avec une date de test.
2. Clic vers `/oracle/?src=chemin-de-vie`.
3. Date préremplie, stockage consommé, prénom focalisé et aucun appel chat.
4. Après prénom de test, envoi de la question contextualisée avec le bon profil.
5. Aucun prénom, date ou texte de question dans les payloads analytics.
6. Ancien lien `?q=` nettoyé avant analytics tout en restant fonctionnel.

Résultat Playwright : 2 scénarios, 2 PASS.

## Revue indépendante

Claude a relu le cadrage puis le diff réel non committé.

- Premier verdict : GO avec contrôle demandé sur l'origine du stockage et la suppression de `q` avant analytics.
- Correctifs prouvés : même origine, même onglet, `pathname` uniquement et scrub synchrone avant GA.
- Second verdict : GO pré-live, aucun bloqueur PII, aucun bloqueur money-path.
- Huit claims validés dans les fichiers : ordre des scripts, suppression avant utilisation, cinq CTA, exclusion partenaire, garde prénom, i18n dynamique et absence de mutation Stripe.

Les deux réserves actionnables ont été fermées après la revue : la question historique est toujours consommée même si un handoff plus récent existe, et la parité i18n est désormais stricte au lieu d'un simple smoke test.

## Sécurité et non-actions

- Aucun prix Stripe, Price ID, produit, coupon ou quota modifié.
- Aucun paiement réel ou checkout finalisé.
- Aucun email, OAuth ou message Oracle réel utilisé pour tester.
- Aucune migration SQL, suppression ou écriture en masse.
- Aucun secret ajouté au diff.
- Les dépendances hautes et modérées de l'app et du site ont été corrigées avec des versions compatibles et validées par build.

## Rollback

- Revert du commit de livraison puis redéploiement des artefacts précédents.
- Sans le module de handoff, les outils continuent à ouvrir l'Oracle sans contexte.
- Le format historique `q` reste compatible et est nettoyé avant toute mesure.
- Aucun rollback de base, Stripe ou Edge Function n'est requis.

## Readout produit à 14 jours

- CTR outil vers Oracle : cible supérieure à 25 pour cent, baseline 17 pour cent.
- Deuxième tour après première réponse : cible au moins 35 pour cent.
- Succès de transfert sur les entrées issues des outils : cible au moins 90 pour cent.
- Handoff compte ou pricing parmi les sessions limitées : cible au moins 10 pour cent.
- Aucun test de prix avant 200 vues de paywall correctement instrumentées.

Le prochain choix dépend des données : si le CTR reste bas, itérer le placement et le texte des CTA ; si le deuxième tour reste bas, travailler la réponse et les relances ; seulement ensuite réexaminer quota ou prix.

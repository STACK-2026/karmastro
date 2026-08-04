# Karmastro Oracle conversion: plan d'implémentation

Date: 4 août 2026
Branche: `codex/karmastro-conversion-fix-20260804`
Base: `origin/main` à `69ebd6c`

## Contraintes globales

- Aucun prix, quota, produit Stripe ou contenu de conversation n'est modifié.
- Les événements analytics ne contiennent aucune question, réponse, donnée de naissance, lieu, email ou texte libre.
- Le message en attente App reste éditable, supprimable, consultable et envoyable à sa date de disponibilité.
- Toute navigation post-auth et toute attribution sont allowlistées.
- Production est livrée par petits incréments avec l'artefact précédent enregistré avant déploiement.

## Tâche 1: locale Oracle Site

Fichiers:

- créer `site/src/utils/oracle-locale.mjs`;
- créer `site/scripts/test-oracle-locale.mjs`;
- modifier `site/src/layouts/BaseLayout.astro`;
- modifier `site/src/pages/oracle.astro`.

RED: exécuter `node --test scripts/test-oracle-locale.mjs`; attendre l'absence du module et des comportements query, référent et lien localisé.

GREEN: implémenter l'allowlist, la priorité query puis référent de même origine puis langue du document, et décorer les liens `/oracle/` non français.

Vérification: test ciblé, tests Oracle Site existants, build Site et revue de non-redirection externe.

Rollback: retirer le module et les deux appels; le fallback français historique reste disponible.

## Tâche 2: feedback Site persistant et mesurable

Fichiers:

- créer `site/scripts/test-oracle-feedback-contract-v1.mjs`;
- modifier `site/src/pages/oracle.astro`;
- modifier `analytics/oracle-events-v1.json`;
- modifier `site/package.json` pour exposer les tests ciblés.

RED: exécuter `node --test scripts/test-oracle-feedback-contract-v1.mjs`; attendre l'absence de `introduced_at`, du dénominateur et de l'événement d'échec.

GREEN: ajouter la date contractuelle exacte, mesurer l'exposition, confirmer seulement la persistance, classer les échecs sans détail sensible et afficher un état utilisateur.

Vérification: tests feedback Site et App, test du registre, build Site, recherche de propriétés sensibles.

Rollback: retirer l'UI Site; conserver la migration et les lignes déjà écrites.

## Tâche 3: CTA Étoile App sous flag

Fichiers:

- créer `app/src/lib/oracle-commerce-rollout.ts`;
- créer `app/src/test/oracle-commerce-rollout.test.ts`;
- modifier `app/src/pages/OraclePage.tsx`;
- modifier `app/src/test/oracle-activation-contract.test.ts`;
- modifier `app/.env.example`.

RED: exécuter le test rollout et le contrat activation mis à jour; attendre l'absence du flag et de la navigation pricing.

GREEN: afficher le CTA uniquement au mur authentifié, émettre `paywall_etoile_click`, puis naviguer vers `/pricing?source=oracle_app_limit` sans altérer les contrôles existants.

Vérification: tests rollout, activation, analytics Oracle, mobile viewport, lint et build App.

Rollback: définir `VITE_ORACLE_ETOILE_LIMIT_CTA_ENABLED=false` et redéployer l'App.

## Tâche 4: attribution Pricing jusqu'au checkout

Fichiers:

- créer `app/src/lib/pricing-attribution.ts`;
- créer `app/src/test/pricing-attribution.test.ts`;
- modifier `app/src/lib/postAuth.ts` et son test;
- modifier `app/src/pages/PricingPage.tsx`;
- modifier `site/src/pages/oracle.astro`;
- modifier `analytics/oracle-events-v1.json`.

RED: tester le rejet de sources inconnues, l'acceptation des deux sources Oracle, l'exposition pricing unique et la propagation dans `checkout_started`.

GREEN: encoder la source Site dans `next`, la préserver par post-auth, mesurer `pricing_viewed` après résolution auth et joindre la source au checkout.

Vérification: tests Pricing/post-auth, registre, App complet, et test de navigation sans appel Stripe.

Rollback: accepter encore `/pricing` direct et retirer les query sources; le checkout existant reste inchangé.

## Tâche 5: intégration, revue et livraison

Commandes locales:

- `npm test`, `npm run lint`, `npm run build` dans `app/`;
- scripts Oracle et `npm run build` dans `site/`;
- `git diff --check` et inspection de chaque fichier modifié;
- recherche de secrets et de propriétés analytics sensibles.

Revue:

- conformité aux cinq critères fonctionnels;
- code quality, auth, confidentialité, erreurs, mobile et rollback;
- correction de toute finding critique ou importante avant production.

Livraison:

- enregistrer les déploiements Cloudflare actuels et les checksums des bundles;
- déployer Site, vérifier, puis App, vérifier;
- ne pas appeler Stripe pendant le smoke test;
- publier le bilan et le checkpoint de re-mesure dans le dossier verified-delivery.

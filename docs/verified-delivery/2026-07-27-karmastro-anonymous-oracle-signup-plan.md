# Karmastro: plan Oracle anonyme vers inscription

Date: 2026-07-27
Base: `874873c1e5db1a1031879e75b13d811c1689d881`
Branche: `codex/karmastro-anon-oracle-signup-20260727`

## Tâche 1: politique serveur

Fichiers:

- créer `app/supabase/functions/_shared/oracle-anonymous-policy.ts`;
- créer `app/supabase/functions/_shared/oracle-anonymous-policy.test.ts`;
- modifier `app/supabase/functions/oracle-chat/index.ts`.

Contrat:

- un appel anonyme reçoit un profil vide;
- le contexte anonyme exige l'inscription gratuite et interdit la collecte dans le chat;
- les indices structurés ne sont conservés que pour un utilisateur authentifié.

Commandes:

- RED puis GREEN: `~/.deno/bin/deno test supabase/functions/_shared/oracle-anonymous-policy.test.ts`;
- vérification: `~/.deno/bin/deno check supabase/functions/oracle-chat/index.ts`.

Rollback: revert des fichiers de cette tâche et redéploiement de la version Edge précédente.

## Tâche 2: handoff app

Fichiers:

- créer `app/src/lib/oracle-signup-handoff.ts`;
- créer `app/src/test/oracle-signup-handoff.test.ts`;
- modifier `app/src/pages/OraclePage.tsx`.

Contrat:

- le formulaire anonyme est retiré;
- le CTA existant d'inscription apparaît sur l'état vide;
- le CTA apparaît sous la dernière réponse anonyme terminée;
- le chemin cible est `/auth?next=%2Fonboarding&oracle_session=<session>`.

Commandes:

- RED puis GREEN: `npm test -- --run src/test/oracle-signup-handoff.test.ts`;
- vérification: tests app, ESLint, TypeScript et build Vite.

Rollback: revert des fichiers de cette tâche.

## Tâche 3: intégration et livraison

- inspecter le diff complet et rechercher les données sensibles;
- exécuter toutes les suites concernées;
- relever la version Edge de rollback;
- ouvrir une PR et attendre tous les gates;
- déployer `oracle-chat`, vérifier la version active;
- fusionner et vérifier le bundle live sans envoyer de conversation réelle;
- documenter les preuves dans Obsidian et sur le bus Codex/Claude.

# Karmastro: plan onboarding progressif et Pass Oracle 48 h

Date: 2026-07-28
Base: `019fac20b9b2c8e66a719822a23061651316476f`
Branche: `codex/karmastro-progressive-onboarding-20260728`

## Tâche 1: contrats onboarding en RED

Créer les contrats purs et leurs tests:

- résolution sûre de la destination et de la raison;
- décision de frontière contextuelle;
- propriétés analytics sans PII;
- sauvegarde essentielle partielle;
- absence de scan artificiel;
- gestion explicite de `profile_incomplete`.

Commandes:

```bash
cd app
npm test -- --run src/test/onboarding-flow.test.ts src/test/onboarding-route.test.tsx src/test/onboarding-persistence.test.ts
```

Attendu initial: échec parce que les contrats et le nouveau comportement n'existent pas.

## Tâche 2: onboarding en GREEN

Fichiers principaux:

- `app/src/App.tsx`
- `app/src/pages/OnboardingPage.tsx`
- `app/src/lib/onboarding-flow.ts`
- `app/src/lib/onboarding-analytics.ts`
- `app/src/lib/postAuth.ts`
- `app/src/lib/profile-save-mode.ts`
- `app/src/components/ProfileBoundary.tsx`
- `app/src/pages/OraclePage.tsx`
- `app/src/pages/PricingPage.tsx`
- `app/src/hooks/useUserProfile.ts`
- pages personnalisées concernées
- `app/src/i18n/ui-types.ts`
- les 11 locales UI

Contrat:

- formulaire essentiel en un écran;
- skip explicite et réversible;
- destination interne validée;
- détails avancés facultatifs;
- aucune donnée de démonstration présentée comme personnelle;
- abonnement Étoile accessible sans profil;
- erreur Oracle pending visible.

Vérification ciblée:

```bash
cd app
npm test -- --run src/test/onboarding-flow.test.ts src/test/onboarding-route.test.tsx src/test/onboarding-persistence.test.ts src/test/post-auth.test.ts
```

Rollback: revert des fichiers front de cette tâche.

## Tâche 3: contrats sécurité et Pass en RED

Créer des tests de contrat pour:

- table service-only et unicité par utilisateur;
- durée maximale de 48 h;
- activation idempotente et one-shot;
- kill switch d'émission;
- fair use de 20 messages par heure et 100 requêtes autorisées au total sur 48 h;
- préservation de `has_unlimited_oracle` Stripe et Apple;
- blocage des colonnes profil réservées;
- Edge GET/POST authentifiée;
- état abonnement app distinct du premium commercial.

Attendu initial: échec parce que migration, fonction Edge et client n'existent pas.

## Tâche 4: Pass en GREEN

Fichiers principaux:

- nouvelle migration Supabase datée;
- nouvelle fonction `app/supabase/functions/promotion-pass`;
- helpers purs partagés testés;
- adaptation contrôlée de `increment_oracle_usage`;
- client et composant Pass dans l'Oracle;
- adaptation de `useUserProfile` sans réécrire les champs Stripe;
- événements Oracle ajoutés au registre.

Vérifications ciblées:

```bash
cd app
npm test -- --run src/test/subscription.test.ts src/test/oracle-event-registry.test.ts
```

```bash
docker run --rm \
  -e DENO_DIR=/tmp/deno-dir \
  -v "$PWD:/workspace" \
  -w /workspace \
  denoland/deno@sha256:3ea71953ff50e3ff15c377ead1a8521f624e2f43d27713675a8bed7b33f166aa \
  deno test --frozen supabase/functions/_shared/*.test.ts
```

Rollback: couper les nouvelles émissions, garder l'honneur des Pass actifs, revert front/Edge, migration compensatrice seulement.

## Tâche 5: intégration locale

Exécuter:

```bash
cd app
npm test
npm run lint -- --max-warnings=0
npx tsc --noEmit
npm run build
```

Puis Deno:

```bash
docker run --rm \
  -e DENO_DIR=/tmp/deno-dir \
  -v "$PWD:/workspace" \
  -w /workspace \
  denoland/deno@sha256:3ea71953ff50e3ff15c377ead1a8521f624e2f43d27713675a8bed7b33f166aa \
  deno check --frozen supabase/functions/*/index.ts
```

Et Supabase local:

```bash
./node_modules/.bin/supabase start
./node_modules/.bin/supabase db reset --local --no-seed
./node_modules/.bin/supabase db lint --local --schema public --level error --fail-on error
docker cp supabase/tests/etoile_pass_48h.sql <local-db-container>:/tmp/etoile_pass_48h.sql
docker exec <local-db-container> psql -U postgres -d postgres -f /tmp/etoile_pass_48h.sql
```

Inspecter le diff, le scan secrets, les migrations en attente et obtenir une revue indépendante.

## Tâche 6: livraison onboarding

1. Ouvrir une PR.
2. Attendre tous les quality gates.
3. Vérifier la preview statiquement, avec appels Supabase et analytics interceptés.
4. Relever SHA et déploiement Cloudflare précédent.
5. Fusionner le lot onboarding.
6. Vérifier HTTP 200, assets et marqueurs du bundle live.
7. Mesurer les nouveaux événements avant le Pass.

## Tâche 7: livraison Pass

Avant toute mutation:

```bash
cd app
./node_modules/.bin/supabase migration list --linked
./node_modules/.bin/supabase functions list --project-ref nkjbmbdrvejemzrggxvr
```

Puis:

1. constater et archiver la dérive existante: la table distante des versions ne référence pas l'historique local;
2. interdire `supabase db push --linked`, qui tenterait de rejouer tout l'historique;
3. vérifier schéma, fonctions Apple et empreinte de la migration cible en lecture seule;
4. appliquer uniquement `20260728213000_etoile_pass_48h.sql` dans une transaction SQL ciblée, puis vérifier les objets et permissions avant commit;
5. sauvegarder la table d'historique, puis exécuter uniquement `supabase migration repair 20260728213000 --status applied --linked` après preuve SQL; vérifier qu'une seule ligne a été ajoutée; la réconciliation complète de l'historique est un chantier séparé;
6. déployer uniquement `promotion-pass` et les fonctions réellement modifiées;
7. vérifier CORS, 401 anonyme, metadata table/RPC/policies et version Edge;
8. garder `issuance_enabled=false` tant que la capacité Oracle n'est pas confirmée;
9. sélectionner exactement les 30 derniers comptes éligibles par `auth.users.created_at desc`, après exclusion serveur des abonnés Stripe/Apple et des grants existants;
10. sceller ce manifeste UUID avec empreinte SHA-256, timestamp de coupe et compte exact;
11. appeler `assign_promotion_offers`; la base impose aussi un plafond cumulé de 30 grants par campagne;
12. vérifier que `requested_count`, `assigned_count` et le nombre de grants correspondent au manifeste attendu;
13. publier et vérifier le front du Pass pendant que la campagne reste fermée;
14. définir `offer_ends_at` et `issuance_enabled=true` dans une seule transaction, en toute dernière mutation;
15. vérifier le cron quotidien `karmastro-promotion-turn-retention`;
16. observer erreurs et consommation agrégées, sans PII.

Un canari synthétique complet en production est une mutation séparée et ne sera pas exécuté implicitement.

# Karmastro: livraison vérifiée du parcours payant

Date: 2026-07-26

## Objectif

Fermer les ruptures entre le profil, le checkout Stripe, le retour dans l'app et la guidance mensuelle, sans changer les prix Stripe et sans effectuer de paiement ou d'envoi réel pendant la vérification.

## Base et isolation

- Dépôt: `STACK-2026/karmastro`
- Base observée: `302bd071bb90770d4edac04a56ecfca19e9367e6`
- Branche: `codex/karmastro-paid-plumbing-20260726`
- Worktree isolé: `karmastro-paid-plumbing-20260726`
- Les modifications iOS et i18n déjà présentes dans le worktree principal n'ont pas été touchées.

## Invariants livrés

1. Les offres Étoile mensuelle, Étoile annuelle et Âme Sœur exigent un profil avec prénom et date de naissance avant toute création de client ou session Stripe.
2. Les retours `checkout=success` et `checkout=canceled` sont consommés une seule fois, expliqués à l'utilisateur et nettoyés de l'URL.
3. La guidance mensuelle échoue de façon sûre si un secret requis, Stripe ou le profil manque.
4. Le mode `dry=1` ne génère, n'envoie et n'écrit rien.
5. La copie visible et les emails décrivent un Oracle unique, 2 messages gratuits par jour et Étoile à 5,99 euros par mois.
6. Les témoignages statiques sans provenance et le CTA de crédits sans offre visible sont retirés.
7. Les deux articles qui bloquaient la qualité ne promettent plus 15 outils inexistants et leurs 24 liens morts ont été réparés.

## Observation production avant déploiement

- Projet Supabase: actif, région Europe.
- Table `subscriptions`: 0 ligne, 0 active, 0 profil incomplet, 0 identifiant Stripe dupliqué.
- Contrainte unique présente sur `stripe_subscription_id`.
- Migration de données: non requise.
- Secrets requis présents par leur nom uniquement: `CRON_SECRET`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `STRIPE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_URL`.
- Versions Edge de rollback observées:
  - `stripe-checkout`: 20
  - `send-email`: 25
  - `send-monthly-guidance`: 6

## Vérifications locales

- App Vitest: 20 fichiers, 64 tests.
- Deno partagé: 35 tests.
- TypeScript: vert.
- ESLint: vert, zéro erreur.
- Vite production: vert.
- Contrat commercial site: 3 tests.
- Handoff site vers app: 10 tests.
- Garde de contenu: vert, 269 articles et 51 routes app actives ou historiques.
- Astro production: 8 053 pages.
- Sitemap IA: 1 229 URL.
- `git diff --check`: vert.
- Scan des tirets cadratins et demi-cadratins: vert.

## Déploiement et preuves live

À compléter après les déploiements progressifs et les sondes sans paiement réel.

## Rollback

Le rollback applicatif consiste à restaurer le commit de base ou à faire un revert du commit de livraison, puis à relancer le déploiement normal de `main`.

Pour les fonctions Edge, redéployer les sources du commit de base pour:

- `stripe-checkout`
- `send-email`
- `send-monthly-guidance`

Les versions live précédentes sont consignées plus haut pour vérification dans l'historique Supabase.

## Risques résiduels

- L'envoi mensuel conserve `last_sent_month` comme idempotence fonctionnelle. Un crash entre Resend et l'écriture de cet état peut provoquer un nouvel essai. Une vraie garantie exactement une fois demanderait une migration ou un outbox séparé.
- Aucun paiement réel ni email réel n'est utilisé comme test automatisé.
- Le gain commercial doit être mesuré à J+14 sur les débuts de checkout, retours réussis, profils bloqués et abonnements actifs.

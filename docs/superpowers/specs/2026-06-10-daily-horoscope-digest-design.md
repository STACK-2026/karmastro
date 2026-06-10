# Digest horoscope quotidien aux inscrits — Design (2026-06-10)

## Objectif
Faire revenir les inscrits dormants (0 rétention J+2) en leur envoyant chaque
matin leur horoscope personnalisé par signe. Réutilise l'infra existante.

## Contexte (vérifié 10/06)
- Fonction `send-daily-horoscope` (edge, v14, `verify_jwt=false`, ACTIVE) :
  complète, multilingue, unsubscribe + feedback. Lit `newsletter_subscribers`
  (confirmed=true, unsubscribed=false), récupère `/api/horoscope/<date>.json`,
  rend l'email du `sign_slug` dans la `locale`, envoie via Resend, marque
  `last_sent_at`/`send_count`.
- `pg_cron` job `send-daily-horoscope` ACTIF, `0 5 * * *` (07:00 Paris), POST sans auth.
- `newsletter_subscribers` = 2 lignes, **0 confirmé** → la fonction tourne à vide.
- 14/24 inscrits ont `birth_date` (format propre `YYYY-MM-DD`). Tous `locale=fr`.
- Horoscope API live (HTTP 200, `{date, fr, en}`). Page `/newsletter/unsubscribe` → 200.

## Bug bloquant à corriger (sinon DOA)
`send-daily-horoscope` hardcode `FROM_EMAIL = "Karmastro <noreply@karmastro.com>"`
(apex). Resend **rejette** (`403 karmastro.com domain is not verified` — testé).
Seul `mail.karmastro.com` est vérifié.

## Changements (2 seulement, rien de neuf)
1. **Fix expéditeur** : `FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") || "Karmastro <oracle@mail.karmastro.com>"`.
   Redéploiement via `npx supabase functions deploy send-daily-horoscope
   --project-ref nkjbmbdrvejemzrggxvr --no-verify-jwt` (préserve verify_jwt=false).
2. **Enrôler les 14** dans `newsletter_subscribers` :
   - `sign_slug` calculé depuis `birth_date` (ranges tropicaux standards),
   - `locale='fr'`, `confirmed=true`, `confirmed_at=now()`, `source='app_user'`,
     `unsubscribed=false`, `unsubscribe_token=gen_random_uuid()`,
   - **idempotent** : n'insère que les emails absents de la table (ne touche pas
     aux 2 abonnés existants, pas de doublon ; contrainte unique sur `email`).

## Calcul du signe (tropical, bornes standards)
belier 03-21..04-19 · taureau 04-20..05-20 · gemeaux 05-21..06-20 · cancer 06-21..07-22 ·
lion 07-23..08-22 · vierge 08-23..09-22 · balance 09-23..10-22 · scorpion 10-23..11-21 ·
sagittaire 11-22..12-21 · capricorne 12-22..01-19 · verseau 01-20..02-18 · poissons 02-19..03-20.
Slugs = exactement ceux de `SIGN_NAMES` dans la fonction.

## Hors périmètre (YAGNI v1)
10 inscrits sans `birth_date` ; double opt-in ; multilingue (tous FR) ; nudge "complète ton profil".

## Risques / parades
- Domaine non vérifié → corrigé (changement 1). Re-test d'envoi réel.
- Redéploiement casse le cron si `verify_jwt` change → forcer `--no-verify-jwt`.
- Doublons abonnés → insert filtré sur emails absents.
- Consentement → lien de désabonnement dans chaque mail (vérifié live), source taguée `app_user`.

## Audit final (verification-before-completion)
Après les 2 changements, déclencher la fonction manuellement (POST direct) et prouver :
1. envoi depuis `*@mail.karmastro.com` (domaine vérifié) ;
2. les 14 `delivered` chez Resend, bon `sign_slug` ;
3. `last_sent_at` + `send_count` mis à jour sur les 14 lignes ;
4. test réel du lien d'un `unsubscribe_token` → `unsubscribed=true` (puis remis à false).

# Journal d'évolution — Lecture karmique transactionnelle

> Suivi pas-à-pas de l'implémentation. Mis à jour à chaque étape pour voir l'évolution.
> Spec : `specs/2026-05-29-lecture-karmique-transactionnelle-design.md` · Plan : `plans/2026-05-29-lecture-karmique-transactionnelle.md`
> Branche : `feat/lecture-karmique-transactionnelle`

## Partage du travail (réalité des accès)

| Bloc | Qui | Raison |
|---|---|---|
| Migration `readings` | Claude ✅ | Management API (DDL OK) |
| Code Edge Functions + numérologie + générateur | Claude ✅ | écriture + tests Deno |
| Déploiement Edge Functions | Claude ✅ | `SUPABASE_ACCESS_TOKEN=$PAT npx supabase functions deploy` |
| Edits site (page calculateur + /lecture) | Claude ✅ | repo local |
| **Prix Stripe 4,90€ (LIVE)** | **Augustin** 🔑 | vraies clés Stripe inaccessibles (placeholders dans .env.master, secret only in Supabase, PAT 403) |
| **Webhook Stripe + `STRIPE_READING_WEBHOOK_SECRET`** | **Augustin** 🔑 | idem + écriture secrets Supabase = 403 pour le PAT |
| **Resend (clé Pro + domaine vérifié)** | **Augustin** 🔑 | compte externe, clé signalée invalide le 21/04 |
| **Test de paiement réel** | **Augustin** 🔑 | carte réelle (mode LIVE choisi) |

## État des tâches

| Tâche | Statut | Commit | Note |
|---|---|---|---|
| Branche + journal | ✅ | — | `feat/lecture-karmique-transactionnelle` |
| T1 Migration `readings` | ⏳ | — | via mgmt API |
| T2 Numérologie Deno + tests | ⏳ | — | |
| T3 Générateur lecture + tests | ⏳ | — | |
| T4 `reading-checkout` | ⏳ | — | bloqué price_id Stripe (Augustin) |
| T5 `reading-webhook` | ⏳ | — | bloqué webhook secret (Augustin) |
| T6 `get-reading` | ⏳ | — | |
| T7 email `reading` | ⏳ | — | bloqué Resend (Augustin) |
| T8 Page calculateur (CTA) | ⏳ | — | |
| T9 Page `/lecture` | ⏳ | — | |
| T10 E2E + déploiement | ⏳ | — | bloqué paiement réel (Augustin) |

## Checklist Augustin (actions à faire de ton côté)

- [ ] **Stripe — prix** : Dashboard LIVE → Products → « Lecture karmique » → one-time **4,90 € EUR** → me donner le `price_id` (`price_...`).
- [ ] **Stripe — webhook** : Add endpoint `https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-webhook`, event `checkout.session.completed` → copier le signing secret (`whsec_...`).
- [ ] **Supabase secret** : ajouter `STRIPE_READING_WEBHOOK_SECRET=<whsec_...>` (dashboard Supabase → Edge Functions → Secrets).
- [ ] **Resend** : clé Pro valide + domaine `karmastro.com` vérifié + secrets `RESEND_API_KEY` / `RESEND_FROM_EMAIL` sur Supabase (cf. `audits/karmastro-20260421/diag-emails.md`). *Non bloquant pour la valeur (livraison écran d'abord).*
- [ ] **Test final** : payer 4,90€ réels sur `/outils/dette-karmique/` une fois tout connecté.

## Historique daté

- **2026-05-29** — Diagnostic projet (GSC ×4,3, 18 users, 0€, Oracle/emails morts depuis fin avril). Brainstorming → modèle **transactionnel one-shot**, lecture IA perso, site-natif, checkout invité, prix 4,90€, app gelée. Spec + plan écrits et committés (`8e143f4`, `2e4cb26`). Branche créée. Journal initialisé.

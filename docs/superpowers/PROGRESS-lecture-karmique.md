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
| T1 Migration `readings` | ✅ | `fa54a29` | appliquée via mgmt API, RLS on, 11 cols vérifiées |
| T2 Numérologie Deno + tests | ✅ | `36ec99c` | **7/7 tests Deno verts**, port fidèle de la source |
| T3 Générateur lecture + tests | ✅ | `5f7723b` | **3/3 tests** ; génération live KO (clé Anthropic .env.master sans crédit) |
| T4 `reading-checkout` | ✅ déployé | `e75f70e` | live, répond `READING_PRICE_ID non configuré` (attendu) |
| T5 `reading-webhook` | ✅ déployé | `e75f70e` | live, idempotent ; attend `STRIPE_READING_WEBHOOK_SECRET` |
| T6 `get-reading` | ✅ déployé | `e75f70e` | live, `not_found` OK, n'expose pas l'email |
| T7 email `reading` | ✅ déployé | `e75f70e` | live ; envoi réel dépend de Resend |
| T8 Page calculateur (CTA) | ✅ | `7549b9c` | champ nom + bouton 4,90€, build OK, JSON-LD intact |
| T9 Page `/lecture` | ✅ | `7549b9c` | noindex + exclue du sitemap, build OK |
| T10 E2E + déploiement site | ⛔ bloqué | — | **n'a PAS été déployé en prod** (éviter bouton cassé) ; attend Stripe + paiement réel |

## Vérifications faites (preuves)

- Migration : `to_regclass('public.readings')='readings'`, `relrowsecurity=true`, 11 colonnes.
- Tests Deno : `numerology.test.ts` 7 passed / `reading-generator.test.ts` 3 passed.
- Typecheck Deno : reading-checkout / reading-webhook / get-reading / send-email = `Check` OK.
- Functions live : `get-reading?token=zzz` → `{"status":"not_found"}` ; `reading-checkout` → `{"error":"READING_PRICE_ID non configuré"}` (état attendu).
- Build site : 11 718 pages OK ; `/lecture` noindex + **absente** de sitemap-0 et ai-sitemap (ai-sitemap = 1154, pas de drift) ; `reading-checkout` présent dans le bundle JS de dette-karmique ; FAQPage JSON-LD intact.

## ⚠️ Risque produit identifié

La génération de lecture appelle Claude avec `ANTHROPIC_API_KEY`. La clé de `.env.master` renvoie **"credit balance too low"** (cohérent avec l'Oracle muet depuis le 23/04). Si la clé stockée côté Supabase est la même → la génération échouera en prod (`readings.status='error'`). **À vérifier/financer avant le go-live.**

## Checklist Augustin (actions à faire de ton côté)

- [ ] **Stripe — prix** : Dashboard LIVE → Products → « Lecture karmique » → one-time **4,90 € EUR** → me donner le `price_id` (`price_...`).
- [ ] **Stripe — webhook** : Add endpoint `https://nkjbmbdrvejemzrggxvr.supabase.co/functions/v1/reading-webhook`, event `checkout.session.completed` → copier le signing secret (`whsec_...`).
- [ ] **Supabase secret** : ajouter `STRIPE_READING_WEBHOOK_SECRET=<whsec_...>` (dashboard Supabase → Edge Functions → Secrets).
- [ ] **Resend** : clé Pro valide + domaine `karmastro.com` vérifié + secrets `RESEND_API_KEY` / `RESEND_FROM_EMAIL` sur Supabase (cf. `audits/karmastro-20260421/diag-emails.md`). *Non bloquant pour la valeur (livraison écran d'abord).*
- [ ] **Test final** : payer 4,90€ réels sur `/outils/dette-karmique/` une fois tout connecté.

## Audit final indépendant (sous-agent, 2026-05-29)

**Verdict : conforme avec réserves.** Sécurité (token-only, RLS, pas de PII exposée, signature Stripe sur body brut), SEO (noindex + hors sitemap, JSON-LD intact) et cohérence des types = OK. 5 améliorations relevées → **4 appliquées** (`ab208cd`) :

1. ✅ **Webhook async + lock** : claim atomique `pending→generating` + `EdgeRuntime.waitUntil` → plus de timeout Stripe 10s ni de double-génération sur rejeu.
2. ✅ **Fallback Claude** : `buildFallbackReading` sert une lecture canonique cohérente si l'API Claude échoue (crédit épuisé) → **le client payant a toujours sa lecture**. Critique vu l'état actuel de la clé.
3. ✅ **max_tokens 2200→3500** (anti-troncature) + **`Cache-Control: no-store`** sur get-reading.
4. ⏸️ **Liens cross-domain résiduels** (#4, blocs non-paid de dette-karmique : `:157/:209/:252/:262`) → **laissés en décision** (éditorial/DA, règle CLAUDE.md « ne pas toucher la DA sans demander »). À trancher avec Augustin.

**Vérif fraîche finale (preuves)** : 12/12 tests Deno · typecheck 4/4 `Check` · get-reading live renvoie `content` d'une lecture `ready`, header `no-store`, **email non exposé** (testé+nettoyé) · reading-checkout `READING_PRICE_ID non configuré` (attendu).

## Historique daté

- **2026-05-29** — Diagnostic projet (GSC ×4,3, 18 users, 0€, Oracle/emails morts depuis fin avril). Brainstorming → modèle **transactionnel one-shot**, lecture IA perso, site-natif, checkout invité, prix 4,90€, app gelée. Spec + plan écrits et committés (`8e143f4`, `2e4cb26`). Branche créée. Journal initialisé.

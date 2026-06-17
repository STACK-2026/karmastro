# Karmastro Monétisation & MRR - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire passer Karmastro de 0 € à un MRR récurrent en organique pur, en rendant le funnel visible, en re-routant l'activation vers l'Oracle, en assainissant l'offre autour d'un abonnement Étoile clair et supérieur, et en retenant les abonnés par un rituel email - sans casser le SEO ni la DA.

**Architecture :** Site vitrine Astro (`site/`) + app React (`app/`) + edge functions Deno/Supabase (`app/supabase/functions/`) + Postgres Supabase `nkjbmbdrvejemzrggxvr`. Le funnel est instrumenté côté collecteur (`analytics_events`/`page_views`), l'activation re-routée dans les composants Astro de fin d'outil, la conversion gérée par `oracle-chat` (limite) + page abonnement, la rétention par les fonctions email déjà déployées.

**Tech Stack :** Astro 6, React 19, Tailwind 4, Supabase (Postgres + Edge Functions Deno), Stripe, Node v24.

## Global Constraints

- **T3 = Supabase reste** (`nkjbmbdrvejemzrggxvr`). Ne jamais migrer Auth/paiement.
- **Pull before push** sur `git@github.com:STACK-2026/karmastro.git`, branche `main`.
- **Accents FR obligatoires** sur tout contenu rédactionnel ; garde-fou `~/stack-2026/scripts/check_accents.py --site karmastro`.
- **Aucun lien inter-sites du parc** (footprint PBN) - maillage intra-karmastro uniquement.
- **DA inchangée** sans accord explicite d'Augustin.
- **Marchés prioritaires : FR + EN** ; le reste du multilingue reste en maintenance (pas d'investissement).
- **Mesurer avant/après** : le funnel de la Phase 0 est le juge de chaque changement.
- **Chaque insert collecteur taggé** `site:"karmastro"`.
- **Pas de pub payante** (organique pur).

---

## File Structure

| Fichier | Responsabilité |
|---|---|
| `app/supabase/migrations/<ts>_funnel_events.sql` | Table/contrainte d'événements funnel + vue débotée |
| `app/supabase/migrations/<ts>_funnel_dashboard_view.sql` | Vue SQL `v_funnel_daily` (taux par étape, débotés, FR/EN) |
| `site/src/lib/track.ts` (ou existant) | Helper client d'émission d'événements funnel taggés `site` |
| `site/src/components/ReadingPaywallCTA.astro` | Re-route fin d'outil : pousser l'Oracle + compte (pas que la lecture 4,90 €) |
| `site/src/components/OracleHandoff.astro` (Create) | Bloc « pose ta question à l'Oracle » réutilisable en fin d'outil |
| `app/supabase/functions/oracle-chat/index.ts:414` | Message de limite → vend Étoile + preuve sociale |
| `site/src/pages/abonnement.astro` | Refonte page abo : Étoile héros, comparatif gratuit/Étoile, réassurance |
| `app/src/pages/PricingPage.tsx` | Aligner pricing app sur l'offre Étoile unique |
| `app/supabase/functions/subscription-checkout/index.ts` | Prix Étoile (`SUB_PRICE_ID`) repricé côté Stripe |
| `site/src/components/SocialProof.astro` (Create) | Avis/réassurance injectable au paywall |
| `site/src/components/NewsletterCapture.astro` | Lead magnet renforcé (capture email) |
| `site/public/llms.txt` (Create/Update) | GEO/AI-SEO : citabilité par les LLM |

---

## Phase 0 - Voir le tunnel & quick wins

### Task 1 : Débotage des stats (vue SQL filtrée)

**Files:**
- Create: `app/supabase/migrations/<timestamp>_funnel_dashboard_view.sql`

**Interfaces:**
- Produces: vues `v_sessions_clean`, `v_funnel_daily` interrogeables via Management API / admin.

- [ ] **Step 1 - Écrire la vue de sessions débotées.** Heuristiques (déjà éprouvées sur le parc) : exclure sessions à > 8 pages/session, UA nul, rafales (> N events/min), géo incohérente avec la langue. Concrètement, sur `page_views` :

```sql
create or replace view public.v_sessions_clean as
select session_id,
       min(created_at) as started_at,
       count(*) as page_count,
       max(path) as last_path
from public.page_views
group by session_id
having count(*) <= 8;  -- au-delà = quasi systématiquement bot
```

- [ ] **Step 2 - Écrire la vue funnel quotidienne** (étapes : sessions clean → comptes → 1er msg Oracle → limite atteinte → abo), jointures sur `auth.users`, `oracle_conversations`/`oracle_messages`, `oracle_daily_usage`, `subscriptions`. Une ligne par jour, colonnes par étape.
- [ ] **Step 3 - Appliquer la migration** (Management API SQL ou `supabase db push`), puis **vérifier** : `select * from v_funnel_daily order by 1 desc limit 14;` renvoie des lignes cohérentes (sessions clean << page_views brut).
- [ ] **Step 4 - Commit.**

**Acceptance :** `v_funnel_daily` montre les 5 étapes débotées sur 14 jours ; l'écart bots/humains est chiffré.

### Task 2 : Émettre les événements funnel manquants

**Files:**
- Modify: `site/src/lib/track.ts` (ou helper existant - inspecter d'abord)
- Modify: composants de fin d'outil + `oracle` (points d'émission)

**Interfaces:**
- Consumes: collecteur `analytics_events` (insert anon RLS), tag `site:"karmastro"`.
- Produces: events `tool_result_viewed`, `oracle_first_message`, `oracle_limit_hit`, `paywall_viewed`, `checkout_started`.

- [ ] **Step 1 - Inspecter** le helper de tracking existant (`grep -rn "analytics_events\|track(" site/src app/src`).
- [ ] **Step 2 - Ajouter** les 5 émissions aux bons endroits (fin d'outil = `tool_result_viewed` ; `oracle-chat` réponse = `oracle_first_message` ; limite = `oracle_limit_hit` ; affichage paywall = `paywall_viewed` ; clic checkout = `checkout_started`). Chaque payload taggé `site:"karmastro"`.
- [ ] **Step 3 - Vérifier en live** : déclencher chaque étape, puis `select event_name, count(*) from analytics_events where created_at > now()-interval '1 hour' group by 1;` montre les 5 events.
- [ ] **Step 4 - Commit + déployer le site** (cf. recette deploy karmastro).

**Acceptance :** Les 5 événements remontent réellement dans `analytics_events`, taggés `karmastro`.

### Task 3 : Re-router la fin d'outil vers l'Oracle (activation)

**Files:**
- Create: `site/src/components/OracleHandoff.astro`
- Modify: `site/src/components/ReadingPaywallCTA.astro`
- Modify: pages outils (`site/src/pages/outils/*.astro`) pour inclure le handoff

**Interfaces:**
- Consumes: profil/dates déjà calculés dans la page outil.
- Produces: CTA primaire « Pose ta question à l'Oracle » → `/oracle/` avec contexte + incitation compte.

- [ ] **Step 1 - Créer `OracleHandoff.astro`** : bloc qui, après le résultat gratuit, propose en CTA **primaire** d'ouvrir l'Oracle (pré-rempli du contexte de l'outil) et de créer un compte (argument : historique + carte natale, repris du soft-paywall anon de `oracle-chat`). La lecture one-shot 4,90 € devient CTA **secondaire**.
- [ ] **Step 2 - Intégrer** le handoff dans 2 pages outils pilotes (FR : `theme-natal.astro`, `synastrie.astro`) en gardant la DA.
- [ ] **Step 3 - Vérifier** : build local `npm run build` OK, accents OK (`check_accents.py --site karmastro`), parcours manuel outil → Oracle fonctionne.
- [ ] **Step 4 - Commit + déployer, mesurer** le taux `tool_result_viewed → oracle_first_message` sur 7 jours.

**Acceptance :** Le CTA Oracle est primaire sur les 2 outils pilotes ; le taux d'activation vers l'Oracle est mesuré (baseline → après).

### Task 4 : Preuve sociale + message de limite vendeur

**Files:**
- Create: `site/src/components/SocialProof.astro`
- Modify: `app/supabase/functions/oracle-chat/index.ts:414` (bloc `daily_limit`)

- [ ] **Step 1 - Créer `SocialProof.astro`** (avis/réassurance, cadrage « offert par les astres » déjà utilisé) - contenu réel, pas de faux avis ; à défaut d'avis clients, réassurance honnête (précision Swiss Ephemeris, sans engagement, confidentialité).
- [ ] **Step 2 - Réécrire le message de limite** connecté pour **vendre Étoile** (illimité + mémoire + lectures profondes + guidance incluse), accents FR corrects, 1 ornement max.
- [ ] **Step 3 - Injecter** `SocialProof` au paywall (page abonnement + écran limite Oracle).
- [ ] **Step 4 - Vérifier + commit + déployer.**

**Acceptance :** Le paywall affiche une réassurance honnête ; le message de limite pousse explicitement Étoile.

---

## Phase 1 - Offre & conversion (Étoile héros)

### Task 5 : Assainir le pricing (un seul héros récurrent)

**Files:**
- Modify: `site/src/pages/abonnement.astro`
- Modify: `app/src/pages/PricingPage.tsx`
- Modify: `app/supabase/functions/subscription-checkout/index.ts` (+ price Stripe)

**Interfaces:**
- Consumes: `SUB_PRICE_ID` (Stripe) repricé.
- Produces: offre publique unique « Étoile » à ~9,90 €/mois.

- [ ] **Step 1 - Créer le nouveau prix Stripe** Étoile ~9,90 €/mois (dashboard Stripe), mettre à jour `SUB_PRICE_ID` dans le secret Supabase de la fonction.
- [ ] **Step 2 - Refondre `abonnement.astro`** : Étoile en héros, **comparatif gratuit vs Étoile** (Oracle illimité, mémoire, lectures profondes, guidance mensuelle incluse), réassurance « sans engagement ». Désencombrer les 3 produits à 4,90 € (one-shot conservé mais discret).
- [ ] **Step 3 - Aligner `PricingPage.tsx`** côté app sur la même offre.
- [ ] **Step 4 - Vérifier** : build OK, accents OK, test live `subscription-checkout` renvoie une URL `cs_live_…` au nouveau prix.
- [ ] **Step 5 - Commit + déployer (site + functions).**

**Acceptance :** Une seule offre récurrente lisible en prod ; checkout abo fonctionnel au nouveau prix.

### Task 6 : Boucler la première vente test

- [ ] **Step 1 - Parcours complet réel** (compte → Oracle → limite → abo → paiement test) en mode live restreint.
- [ ] **Step 2 - Vérifier l'enregistrement** : `subscriptions` > 0, `stripe_events` > 0 après l'achat test.
- [ ] **Step 3 - Documenter** tout point de friction observé.

**Acceptance :** ≥ 1 abonnement réel enregistré bout-en-bout (`subscriptions` et `stripe_events` non vides).

---

## Phase 2 - Acquisition organique (FR + EN)

### Task 7 : GEO / AI-SEO (citations LLM)

**Files:**
- Create/Update: `site/public/llms.txt`
- Modify: pages outils (citabilité passage-level, schema)

- [ ] **Step 1 - Invoquer la skill** `mkt-ai-seo` (ou `seo-geo`) pour auditer la citabilité actuelle.
- [ ] **Step 2 - Publier `llms.txt`** + renforcer les réponses courtes citables en tête des pages outils FR/EN.
- [ ] **Step 3 - Vérifier** la présence dans des réponses ChatGPT/Perplexity sur 3 requêtes astro cibles (suivi J+14).

**Acceptance :** `llms.txt` en prod ; baseline de citations LLM établie.

### Task 8 : SEO outils FR+EN + capture email

**Files:**
- Modify: `site/src/components/NewsletterCapture.astro`
- Modify: pages outils FR/EN (maillage interne **intra-site**)

- [ ] **Step 1 - Invoquer** `seo-audit` (ou `seo`) ciblé sur les pages outils FR/EN.
- [ ] **Step 2 - Renforcer la capture email** (lead magnet astro : calendrier lunaire / mini-lecture) dans `NewsletterCapture.astro`.
- [ ] **Step 3 - Maillage interne intra-karmastro** entre outils complémentaires (jamais inter-parc).
- [ ] **Step 4 - Vérifier** : sitemap/IndexNow OK, build OK, accents OK.

**Acceptance :** Capture email renforcée mesurée ; couverture SEO outils FR/EN auditée + actions livrées.

---

## Phase 3 - Rétention / MRR

### Task 9 : Rituels de rétention

**Files:**
- Vérifier/activer: `app/supabase/functions/send-monthly-guidance`, `send-daily-horoscope`, continuité Oracle (mémoire conversation)

- [ ] **Step 1 - Confirmer** que guidance mensuelle + horoscope quotidien partent bien aux abonnés (logs `email_log`).
- [ ] **Step 2 - Renforcer la continuité Oracle** (résumé/mémoire entre sessions - déjà amorcé via `priorSummary`).
- [ ] **Step 3 - Mesurer le churn** dès les premiers abonnés (`subscriptions.canceled_at`).

**Acceptance :** Rituels confirmés actifs ; churn mesurable dès les premiers abonnés.

---

## Self-Review (couverture spec)

- Spec §5 Chantier 1 (Voir) → Tasks 1-2 ✅
- Spec §5 Chantier 2 (Remplir) → Tasks 7-8 ✅
- Spec §5 Chantier 3 (Activer) → Task 3 ✅
- Spec §5 Chantier 4 (Convertir + offre) → Tasks 4-6 ✅
- Spec §5 Chantier 5 (Retenir) → Task 9 ✅
- Spec §7 garde-fous → Global Constraints ✅
- Spec §8 critères de succès → Acceptance par task (funnel visible, vente test, MRR>0) ✅

## Notes de prudence pour l'exécutant

- **Inspecter avant de modifier** chaque fichier (les chemins sont confirmés mais le contenu exact doit être lu - pull before push).
- Le **repricing Stripe** se fait côté dashboard Stripe ; ne pas hardcoder un prix dans le code, utiliser `SUB_PRICE_ID`.
- **Ne pas inventer de faux avis** pour la preuve sociale ; réassurance honnête tant qu'il n'y a pas d'avis réels.
- **Déploiement** : suivre la recette karmastro (site via deploy-site / functions via deploy-functions self-hosted) ; vérifier le live après chaque déploiement.

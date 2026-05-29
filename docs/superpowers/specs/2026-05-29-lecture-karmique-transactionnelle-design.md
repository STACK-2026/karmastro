# Spec — Lecture karmique transactionnelle (site-native, one-shot)

> Date : 2026-05-29 · Projet : karmastro.com · Statut : design validé, prêt pour plan d'implémentation
> Premier outil branché : **`/outils/dette-karmique/`**

## 1. Contexte & diagnostic (le « pourquoi »)

Karmastro = site SEO Astro (karmastro.com) + app React (app.karmastro.com) + Supabase + Stripe LIVE + Claude.
Données au 29/05/2026 :

- **SEO en croissance** : 117 clics / 6 194 impressions sur 28j (×4,3 vs période précédente). Top pages = les calculateurs (`dette-karmique`, `synastrie`, `chemin-de-vie`) et le multilingue (IT≈FR).
- **Mais conversion ≈ 0** : 18 users en 7 semaines, **0€ encaissé** (0 event Stripe), 299 vues app vs 4 097 vues site / 30j. ~99% du trafic est du **one-shot SEO** qui ne revient pas.
- Features de rétention **éteintes** : Oracle non persisté depuis le 23/04, emails Resend KO depuis le 21/04, horoscope daily à 0.

**Décision stratégique (validée avec l'utilisateur) :**

| Axe | Choix |
|---|---|
| Frustration réelle | Tunnel + value prop + monétisation (PAS la techno) |
| Modèle | **Transactionnel one-shot** (pas d'abonnement : on n'a pas la rétention pour le porter) |
| Produit | **Lecture IA personnalisée instantanée** (Claude), à l'écran + email |
| Surface | **Site-natif**, checkout invité (email seul), zéro saut cross-domain, zéro compte avant paiement |
| App React | **Gelée** → devient un espace client léger optionnel (post-achat), hors scope V1 |
| Prix V1 | **4,90 €** par lecture, un seul prix, un seul bouton |

On **ne refait pas l'app**. On ajoute un tunnel transactionnel site-natif par-dessus l'infra existante.

## 2. Objectif & critères de succès

**Objectif V1 :** encaisser le premier euro via `/outils/dette-karmique/`, de bout en bout, sans création de compte.

**Critères de succès (mesurables) :**

1. Un visiteur peut, depuis `/outils/dette-karmique/`, déverrouiller sa lecture complète et la lire à l'écran **sans créer de compte** (email seul au checkout).
2. La lecture payante est **personnalisée** (croise dette(s) détectée(s) + chemin de vie + nombre d'expression + prénom), pas un simple dé-floutage du texte statique existant.
3. Paiement → lecture affichée en < ~15 s (génération Claude), + email de livraison (bonus, non bloquant).
4. La lecture est **re-consultable** via son lien `token` (sans compte).
5. Aucune régression SEO sur la page calculateur (contenu + JSON-LD intacts, page reste statique/indexable).

**Hors scope V1 (YAGNI) :** refonte de l'app, système de comptes complet, crédits, abonnement, PDF, upsell pack, autres outils (synastrie/chemin-de-vie = Phase 2), multilingue de la lecture (FR d'abord, i18n en Phase 2).

## 3. Parcours cible (UX)

```
1. SEO → /outils/dette-karmique/  (page statique existante, top GSC)
2. Calculateur gratuit (JS existant, detectKarmicDebts) → TEASER :
   - EN CLAIR : dette(s) détectée(s) + code + titre + story + pastLife  (le "quoi", l'aha)
   - VERROUILLÉ (flou existant) : currentChallenge + healing  (le "sens / quoi faire")
3. CTA unique : « Débloquer ma lecture karmique complète — 4,90 € »
   (remplace l'actuel lien cross-domain vers app.karmastro.com/oracle)
4. Stripe Checkout INVITÉ (hosted page Stripe, collecte email, 4,90€)
5. Paiement OK → redirect /lecture?token=XXX
6. /lecture poll get-reading(token) :
   - "génération de ta lecture..." (loader DA) le temps que le webhook produise la lecture
   - puis affiche la LECTURE COMPLÈTE personnalisée (Claude) + "envoyée aussi par email"
7. Post-achat (Phase 3) : « Crée ton compte pour retrouver tes lectures »
```

**Règles de tunnel non négociables (issues de l'audit SXO 21/04) :**
- Le teaser donne le *quoi* (le code + la mémoire de vie passée), verrouille le *sens personnel + l'action*.
- **Un seul CTA**, aligné sur l'intent. On supprime le lien cross-domain Oracle de cette page.
- Preuve sociale visible près du CTA (« X lectures déjà débloquées » / avis) — Phase 3.
- **Livraison à l'écran d'abord** : l'email est un bonus. Même si Resend tombe, le client a sa valeur.

## 4. Architecture

**Principe : réutiliser le socle existant, ajouter le strict nécessaire.**

Le site Astro est **static** (pas d'adapter Cloudflare). Stripe, Claude, Resend, Supabase vivent déjà comme **Edge Functions Supabase** (`app/supabase/functions/`) avec leurs secrets. On ajoute des fonctions dédiées à côté plutôt que de dupliquer Stripe/Claude/Resend dans les CF Pages Functions.

```
[Page /outils/dette-karmique/ (Astro static)]
  └─ <script> client : calc (detectKarmicDebts) → teaser + bloc verrouillé
       └─ clic CTA → POST {SUPABASE}/functions/v1/reading-checkout
            body: { tool:"karmic-debt", birthDate, fullName, locale, debtCodes }
            → génère token (uuid) ; Stripe Checkout Session one-time 4,90€
              metadata { token, tool, birthDate, fullName, locale, debtCodes }
              success_url = https://karmastro.com/lecture?token=<token>
            ← { url } → window.location = url
  ── paiement (page hébergée Stripe) ──
[Stripe] → webhook → {SUPABASE}/functions/v1/reading-webhook  (endpoint dédié)
  └─ checkout.session.completed && metadata.tool="karmic-debt"
       ├─ idempotence : skip si readings.token existe déjà en status ready
       ├─ génère la lecture via Claude (reading-generator, modèle Sonnet)
       ├─ UPSERT readings { token, email, tool, inputs_json, content, locale, status:"ready", stripe_session_id }
       └─ invoke send-email { type:"reading", to:email, data:{token, preview} }  (non bloquant)
[/lecture (Astro static)]
  └─ lit ?token= → poll GET {SUPABASE}/functions/v1/get-reading?token=<token>
       → status "pending" : loader ; "ready" : rend content (markdown→html)
```

### Décisions techniques clés

- **Token généré au checkout** (pas au webhook) → le `success_url` le connaît immédiatement ; le webhook le remplit en async ; `/lecture` poll jusqu'à `ready`. Standard, évite la course success_url/webhook.
- **Inputs passés en metadata Stripe** (date, prénom, locale, tool, codes : < 500 char/clé, OK). Pas de pré-insert nécessaire.
- **Endpoint webhook dédié** `reading-webhook` (≠ `stripe-webhook` abonnements) pour ne pas toucher la logique subscription existante. Nécessite un 2e webhook Stripe enregistré avec son `STRIPE_READING_WEBHOOK_SECRET`.
- **`/lecture` reste statique** (le site n'a pas d'adapter SSR) : page coquille + fetch client de `get-reading`. Pas de SSR à introduire.
- **Modèle Claude = Sonnet** (claude-sonnet-4-6) : qualité largement suffisante, coût ~$0,01–0,03/lecture vs 4,90€ → marge ~99%. Output cappé (~1200–1500 tokens).
- **Pas de PII sensible exposée** : `get-reading` ne renvoie que `content`, `tool`, `created_at`, `status` (jamais l'email). Token = uuid v4 non-devinable = capacité d'accès.

## 5. Composants

| # | Composant | Type | Rôle | Réutilise |
|---|---|---|---|---|
| C1 | `reading-checkout` | Edge Function (Deno) | génère token + Stripe Checkout one-time invité + metadata | pattern `stripe-checkout`, Stripe key, LOCALE_CURRENCY |
| C2 | `reading-webhook` | Edge Function (Deno) | paiement → Claude → upsert `readings` → send-email | pattern `stripe-webhook`, Anthropic key |
| C3 | `reading-generator` | module Deno (`_shared/`) | prompt Claude par `tool_type`, lecture perso longue | personas Orion/Sibylle (`oracle-chat`), data numérologie |
| C4 | `get-reading` | Edge Function (Deno) | lecture publique par token (poll) | service key, RLS |
| C5 | `readings` | table Supabase | stockage des lectures | pattern migrations app |
| C6 | TeaserPaywall (script page) | client JS (dans `.astro`) | remplace CTA cross-domain par appel `reading-checkout` | calc existant, DA |
| C7 | `/lecture` | page Astro static | poll + rendu lecture + loader | layout/DA site |
| C8 | type email `reading` | dans `send-email` | email de livraison + lien token | `send-email`/Resend |

### C5 — Table `readings` (migration)

```sql
create table public.readings (
  id              uuid primary key default gen_random_uuid(),
  token           text unique not null,            -- uuid v4, capacité d'accès sans compte
  email           text,                            -- collecté par Stripe, pour l'email + rattachement futur
  tool_type       text not null,                   -- 'karmic-debt' (extensible)
  inputs_json     jsonb not null,                  -- { birthDate, fullName, locale, debtCodes }
  content         text,                            -- lecture générée (markdown)
  locale          text not null default 'fr',
  status          text not null default 'pending', -- pending | ready | error
  stripe_session_id text,
  user_id         uuid references auth.users(id),  -- nullable, rattaché si compte créé plus tard
  created_at      timestamptz not null default now()
);
-- RLS : lecture publique uniquement via fonction get-reading (service key). 
-- Pas d'accès anon direct à la table (token validé côté fonction).
alter table public.readings enable row level security;
-- (aucune policy anon select/insert : tout passe par les Edge Functions en service key)
create index readings_token_idx on public.readings(token);
```

### C3 — Le prompt de lecture (le produit)

La lecture payante doit être **substantiellement supérieure** au texte statique du teaser. Le prompt reçoit :
- la/les dette(s) détectée(s) (code, story, pastLife — comme matière première, pas comme sortie),
- le **chemin de vie** (`calculateLifePath`) et le **nombre d'expression** (`calculateExpression`) calculés depuis date + prénom,
- le prénom (personnalisation directe, ton « tu »),
- la persona (ex. Orion, coach karmique) et la DA éditoriale Karmastro.

Sortie attendue : ~1000–1500 mots, structurée (la mémoire d'âme · ce que ça crée aujourd'hui dans ta vie · le travail de cette incarnation · un rituel concret cette semaine · la question à te poser). Garde-fous : ton bienveillant non anxiogène, pas de promesses médicales/financières, cohérence avec les codes détectés.

## 6. Secrets / config nécessaires

- ✅ déjà présents (Supabase) : `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- ➕ à créer : **prix Stripe one-time « Lecture karmique » 4,90€** (LIVE) → noter le `price_id` (ou créer un price ad hoc à la volée dans la fonction).
- ➕ à créer : **2e endpoint webhook Stripe** → `STRIPE_READING_WEBHOOK_SECRET` ajouté aux secrets Supabase.
- ⚠️ **Resend (P0, dépendance email)** : clé Pro valide + domaine `karmastro.com` vérifié + `RESEND_API_KEY`/`RESEND_FROM_EMAIL` propagés sur Supabase (diag `audits/karmastro-20260421/diag-emails.md`). **Non bloquant pour la valeur** (livraison écran d'abord), mais requis pour l'email de livraison.

## 7. Phasage

- **Phase 0** — Réparer Resend (indépendant, utile partout) + créer prix Stripe + 2e webhook secret.
- **Phase 1** — Tunnel complet sur `dette-karmique` : C5 (table) → C1 (checkout) → C2+C3 (webhook+générateur) → C4 (get-reading) → C6 (CTA page) → C7 (/lecture) → C8 (email). **Premier euro.**
- **Phase 2** — Réplication `synastrie` + `chemin-de-vie` (C1/C2/C3/C6 paramétrés par `tool_type`) + lecture i18n.
- **Phase 3** — Preuve sociale + optim teaser/CTR + espace client léger (re-accès lectures, rattachement `user_id`).

## 8. Risques & mitigations

| Risque | Mitigation |
|---|---|
| Course success_url / webhook (lecture pas prête au redirect) | Token pré-généré + `/lecture` poll jusqu'à `ready` + loader DA + retry |
| Webhook échoue → paiement sans lecture | Idempotence par token ; statut `error` + relance manuelle ; reçu Stripe envoyé par Stripe ; monitoring |
| Coût Claude vs marge | Sonnet + output cappé (~1500 tok) → marge ~99% à 4,90€ |
| Qualité/cohérence lecture (= le produit) | Prompt soigné + garde-fous + QA manuelle sur les 4 dettes avant go-live |
| Régression SEO page calculateur | Ne toucher que le `<script>` (CTA) ; contenu + JSON-LD + teaser statique inchangés ; vérifier build + indexabilité |
| Resend toujours KO au lancement | Livraison écran prioritaire ; email dégradé proprement (`skipped_no_key`) sans casser le flux |
| Abus (token deviné / scraping lectures) | uuid v4 ; `get-reading` ne renvoie pas l'email ; pas d'énumération |

## 9. Vérification de fin (verification-before-completion)

Avant de déclarer terminé :
1. Build site OK (`npm run build`) + page `dette-karmique` toujours indexable (JSON-LD intact).
2. **Test paiement réel bout-en-bout** (Stripe LIVE, vrai 4,90€ ou test mode validé) : calcul → CTA → checkout → /lecture affiche une lecture personnalisée cohérente → ligne `readings.status='ready'` en DB.
3. Email de livraison reçu (si Resend réparé) OU dégradation propre constatée.
4. Re-accès lecture via token (nouvelle session, sans compte) fonctionne.
5. Aucun secret hardcodé ; fonctions lisent depuis l'env Supabase.
6. Audit final croisé (sous-agent) : conformité au spec, sécurité token/RLS, marge coût, SEO non régressé.

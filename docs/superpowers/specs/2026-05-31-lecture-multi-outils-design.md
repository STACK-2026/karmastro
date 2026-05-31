# Spec — Élargir la lecture payante 4,90€ aux outils à trafic (31/05/2026)

## Problème
La lecture karmique payante (4,90€, checkout invité site-natif) n'existe que sur
`/outils/dette-karmique/` (FR+EN), et ne s'affiche QUE si l'utilisateur porte une des
4 dettes karmiques (rares). Résultat : 1 outil sur 10 monétisé, offre invisible pour la
majorité → **0 vente** malgré le trafic SEO. Les outils les plus visités (ascendant 70
vues/14j, synastrie 34, compatibilité 33, chemin-de-vie) n'ont aucune offre.

## Objectif
Rendre la lecture payante disponible sur les outils à trafic, avec une lecture
**pertinente au contexte de chaque outil**, via un moteur de génération **universel**
(une seule logique à maintenir). Supprimer le cul-de-sac « aucune dette ».

## Décision d'architecture : moteur de lecture universel (Approche A, validée)
Un seul `buildReadingPrompt(tool, inputs)` qui s'adapte au `tool`. Le karmic-debt actuel
devient un cas particulier. Backend rendu tool-agnostique via une **whitelist** de tools.

### Contrainte de phasage (moteur Swiss Ephemeris DOWN)
- **Outils LOCAUX** (calcul numérologie client-side, marchent sans moteur) :
  `chemin-de-vie`, `compatibilite`, `annee-personnelle`, `nombre-expression`, `dette-karmique`.
- **Outils MOTEUR** (cassés tant que le moteur est down) :
  `ascendant`, `synastrie`, `theme-natal`, `transits`.

**Phase 1 (ce spec, sans moteur)** : monétiser les 5 outils LOCAUX + fix no-debt.
**Phase 2 (après redémarrage moteur par Augustin)** : ascendant, synastrie, theme-natal, transits.

## Composants

### 1. Backend — `reading-checkout` (tool-agnostique)
- Remplacer `if (tool !== "karmic-debt" ...)` par une **whitelist** `READING_TOOLS`
  (Phase 1 : `chemin-de-vie`, `compatibilite`, `annee-personnelle`, `nombre-expression`, `karmic-debt`).
- Valider les inputs requis selon le tool (la plupart : `birthDate` ; `compatibilite` : 2 dates).
- Passer en `metadata` Stripe : `tool`, `token`, `locale`, + un champ générique
  `inputs` (JSON compact ≤ 500 chars) au lieu du seul `debtCodes`.
- Prix : `READING_PRICE_ID` inchangé (4,90€ flat pour tous).

### 2. Backend — `reading-webhook` (routage par tool)
- Remplacer `if (md.tool !== "karmic-debt" ...)` par `if (!READING_TOOLS.has(md.tool) || !md.token)`.
- Parser `md.inputs` (JSON) → `inputs` passé à `generateReading`.
- `tool_type: md.tool` déjà persisté ; conserver.

### 3. Backend — `reading-generator` (prompt universel)
- `ReadingInput` gagne `tool: string` + un sac `data: Record<string,unknown>`
  (number, title, score, partnerDate… selon l'outil).
- `buildReadingPrompt(input)` : tronc commun (persona Orion, tutoiement, anti-tiret,
  1100-1400 mots, anti-invention, structure : ce que ça révèle / aujourd'hui / rituel
  semaine / question finale) + **bloc de cadrage spécifique au tool** (court switch).
- `buildKarmicDebtPrompt` conservé et appelé par le cas `karmic-debt` (zéro régression).
- `buildFallbackReading` étendu pour ne pas être karmic-only (filet générique par tool).
- Config Gemini déjà durcie (thinkingBudget 1024 + maxOutputTokens 6144).

### 4. Frontend — pattern teaser/CTA réutilisable
Sur chaque page outil Phase 1, après le résultat gratuit :
- Montrer en clair les couches « aha » (nombre, titre, résumé).
- **Flouter** les couches actionnables profondes (qualités/défis/mission ou équivalent)
  avec le `lockedStyle` (blur 7px, pointer-events none).
- Bloc CTA `.km-buy` (gradient violet/ambre) : « Débloquer ma lecture complète — 4,90 € »
  avec `data-*` portant les inputs calculés.
- Handler click → `POST reading-checkout` `{tool, birthDate, fullName?, locale, ...data}`
  → redirection `data.url` (Stripe Checkout invité). Copie fidèle du handler dette-karmique.

### 5. Fix cul-de-sac « aucune dette » (dette-karmique)
Quand `debts.length === 0` : au lieu de la page morte `resultNone`, calculer le
**chemin de vie** et proposer une lecture chemin-de-vie (CTA `tool="chemin-de-vie"`).
Personne ne quitte sans offre.

## Hors-scope (YAGNI)
- Pas de prix variable par outil (4,90€ flat).
- Pas de refonte de l'app React (gelée).
- Pas de traduction des nouveaux CTA au-delà de FR pour la Phase 1 (EN/ES suivront si ça convertit).
- Phase 2 (outils moteur) : spec séparé après redémarrage moteur.

## Critères de succès / vérification
- `reading-checkout` accepte les 5 tools et rejette les autres (test curl par tool → `cs_live` ou 4xx).
- `reading-webhook` route correctement (test simulé metadata par tool).
- `reading-generator` produit une lecture complète, pertinente, non tronquée pour chaque
  tool (finishReason STOP, ≥1000 mots, 0 tiret cadratin) — validé via appel Gemini direct.
- Chaque page outil Phase 1 affiche le CTA et lance un `cs_live` réel (clic → redirection Stripe).
- dette-karmique sans dette affiche désormais une offre chemin-de-vie (plus de cul-de-sac).
- Type-check Deno + build Astro OK. Déployé + vérifié live. Aucune régression karmic-debt.

## Notes accès / déploiement
- Edge functions : `SUPABASE_ACCESS_TOKEN=$SUPABASE_PAT npx supabase functions deploy <fn> --project-ref nkjbmbdrvejemzrggxvr`.
- DB lecture : Mgmt API + UA Mozilla (CF 1010).
- Site Astro : commit→push main → CF Pages (deploy-site.yml).
- Stripe price 4,90€ : `READING_PRICE_ID` (déjà posé). Webhook secret `STRIPE_READING_WEBHOOK_SECRET`.

---
## CLOSURE Phase 1 (31/05/2026) — LIVE + vérifié
Commits : T1 moteur universel + 15 tests Deno ; T2/T3 checkout+webhook tool-agnostiques ;
T4-8 CTA 4 outils + fix no-debt. Build Astro 11982 pages exit 0. Déployé (functions
`--no-verify-jwt` + push main → CF Pages self-hosted `karmastro-site`).
Preuves live : 4 pages HTTP 200 + CTA présent ; dette-karmique no-debt → offre chemin-de-vie ;
checkout e2e les 4 outils → `cs_live_` ; karmic-debt non régressé ; bad tool rejeté ;
génération réelle 1650/1616/2291 mots, 0 tiret, non tronquée.
RESTE = Augustin : (1) test paiement réel 4,90€ (seule validation webhook e2e), (2) Phase 2
(ascendant/synastrie/theme-natal/transits) APRÈS redémarrage moteur Swiss Ephemeris.

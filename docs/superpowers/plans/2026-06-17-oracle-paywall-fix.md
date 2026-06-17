# Fix paywall Oracle (site) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) tracking.

**Goal:** Rendre le paywall de l'Oracle gratuit (`/oracle/`) réellement visible et vendeur quand un utilisateur atteint la limite de 3 messages/jour — c'est le moment de conversion vers l'abonnement Étoile, et il est aujourd'hui invisible.

**Architecture :** Le bug est 100 % côté client. L'edge function `oracle-chat` renvoie déjà un `402` avec un objet `paywall` correct (`message`, `is_anon`, `reason`, `message_count`, `limit`). Mais `site/src/pages/oracle.astro` ne vérifie jamais `resp.ok` : il passe directement en streaming SSE, donc le 402 (JSON, pas du SSE) ne rend rien → l'utilisateur voit le faux message « L'Oracle médite… réessaie ». **Aucun changement serveur nécessaire** (on évite le deploy functions ~24 min risqué).

**Tech Stack :** Astro (site statique), vanilla JS, deploy-site CI (CF Pages, projet `karmastro-site`).

## Global Constraints

- **Pull before push** sur `STACK-2026/karmastro`, branche `main`.
- **Accents FR obligatoires** sur tout texte rédactionnel.
- **DA inchangée** : réutiliser les classes existantes (gradient purple/amber, rounded-2xl, bordures `white/10`).
- **Ne pas casser le streaming** existant (réponse 200 = comportement actuel inchangé).
- **Pas de deploy functions** : le message serveur est réutilisé tel quel.
- **Mesurer** : émettre `oracle_limit_hit` + `paywall_viewed` (cohérent avec `v_cta_funnel_daily` / `analytics_events`).

## File Structure

| Fichier | Responsabilité |
|---|---|
| `site/src/pages/oracle.astro` (Modify) | Détecter le 402, afficher une carte paywall vendeuse (message + bénéfices Étoile + CTA + réassurance), tracker les events |

## Task 1 : Gérer le 402 et afficher un paywall vendeur

**Files:**
- Modify: `site/src/pages/oracle.astro` (fonction `send()`, après le `fetch`)

**Interfaces:**
- Consumes: réponse `402` `{ error:"paywall", paywall:{ message, is_anon, reason, message_count, limit } }` de `oracle-chat`.
- Produces: carte paywall dans le thread + events `oracle_limit_hit`, `paywall_viewed`.

- [ ] **Step 1 — Ajouter une fonction `renderPaywall(pw)`** qui remplace la bulle assistant `out` par une carte :
  - Le message serveur (`pw.message`).
  - 3 bénéfices Étoile (Oracle illimité · lectures profondes · guidance mensuelle) — uniquement si `!pw.is_anon`.
  - CTA primaire : `is_anon` → « Créer mon compte gratuit » (→ `https://app.karmastro.com`) ; sinon → « Passer en Étoile » (→ `/abonnement/`).
  - Réassurance honnête : « Sans engagement · résiliable en un clic ».
  - DA : carte `rounded-2xl bg-gradient-to-r from-purple-400/10 to-amber-300/10 border border-amber-300/30`, CTA en bouton gradient amber/purple (mêmes classes que les outils).
- [ ] **Step 2 — Brancher la détection** dans `send()` : juste après `const resp = await fetch(...)`, si `resp.status === 402` → `const data = await resp.json(); renderPaywall(data.paywall); ...; return;` (avant tout `resp.body.getReader()`). Émettre `km.trackEvent("oracle_limit_hit", {...})` + `paywall_viewed`.
- [ ] **Step 3 — Gérer les autres `!resp.ok`** : afficher le message d'erreur doux existant au lieu de tenter le streaming (robustesse).
- [ ] **Step 4 — Build** `npx astro build` → exit 0, 14040 pages.
- [ ] **Step 5 — Vérifier le dist** : `/oracle/index.html` contient la logique paywall (`status === 402`, `renderPaywall`).
- [ ] **Step 6 — Commit + push** (déclenche deploy-site).
- [ ] **Step 7 — Vérifier live** : `oracle.astro` servi contient le handler 402 ; idéalement déclencher la limite (4 messages) et voir la carte.

**Acceptance :** À la 4ᵉ requête (limite atteinte), l'utilisateur voit une carte paywall claire avec CTA vers Étoile (connecté) ou compte gratuit (anon), au lieu du faux « réessaie ». Events `oracle_limit_hit`/`paywall_viewed` émis. Réponse 200 inchangée.

## Self-Review (couverture)

- Bug racine (402 non géré) → Task 1 Step 2 ✅
- Vendeur (bénéfices + CTA + réassurance) → Step 1 ✅
- Mesure → Step 2 ✅
- Robustesse autres erreurs → Step 3 ✅
- Pas de deploy functions → architecture ✅

## Notes
- Le message serveur reste la source du texte principal (anon vs connecté) — pas de duplication de copy.
- Si plus tard on veut affiner le texte serveur, c'est un deploy functions séparé et délibéré.

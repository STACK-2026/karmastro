# sameAs playbook · Karmastro brand entity

Goal : make Karmastro resolvable as a single entity across LLMs (ChatGPT, Gemini, Claude, Perplexity) and Google's Knowledge Graph. Every new verified profile = one more sameAs URL to push back into `src/utils/seo.ts`.

Currently live in `sameAs` :
- `https://x.com/karmastro` (200)
- `https://github.com/STACK-2026/karmastro` (code source public, trust signal)

## Candidates detected but unclaimed

| Platform | URL | Status | Action |
|---|---|---|---|
| Instagram `@karmastro` | https://www.instagram.com/karmastro/ | 200 | Vérifier que c'est bien toi. Si oui : ajouter à sameAs. Si squatté : ouvrir ticket Instagram pour réclamation de handle. |
| TikTok `@karmastro` | https://www.tiktok.com/@karmastro | 200 | Idem Instagram. |
| YouTube `@karmastro` | https://www.youtube.com/@karmastro | 302 (redirige) | Vérifier la destination. Si chaîne à toi : ajouter. |

## À créer (priorité haute pour l'autorité LLM)

### 1. Wikidata (bloqueur Knowledge Graph Google)
- URL de création : https://www.wikidata.org/wiki/Special:NewItem
- Label FR : `Karmastro`
- Label EN : `Karmastro`
- Description FR : `plateforme d'astrologie et numérologie personnalisée par intelligence artificielle`
- Description EN : `AI-driven astrology and numerology platform`
- Claims à poser :
  - `instance of` (P31) → `software as a service` (Q1368)
  - `official website` (P856) → `https://karmastro.com`
  - `country of origin` (P495) → `France` (Q142)
  - `inception` (P571) → `2026-04-09`
  - `writing language` (P407) → French, English, Spanish, Portuguese, German, Italian, Turkish, Polish, Russian, Japanese, Arabic
- Une fois Q-id attribué (ex: Q123456789), ajouter `https://www.wikidata.org/wiki/Q123456789` dans sameAs.

### 2. LinkedIn Company page
- URL : https://www.linkedin.com/company/setup/new/
- Nom : `Karmastro`
- Slug : `karmastro`
- Catégorie : `Computer Software` ou `E-Learning Providers`
- Taille : `1-10`
- Fondé : `2026`
- Tagline : `L'écosystème spirituel intelligent : astrologie, numérologie, oracle IA.`
- Website : `https://karmastro.com`
- Industry keywords : `astrology, numerology, artificial intelligence, spirituality, personal development`
- Une fois créée : ajouter `https://www.linkedin.com/company/karmastro` dans sameAs.

### 3. Crunchbase
- URL : https://www.crunchbase.com/add-new
- Name : `Karmastro`
- URL : `https://karmastro.com`
- Description : copier la `siteConfig.description`
- Categories : `Artificial Intelligence`, `Consumer`, `Spirituality`
- Founded date : April 2026
- HQ : France
- Founder : Augustin Foucheres
- Une fois créée : ajouter `https://www.crunchbase.com/organization/karmastro` dans sameAs.

### 4. Reddit community
- URL : https://www.reddit.com/subreddits/create
- Name : `r/karmastro`
- Community topic : Astrology
- Description : `Discussions sur l'astrologie et numérologie karmique. Oracle, thème natal, compatibilité.`
- Rules : standard + no self-promo spam
- Une fois créé : ajouter `https://www.reddit.com/r/karmastro` dans sameAs. Reddit corrèle fortement avec les citations ChatGPT (étude AIPRM 2025 : r=0.737).

### 5. Product Hunt launch
- URL : https://www.producthunt.com/products/new
- Name : `Karmastro`
- Tagline : `Ton Oracle karmique 24/7 : astrologie et numérologie par IA.`
- Topics : AI, Personal Productivity, Apps
- Planifier un launch formel après fix P0 (Oracle + emails). Un PH verified = sameAs valide + backlink DR élevé.

## Après chaque création

1. Update `src/utils/seo.ts` → push l'URL dans le tableau `sameAs`
2. Commit + push (le rebuild déclenche une nouvelle indexation)
3. Check via https://search.google.com/test/rich-results : le `Organization.sameAs` doit inclure la nouvelle URL
4. Re-submit sitemap sur GSC

## Pen-names (Sibylle, Orion, Selene, Pythia)

Les 4 guides Oracle apparaissent avec schema `Person` dans les articles blog (`reviewedBy`). Actuellement leur `sameAs` est vide → LLMs leur font faiblement confiance.

Options par ordre d'effort :
- **Minimal** : créer 4 pages `/auteurs/{slug}` avec bio longue + photo IA + liste d'articles review. Peupler `sameAs` dans chaque schema Person avec l'URL de la page auteur dédiée (self-reference acceptée). Effort : 2h.
- **Moyen** : créer un compte Medium ou Substack éditorial par guide avec 2-3 articles signés. sameAs pointe vers le profil Medium. Effort : 4h + génération contenu.
- **Fort** : créer des comptes Instagram dédiés (@orion.karmastro, @sibylle.karmastro, etc.) avec photos cohérentes et 10 posts. Effort : 8h.

Recommandation : partir sur **minimal** maintenant (pages `/auteurs/`), puis progression vers Medium si budget/temps dispo.

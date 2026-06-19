# karmastro.com — site Astro (astrologie / numérologie)

Site SSG multilingue. App : app.karmastro.com (Lovable). Supabase `nkjbmbdrvejemzrggxvr`.
Monétisation : abo Étoile 5,99€/mois (voir mémoire `project-karmastro-monetisation-mrr-plan-17juin`).

## Refs
- **Domaine** : karmastro.com (Astro + CF Pages). Site dans **`site/`**. Repo `STACK-2026/karmastro` (git@).
- **Déploiement = `deploy-site.yml` sur push `main`**. ⚠️ origin diverge souvent (commits CI) -> **`git pull --rebase` avant push** (le `git checkout main` peut buter sur `site/package-lock.json` modifié par le build -> `git checkout -- site/package-lock.json`).
- Multilingue : `LOCALES` = fr (défaut, racine) + en/es/it/pt/de/ar/ja/pl/ru/tr (routes `[lang]/`).

## GEO / citation IA (fait 19/06 ; voir skill `parc-geo-citation`)
- **`/compatibilite/[signe1]-[signe2]`** (144 FR) : TL;DR speakable chiffré + `Dataset` (5 scores) + `FAQPage` + FAQ visible data-driven par combo.
- **Multilingue compat** : `[lang]/compatibilite/[signe1]-[signe2]` localisé + indexé pour **en/es/it/pt/de** (720 pages). Architecture :
  - moteur **`src/data/compatibility-matrix.ts`** : `compatibilityInterpretation(name1,e1,q1,name2,e2,q2, lang)` avec packs de langue (fr gardé byte-for-byte).
  - copie GEO **`src/data/compat-i18n.ts`** : TL;DR + FAQ + verdict par langue (`compatGeo()`, `isCompatLocalized()`, `COMPAT_LOCALES`).
  - **Ajouter une langue** = écrire le pack interp (~16 phrases) dans `compatibility-matrix.ts` + le bloc dans `compat-i18n.ts` + ajouter la locale à `COMPAT_LOCALES`. Le `noindex` se retire tout seul pour les locales de `COMPAT_LOCALES`.
  - Locales NON faites (ar/ja/pl/ru/tr) = contenu FR + **noindex** (volontaire, qualité de trad non auto-vérifiable). Ne pas dé-noindexer sans traduire.
- **Entité** : `Organization.sameAs -> Wikidata Q140289925` dans `src/utils/seo.ts`.
- Les 10 **`/outils/*`** sont DÉJÀ GEO-matures (composant `ToolEditorial.astro` : intro `data-speakable` + HowTo + FAQPage + FAQ visible + sources). NE PAS y retoucher, gain marginal nul.

## Gotchas
- **`/compatibilite/` (index nu) 301-redirige vers `/outils/compatibilite`** -> ne jamais y mettre de schema/contenu citable (page jamais servie). Seules les pages détail `/compatibilite/[a]-[b]` sont servies.
- 0 tiret cadratin (— ni –), accents FR. Sign names localisés via clés i18n (`signs.aries`...).
- llms.txt déjà réaccentué mais N'EST PAS un levier de citation (cf playbook GEO).

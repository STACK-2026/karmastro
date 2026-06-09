# Garde-fou contenu (content guard) — karmastro

## Rôle
`site/scripts/content_guard.py` est le garde-fou contenu commun de la flotte
STACK-2026. Il intercepte, **avant** la mise en production, les defauts recurrents
des blogs-auto :

1. artefacts de generation / tool-call (`</content>`, `</invoke>`, `antml:*`, `<|...|>`) ;
2. frontmatter recopie dans le corps (doublon) ;
3. longueur meta : `title` > 65 (signale), `description` > 180 (clampe) ;
4. `# ` H1 dans le corps (double H1) ;
5. mojibake ;
6. em-dash / en-dash dans le corps.

## Pourquoi sur ce site
Contenu astro/horoscope genere (Gemini). Le `deploy-site.yml` clampe deja la
description a 160, mais ne couvre pas les artefacts de generation ni le double H1.

> **Note importante (regression evitee le 2026-06-09).** Beaucoup d'articles
> karmastro **ouvrent leur corps par un `---` markdown (regle horizontale `<hr>`)**
> suivi d'un bloc TL;DR ou Sommaire. La premiere version du garde-fou prenait ce
> `---` pour un frontmatter recopie et **supprimait tout le corps** jusqu'a la
> regle horizontale suivante (jusqu'a 234 lignes effacees sur un article). Le
> garde-fou a ete corrige (`strip_echoed_frontmatter` ne supprime un bloc
> `---...---` en tete que si son contenu **ressemble vraiment a du YAML
> `cle: valeur`**). Le contenu n'a donc PAS ete modifie sur ce site.

## Prebuild bloquant ajoute
- `site/package.json` : `"guard:content": "bash scripts/guard-content.sh"`.
- `site/package.json` : `"prebuild": "npm run guard:content"` (npm execute `prebuild`
  avant `build` ; le build reste `astro build && node scripts/gen-ai-sitemap.mjs`).
- `site/scripts/guard-content.sh` : verifie les `.md/.mdx` du **dernier commit**
  (`git diff HEAD~1 HEAD` filtre sur `src/content`), **fallback full-scan** sinon,
  **skip propre** si `python3` absent.

## Backfill (one-shot, 2026-06-09)
`python3 site/scripts/content_guard.py --fix site/src/content` sur **260 fichiers** :
aucun fichier corrige apres correction du garde-fou (seulement des `TITLE_LONG`,
non bloquants). Les regles horizontales `---` en tete de corps sont conservees.

## Re-verifier a la main (depuis site/)
```bash
python3 scripts/content_guard.py --check src/content   # gate bloquant
python3 scripts/content_guard.py --fix   src/content   # backfill idempotent
```

## Deploiement
Push sur `main` declenche `Deploy Site - Cloudflare Pages` (runner self-hosted,
`--project-name=karmastro-site`, `workingDirectory: site`). Le prebuild guard
tourne sur le runner avant le build.

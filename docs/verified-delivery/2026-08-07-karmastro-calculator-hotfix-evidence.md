# Preuves de livraison du correctif calculateurs

Dernière mise à jour : 2026-08-07 22:29 CEST

Propriétaire : Codex

Branche : `codex/karmastro-calculator-hotfix-20260807`

Rollback code : `ac1dbe4`

## Résultat visé

Rétablir Ascendant, Synastrie, Thème natal et Transits sans exposer le moteur HTTP au navigateur.

## Baseline

- Production observée avec `http://168.119.229.20:8100` dans les quatre scripts client.
- Navigateur HTTPS : appel bloqué comme contenu mixte et non autorisé par la CSP.
- Prototype Cloudflare Pages Function : tests unitaires verts, mais trois canaris Wrangler réels en `502`; prototype supprimé.
- Moteur direct : `natal-chart`, `transits` et `compatibility` répondaient chacun `200` avec des données synthétiques non sensibles.

## Vérification de l'artefact

| Vérification | Résultat frais |
|---|---|
| `npm run test:astro-proxy` | 9 pass, 0 fail |
| `npm run test:oracle-acquisition-v1` | 4 pass, 0 fail |
| `deno check app/supabase/functions/astro-calculate/index.ts` | exit 0 |
| `deno fmt --check ...` | 2 fichiers conformes |
| `git diff --check` | exit 0 |
| `astro build --silent` | exit 0, 7 265 pages lors du run complet précédent |
| `node scripts/gen-ai-sitemap.mjs` | 1 233 URL |

Le pré-script global `npm run build` reste rouge sur 55 ancres cassées dans deux articles préexistants et non modifiés. La compilation Astro elle-même est verte. La livraison du site utilisera une prévisualisation puis un déploiement contrôlé, sans masquer cette dette de garde.

Empreintes avant déploiement :

- `index.ts` : `1481341e911be57674f2e12d68df12729a0f8b1cdb5f6db7babd44761a270b32`
- `handler.mjs` : `0106770858d667bb6abc3e59195195eb1c1eabccb354d6a9e5fb873001852689`
- Ascendant : `f241eb130c9a2a8bb6c401faeed8fb442f648f515b10f5181e2ae8fbe7da5e71`
- Synastrie : `3c741f526aca2a34bd303f1849cd5a546f193f273190cce45e6ce6009fee47f2`
- Thème natal : `f2c037762f1eeee4565653172f3e9a55a129c23455ab55d40c3af413112a06e9`
- Transits : `12357e48450a0633d748ef24b4642fe8c0f47776ca98fd1096c7a82e8fe5b437`

## Supabase production

Déployé le 2026-08-07 vers le projet `nkjbmbdrvejemzrggxvr` :

- fonction `astro-calculate`, version 1, état `ACTIVE` ;
- `verify_jwt=false`, avec contrôle d'origine applicatif ;
- empreinte Supabase : `033bf82f902ee9e3dfa8b409eda31143aad53497a15c2ccdc55e678f33422c88`.

Canaris distants après déploiement :

| Cas | HTTP | Marqueur |
|---|---:|---|
| `natal-chart` | 200 | `ascendant, aspects, houses, planets` |
| `transits` | 200 | `cosmic, natal_chart, transits` |
| `compatibility` | 200 | `person1_chart, person2_chart, synastry_aspects` |
| origine `https://example.com` | 403 | `forbidden_origin`, sans en-tête CORS permissif |

En-têtes vérifiés sur le canari autorisé : origine exacte Karmastro, `Cache-Control: no-store`, JSON UTF-8 et `X-Content-Type-Options: nosniff`.

## Livraison du site

À compléter après publication : commit, PR, prévisualisation, déploiement production et quatre parcours navigateur.

## Sécurité, risque et rollback

- Aucun payload de naissance n'est journalisé ou persisté par la fonction.
- Les opérations, champs, plages, origine et taille de requête sont bornés ; timeout amont de 15 secondes.
- Risque résiduel : le segment Supabase vers le moteur reste en HTTP.
- Rollback site : redéployer `ac1dbe4`.
- Rollback fonction : laisser la fonction inactive après rollback du site ou supprimer `astro-calculate` si nécessaire.

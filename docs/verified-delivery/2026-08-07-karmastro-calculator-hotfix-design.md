# Correctif HTTPS des calculateurs Karmastro

Date : 2026-08-07

Branche : `codex/karmastro-calculator-hotfix-20260807`

Base : `origin/main` à `ac1dbe4`

## Mission

Rétablir les calculs Ascendant, Synastrie, Thème natal et Transits sur le site public. Les pages HTTPS appellent actuellement `http://168.119.229.20:8100`, ce que le navigateur bloque comme contenu mixte et ce que la CSP n'autorise pas.

## Critères d'acceptation

- Les quatre pages appellent uniquement la fonction HTTPS Supabase `astro-calculate`, déjà autorisée par la CSP.
- Le navigateur ne reçoit plus l'adresse HTTP du moteur dans les bundles de ces pages.
- Le proxy n'accepte que `natal-chart`, `compatibility` et `transits`, en `POST` JSON, avec une taille et des champs bornés.
- Une requête invalide ou une opération inconnue ne déclenche aucun appel au moteur.
- Les échecs amont sont convertis en réponses contrôlées, sans exposer le corps d'erreur du moteur.
- Les tests de contrat, les gardes concernées et le build Astro passent.
- Avant production, un canari réel vérifie les trois opérations sur la fonction Supabase, puis les quatre parcours sur une prévisualisation Cloudflare.

## Cartographie du système

`Navigateur HTTPS` → `Supabase Edge Function astro-calculate` → `Moteur FastAPI Hetzner HTTP:8100`

L'origine Supabase est déjà autorisée par `connect-src`. La fonction ne stocke ni ne journalise le corps des requêtes. Le moteur reste inchangé.

## Décision

Ajouter une Supabase Edge Function publique comme proxy strict. Cette plateforme joint déjà le moteur pour `get-natal-chart` et `oracle-chat`. Le navigateur reste intégralement en HTTPS et la CSP n'est pas élargie.

Le premier prototype utilisait une Cloudflare Pages Function de même origine. Les tests unitaires passaient, mais le canari Wrangler de bout en bout du 2026-08-07 a retourné `502` sur les trois opérations alors que le moteur répondait directement `200`. Cloudflare ne pouvait pas joindre l'IP en port `8100`; ce prototype a donc été retiré avant toute livraison.

Alternatives écartées pour ce lot :

- exposer directement l'IP HTTP dans la CSP : toujours bloqué comme contenu mixte ;
- proxy Cloudflare Pages : échec reproductible `502` vers le port `8100` ;
- modifier DNS, TLS et le VPS : meilleure cible de long terme, mais changement d'infrastructure plus large ;
- dupliquer le calcul dans le navigateur : divergence fonctionnelle et maintenance accrue.

## Sécurité et confidentialité

Les dates, heures et coordonnées de naissance transitent déjà vers le moteur pour produire les calculs. Le proxy ne persiste pas ces données et ne les écrit pas dans les logs. Les opérations, types, plages numériques, taille du corps et origine du navigateur sont filtrés. Le CORS autorise uniquement Karmastro, ses previews Cloudflare et le développement local. Un délai maximum borne l'appel amont.

Risque résiduel : le dernier segment Supabase → moteur reste en HTTP. La mise sous TLS du moteur constitue un chantier séparé recommandé.

## Risque, blast radius et rollback

Risque : moyen. Surface publique, mais modification limitée aux quatre calculateurs et à une route additive.

Blast radius : `/outils/ascendant/`, `/outils/synastrie/`, `/outils/theme-natal/`, `/outils/transits/` et la nouvelle fonction `astro-calculate`.

Rollback : rétablir le déploiement du commit `ac1dbe4` ou revert le commit du correctif, puis supprimer ou laisser inactive la fonction additive. Aucun schéma, secret ou état persistant n'est modifié.

# Karmastro Oracle conversion: design

Date: 4 août 2026, 17:56 CEST
Propriétaire d'exécution: Codex
Approbateur production: utilisateur Karmastro dans cette conversation
Environnements: worktree isolé, puis Cloudflare Pages production par incrément séparé

## Mission

Rendre le chemin Oracle vers Étoile visible, attribuable et mesurable, tout en corrigeant la langue des visiteurs internationaux et le contrat de feedback Site. La valeur attendue est de distinguer une absence d'intention d'achat d'un tunnel qui ne présente pas ou ne mesure pas correctement l'offre.

## Périmètre

Inclus:

- résolution de locale Site depuis `?lang`, le référent interne ou la langue du document;
- ajout automatique de `?lang=<locale>` aux liens Oracle sur les pages non françaises;
- feedback Site persistant avec le contrat v1 déjà migré en production;
- mesure sans contenu de l'exposition, du succès et de l'échec du feedback;
- CTA Étoile dans le mur App authentifié, sous flag daté et réversible;
- attribution `oracle_app_limit` et `oracle_site_limit` jusqu'à `pricing_viewed` et `checkout_started`;
- conservation du message en attente et de ses contrôles;
- preuves locales, revue, déploiement progressif et smoke tests publics.

Exclus:

- changement de prix, de catalogue Stripe ou de produits;
- nouvelle migration de données ou modification des lignes feedback existantes;
- modification des quotas Oracle;
- activation ou copie d'une clé PostHog App;
- analyse de contenu intime ou export de messages utilisateurs.

## Source de vérité au départ

| Surface | Source sélectionnée | Preuve du 4 août 2026 | Chemins exclus |
|---|---|---|---|
| Base Git | `origin/main` à `69ebd6c` | `git fetch origin`, puis worktree isolé | worktree principal très sale |
| App live récente | delta du worktree `karmastro-app-deploy-20260802` sur `5ed9a80` | bundle public `index-Cn1QkWaU.js` et Oracle `OraclePage-DvR5mUJo.js` observés pendant l'audit | anciennes pages App de `origin/main` sans feedback v1 |
| Site | dernier `origin/main`, avec fonctions PostHog/consentement déjà déployées reportées séparément | bundle Oracle public `CLo7iSwz.js` observé pendant l'audit | copie complète de l'ancien fichier Oracle du worktree principal, car elle régressait les contrats activation et anti-bot |
| Données | Supabase production | migration feedback v1 présente, 0 feedback récent et RLS exigeant `introduced_at` | aucun secret et aucun contenu de conversation |
| Mesure | Supabase analytics et PostHog EU | 15 sessions paywall, 0 CTA Étoile, 0 checkout sur 7 jours | aucune conclusion de prix avant 200 paywalls correctement mesurés |

État sale avant travaux: les worktrees existants contiennent des changements utilisateur. Aucun n'est modifié. Le travail se fait dans `/Users/lestoilettesdeminette/karmastro-conversion-fix-20260804` sur `codex/karmastro-conversion-fix-20260804`.

## Comportement actuel reproduit

- Les tests App ciblés passent: 5 fichiers, 22 tests.
- Les tests Site Oracle passent après ajout de la version de parcours Étoile Pass déjà présente dans le registre.
- Le code Site live omet `introduced_at` dans l'insert feedback et ne mesure pas `oracle_feedback_viewed`.
- Les liens outils internationaux pointent vers `/oracle/` sans locale.
- Le mur App authentifié conserve la question mais ne propose pas de chemin vers `/pricing`.
- Pricing mesure `checkout_started` mais pas son exposition ni la source Oracle.

## Architecture choisie

1. Un module Site pur `site/src/utils/oracle-locale.mjs` normalise les dix locales publiques, résout la locale Oracle et localise un lien de même origine. `BaseLayout.astro` l'applique aux liens `/oracle/`; `oracle.astro` réutilise le même résolveur.
2. Le feedback Site utilise les constantes exactes `contract_version = 1` et `introduced_at = 2026-08-02T13:34:17.000Z`. Les événements Supabase et PostHog restent sans question, réponse, date de naissance, lieu, email ou commentaire.
3. Un flag App `VITE_ORACLE_ETOILE_LIMIT_CTA_ENABLED`, actif sauf valeur explicite `false`, porte une date d'introduction et un identifiant de rollout. Le CTA ne s'affiche que sur `authenticated_interim_limit_v1`.
4. Le CTA émet `paywall_etoile_click` avant la navigation vers `/pricing?source=oracle_app_limit`. Le Site encode `/pricing?source=oracle_site_limit` dans le retour post-auth.
5. `postAuth.ts` n'autorise qu'une source pricing allowlistée. `PricingPage.tsx` mesure une exposition unique et ajoute la même attribution au checkout.
6. Le mur commercial Site lit sa copie depuis le même module de locale et reste intégralement traduit en français, anglais, espagnol, italien, portugais et allemand; les autres locales publiques utilisent l'anglais.
7. Le workflow Site injecte explicitement les trois variables publiques déjà exposées par la production (`PUBLIC_POSTHOG_KEY`, `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`) afin qu'un rebuild automatique ne retire pas la mesure ni la persistance du feedback.

## Risque, sécurité et rollback

Classe de risque: haute, car le changement touche un chemin public, l'authentification et l'entrée du tunnel de paiement. Aucun paiement n'est déclenché automatiquement et aucun prix n'est modifié.

| Risque | Prévention | Détection | Rollback |
|---|---|---|---|
| CTA affiché au mauvais mur | garde stricte sur `authenticated_interim_limit_v1` | test de contrat App | flag à `false`, puis redéploiement App |
| redirection externe ou query injectée | allowlist de destination et de source | tests `postAuth` et attribution | retour au commit Cloudflare précédent |
| fuite de contenu vers analytics | propriétés construites par helpers, aucun texte accepté | tests de contrat PostHog et registre | désactivation PostHog, conservation du tracker Supabase minimal |
| feedback annoncé sans persistance | confirmation uniquement sur HTTP succès ou doublon 409 | test du payload et événement d'échec | retrait du widget, migration additive conservée |
| mauvaise langue | query prioritaire, référent de même origine, allowlist | tests purs sur IT, ES, PT et entrées hostiles | retrait du décorateur de liens |
| régression du checkout | aucun changement du endpoint ni du catalogue | build, tests Pricing, smoke public sans achat | rollback Pages vers l'artefact pré-déploiement |

Déclencheurs de rollback: build live différent de l'artefact vérifié, redirection hors allowlist, erreur JavaScript sur Oracle/Pricing, disparition du flux de question en attente, ou erreur feedback systématique. Les identifiants exacts des déploiements Cloudflare précédents seront capturés avant chaque mutation production.

## Critères d'acceptation observables

- depuis une page IT, ES ou PT, le lien Oracle porte la locale et la requête `oracle-chat` reçoit cette locale;
- un référent interne localisé restaure la locale si un ancien lien sans query subsiste;
- le premier feedback Site envoie `introduced_at`, persiste ou affiche une erreur claire, et produit un dénominateur `oracle_feedback_viewed`;
- le mur App authentifié affiche le CTA traduit quand le flag est actif, sans supprimer les quatre actions du message en attente;
- le clic CTA produit `paywall_etoile_click` et arrive sur Pricing avec une source allowlistée;
- Pricing produit `pricing_viewed`; `checkout_started` conserve la source sans changer le prix ni déclencher un achat pendant la vérification;
- tests ciblés, suites affectées, lint, builds et `git diff --check` passent;
- après déploiement, Oracle Site, Auth App et Pricing répondent en HTTP 200 et les bundles publics contiennent les marqueurs attendus.

## Re-mesure

Source: Supabase analytics, complétée par PostHog EU pour le Site.

Funnel principal: `paywall_viewed -> paywall_etoile_click -> pricing_viewed -> checkout_started -> checkout.session.completed`.

Premier checkpoint: 48 heures après déploiement. Décision prix interdite avant 200 impressions paywall correctement attribuées. Propriétaire: produit Karmastro, avec synthèse Codex sur demande.

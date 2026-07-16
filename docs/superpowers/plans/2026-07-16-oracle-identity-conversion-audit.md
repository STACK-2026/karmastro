# Karmastro - Oracle, identité et conversion - plan d'implémentation

**Objectif :** transformer le premier intérêt Oracle en expérience personnalisée, sûre et mesurable, puis en parcours Étoile cohérent.

## Lot 1 - Frontière d'identité serveur

- [ ] Extraire les validateurs et la fusion de profil dans `_shared/oracle-request.ts`.
- [ ] Écrire les tests RED : `userId` client ignoré, dates normalisées, profil DB prioritaire, propriété de conversation, limites de payload.
- [ ] Résoudre le JWT dans `oracle-chat`, charger le profil serveur et refuser une conversation étrangère.
- [ ] Remplacer toutes les utilisations de l'identité brute du body par l'identité résolue.
- [ ] Vérifier : tests unitaires, analyse statique ciblée, appel négatif sans session et bearer invalide.

## Lot 2 - Continuité site vers app

- [ ] Écrire les tests RED du sanitizer de destination post-auth.
- [ ] Capturer `oracle_session` et `next` dans l'app.
- [ ] Réclamer une session aussi au chargement avec une session Auth existante, pas seulement sur l'événement `SIGNED_IN`.
- [ ] Restaurer la destination après login, OAuth et onboarding.
- [ ] Faire envoyer le vrai JWT par `OraclePage` et une date ISO.

## Lot 3 - Premier aha sur l'Oracle public

- [ ] Ajouter le formulaire léger de profil avant les starters personnels.
- [ ] Envoyer le profil au serveur et conserver `conversation_id` entre les tours.
- [ ] Ajouter le handoff vers l'app avec la session anonyme.
- [ ] Simplifier le paywall : Étoile principal, lecture one-shot secondaire, date préremplie, suppression de la capture newsletter concurrente.
- [ ] Instrumenter `oracle_profile_started`, `oracle_profile_submitted`, `oracle_handoff_click` et garder les événements checkout existants.

## Lot 4 - Offre, UI et performance

- [ ] Corriger les copies 2 messages / Oracle unique sur le site et l'app.
- [ ] Désencombrer le pricing autour d'Étoile sans changer les prix Stripe.
- [ ] Lazy-loader `OraclePage` et mesurer les chunks produits.
- [ ] Corriger l'overflow des suggestions et réduire l'obstruction de la bannière cookies.
- [ ] Corriger la vue funnel obsolète via une migration réversible.

## Lot 5 - Vérification et livraison

- [ ] Tests app, builds app/site, lint ciblé, garde-fou accents et scan secrets.
- [ ] Revue indépendante du diff et résolution des constats critiques.
- [ ] Pull/rebase, commit atomique, push et observation des déploiements.
- [ ] Déployer `oracle-chat` progressivement puis vérifier les contrats live sans consommer de paiement.
- [ ] Rejouer Lighthouse et les requêtes analytics de référence.
- [ ] Livrer le rapport audit avec métriques, conclusions, changements et backlog priorisé.

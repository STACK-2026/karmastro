# Karmastro - Adoption Oracle, mesure et performance - plan de livraison

**Objectif :** augmenter le passage outils vers Oracle, éliminer la ressaisie évitable, obtenir une mesure fiable du premier aha et alléger le pricing sans toucher au contrat commercial.

## Lot 0 - Gate de conception

- [x] Reprendre une baseline fraîche de production et des builds locaux.
- [x] Cartographier les données privées, les frontières de confiance et le rollback.
- [x] Écrire le contrat de transfert, la taxonomie et les critères d'acceptation.
- [x] Obtenir une revue indépendante du cadrage avant mutation produit.

## Lot 1 - Transfert sûr et testé

- [x] Écrire les tests RED du validateur : schéma, limites, expiration et consommation unique.
- [x] Implémenter le module navigateur `kmOracleHandoff`.
- [x] Brancher le tracker sur les CTA Oracle sans placer de question ou profil dans l'URL.
- [x] Vérifier qu'aucune propriété analytics ne reçoit de contenu privé.

## Lot 2 - Cinq outils vers Oracle

- [x] Chemin de vie : transmettre la date de la personne et une question contextualisée.
- [x] Ascendant : transmettre date, heure et lieu de la personne.
- [x] Compatibilité : transmettre uniquement la date de la personne courante.
- [x] Thème natal : transmettre date, heure et lieu de la personne.
- [x] Synastrie : transmettre uniquement le profil de la première personne, jamais celui du partenaire.
- [x] Remplacer les promesses Sibylle et Séléné par l'Oracle unique.

## Lot 3 - Aha Oracle et observabilité

- [x] Écrire les tests RED de consommation et du blocage d'auto-envoi sans prénom.
- [x] Consommer le transfert une seule fois et préremplir le profil.
- [x] Nettoyer le paramètre historique `q` de l'URL.
- [x] Ajouter `oracle_entry_viewed`, `oracle_first_response` et `oracle_second_turn`.
- [x] Déclencher `oracle_profile_started` au premier focus réel.
- [x] Vérifier les événements avec une session de test, sans message privé dans les propriétés.

## Lot 4 - Bundle i18n et pricing

- [x] Écrire le test de parité de clés pour les onze langues.
- [x] Séparer types, français de référence et dictionnaires dynamiques.
- [x] Ajouter le provider i18n au point d'entrée app.
- [x] Vérifier toutes les routes app, TypeScript et le fallback français.
- [x] Comparer le poids des chunks à la baseline ; Lighthouse live reste au lot de déploiement.

## Lot 5 - Vérification indépendante

- [x] Rejouer tous les tests et builds depuis un état propre.
- [x] Scanner secrets, PII dans les URLs, anciennes promesses et régressions de contrats.
- [x] Tester les chemins négatifs : storage interdit, payload corrompu, expiré et langue incomplète.
- [x] Faire relire le diff final indépendamment et traiter tout constat critique ou élevé.
- [x] Produire la matrice exigences vers preuves et le journal des commandes.

## Lot 6 - Livraison et contrôle live

- [x] Synchroniser avec `origin/main`, résoudre les divergences sans écraser les changements tiers.
- [x] Committer par surface cohérente et pousser `main`.
- [x] Observer les déploiements app et site jusqu'au vert.
- [x] Vérifier les cinq CTA et l'Oracle sur mobile et desktop.
- [x] Rejouer Lighthouse pricing et contrôler l'absence d'erreurs client.
- [x] Envoyer à Claude et au propriétaire le bilan, les preuves, le rollback et les métriques à surveiller sur 14 jours.

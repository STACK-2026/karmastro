# Karmastro: onboarding progressif et Pass Oracle 48 h

Date: 2026-07-28
Propriétaire: Codex
Base: `019fac20b9b2c8e66a719822a23061651316476f`
Environnements cibles: app Karmastro, Supabase

## Décision

L'onboarding forcé est remplacé par un profil essentiel enregistrable en un écran et skippable. Les surfaces qui nécessitent un profil affichent une frontière contextuelle au lieu de données de démonstration. L'Oracle, Learn, Settings et Pricing restent accessibles sans profil.

Le test de réactivation ne sera pas un e-mail promotionnel aux derniers inscrits: aucun consentement marketing exploitable n'a été trouvé. Il prendra la forme d'un Pass Oracle 48 h activé volontairement dans l'app, sans carte bancaire et sans modifier les états Stripe.

## Preuves de départ

- Parmi les 15 derniers comptes, 15 ont vu l'onboarding et 1 seul l'a terminé.
- Avant le 18 juillet, 12 profils sur 14 étaient complets; depuis le 20 juillet, 2 sur 27.
- Sur les 30 derniers inscrits, 5 profils sont complets et 3 personnes ont utilisé l'Oracle.
- Sur 30 jours, 7 profils complets sur 17 ont conversé, contre 1 profil incomplet sur 27.
- Les 122 sessions d'onboarding ont une médiane de 74 secondes; 50 durent moins de 10 secondes.
- Sur 7 jours, l'Oracle compte 102 conversations mais seulement 5 avec au moins deux tours.
- Aucun opt-in marketing confirmé n'est disponible sur les 30 derniers inscrits.

Les données agrégées ne contiennent ni adresse e-mail, ni nom, ni identifiant utilisateur.

## Objectifs

1. Permettre de découvrir l'app et l'Oracle sans compléter le profil.
2. Réduire le chemin essentiel à `first_name` et `birth_date`.
3. Expliquer clairement que le profil évite de ressaisir les informations et améliore la personnalisation.
4. Ne jamais présenter le profil de démonstration comme celui d'un utilisateur réel.
5. Mesurer séparément vue, démarrage, sauvegarde, skip et destination.
6. Proposer un Pass Oracle de 48 h, one-shot, explicitement activé dans l'app.
7. Préserver les abonnements Stripe et Apple comme sources de vérité commerciales.
8. Protéger côté base les colonnes de profil réservées au paiement et à l'administration.

## Non-objectifs

- Aucun e-mail commercial ou transactionnel.
- Aucune activation massive ou silencieuse de comptes premium.
- Aucun changement de tarif, checkout, abonnement Stripe ou entitlement Apple.
- Aucun effacement des anciennes données d'onboarding.
- Aucune promesse d'usage sans limite technique: le Pass relève la limite gratuite habituelle avec un plafond de fair use.
- Aucun test live qui appelle Gemini ou débite un crédit.

## Onboarding progressif

### Profil essentiel

Le chemin acquisition affiche sur un écran:

- prénom;
- date de naissance;
- bouton `Enregistrer et continuer`;
- bouton `Continuer sans profil`;
- explication: le skip est réversible, les réponses seront moins personnalisées et certaines informations pourront être redemandées.

La sauvegarde essentielle est un upsert partiel. Elle ne renvoie pas de valeurs nulles pour les champs avancés et ne peut donc pas effacer des informations existantes.

Les détails avancés restent facultatifs et repliés:

- heure et lieu de naissance;
- noms complémentaires;
- genre, centres d'intérêt et niveau;
- consentement e-mail, décoché par défaut.

Le faux scan de 3,6 secondes et le reveal sont retirés du chemin critique.

### Destinations et raisons

Les seules destinations acceptées sont:

- `/dashboard`
- `/oracle`
- `/pricing`
- `/profile`
- `/astral`
- `/numerology`
- `/calendar`
- `/compatibility`

Les raisons autorisées sont:

- `direct`
- `profile_edit`
- `oracle_pending`
- `personalized_checkout`
- `personalized_surface`

Une URL externe, `/admin`, `/auth` ou une boucle `/onboarding` retombe sur une destination interne sûre.

### Frontières contextuelles

Pour un profil incomplet:

- `/oracle`, `/pricing`, `/learn` et `/settings` restent accessibles;
- `/dashboard` reste accessible mais utilise un état générique;
- `/astral`, `/numerology`, `/calendar`, `/compatibility` et `/profile` affichent une carte de complétion;
- la carte propose soit de compléter le profil, soit d'aller directement à l'Oracle;
- aucune surface ne consomme le `demoProfile` comme profil personnel.

La lecture d'un profil échouée ne doit pas créer une boucle de redirection. La frontière affiche un état réessayable.

### Oracle pending

Si la confirmation d'un tour Oracle répond `profile_incomplete`, l'interface l'affiche et propose `/onboarding?reason=oracle_pending&next=/oracle`. La question en attente est conservée. Un skip retourne à l'Oracle, mais la réponse personnalisée reste explicitement bloquée jusqu'au profil essentiel.

### Checkout

L'abonnement Étoile reste accessible sans profil essentiel. Seule une offre réellement personnalisée, telle qu'Âme Sœur, peut demander le profil et redirige alors vers `/onboarding?reason=personalized_checkout&next=/pricing`.

## Analytics onboarding

Événements:

- `onboarding_viewed_v2`
- `onboarding_essential_started_v1`
- `onboarding_essential_completed_v1`
- `onboarding_advanced_opened_v1`
- `onboarding_skipped_v1`
- `onboarding_destination_reached_v1`

Propriétés métier autorisées:

- `journey_version: progressive_onboarding_v1`
- `flow`
- `reason`
- `destination`
- `completion_level`
- `has_birth_time`
- `has_birth_place`

Les builders typés n'acceptent ni prénom, ni date, ni lieu, ni e-mail, ni texte libre, ni identifiant de tour Oracle.

## Pass Oracle 48 h

### Modèle d'autorisation

Le Pass est stocké dans une table service-only distincte des profils et des entitlements payants:

- une ligne maximum par utilisateur;
- statut `active`, `expired` ou `revoked`;
- `activated_at`;
- `expires_at`, au plus 48 heures après activation;
- aucune policy d'accès direct pour `anon` ou `authenticated`.

Une fonction Edge authentifiée expose:

- `GET`: état d'éligibilité et expiration, sans créer de Pass;
- `POST`: activation explicite, idempotente et one-shot.

L'activation refuse:

- un JWT absent ou invalide;
- un compte déjà premium Stripe ou Apple;
- un Pass déjà consommé;
- une nouvelle émission lorsque le kill switch est fermé.

Le kill switch bloque uniquement les nouvelles activations. Un Pass actif continue d'être honoré jusqu'à son expiration.

### Usage Oracle

`increment_oracle_usage` considère dans cet ordre:

1. abonnement Stripe ou Apple actif: illimité commercial;
2. Pass actif: limite gratuite habituelle levée, avec fair use de 20 messages par heure et 100 requêtes autorisées au total sur 48 h;
3. compte standard: quota gratuit existant.

Le retour RPC distingue `subscription`, `promo_pass` et `none`. Le texte de l'app dit `48 h sans la limite gratuite habituelle`, jamais `illimité` si un plafond technique existe.

### Expérience app

L'Oracle montre un encart:

- éligible: `Activer mes 48 h`;
- actif: expiration lisible et état actif;
- consommé ou inéligible: aucun CTA trompeur;
- erreur: état réessayable sans supposer l'activation.

L'activation n'est ni automatique à l'inscription, ni automatique au premier message.

## Sécurité des profils

Une migration ajoute un trigger qui refuse aux rôles JWT `anon` et `authenticated` de modifier les colonnes réservées:

- `subscription_tier`
- `subscription_status`
- `subscription_period_end`
- `stripe_customer_id`
- `stripe_subscription_id`
- `credits`
- `is_admin`
- `referral_code`
- `badges`
- champs de souscription Apple

Le `service_role` et les webhooks conservent leurs droits. Les champs utilisateur et les caches de calcul natal ne sont pas bloqués.

## Ordre de livraison

Deux incréments restent attribuables:

1. onboarding progressif front uniquement, puis mesure;
2. Pass: migration additive, Edge ciblée, puis front.

La preview Cloudflare pointe vers Supabase production. Toute recette interactive de preview doit intercepter Supabase et analytics. Aucun formulaire ne sera soumis sur production pendant la recette automatisée.

## Rollback

### Onboarding

1. Restaurer le déploiement Cloudflare précédent.
2. Revert du commit ou merge sur `main`.
3. Aucun rollback Supabase.

### Pass

1. Fermer immédiatement l'émission de nouveaux Pass.
2. Revert du front.
3. Continuer d'honorer les Pass actifs jusqu'à expiration.
4. Ne jamais redéployer un ancien `oracle-chat` qui ignore les Pass tant qu'un grant actif existe; en urgence, déployer une fonction compensatrice qui continue de les honorer.
5. Utiliser une migration compensatrice; ne jamais modifier une migration appliquée.
6. Retirer les objets seulement après 48 h plus marge et zéro Pass actif.

## Dérive Apple connue et réconciliée

La production contient la lignée RevenueCat issue du build iOS vérifié alors que
son historique n'avait pas été fusionné dans `main`. Le lot réintroduit la
migration canonique `20260721010000_ios_store_entitlements.sql`, utilise les
vraies colonnes `apple_subscription_*`, conserve `billing_entitlements` comme
source serveur et teste qu'un abonné Apple actif est exclu de la cohorte.
Le front distingue également l'abonnement commercial Stripe/Apple du Pass
promotionnel.

## Critères de sortie

- tests RED puis GREEN des règles pures;
- suite app, lint, TypeScript et build verts;
- Deno check et tests partagés verts;
- migration locale réinitialisable et lint SQL vert;
- revue indépendante du diff;
- aucun secret ou PII dans le diff et les preuves;
- preview statique validée sans écriture production;
- livraison progressive avec SHA et preuves de rollback enregistrés.

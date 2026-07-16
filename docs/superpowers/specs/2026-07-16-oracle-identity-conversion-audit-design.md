# Karmastro - Oracle, identité et conversion (audit profond)

> Date : 2026-07-16
> Statut : validé par carte blanche produit et technique
> Surface : site Astro, app React, Supabase, Stripe, analytics

## 1. Constat vérifié en production

- 43 comptes et 43 profils, dont 32 profils complets.
- 334 conversations Oracle, mais seulement 9 rattachées à un compte ; 325 restent anonymes.
- 353 messages utilisateur, 244 sessions Oracle anonymes et 326 conversations à un seul tour.
- Sur 30 jours : 4 845 sessions humaines, 167 utilisateurs Oracle, 43 sessions ayant atteint le paywall, 3 démarrages de checkout et 1 paiement réel de 3,99 EUR.
- Aucun abonnement Étoile actif et aucun achat de crédits.
- Le dernier compte créé possède bien prénom, date, heure et lieu de naissance, mais n'a aucun message Oracle authentifié. Quelques minutes après son inscription, le site public a enregistré anonymement « Que disent les astres pour moi en ce moment ? », puis une réponse indiquant que les informations personnelles manquaient. La chronologie est compatible avec le parcours signalé, sans permettre d'identifier formellement la personne.
- L'app mobile affiche un LCP d'environ 6,5 secondes sur `/oracle` et `/pricing`. Le build produit un bundle principal d'environ 1,36 Mo avant compression.
- Les pages de vente promettent encore 3 messages gratuits et 4 guides, alors que le serveur applique 2 messages et que le produit est désormais un Oracle unique.

## 2. Causes racines

### 2.1 Trois identités Oracle non raccordées

Le site public utilise `km_oracle_session`, l'app utilise `karmastro_oracle_session`, et l'utilisateur authentifié est résolu ailleurs via Supabase Auth. Les localStorage des domaines `karmastro.com` et `app.karmastro.com` ne sont pas partagés. Le site public n'envoie aucun profil, ne conserve pas le `conversation_id` retourné et ne transmet pas sa session lors de l'authentification.

Conséquence : une personne peut remplir son profil dans l'app puis revenir sur l'Oracle public, qui reste incapable de la reconnaître. Le problème observé ne vient pas d'un profil absent en base ; il vient du découpage du parcours.

### 2.2 Frontière de confiance incorrecte côté serveur

`oracle-chat` accepte actuellement `userId` et `conversationId` dans le JSON client. Un appelant peut donc se faire passer pour un autre UUID, utiliser son quota, lire son cache de profil dans le prompt ou écrire dans une conversation dont il connaît l'identifiant. L'app aggrave le défaut en envoyant la clé publique Supabase comme bearer token même quand une vraie session utilisateur existe.

### 2.3 La première promesse produit provoque une réponse générique

Le starter public « Que disent les astres pour moi ? » déclenche une requête personnelle sans demander la moindre donnée de naissance. La réponse honnête du modèle est donc nécessairement générique, exactement au moment où le produit doit prouver sa valeur.

### 2.4 Offre et paywall dispersés

Au paywall anonyme, trois actions concurrentes sont proposées : lecture à l'unité, newsletter et abonnement. Le message serveur parle de créer un compte, alors que l'interface vend autre chose et que le quota anonyme est transféré au compte : créer un compte ne permet pas réellement d'obtenir de nouveaux messages le même jour. La page pricing ajoute encore l'abonnement, Âme Soeur et trois packs de crédits sur un même écran.

### 2.5 Mesure partiellement trompeuse

Un bot unique explique environ 107 000 pages vues sur 30 jours ; il est bien marqué comme bot. Les 4 845 sessions humaines restent exploitables. En revanche, la vue funnel historique compte encore la limite avec une règle obsolète et les événements d'inscription sous-comptent les comptes réels.

## 3. Décision de produit

Le moteur économique reste Étoile, à 5,99 EUR/mois ou 49,99 EUR/an pour cette itération. Il n'y a pas assez de paiements pour justifier un repricing fiable. La priorité est de faire vivre un premier échange réellement personnalisé, de conserver l'identité et l'historique, puis de rendre le chemin vers Étoile cohérent.

Le one-shot Chemin de Vie à 4,90 EUR reste disponible comme alternative, mais ne doit plus concurrencer trois autres actions au même niveau. La newsletter quitte le mur de paiement Oracle.

## 4. Parcours cible

### Oracle public

1. Le visiteur voit immédiatement une saisie légère : prénom + date de naissance, heure et ville facultatives.
2. Le CTA lance directement une première lecture personnelle et mémorise ces données dans la session locale.
3. Les starters strictement personnels ouvrent cette saisie s'il n'existe aucun profil local ; les questions universelles restent accessibles sans profil.
4. Le client transmet `profile` et réutilise le `conversation_id` retourné, de sorte qu'une discussion reste une seule conversation.
5. Un lien « J'ai déjà un profil » ouvre l'app avec un `oracle_session` de transfert.
6. Au paywall, le CTA principal annonce clairement Étoile et conduit vers auth/pricing en conservant la session. La lecture à 4,90 EUR reste secondaire et récupère la date déjà saisie.

### Authentification et app

1. L'app capture `oracle_session` et un chemin `next` strictement autorisé.
2. Une session déjà connectée est redirigée immédiatement ; sinon la destination survit à l'email, à Google OAuth et à l'onboarding.
3. `claim-anon-session` rattache conversations, messages et indices de profil au vrai utilisateur.
4. L'app envoie le JWT Supabase réel à `oracle-chat`.
5. `oracle-chat` ignore tout `userId` client, résout l'identité depuis le JWT, charge le profil en base et fusionne uniquement les calculs client non sensibles.

## 5. Contrats et sécurité

- `messages` : tableau non vide, rôles `user|assistant`, au plus 20 éléments, 4 000 caractères par message et 12 000 caractères au total ; le dernier message est utilisateur.
- `sessionId` anonyme : 8 à 128 caractères dans un alphabet sûr.
- `conversationId` : UUID valide et propriété vérifiée contre l'utilisateur résolu ou la session anonyme.
- `userId` reçu dans le JSON est toujours ignoré.
- Un bearer JWT invalide reçoit 401 ; l'absence de bearer reste un appel anonyme valide si `sessionId` est valide.
- Pour un utilisateur authentifié, les champs de naissance en base sont autoritaires. Le format de date envoyé au moteur est ISO `YYYY-MM-DD`.
- Aucun secret, profil brut ou contenu privé n'est écrit dans les logs d'audit.

## 6. Offre et contenu

- Toutes les promesses visibles passent de 3 à 2 messages gratuits par jour.
- Toutes les références commerciales aux 4 guides sont remplacées par l'Oracle unique.
- La page abonnement vend des bénéfices effectivement disponibles : profil cosmique, Oracle illimité, mémoire des échanges, transits/calendrier et guidance mensuelle.
- Le pricing app garde Étoile comme héros. Âme Soeur et les crédits sont regroupés sous des options ponctuelles secondaires, sans faux libellé « le plus populaire » non prouvé.
- Un checkout sans session conserve `/pricing` comme destination après connexion.

## 7. Performance et accessibilité

- `OraclePage` n'est plus importée dans le bundle initial de toutes les routes ; elle devient une route lazy-loaded.
- Les suggestions mobiles restent dans la largeur utile (wrap ou scroll avec marge de fin visible).
- La bannière cookies doit rester actionnable sans masquer le CTA principal du pricing sur mobile.
- Baselines à battre : LCP mobile `/oracle` 6,5 s et `/pricing` 6,6 s ; accessibilité respectivement 0,89 et 0,94.

## 8. Critères d'acceptation

- Un JWT valide fait utiliser le profil de la base même si le client envoie `{}`.
- Un UUID client usurpé n'a aucun effet et une conversation étrangère est refusée.
- Le premier clic sur la question personnelle du site ne peut plus produire « je n'ai pas tes informations » sans avoir offert la saisie de profil.
- Deux messages successifs du site partagent le même `conversation_id`.
- Le transfert site vers app conserve l'historique après connexion et onboarding.
- Les copies publiques et app n'annoncent plus 3 messages ou 4 guides.
- Tests unitaires, builds app/site, contrôle des accents et tests négatifs des endpoints passent.
- Aucun débit Stripe, envoi email réel ou suppression de donnée n'est utilisé pour valider.

## 9. Rollback

- Code : revert du commit de cette itération et redéploiement des artefacts précédents.
- Edge function : redéployer la version précédente de `oracle-chat` si le taux d'erreur ou le quota se dégrade.
- Le transfert par query string est additif ; en cas de rollback, les anciennes sessions continuent simplement en anonyme.
- Aucun changement de prix Stripe ni migration destructive n'est inclus.

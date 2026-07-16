# Audit profond Karmastro — produit, Oracle, conversion et paiements

Date : 16 juillet 2026
Périmètre : `karmastro.com`, `app.karmastro.com`, Supabase, Oracle, Stripe, analytics, comptes, onboarding, performance et vérité des offres.

## Verdict

Karmastro n'a pas un problème principal de paiement. Le paiement réel à 3,99 € prouve que Stripe, le webhook et la livraison Âme Sœur peuvent fonctionner. Le frein est situé avant le paiement : identité cassée entre le site et l'app, première réponse trop souvent générique, conversations fragmentées, produit payant peu démontré et plusieurs écrans encore issus de la démo.

La base est bonne : trafic réel, calculateurs utiles, Oracle utilisé, 43 comptes, 32 profils complets, infrastructure de paiement opérationnelle. En revanche, le produit perd la majorité de sa valeur au moment exact où il devrait prouver sa personnalisation.

Priorité retenue : vendre une promesse unique et vérifiable — « un Oracle qui connaît ton profil et se souvient de toi » — plutôt que multiplier les guides, packs et offres.

## Chiffres de référence

### Comptes et activation

- 43 comptes et 43 profils.
- 32 profils complets, soit 74,4 % ; 11 incomplets, soit 25,6 %.
- 9 comptes ont réellement envoyé un message authentifié à l'Oracle, soit 20,9 % des comptes.
- Aucun abonnement actif et aucun crédit détenu au moment de l'audit.
- Le dernier compte créé avait un profil complet mais aucun message Oracle authentifié.

### Oracle

- 334 conversations : 9 authentifiées et 325 anonymes.
- 353 messages utilisateur et 353 réponses Oracle.
- 244 sessions anonymes distinctes.
- 326 conversations sur 334 n'ont qu'un tour utilisateur, soit 97,6 %.
- Profondeur moyenne enregistrée : 1,06 tour ; maximum : 9.
- 3 feedbacks seulement, note moyenne 1,67/3 : signal faible, mais peu encourageant.
- 255 messages utilisateur sur 30 jours ; 46 sur 7 jours.

La profondeur en base était artificiellement abaissée par le site : chaque tour pouvait créer une nouvelle conversation au lieu de réutiliser son identifiant. Même corrigée de ce biais, la rétention conversationnelle reste le problème numéro un.

### Funnel sur 30 jours

- 4 845 sessions humaines détectées.
- 167 utilisateurs/sessions Oracle, soit 3,45 % des sessions humaines.
- 46 ont atteint la limite, soit 27,5 % des utilisateurs Oracle.
- 3 événements de démarrage checkout.
- 1 paiement confirmé, soit 3,99 €.
- Conversion globale session humaine → paiement : environ 0,021 %.

L'échantillon checkout est trop faible pour conclure sur le taux Stripe. Il est suffisant pour conclure que la perte majeure a lieu avant le checkout.

### Paiements et rétention

- Un seul événement `checkout.session.completed`, payé et traité sans erreur.
- Produit acheté : Âme Sœur, 3,99 € ; lecture créée et disponible.
- 0 transaction de crédits.
- 0 abonnement mensuel dans la table de guidance.
- 33 inscriptions newsletter, dont 16 confirmées.
- Aucun envoi récent visible dans `email_log` ; ce journal ne couvre toutefois pas forcément tous les appels Resend.

### Trafic et SEO

- L'utilisateur observe 20 à 30 clics SEO/jour dans GSC.
- L'analytics interne mesure 4 845 sessions humaines sur 30 jours, toutes sources confondues, soit environ 161/jour.
- Un bot a produit 107 026 pages vues ; 93,4 % des pages vues brutes sont donc du bruit. Les sessions humaines utilisées ci-dessus excluent ce bruit.
- Principales entrées humaines : Oracle, accueil, thème natal EN, synastrie FR et ascendant.

GSC n'était pas connecté comme source interrogeable pendant cet audit ; les clics SEO restent donc la mesure fournie par le propriétaire, à ne pas comparer directement aux sessions toutes sources.

## Causes racines

### 1. Le profil existait, mais pas dans le contexte utilisé par le site

Le site public utilisait `km_oracle_session`; l'app utilisait `karmastro_oracle_session`. Le site ne transmettait ni profil, ni session d'inscription, ni identifiant de conversation. La question suggérée « Que disent les astres sur moi ? » appelait donc l'Oracle sans aucune donnée personnelle.

La chronologie du dernier compte est compatible avec le cas signalé : question personnelle anonyme, ajout d'une date, inscription et profil complété, puis nouvelle question encore anonyme recevant une réponse « sans informations personnelles ». L'identité exacte ne peut pas être prouvée sans rapprocher des données personnelles, mais le bug de parcours suffit à expliquer le résultat.

### 2. Les conversations étaient des impasses

Le site ne réutilisait pas `conversation_id`. L'historique n'était pas réclamé après inscription lorsque le navigateur était déjà authentifié. L'Oracle paraissait oublier l'utilisateur alors que la base possédait parfois déjà les éléments nécessaires.

### 3. L'offre était trop dispersée

La page tarifaire présentait Éveil, Étoile, Âme Sœur et trois packs de crédits. Le paywall Oracle proposait simultanément lecture unique, abonnement et newsletter. Avec 3 checkouts observés, cette complexité ne peut pas être optimisée statistiquement et réduit la lisibilité.

Décision : Étoile devient le choix principal ; Âme Sœur et la lecture unique restent secondaires ; les packs restent dans le backend pour compatibilité mais disparaissent de l'interface.

### 4. Une partie de l'app était encore une démo

- `IS_PREMIUM = false` verrouillait le dashboard même pour un futur abonné réel.
- Le dashboard affichait une guidance datée du 8 avril 2026 comme contenu « du jour ».
- Le calendrier était bloqué sur avril 2026 ; ses flèches ne faisaient rien.
- La compatibilité affichait des personnes et scores fictifs ; « ajouter une personne » ne faisait rien.
- Le bouton de déconnexion naviguait vers l'accueil sans fermer la session.
- Les réglages notifications/thème/niveau ressemblaient à des contrôles mais n'avaient aucune action.

Ces écrans sont dangereux pour la conversion : ils donnent une impression de richesse au premier regard, puis détruisent la confiance dès l'interaction.

### 5. Le contrat payant n'était pas entièrement raccordé

Le webhook activait bien le droit Oracle illimité côté profil, mais le dashboard ignorait ce droit. La guidance mensuelle lisait une table `subscriptions` legacy qui n'était pas alimentée par les abonnements créés depuis l'app. Aucun portail Stripe n'était disponible alors que le texte promettait une résiliation depuis le profil.

### 6. Risques techniques Stripe et conversations

- `oracle-chat` faisait confiance à un `userId` fourni dans le JSON client.
- Un `conversationId` n'était pas contrôlé contre son propriétaire.
- Un token invalide pouvait retomber sur un chemin anonyme dans l'historique.
- Les redirections success/cancel du checkout étaient fournies par le client.
- Un rejeu de webhook pack de crédits pouvait théoriquement recréditer un compte.
- Les webhooks de lecture ne vérifiaient pas explicitement `payment_status = paid`.
- Un ancien script de configuration DNS contenait deux jetons de secours en clair dans Git. Ils ne correspondent plus aux jetons actifs, mais leur présence restait une mauvaise pratique et une fuite historique.

## Correctifs réalisés

### Oracle et identité

- Formulaire prénom + date de naissance placé avant toute question personnelle sur le site.
- Les questions personnelles n'appellent plus l'Oracle tant que le minimum de profil manque.
- Profil transmis à l'Oracle, mémorisé pour l'échange puis rattaché au compte après inscription.
- Session Oracle transférée du site vers l'app avec retour vers `/oracle` ou `/pricing`.
- Réutilisation de `conversation_id` dès le deuxième tour.
- Réclamation de session au login, au rafraîchissement de token et pour un utilisateur déjà connecté.
- Date de naissance normalisée en ISO ; correction du décalage possible selon le fuseau du navigateur.

### Sécurité

- Le `userId` du body est ignoré ; l'identité vient uniquement du JWT Supabase.
- Profil de naissance rechargé côté serveur pour un utilisateur authentifié.
- Vérification de propriété avant d'accepter un `conversationId`.
- Validation des messages, tailles, rôles, UUID et identifiants de session.
- L'historique refuse désormais un bearer invalide au lieu de retomber en anonyme.
- Messages du paywall échappés avant insertion HTML.
- Jetons de secours retirés du script DNS ; le script exige désormais les secrets d'environnement et le dépôt courant ne contient plus ces motifs de jetons.

### Conversion

- Étoile placé en premier et rendu dominant à 5,99 €/mois ou 49,99 €/an.
- Lecture unique repliée en option secondaire ; date déjà saisie préremplie.
- Newsletter retirée du paywall de paiement.
- Suppression visuelle des packs de crédits.
- Promesse unifiée : Oracle unique, profil connu, mémoire, guidance mensuelle.
- Quota harmonisé à 2 messages gratuits dans le produit, les textes et le reporting.
- Cookie banner compacté ; il ne masque plus le CTA Étoile principal.

### Produit app

- Droit premium calculé depuis le tier, le statut et l'échéance réels.
- Dashboard reconstruit sur le JSON horoscope live du jour, dans la langue et le signe du profil.
- Calendrier rendu navigable et calculé sur le vrai mois/année.
- Profils fictifs de compatibilité supprimés ; accès vers une vraie saisie de synastrie et vers Âme Sœur.
- Vraie déconnexion.
- Faux réglages non interactifs retirés.
- Footer marketing retiré des écrans transactionnels de l'app pour raccourcir le parcours mobile.
- Opt-in email décoché par défaut ; le consentement devient explicite.

### Stripe

- Redirections checkout limitées aux origines app autorisées.
- Blocage d'un second abonnement lorsqu'une relation Stripe active, en essai ou en impayé existe déjà.
- Nouveau portail Stripe client depuis Réglages.
- Webhooks one-shot traités seulement après paiement confirmé.
- Achat de crédits rendu atomique et idempotent par session Stripe.
- Erreurs de fulfillment critiques propagées afin que Stripe puisse rejouer.
- Abonnements app synchronisés vers la table de guidance mensuelle.
- Annulation et `past_due` synchronisés dans les deux sources.

### Performance et contenu

- Toutes les routes app sont chargées à la demande.
- Bundle principal : environ 436 Ko gzip → 273 Ko gzip, soit -37 %.
- Lighthouse mobile pricing local : performance 69, accessibilité 94, bonnes pratiques 96, LCP 6,0 s, CLS 0.
- Les textes publics, CGV, `llms.txt` et 11 langues ont été alignés sur l'offre réelle.

## Preuves de vérification

- 15 tests unitaires verts.
- Build app production vert.
- Build site vert : 8 050 pages.
- Parcours navigateur mobile automatisé vert : profil → première réponse personnalisée → deuxième tour dans la même conversation → paywall → handoff inscription.
- Vérifications navigateur : dashboard live, absence des profils fictifs, calendrier non figé, Étoile prioritaire, packs absents.
- Contre-revue indépendante Claude : GO déploiement, aucun P0/P1 sécurité sur l'identité JWT, la propriété des conversations et le quota.
- Migration de production validée d'abord dans une transaction annulée, puis appliquée : vue funnel, index unique de fulfillment et RPC atomique présents.
- Sept Edge Functions déployées : Oracle, historique, claim, portail Stripe, checkout et deux webhooks.
- Smoke tests production négatifs verts : payload Oracle invalide `400`, token invalide `401`, endpoints privés sans auth `401`, webhooks sans signature `400`.
- Aucun événement Stripe non traité après déploiement.
- Les deux jetons retrouvés dans l'historique ont été comparés sans afficher leur valeur : aucun ne correspond aux accès actifs actuels.
- Aucun paiement, email ou effacement réel déclenché par les tests.

## Ce qu'il reste à faire après stabilisation

### P1 — mesurer 14 jours avant de changer le prix

Événements à suivre :

1. `oracle_profile_started`
2. `oracle_profile_submitted`
3. première réponse personnalisée rendue
4. deuxième tour dans la même conversation
5. `oracle_handoff_click`
6. pricing vu
7. checkout commencé
8. abonnement payé

Objectifs de départ :

- deuxième tour après première réponse ≥ 35 % ;
- handoff site → app ≥ 10 % des utilisateurs ayant atteint la limite ;
- checkout commencé ≥ 10 % des vues paywall ;
- au moins 200 vues paywall avant tout test de prix.

Le prix 5,99 € ne doit pas être baissé sur un échantillon d'un paiement. Il faut d'abord démontrer que le visiteur comprend et expérimente la valeur.

### P2 — rétention

- Vérifier le cron mensuel en mode dry-run après le premier abonnement.
- Instrumenter réellement les emails envoyés, délivrés, ouverts et cliqués.
- Ajouter un email de reprise de conversation uniquement avec consentement.
- Ne pas relancer les 11 profils incomplets en masse avant d'avoir validé une séquence sur un petit lot.

### P3 — performance

Le principal coût restant est le dictionnaire UI multilingue chargé globalement. Le découper par locale devrait améliorer FCP/LCP mobile davantage qu'une nouvelle micro-optimisation CSS.

### P4 — SEO orienté revenu

La machine SEO produit déjà suffisamment de pages. La prochaine amélioration ne doit pas être « davantage de contenu », mais davantage de passages outil → Oracle personnalisé → compte → Étoile sur les pages à forte intention : thème natal, synastrie, ascendant, chemin de vie et Oracle.

Les pages outils principales et les landing pages ont été corrigées. Une dette éditoriale subsiste dans d'anciens articles qui décrivent encore les quatre anciennes voix de l'Oracle. Les réécrire par lots selon leur trafic est préférable à une modification massive de milliers de pages. Des routes de compatibilité ont été ajoutées pour que leurs anciens liens app ne débouchent plus sur des 404.

## Rollback

- Front : revert du commit de livraison puis redéploiement Cloudflare/Vite.
- Edge : redéployer les versions précédentes de `oracle-chat`, `oracle-history`, `claim-anon-session`, `stripe-checkout`, `stripe-webhook` et `reading-webhook`.
- Migration : la vue peut être recréée avec sa définition précédente ; l'index et la fonction de fulfillment crédits sont additifs et n'altèrent aucun solde existant.
- Le backend des packs n'est pas supprimé ; seule leur exposition UI est retirée.

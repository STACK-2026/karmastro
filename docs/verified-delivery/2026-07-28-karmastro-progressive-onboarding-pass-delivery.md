# Karmastro : livraison onboarding progressif et Pass Étoile 48 h

Date de production : 2026-07-29, Europe/Paris.

## Décision produit

- Onboarding ramené à prénom + date de naissance sur un écran.
- Détails astraux avancés facultatifs.
- Skip explicite, réversible, avec reprise possible depuis le profil.
- Aucun e-mail marketing envoyé aux derniers inscrits sans consentement.
- Aucun compte transformé silencieusement en abonnement premium.
- Pass Étoile proposé dans l'app à une cohorte fermée de 30 comptes.
- Activation volontaire, sans carte, pour exactement 48 heures.
- Fair use affiché : 20 messages par heure et 100 au total.

## Preuves de code

- PR : `https://github.com/STACK-2026/karmastro/pull/53`
- Commit fonctionnel : `eb7962a1029b70e920943ee3c4db95a8a746ab6f`
- Correctif d'ancres CI : `bc49268e496a9faf9c2278c77ac392f9ef9cccca`
- Merge production : `a87265a98f16b3b19f5f7485a3dee9e4dd1f38b9`
- Quality gates PR et post-merge : verts.
- Trois revues indépendantes : GO.

Validations avant livraison :

- Vitest : 107/107.
- Deno partagé : 57/57.
- TypeScript, ESLint et builds : verts.
- Reset Supabase local complet et lint DB : verts.
- pgTAP Pass : 8/8.
- Scan de secrets et `git diff --check` : verts.

## Preuves production

Migration ciblée :

- version : `20260728213000`;
- SHA-256 :
  `c43b6a6ba8529b4938353d6eb0585e4824efaa069492b1a1e92cd3480841a267`;
- appliquée seule dans une transaction;
- seule cette version a été ajoutée à l'historique distant;
- aucun `supabase db push --linked` exécuté.

Vérification base après application :

- 3 tables Pass avec RLS;
- 6 fonctions cibles présentes;
- 0 droit d'exécution client indu;
- trigger de protection des colonnes profil actif;
- cron de rétention quotidien présent;
- socle Apple conservé.

Edge Functions :

- `promotion-pass` : version 1;
- `oracle-chat` : version 51;
- smoke anonyme `promotion-pass` : HTTP 401 `invalid_token`;
- smoke Oracle sans message : HTTP 400 `invalid_messages`.

Front :

- déploiement Cloudflare app :
  `a46d367d-48be-49aa-b572-6eba9b78d18a`;
- commit déployé : `a87265a98f16b3b19f5f7485a3dee9e4dd1f38b9`;
- bundle live et preview identiques, SHA-256 :
  `065be1d7fe636622d8eb77f965fab105ec5278ba614505c287e9fa45647d822b`;
- `app.karmastro.com` : HTTP 200.

## Cohorte et fenêtre

Sélection :

- 30 derniers comptes non supprimés, triés par date de création décroissante
  puis UUID;
- exclusion serveur des abonnements Stripe et Apple actifs;
- exclusion des grants existants;
- aucune adresse e-mail ou donnée de profil dans le manifeste.

Scellement :

- cutoff UTC : `2026-07-28T22:17:13+00:00`;
- SHA-256 du manifeste :
  `937da134ea59603d33c2f5a6343d84a2530106cb60fa5c7462d9e6161035929a`;
- résultat RPC : 30 demandés, 30 assignés;
- après attribution : 30 offerts, 0 actif, 0 payant, 0 inattendu.

Ouverture :

- début UTC : `2026-07-28T22:32:01.257187+00:00`;
- fin UTC : `2026-08-04T22:32:01.257187+00:00`;
- fenêtre d'activation : exactement 7 jours;
- chaque activation déclenche sa propre durée exacte de 48 heures;
- probe initial : 30 états `offered`, 0 accès premium avant clic.

## Mesure

Commande agrégée, sans PII :

```bash
python3 scripts/measure_etoile_pass.py
```

Lire séparément :

- autorité serveur : grants actifs, activations et tours autorisés;
- signaux directionnels client : vue, demande, succès et échec;
- comportement : conversations et messages persistés;
- onboarding : vue, démarrage, complétion, skip et destination atteinte.

Premiers points recommandés : 24 h, 48 h, fin de fenêtre et 48 h après la
dernière activation.

## Rollback

1. Fermer immédiatement `issuance_enabled`.
2. Conserver `promotion-pass` et `oracle-chat` compatibles tant qu'un Pass actif
   existe.
3. Restaurer le front précédent si nécessaire.
4. Continuer d'honorer les Pass actifs jusqu'à leur expiration.
5. Retirer les objets uniquement avec une migration compensatrice après zéro
   Pass actif et la marge de rétention.

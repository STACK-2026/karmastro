# Karmastro - Adoption Oracle, mesure et performance

> Date : 2026-07-17
> Statut : cadrage d'implémentation après audit profond
> Surface : cinq outils SEO, Oracle public, app React, analytics et performance pricing

## 1. Mission

Transformer davantage des 20 à 30 clics SEO quotidiens en première conversation Oracle utile, puis mesurer sans ambiguïté la progression vers Étoile. Cette itération conserve les prix, quotas, produits Stripe et contrats serveur déjà sécurisés.

## 2. Source de vérité et baseline fraîche

La baseline a été reprise depuis le code sur `main`, les événements Supabase de production sur 30 jours et les builds locaux du 17 juillet 2026.

- 4 876 sessions humaines et 167 utilisateurs Oracle.
- 332 événements `oracle_message_sent`.
- 64 limites Oracle atteintes et 64 vues de paywall.
- 3 checkouts démarrés pour un seul paiement réel historique de 3,99 EUR.
- 198 résultats d'outil calculés, mais seulement 34 clics vers l'Oracle.
- 5 profils Oracle démarrés et 5 soumis.
- 15 tests app passent, TypeScript passe, l'app et les 8 050 pages du site se construisent.
- Le bundle app principal pèse 872,34 Ko avant compression et 273,12 Ko gzip.
- Le dernier Lighthouse live connu pour `/pricing` mesure 70 en performance et 5,3 s de LCP mobile.

Le principal problème vérifié n'est pas le prix : le trafic utilise les outils, mais une part trop faible découvre l'Oracle, et la mesure actuelle ne permet pas d'isoler proprement chaque rupture du parcours.

## 3. Parcours cible

### 3.1 Outil vers Oracle

Après un calcul sur Chemin de vie, Ascendant, Compatibilité, Thème natal ou Synastrie :

1. Le résultat affiche un CTA Oracle contextualisé.
2. Au clic, le navigateur place un transfert versionné et éphémère dans `sessionStorage`.
3. Le transfert contient une source non sensible, une question limitée et uniquement le profil de naissance de la personne courante quand il est disponible.
4. L'URL de destination ne contient jamais de question, prénom, date, heure ou ville.
5. L'Oracle consomme le transfert une seule fois, préremplit les champs disponibles et supprime immédiatement le stockage.
6. Une question personnelle ne part pas automatiquement tant que le prénom requis manque.

Les données du partenaire de synastrie ou de compatibilité ne deviennent jamais le profil du compte courant.

### 3.2 Oracle vers Étoile

Les événements doivent distinguer l'entrée, le profil, le premier échange, le second tour, la limite et le paywall. Stripe reste la source de vérité pour le paiement. Aucun événement client ne prétend qu'un paiement est réussi.

Le prix et le quota restent inchangés pendant cette itération. Il n'existe pas assez de paiements pour conclure qu'un changement tarifaire augmenterait le revenu.

## 4. Contrat de transfert local

Clé : `km_oracle_handoff`.

Schéma version 1 :

```json
{
  "version": 1,
  "createdAt": 1784246400000,
  "source": "theme-natal",
  "question": "Que révèle mon thème sur ma période actuelle ?",
  "profile": {
    "birthDate": "1990-02-14",
    "birthTime": "08:30",
    "birthPlace": "Lyon"
  }
}
```

Contraintes :

- durée de vie maximale : 30 minutes ;
- consommation unique avec suppression avant utilisation ;
- source limitée à un slug sûr de 2 à 40 caractères ;
- question limitée à 500 caractères ;
- date ISO réelle, heure `HH:MM`, lieu nettoyé et limité à 120 caractères ;
- aucun contenu du transfert n'est envoyé dans les propriétés analytics ;
- absence ou corruption du stockage : Oracle normal, sans erreur visible.

Le paramètre historique `q` reste toléré pour compatibilité, mais il est nettoyé de l'URL avant tout envoi et soumis aux mêmes limites. Les nouveaux CTA n'utilisent plus ce paramètre.

## 5. Taxonomie de mesure

Les événements suivants utilisent uniquement `source`, `locale`, `path`, `stage`, `turn` ou une durée agrégée. Aucun message, prénom, date, heure, ville, email ou identifiant Stripe n'est accepté.

| Événement | Déclencheur | Propriétés utiles |
|---|---|---|
| `tool_calculated` | résultat d'outil obtenu | `tool`, `locale`, `path` |
| `oracle_cta_click` | CTA d'un outil cliqué | `source`, `locale`, `path` |
| `oracle_entry_viewed` | Oracle chargé | `source`, `locale`, `has_handoff` |
| `oracle_profile_started` | premier focus sur le profil | `source`, `stage` |
| `oracle_profile_submitted` | profil local valide | `source`, `profile_completeness` |
| `oracle_message_sent` | message utilisateur accepté | `source`, `turn` |
| `oracle_first_response` | première réponse rendue | `source`, `latency_bucket` |
| `oracle_second_turn` | deuxième message utilisateur | `source` |
| `oracle_limit_hit` | limite serveur reçue | `source`, `turn` |
| `paywall_viewed` | paywall Oracle affiché | `source` |
| `paywall_etoile_click` | CTA Étoile cliqué | `source`, `billing_cycle` |

Les événements historiques restent lisibles. Les nouvelles propriétés sont additives et aucune vue SQL destructive n'est nécessaire dans ce lot.

## 6. Nettoyage de promesse

Les cinq pages de conversion ne doivent plus présenter Sibylle ou Séléné comme des guides disponibles. Elles vendent un Oracle unique, personnalisé et capable de prolonger le résultat calculé. Le texte ne doit pas promettre une connaissance que le profil ou le transfert ne fournit pas réellement.

## 7. Performance app

Le dictionnaire i18n de onze langues est actuellement importé en bloc dans le bundle initial. La nouvelle architecture charge le français de référence avec le noyau, puis charge dynamiquement une seule langue supplémentaire si nécessaire.

Garanties :

- conservation des onze langues et de toutes les clés requises ;
- fallback explicite vers le français pour une clé absente ;
- pas de rendu durable dans la mauvaise langue ;
- pas de changement fonctionnel dans checkout, auth, Oracle ou Stripe ;
- réduction d'au moins 25 pour cent du poids gzip du bundle principal par rapport à 273,12 Ko, ou constat documenté si la structure du bundler empêche ce seuil.

## 8. Risques et protections

Niveau de risque : élevé mais borné. Les pages SEO ont une large portée, le profil de naissance est privé et l'app est en production.

- Pas de migration destructive, suppression de données ou modification de prix.
- Pas de paiement, email ou OAuth réel pendant la validation.
- Le transfert privé reste dans la session du navigateur et ne passe ni dans l'URL ni dans les analytics.
- Les changements i18n sont couverts par des tests de parité de clés et des builds de production.
- Toute régression critique de sécurité, build, langue ou parcours bloque la livraison.

## 9. Critères d'acceptation

- Les cinq outils stockent un transfert valide et ouvrent une URL sans donnée personnelle.
- Un transfert expiré, corrompu ou mal formé est rejeté et supprimé.
- Le profil de la personne courante est prérempli ; les données du partenaire ne le sont pas.
- Une question personnelle préremplie attend le prénom si celui-ci manque.
- Les jalons entrée, premier retour et second tour sont mesurés sans contenu privé.
- Les références commerciales aux anciens guides ont disparu des cinq pages ciblées.
- Chaque locale app expose les clés requises et le bundle principal atteint l'objectif de réduction ou fournit une mesure expliquée.
- Tests unitaires, TypeScript, builds app et site, garde contenu et tests de parcours passent.
- Une revue indépendante ne relève aucun constat critique ou élevé non résolu.
- Le live est vérifié après déploiement sans transaction Stripe réelle.

## 10. Seuils de décision à 14 jours

Ces seuils ne bloquent pas le déploiement technique. Ils déterminent la prochaine itération produit sur un échantillon frais :

- CTR `tool_calculated` vers `oracle_cta_click` : dépasser 25 pour cent, contre 17 pour cent sur la baseline.
- Deuxième tour : au moins 35 pour cent des conversations ayant reçu une première réponse.
- Continuité du transfert : au moins 90 pour cent des entrées Oracle avec une source outil doivent avoir `has_handoff=true`.
- Handoff vers compte ou pricing : au moins 10 pour cent des sessions limitées.
- Prix : aucun test tarifaire avant au moins 200 vues de paywall correctement instrumentées.

Si le CTR reste sous 25 pour cent, le prochain levier est une itération de placement et de texte du CTA par outil. Si le deuxième tour reste sous 35 pour cent, le produit travaille la qualité et les suggestions de relance avant de modifier le quota.

## 11. Rollback

- Revert du ou des commits de cette itération, puis redéploiement de l'artefact précédent.
- L'Oracle continue à fonctionner sans transfert si le nouveau script est absent.
- Le format `q` historique reste une voie de compatibilité temporaire.
- Aucun rollback de base ou Stripe n'est requis, car ces systèmes ne changent pas dans ce lot.

# Karmastro: inscription depuis l'Oracle anonyme

Date: 2026-07-27
Propriétaire: Codex
Environnement cible: app Karmastro et fonction Supabase `oracle-chat`

## Objectif

Lorsqu'une personne anonyme demande une lecture nécessitant son prénom ou ses données de naissance, l'Oracle doit l'inviter à créer gratuitement un compte puis à compléter l'onboarding. Il ne doit pas demander de publier ces données dans le chat.

## Non-objectifs

- Ne pas modifier la limite de deux messages gratuits.
- Ne pas supprimer les conversations ou indices anonymes historiques.
- Ne pas changer le parcours des utilisateurs authentifiés.
- Ne pas envoyer de message Oracle réel pendant la recette.

## Comportement actuel

Le prompt de production demande explicitement aux anonymes de partager prénom, date, heure et lieu dans leur prochaine réponse. L'écran vide propose aussi un formulaire de profil anonyme annoncé comme ne nécessitant aucun compte. Les indices peuvent ensuite être conservés pour une récupération après inscription.

## Invariants

1. L'identité authentifiée provient uniquement du JWT Supabase.
2. Un profil fourni par un appel anonyme est ignoré côté serveur.
3. Aucun nouvel indice de profil anonyme n'est conservé par `oracle-chat`.
4. L'Oracle ne demande pas de données de naissance dans le chat anonyme.
5. L'interface conserve les messages gratuits et propose un bouton d'inscription vers `/onboarding`.
6. L'identifiant de session anonyme accompagne le handoff pour préserver la conversation.
7. Les profils authentifiés continuent d'être enrichis sans écraser les champs existants.

## Architecture retenue

Une politique pure partagée par la fonction Edge définit le contexte anonyme, la sélection du profil autorisé et la persistance des indices. Une seconde politique pure côté app construit le chemin d'inscription et décide quand afficher le CTA après une réponse.

Le formulaire anonyme est retiré. Un CTA d'inscription est affiché sur l'état vide et sous la dernière réponse terminée de l'Oracle. Le CTA utilise la clé de traduction existante `oracle.paywall_cta_signup`.

## Sécurité et confidentialité

Le serveur ne fait pas confiance au profil envoyé par le client anonyme. Si une personne écrit spontanément une donnée personnelle dans son message, l'Oracle reçoit la règle de ne pas l'exploiter et aucun nouvel indice structuré n'est conservé pour cette session.

## Vérification

- tests Deno de la politique anonyme;
- tests Vitest du handoff et de l'affichage;
- `deno check` de `oracle-chat`;
- tests app, ESLint, TypeScript et build Vite;
- probe live non authentifié sans appel Gemini réel si un chemin de rejet déterministe est disponible;
- inspection du bundle live pour les marqueurs du CTA.

## Rollback

Revert du commit de livraison puis redéploiement de la version précédente de `oracle-chat`. Version live à relever juste avant le déploiement.

## Risque résiduel

Une personne peut toujours écrire volontairement une donnée personnelle dans un message libre. Le produit ne peut pas empêcher le texte saisi, mais il ne doit plus le solliciter ni le transformer en indice structuré anonyme.

# Karmastro Oracle anti-bot discret

Date: 2026-07-29
Owner: Codex
Environment: branche `codex/karmastro-oracle-antibot-20260729`, puis production après validation

## Mission

Empêcher les crawlers de déclencher une conversation Oracle, de consommer un
quota et d'appeler Gemini, sans CAPTCHA visible ni friction pour une question
réellement saisie.

## État observé

Sur les trois conversations anonymes analysées entre 01:25 et 02:25
Europe/Paris:

- une portait explicitement le user-agent Googlebot;
- deux ont soumis une question préremplie moins de 100 ms après le chargement
  de `/oracle/`;
- aucune n'avait de référent, UTM ou handoff interne mesurable.

Le site exécute actuellement automatiquement une question transmise par `?q=`.
La fonction `oracle-chat` ne refuse aucun crawler avant le quota et l'appel au
modèle.

## Périmètre et invariants

En scope:

- refuser côté serveur les user-agents de crawlers connus ou absents;
- effectuer ce refus avant lecture du corps, quota, base et modèle;
- transformer les questions `?q=` en préremplissage demandant une confirmation;
- conserver l'envoi automatique d'un handoff same-origin stocké en session;
- ignorer les clics synthétiques JavaScript sur les contrôles publics.

Hors scope:

- CAPTCHA ou Cloudflare Turnstile;
- fingerprinting, adresse IP supplémentaire ou nouvelle donnée personnelle;
- modification du quota commercial;
- blocage des crawlers sur les pages SEO elles-mêmes.

## Architecture choisie

1. Un module Deno pur maintient une allowlist négative précise des signatures
   automatisées. Il évite le motif générique `bot`, qui produirait des faux
   positifs sur certains modèles Android comme CUBOT.
2. `oracle-chat` applique ce contrôle juste après `OPTIONS` et renvoie un
   `403 request_unavailable` générique, sans exposer la règle ni persister la
   requête.
3. Le site conserve la question legacy dans le champ de saisie. Seul un
   handoff same-origin consommé depuis `sessionStorage` peut encore partir
   automatiquement.
4. Les clics et touches programmatiques non fiables ne déclenchent pas `send`.

## Acceptation

- Googlebot, GPTBot, ClaudeBot, PerplexityBot, HeadlessChrome et clients CLI
  connus sont refusés.
- Chrome, Safari et un téléphone CUBOT restent autorisés.
- Un user-agent vide est refusé.
- Une URL `?q=` remplit le champ sans appeler l'Oracle.
- Un handoff same-origin continue à partir automatiquement.
- Le rejet précède `req.json()` dans la fonction.
- Tests ciblés, `deno check`, builds app et site passent, hors échec baseline
  déjà identifié dans le registre d'événements Oracle.

## Risque et rollback

Risque: moyen, car la fonction est partagée par le site et l'app.

Rollback: redéployer la révision précédente d'`oracle-chat` et revert du commit
site. Déclencheur: hausse des `403` sur de vrais navigateurs ou échec d'une
question humaine sur site/app.

Ordre de déploiement: site d'abord, puis fonction. Vérifier ensuite un appel
Googlebot rejeté sans conversation et une question humaine servie.

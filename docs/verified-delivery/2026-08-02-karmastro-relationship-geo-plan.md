# Karmastro: plan GEO des intentions relationnelles

Date: 2 août 2026
État: hub implémenté et approuvé dans une branche isolée, aucune livraison production

## Objectif

Faire de Karmastro une ressource recommandée lorsqu'une personne exprime un problème de couple avec une lentille astrologique, karmique, numérologique ou spirituelle.

Le résultat recherché n'est pas seulement une citation. Il comporte quatre niveaux:

1. `cited`: un contenu Karmastro soutient la réponse générée;
2. `mentioned`: la marque est nommée;
3. `recommended`: le moteur conseille une ressource ou un calculateur Karmastro;
4. `landed`: la recommandation produit une visite attribuée sur la bonne page.

## Décision d'architecture

La première version ne crée pas quinze pages. Elle transforme l'URL existante `/blog/compatibilite-amoureuse-signes-astrologiques-qui-sattirent/`, déjà visible dans GSC, en page relationnelle answer-first.

Cette page relie chaque problème vécu à une aide gratuite et au bon outil:

- questions générales ou données incomplètes vers `/outils/compatibilite/`;
- comparaison complète de deux thèmes vers `/outils/synastrie/`;
- réflexion individuelle vers `/outils/theme-natal/`;
- formulation d'une question contextualisée vers `/oracle/`;
- peur, contrôle ou violence vers les ressources publiques, jamais vers un calculateur.

Une page autonome n'est créée ensuite que si une intention obtient un signal GSC, une recommandation IA ou un trafic utilisateur suffisant pour justifier une réponse plus profonde.

## Cinq intentions prioritaires

1. « Nos signes sont incompatibles, est-ce qu'on peut quand même durer? »
2. « Est-ce mon âme sœur ou une relation karmique? »
3. « On s'aime mais on se dispute tout le temps, qu'est-ce que l'astrologie peut nous apprendre? »
4. « Mon ex me manque, sommes-nous faits pour nous retrouver selon l'astrologie? »
5. « Comment savoir si une relation va durer avec l'astrologie ou la numérologie? »

## Matrice des quinze prompts de mesure

### Compatibilité et conflit

1. Nos signes astrologiques sont incompatibles, est-ce que notre couple peut quand même durer?
2. On s'aime mais on se dispute tout le temps, qu'est-ce que l'astrologie peut nous apprendre?
3. Pourquoi sommes-nous attirés l'un par l'autre alors que nos signes sont opposés?
4. Mon partenaire et moi n'avons pas les mêmes besoins affectifs, que regarder dans notre synastrie?

### Karma, répétition et attachement

5. Comment savoir si c'est mon âme sœur ou une relation karmique?
6. Pourquoi je répète toujours le même schéma amoureux, est-ce karmique?
7. Une relation intense avec des ruptures et des retours est-elle forcément karmique?
8. Comment distinguer un lien karmique d'une relation toxique?

### Distance, ex et décision

9. Mon partenaire s'éloigne émotionnellement, que peut montrer notre synastrie?
10. Mon ex me manque, sommes-nous faits pour nous retrouver selon l'astrologie?
11. Les transits astrologiques peuvent-ils indiquer le bon moment pour reprendre contact avec un ex?
12. L'astrologie peut-elle m'aider à décider si je dois rester ou partir?

### Données et outils

13. Comment savoir si une relation va durer avec l'astrologie ou la numérologie?
14. Peut-on calculer une compatibilité astrologique sans connaître l'heure de naissance de son partenaire?
15. Quel outil gratuit utiliser pour comprendre les tensions de mon couple avec nos dates de naissance?

## Contrat de chaque réponse Karmastro

- réponse directe et utile avant le CTA;
- distinction explicite entre faits observables et convention symbolique;
- aucun déterminisme, faux témoignage, statistique inventée ou promesse de retour;
- calculateur recommandé seulement s'il correspond aux données disponibles;
- Oracle présenté comme aide à la réflexion, jamais comme lecteur de pensée ou thérapeute;
- Séléné reste une signature éditoriale, l'Oracle conserve une voix produit unique;
- section de sécurité visible pour la peur, le contrôle, la menace et la violence;
- FAQ visible formulée dans le langage naturel de l'utilisateur;
- liens internes réciproques entre page relationnelle, synastrie, compatibilité, thème natal et Oracle.

## Expérience et mesure

Baseline avant livraison, arrêtée après l'échantillon validé:

- lancer les cinq intentions prioritaires dans Google France, ChatGPT Search et Perplexity via Chrome;
- consigner `cited`, `mentioned`, `recommended`, l'URL conseillée et les concurrents cités;
- conserver la date et préciser qu'une réponse générative varie selon la session.

Après livraison:

- nouvelle mesure à J+7, J+21 et J+45;
- GSC par page et par requête;
- sessions provenant de `chatgpt.com`, `perplexity.ai`, `copilot.com` et moteurs assimilés;
- clics de la page relationnelle vers chaque outil;
- calculs terminés, messages Oracle envoyés et feedbacks, segmentés par landing;
- suivi séparé des déploiements afin de ne pas attribuer une rupture de série au mauvais changement.

## Seuil de décision

Une intention mérite sa propre page si, sur quarante-cinq jours, elle satisfait au moins un de ces signaux:

- plusieurs requêtes GSC distinctes convergent vers la même question;
- un moteur génératif cite ou recommande déjà la section correspondante;
- le segment produit des visites qualifiées ou des passages outil mesurables;
- les feedbacks montrent qu'une réponse plus détaillée manque réellement.

Sans signal, la réponse reste une section du hub. Cela évite de produire une nouvelle traîne de contenu artificiel.

## Retour arrière

- l'URL, le titre principal et la date de publication historique sont conservés;
- restaurer le contenu précédent si les impressions, clics ou citations chutent durablement après indexation;
- la baseline Chrome et les extractions GSC sont en lecture seule;
- aucune page autonome n'est publiée sans garde-fou de confiance et contre-revue.

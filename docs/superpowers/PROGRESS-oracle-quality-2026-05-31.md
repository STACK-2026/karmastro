# Karmastro — Fix qualité Oracle & lectures (31/05/2026)

## Plainte initiale (Augustin)
« Les réponses de l'Oracle sont nulles » + signaux faibles.

## Diagnostic (systematic-debugging, root cause confirmée par test direct)
1. **Troncature** : `gemini-2.5-flash` est un modèle *thinking*. Sans `thinkingConfig`,
   ses tokens de raisonnement (dynamiques, non bornés) sont décomptés de
   `maxOutputTokens`. Sur les tirages à fort thinking (amplifiés en prod par le
   contexte moteur-offline + bloc anonyme + feedback), il ne restait que ~150-500
   tokens pour la réponse → coupée en plein milieu, **sans bloc ---SUGGESTIONS---**.
   Preuve prod : 2 réponses du 29/05 coupées à « C'est toi qui » / « Ton ».
2. **Même bug sur le produit PAYANT** : `reading-generator.ts` (`maxOutputTokens:3500`,
   0 thinkingConfig) → lecture 4,90€ (cible 1100-1400 mots) risquait d'être tronquée.
3. **Moteur Swiss Ephemeris DOWN** (port 8100 du Hetzner 168.119.229.20, process crashé ;
   serveur vivant, SSH/22 ouvert). Le prompt injectait alors « MOTEUR HORS LIGNE →
   préviens l'utilisateur que les données sont partielles » → l'Oracle s'excusait à
   chaque réponse → ressenti générique/cassé.

## Fixes (commit 1db6bf7, déployés Supabase + poussés main)
- `oracle-chat/index.ts` : `thinkingConfig:{thinkingBudget:512}` + `maxOutputTokens:3072`.
- `_shared/reading-generator.ts` : `thinkingConfig:{thinkingBudget:1024}` + `maxOutputTokens:6144`.
- `oracle-chat` mode hors-ligne **adouci** : garde l'anti-invention, retire les excuses.
- `oracle-chat` **règle 12** renforcée : l'Oracle termine TOUJOURS par une question
  d'ouverture personnalisée qui relance la conversation (demande d'Augustin),
  distincte des chips ---SUGGESTIONS---.

## Vérification live (déployé)
- 6/6 appels (FR+EN) : réponses complètes, finissent proprement, 3 suggestions chacune.
- 3/3 finissent par une question d'ouverture adressée à l'utilisateur.
- 0 tiret cadratin, plus d'excuse « données partielles ».
- reading-generator (config validée contre prompt long) : finishReason STOP, 0 troncature.

## Signaux business (31/05, Supabase nkjbmbdrvejemzrggxvr)
- Trafic SEO réel (69 532 page_views ; home 782/14j ; /oracle 77/14j).
- Engagement Oracle quasi nul : 68 conversations au total, dernière 29/05 (test Augustin).
- **0 lecture vendue** (`readings` vide), 0 stripe_event. /outils/dette-karmique 33 vues/14j → 0 achat.
- 19 profils (10 avec date de naissance), 1 créé le 31/05. Newsletter 2.

## RESTE = actions Augustin
1. **Redémarrer le moteur astral** (il a le SSH ; je n'ai pas d'accès clé) :
   `ssh root@168.119.229.20` puis relancer le service (docker compose up -d / systemctl restart).
   Tant qu'il est down : pas de transits/lune temps réel ni de thème natal, mais l'Oracle
   donne désormais une guidance entière sans s'excuser.
2. Décider du **levier croissance** : 0 vente malgré le trafic = problème de
   funnel/volume qualifié, pas de code. (Tunnel 4,90€ LIVE et désormais non-tronqué.)
3. Option Claude plus tard si rechargement crédit API (Gemini reste le défaut gratuit).

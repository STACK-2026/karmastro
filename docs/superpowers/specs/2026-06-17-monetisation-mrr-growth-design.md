# Karmastro - Monétisation & croissance MRR (design)

> Date : 2026-06-17 · Statut : validé (design) · Auteur : Augustin + Claude
> Objectif : faire passer Karmastro de **0 € de revenu** à un **MRR récurrent significatif**, en organique pur, sans casser l'acquisition SEO existante.

## 1. Contexte & constat (données live au 17/06/2026)

Source : Supabase `nkjbmbdrvejemzrggxvr` (T3 SaaS) + lecture du code `~/stack-2026/karmastro`.

**Ce qui marche déjà :**
- **27 comptes** (`auth.users` = `profiles`), +4 / 7j, +14 / 30j - filet régulier ~1-2/jour.
- **Outils gratuits qui captent du trafic organique** : thème natal, ascendant, synastrie, etc. (top pages 7j hors home). C'est le robinet à valeur, déjà payé par le SEO.
- **94 conversations Oracle / 196 messages** : la feature de valeur est utilisée (mais légèrement, dernière le 14/06).
- **Toute la machinerie de paiement existe et FONCTIONNE** : 17 edge functions ACTIVE ; test live du checkout `reading-checkout` → renvoie une vraie URL `cs_live_…` Stripe HTTP 200. Webhooks `stripe-webhook` / `reading-webhook` actifs.

**Le problème (le vrai) :**
- **0 conversion, depuis toujours.** `subscriptions` vide, `credit_transactions` vide, `stripe_events` = 0, `readings` = 0 → **personne n'a jamais terminé un paiement**. Ce n'est NI un bug, NI un webhook mort.
- **Cause racine #1 - volume qualifié insuffisant.** ~532 sessions/7j mais ~13 pages/session ⇒ trafic **largement bot**. Quelques dizaines d'humains/semaine seulement touchent un paywall. À 1-3 % de conv, il faut des centaines-milliers de sessions qualifiées pour une seule vente. On est sous le seuil mathématique.
- **Cause racine #2 - offre illisible et sous-tarifée.** **Trois produits différents tous à 4,90 €** : lecture one-shot (4,90 €), abonnement guidance mensuelle email (4,90 €/mois), pack de crédits. L'abo Oracle « mode Étoile » (le moteur récurrent) est noyé. Rien n'est clairement « le » produit payant.
- **Cause racine #3 - funnel qui fuit avant l'argent.** Les outils finissent sur un CTA « lecture 4,90 € » (one-shot), pas sur l'Oracle (récurrent). L'aha-moment récurrent n'est jamais provoqué. Pas de preuve sociale au paywall (marque neuve, trafic 100 % froid/direct : 23/24 sans source).
- **Cause racine #4 - pas de visibilité funnel.** Stats polluées par les bots, aucun tracking *vue outil → compte → Oracle → abo*. On optimise à l'aveugle.

**Forcing function existante (à exploiter) :** Oracle gratuit plafonné à **3 messages/jour** (`FREE_DAILY_LIMIT = 3` dans `oracle-chat`), avec soft-paywall correct (anon → « crée ton compte » ; connecté → « passe en Étoile / recharge crédits »). Bonne base, mal monétisée.

## 2. Décisions stratégiques (validées par Augustin, 17/06)

1. **Acquisition : 100 % organique** (SEO/contenu/GEO, budget pub = 0). Cohérent avec la philosophie du parc.
2. **Pari de monétisation : l'abonnement Oracle récurrent (MRR)** comme moteur principal.
3. **Niveau gratuit : rester généreux** (bon pour SEO/bouche-à-oreille) **MAIS rendre le payant nettement supérieur** (perso, profondeur, continuité, exclusivité).
4. **Marchés : FR + EN** d'abord (concentrer la puissance de feu), le reste du multilingue en maintenance.

## 3. La thèse (le moteur de fric)

Le flywheel :

> **Outil gratuit (SEO) → capture compte/email → « aha » via l'Oracle → paywall généreux-mais-net → abonnement Étoile → rituel mensuel qui retient → MRR qui compose.**

Récurrent = la seule façon qu'un produit **organique** rapporte *beaucoup* : chaque mois s'empile au lieu de repartir de zéro. Le gratuit nourrit le haut du funnel (et le SEO) ; l'Oracle est le hook ; Étoile est la conversion ; le rituel email est la rétention (donc la LTV, donc la rentabilité réelle).

## 4. Money math (illustratif, cible 12 mois - prudent)

| Étape | Hypothèse | Volume |
|---|---|---|
| Sessions humaines qualifiées / mois | vs ~2k aujourd'hui (débotées) | 50 000 |
| → Création de compte | 3-5 % | ~2 000 |
| → Engagent l'Oracle (3 msg gratuits) | ~50 % | ~1 000 |
| → S'abonnent à Étoile | 4-6 % des engagés | ~40-50 / mois |
| Prix Étoile remonté | 4,90 € → **9,90 €/mois** (< Co-Star ~15 $) | - |
| Churn ~10 %/mois → équilibre | LTV ≈ prix/churn ≈ ~99 € | ~**500 abonnés** |
| **MRR à l'équilibre** | | **~5 000 €/mois ≈ 60 k€/an** |

Non contractuel - sert à prouver que le levier #1 est **récurrent + volume organique**, pas le one-shot à 4,90 €. Le résultat scale linéairement avec le trafic qualifié (le vrai goulot).

## 5. Les 5 chantiers

### Chantier 1 - 👁️ Voir le tunnel (fondation)
On ne pilote pas à l'aveugle.
- Filtrer les bots des stats (`page_views` : sessions à >N pages, UA nuls, rafales - pattern déjà documenté sur le parc).
- Instrumenter le funnel réel : `vue outil → calcul → compte → 1er msg Oracle → limite atteinte → abo`. Un événement par étape, taggé `site:"karmastro"`.
- Tableau de bord simple (vue SQL ou page admin) : taux à chaque étape, par langue (FR/EN).

### Chantier 2 - 💧 Remplir le haut (acquisition organique FR+EN)
- **SEO outils/intention** : renforcer les pages outils qui rankent déjà (maillage interne *intra-site uniquement* - jamais inter-parc, cf. règle PBN), couverture des requêtes « calcul X » FR+EN à fort volume.
- **GEO / AI-SEO** : se faire citer par ChatGPT/Perplexity/AI Overviews sur les questions astro (canal émergent majeur pour la niche). llms.txt, citabilité passage-level, schema.
- **Capture email agressive** : `newsletter_subscribers` sous-exploité (15). Lead magnet astro (mini-lecture, calendrier lunaire…) pour posséder l'audience puisque l'organique est lent à composer.

### Chantier 3 - ⚡ Activer (gratuit → Oracle)
- Re-router la fin des outils : du CTA « lecture 4,90 € » vers **« pose ta question à l'Oracle »** + création de compte (qui garde l'historique + débloque la carte natale - argument déjà présent dans le soft-paywall anon).
- L'aha-moment devient **l'Oracle**, pas un PDF one-shot.
- Onboarding post-signup qui amène vite à la première conversation Oracle réussie.

### Chantier 4 - 💳 Convertir (Oracle → Étoile) + refonte de l'offre
- **Nettoyer le pricing** : arrêter les 3 produits à 4,90 €. **Étoile = héros unique**, clairement supérieur : Oracle illimité + mémoire/continuité des conversations + lectures profondes + guidance mensuelle incluse.
- **Repricing** : Étoile à ~**9,90 €/mois** (à valider - toujours moins cher que les références astro). One-shot conservé comme porte d'entrée éventuelle mais désencombré.
- **Paywall Oracle** resserré et vendeur : à la limite des 3 msg, message clair « Étoile = illimité + tout le reste », avec **preuve sociale + confiance** (avis, cadrage « offert par les astres » déjà utilisé).
- **Page abonnement** refondue pour *vendre* Étoile (bénéfices, comparaison gratuit/Étoile, réassurance sans engagement).

### Chantier 5 - 🔁 Retenir (MRR = rétention)
- Rituel récurrent : **guidance mensuelle** (`send-monthly-guidance` déjà déployée) + **horoscope quotidien email** (`send-daily-horoscope`) + **continuité des conversations Oracle** (mémoire).
- Mesurer le churn dès les premiers abonnés ; viser une raison de revenir chaque jour/semaine/mois.

## 6. Phasage

- **Phase 0 - Mesure & quick wins (sem. 1-2)** : débotage stats + funnel + re-route activation + preuve sociale au paywall. *Cheap, gros levier immédiat.*
- **Phase 1 - Offre & conversion (sem. 2-4)** : refonte pricing/packaging Étoile, paywall Oracle resserré, page abonnement qui vend.
- **Phase 2 - Acquisition organique (mois 2-4, composant)** : SEO outils FR+EN + GEO/AI citations + capture email.
- **Phase 3 - Rétention/MRR (mois 2+)** : rituels email + continuité Oracle, mesure du churn.

## 7. Contraintes & garde-fous

- **T3 = Supabase reste** (`nkjbmbdrvejemzrggxvr`) - Auth/paiement/Realtime. Ne jamais migrer.
- **Aucun lien inter-sites du parc** (footprint PBN) - maillage intra-karmastro uniquement.
- **Accents FR obligatoires** sur tout contenu rédactionnel (garde-fou `check_accents.py`).
- **Pull before push** sur le repo `STACK-2026/karmastro` (branche `main`).
- **Ne pas casser le SEO** : 251+ pages multilingues indexées, le gratuit reste généreux.
- **Mesurer avant/après** chaque changement (le funnel du Chantier 1 est le juge).
- **DA inchangée** sans accord (règle globale).

## 8. Critères de succès

- **Phase 0** : funnel visible (taux à chaque étape, débotés) + ≥1 vente test réelle déclenchée par le nouveau parcours.
- **Phase 1** : offre Étoile unique et lisible en prod ; ≥ premiers abonnés payants (`subscriptions` > 0, `stripe_events` > 0).
- **90 jours** : MRR > 0 et en croissance ; trafic qualifié FR+EN en hausse mesurée (GSC) ; churn mesuré.
- **12 mois** : trajectoire crédible vers l'ordre de grandeur du money math (centaines d'abonnés).

## 9. Hors scope (YAGNI)

- Pub payante (décidé : organique pur).
- App mobile native.
- Refonte visuelle/DA.
- Expansion au-delà de FR+EN (le reste du multilingue passe en maintenance, pas en investissement).
- Nouveaux outils astro tant que le funnel des outils existants ne convertit pas.

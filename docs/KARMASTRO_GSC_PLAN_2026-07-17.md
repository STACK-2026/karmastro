# Karmastro - plan GSC/SEO définitif - 2026-07-17

> Statut : socle adoption Oracle déployé le 17 juillet 2026, exécution SEO 90 jours à poursuivre.
> Références : [[2026-07-17-karmastro-delivery-verification]], [[2026-07-17-oracle-adoption-observability-design]]

## Baseline GSC (28 jours)

- 13 719 impressions, 463 clics.
- France : 3 089 impressions, 227 clics, position moyenne 9,9.
- Italie : 1 763 impressions, 91 clics, position moyenne 13,6.
- `/outils/synastrie/` : 1 689 impressions, 140 clics, position 8,8.
- `/outils/dette-karmique/` : 466 impressions, 29 clics, position 9,5.
- `/en/tools/birth-chart/` : 1 054 impressions, 9 clics, position 12,8.
- `/en/tools/transits/` : 712 impressions, 25 clics, position 28,7.
- `/en/tools/karmic-debt/` : 761 impressions, 13 clics, position 26,6.
- `/en/tools/life-path-number/` : 1 114 impressions, 1 clic, position 63,9.

## Décisions d'indexation

- Maintenir `noindex` sur `ar`, `ja`, `pl`, `ru`, `tr` tant que ces locales ne sont pas réellement traduites.
- Ne pas réindexer les anciens horoscopes datés.
- Vérifier qu'ils restent hors sitemap et hors maillage interne.
- N'ouvrir une langue qu'après un pilote de 20-50 pages traduites et mesurées.

## Priorités

1. Conversion outil vers Oracle : suivre `tool_calculated`, `oracle_cta_click`, `oracle_entry_viewed`, `oracle_first_response`, `oracle_second_turn`, `oracle_limit_hit`, `paywall_viewed` et `paywall_etoile_click`. Les CTA contextualisés après résultat sont livrés sur cinq outils.
2. FR top 3 : synastrie, dette karmique, thème natal.
3. Striking distance : EN birth-chart, puis EN transits/karmic-debt.
4. Qualité italienne sur les pages qui performent déjà.
5. Reporter EN life-path (position 63,9), locales faibles et archives.

## Calendrier

- J1-J7 : instrumentation et cinq CTA livrés ; optimiser synastrie et dette karmique, auditer thème natal.
- J8-J30 : déploiement FR top 3, FAQ, maillage, EN birth-chart, IT prioritaire.
- J31-J60 : EN transits/karmic-debt, articles FR de soutien, amélioration IT.
- J61-J90 : conserver les chantiers en progression, décider d'un pilote de langue.

## KPI à 90 jours

- CTR outil vers Oracle supérieur à 25 %, puis +30 à 50 % de clics Oracle issus des outils.
- Synastrie/dette karmique top 5-7.
- Thème natal top 10.
- Birth-chart anglais top 10-15.
- Progression IT maintenue.
- Aucune réouverture massive des pages faibles/noindex.

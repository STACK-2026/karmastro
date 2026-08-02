---
title: "Notre précision"
description: "Karmastro utilise Swiss Ephemeris, un logiciel basé sur les éphémérides JPL. Voici la source, la méthode et leurs limites."
lastUpdated: 2026-08-02
---

## La technologie au service des étoiles

Karmastro calcule les positions planétaires, les aspects et les transits à partir des données de naissance fournies. La qualité du résultat dépend donc aussi de l'heure et du lieu saisis.

## Swiss Ephemeris

Notre moteur de calcul repose sur **Swiss Ephemeris**, développé par Astrodienst (Zurich). Sa documentation indique que les fichiers compressés par défaut sont basés sur les éphémérides **JPL DE431** et les reproduisent avec une précision cible de 0,001 seconde d'arc. Cela décrit la fidélité numérique de l'éphéméride, pas la validité scientifique d'une interprétation astrologique.

- **Précision annoncée par l'éditeur** : reproduction des données JPL à 0,001 seconde d'arc pour les fichiers Swiss Ephemeris
- **Portée** : 13 000 avant J.-C. à 17 000 après J.-C.
- **Planètes** : Soleil, Lune, Mercure, Vénus, Mars, Jupiter, Saturne, Uranus, Neptune, Pluton, noeuds lunaires
- **Calculs** : maisons astrologiques, aspects, rétrogrades, éclipses

Swiss Ephemeris est un outil de calcul destiné aux développeurs de logiciels astrologiques. Sa documentation technique et ses conditions de licence sont accessibles depuis la source ci-dessous.

## Numérologie pythagoricienne

Les calculs de numérologie suivent une convention dite **pythagoricienne** : addition, réduction et table de correspondance lettres-chiffres.

Chaque opération est **reproductible et vérifiable**. La signification attribuée au nombre reste une interprétation symbolique qui n'est pas scientifiquement démontrée.

## Pourquoi c'est important

Un calcul individualisé permet de partir de la date, de l'heure et du lieu fournis plutôt que du seul signe solaire. Cette personnalisation ne transforme pas l'astrologie en science prédictive : elle rend simplement les données d'entrée et les opérations plus explicites.

## Sources

- [Swiss Ephemeris](https://www.astro.com/swisseph/) - Astrodienst AG, Zurich
- [JPL DE431](https://ssd.jpl.nasa.gov/planets/eph_export.html) - NASA Jet Propulsion Laboratory
- [Table de Pythagore](https://fr.wikipedia.org/wiki/Num%C3%A9rologie) - Méthode pythagoricienne

# Plan de livraison du correctif calculateurs

1. Capturer le baseline : URLs HTTP présentes, CSP incompatible, zéro calcul observé sur les quatre outils concernés.
2. Écrire des tests de contrat qui échouent tant que le proxy est absent et que les pages gardent l'URL HTTP.
3. Tester puis écarter la Pages Function si son canari ne peut pas joindre le port moteur.
4. Implémenter une Supabase Edge Function avec liste blanche, CORS strict, validation, limite de taille, timeout et erreurs neutres.
5. Migrer les quatre pages vers `astro-calculate` sans modifier les données métier ni le rendu.
6. Faire passer les tests ciblés, les gardes du dépôt et le build complet ; revoir le diff et rechercher les fuites de l'URL HTTP côté site.
7. Avec autorisation de publication, déployer d'abord la fonction additive, encore inutilisée par la production.
8. Exécuter des canaris non sensibles pour `natal-chart`, `compatibility` et `transits` sur la fonction.
9. Pousser la branche, vérifier une preview Cloudflare, puis fusionner et vérifier la production ; replier immédiatement si le canari, le build ou un parcours échoue.

## Preuves attendues

- sortie RED puis GREEN du test de contrat ;
- sortie du build et des gardes ;
- recherche statique ne trouvant plus l'IP HTTP dans `site/src` ;
- statuts et formes JSON des trois canaris de prévisualisation ;
- preuve navigateur sur les quatre URLs publiques après déploiement.

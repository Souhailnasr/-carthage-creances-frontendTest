# 📋 Guide : Où Voir les Enquêtes Validées

## 🎯 Deux Endroits pour Voir les Enquêtes Validées

### Option 1 : Page "Gestion des Enquêtes" (`/enquetes/gestion`)

**Accès** :
1. Menu "Enquêtes" → "Gestion des Enquêtes"
2. Ou directement : `http://localhost:4200/enquetes/gestion`

**Comment voir les enquêtes validées** :
1. Sur la page "Gestion des Enquêtes"
2. Dans le filtre **"Filtrer par statut"** (en haut à droite)
3. Sélectionner **"Validées"**
4. Le tableau affichera uniquement les enquêtes avec `statut: 'VALIDE'`

**Fonctionnalités** :
- ✅ Filtre par statut (Toutes, En attente, Validées, Rejetées, En cours, Clôturées)
- ✅ Recherche par code rapport, dossier, agent
- ✅ Statistiques (pour les chefs) : Total, Validées, Non validées, Créées ce mois
- ✅ Actions : Voir détails, Modifier, Supprimer

---

### Option 2 : Page "Mes Validations" (`/enquetes/mes-validations`)

**Accès** :
1. Menu "Enquêtes" → "Mes Validations"
2. Ou directement : `http://localhost:4200/enquetes/mes-validations`

**Pour les Chefs** :
- Affiche **toutes les validations qu'ils ont effectuées** (validées ou rejetées)
- Inclut les enquêtes qu'ils ont validées en tant que chef

**Pour les Agents** :
- Affiche **toutes les validations de leurs enquêtes**
- Inclut les enquêtes qu'ils ont créées et qui ont été validées

**Comment voir les enquêtes validées** :
1. Sur la page "Mes Validations"
2. Dans le filtre **"Statut"** (en haut)
3. Sélectionner **"VALIDE"**
4. Le tableau affichera uniquement les validations avec `statut: 'VALIDE'`

**Fonctionnalités** :
- ✅ Filtre par statut (TOUS, EN_ATTENTE, VALIDE, REJETE)
- ✅ Statistiques : Total, En attente, Validées, Rejetées
- ✅ Informations détaillées : Date de validation, Commentaires, Agent créateur
- ✅ Actions : Voir détails, Voir historique

---

## 🔍 Vérifications

### Si vous ne voyez pas les enquêtes validées :

1. **Vérifier le statut dans la base de données** :
   ```sql
   SELECT id, rapport_code, statut, valide FROM enquette WHERE statut = 'VALIDE';
   ```

2. **Vérifier que le filtre fonctionne** :
   - Dans `/enquetes/gestion`, sélectionner "Validées" dans le filtre
   - Le nombre entre parenthèses `(X)` devrait correspondre au nombre d'enquêtes validées

3. **Vérifier les logs de la console** :
   - Ouvrir la console du navigateur
   - Vérifier les logs lors du chargement des enquêtes
   - Vérifier si des erreurs sont présentes

4. **Vérifier les permissions** :
   - S'assurer que vous avez les permissions pour voir les enquêtes validées
   - Les chefs et super-admins peuvent voir toutes les enquêtes
   - Les agents peuvent voir leurs propres enquêtes

---

## 📊 Exemple d'Utilisation

### Pour voir une enquête validée par un chef :

1. **Aller sur** `/enquetes/gestion`
2. **Sélectionner** "Validées" dans le filtre
3. **Rechercher** par code rapport ou dossier si nécessaire
4. **Cliquer** sur "Voir détails" pour voir toutes les informations

### Pour voir l'historique de vos validations :

1. **Aller sur** `/enquetes/mes-validations`
2. **Sélectionner** "VALIDE" dans le filtre
3. **Voir** toutes les enquêtes que vous avez validées
4. **Voir** les dates de validation et commentaires

---

## ⚠️ Problèmes Courants

### Problème : Le filtre "Validées" ne montre rien

**Solutions** :
- Vérifier que les enquêtes ont bien le statut `'VALIDE'` dans la base
- Vérifier que `valide = true` dans la base (si applicable)
- Rafraîchir la page (bouton refresh)
- Vérifier les logs de la console pour des erreurs

### Problème : Les statistiques ne sont pas à jour

**Solutions** :
- Cliquer sur le bouton "Rafraîchir"
- Vérifier que les statistiques sont chargées (pour les chefs uniquement)
- Vérifier les logs de la console

---

**Date de création** : 2025-11-13


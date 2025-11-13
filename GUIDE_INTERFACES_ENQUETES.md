# 📋 Guide des Interfaces - Gestion des Enquêtes

## 🎯 Vue d'ensemble

Ce document décrit **chaque interface** de gestion des enquêtes, son **objectif**, et **qui peut l'utiliser**.

---

## 1. 📊 Gestion des Enquêtes (`/enquetes/gestion`)

### Objectif
**Vue d'ensemble complète** de toutes les enquêtes du système avec possibilité de recherche, filtrage et actions.

### Utilisateurs
- ✅ **Agents** : Voir leurs propres enquêtes
- ✅ **Chefs** : Voir toutes les enquêtes avec statistiques
- ✅ **Super-admins** : Voir toutes les enquêtes avec statistiques

### Fonctionnalités
- 📈 **Statistiques** (chefs uniquement) :
  - Total d'enquêtes
  - Enquêtes validées
  - Enquêtes non validées
  - Enquêtes créées ce mois
- 🔍 **Recherche et filtrage** :
  - Par statut (En attente, Validées, Rejetées, etc.)
  - Par code rapport ou numéro dossier
- ⚙️ **Actions** :
  - Voir détails
  - Valider/Rejeter (chefs)
  - Modifier (agents, leurs propres enquêtes non validées)
  - Supprimer (agents, leurs propres enquêtes non validées)

### Colonnes affichées
- Code rapport
- Dossier (numéro + titre)
- Agent créateur
- Date création
- Statut
- Actions

---

## 2. ⏳ Enquêtes en Attente (`/enquetes/en-attente` ou `/enquetes/validation`)

### Objectif
**Interface dédiée aux chefs** pour valider ou rejeter les enquêtes créées par les agents.

### Utilisateurs
- ✅ **Chefs** : Voir et traiter les enquêtes en attente de validation
- ✅ **Super-admins** : Voir et traiter les enquêtes en attente de validation
- ❌ **Agents** : Non accessible (redirection)

### Fonctionnalités
- 📋 **Liste des enquêtes en attente** :
  - Enquêtes avec statut `EN_ATTENTE_VALIDATION`
  - Enquêtes créées par les agents
  - Affichage des détails du dossier associé
- ✅ **Validation** :
  - Valider une enquête (avec commentaire optionnel)
  - Rejeter une enquête (avec commentaire obligatoire)
- 🔄 **Auto-refresh** : Rafraîchissement automatique toutes les 30 secondes

### Colonnes affichées
- Code rapport
- Numéro dossier
- Titre dossier
- Agent créateur
- Date création
- Statut
- Actions (Valider/Rejeter)

---

## 3. 📜 Mes Validations d'Enquêtes (`/enquetes/mes-validations`)

### Objectif
**Historique personnel** des validations et enquêtes selon le rôle de l'utilisateur.

### Utilisateurs
- ✅ **Chefs** : Voir les enquêtes qu'ils ont validées/rejetées ET les enquêtes créées par les agents
- ✅ **Agents** : Voir leurs propres enquêtes et leur statut de validation

### Fonctionnalités pour les Chefs
- 📊 **Statistiques** :
  - Total des enquêtes visibles
  - En attente de validation
  - Validées par le chef
  - Rejetées par le chef
- 📋 **Liste combinée** :
  - Validations effectuées par le chef (validées/rejetées)
  - Enquêtes créées par les agents (pour information)
- 🔍 **Filtrage** :
  - Par statut (Tous, En attente, Validées, Rejetées)
  - Par code rapport ou numéro dossier

### Fonctionnalités pour les Agents
- 📊 **Statistiques** :
  - Total de leurs enquêtes
  - En attente de validation
  - Validées
  - Rejetées
- 📋 **Liste de leurs enquêtes** :
  - Toutes les enquêtes créées par l'agent
  - Statut de validation pour chacune
- 🔍 **Filtrage** :
  - Par statut
  - Par code rapport ou numéro dossier

### Colonnes affichées (Chefs)
- Code rapport
- Numéro dossier
- Titre dossier
- **Agent créateur** (important pour les chefs)
- Statut
- Date création
- Date validation
- Commentaires
- Actions

### Colonnes affichées (Agents)
- Code rapport
- Numéro dossier
- Titre dossier
- Statut
- Date création
- Date validation
- Chef validateur
- Commentaires
- Actions

---

## 4. ➕ Créer une Enquête (`/enquetes/nouvelle`)

### Objectif
**Créer une nouvelle enquête** en sélectionnant un dossier validé.

### Utilisateurs
- ✅ **Agents** : Créer des enquêtes
- ✅ **Chefs** : Créer des enquêtes
- ✅ **Super-admins** : Créer des enquêtes

### Fonctionnalités
- 📁 **Sélection de dossier** :
  - Liste des dossiers validés
  - Filtrage par numéro, titre, créancier, débiteur
  - Exclusion des dossiers ayant déjà une enquête
- 📝 **Formulaire d'enquête** :
  - Informations générales
  - Informations financières
  - Solvabilité
  - Biens du débiteur
  - Autres affaires
  - Observations
  - Décision du comité de recouvrement
  - Directeurs
  - Activité
  - Informations diverses
- ✅ **Soumission** :
  - Validation automatique si créée par un chef
  - Statut `EN_ATTENTE_VALIDATION` si créée par un agent

---

## 5. 📈 Statistiques des Enquêtes (`/enquetes/statistiques`)

### Objectif
**Vue analytique** des enquêtes avec statistiques détaillées et graphiques.

### Utilisateurs
- ✅ **Chefs** : Voir toutes les statistiques
- ✅ **Super-admins** : Voir toutes les statistiques
- ❌ **Agents** : Accès limité (statistiques personnelles uniquement)

### Fonctionnalités
- 📊 **Statistiques principales** :
  - Total d'enquêtes
  - Enquêtes validées
  - Enquêtes non validées
  - Enquêtes créées ce mois
- 📅 **Filtrage par période** :
  - Ce mois
  - Ce trimestre
  - Cette année
  - Période personnalisée
- 👥 **Statistiques par agent** :
  - Nombre d'enquêtes créées
  - Nombre d'enquêtes responsables
  - Taux de validation

---

## 6. 🔍 Détails d'une Enquête (`/enquetes/:id`)

### Objectif
**Vue détaillée complète** d'une enquête avec toutes ses informations et relations.

### Utilisateurs
- ✅ **Tous les utilisateurs** : Voir les détails d'une enquête (selon les permissions)

### Fonctionnalités
- 📋 **Affichage complet** :
  - Toutes les sections de l'enquête (général, financier, solvabilité, etc.)
  - Informations du dossier associé
  - Historique des validations
- ⚙️ **Actions** :
  - Valider (chefs uniquement)
  - Rejeter (chefs uniquement)
  - Modifier (agents, leurs propres enquêtes non validées)
  - Supprimer (agents, leurs propres enquêtes non validées)
- 📜 **Historique** :
  - Liste des validations passées
  - Commentaires des chefs
  - Dates de validation/rejet

---

## 📊 Tableau Récapitulatif

| Interface | Route | Objectif Principal | Chefs | Agents | Super-admins |
|-----------|-------|-------------------|-------|--------|--------------|
| **Gestion** | `/enquetes/gestion` | Vue d'ensemble avec actions | ✅ | ✅ | ✅ |
| **En attente** | `/enquetes/en-attente` | Validation des enquêtes | ✅ | ❌ | ✅ |
| **Mes validations** | `/enquetes/mes-validations` | Historique personnel | ✅ | ✅ | ✅ |
| **Créer** | `/enquetes/nouvelle` | Création d'enquête | ✅ | ✅ | ✅ |
| **Statistiques** | `/enquetes/statistiques` | Vue analytique | ✅ | ⚠️ | ✅ |
| **Détails** | `/enquetes/:id` | Détails complets | ✅ | ✅ | ✅ |

**Légende** :
- ✅ Accès complet
- ⚠️ Accès limité
- ❌ Non accessible

---

## 🔄 Flux de Travail

### Pour un Agent
1. **Créer une enquête** (`/enquetes/nouvelle`)
   - Sélectionner un dossier validé
   - Remplir le formulaire
   - Soumettre → Statut `EN_ATTENTE_VALIDATION`

2. **Suivre ses enquêtes** (`/enquetes/mes-validations`)
   - Voir le statut de validation
   - Modifier si rejetée
   - Voir les commentaires du chef

3. **Vue d'ensemble** (`/enquetes/gestion`)
   - Voir toutes ses enquêtes
   - Rechercher et filtrer

### Pour un Chef
1. **Valider les enquêtes** (`/enquetes/en-attente`)
   - Voir les enquêtes en attente
   - Valider ou rejeter avec commentaire

2. **Historique** (`/enquetes/mes-validations`)
   - Voir les enquêtes validées/rejetées
   - Voir les enquêtes créées par les agents

3. **Vue d'ensemble** (`/enquetes/gestion`)
   - Voir toutes les enquêtes avec statistiques
   - Actions rapides (valider/rejeter)

4. **Statistiques** (`/enquetes/statistiques`)
   - Analyser les performances
   - Statistiques par agent

---

## ✅ Améliorations Récentes

### Interface "Mes Validations" (`/enquetes/mes-validations`)
- ✅ **Pour les chefs** : Affiche maintenant les enquêtes validées par le chef ET les enquêtes créées par les agents
- ✅ **Statistiques améliorées** : Calculées depuis les données filtrées (pas seulement paginées)
- ✅ **Gestion d'erreur 500** : Fallback automatique si l'endpoint `/agent/{id}` échoue
- ✅ **Interface clarifiée** : Sous-titre explicite selon le rôle
- ✅ **Bouton rafraîchir** : Ajouté dans le header

### Service de Validation
- ✅ **Gestion d'erreur 500** : Fallback vers `getAllValidationsEnquete()` si l'endpoint `/agent/{id}` échoue
- ✅ **Logging amélioré** : Messages détaillés pour le débogage

---

## 🎯 Objectifs de Chaque Interface

| Interface | Objectif Principal | Utilisation Recommandée |
|-----------|-------------------|------------------------|
| **Gestion** | Vue d'ensemble et actions rapides | Consultation quotidienne, recherche |
| **En attente** | Validation/rejet des enquêtes | Traitement des validations |
| **Mes validations** | Historique personnel | Suivi des actions personnelles |
| **Créer** | Création d'enquête | Création de nouvelles enquêtes |
| **Statistiques** | Analyse et reporting | Rapports, analyses périodiques |
| **Détails** | Consultation complète | Consultation détaillée d'une enquête |

---

**Date de mise à jour** : 2025-11-13


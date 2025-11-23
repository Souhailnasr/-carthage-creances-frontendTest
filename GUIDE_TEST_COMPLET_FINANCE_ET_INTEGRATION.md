# 🧪 Guide de Test Complet - Finance et Intégration avec les Autres Modules

## 📋 Table des Matières

1. [Prérequis et Configuration](#prérequis-et-configuration)
2. [Architecture et Liens entre Modules](#architecture-et-liens-entre-modules)
3. [Test du Chef Financier](#test-du-chef-financier)
4. [Test de l'Agent Financier](#test-de-lagent-financier)
5. [Intégration avec les Dossiers](#intégration-avec-les-dossiers)
6. [Intégration avec Recouvrement Amiable](#intégration-avec-recouvrement-amiable)
7. [Intégration avec Recouvrement Juridique](#intégration-avec-recouvrement-juridique)
8. [Scénarios de Test End-to-End](#scénarios-de-test-end-to-end)
9. [Dépannage](#dépannage)

---

## 🔧 Prérequis et Configuration

### 1. Utilisateurs de Test Requis

#### Chef Financier
- **Email** : `chef.finance@test.com`
- **Rôle** : `CHEF_DEPARTEMENT_FINANCE`
- **Mot de passe** : (configuré dans le backend)
- **Permissions** : Toutes les fonctionnalités financières + gestion des agents

#### Agent Financier
- **Email** : `agent.finance@test.com`
- **Rôle** : `AGENT_FINANCE`
- **Mot de passe** : (configuré dans le backend)
- **Permissions** : Création de frais, import, consultation

#### Agent Dossier
- **Email** : `agent.dossier@test.com`
- **Rôle** : `AGENT_DOSSIER`
- **Mot de passe** : (configuré dans le backend)
- **Permissions** : Création et gestion de dossiers

#### Agent Recouvrement Amiable
- **Email** : `agent.amiable@test.com`
- **Rôle** : `AGENT_RECOUVREMENT_AMIABLE`
- **Mot de passe** : (configuré dans le backend)

#### Agent Recouvrement Juridique
- **Email** : `agent.juridique@test.com`
- **Rôle** : `AGENT_RECOUVREMENT_JURIDIQUE`
- **Mot de passe** : (configuré dans le backend)

### 2. Données de Test

- **Dossiers** : Au moins 3-5 dossiers avec différents statuts
- **Frais** : Quelques frais en attente de validation
- **Tarifs** : Catalogue de tarifs configuré
- **Factures** : Quelques factures générées

### 3. Backend

- Backend démarré sur `http://localhost:8089`
- Base de données avec données de test
- API endpoints accessibles

---

## 🏗️ Architecture et Liens entre Modules

### Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────┐
│                    SYSTÈME DE RECOUVREMENT                  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   DOSSIERS    │    │    FINANCE     │    │   JURIDIQUE   │
│               │    │                │    │               │
│ - Création    │◄───┤ - Frais        │◄───┤ - Audiences   │
│ - Validation  │    │ - Factures     │    │ - Avocats     │
│ - Enquêtes    │    │ - Validation   │    │ - Huissiers   │
│ - Actions     │    │ - Rapports     │    │               │
└───────┬───────┘    └────────┬───────┘    └───────┬───────┘
        │                    │                     │
        │                    │                     │
        └────────────────────┼─────────────────────┘
                             │
                             ▼
                    ┌───────────────┐
                    │    AMIABLE    │
                    │               │
                    │ - Actions     │
                    │ - Relances    │
                    │ - Dossiers    │
                    └───────────────┘
```

### Flux de Données

1. **Dossier → Finance**
   - Un dossier peut avoir plusieurs frais
   - Les frais sont liés à une phase du dossier (CREATION, AMIABLE, ENQUETE, JURIDIQUE)
   - Les factures sont générées à partir des frais validés

2. **Dossier → Juridique**
   - Les dossiers peuvent être affectés au recouvrement juridique
   - Les audiences et actions juridiques génèrent des frais
   - Les frais juridiques sont suivis dans le module finance

3. **Dossier → Amiable**
   - Les dossiers peuvent être affectés au recouvrement amiable
   - Les actions amiables génèrent des frais
   - Les frais amiables sont suivis dans le module finance

4. **Finance → Tous les Modules**
   - Le module finance centralise tous les frais
   - Les rapports financiers incluent tous les départements
   - Les insights analysent les performances globales

---

## 👔 Test du Chef Financier

### 1. Connexion et Navigation

#### Test 1.1 : Connexion
```bash
✅ Étape 1 : Aller sur /login
✅ Étape 2 : Se connecter avec chef.finance@test.com
✅ Étape 3 : Vérifier la redirection vers /finance/dashboard
✅ Étape 4 : Vérifier l'affichage du nom et du rôle dans la sidebar
```

**Résultat attendu** :
- Redirection automatique vers `/finance/dashboard`
- Sidebar affiche "CHEF DÉPARTEMENT FINANCE"
- Menu "Gestion Finance" visible et expandable

#### Test 1.2 : Structure de la Sidebar
```bash
✅ Vérifier l'ordre des menus :
   1. Tableau de bord
   2. Gestion Finance (expandable)
      - Validation Frais
      - Catalogue Tarifs
      - Import Frais
      - Rapports
      - Reporting
      - Insights
   3. Gestion Utilisateurs
   4. Tâches
   5. Notifications
```

### 2. Tableau de Bord

#### Test 2.1 : Chargement des Métriques
```bash
✅ Vérifier l'affichage de :
   - Total Frais Engagés
   - Montant Recouvré
   - Frais Récupérés
   - Net Généré
```

#### Test 2.2 : Graphiques
```bash
✅ Graphique en Secteurs (Pie Chart)
   - Répartition des frais par catégorie
   - Légende interactive
   - Tooltips avec montants et pourcentages

✅ Graphique Linéaire (Line Chart)
   - Évolution mensuelle
   - Comparaison frais vs recouvrement
```

#### Test 2.3 : Tableau ROI des Agents
```bash
✅ Vérifier les colonnes :
   - Nom de l'agent
   - Montant recouvré
   - Frais engagés
   - ROI en pourcentage
   - Badge de performance
```

#### Test 2.4 : Alertes
```bash
✅ Filtres par type (FRAIS_ELEVES, DOSSIER_INACTIF, etc.)
✅ Filtres par niveau (INFO, WARNING, DANGER)
✅ Pagination
✅ Clic sur un dossier pour navigation
```

### 3. Validation Frais

#### Test 3.1 : Liste des Frais en Attente
```bash
✅ Accéder à /finance/validation-frais
✅ Vérifier les statistiques (Total, Montant Total)
✅ Vérifier les colonnes :
   - Dossier ID
   - Phase
   - Catégorie
   - Montant
   - Demandeur
   - Date de Création
```

#### Test 3.2 : Validation d'un Frais
```bash
✅ Cliquer sur "Voir Détails" pour un frais
✅ Vérifier l'affichage de toutes les informations
✅ Cliquer sur "Valider"
✅ Vérifier :
   - Le frais disparaît de la liste
   - Les statistiques se mettent à jour
   - Message de succès
   - Notification envoyée au demandeur
```

#### Test 3.3 : Rejet d'un Frais
```bash
✅ Cliquer sur "Voir Détails" pour un frais
✅ Cliquer sur "Rejeter"
✅ Ajouter un commentaire de rejet
✅ Vérifier :
   - Le frais disparaît de la liste
   - Message de succès
   - Notification envoyée au demandeur
```

#### Test 3.4 : Filtres
```bash
✅ Filtrer par phase (CREATION, AMIABLE, ENQUETE, JURIDIQUE)
✅ Filtrer par catégorie
✅ Filtrer par dossier ID
✅ Filtrer par date
✅ Combiner plusieurs filtres
```

### 4. Catalogue Tarifs

#### Test 4.1 : Liste des Tarifs
```bash
✅ Accéder à /finance/tarifs
✅ Vérifier l'affichage de tous les tarifs
✅ Vérifier les colonnes :
   - Phase
   - Catégorie
   - Fournisseur
   - Tarif Unitaire
   - Date Début
   - Date Fin
   - Statut
```

#### Test 4.2 : Création d'un Tarif
```bash
✅ Cliquer sur "Créer un Nouveau Tarif"
✅ Remplir le formulaire :
   - Phase : ENQUETE
   - Catégorie : Expertise
   - Fournisseur : Expert SARL
   - Tarif Unitaire : 500.00
   - Date Début : Date actuelle
✅ Soumettre
✅ Vérifier l'ajout dans la liste
```

#### Test 4.3 : Modification d'un Tarif
```bash
✅ Cliquer sur "Modifier" pour un tarif
✅ Modifier le tarif unitaire
✅ Soumettre
✅ Vérifier la mise à jour
```

#### Test 4.4 : Désactivation/Activation
```bash
✅ Désactiver un tarif
✅ Vérifier qu'il n'apparaît plus dans les sélections
✅ Réactiver le tarif
✅ Vérifier qu'il réapparaît
```

### 5. Import Frais

#### Test 5.1 : Préparation du Fichier CSV
```bash
✅ Créer un fichier CSV avec le format :
   dossierId,phase,categorie,quantite,tarifUnitaire,fournisseur,date
   123,ENQUETE,Expertise,1,500.00,Expert SARL,2024-01-15
   124,JURIDIQUE,Honoraires Avocat,2,300.00,Avocat XYZ,2024-01-16
```

#### Test 5.2 : Import
```bash
✅ Accéder à /finance/import-frais
✅ Étape 1 : Sélectionner le fichier CSV
✅ Étape 2 : Mapper les colonnes
✅ Étape 3 : Vérifier l'aperçu
✅ Lancer l'import
✅ Vérifier le rapport d'import
✅ Vérifier que les frais apparaissent dans "Validation Frais"
```

### 6. Rapports et Reporting

#### Test 6.1 : Génération de Rapports
```bash
✅ Accéder à /finance/rapports
✅ Générer un rapport mensuel
✅ Vérifier l'aperçu
✅ Télécharger en PDF
✅ Télécharger en Excel
✅ Vérifier l'historique
```

#### Test 6.2 : Reporting Personnalisé
```bash
✅ Accéder à /finance/reporting
✅ Créer un rapport personnalisé :
   - Type : PAR_AGENT
   - Période : Dernier mois
   - Filtre Agent : Sélectionner un agent
✅ Générer
✅ Vérifier l'aperçu
✅ Sauvegarder
✅ Vérifier l'historique
```

### 7. Insights

#### Test 7.1 : Affichage des Insights
```bash
✅ Accéder à /finance/insights
✅ Vérifier l'affichage des insights par catégorie
✅ Vérifier les badges de statut
```

#### Test 7.2 : Actions sur les Insights
```bash
✅ Voir les détails d'un insight
✅ Marquer comme traité
✅ Appliquer une action suggérée
✅ Vérifier la redirection
```

### 8. Gestion Utilisateurs

#### Test 8.1 : Liste des Agents Finance
```bash
✅ Accéder à /finance/utilisateurs
✅ Vérifier que SEULS les agents finance sont affichés
✅ Vérifier les colonnes :
   - Nom
   - Prénom
   - Email
   - Rôle (doit être AGENT_FINANCE)
   - Statut
```

#### Test 8.2 : Création d'un Agent
```bash
✅ Cliquer sur "Créer un Agent"
✅ Remplir le formulaire :
   - Nom : Test
   - Prénom : Agent
   - Email : agent.test@test.com
   - Mot de passe : Test123!
   - Confirmer mot de passe : Test123!
   - Rôle : AGENT_FINANCE (pré-sélectionné)
✅ Soumettre
✅ Vérifier :
   - L'agent apparaît dans la liste
   - Le rôle est bien AGENT_FINANCE
   - Message de succès
```

#### Test 8.3 : Modification d'un Agent
```bash
✅ Cliquer sur "Modifier" pour un agent
✅ Modifier le nom
✅ Soumettre
✅ Vérifier la mise à jour
```

#### Test 8.4 : Désactivation/Activation
```bash
✅ Désactiver un agent
✅ Vérifier que le statut change
✅ Tester la connexion avec cet agent (doit échouer)
✅ Réactiver l'agent
✅ Vérifier que la connexion fonctionne à nouveau
```

---

## 👤 Test de l'Agent Financier

### 1. Connexion et Navigation

#### Test 1.1 : Connexion
```bash
✅ Se connecter avec agent.finance@test.com
✅ Vérifier la redirection vers /finance/dashboard
✅ Vérifier l'affichage du rôle "AGENT FINANCE"
```

#### Test 1.2 : Menus Disponibles
```bash
✅ Vérifier que l'agent voit :
   - Tableau de bord
   - Gestion Finance (expandable)
     - Tableau de Bord
     - Import Frais
     - Rapports
     - Reporting
     - Insights
   - Tâches
   - Notifications

✅ Vérifier que l'agent NE voit PAS :
   - Validation Frais (réservé au chef)
   - Catalogue Tarifs (réservé au chef)
   - Gestion Utilisateurs (réservé au chef)
```

### 2. Tableau de Bord

#### Test 2.1 : Affichage
```bash
✅ Vérifier que l'agent peut voir :
   - Les métriques globales
   - Les graphiques
   - Le tableau ROI
   - Les alertes
```

**Note** : L'agent peut consulter mais ne peut pas valider les frais.

### 3. Import Frais

#### Test 3.1 : Import CSV
```bash
✅ Accéder à /finance/import-frais
✅ Suivre le même processus que pour le chef
✅ Vérifier que les frais importés apparaissent en attente de validation
```

### 4. Consultation des Rapports

#### Test 4.1 : Rapports
```bash
✅ Accéder à /finance/rapports
✅ Générer un rapport
✅ Télécharger en PDF/Excel
```

**Note** : L'agent peut générer et consulter les rapports mais ne peut pas les modifier.

---

## 📁 Intégration avec les Dossiers

### 1. Accès aux Dossiers depuis Finance

#### Test 1.1 : Navigation depuis les Alertes
```bash
✅ Dans le tableau de bord finance
✅ Cliquer sur un dossier dans les alertes
✅ Vérifier la redirection vers le détail du dossier
✅ Vérifier l'onglet "Finance" dans le dossier
```

#### Test 1.2 : Onglet Finance dans un Dossier
```bash
✅ Accéder à un dossier (depuis /dossier/gestion)
✅ Cliquer sur l'onglet "Finance"
✅ Vérifier l'affichage :
   - Liste des frais du dossier
   - Résumé financier
   - Historique des factures
```

### 2. Création de Frais depuis un Dossier

#### Test 2.1 : Création Manuelle
```bash
✅ Dans l'onglet Finance d'un dossier
✅ Cliquer sur "Ajouter un Frais"
✅ Remplir le formulaire :
   - Phase : ENQUETE
   - Catégorie : Expertise
   - Quantité : 1
   - Tarif Unitaire : 500.00
   - Fournisseur : Expert SARL
✅ Soumettre
✅ Vérifier :
   - Le frais apparaît dans la liste
   - Le frais est en statut "EN_ATTENTE"
   - Le frais apparaît dans "Validation Frais" (chef)
```

### 3. Génération de Facture

#### Test 3.1 : Génération depuis un Dossier
```bash
✅ Dans l'onglet Finance d'un dossier
✅ Vérifier qu'il y a des frais validés
✅ Cliquer sur "Générer une Facture"
✅ Vérifier :
   - La facture est créée
   - Le statut est "GENEREE"
   - La facture apparaît dans l'historique
```

#### Test 3.2 : Téléchargement PDF
```bash
✅ Cliquer sur "Télécharger PDF" pour une facture
✅ Vérifier :
   - Le téléchargement démarre
   - Le PDF contient toutes les informations
   - Le format est correct
```

### 4. Liens entre Dossiers et Finance

#### Test 4.1 : Frais par Phase
```bash
✅ Créer un frais pour chaque phase :
   - Phase CREATION
   - Phase AMIABLE
   - Phase ENQUETE
   - Phase JURIDIQUE
✅ Vérifier que tous apparaissent dans le dossier
✅ Vérifier que tous sont visibles dans "Validation Frais"
```

---

## 🤝 Intégration avec Recouvrement Amiable

### 1. Flux de Données

```
Dossier → Recouvrement Amiable → Actions Amiables → Frais → Finance
```

### 2. Test d'Intégration

#### Test 2.1 : Création d'une Action Amiable
```bash
✅ Se connecter en tant qu'agent amiable
✅ Accéder à un dossier affecté au recouvrement amiable
✅ Créer une action amiable (appel téléphonique, relance, etc.)
✅ Vérifier que l'action est enregistrée
```

#### Test 2.2 : Génération de Frais depuis une Action
```bash
✅ Dans une action amiable
✅ Ajouter un frais lié à l'action
✅ Vérifier :
   - Le frais est créé avec la phase "AMIABLE"
   - Le frais est lié au dossier
   - Le frais apparaît dans "Validation Frais" (chef financier)
```

#### Test 2.3 : Validation et Suivi
```bash
✅ Se connecter en tant que chef financier
✅ Vérifier que le frais amiable apparaît dans "Validation Frais"
✅ Valider le frais
✅ Retourner dans le dossier
✅ Vérifier que le frais est marqué comme "VALIDE"
```

---

## ⚖️ Intégration avec Recouvrement Juridique

### 1. Flux de Données

```
Dossier → Recouvrement Juridique → Audiences/Actions → Frais → Finance
```

### 2. Test d'Intégration

#### Test 2.1 : Création d'une Audience
```bash
✅ Se connecter en tant qu'agent juridique
✅ Accéder à un dossier affecté au recouvrement juridique
✅ Créer une audience
✅ Vérifier que l'audience est enregistrée
```

#### Test 2.2 : Génération de Frais Juridiques
```bash
✅ Dans une audience ou action juridique
✅ Ajouter un frais (honoraires avocat, frais d'huissier, etc.)
✅ Vérifier :
   - Le frais est créé avec la phase "JURIDIQUE"
   - Le frais est lié au dossier
   - Le frais apparaît dans "Validation Frais" (chef financier)
```

#### Test 2.3 : Validation et Suivi
```bash
✅ Se connecter en tant que chef financier
✅ Vérifier que le frais juridique apparaît dans "Validation Frais"
✅ Valider le frais
✅ Retourner dans le dossier
✅ Vérifier que le frais est marqué comme "VALIDE"
```

---

## 🔄 Scénarios de Test End-to-End

### Scénario 1 : Cycle Complet d'un Dossier avec Frais

#### Étape 1 : Création du Dossier
```bash
✅ Se connecter en tant qu'agent dossier
✅ Créer un nouveau dossier
✅ Remplir toutes les informations
✅ Soumettre
✅ Vérifier que le dossier est créé
```

#### Étape 2 : Ajout de Frais (Phase CREATION)
```bash
✅ Dans le dossier créé
✅ Aller dans l'onglet "Finance"
✅ Ajouter un frais de création
✅ Vérifier que le frais est en "EN_ATTENTE"
```

#### Étape 3 : Validation du Frais
```bash
✅ Se connecter en tant que chef financier
✅ Aller dans "Validation Frais"
✅ Trouver le frais créé
✅ Valider le frais
✅ Vérifier la notification
```

#### Étape 4 : Passage en Recouvrement Amiable
```bash
✅ Se connecter en tant qu'agent amiable
✅ Accéder au dossier
✅ Créer une action amiable
✅ Ajouter un frais amiable
```

#### Étape 5 : Validation du Frais Amiable
```bash
✅ Se connecter en tant que chef financier
✅ Valider le frais amiable
```

#### Étape 6 : Passage en Recouvrement Juridique
```bash
✅ Se connecter en tant qu'agent juridique
✅ Accéder au dossier
✅ Créer une audience
✅ Ajouter un frais juridique (honoraires avocat)
```

#### Étape 7 : Validation du Frais Juridique
```bash
✅ Se connecter en tant que chef financier
✅ Valider le frais juridique
```

#### Étape 8 : Génération de la Facture
```bash
✅ Dans le dossier
✅ Aller dans l'onglet "Finance"
✅ Vérifier que tous les frais sont validés
✅ Générer la facture
✅ Télécharger le PDF
```

#### Étape 9 : Consultation des Rapports
```bash
✅ Se connecter en tant que chef financier
✅ Aller dans "Reporting"
✅ Générer un rapport pour ce dossier
✅ Vérifier que tous les frais sont inclus
```

### Scénario 2 : Import en Masse et Validation

#### Étape 1 : Préparation du CSV
```bash
✅ Créer un fichier CSV avec 10 frais pour différents dossiers
✅ Inclure des frais pour différentes phases
```

#### Étape 2 : Import
```bash
✅ Se connecter en tant qu'agent financier
✅ Aller dans "Import Frais"
✅ Importer le fichier CSV
✅ Vérifier le rapport d'import
```

#### Étape 3 : Validation en Masse
```bash
✅ Se connecter en tant que chef financier
✅ Aller dans "Validation Frais"
✅ Vérifier que tous les frais importés apparaissent
✅ Valider les frais un par un
✅ Vérifier les statistiques
```

### Scénario 3 : Analyse de Performance

#### Étape 1 : Consultation du Dashboard
```bash
✅ Se connecter en tant que chef financier
✅ Aller dans "Tableau de Bord"
✅ Analyser :
   - Les métriques globales
   - Le ROI des agents
   - Les alertes
```

#### Étape 2 : Consultation des Insights
```bash
✅ Aller dans "Insights"
✅ Vérifier les recommandations
✅ Appliquer une action suggérée
```

#### Étape 3 : Génération de Rapports
```bash
✅ Aller dans "Reporting"
✅ Générer un rapport mensuel
✅ Générer un rapport par agent
✅ Comparer les performances
```

---

## 🔍 Dépannage

### Problème 1 : Les frais n'apparaissent pas dans "Validation Frais"

**Causes possibles** :
- Le frais n'a pas été créé correctement
- Le backend n'a pas enregistré le frais
- Problème de filtrage côté frontend

**Solutions** :
1. Vérifier les logs du backend
2. Vérifier la console du navigateur
3. Vérifier que le statut du frais est bien "EN_ATTENTE"
4. Vérifier les permissions de l'utilisateur

### Problème 2 : Impossible de valider un frais

**Causes possibles** :
- L'utilisateur n'est pas chef financier
- Le frais n'est pas en statut "EN_ATTENTE"
- Problème de permissions

**Solutions** :
1. Vérifier le rôle de l'utilisateur
2. Vérifier le statut du frais
3. Vérifier les logs du backend

### Problème 3 : Les dossiers ne sont pas liés aux frais

**Causes possibles** :
- Le dossierId n'est pas correctement passé
- Problème de relation dans la base de données
- Problème d'API

**Solutions** :
1. Vérifier que le dossierId est présent dans le frais
2. Vérifier la relation dans la base de données
3. Vérifier les endpoints API

### Problème 4 : Les graphiques ne s'affichent pas

**Causes possibles** :
- Chart.js n'est pas chargé
- Les données ne sont pas au bon format
- Problème de rendu

**Solutions** :
1. Vérifier que Chart.js est installé
2. Vérifier la console du navigateur
3. Vérifier le format des données

---

## 📊 Checklist de Test Complète

### Chef Financier
- [ ] Connexion et redirection
- [ ] Tableau de bord avec métriques
- [ ] Graphiques (pie et line)
- [ ] Tableau ROI
- [ ] Alertes avec filtres
- [ ] Validation de frais
- [ ] Rejet de frais
- [ ] Gestion du catalogue tarifs
- [ ] Import CSV
- [ ] Génération de rapports
- [ ] Reporting personnalisé
- [ ] Insights
- [ ] Gestion des agents finance

### Agent Financier
- [ ] Connexion et redirection
- [ ] Consultation du tableau de bord
- [ ] Import CSV
- [ ] Consultation des rapports
- [ ] Pas d'accès à la validation
- [ ] Pas d'accès au catalogue tarifs
- [ ] Pas d'accès à la gestion utilisateurs

### Intégration Dossiers
- [ ] Navigation depuis alertes vers dossier
- [ ] Onglet Finance dans dossier
- [ ] Création de frais depuis dossier
- [ ] Génération de facture
- [ ] Téléchargement PDF

### Intégration Amiable
- [ ] Création d'action amiable
- [ ] Génération de frais amiable
- [ ] Validation du frais amiable
- [ ] Suivi dans le dossier

### Intégration Juridique
- [ ] Création d'audience
- [ ] Génération de frais juridique
- [ ] Validation du frais juridique
- [ ] Suivi dans le dossier

### Scénarios End-to-End
- [ ] Cycle complet d'un dossier
- [ ] Import en masse
- [ ] Analyse de performance

---

## 📝 Notes Importantes

1. **Permissions** : Toujours vérifier les permissions avant de tester
2. **Données** : Utiliser des données de test réalistes
3. **Logs** : Consulter les logs du backend et du frontend en cas d'erreur
4. **Navigation** : Tester tous les chemins de navigation
5. **Validation** : Vérifier que les validations fonctionnent correctement

---

**Dernière mise à jour** : 2024-01-XX
**Version** : 1.0.0


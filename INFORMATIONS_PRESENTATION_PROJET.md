# 📋 Informations Complètes pour Présentation du Projet Carthage Créance

## 1. PRÉSENTATION DU CADRE DU PROJET

### Organisation d'accueil
- **Nom de l'organisation :** Carthage Créance (Société de recouvrement de créances)
- **Secteur d'activité :** Services financiers - Recouvrement de créances
- **Contexte :** Entreprise spécialisée dans la gestion et le recouvrement de créances pour le compte de créanciers (entreprises, particuliers)
- **Localisation :** Tunisie (contexte tunisien - devise TND, format de dates français)

### Contexte du projet
- **Type de projet :** Application web de gestion de recouvrement de créances
- **Objectif principal :** Digitaliser et optimiser le processus de recouvrement de créances depuis la création du dossier jusqu'à la clôture
- **Problématique métier :** 
  - Gestion manuelle et dispersée des dossiers de recouvrement
  - Manque de traçabilité et de suivi des actions
  - Difficulté à suivre les performances par département
  - Absence de centralisation des données financières
  - Processus de validation complexe et non automatisé
- **Bénéfices attendus :**
  - Amélioration du taux de recouvrement
  - Réduction du temps de traitement des dossiers
  - Meilleure traçabilité des actions
  - Optimisation de la répartition des dossiers
  - Amélioration de la prise de décision grâce aux statistiques

---

## 2. ÉTAT DE L'ART

### Étude de l'existant
**Systèmes similaires sur le marché :**
- Solutions ERP de recouvrement (SAP, Oracle)
- Applications SaaS de gestion de créances
- Systèmes de gestion documentaire intégrés

**Caractéristiques communes :**
- Gestion multi-départements
- Workflow de validation
- Suivi des actions de recouvrement
- Génération de rapports et statistiques
- Gestion des documents légaux

### Critique de l'existant
**Limitations des solutions existantes :**
- Coût élevé des solutions ERP
- Complexité d'implémentation
- Manque de flexibilité pour les besoins spécifiques
- Interface utilisateur peu intuitive
- Absence de prédiction IA pour le risque de recouvrement
- Pas d'adaptation au contexte tunisien (réglementation, processus)

**Avantages d'une solution sur mesure :**
- Adaptation aux processus métier spécifiques
- Coût maîtrisé
- Évolutivité selon les besoins
- Interface utilisateur optimisée pour les utilisateurs finaux

### Problématique
1. **Gestion dispersée :** Les dossiers sont gérés dans différents départements sans coordination
2. **Manque de traçabilité :** Difficulté à suivre l'historique des actions sur un dossier
3. **Validation manuelle :** Processus de validation long et sujet aux erreurs
4. **Absence de statistiques :** Pas de vue d'ensemble sur les performances
5. **Gestion financière complexe :** Calculs manuels des frais et montants recouvrés
6. **Prédiction du risque :** Pas d'outil pour évaluer la probabilité de recouvrement

### Solution proposée
**Application web complète de gestion de recouvrement de créances avec :**
- Gestion centralisée des dossiers
- Workflow automatisé par département
- Système de validation hiérarchique
- Tableaux de bord statistiques par rôle
- Gestion financière intégrée (frais, tarifs, facturation)
- Prédiction IA du risque de recouvrement
- Traçabilité complète des actions
- Gestion des documents légaux (contrats, pouvoirs, audiences)

### Méthodologie adoptée
**Approche de développement :**
1. **Analyse des besoins :** Entretiens avec les utilisateurs, analyse des processus existants
2. **Conception :** Modélisation des entités, définition des workflows, architecture technique
3. **Développement itératif :** 
   - Phase 1 : Module de gestion des dossiers
   - Phase 2 : Modules départementaux (Amiable, Juridique, Finance)
   - Phase 3 : Tableaux de bord et statistiques
   - Phase 4 : Prédiction IA et optimisations
4. **Tests :** Tests unitaires, tests d'intégration, tests utilisateurs
5. **Déploiement :** Mise en production progressive par module

**Méthodologie agile :** Sprints de 2 semaines, revues régulières avec les utilisateurs

---

## 3. ANALYSE DES BESOINS

### Identification des acteurs

#### 1. Super Administrateur (SUPER_ADMIN)
- **Rôle :** Administration globale du système
- **Responsabilités :**
  - Gestion des utilisateurs et des rôles
  - Supervision de tous les départements
  - Consultation des statistiques globales
  - Gestion des paramètres système
  - Audit et traçabilité
- **Accès :** Toutes les fonctionnalités du système

#### 2. Chef Département Dossier (CHEF_DEPARTEMENT_DOSSIER)
- **Rôle :** Responsable du département de création et validation des dossiers
- **Responsabilités :**
  - Validation/rejet des dossiers créés par les agents
  - Affectation des dossiers aux agents
  - Gestion des enquêtes précontentieuses
  - Supervision des agents du département
  - Consultation des statistiques du département
- **Accès :** Module dossier, module enquête, statistiques département

#### 3. Agent Dossier (AGENT_DOSSIER)
- **Rôle :** Création et gestion initiale des dossiers
- **Responsabilités :**
  - Création de nouveaux dossiers
  - Saisie des informations créancier/débiteur
  - Upload des documents justificatifs
  - Réalisation des enquêtes précontentieuses
  - Suivi des dossiers assignés
- **Accès :** Création de dossiers, gestion des enquêtes, consultation personnelle

#### 4. Chef Département Recouvrement Amiable (CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE)
- **Rôle :** Responsable du recouvrement amiable
- **Responsabilités :**
  - Supervision des actions amiables
  - Affectation des dossiers aux agents amiable
  - Validation des actions de recouvrement
  - Gestion des notifications et tâches
  - Consultation des statistiques du département
- **Accès :** Module amiable, gestion des actions, statistiques amiable

#### 5. Agent Recouvrement Amiable (AGENT_RECOUVREMENT_AMIABLE)
- **Rôle :** Exécution des actions de recouvrement amiable
- **Responsabilités :**
  - Réalisation des actions de recouvrement (appels, relances, négociations)
  - Mise à jour du statut des actions
  - Saisie des montants recouvrés
  - Communication avec les débiteurs
- **Accès :** Actions amiable, dossiers assignés, statistiques personnelles

#### 6. Chef Département Recouvrement Juridique (CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE)
- **Rôle :** Responsable du recouvrement juridique
- **Responsabilités :**
  - Supervision des procédures juridiques
  - Gestion des avocats et huissiers
  - Suivi des audiences
  - Validation des actions juridiques
  - Consultation des statistiques juridiques
- **Accès :** Module juridique, gestion avocats/huissiers, audiences, statistiques juridique

#### 7. Agent Recouvrement Juridique (AGENT_RECOUVREMENT_JURIDIQUE)
- **Rôle :** Exécution des procédures juridiques
- **Responsabilités :**
  - Gestion des audiences
  - Suivi des documents huissier
  - Enregistrement des actions huissier
  - Mise à jour des décisions judiciaires
- **Accès :** Module juridique, audiences, documents huissier, statistiques personnelles

#### 8. Chef Département Finance (CHEF_DEPARTEMENT_FINANCE)
- **Rôle :** Responsable de la gestion financière
- **Responsabilités :**
  - Validation des tarifs et frais
  - Gestion de la facturation
  - Suivi des paiements
  - Finalisation des dossiers
  - Consultation des statistiques financières
- **Accès :** Module finance, validation tarifs, facturation, statistiques finance

#### 9. Agent Finance (AGENT_FINANCE)
- **Rôle :** Gestion opérationnelle des aspects financiers
- **Responsabilités :**
  - Saisie des frais et tarifs
  - Calcul des montants
  - Préparation des factures
  - Suivi des paiements
- **Accès :** Module finance, saisie des frais, consultation factures

### Exigences fonctionnelles

#### Module Gestion des Dossiers
1. **Création de dossier :**
   - Saisie des informations du créancier (nom, prénom, email, téléphone, adresse, type)
   - Saisie des informations du débiteur (nom, prénom, email, téléphone, adresse, type)
   - Saisie des informations du dossier (titre, description, numéro, montant créance, urgence)
   - Upload des documents justificatifs (contrat signé, pouvoir)
   - Attribution automatique d'un numéro de dossier unique

2. **Validation de dossier :**
   - Workflow de validation par le chef département
   - Possibilité de rejet avec commentaire
   - Notification automatique à l'agent créateur
   - Historique des validations

3. **Affectation de dossier :**
   - Affectation manuelle par le chef
   - Répartition automatique selon la charge de travail
   - Suivi des dossiers assignés

4. **Consultation de dossier :**
   - Vue détaillée avec toutes les informations
   - Historique des actions
   - Documents associés
   - Statut et progression

#### Module Enquête Précontentieuse
1. **Création d'enquête :**
   - Saisie des informations financières du débiteur
   - Analyse de la situation (biens, revenus, incidents)
   - Recommandation de recouvrement (amiable ou juridique)

2. **Validation d'enquête :**
   - Validation par le chef département
   - Décision sur le type de recouvrement

#### Module Recouvrement Amiable
1. **Gestion des actions :**
   - Création d'actions (appel téléphonique, relance email, rendez-vous, négociation)
   - Suivi du statut (en cours, complétée, réussie, échouée)
   - Enregistrement des résultats
   - Saisie des montants recouvrés

2. **Finalisation amiable :**
   - Décision de finalisation (Recouvrement Total, Partiel, Non Recouvré)
   - Calcul automatique des montants restants
   - Passage au juridique si nécessaire

#### Module Recouvrement Juridique
1. **Gestion des avocats :**
   - Création et gestion des avocats
   - Affectation d'avocat à un dossier
   - Suivi des honoraires

2. **Gestion des huissiers :**
   - Création et gestion des huissiers
   - Affectation d'huissier à un dossier
   - Suivi des documents et actions huissier

3. **Gestion des audiences :**
   - Planification des audiences
   - Enregistrement des décisions (positive, négative, à rapporter)
   - Suivi des coûts (audience, avocat)

4. **Documents huissier :**
   - Création de documents (commandement de payer, saisie, etc.)
   - Suivi du statut (créé, complété)

5. **Actions huissier :**
   - Enregistrement des actions (saisie, vente, etc.)
   - Suivi du statut et des résultats

6. **Finalisation juridique :**
   - Décision de finalisation avec calcul des montants
   - Passage au finance pour facturation

#### Module Finance
1. **Gestion des tarifs :**
   - Création de tarifs par phase (Création, Enquête, Amiable, Juridique)
   - Validation des tarifs par le chef finance
   - Application automatique des tarifs

2. **Validation des frais :**
   - Validation des frais de création
   - Validation des frais d'enquête
   - Validation des frais amiable (actions)
   - Validation des frais juridique (audiences, avocat, huissier)

3. **Facturation :**
   - Génération automatique des factures
   - Calcul des montants totaux
   - Suivi des paiements

4. **Finalisation :**
   - Finalisation du dossier avec calcul final
   - Archivage automatique

#### Module Statistiques et Rapports
1. **Tableaux de bord par rôle :**
   - Statistiques personnelles pour les agents
   - Statistiques départementales pour les chefs
   - Statistiques globales pour le super admin

2. **Indicateurs de performance :**
   - Taux de réussite
   - Montants recouvrés
   - Nombre de dossiers traités
   - Temps moyen de traitement

3. **Rapports :**
   - Export CSV/Excel
   - Rapports personnalisés
   - Graphiques et visualisations

#### Module Prédiction IA
1. **Évaluation du risque :**
   - Calcul automatique du score de risque (0-100)
   - Classification du niveau de risque (Faible, Moyen, Élevé)
   - Prédiction de l'état final (Recouvrement Total, Partiel, Non Recouvré)

2. **Recommandations :**
   - Suggestion du type de recouvrement
   - Priorisation des dossiers

#### Module Administration
1. **Gestion des utilisateurs :**
   - Création, modification, suppression
   - Attribution des rôles
   - Gestion des permissions

2. **Supervision :**
   - Vue d'ensemble de tous les départements
   - Dossiers archivés
   - Audit et traçabilité

3. **Paramètres système :**
   - Configuration générale
   - Gestion des notifications

### Exigences non fonctionnelles

#### Performance
- **Temps de réponse :** < 2 secondes pour les opérations courantes
- **Charge :** Support de 100 utilisateurs simultanés
- **Optimisation :** Pagination, lazy loading, cache des données fréquentes

#### Sécurité
- **Authentification :** JWT (JSON Web Tokens)
- **Autorisation :** Contrôle d'accès basé sur les rôles (RBAC)
- **Protection des données :** Chiffrement des données sensibles
- **Audit :** Traçabilité de toutes les actions utilisateurs
- **Validation :** Validation côté client et serveur

#### Disponibilité
- **Uptime :** 99% de disponibilité
- **Sauvegarde :** Sauvegarde quotidienne automatique
- **Récupération :** Plan de reprise après sinistre

#### Ergonomie
- **Interface intuitive :** Navigation claire, menus contextuels
- **Responsive design :** Compatible desktop, tablette, mobile
- **Accessibilité :** Respect des standards WCAG
- **Multilingue :** Support français (prévu pour extension arabe)

#### Maintenabilité
- **Code modulaire :** Architecture en modules indépendants
- **Documentation :** Code commenté, documentation technique
- **Tests :** Couverture de tests unitaires et d'intégration
- **Versioning :** Gestion des versions avec Git

#### Évolutivité
- **Scalabilité :** Architecture permettant l'ajout de fonctionnalités
- **Extensibilité :** API REST pour intégrations futures
- **Modularité :** Ajout facile de nouveaux modules

### Diagrammes

#### Diagramme des cas d'utilisation
**Acteurs principaux :**
- Super Admin
- Chef Dossier / Agent Dossier
- Chef Amiable / Agent Amiable
- Chef Juridique / Agent Juridique
- Chef Finance / Agent Finance

**Cas d'utilisation principaux :**
1. Créer un dossier
2. Valider un dossier
3. Créer une enquête
4. Valider une enquête
5. Créer une action amiable
6. Finaliser le recouvrement amiable
7. Gérer les audiences
8. Gérer les documents huissier
9. Finaliser le recouvrement juridique
10. Valider les tarifs
11. Générer une facture
12. Consulter les statistiques
13. Gérer les utilisateurs

#### Diagramme de séquence - Workflow de validation
1. Agent crée dossier → Envoi au chef
2. Chef valide/rejette → Notification à l'agent
3. Si validé → Affectation à un agent
4. Agent crée enquête → Envoi au chef
5. Chef valide enquête → Décision amiable/juridique
6. Si amiable → Actions amiable → Finalisation
7. Si juridique → Procédures juridiques → Finalisation
8. Passage au finance → Validation tarifs → Facturation → Archivage

#### Diagramme de classes (entités principales)
- **Dossier :** id, titre, description, numeroDossier, montantCreance, statut, creancier, debiteur, agentCreateur, agentResponsable
- **Creancier :** id, nom, prenom, email, telephone, adresse, type
- **Debiteur :** id, nom, prenom, email, telephone, adresse, type
- **Enquette :** id, dossierId, informations financières, recommandation
- **Action :** id, dossierId, type, date, statut, resultat
- **Audience :** id, dossierId, date, type, decision, avocatId
- **DocumentHuissier :** id, dossierId, type, statut
- **ActionHuissier :** id, dossierId, type, statut
- **Finance :** id, dossierId, frais, tarifs, facture
- **User :** id, nom, prenom, email, role, departement

---

## 4. APERÇU DU SYSTÈME ET SPÉCIFICATIONS

### Architecture physique

#### Frontend
- **Framework :** Angular 17
- **Langage :** TypeScript 5.4
- **Serveur de développement :** Angular CLI (ng serve)
- **Port :** 4200 (développement)
- **Build :** Production build avec optimisation
- **Déploiement :** Serveur web (Apache/Nginx) ou plateforme cloud

#### Backend
- **Framework :** Spring Boot (Java)
- **Base de données :** PostgreSQL ou MySQL
- **Serveur d'application :** Tomcat embarqué
- **Port :** 8089
- **API :** RESTful API (JSON)

#### Infrastructure
- **Architecture :** Client-Serveur (3-tier)
- **Communication :** HTTP/HTTPS
- **Format d'échange :** JSON
- **Authentification :** JWT via headers HTTP

### Architecture logique

#### Couche Présentation (Frontend)
- **Composants Angular :** 
  - Modules par fonctionnalité (dossier, amiable, juridique, finance, admin)
  - Composants réutilisables (shared)
  - Guards pour la sécurité (AuthGuard, RoleGuard)
  - Interceptors pour les requêtes HTTP
- **Services :** 
  - Services de communication API
  - Services métier
  - Services de gestion d'état
- **Routing :** Navigation basée sur les rôles

#### Couche Métier (Backend)
- **Controllers :** Gestion des endpoints REST
- **Services :** Logique métier
- **Repositories :** Accès aux données (JPA/Hibernate)
- **DTOs :** Transfert de données
- **Validators :** Validation des données

#### Couche Données
- **Base de données relationnelle :** Tables pour toutes les entités
- **Relations :** One-to-Many, Many-to-One, Many-to-Many
- **Indexes :** Optimisation des requêtes
- **Contraintes :** Intégrité référentielle

### Environnement de travail

#### Outils de développement
- **IDE :** Visual Studio Code / IntelliJ IDEA
- **Versioning :** Git
- **Gestion de dépendances :** npm (frontend), Maven/Gradle (backend)
- **API Testing :** Postman / Insomnia
- **Base de données :** pgAdmin / MySQL Workbench

#### Technologies Frontend
- **Angular :** 17.3.0
- **Angular Material :** 17.3.10 (UI components)
- **RxJS :** 7.8.0 (programmation réactive)
- **Chart.js :** 4.5.1 (graphiques)
- **JWT Decode :** 4.0.0 (authentification)

#### Technologies Backend
- **Spring Boot :** Framework Java
- **Spring Security :** Sécurité et authentification
- **JPA/Hibernate :** ORM
- **PostgreSQL/MySQL :** Base de données
- **JWT :** Authentification

### Spécifications logicielles

#### Frontend - Structure des modules

**Module Admin :**
- SuperAdmin Dashboard
- Gestion des utilisateurs
- Supervision (Dossiers, Amiable, Juridique, Finance)
- Dossiers archivés
- Paramètres système
- Audit

**Module Dossier :**
- Création de dossier
- Liste des dossiers
- Détails de dossier
- Validation de dossier
- Affectation

**Module Enquête :**
- Création d'enquête
- Édition d'enquête
- Validation d'enquête
- Statistiques d'enquêtes

**Module Amiable :**
- Actions amiable
- Gestion des actions
- Finalisation amiable
- Statistiques amiable

**Module Juridique :**
- Gestion des audiences
- Gestion des avocats
- Gestion des huissiers
- Documents huissier
- Actions huissier
- Finalisation juridique
- Statistiques juridique

**Module Finance :**
- Validation des tarifs (Création, Enquête, Amiable, Juridique)
- Gestion des factures
- Suivi des paiements
- Finalisation financière
- Statistiques financières

**Module Shared :**
- Composants réutilisables (stat-card, dashboard, etc.)
- Modèles de données
- Services communs
- Guards et interceptors
- Pipes et validators

#### Backend - Structure des APIs

**Base URL :** `http://localhost:8089/carthage-creance/api`

**Endpoints principaux :**
- `/auth/login` - Authentification
- `/dossiers` - CRUD dossiers
- `/enquettes` - CRUD enquêtes
- `/actions` - CRUD actions amiables
- `/audiences` - CRUD audiences
- `/huissier/documents` - Documents huissier
- `/huissier/actions` - Actions huissier
- `/finances` - Gestion financière
- `/statistiques` - Statistiques
- `/admin` - Administration
- `/users` - Gestion utilisateurs

#### Workflow de traitement d'un dossier

1. **Création :** Agent Dossier crée un dossier avec créancier/débiteur
2. **Validation :** Chef Dossier valide ou rejette
3. **Enquête :** Si validé, Agent Dossier crée une enquête précontentieuse
4. **Validation enquête :** Chef Dossier valide l'enquête
5. **Décision :** Choix amiable ou juridique selon l'enquête
6. **Recouvrement Amiable :**
   - Affectation à Agent Amiable
   - Création d'actions de recouvrement
   - Suivi des résultats
   - Finalisation (Total/Partiel/Non Recouvré)
7. **Recouvrement Juridique (si nécessaire) :**
   - Affectation d'avocat et/ou huissier
   - Planification d'audiences
   - Gestion des documents et actions huissier
   - Finalisation juridique
8. **Finance :**
   - Validation des tarifs et frais
   - Génération de facture
   - Finalisation financière
9. **Archivage :** Dossier clôturé et archivé

---

## 5. RÉALISATION

### Fonctionnalités implémentées

#### ✅ Module Authentification
- Login avec JWT
- Gestion des sessions
- Redirection selon le rôle
- Guards de sécurité

#### ✅ Module Gestion des Dossiers
- Création complète de dossier
- Upload de documents (contrat, pouvoir)
- Validation/rejet par chef
- Affectation aux agents
- Consultation détaillée
- Liste avec filtres et recherche

#### ✅ Module Enquête Précontentieuse
- Création d'enquête avec toutes les informations financières
- Édition d'enquête
- Validation par chef
- Recommandation automatique
- Statistiques d'enquêtes

#### ✅ Module Recouvrement Amiable
- Création d'actions (appel, relance, rendez-vous, négociation)
- Suivi des actions
- Saisie des montants recouvrés
- Finalisation avec calcul automatique
- Statistiques et performances

#### ✅ Module Recouvrement Juridique
- Gestion complète des avocats
- Gestion complète des huissiers
- Planification et suivi des audiences
- Gestion des documents huissier
- Gestion des actions huissier
- Finalisation juridique
- Statistiques juridiques

#### ✅ Module Finance
- Validation des tarifs par phase
- Calcul automatique des frais
- Validation des frais
- Génération de factures
- Suivi des paiements
- Finalisation financière
- Statistiques financières

#### ✅ Module Statistiques
- Tableaux de bord personnalisés par rôle
- Statistiques globales (Super Admin)
- Statistiques départementales (Chefs)
- Statistiques personnelles (Agents)
- Indicateurs de performance
- Export de données

#### ✅ Module Administration
- Gestion complète des utilisateurs
- Attribution des rôles
- Supervision de tous les départements
- Consultation des dossiers archivés
- Audit et traçabilité
- Paramètres système

#### ✅ Module Prédiction IA
- Calcul du score de risque
- Classification du niveau de risque
- Prédiction de l'état final
- Affichage des prédictions dans l'interface

### Technologies et outils utilisés

**Frontend :**
- Angular 17 avec TypeScript
- Angular Material pour l'UI
- RxJS pour la programmation réactive
- Chart.js pour les graphiques
- JWT pour l'authentification

**Backend :**
- Spring Boot (Java)
- Spring Security
- JPA/Hibernate
- PostgreSQL/MySQL
- JWT

**Outils :**
- Git pour le versioning
- npm pour les dépendances frontend
- Maven/Gradle pour le backend
- Postman pour les tests API

### Défis rencontrés et solutions

1. **Gestion des rôles multiples :**
   - Solution : Système de guards et redirection dynamique selon le rôle

2. **Workflow complexe de validation :**
   - Solution : Implémentation d'un système de statuts et de notifications

3. **Calculs financiers complexes :**
   - Solution : Services dédiés avec validation et traçabilité

4. **Performance des statistiques :**
   - Solution : Endpoints optimisés avec pagination et cache

5. **Synchronisation frontend-backend :**
   - Solution : Documentation des APIs et alignement des modèles

---

## 6. CONCLUSION ET PERSPECTIVES

### Bilan du projet

**Objectifs atteints :**
- ✅ Application complète et fonctionnelle
- ✅ Gestion de tous les départements
- ✅ Workflow de validation automatisé
- ✅ Statistiques et tableaux de bord
- ✅ Prédiction IA intégrée
- ✅ Interface utilisateur intuitive

**Résultats :**
- Digitalisation complète du processus de recouvrement
- Amélioration de la traçabilité
- Optimisation des temps de traitement
- Meilleure prise de décision grâce aux statistiques

### Perspectives d'évolution

#### Court terme (3-6 mois)
1. **Amélioration de la prédiction IA :**
   - Intégration de machine learning plus avancé
   - Amélioration de la précision des prédictions
   - Recommandations personnalisées

2. **Notifications en temps réel :**
   - Système de notifications push
   - Alertes automatiques
   - Rappels de tâches

3. **Mobile App :**
   - Application mobile native (iOS/Android)
   - Accès aux fonctionnalités principales
   - Notifications push

#### Moyen terme (6-12 mois)
1. **Intégration de paiement en ligne :**
   - Portail de paiement pour les débiteurs
   - Suivi des paiements en temps réel
   - Génération automatique de reçus

2. **Communication automatisée :**
   - Envoi automatique d'emails/SMS
   - Templates personnalisables
   - Historique des communications

3. **Analytics avancés :**
   - Tableaux de bord personnalisables
   - Rapports automatisés
   - Prédictions de tendances

#### Long terme (12+ mois)
1. **Intelligence artificielle avancée :**
   - Chatbot pour assistance utilisateurs
   - Analyse prédictive des comportements de débiteurs
   - Optimisation automatique des stratégies de recouvrement

2. **Intégrations externes :**
   - API pour intégration avec systèmes tiers
   - Connexion avec banques
   - Intégration avec systèmes de facturation

3. **Multi-tenant :**
   - Support de plusieurs organisations
   - Isolation des données
   - Personnalisation par client

### Apports personnels

**Compétences développées :**
- Maîtrise d'Angular et TypeScript
- Développement backend avec Spring Boot
- Gestion de projets complexes
- Analyse des besoins métier
- Architecture logicielle
- Intégration de l'IA dans les applications

**Expérience acquise :**
- Développement full-stack
- Gestion de workflow métier
- Optimisation des performances
- Sécurité des applications web
- Collaboration en équipe

---

## INFORMATIONS TECHNIQUES SUPPLÉMENTAIRES

### Rôles et permissions détaillés

**SUPER_ADMIN :**
- Accès total au système
- Gestion des utilisateurs
- Supervision de tous les départements
- Consultation des statistiques globales
- Gestion des paramètres système

**CHEF_DEPARTEMENT_DOSSIER :**
- Validation/rejet des dossiers
- Affectation des dossiers
- Gestion des enquêtes
- Supervision des agents dossier
- Statistiques du département

**AGENT_DOSSIER :**
- Création de dossiers
- Création d'enquêtes
- Consultation des dossiers assignés
- Statistiques personnelles

**CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE :**
- Supervision des actions amiables
- Affectation des dossiers
- Validation des finalisations
- Gestion des notifications
- Statistiques du département

**AGENT_RECOUVREMENT_AMIABLE :**
- Création d'actions amiable
- Mise à jour des actions
- Saisie des montants recouvrés
- Consultation des dossiers assignés

**CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE :**
- Supervision des procédures juridiques
- Gestion des avocats/huissiers
- Validation des actions juridiques
- Statistiques du département

**AGENT_RECOUVREMENT_JURIDIQUE :**
- Gestion des audiences
- Gestion des documents/actions huissier
- Consultation des dossiers assignés

**CHEF_DEPARTEMENT_FINANCE :**
- Validation des tarifs
- Validation des frais
- Gestion de la facturation
- Finalisation des dossiers
- Statistiques financières

**AGENT_FINANCE :**
- Saisie des frais
- Préparation des factures
- Suivi des paiements

### Statistiques disponibles

**Par rôle :**
- Total dossiers
- Dossiers en cours
- Dossiers clôturés
- Taux de réussite
- Montant récupéré
- Montant en cours
- Actions effectuées
- Performances des agents

**Spécifiques par département :**
- Enquêtes (total, complétées, en cours)
- Actions amiables (total, complétées, réussies)
- Audiences (total, complétées, prochaines)
- Documents/Actions huissier
- Factures (total, payées, en attente)

### Workflow détaillé

**Phase 1 - Création :**
1. Agent Dossier crée un dossier
2. Upload des documents (contrat, pouvoir)
3. Envoi en validation

**Phase 2 - Validation :**
1. Chef Dossier reçoit notification
2. Consultation du dossier
3. Validation ou rejet avec commentaire
4. Si validé, affectation à un agent

**Phase 3 - Enquête :**
1. Agent Dossier crée une enquête
2. Saisie des informations financières
3. Envoi en validation
4. Chef valide et décide (amiable/juridique)

**Phase 4 - Recouvrement Amiable :**
1. Affectation à Agent Amiable
2. Création d'actions de recouvrement
3. Suivi des résultats
4. Saisie des montants recouvrés
5. Finalisation (Total/Partiel/Non Recouvré)
6. Si partiel ou non recouvré → Passage au juridique

**Phase 5 - Recouvrement Juridique :**
1. Affectation d'avocat et/ou huissier
2. Planification d'audiences
3. Gestion des documents huissier
4. Gestion des actions huissier
5. Enregistrement des décisions
6. Finalisation juridique

**Phase 6 - Finance :**
1. Passage au département finance
2. Validation des tarifs par phase
3. Validation des frais
4. Calcul automatique des montants
5. Génération de facture
6. Finalisation financière

**Phase 7 - Archivage :**
1. Dossier clôturé
2. Archivage automatique
3. Consultation dans "Dossiers Archivés"

---

**Document créé le :** 2025-01-05
**Version :** 1.0
**Auteur :** Équipe de développement Carthage Créance


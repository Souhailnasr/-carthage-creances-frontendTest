# 💰 Explication Complète du Module Finance et de son Workflow

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Architecture et Entités](#architecture-et-entités)
3. [Workflow Complet](#workflow-complet)
4. [Phases et Statuts](#phases-et-statuts)
5. [Flux de Données](#flux-de-données)
6. [Rôles et Permissions](#rôles-et-permissions)
7. [Guide de Test](#guide-de-test)

---

## 🎯 Vue d'Ensemble

Le module **Finance** est le **système centralisé de gestion financière** de l'application de recouvrement de créances. Il suit tous les coûts engagés lors du traitement des dossiers, depuis leur création jusqu'à leur clôture, et génère les factures pour les créanciers.

### Objectifs Principaux

1. **Traçabilité Financière** : Enregistrer tous les frais liés à chaque dossier
2. **Validation** : Contrôler et valider les frais avant facturation
3. **Facturation** : Générer des factures détaillées pour les créanciers
4. **Suivi des Paiements** : Gérer les paiements des factures
5. **Analyse et Reporting** : Fournir des statistiques et analyses financières

---

## 🏗️ Architecture et Entités

### 1. Entité `Finance` (Table principale)

**Rôle** : Enregistre les coûts globaux d'un dossier

**Propriétés principales** :
- `id` : Identifiant unique
- `dossierId` : Lien vers le dossier
- `devise` : Devise (TND, EUR, etc.)
- `dateOperation` : Date de l'opération financière
- `description` : Description de l'opération

**Coûts enregistrés** :
- `fraisCreationDossier` : Frais de création du dossier
- `fraisGestionDossier` : Frais de gestion mensuels
- `coutActionsAmiable` : Coût total des actions amiables
- `coutActionsJuridique` : Coût total des actions juridiques
- `fraisAvocat` : Honoraires d'avocat
- `fraisHuissier` : Frais d'huissier
- `nombreActionsAmiable` : Nombre d'actions amiables
- `nombreActionsJuridique` : Nombre d'actions juridiques
- `dureeGestionMois` : Durée de gestion en mois

**Statut de facturation** :
- `factureFinalisee` : Indique si la facture est finalisée
- `dateFacturation` : Date de facturation

### 2. Entité `FluxFrais` (Flux de frais détaillés)

**Rôle** : Enregistre chaque frais individuel avec son cycle de vie

**Propriétés principales** :
- `id` : Identifiant unique
- `dossierId` : Lien vers le dossier
- `phase` : Phase du dossier (CREATION, AMIABLE, ENQUETE, JURIDIQUE)
- `categorie` : Catégorie du frais (ex: "Déplacement", "Honoraires Avocat", "Expertise")
- `quantite` : Quantité
- `tarifUnitaire` : Prix unitaire (peut venir du catalogue tarifs)
- `montant` : Montant total (quantité × tarif unitaire)
- `statut` : Statut du frais (voir section Statuts)
- `dateAction` : Date de l'action générant le frais
- `justificatifUrl` : URL du justificatif (fichier)
- `commentaire` : Commentaire optionnel

**Liens optionnels** :
- `actionId` : Lien vers une action amiable/juridique
- `enqueteId` : Lien vers une enquête
- `audienceId` : Lien vers une audience
- `avocatId` : Lien vers un avocat
- `huissierId` : Lien vers un huissier
- `factureId` : Lien vers la facture (quand inclus dans une facture)

### 3. Entité `Facture`

**Rôle** : Document de facturation envoyé au créancier

**Propriétés principales** :
- `id` : Identifiant unique
- `numeroFacture` : Numéro unique de facture
- `dossierId` : Lien vers le dossier
- `periodeDebut` : Début de la période facturée
- `periodeFin` : Fin de la période facturée
- `dateEmission` : Date d'émission de la facture
- `dateEcheance` : Date d'échéance de paiement
- `montantHT` : Montant hors taxes
- `montantTTC` : Montant toutes taxes comprises
- `tva` : Taux de TVA
- `statut` : Statut de la facture (voir section Statuts)
- `pdfUrl` : URL du PDF généré
- `envoyee` : Indique si la facture a été envoyée
- `relanceEnvoyee` : Indique si une relance a été envoyée

### 4. Entité `Paiement`

**Rôle** : Enregistre les paiements reçus pour une facture

**Propriétés principales** :
- `id` : Identifiant unique
- `factureId` : Lien vers la facture
- `datePaiement` : Date du paiement
- `montant` : Montant payé
- `modePaiement` : Mode de paiement (VIREMENT, CHEQUE, ESPECES, TRAITE, AUTRE)
- `reference` : Référence du paiement (numéro de chèque, virement, etc.)
- `statut` : Statut du paiement (EN_ATTENTE, VALIDE, REFUSE)
- `commentaire` : Commentaire optionnel

### 5. Entité `TarifCatalogue`

**Rôle** : Catalogue de tarifs de référence pour les différents types de frais

**Propriétés principales** :
- `id` : Identifiant unique
- `phase` : Phase concernée (CREATION, AMIABLE, ENQUETE, JURIDIQUE)
- `categorie` : Catégorie de frais
- `description` : Description du tarif
- `fournisseur` : Nom du fournisseur (ex: "Avocat XYZ", "Expert SARL")
- `tarifUnitaire` : Prix unitaire
- `devise` : Devise
- `dateDebut` : Date de début de validité
- `dateFin` : Date de fin de validité (optionnel)
- `actif` : Indique si le tarif est actif

---

## 🔄 Workflow Complet

### Vue d'Ensemble du Cycle de Vie

```
┌─────────────────────────────────────────────────────────────┐
│                    WORKFLOW FINANCE COMPLET                 │
└─────────────────────────────────────────────────────────────┘

1. CRÉATION DU DOSSIER
   │
   ├─→ Finance créé automatiquement
   ├─→ Frais de création ajoutés (FluxFrais avec phase CREATION)
   └─→ Statut: EN_ATTENTE

2. VALIDATION DES FRAIS
   │
   ├─→ Chef Financier consulte "Validation Frais"
   ├─→ Valide ou Rejette chaque frais
   └─→ Statut: VALIDE ou REJETE

3. ACCUMULATION DES FRAIS
   │
   ├─→ Actions Amiables → Frais (phase AMIABLE)
   ├─→ Enquêtes → Frais (phase ENQUETE)
   ├─→ Actions Juridiques → Frais (phase JURIDIQUE)
   └─→ Tous en statut EN_ATTENTE → Validation

4. CALCUL DES COÛTS
   │
   ├─→ Backend calcule automatiquement les totaux
   ├─→ Mise à jour de l'entité Finance
   └─→ Affichage dans le tableau de bord

5. GÉNÉRATION DE FACTURE
   │
   ├─→ Chef Financier génère une facture
   ├─→ Tous les frais VALIDES sont inclus
   ├─→ PDF généré automatiquement
   └─→ Statut: EMISE

6. ENVOI DE LA FACTURE
   │
   ├─→ Facture envoyée au créancier
   ├─→ Date d'échéance définie
   └─→ Suivi des relances si nécessaire

7. PAIEMENT
   │
   ├─→ Paiement enregistré
   ├─→ Validation du paiement
   └─→ Statut facture: PAYEE
```

### Détail des Étapes

#### Étape 1 : Création d'un Dossier et Initialisation Finance

**Quand** : Lorsqu'un agent dossier crée un nouveau dossier

**Actions automatiques** :
1. Le backend crée automatiquement une entité `Finance` pour le dossier
2. Les frais de création peuvent être ajoutés manuellement ou automatiquement
3. Un `FluxFrais` est créé avec :
   - Phase : `CREATION`
   - Statut : `EN_ATTENTE`
   - Montant basé sur le tarif du catalogue ou saisi manuellement

**Résultat** : Le dossier a maintenant un suivi financier initialisé

#### Étape 2 : Génération de Frais lors des Actions

**Scénario A : Action Amiable**

1. Agent Amiable crée une action (appel téléphonique, relance, etc.)
2. Si l'action génère un coût, un `FluxFrais` est créé :
   - Phase : `AMIABLE`
   - Catégorie : Selon le type d'action (ex: "Communication", "Déplacement")
   - Quantité : Nombre d'occurrences
   - Tarif Unitaire : Vient du catalogue tarifs ou saisi manuellement
   - Montant : Calculé automatiquement
   - Statut : `EN_ATTENTE`
   - `actionId` : Lien vers l'action

**Scénario B : Enquête**

1. Agent Dossier crée une enquête
2. Si l'enquête génère un coût, un `FluxFrais` est créé :
   - Phase : `ENQUETE`
   - Catégorie : "Expertise", "Déplacement", etc.
   - Statut : `EN_ATTENTE`
   - `enqueteId` : Lien vers l'enquête

**Scénario C : Action Juridique / Audience**

1. Agent Juridique crée une audience ou une action juridique
2. Des frais peuvent être ajoutés :
   - Phase : `JURIDIQUE`
   - Catégorie : "Honoraires Avocat", "Frais Huissier", "Frais de Justice", etc.
   - Statut : `EN_ATTENTE`
   - `audienceId` ou `actionId` : Lien vers l'audience/action
   - `avocatId` ou `huissierId` : Lien vers l'avocat/huissier

#### Étape 3 : Validation des Frais

**Acteur** : Chef Financier uniquement

**Processus** :

1. **Consultation** :
   - Le chef financier accède à "Validation Frais"
   - Voit tous les frais en statut `EN_ATTENTE`
   - Peut filtrer par phase, catégorie, dossier, date

2. **Examen** :
   - Clique sur "Voir Détails" pour un frais
   - Consulte toutes les informations :
     - Dossier concerné
     - Phase et catégorie
     - Montant et justificatif
     - Demandeur (qui a créé le frais)
     - Date de création

3. **Décision** :
   - **Validation** : Clique sur "Valider"
     - Le statut passe à `VALIDE`
     - Le frais est maintenant inclus dans les calculs
     - Une notification est envoyée au demandeur
   - **Rejet** : Clique sur "Rejeter"
     - Ajoute un commentaire de rejet
     - Le statut passe à `REJETE`
     - Le frais n'est pas inclus dans les calculs
     - Une notification est envoyée au demandeur

4. **Mise à jour automatique** :
   - Le backend recalcule les totaux dans l'entité `Finance`
   - Les statistiques sont mises à jour
   - Le tableau de bord affiche les nouvelles données

#### Étape 4 : Calcul Automatique des Coûts

**Quand** : Après chaque validation de frais ou action sur le dossier

**Processus Backend** :

1. **Agrégation par phase** :
   - Somme tous les frais `VALIDE` par phase
   - CREATION → `fraisCreationDossier`
   - AMIABLE → `coutActionsAmiable`
   - ENQUETE → Ajouté aux frais de gestion
   - JURIDIQUE → `coutActionsJuridique`

2. **Calcul des frais spécifiques** :
   - `fraisAvocat` : Somme des frais JURIDIQUE avec `avocatId`
   - `fraisHuissier` : Somme des frais JURIDIQUE avec `huissierId`

3. **Calcul de la durée** :
   - `dureeGestionMois` : Calculée depuis la date de création

4. **Mise à jour de l'entité Finance** :
   - Tous les totaux sont recalculés
   - `nombreActionsAmiable` : Compte des actions
   - `nombreActionsJuridique` : Compte des actions juridiques

#### Étape 5 : Génération de Facture

**Quand** : Le chef financier décide de facturer un dossier

**Conditions préalables** :
- Le dossier doit avoir des frais validés
- Le dossier peut être à n'importe quelle étape du workflow

**Processus** :

1. **Déclenchement** :
   - Le chef financier accède au dossier
   - Va dans l'onglet "Finance"
   - Clique sur "Générer une Facture"

2. **Génération automatique** :
   - Le backend crée une entité `Facture`
   - Numéro de facture généré automatiquement (séquentiel)
   - Inclut tous les frais `VALIDE` non encore facturés
   - Calcule `montantHT` (somme des frais)
   - Calcule `montantTTC` (HT + TVA)
   - Définit `dateEmission` (date actuelle)
   - Définit `dateEcheance` (date d'émission + délai configuré)
   - Statut initial : `BROUILLON` ou `EMISE`

3. **Mise à jour des frais** :
   - Tous les frais inclus passent en statut `FACTURE`
   - Le champ `factureId` est renseigné pour chaque frais

4. **Génération du PDF** :
   - Le backend génère un PDF de la facture
   - Format standardisé avec :
     - En-tête avec logo et informations entreprise
     - Informations créancier et débiteur
     - Détail des frais par phase
     - Totaux HT, TVA, TTC
     - Conditions de paiement
   - Le PDF est stocké et `pdfUrl` est renseigné

5. **Finalisation** :
   - Le chef financier peut finaliser la facture
   - Le statut passe à `EMISE`
   - `factureFinalisee` dans `Finance` passe à `true`
   - `dateFacturation` est renseignée

#### Étape 6 : Envoi de la Facture

**Processus** :

1. **Envoi** :
   - Le chef financier clique sur "Envoyer la Facture"
   - Le système envoie un email au créancier avec le PDF en pièce jointe
   - `envoyee` passe à `true`

2. **Suivi** :
   - Le système suit la date d'échéance
   - Si la date d'échéance est dépassée et non payée :
     - Le statut passe à `EN_RETARD`
     - Une alerte est générée dans le tableau de bord

3. **Relance** :
   - Le chef financier peut envoyer une relance
   - `relanceEnvoyee` passe à `true`
   - Un email de relance est envoyé

#### Étape 7 : Enregistrement du Paiement

**Processus** :

1. **Création du paiement** :
   - Le chef financier enregistre un paiement reçu
   - Renseigne :
     - `factureId` : Facture concernée
     - `datePaiement` : Date du paiement
     - `montant` : Montant payé
     - `modePaiement` : VIREMENT, CHEQUE, ESPECES, etc.
     - `reference` : Référence (numéro de chèque, virement, etc.)
     - `commentaire` : Commentaire optionnel
   - Statut initial : `EN_ATTENTE`

2. **Validation** :
   - Le chef financier valide le paiement
   - Statut passe à `VALIDE`
   - Le montant est déduit du solde de la facture

3. **Mise à jour de la facture** :
   - Si le total des paiements validés = `montantTTC` :
     - Le statut de la facture passe à `PAYEE`
   - Sinon :
     - La facture reste `EMISE` avec un solde partiel

4. **Mise à jour des frais** :
   - Quand la facture est payée :
     - Tous les frais liés passent en statut `PAYE`

---

## 📊 Phases et Statuts

### Phases (`PhaseFrais`)

Les phases correspondent aux étapes du traitement d'un dossier :

1. **CREATION** :
   - Frais liés à la création du dossier
   - Exemples : Frais d'ouverture, frais administratifs

2. **AMIABLE** :
   - Frais liés au recouvrement amiable
   - Exemples : Appels téléphoniques, relances, déplacements

3. **ENQUETE** :
   - Frais liés aux enquêtes
   - Exemples : Expertise, investigations, vérifications

4. **JURIDIQUE** :
   - Frais liés au recouvrement juridique
   - Exemples : Honoraires avocat, frais d'huissier, frais de justice

### Statuts des Frais (`StatutFrais`)

Cycle de vie d'un frais :

1. **EN_ATTENTE** :
   - Frais créé mais pas encore validé
   - Visible dans "Validation Frais" pour le chef financier
   - Non inclus dans les calculs

2. **VALIDE** :
   - Frais validé par le chef financier
   - Inclus dans les calculs et statistiques
   - Peut être inclus dans une facture

3. **REJETE** :
   - Frais rejeté par le chef financier
   - Non inclus dans les calculs
   - Peut avoir un commentaire de rejet

4. **FACTURE** :
   - Frais inclus dans une facture
   - Ne peut plus être modifié
   - Lié à une facture via `factureId`

5. **PAYE** :
   - Facture contenant ce frais a été payée
   - État final du frais

### Statuts des Factures (`FactureStatut`)

1. **BROUILLON** :
   - Facture créée mais pas encore finalisée
   - Peut être modifiée

2. **EMISE** :
   - Facture finalisée et envoyée
   - En attente de paiement

3. **PAYEE** :
   - Facture entièrement payée
   - Tous les paiements validés = montant TTC

4. **EN_RETARD** :
   - Date d'échéance dépassée
   - Non payée
   - Génère une alerte

5. **ANNULEE** :
   - Facture annulée
   - Ne compte plus dans les statistiques

### Statuts des Paiements (`StatutPaiement`)

1. **EN_ATTENTE** :
   - Paiement enregistré mais pas encore validé
   - En attente de vérification

2. **VALIDE** :
   - Paiement validé
   - Montant déduit du solde de la facture

3. **REFUSE** :
   - Paiement refusé (ex: chèque sans provision)
   - Ne compte pas dans le solde

---

## 🔀 Flux de Données

### 1. Flux : Dossier → Finance

```
Dossier créé
    │
    ├─→ Finance créé automatiquement
    │
    ├─→ Actions Amiables créées
    │   └─→ FluxFrais (phase AMIABLE) créé
    │
    ├─→ Enquête créée
    │   └─→ FluxFrais (phase ENQUETE) créé
    │
    └─→ Actions Juridiques / Audiences créées
        └─→ FluxFrais (phase JURIDIQUE) créé
```

### 2. Flux : Validation des Frais

```
FluxFrais (EN_ATTENTE)
    │
    ├─→ Chef Financier consulte
    │
    ├─→ Validation
    │   └─→ Statut: VALIDE
    │   └─→ Finance mis à jour (totaux recalculés)
    │
    └─→ Rejet
        └─→ Statut: REJETE
        └─→ Notification au demandeur
```

### 3. Flux : Génération de Facture

```
Frais VALIDES
    │
    ├─→ Chef Financier génère facture
    │
    ├─→ Facture créée
    │   ├─→ Numéro généré
    │   ├─→ Frais inclus (statut → FACTURE)
    │   ├─→ Totaux calculés (HT, TVA, TTC)
    │   └─→ PDF généré
    │
    └─→ Facture envoyée
        └─→ Statut: EMISE
```

### 4. Flux : Paiement

```
Facture EMISE
    │
    ├─→ Paiement enregistré
    │   └─→ Statut: EN_ATTENTE
    │
    ├─→ Validation du paiement
    │   └─→ Statut: VALIDE
    │   └─→ Solde facture mis à jour
    │
    └─→ Si solde = 0
        └─→ Facture: PAYEE
        └─→ Frais: PAYE
```

---

## 👥 Rôles et Permissions

### Chef Financier (`CHEF_DEPARTEMENT_FINANCE`)

**Permissions complètes** :

1. **Validation des Frais** :
   - Voir tous les frais en attente
   - Valider ou rejeter les frais
   - Ajouter des commentaires

2. **Gestion du Catalogue Tarifs** :
   - Créer, modifier, supprimer des tarifs
   - Activer/désactiver des tarifs
   - Simuler des coûts

3. **Génération de Factures** :
   - Générer des factures
   - Finaliser des factures
   - Envoyer des factures
   - Envoyer des relances

4. **Gestion des Paiements** :
   - Enregistrer des paiements
   - Valider ou refuser des paiements

5. **Rapports et Analyses** :
   - Consulter le tableau de bord
   - Générer des rapports
   - Consulter les insights
   - Exporter en PDF/Excel

6. **Gestion des Agents** :
   - Créer des agents finance
   - Modifier des agents
   - Activer/désactiver des agents

### Agent Financier (`AGENT_FINANCE`)

**Permissions limitées** :

1. **Création de Frais** :
   - Créer des frais manuellement
   - Importer des frais depuis CSV
   - Consulter les frais

2. **Consultation** :
   - Consulter le tableau de bord
   - Consulter les rapports
   - Consulter les insights

3. **Pas d'accès à** :
   - Validation des frais
   - Gestion du catalogue tarifs
   - Génération de factures
   - Gestion des utilisateurs

### Agents des Autres Modules

**Agents Dossier, Amiable, Juridique** :

- Peuvent créer des frais dans leurs modules respectifs
- Les frais sont créés avec statut `EN_ATTENTE`
- Doivent attendre la validation du chef financier
- Reçoivent des notifications lors de validation/rejet

---

## 🧪 Guide de Test

### Test 1 : Cycle Complet d'un Dossier

**Objectif** : Tester le workflow complet depuis la création jusqu'au paiement

**Étapes** :

1. **Création du Dossier** :
   - Se connecter en tant qu'agent dossier
   - Créer un nouveau dossier
   - Vérifier qu'une entité Finance est créée

2. **Ajout de Frais de Création** :
   - Dans l'onglet Finance du dossier
   - Ajouter un frais de création (phase CREATION)
   - Vérifier que le statut est EN_ATTENTE

3. **Validation du Frais** :
   - Se connecter en tant que chef financier
   - Aller dans "Validation Frais"
   - Trouver le frais créé
   - Valider le frais
   - Vérifier que le statut passe à VALIDE
   - Vérifier que les totaux sont mis à jour

4. **Ajout de Frais Amiables** :
   - Se connecter en tant qu'agent amiable
   - Créer une action amiable
   - Ajouter un frais lié à l'action
   - Vérifier que le frais apparaît en EN_ATTENTE

5. **Validation du Frais Amiable** :
   - Se connecter en tant que chef financier
   - Valider le frais amiable
   - Vérifier les mises à jour

6. **Ajout de Frais Juridiques** :
   - Se connecter en tant qu'agent juridique
   - Créer une audience
   - Ajouter des frais (honoraires avocat, frais huissier)
   - Vérifier que les frais apparaissent en EN_ATTENTE

7. **Validation des Frais Juridiques** :
   - Se connecter en tant que chef financier
   - Valider tous les frais juridiques

8. **Génération de Facture** :
   - Dans le dossier, onglet Finance
   - Cliquer sur "Générer une Facture"
   - Vérifier que tous les frais validés sont inclus
   - Vérifier les totaux (HT, TVA, TTC)
   - Télécharger le PDF

9. **Envoi de la Facture** :
   - Envoyer la facture
   - Vérifier que le statut passe à EMISE

10. **Enregistrement du Paiement** :
    - Enregistrer un paiement
    - Valider le paiement
    - Vérifier que le statut de la facture passe à PAYEE
    - Vérifier que tous les frais passent en statut PAYE

### Test 2 : Validation et Rejet de Frais

**Objectif** : Tester le processus de validation/rejet

**Étapes** :

1. **Créer plusieurs frais** :
   - Créer des frais pour différentes phases
   - Créer des frais avec différents montants

2. **Validation** :
   - Valider certains frais
   - Vérifier qu'ils disparaissent de la liste "en attente"
   - Vérifier qu'ils apparaissent dans les statistiques

3. **Rejet** :
   - Rejeter un frais avec un commentaire
   - Vérifier que le frais est rejeté
   - Vérifier que le frais n'apparaît pas dans les statistiques
   - Vérifier que le demandeur reçoit une notification

### Test 3 : Import CSV

**Objectif** : Tester l'import en masse de frais

**Étapes** :

1. **Préparer un fichier CSV** :
   - Créer un CSV avec plusieurs frais
   - Inclure différentes phases et catégories

2. **Importer** :
   - Se connecter en tant qu'agent finance
   - Aller dans "Import Frais"
   - Sélectionner le fichier
   - Mapper les colonnes
   - Vérifier l'aperçu
   - Lancer l'import

3. **Vérifier** :
   - Vérifier que tous les frais sont créés
   - Vérifier qu'ils sont en statut EN_ATTENTE
   - Vérifier qu'ils apparaissent dans "Validation Frais"

### Test 4 : Gestion du Catalogue Tarifs

**Objectif** : Tester la gestion des tarifs

**Étapes** :

1. **Créer un tarif** :
   - Se connecter en tant que chef financier
   - Aller dans "Catalogue Tarifs"
   - Créer un nouveau tarif
   - Vérifier qu'il apparaît dans la liste

2. **Modifier un tarif** :
   - Modifier le tarif unitaire
   - Vérifier la mise à jour

3. **Désactiver/Activer** :
   - Désactiver un tarif
   - Vérifier qu'il n'apparaît plus dans les sélections
   - Réactiver
   - Vérifier qu'il réapparaît

4. **Utiliser le tarif** :
   - Créer un frais en utilisant ce tarif
   - Vérifier que le montant est calculé automatiquement

### Test 5 : Rapports et Analyses

**Objectif** : Tester la génération de rapports

**Étapes** :

1. **Rapport Mensuel** :
   - Aller dans "Rapports"
   - Générer un rapport mensuel
   - Vérifier l'aperçu
   - Télécharger en PDF
   - Télécharger en Excel

2. **Rapport Personnalisé** :
   - Créer un rapport personnalisé
   - Filtrer par agent, période, phase
   - Générer
   - Vérifier les résultats

3. **Insights** :
   - Aller dans "Insights"
   - Consulter les recommandations
   - Appliquer une action suggérée

### Test 6 : Permissions et Accès

**Objectif** : Vérifier les permissions par rôle

**Étapes** :

1. **Agent Finance** :
   - Se connecter en tant qu'agent finance
   - Vérifier qu'il ne voit PAS "Validation Frais"
   - Vérifier qu'il ne voit PAS "Catalogue Tarifs"
   - Vérifier qu'il peut créer des frais
   - Vérifier qu'il peut importer des frais

2. **Chef Financier** :
   - Se connecter en tant que chef financier
   - Vérifier qu'il voit TOUS les menus
   - Vérifier qu'il peut valider des frais
   - Vérifier qu'il peut générer des factures

3. **Agent Amiable** :
   - Se connecter en tant qu'agent amiable
   - Créer un frais dans une action amiable
   - Vérifier que le frais est créé en EN_ATTENTE
   - Vérifier qu'il ne peut pas valider le frais

---

## 📝 Points d'Attention

### 1. Calculs Automatiques

- Les totaux sont recalculés automatiquement après chaque validation
- Les calculs incluent uniquement les frais avec statut VALIDE
- Les frais REJETE ne sont jamais inclus

### 2. Statuts et Transitions

- Un frais ne peut pas passer directement de EN_ATTENTE à FACTURE
- Il doit d'abord être VALIDE
- Une fois FACTURE, un frais ne peut plus être modifié

### 3. Factures

- Une facture ne peut être générée que si des frais sont VALIDES
- Une fois EMISE, une facture ne peut plus être modifiée
- Pour corriger, il faut annuler et recréer

### 4. Paiements

- Plusieurs paiements peuvent être enregistrés pour une facture
- La facture est PAYEE seulement si le total des paiements = montant TTC
- Les paiements EN_ATTENTE ne comptent pas dans le solde

### 5. Catalogue Tarifs

- Les tarifs peuvent avoir des dates de validité
- Seuls les tarifs ACTIFS sont utilisables
- Les tarifs peuvent être désactivés sans être supprimés

---

## 🔍 Dépannage

### Problème : Les frais n'apparaissent pas dans "Validation Frais"

**Causes possibles** :
- Le statut n'est pas EN_ATTENTE
- Problème de filtrage côté frontend
- Problème d'API backend

**Solutions** :
1. Vérifier le statut du frais dans la base de données
2. Vérifier les logs du backend
3. Vérifier la console du navigateur
4. Vérifier les permissions de l'utilisateur

### Problème : Les totaux ne sont pas mis à jour

**Causes possibles** :
- Le recalcul automatique n'a pas été déclenché
- Des frais ne sont pas en statut VALIDE
- Problème de calcul côté backend

**Solutions** :
1. Déclencher manuellement le recalcul (bouton "Recalculer")
2. Vérifier que tous les frais sont VALIDES
3. Vérifier les logs du backend

### Problème : La facture ne se génère pas

**Causes possibles** :
- Aucun frais VALIDE
- Tous les frais sont déjà FACTURE
- Problème de génération PDF

**Solutions** :
1. Vérifier qu'il y a des frais VALIDES non facturés
2. Vérifier les logs du backend
3. Vérifier les permissions

---

**Dernière mise à jour** : 2024-12-01
**Version** : 1.0.0


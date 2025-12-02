# 💰 Workflow Finance Amélioré - Intégration de l'Annexe du Contrat

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Structure Tarifaire selon l'Annexe](#structure-tarifaire-selon-lannexe)
3. [Workflow Amélioré par Phase](#workflow-amélioré-par-phase)
4. [Processus de Validation des Tarifs](#processus-de-validation-des-tarifs)
5. [Génération de Facture](#génération-de-facture)
6. [Gestion des Paiements et Clôture](#gestion-des-paiements-et-clôture)
7. [Changements Backend Nécessaires](#changements-backend-nécessaires)
8. [Architecture Technique](#architecture-technique)

---

## 🎯 Vue d'Ensemble

Le workflow finance amélioré intègre les tarifs et commissions définis dans l'annexe du contrat de recouvrement. Le chef financier a maintenant une **vision complète** de tous les traitements effectués sur un dossier et peut **ajouter et valider les tarifs** pour chaque élément avant la génération de la facture.

### Principes Clés

1. **Traçabilité Complète** : Tous les traitements (enquête, actions amiable, documents huissier, actions huissier, audiences) sont visibles
2. **Tarification Flexible** : Le chef financier ajoute les coûts unitaires selon les traitements réels
3. **Validation Étape par Étape** : Chaque tarif doit être validé avant de passer à la génération de facture
4. **Application des Pourcentages** : Les commissions selon l'annexe sont appliquées automatiquement
5. **Facturation Finale** : Une fois tous les tarifs validés, génération de la facture complète

---

## 📊 Structure Tarifaire selon l'Annexe

### Article 1 : Frais Fixes par Dossier (HT)

| Service | Montant (TND) | Phase Associée |
|---------|---------------|----------------|
| Frais de réception et d'ouverture de dossier | 250 TND | CREATION |
| Frais Enquête Précontentieuse | 300 TND | ENQUETE |
| Avance sur frais de recouvrement judiciaire | 1000 TND | JURIDIQUE (avance) |
| Attestation de carence à la demande du mandant | 500 TND | JURIDIQUE |

**Note** : Ces frais sont **fixes** et s'appliquent une fois par dossier selon la phase.

### Article 2 : Commissions de Recouvrement (Pourcentages)

| Phase de Recouvrement | Taux de Commission | Base de Calcul |
|----------------------|-------------------|----------------|
| Relance Factures datées de moins de 6 mois | 5% | Montant recouvré |
| Recouvrement Amiable | 12% | Montant recouvré |
| Recouvrement Judiciaire | 15% | Montant recouvré |
| Commission sur intérêts | 50% | Intérêts recouvrés |

**Note** : Les commissions sont calculées sur les **montants recouvrés**, pas sur les frais engagés.

### Tarifs Variables à Saisir

Pour chaque dossier, le chef financier doit saisir les coûts réels selon les traitements effectués :

#### Phase ENQUETE
- Coûts d'expertise (si effectuée)
- Coûts de déplacement (si effectués)
- Autres frais d'enquête spécifiques

#### Phase AMIABLE
- Coût unitaire par action amiable (appel, relance, etc.)
- Nombre d'occurrences de chaque type d'action

#### Phase JURIDIQUE
- **Documents Huissier** : Coût unitaire pour chaque document
- **Actions Huissier** : Coût unitaire pour chaque action
- **Audiences** : Coût unitaire pour chaque audience
- **Honoraires Avocat** : Coût par audience ou forfait

---

## 🔄 Workflow Amélioré par Phase

### Vue d'Ensemble du Processus

```
┌─────────────────────────────────────────────────────────────┐
│              WORKFLOW FINANCE AMÉLIORÉ COMPLET               │
└─────────────────────────────────────────────────────────────┘

1. CRÉATION DU DOSSIER
   │
   ├─→ Finance créé automatiquement
   ├─→ Frais fixe de création : 250 TND (selon annexe)
   └─→ Statut: EN_ATTENTE_VALIDATION_TARIF

2. PHASE ENQUETE
   │
   ├─→ Chef Financier voit l'enquete ajouter
   ├─→ il voit enquete et il Ajoute les traitement effectuers(expertise, déplacement, etc.)(coucher des case par exemple et ses coûts unitaires puis faire la somme pour enquete.
   ├─→ Valide chaque tarif
   └─→ Frais fixe enquête : 300 TND (selon annexe)

3. PHASE AMIABLE
   │
   ├─→ Chef Financier voit toutes les actions amiables
   ├─→ Pour chaque type d'action :
   │   ├─→ vérifier le coût unitaire
   │   ├─→ Vérifie le nombre d'occurrences
   │   └─→ Valide le tarif
   ├─→ Application commission 12% (sur montant recouvré)
   └─→ Frais fixe relance < 6 mois : 5% (si applicable)

4. PHASE JURIDIQUE
   │
   ├─→ Documents Huissier
   │   ├─→ Chef Financier voit tous les documents
   │   ├─→ Saisit le coût unitaire pour chaque document
   │   └─→ Valide chaque tarif
   │
   ├─→ Actions Huissier
   │   ├─→ Chef Financier voit toutes les actions
   │   ├─→ Saisit le coût unitaire pour chaque action
   │   └─→ Valide chaque tarif
   │
   ├─→ Audiences
   │   ├─→ Chef Financier voit toutes les audiences
   │   ├─→ Saisit le coût unitaire pour chaque audience
   │   ├─→ Saisit les honoraires avocat (si applicable)
   │   └─→ Valide chaque tarif
   │
   ├─→ Frais fixes :
   │   ├─→ Avance recouvrement judiciaire : 1000 TND
   │   └─→ Attestation de carence : 500 TND (si applicable)
   │
   └─→ Application commission 15% (sur montant recouvré)

5. VALIDATION COMPLÈTE
   │
   ├─→ Chef Financier vérifie tous les tarifs validés
   ├─→ Tous les tarifs doivent être validés
   └─→ Bouton "Générer Facture" devient actif

6. GÉNÉRATION DE FACTURE
   │
   ├─→ Calcul automatique :
   │   ├─→ Somme de tous les frais validés
   │   ├─→ Application des commissions selon l'annexe
   │   ├─→ Calcul TVA
   │   └─→ Total TTC
   │
   ├─→ Génération PDF
   └─→ Statut: EMISE

7. GESTION PAIEMENT
   │
   ├─→ Enregistrement des paiements
   ├─→ Validation des paiements
   └─→ Si facture payée → Clôture et Archivage
```

---

## 📋 Détail du Workflow par Phase

### Phase 1 : CRÉATION

#### Traitements Effectués
- Ouverture du dossier
- Réception des documents
- Initialisation du suivi

#### Frais Associés (selon annexe)
- **Frais fixe** : 250 TND (réception et ouverture)

#### Actions Chef Financier
1. Consulter le dossier en phase création
2. Voir le traitement "Ouverture de dossier"
3. Le frais fixe de 250 TND est **automatiquement ajouté** (selon annexe)
4. **Valider** le tarif de création
5. Statut : `TARIF_CREATION_VALIDE`

---

### Phase 2 : ENQUETE

#### Traitements Effectués
- Enquête précontentieuse
- Expertise (si effectuée)(on ne peut pas s'avoire si effectuer ou non le chef financier dois choisire ca et ajouter le prix unitaire )
- Déplacements (si effectués)(on ne peut pas s'avoire si effectuer ou non le chef financier dois choisire ca et ajouter le prix unitaire)
- Vérifications diverses

#### Frais Associés (selon annexe)
- **Frais fixe** : 300 TND (enquête précontentieuse)
- **Frais variables** : À saisir par le chef financier selon les traitements réels

#### Actions Chef Financier

1. **Consulter les Traitements** :
   - Accéder au dossier
   - Voir la section "Phase Enquête"
   - Liste des traitements effectués :
     - Enquête précontentieuse (obligatoire)
     - Expertise (si effectuée)(on ne peut pas s'avoire si effectuer ou non le chef financier dois choisire ca et ajouter le prix unitaire )
     - Déplacement (si effectué)(on ne peut pas s'avoire si effectuer ou non le chef financier dois choisire ca et ajouter le prix unitaire )
     - Autres traitements spécifiques

2. **Saisir les Coûts Unitaires** :
   - Pour chaque traitement (sauf enquête précontentieuse qui a un tarif fixe) :
     - Cliquer sur "Ajouter Tarif"
     - Saisir le coût unitaire
     - Saisir la quantité (si applicable)
     - Ajouter un commentaire (optionnel)

3. **Validation** :
   - Le frais fixe de 300 TND est automatiquement ajouté
   - Pour chaque frais variable :
     - Vérifier le montant
     - Cliquer sur "Valider"
     - Statut passe à `TARIF_VALIDE`

4. **Résultat** :
   - Tous les tarifs de la phase ENQUETE sont validés
   - Statut global : `TARIFS_ENQUETE_VALIDES`

---

### Phase 3 : AMIABLE

#### Traitements Effectués
- Actions de relance (appels, emails, lettres)
- Négociations
- Suivi des paiements

#### Frais Associés (selon annexe)
- **Commission** : 12% sur le montant recouvré (si recouvrement amiable réussi)
- **Commission relance < 6 mois** : 5% (si applicable)

#### Actions Chef Financier

1. **Consulter les Actions Amiables** :
   - Accéder au dossier
   - Voir la section "Phase Amiable"
   - Liste de toutes les actions effectuées :
     - Type d'action (appel, email, lettre, etc.)
     - Date de l'action
     - Nombre d'occurrences
     - Réponse du débiteur (si applicable)
     - le coût unitaire de chaque action 

2. **Saisir les Coûts Unitaires** :
   - Pour chaque type d'action :
     - Cliquer sur "Ajouter Tarif"
     - Le système calcule automatiquement : `coût unitaire × nombre d'occurrences`
     - Vérifier le total

3. **Application des Commissions** :
   - Si le dossier a été recouvré en phase amiable :
     - Le système calcule automatiquement : `montant recouvré × 12%`
     - Affichage de la commission dans la section "Commissions"
   - Si relance factures < 6 mois :
     - Le système calcule automatiquement : `montant recouvré × 5%`

4. **Validation** :
   - Pour chaque tarif d'action :
     - Vérifier le montant
     - Cliquer sur "Valider"
   - Pour les commissions :
     - Vérifier le calcul
     - Cliquer sur "Valider Commission"
   - Statut : `TARIFS_AMIABLE_VALIDES`

---

### Phase 4 : JURIDIQUE

#### Traitements Effectués
- Documents huissier (significations, saisies, etc.)
- Actions huissier (saisie-vente, saisie-attribution, etc.)
- Audiences (avec avocat)
- Procédures judiciaires

#### Frais Associés (selon annexe)
- **Frais fixe** : 1000 TND (avance sur frais de recouvrement judiciaire)
- **Frais fixe** : 500 TND (attestation de carence, si applicable)
- **Commission** : 15% sur le montant recouvré (si recouvrement judiciaire réussi)
- **Commission intérêts** : 50% sur les intérêts recouvrés

#### Actions Chef Financier

##### 4.1. Documents Huissier

1. **Consulter les Documents** :
   - Accéder au dossier
   - Voir la section "Documents Huissier"
   - Liste de tous les documents :
     - Type de document (signification, saisie, etc.)
     - Date du document
     - Statut du document

2. **Saisir les Coûts** :
   - Pour chaque document :
     - Cliquer sur "Ajouter Tarif"
     - Saisir le coût unitaire
     - Ajouter un commentaire (optionnel)

3. **Validation** :
   - Vérifier chaque tarif
   - Cliquer sur "Valider" pour chaque document
   - Statut : `TARIFS_DOCUMENTS_HUISSIER_VALIDES`

##### 4.2. Actions Huissier

1. **Consulter les Actions** :
   - Voir la section "Actions Huissier"
   - Liste de toutes les actions :
     - Type d'action (saisie-vente, saisie-attribution, etc.)
     - Date de l'action
     - Statut de l'action

2. **Saisir les Coûts** :
   - Pour chaque action :
     - Cliquer sur "Ajouter Tarif"
     - Saisir le coût unitaire
     - Ajouter un commentaire (optionnel)

3. **Validation** :
   - Vérifier chaque tarif
   - Cliquer sur "Valider" pour chaque action
   - Statut : `TARIFS_ACTIONS_HUISSIER_VALIDES`

##### 4.3. Audiences

1. **Consulter les Audiences** :
   - Voir la section "Audiences"
   - Liste de toutes les audiences :
     - Date de l'audience
     - Type d'audience
     - Avocat assigné (si applicable)
     - Statut de l'audience

2. **Saisir les Coûts** :
   - Pour chaque audience :
     - Cliquer sur "Ajouter Tarif"
     - Saisir le coût de l'audience
     - Si avocat assigné :
       - Saisir les honoraires avocat
     - Ajouter un commentaire (optionnel)

3. **Validation** :
   - Vérifier chaque tarif
   - Cliquer sur "Valider" pour chaque audience
   - Statut : `TARIFS_AUDIENCES_VALIDES`

##### 4.4. Frais Fixes Juridiques

1. **Avance Recouvrement Judiciaire** :
   - Le frais fixe de 1000 TND est **automatiquement ajouté** (selon annexe)
   - Valider ce tarif

2. **Attestation de Carence** (si applicable) :
   - Le frais fixe de 500 TND est **automatiquement ajouté**
   - Valider ce tarif

##### 4.5. Application des Commissions

1. **Commission Recouvrement Judiciaire** :
   - Si le dossier a été recouvré en phase juridique :
     - Le système calcule : `montant recouvré × 15%`
     - Affichage dans la section "Commissions"
     - Valider la commission

2. **Commission Intérêts** :
   - Si des intérêts ont été recouvrés :
     - Le système calcule : `intérêts recouvrés × 50%`
     - Affichage dans la section "Commissions"
     - Valider la commission

##### 4.6. Validation Complète Phase Juridique

- Tous les tarifs doivent être validés :
  - ✅ Documents huissier
  - ✅ Actions huissier
  - ✅ Audiences
  - ✅ Frais fixes
  - ✅ Commissions
- Statut global : `TARIFS_JURIDIQUE_VALIDES`

---

## ✅ Processus de Validation des Tarifs

### Interface de Validation

Le chef financier accède à une **vue consolidée** de tous les traitements et tarifs pour un dossier :

```
┌─────────────────────────────────────────────────────────────┐
│         VALIDATION DES TARIFS - DOSSIER #12345              │
└─────────────────────────────────────────────────────────────┘

┌─ PHASE CREATION ────────────────────────────────────────────┐
│ ✅ Frais d'ouverture : 250 TND (Fixe - Annexé)             │
│    Statut: VALIDE                                           │
└─────────────────────────────────────────────────────────────┘

┌─ PHASE ENQUETE ─────────────────────────────────────────────┐
│ ✅ Frais enquête précontentieuse : 300 TND (Fixe - Annexé) │
│ ✅ Expertise : 500 TND (Saisi manuellement)                 │
│ ✅ Déplacement : 150 TND (Saisi manuellement)               │
│    Total Phase Enquête : 950 TND                           │
│    Statut: TOUS_VALIDES                                     │
└─────────────────────────────────────────────────────────────┘

┌─ PHASE AMIABLE ─────────────────────────────────────────────┐
│ ✅ Appel téléphonique (5 occurrences × 10 TND) : 50 TND    │
│ ✅ Relance email (3 occurrences × 5 TND) : 15 TND         │
│ ✅ Commission recouvrement amiable (12%) : 1200 TND       │
│    Total Phase Amiable : 1265 TND                          │
│    Statut: TOUS_VALIDES                                     │
└─────────────────────────────────────────────────────────────┘

┌─ PHASE JURIDIQUE ───────────────────────────────────────────┐
│                                                             │
│ Documents Huissier:                                         │
│ ✅ Signification (2 × 50 TND) : 100 TND                    │
│ ✅ Saisie (1 × 200 TND) : 200 TND                          │
│                                                             │
│ Actions Huissier:                                           │
│ ✅ Saisie-vente (1 × 500 TND) : 500 TND                    │
│                                                             │
│ Audiences:                                                  │
│ ✅ Audience 1 (15/11/2025) : 300 TND                       │
│    Honoraires Avocat : 500 TND                              │
│ ✅ Audience 2 (20/11/2025) : 300 TND                       │
│    Honoraires Avocat : 500 TND                              │
│                                                             │
│ Frais Fixes:                                                │
│ ✅ Avance recouvrement judiciaire : 1000 TND (Fixe)        │
│                                                             │
│ Commissions:                                                │
│ ✅ Commission recouvrement judiciaire (15%) : 1500 TND     │
│                                                             │
│    Total Phase Juridique : 4400 TND                        │
│    Statut: TOUS_VALIDES                                     │
└─────────────────────────────────────────────────────────────┘

┌─ RÉCAPITULATIF ─────────────────────────────────────────────┐
│ Frais Phase Création : 250 TND                             │
│ Frais Phase Enquête : 950 TND                              │
│ Frais Phase Amiable : 65 TND                               │
│ Commissions Amiable : 1200 TND                             │
│ Frais Phase Juridique : 2900 TND                           │
│ Commissions Juridique : 1500 TND                           │
│                                                             │
│ TOTAL HT : 6865 TND                                        │
│ TVA (19%) : 1304.35 TND                                    │
│ TOTAL TTC : 8169.35 TND                                    │
│                                                             │
│ [✅ Tous les tarifs sont validés]                          │
│                                                             │
│ [🔘 Générer Facture] (Actif si tous validés)               │
└─────────────────────────────────────────────────────────────┘
```

### Règles de Validation

1. **Ordre de Validation** :
   - Les tarifs peuvent être validés dans n'importe quel ordre
   - Mais tous doivent être validés avant la génération de facture

2. **Modification après Validation** :
   - Un tarif validé peut être modifié (avec justification)
   - La modification nécessite une re-validation

3. **Indicateurs Visuels** :
   - ✅ Vert : Tarif validé
   - ⏳ Orange : Tarif en attente de validation
   - ❌ Rouge : Tarif rejeté (ne compte pas dans le total)

4. **Bouton Génération Facture** :
   - Désactivé si au moins un tarif n'est pas validé
   - Activé uniquement si tous les tarifs sont validés
   - Message d'aide : "X tarifs en attente de validation"

---

## 📄 Génération de Facture

### Conditions Préalables

1. ✅ Tous les tarifs de toutes les phases sont validés
2. ✅ Le dossier a au moins une phase complétée
3. ✅ Le chef financier a les permissions nécessaires

### Processus de Génération

1. **Déclenchement** :
   - Le chef financier clique sur "Générer Facture"
   - Confirmation : "Générer la facture pour le dossier #12345 ?"

2. **Calcul Automatique** :

   **a) Somme des Frais** :
   ```
   Total Frais = 
     Frais Création +
     Frais Enquête +
     Frais Amiable +
     Frais Juridique (documents + actions + audiences + honoraires avocat)
   ```

   **b) Application des Commissions** :
   ```
   Commissions = 
     Commission Amiable (12% du montant recouvré) +
     Commission Juridique (15% du montant recouvré) +
     Commission Intérêts (50% des intérêts recouvrés)
   ```

   **c) Calcul TVA** :
   ```
   TVA = (Total Frais + Commissions) × 19%
   ```

   **d) Total TTC** :
   ```
   Total TTC = Total Frais + Commissions + TVA
   ```

3. **Création de la Facture** :
   - Numéro de facture généré automatiquement
   - Date d'émission : Date actuelle
   - Date d'échéance : Date d'émission + 30 jours (configurable)
   - Statut initial : `EMISE`

4. **Génération du PDF** :
   - Format standardisé selon l'annexe
   - Détail par phase :
     - Phase Création
     - Phase Enquête
     - Phase Amiable (avec commissions)
     - Phase Juridique (documents, actions, audiences, commissions)
   - Totaux HT, TVA, TTC
   - Conditions de paiement

5. **Mise à Jour des Statuts** :
   - Tous les frais inclus passent en statut `FACTURE`
   - Le champ `factureId` est renseigné
   - `factureFinalisee` dans `Finance` passe à `true`

### Liste des Factures

Le chef financier accède à une **liste de tous les dossiers avec leurs factures** :

```
┌─────────────────────────────────────────────────────────────┐
│              LISTE DES FACTURES                              │
└─────────────────────────────────────────────────────────────┘

Dossier #12345
├─ Facture #FAC-2025-001
│  ├─ Date émission : 01/12/2025
│  ├─ Montant TTC : 8169.35 TND
│  ├─ Statut : EMISE
│  └─ [Voir Détail] [Télécharger PDF] [Gérer Paiement]

Dossier #12346
├─ Facture #FAC-2025-002
│  ├─ Date émission : 02/12/2025
│  ├─ Montant TTC : 5234.50 TND
│  ├─ Statut : PAYEE
│  └─ [Voir Détail] [Télécharger PDF] [Voir Paiements]
```

---

## 💳 Gestion des Paiements et Clôture

### Enregistrement d'un Paiement

1. **Accès** :
   - Depuis la liste des factures
   - Cliquer sur "Gérer Paiement" pour une facture

2. **Formulaire de Paiement** :
   - Date de paiement
   - Montant payé
   - Mode de paiement (virement, chèque, espèces, traite, autre)
   - Référence (numéro de chèque, virement, etc.)
   - Commentaire (optionnel)
   - Pièce justificative (optionnel)

3. **Validation** :
   - Le chef financier valide le paiement
   - Statut passe à `VALIDE`
   - Le montant est déduit du solde de la facture

### Suivi des Paiements

**Interface de Suivi** :

```
┌─────────────────────────────────────────────────────────────┐
│         GESTION PAIEMENT - FACTURE #FAC-2025-001            │
└─────────────────────────────────────────────────────────────┘

Montant Facture TTC : 8169.35 TND
Montant Payé : 5000.00 TND
Solde Restant : 3169.35 TND

Historique des Paiements:
┌─────────────────────────────────────────────────────────────┐
│ Date       │ Montant │ Mode      │ Référence │ Statut      │
├─────────────────────────────────────────────────────────────┤
│ 05/12/2025 │ 5000 TND│ VIREMENT  │ VIR-001   │ ✅ VALIDE   │
│ 10/12/2025 │ 2000 TND│ CHEQUE    │ CHQ-123   │ ⏳ EN_ATTENTE│
└─────────────────────────────────────────────────────────────┘

[+ Ajouter Paiement]
```

### Clôture et Archivage

#### Conditions de Clôture

1. ✅ La facture est entièrement payée (`solde = 0`)
2. ✅ Tous les paiements sont validés
3. ✅ Le statut de la facture est `PAYEE`

#### Processus de Clôture

1. **Déclenchement Automatique** :
   - Quand le solde de la facture atteint 0
   - Le système propose automatiquement la clôture

2. **Confirmation** :
   - Le chef financier confirme la clôture
   - Message : "Clôturer et archiver le dossier #12345 ?"

3. **Actions Automatiques** :
   - Le statut du dossier passe à `CLOTURE`
   - Le dossier est archivé
   - Tous les frais passent en statut `PAYE`
   - Génération d'un récapitulatif final

4. **Résultat** :
   - Le dossier n'apparaît plus dans les listes actives
   - Accessible uniquement dans les archives
   - Toutes les données sont conservées pour historique

---

## 🔧 Changements Backend Nécessaires

### 1. Nouvelle Entité : `TarifDossier`

**Objectif** : Stocker les tarifs spécifiques à chaque dossier (différents du catalogue général)

```java
@Entity
public class TarifDossier {
    @Id
    @GeneratedValue
    private Long id;
    
    @ManyToOne
    private Dossier dossier;
    
    private PhaseFrais phase;
    private String categorie; // "Document Huissier", "Action Huissier", "Audience", etc.
    private String typeElement; // Type spécifique (ex: "Signification", "Saisie-vente")
    
    private BigDecimal coutUnitaire;
    private Integer quantite;
    private BigDecimal montantTotal;
    
    private StatutTarif statut; // EN_ATTENTE, VALIDE, REJETE
    private LocalDateTime dateValidation;
    private String commentaire;
    
    // Liens optionnels
    private Long documentHuissierId;
    private Long actionHuissierId;
    private Long audienceId;
    private Long actionAmiableId;
    private Long enqueteId;
}
```

**Enum StatutTarif** :
```java
public enum StatutTarif {
    EN_ATTENTE_VALIDATION,
    VALIDE,
    REJETE
}
```

### 2. Modification de l'Entité `Finance`

**Ajouts nécessaires** :
```java
// Nouveaux champs pour les commissions
private BigDecimal commissionAmiable; // 12% du montant recouvré
private BigDecimal commissionJuridique; // 15% du montant recouvré
private BigDecimal commissionInterets; // 50% des intérêts recouvrés

// Statut de validation des tarifs
private StatutValidationTarifs statutValidationTarifs;

// Liste des tarifs du dossier
@OneToMany(mappedBy = "dossier")
private List<TarifDossier> tarifs;
```

**Enum StatutValidationTarifs** :
```java
public enum StatutValidationTarifs {
    EN_COURS,
    TARIFS_CREATION_VALIDES,
    TARIFS_ENQUETE_VALIDES,
    TARIFS_AMIABLE_VALIDES,
    TARIFS_JURIDIQUE_VALIDES,
    TOUS_TARIFS_VALIDES, // Prêt pour génération facture
    FACTURE_GENEREE
}
```

### 3. Nouveaux Endpoints Backend

#### 3.1. Récupération des Traitements d'un Dossier

```
GET /api/finances/dossier/{dossierId}/traitements
```

**Réponse** :
```json
{
  "phaseCreation": {
    "traitements": [
      {
        "type": "OUVERTURE_DOSSIER",
        "date": "2025-11-01",
        "fraisFixe": 250.00,
        "statut": "VALIDE"
      }
    ]
  },
  "phaseEnquete": {
    "traitements": [
      {
        "type": "ENQUETE_PRECONTENTIEUSE",
        "date": "2025-11-05",
        "fraisFixe": 300.00,
        "statut": "VALIDE"
      },
      {
        "type": "EXPERTISE",
        "date": "2025-11-10",
        "tarif": null,
        "statut": "EN_ATTENTE_TARIF"
      }
    ]
  },
  "phaseAmiable": {
    "actions": [
      {
        "id": 1,
        "type": "APPEL_TELEPHONIQUE",
        "date": "2025-11-15",
        "occurrences": 5,
        "tarif": null,
        "statut": "EN_ATTENTE_TARIF"
      }
    ]
  },
  "phaseJuridique": {
    "documentsHuissier": [
      {
        "id": 1,
        "type": "SIGNIFICATION",
        "date": "2025-11-20",
        "tarif": null,
        "statut": "EN_ATTENTE_TARIF"
      }
    ],
    "actionsHuissier": [
      {
        "id": 1,
        "type": "SAISIE_VENTE",
        "date": "2025-11-25",
        "tarif": null,
        "statut": "EN_ATTENTE_TARIF"
      }
    ],
    "audiences": [
      {
        "id": 1,
        "date": "2025-12-01",
        "type": "AUDIENCE_PRELIMINAIRE",
        "avocatId": 5,
        "tarifAudience": null,
        "tarifAvocat": null,
        "statut": "EN_ATTENTE_TARIF"
      }
    ]
  }
}
```

#### 3.2. Ajout d'un Tarif pour un Traitement

```
POST /api/finances/dossier/{dossierId}/tarif
```

**Body** :
```json
{
  "phase": "JURIDIQUE",
  "categorie": "DOCUMENT_HUISSIER",
  "typeElement": "SIGNIFICATION",
  "elementId": 1, // ID du document huissier
  "coutUnitaire": 50.00,
  "quantite": 2,
  "commentaire": "Signification effectuée"
}
```

**Réponse** :
```json
{
  "id": 10,
  "dossierId": 12345,
  "phase": "JURIDIQUE",
  "categorie": "DOCUMENT_HUISSIER",
  "coutUnitaire": 50.00,
  "quantite": 2,
  "montantTotal": 100.00,
  "statut": "EN_ATTENTE_VALIDATION",
  "dateCreation": "2025-12-01T10:00:00"
}
```

#### 3.3. Validation d'un Tarif

```
PUT /api/finances/tarif/{tarifId}/valider
```

**Body** (optionnel) :
```json
{
  "commentaire": "Tarif validé"
}
```

**Réponse** :
```json
{
  "id": 10,
  "statut": "VALIDE",
  "dateValidation": "2025-12-01T10:05:00"
}
```

#### 3.4. Rejet d'un Tarif

```
PUT /api/finances/tarif/{tarifId}/rejeter
```

**Body** :
```json
{
  "commentaire": "Tarif trop élevé, à revoir"
}
```

#### 3.5. Récupération de l'État de Validation

```
GET /api/finances/dossier/{dossierId}/validation-etat
```

**Réponse** :
```json
{
  "dossierId": 12345,
  "statutGlobal": "TARIFS_JURIDIQUE_VALIDES",
  "phases": {
    "CREATION": {
      "statut": "VALIDE",
      "tarifsTotal": 1,
      "tarifsValides": 1
    },
    "ENQUETE": {
      "statut": "VALIDE",
      "tarifsTotal": 3,
      "tarifsValides": 3
    },
    "AMIABLE": {
      "statut": "VALIDE",
      "tarifsTotal": 5,
      "tarifsValides": 5
    },
    "JURIDIQUE": {
      "statut": "VALIDE",
      "tarifsTotal": 8,
      "tarifsValides": 8
    }
  },
  "peutGenererFacture": true
}
```

#### 3.6. Génération de Facture avec Calcul Automatique

```
POST /api/finances/dossier/{dossierId}/generer-facture
```

**Réponse** :
```json
{
  "facture": {
    "id": 1,
    "numeroFacture": "FAC-2025-001",
    "dossierId": 12345,
    "dateEmission": "2025-12-01",
    "dateEcheance": "2025-12-31",
    "montantHT": 6865.00,
    "tva": 1304.35,
    "montantTTC": 8169.35,
    "statut": "EMISE",
    "pdfUrl": "/api/factures/1/pdf"
  },
  "detail": {
    "fraisCreation": 250.00,
    "fraisEnquete": 950.00,
    "fraisAmiable": 65.00,
    "fraisJuridique": 2900.00,
    "commissionsAmiable": 1200.00,
    "commissionsJuridique": 1500.00,
    "totalHT": 6865.00,
    "tva": 1304.35,
    "totalTTC": 8169.35
  }
}
```

#### 3.7. Calcul Automatique des Commissions

Le backend doit calculer automatiquement les commissions selon l'annexe :

```java
@Service
public class CommissionService {
    
    public BigDecimal calculerCommissionAmiable(BigDecimal montantRecouvre) {
        // 12% selon l'annexe
        return montantRecouvre.multiply(new BigDecimal("0.12"));
    }
    
    public BigDecimal calculerCommissionJuridique(BigDecimal montantRecouvre) {
        // 15% selon l'annexe
        return montantRecouvre.multiply(new BigDecimal("0.15"));
    }
    
    public BigDecimal calculerCommissionInterets(BigDecimal interetsRecouvres) {
        // 50% selon l'annexe
        return interetsRecouvres.multiply(new BigDecimal("0.50"));
    }
}
```

### 4. Modifications des Services Existants

#### 4.1. Service Finance

- Ajouter méthode pour récupérer tous les traitements d'un dossier
- Ajouter méthode pour ajouter un tarif
- Ajouter méthode pour valider/rejeter un tarif
- Modifier la génération de facture pour inclure les commissions

#### 4.2. Service Dossier

- Exposer les traitements effectués (enquête, actions amiable, documents huissier, actions huissier, audiences)
- Permettre l'accès depuis le module finance

---

## 🏗️ Architecture Technique

### Structure des Données

```
Finance (Table principale)
├─ dossierId
├─ statutValidationTarifs
├─ commissionAmiable
├─ commissionJuridique
├─ commissionInterets
└─ factureFinalisee

TarifDossier (Nouvelle table)
├─ id
├─ dossierId (FK → Dossier)
├─ phase (CREATION, ENQUETE, AMIABLE, JURIDIQUE)
├─ categorie (DOCUMENT_HUISSIER, ACTION_HUISSIER, AUDIENCE, etc.)
├─ typeElement (SIGNIFICATION, SAISIE_VENTE, etc.)
├─ coutUnitaire
├─ quantite
├─ montantTotal
├─ statut (EN_ATTENTE_VALIDATION, VALIDE, REJETE)
├─ documentHuissierId (FK optionnel)
├─ actionHuissierId (FK optionnel)
├─ audienceId (FK optionnel)
└─ actionAmiableId (FK optionnel)

Facture (Table existante)
├─ id
├─ numeroFacture
├─ dossierId
├─ montantHT
├─ montantTTC
├─ statut
└─ pdfUrl

Paiement (Table existante)
├─ id
├─ factureId
├─ montant
├─ datePaiement
├─ modePaiement
└─ statut
```

### Flux de Données

```
1. Dossier créé
   └─→ Finance créé avec frais fixe 250 TND (EN_ATTENTE_VALIDATION)

2. Traitements effectués (enquête, actions, etc.)
   └─→ Visibles dans l'interface finance mais tarifs non encore saisis

3. Chef Financier saisit les tarifs
   └─→ Création de TarifDossier (EN_ATTENTE_VALIDATION)

4. Chef Financier valide chaque tarif
   └─→ TarifDossier.statut = VALIDE

5. Tous les tarifs validés
   └─→ Finance.statutValidationTarifs = TOUS_TARIFS_VALIDES
   └─→ Bouton "Générer Facture" activé

6. Génération facture
   └─→ Calcul automatique (frais + commissions)
   └─→ Création Facture
   └─→ Génération PDF

7. Paiements
   └─→ Enregistrement Paiement
   └─→ Validation Paiement
   └─→ Si solde = 0 → Clôture et Archivage
```

---

## 📋 Résumé des Changements Backend

### Nouveaux Composants

1. **Entité `TarifDossier`** : Stocke les tarifs spécifiques à chaque dossier
2. **Service `TarifDossierService`** : Gestion CRUD des tarifs
3. **Service `CommissionService`** : Calcul automatique des commissions selon l'annexe
4. **Service `TraitementService`** : Récupération des traitements effectués par phase

### Modifications des Composants Existants

1. **Entité `Finance`** :
   - Ajout champs commissions
   - Ajout statut validation tarifs
   - Relation avec `TarifDossier`

2. **Service `FinanceService`** :
   - Méthode récupération traitements
   - Méthode ajout tarif
   - Méthode validation tarif
   - Modification génération facture (inclure commissions)

3. **Service `FactureService`** :
   - Calcul automatique des commissions
   - Génération PDF avec détail par phase

### Nouveaux Endpoints

1. `GET /api/finances/dossier/{id}/traitements` - Récupération traitements
2. `POST /api/finances/dossier/{id}/tarif` - Ajout tarif
3. `PUT /api/finances/tarif/{id}/valider` - Validation tarif
4. `PUT /api/finances/tarif/{id}/rejeter` - Rejet tarif
5. `GET /api/finances/dossier/{id}/validation-etat` - État validation
6. `POST /api/finances/dossier/{id}/generer-facture` - Génération facture (améliorée)

---

## 🎯 Points Clés à Retenir

1. **Pas de Tarifs Unitaires par Défaut** : Chaque dossier a ses propres tarifs selon les traitements réels
2. **Frais Fixes selon Annexe** : 250 TND (création), 300 TND (enquête), 1000 TND (juridique), 500 TND (carence)
3. **Commissions Automatiques** : Calculées selon l'annexe (5%, 12%, 15%, 50%)
4. **Validation Obligatoire** : Tous les tarifs doivent être validés avant facturation
5. **Traçabilité Complète** : Tous les traitements sont visibles et tarifés
6. **Clôture Automatique** : Après paiement complet, clôture et archivage automatiques

---

**Dernière mise à jour** : 2024-12-01
**Version** : 2.0.0 (Améliorée avec intégration annexe)


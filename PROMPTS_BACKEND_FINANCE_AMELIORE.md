# 🔧 Prompts Backend - Workflow Finance Amélioré

## 📋 Vue d'Ensemble

Ce document contient les prompts détaillés pour implémenter les changements backend nécessaires selon le document `WORKFLOW_FINANCE_AMELIORE_AVEC_ANNEXE.md`.

---

## 🎯 Prompt 1 : Entité TarifDossier et Gestion des Traitements Enquête

### Contexte
Le chef financier doit pouvoir **ajouter manuellement** les traitements d'enquête (expertise, déplacement, etc.) avec des cases à cocher et leurs coûts unitaires. Le système ne peut pas détecter automatiquement si ces traitements ont été effectués.

### Exigences

1. **Créer l'entité `TarifDossier`** :
   - `id` : Long (auto-généré)
   - `dossier` : Relation ManyToOne vers Dossier
   - `phase` : Enum PhaseFrais (CREATION, ENQUETE, AMIABLE, JURIDIQUE)
   - `categorie` : String (ex: "EXPERTISE", "DEPLACEMENT", "DOCUMENT_HUISSIER", "ACTION_HUISSIER", "AUDIENCE")
   - `typeElement` : String (ex: "Expertise", "Déplacement", "Signification", "Saisie-vente")
   - `coutUnitaire` : BigDecimal
   - `quantite` : Integer (par défaut 1)
   - `montantTotal` : BigDecimal (calculé : coutUnitaire × quantite)
   - `statut` : Enum StatutTarif (EN_ATTENTE_VALIDATION, VALIDE, REJETE)
   - `dateCreation` : LocalDateTime
   - `dateValidation` : LocalDateTime (nullable)
   - `commentaire` : String (nullable)
   - `documentHuissierId` : Long (nullable, FK optionnel)
   - `actionHuissierId` : Long (nullable, FK optionnel)
   - `audienceId` : Long (nullable, FK optionnel)
   - `actionAmiableId` : Long (nullable, FK optionnel)
   - `enqueteId` : Long (nullable, FK optionnel)

2. **Créer l'enum `StatutTarif`** :
   - `EN_ATTENTE_VALIDATION` : Tarif créé mais pas encore validé
   - `VALIDE` : Tarif validé par le chef financier
   - `REJETE` : Tarif rejeté par le chef financier

3. **Modifier l'entité `Finance`** :
   - Ajouter `statutValidationTarifs` : Enum StatutValidationTarifs
   - Ajouter `commissionAmiable` : BigDecimal (nullable)
   - Ajouter `commissionJuridique` : BigDecimal (nullable)
   - Ajouter `commissionInterets` : BigDecimal (nullable)
   - Ajouter relation `@OneToMany` vers `TarifDossier`

4. **Créer l'enum `StatutValidationTarifs`** :
   - `EN_COURS` : Validation en cours
   - `TARIFS_CREATION_VALIDES` : Tarifs de création validés
   - `TARIFS_ENQUETE_VALIDES` : Tarifs d'enquête validés
   - `TARIFS_AMIABLE_VALIDES` : Tarifs amiable validés
   - `TARIFS_JURIDIQUE_VALIDES` : Tarifs juridique validés
   - `TOUS_TARIFS_VALIDES` : Tous les tarifs validés, prêt pour facturation
   - `FACTURE_GENEREE` : Facture générée

5. **Créer le Repository `TarifDossierRepository`** :
   - `findByDossierId(Long dossierId)` : Récupérer tous les tarifs d'un dossier
   - `findByDossierIdAndPhase(Long dossierId, PhaseFrais phase)` : Récupérer les tarifs par phase
   - `findByDossierIdAndStatut(Long dossierId, StatutTarif statut)` : Récupérer les tarifs par statut
   - `countByDossierIdAndPhaseAndStatut(Long dossierId, PhaseFrais phase, StatutTarif statut)` : Compter les tarifs

---

## 🎯 Prompt 2 : Endpoint Récupération des Traitements d'un Dossier

### Contexte
Le chef financier doit voir tous les traitements effectués sur un dossier, organisés par phase. Pour la phase ENQUETE, le système doit permettre d'ajouter manuellement des traitements (expertise, déplacement) qui ne sont pas détectés automatiquement.

### Exigences

**Endpoint** : `GET /api/finances/dossier/{dossierId}/traitements`

**Logique** :

1. **Phase CREATION** :
   - Retourner le traitement "OUVERTURE_DOSSIER"
   - Frais fixe : 250 TND (selon annexe)
   - Statut : VALIDE si le tarif existe et est validé, sinon EN_ATTENTE_TARIF

2. **Phase ENQUETE** :
   - Retourner l'enquête précontentieuse (obligatoire) avec frais fixe 300 TND
   - Retourner une **liste de traitements possibles** (EXPERTISE, DEPLACEMENT, AUTRES) avec :
     - `type` : Type de traitement
     - `libelle` : Libellé affiché (ex: "Expertise", "Déplacement")
     - `tarifExistant` : TarifDossier existant (null si pas encore créé)
     - `statut` : Statut du tarif (EN_ATTENTE_TARIF si pas de tarif, sinon statut du tarif)
   - Le chef financier pourra cocher ces traitements et ajouter leurs coûts

3. **Phase AMIABLE** :
   - Retourner toutes les actions amiables du dossier avec :
     - `id` : ID de l'action
     - `type` : Type d'action (APPEL_TELEPHONIQUE, EMAIL, LETTRE, etc.)
     - `date` : Date de l'action
     - `occurrences` : Nombre d'occurrences
     - `coutUnitaire` : Coût unitaire (peut être null si pas encore saisi)
     - `tarifExistant` : TarifDossier existant (null si pas encore créé)
     - `statut` : Statut du tarif

4. **Phase JURIDIQUE** :
   - **Documents Huissier** : Tous les documents avec leurs détails
   - **Actions Huissier** : Toutes les actions avec leurs détails
   - **Audiences** : Toutes les audiences avec leurs détails (avocat, type, etc.)
   - Pour chaque élément : `tarifExistant` et `statut`

**Réponse JSON** :
```json
{
  "phaseCreation": {
    "traitements": [
      {
        "type": "OUVERTURE_DOSSIER",
        "date": "2025-11-01",
        "fraisFixe": 250.00,
        "tarifExistant": { ... },
        "statut": "VALIDE"
      }
    ]
  },
  "phaseEnquete": {
    "enquetePrecontentieuse": {
      "type": "ENQUETE_PRECONTENTIEUSE",
      "date": "2025-11-05",
      "fraisFixe": 300.00,
      "tarifExistant": { ... },
      "statut": "VALIDE"
    },
    "traitementsPossibles": [
      {
        "type": "EXPERTISE",
        "libelle": "Expertise",
        "tarifExistant": null,
        "statut": "EN_ATTENTE_TARIF"
      },
      {
        "type": "DEPLACEMENT",
        "libelle": "Déplacement",
        "tarifExistant": null,
        "statut": "EN_ATTENTE_TARIF"
      },
      {
        "type": "AUTRES",
        "libelle": "Autres traitements",
        "tarifExistant": null,
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
        "coutUnitaire": 10.00,
        "tarifExistant": { ... },
        "statut": "EN_ATTENTE_VALIDATION"
      }
    ]
  },
  "phaseJuridique": {
    "documentsHuissier": [ ... ],
    "actionsHuissier": [ ... ],
    "audiences": [ ... ]
  }
}
```

---

## 🎯 Prompt 3 : Endpoint Ajout de Tarif pour Traitement Enquête

### Contexte
Le chef financier coche les traitements d'enquête effectués (expertise, déplacement, etc.) et ajoute leurs coûts unitaires. Le système doit créer un `TarifDossier` pour chaque traitement sélectionné.

### Exigences

**Endpoint** : `POST /api/finances/dossier/{dossierId}/tarif`

**Body** :
```json
{
  "phase": "ENQUETE",
  "categorie": "EXPERTISE", // ou "DEPLACEMENT", "AUTRES"
  "typeElement": "Expertise", // Libellé affiché
  "coutUnitaire": 500.00,
  "quantite": 1,
  "commentaire": "Expertise effectuée le 10/11/2025"
}
```

**Logique** :
1. Vérifier que le dossier existe
2. Vérifier que l'utilisateur a le rôle `CHEF_DEPARTEMENT_FINANCE`
3. Créer un nouveau `TarifDossier` :
   - `dossier` : Dossier trouvé
   - `phase` : PhaseFrais.ENQUETE
   - `categorie` : Catégorie fournie
   - `typeElement` : TypeElement fourni
   - `coutUnitaire` : CoutUnitaire fourni
   - `quantite` : Quantite fournie (par défaut 1)
   - `montantTotal` : Calculer automatiquement (coutUnitaire × quantite)
   - `statut` : StatutTarif.EN_ATTENTE_VALIDATION
   - `dateCreation` : Date actuelle
4. Sauvegarder dans la base de données
5. Retourner le `TarifDossier` créé

**Réponse** :
```json
{
  "id": 10,
  "dossierId": 12345,
  "phase": "ENQUETE",
  "categorie": "EXPERTISE",
  "typeElement": "Expertise",
  "coutUnitaire": 500.00,
  "quantite": 1,
  "montantTotal": 500.00,
  "statut": "EN_ATTENTE_VALIDATION",
  "dateCreation": "2025-12-01T10:00:00",
  "commentaire": "Expertise effectuée le 10/11/2025"
}
```

---

## 🎯 Prompt 4 : Endpoint Ajout de Tarif pour Actions Amiables

### Contexte
Pour les actions amiables, le chef financier **vérifie** le coût unitaire (qui peut déjà être présent) et valide le tarif. Le système calcule automatiquement le total (coût unitaire × occurrences).

### Exigences

**Endpoint** : `POST /api/finances/dossier/{dossierId}/tarif` (même endpoint, logique différente selon la phase)

**Body pour Actions Amiables** :
```json
{
  "phase": "AMIABLE",
  "categorie": "ACTION_AMIABLE",
  "typeElement": "APPEL_TELEPHONIQUE",
  "actionAmiableId": 1, // ID de l'action amiable
  "coutUnitaire": 10.00, // Peut être modifié par le chef financier
  "quantite": 5, // Nombre d'occurrences de l'action
  "commentaire": "Tarif vérifié et validé"
}
```

**Logique** :
1. Vérifier que l'action amiable existe
2. Si un tarif existe déjà pour cette action, le mettre à jour
3. Sinon, créer un nouveau tarif
4. Calculer `montantTotal = coutUnitaire × quantite`
5. Statut initial : `EN_ATTENTE_VALIDATION`

---

## 🎯 Prompt 5 : Endpoint Validation/Rejet de Tarif

### Exigences

**Validation** : `PUT /api/finances/tarif/{tarifId}/valider`

**Body** (optionnel) :
```json
{
  "commentaire": "Tarif validé"
}
```

**Logique** :
1. Récupérer le `TarifDossier` par ID
2. Vérifier que le statut est `EN_ATTENTE_VALIDATION`
3. Mettre à jour :
   - `statut` = `VALIDE`
   - `dateValidation` = Date actuelle
   - `commentaire` = Commentaire fourni (si présent)
4. Vérifier si tous les tarifs de la phase sont validés
5. Si oui, mettre à jour `Finance.statutValidationTarifs` :
   - Si phase CREATION → `TARIFS_CREATION_VALIDES`
   - Si phase ENQUETE → `TARIFS_ENQUETE_VALIDES`
   - Si phase AMIABLE → `TARIFS_AMIABLE_VALIDES`
   - Si phase JURIDIQUE → `TARIFS_JURIDIQUE_VALIDES`
6. Vérifier si toutes les phases sont validées → `TOUS_TARIFS_VALIDES`

**Rejet** : `PUT /api/finances/tarif/{tarifId}/rejeter`

**Body** :
```json
{
  "commentaire": "Tarif trop élevé, à revoir"
}
```

**Logique** :
1. Récupérer le `TarifDossier` par ID
2. Mettre à jour :
   - `statut` = `REJETE`
   - `commentaire` = Commentaire fourni (obligatoire pour rejet)

---

## 🎯 Prompt 6 : Endpoint État de Validation

### Exigences

**Endpoint** : `GET /api/finances/dossier/{dossierId}/validation-etat`

**Logique** :
1. Récupérer tous les tarifs du dossier groupés par phase
2. Pour chaque phase, calculer :
   - `tarifsTotal` : Nombre total de tarifs
   - `tarifsValides` : Nombre de tarifs validés
   - `statut` : "VALIDE" si tous validés, "EN_COURS" sinon
3. Calculer le statut global :
   - Si toutes les phases sont validées → `TOUS_TARIFS_VALIDES`
   - Sinon → Statut de la dernière phase validée
4. `peutGenererFacture` : true si `TOUS_TARIFS_VALIDES`

**Réponse** :
```json
{
  "dossierId": 12345,
  "statutGlobal": "TOUS_TARIFS_VALIDES",
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

---

## 🎯 Prompt 7 : Service Calcul des Commissions

### Exigences

**Créer `CommissionService`** :

```java
@Service
public class CommissionService {
    
    // Commission amiable : 12% du montant recouvré
    public BigDecimal calculerCommissionAmiable(BigDecimal montantRecouvre) {
        if (montantRecouvre == null || montantRecouvre.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return montantRecouvre.multiply(new BigDecimal("0.12"));
    }
    
    // Commission juridique : 15% du montant recouvré
    public BigDecimal calculerCommissionJuridique(BigDecimal montantRecouvre) {
        if (montantRecouvre == null || montantRecouvre.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return montantRecouvre.multiply(new BigDecimal("0.15"));
    }
    
    // Commission relance < 6 mois : 5% du montant recouvré
    public BigDecimal calculerCommissionRelance(BigDecimal montantRecouvre) {
        if (montantRecouvre == null || montantRecouvre.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return montantRecouvre.multiply(new BigDecimal("0.05"));
    }
    
    // Commission intérêts : 50% des intérêts recouvrés
    public BigDecimal calculerCommissionInterets(BigDecimal interetsRecouvres) {
        if (interetsRecouvres == null || interetsRecouvres.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return interetsRecouvres.multiply(new BigDecimal("0.50"));
    }
}
```

**Intégration dans `FinanceService`** :
- Méthode `calculerEtEnregistrerCommissions(Long dossierId)` :
  1. Récupérer le dossier
  2. Récupérer le montant recouvré (depuis le dossier ou la finalisation juridique)
  3. Calculer les commissions selon la phase de recouvrement
  4. Enregistrer dans `Finance.commissionAmiable`, `commissionJuridique`, `commissionInterets`

---

## 🎯 Prompt 8 : Endpoint Génération de Facture Améliorée

### Exigences

**Endpoint** : `POST /api/finances/dossier/{dossierId}/generer-facture`

**Préconditions** :
1. Vérifier que `Finance.statutValidationTarifs == TOUS_TARIFS_VALIDES`
2. Vérifier que le dossier a au moins une phase complétée
3. Vérifier les permissions (CHEF_DEPARTEMENT_FINANCE)

**Logique** :

1. **Récupérer tous les tarifs validés** groupés par phase :
   - Phase CREATION : Somme des tarifs
   - Phase ENQUETE : Somme des tarifs (frais fixe 300 TND + traitements ajoutés)
   - Phase AMIABLE : Somme des tarifs d'actions
   - Phase JURIDIQUE : Somme des tarifs (documents + actions + audiences + honoraires avocat)

2. **Calculer les commissions** :
   - Si recouvrement amiable : `montantRecouvre × 12%`
   - Si recouvrement juridique : `montantRecouvre × 15%`
   - Si intérêts recouvrés : `interetsRecouvres × 50%`
   - Si relance < 6 mois : `montantRecouvre × 5%`

3. **Calculer les totaux** :
   - `totalFraisHT` = Somme de tous les frais validés
   - `totalCommissionsHT` = Somme de toutes les commissions
   - `totalHT` = totalFraisHT + totalCommissionsHT
   - `tva` = totalHT × 19%
   - `totalTTC` = totalHT + tva

4. **Créer la Facture** :
   - Numéro de facture : Format "FAC-{ANNEE}-{NUMERO_SEQUENTIEL}"
   - Date d'émission : Date actuelle
   - Date d'échéance : Date d'émission + 30 jours
   - Statut : `EMISE`

5. **Mettre à jour les tarifs** :
   - Tous les tarifs inclus passent en statut `FACTURE` (nouveau statut à ajouter)
   - `factureId` renseigné pour chaque tarif

6. **Mettre à jour Finance** :
   - `factureFinalisee` = true
   - `dateFacturation` = Date actuelle
   - `statutValidationTarifs` = `FACTURE_GENEREE`

7. **Générer le PDF** :
   - Utiliser un service de génération PDF (ex: iText, Apache PDFBox)
   - Format selon l'annexe du contrat
   - Détail par phase avec tous les éléments
   - Totaux HT, TVA, TTC

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

---

## 🎯 Prompt 9 : Initialisation Automatique des Frais Fixes

### Exigences

**Lors de la création d'un dossier** :

1. **Créer automatiquement `Finance`** pour le dossier
2. **Créer automatiquement le tarif de création** :
   - Phase : CREATION
   - Catégorie : "OUVERTURE_DOSSIER"
   - Frais fixe : 250 TND (selon annexe)
   - Statut : `EN_ATTENTE_VALIDATION`
   - `montantTotal` = 250.00

**Lors du passage à la phase ENQUETE** :

1. **Créer automatiquement le tarif d'enquête précontentieuse** :
   - Phase : ENQUETE
   - Catégorie : "ENQUETE_PRECONTENTIEUSE"
   - Frais fixe : 300 TND (selon annexe)
   - Statut : `EN_ATTENTE_VALIDATION`
   - `montantTotal` = 300.00

**Lors du passage à la phase JURIDIQUE** :

1. **Créer automatiquement le tarif d'avance recouvrement judiciaire** :
   - Phase : JURIDIQUE
   - Catégorie : "AVANCE_RECOUVREMENT_JUDICIAIRE"
   - Frais fixe : 1000 TND (selon annexe)
   - Statut : `EN_ATTENTE_VALIDATION`
   - `montantTotal` = 1000.00

**Implémentation** :
- Utiliser des `@EventListener` ou des méthodes dans les services de transition de phase
- Ou utiliser des `@PostPersist` / `@PostUpdate` dans les entités

---

## 🎯 Prompt 10 : DTOs et Mappers

### Exigences

**Créer les DTOs** :

1. **`TarifDossierDTO`** :
   - Tous les champs de `TarifDossier`
   - `dossierId` : Long
   - `dossierNumero` : String (optionnel, pour affichage)

2. **`TraitementsDossierDTO`** :
   - `phaseCreation` : PhaseCreationDTO
   - `phaseEnquete` : PhaseEnqueteDTO
   - `phaseAmiable` : PhaseAmiableDTO
   - `phaseJuridique` : PhaseJuridiqueDTO

3. **`PhaseEnqueteDTO`** :
   - `enquetePrecontentieuse` : TraitementDTO
   - `traitementsPossibles` : List<TraitementPossibleDTO>

4. **`TraitementPossibleDTO`** :
   - `type` : String
   - `libelle` : String
   - `tarifExistant` : TarifDossierDTO (nullable)
   - `statut` : String

**Créer les Mappers MapStruct** :
- `TarifDossierMapper` : Entity ↔ DTO
- `TraitementsDossierMapper` : Assemblage des traitements par phase

---

## 📋 Checklist de Vérification

- [ ] Entité `TarifDossier` créée avec tous les champs
- [ ] Enum `StatutTarif` créé
- [ ] Enum `StatutValidationTarifs` créé
- [ ] Entité `Finance` modifiée (ajout champs commissions, statut validation)
- [ ] Repository `TarifDossierRepository` créé
- [ ] Service `TarifDossierService` créé avec méthodes CRUD
- [ ] Service `CommissionService` créé
- [ ] Endpoint `GET /api/finances/dossier/{id}/traitements` implémenté
- [ ] Endpoint `POST /api/finances/dossier/{id}/tarif` implémenté
- [ ] Endpoint `PUT /api/finances/tarif/{id}/valider` implémenté
- [ ] Endpoint `PUT /api/finances/tarif/{id}/rejeter` implémenté
- [ ] Endpoint `GET /api/finances/dossier/{id}/validation-etat` implémenté
- [ ] Endpoint `POST /api/finances/dossier/{id}/generer-facture` amélioré
- [ ] Initialisation automatique des frais fixes
- [ ] DTOs et Mappers créés
- [ ] Tests unitaires pour chaque service
- [ ] Tests d'intégration pour chaque endpoint

---

**Dernière mise à jour** : 2024-12-01


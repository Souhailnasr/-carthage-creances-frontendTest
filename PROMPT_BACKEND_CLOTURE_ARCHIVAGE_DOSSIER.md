# 🔧 PROMPT BACKEND - Clôture et Archivage de Dossier après Paiement Complet

## 📋 Vue d'Ensemble

Ce document détaille les améliorations backend nécessaires pour permettre la **clôture et l'archivage automatique** d'un dossier une fois que sa facture est entièrement payée.

---

## 🎯 Objectif

Permettre au Chef Financier de **clôturer et archiver** un dossier une fois que :
1. ✅ La facture est entièrement payée (solde = 0)
2. ✅ Tous les paiements sont validés
3. ✅ Le statut de la facture est `PAYEE`

---

## 🔄 Workflow Complet

```
1. Facture émise (statut: EMISE)
   └─→ Montant TTC : 10,000 TND

2. Paiements enregistrés et validés
   └─→ Total payé : 10,000 TND
   └─→ Solde restant : 0 TND

3. Mise à jour automatique de la facture
   └─→ Statut facture : PAYEE ✅

4. Bouton "Clôturer et Archiver" disponible
   └─→ Chef Financier clique sur le bouton

5. Clôture et archivage
   └─→ Statut dossier : CLOTURE
   └─→ Dossier archivé
   └─→ Tous les frais passent en statut PAYE
```

---

## 📊 Endpoints Backend Nécessaires

### 1. Endpoint : Calculer le Solde Restant

**GET** `/api/factures/{factureId}/solde`

**Réponse** :
```json
{
  "factureId": 4,
  "montantTTC": 934.15,
  "totalPaiementsValides": 500.00,
  "soldeRestant": 434.15,
  "estEntierementPayee": false
}
```

**Logique** :
- Récupérer la facture par ID
- Calculer la somme des paiements avec `statut = VALIDE`
- Calculer `soldeRestant = montantTTC - totalPaiementsValides`
- Retourner `estEntierementPayee = true` si `soldeRestant <= 0`

---

### 2. Endpoint : Mise à Jour Automatique du Statut de Facture

**PUT** `/api/factures/{factureId}/verifier-statut`

**Logique** :
- Calculer le solde restant
- Si `soldeRestant <= 0` ET tous les paiements sont validés :
  - Mettre à jour `facture.statut = PAYEE`
  - Mettre à jour tous les frais liés : `statut = PAYE`
- Retourner la facture mise à jour

**Appel automatique** :
- Après chaque validation de paiement
- Après chaque création de paiement validé

---

### 3. Endpoint : Clôturer et Archiver un Dossier

**POST** `/api/dossiers/{dossierId}/cloturer-et-archiver`

**Préconditions** :
1. ✅ La facture associée au dossier est `PAYEE`
2. ✅ Le solde de la facture est `0`
3. ✅ Tous les paiements sont validés
4. ✅ L'utilisateur a le rôle `CHEF_DEPARTEMENT_FINANCE`

**Logique** :
1. **Vérifier les préconditions** :
   ```java
   Facture facture = factureRepository.findByDossierId(dossierId)
       .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvée"));
   
   if (facture.getStatut() != FactureStatut.PAYEE) {
       throw new BusinessException("La facture doit être entièrement payée");
   }
   
   BigDecimal soldeRestant = calculerSoldeRestant(facture.getId());
   if (soldeRestant.compareTo(BigDecimal.ZERO) > 0) {
       throw new BusinessException("Il reste un solde à payer");
   }
   ```

2. **Mettre à jour le dossier** :
   ```java
   Dossier dossier = dossierRepository.findById(dossierId)
       .orElseThrow(() -> new ResourceNotFoundException("Dossier non trouvé"));
   
   dossier.setStatut(StatutDossier.CLOTURE);
   dossier.setDateCloture(LocalDateTime.now());
   dossier.setArchive(true);
   dossier.setDateArchivage(LocalDateTime.now());
   ```

3. **Mettre à jour tous les frais** :
   ```java
   List<TarifDossier> tarifs = tarifDossierRepository.findByDossierId(dossierId);
   tarifs.forEach(tarif -> {
       tarif.setStatut(StatutTarif.PAYE);
   });
   tarifDossierRepository.saveAll(tarifs);
   ```

4. **Mettre à jour Finance** :
   ```java
   Finance finance = financeRepository.findByDossierId(dossierId)
       .orElseThrow(() -> new ResourceNotFoundException("Finance non trouvé"));
   
   finance.setDossierCloture(true);
   finance.setDateCloture(LocalDateTime.now());
   ```

5. **Générer un récapitulatif** (optionnel) :
   - PDF récapitulatif du dossier
   - Historique complet des actions
   - Détail des paiements

**Réponse** :
```json
{
  "dossierId": 42,
  "statut": "CLOTURE",
  "dateCloture": "2025-12-02T10:30:00",
  "archive": true,
  "dateArchivage": "2025-12-02T10:30:00",
  "message": "Dossier clôturé et archivé avec succès"
}
```

---

### 4. Endpoint : Vérifier si un Dossier Peut Être Clôturé

**GET** `/api/dossiers/{dossierId}/peut-etre-cloture`

**Réponse** :
```json
{
  "peutEtreCloture": true,
  "raisons": [],
  "factureId": 4,
  "montantTTC": 934.15,
  "totalPaiementsValides": 934.15,
  "soldeRestant": 0.00,
  "statutFacture": "PAYEE"
}
```

**Si ne peut pas être clôturé** :
```json
{
  "peutEtreCloture": false,
  "raisons": [
    "La facture n'est pas entièrement payée",
    "Il reste un solde de 434.15 TND à payer"
  ],
  "factureId": 4,
  "montantTTC": 934.15,
  "totalPaiementsValides": 500.00,
  "soldeRestant": 434.15,
  "statutFacture": "EMISE"
}
```

---

## 🔄 Mise à Jour Automatique du Statut de Facture

### Déclenchement Automatique

**Dans `PaiementService.validerPaiement()`** :

```java
@Transactional
public PaiementDTO validerPaiement(Long paiementId) {
    Paiement paiement = paiementRepository.findById(paiementId)
        .orElseThrow(() -> new ResourceNotFoundException("Paiement non trouvé"));
    
    // Valider le paiement
    paiement.setStatut(StatutPaiement.VALIDE);
    paiement = paiementRepository.save(paiement);
    
    // Vérifier si la facture est entièrement payée
    verifierEtMettreAJourStatutFacture(paiement.getFactureId());
    
    return paiementMapper.toDTO(paiement);
}

private void verifierEtMettreAJourStatutFacture(Long factureId) {
    Facture facture = factureRepository.findById(factureId)
        .orElseThrow(() -> new ResourceNotFoundException("Facture non trouvée"));
    
    // Calculer le total des paiements validés
    BigDecimal totalPaiementsValides = paiementRepository
        .findByFactureIdAndStatut(factureId, StatutPaiement.VALIDE)
        .stream()
        .map(Paiement::getMontant)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    
    // Si le total payé >= montant TTC
    if (totalPaiementsValides.compareTo(facture.getMontantTTC()) >= 0) {
        // Mettre à jour le statut de la facture
        facture.setStatut(FactureStatut.PAYEE);
        factureRepository.save(facture);
        
        // Mettre à jour tous les frais liés
        mettreAJourStatutFrais(facture.getDossierId());
    }
}

private void mettreAJourStatutFrais(Long dossierId) {
    List<TarifDossier> tarifs = tarifDossierRepository.findByDossierId(dossierId);
    tarifs.forEach(tarif -> {
        if (tarif.getStatut() == StatutTarif.VALIDE || tarif.getStatut() == StatutTarif.FACTURE) {
            tarif.setStatut(StatutTarif.PAYE);
        }
    });
    tarifDossierRepository.saveAll(tarifs);
}
```

---

## 📋 Modifications d'Entités Nécessaires

### 1. Entité `Dossier`

**Ajouter les champs suivants** :
```java
@Column(name = "statut")
@Enumerated(EnumType.STRING)
private StatutDossier statut; // Ajouter CLOTURE si pas déjà présent

@Column(name = "archive")
private Boolean archive = false;

@Column(name = "date_cloture")
private LocalDateTime dateCloture;

@Column(name = "date_archivage")
private LocalDateTime dateArchivage;
```

### 2. Enum `StatutDossier`

**Ajouter le statut** :
```java
public enum StatutDossier {
    // ... statuts existants ...
    CLOTURE
}
```

### 3. Entité `Facture`

**Vérifier que le statut `PAYEE` existe** :
```java
public enum FactureStatut {
    BROUILLON,
    EMISE,
    PAYEE,  // ✅ Doit exister
    EN_RETARD,
    ANNULEE
}
```

### 4. Entité `TarifDossier`

**Vérifier que le statut `PAYE` existe** :
```java
public enum StatutTarif {
    EN_ATTENTE_VALIDATION,
    VALIDE,
    REJETE,
    FACTURE,
    PAYE  // ✅ Doit exister
}
```

---

## 🧪 Tests de Vérification

### Test 1 : Calcul du Solde Restant

**Requête** :
```bash
GET /api/factures/4/solde
```

**Réponse attendue** :
```json
{
  "factureId": 4,
  "montantTTC": 934.15,
  "totalPaiementsValides": 500.00,
  "soldeRestant": 434.15,
  "estEntierementPayee": false
}
```

### Test 2 : Vérification Préconditions Clôture

**Requête** :
```bash
GET /api/dossiers/42/peut-etre-cloture
```

**Réponse attendue** (si facture payée) :
```json
{
  "peutEtreCloture": true,
  "raisons": [],
  "factureId": 4,
  "montantTTC": 934.15,
  "totalPaiementsValides": 934.15,
  "soldeRestant": 0.00,
  "statutFacture": "PAYEE"
}
```

### Test 3 : Clôture et Archivage

**Requête** :
```bash
POST /api/dossiers/42/cloturer-et-archiver
```

**Réponse attendue** :
```json
{
  "dossierId": 42,
  "statut": "CLOTURE",
  "dateCloture": "2025-12-02T10:30:00",
  "archive": true,
  "dateArchivage": "2025-12-02T10:30:00",
  "message": "Dossier clôturé et archivé avec succès"
}
```

---

## ⚠️ Points d'Attention

### 1. **Transaction Atomique**

⚠️ La clôture et l'archivage doivent être **atomiques** :
- Soit tout réussit, soit rien n'est modifié
- Utiliser `@Transactional` sur la méthode

### 2. **Vérifications Multiples**

⚠️ Vérifier **toutes** les préconditions avant de clôturer :
- Facture payée
- Solde = 0
- Tous les paiements validés
- Permissions utilisateur

### 3. **Historique et Traçabilité**

⚠️ Conserver un **historique complet** :
- Date de clôture
- Utilisateur qui a clôturé
- Raison de clôture (optionnel)
- État du dossier au moment de la clôture

### 4. **Archivage vs Suppression**

⚠️ **Archiver** ne signifie **PAS supprimer** :
- Les données doivent rester accessibles
- Créer une vue "Archives" pour consulter les dossiers archivés
- Les statistiques doivent inclure les dossiers archivés

---

## 📝 Checklist de Vérification Backend

- [ ] Endpoint `GET /api/factures/{factureId}/solde` créé
- [ ] Endpoint `PUT /api/factures/{factureId}/verifier-statut` créé
- [ ] Endpoint `POST /api/dossiers/{dossierId}/cloturer-et-archiver` créé
- [ ] Endpoint `GET /api/dossiers/{dossierId}/peut-etre-cloture` créé
- [ ] Mise à jour automatique du statut facture après validation paiement
- [ ] Mise à jour automatique des frais en statut `PAYE`
- [ ] Champs `archive`, `dateCloture`, `dateArchivage` ajoutés à `Dossier`
- [ ] Statut `CLOTURE` ajouté à `StatutDossier`
- [ ] Statut `PAYE` ajouté à `StatutTarif`
- [ ] Tests unitaires créés
- [ ] Tests d'intégration créés
- [ ] Gestion des erreurs implémentée
- [ ] Logs de traçabilité ajoutés

---

## 🔄 Impact sur le Frontend

### Données Disponibles

Une fois ces endpoints implémentés, le frontend pourra :
- ✅ Afficher le montant restant à payer
- ✅ Afficher le bouton "Clôturer et Archiver" si conditions remplies
- ✅ Vérifier les préconditions avant d'afficher le bouton
- ✅ Clôturer et archiver le dossier en un clic

---

**Date de création** : 2025-12-02  
**Statut** : ⏳ En attente d'implémentation backend


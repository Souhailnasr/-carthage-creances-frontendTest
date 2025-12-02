# ✅ Vérification Alignement Backend/Frontend - Génération Facture

## 📋 Changements Backend Appliqués

✅ **Migration de `FluxFrais` vers `TarifDossier`** :
- `FactureServiceImpl` utilise maintenant `TarifDossierRepository`
- Récupération des tarifs validés via `findByDossierIdAndStatut(dossierId, StatutTarif.VALIDE)`
- Calcul du montant HT depuis `TarifDossier.getMontantTotal()`
- Génération PDF avec les données des `TarifDossier`

## 🔍 Structure Attendue par le Frontend

### Interface `FactureDetailDTO`

**Fichier** : `finance.models.ts`

```typescript
export interface FactureDetailDTO {
  facture: Facture;
  detail: {
    fraisCreation: number;
    fraisEnquete: number;
    fraisAmiable: number;
    fraisJuridique: number;
    commissionsAmiable: number;
    commissionsJuridique: number;
    totalHT: number;
    tva: number;
    totalTTC: number;
  };
}
```

### Endpoint Appelé

**Frontend** : `POST /api/finances/dossier/{dossierId}/generer-facture`

**Service** : `FinanceService.genererFacture(dossierId: number): Observable<FactureDetailDTO>`

## ✅ Vérifications Backend Requises

### 1. Endpoint `genererFacture` dans `TarifDossierController` ou `FinanceController`

**Doit retourner** : `ResponseEntity<FactureDetailDTO>`

**Structure attendue** :

```java
@PostMapping("/dossier/{dossierId}/generer-facture")
public ResponseEntity<FactureDetailDTO> genererFacture(@PathVariable Long dossierId) {
    // 1. Vérifier que tous les tarifs sont validés
    // 2. Récupérer les tarifs validés
    // 3. Appeler FactureService.genererFactureAutomatique()
    // 4. Construire FactureDetailDTO
    // 5. Retourner ResponseEntity.ok(factureDetailDTO)
}
```

### 2. DTO `FactureDetailDTO` Backend

**Doit correspondre à** :

```java
public class FactureDetailDTO {
    private FactureDTO facture;
    private DetailFactureDTO detail;
    
    // Getters et setters
}

public class DetailFactureDTO {
    private BigDecimal fraisCreation;
    private BigDecimal fraisEnquete;
    private BigDecimal fraisAmiable;
    private BigDecimal fraisJuridique;
    private BigDecimal commissionsAmiable;
    private BigDecimal commissionsJuridique;
    private BigDecimal totalHT;
    private BigDecimal tva;
    private BigDecimal totalTTC;
    
    // Getters et setters
}
```

### 3. Calcul des Détails par Phase

**Dans `TarifDossierServiceImpl.genererFacture()`** :

```java
// Après récupération des tarifs validés
List<TarifDossier> tarifsValides = tarifDossierRepository.findByDossierIdAndStatut(
    dossierId, StatutTarif.VALIDE);

// Calculer les totaux par phase
BigDecimal fraisCreation = tarifsValides.stream()
    .filter(t -> t.getPhase() == PhaseFrais.CREATION)
    .map(TarifDossier::getMontantTotal)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

BigDecimal fraisEnquete = tarifsValides.stream()
    .filter(t -> t.getPhase() == PhaseFrais.ENQUETE)
    .map(TarifDossier::getMontantTotal)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

BigDecimal fraisAmiable = tarifsValides.stream()
    .filter(t -> t.getPhase() == PhaseFrais.AMIABLE)
    .map(TarifDossier::getMontantTotal)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

BigDecimal fraisJuridique = tarifsValides.stream()
    .filter(t -> t.getPhase() == PhaseFrais.JURIDIQUE)
    .map(TarifDossier::getMontantTotal)
    .reduce(BigDecimal.ZERO, BigDecimal::add);

// Calculer les commissions (selon l'annexe)
BigDecimal commissionsAmiable = calculerCommissionAmiable(dossier);
BigDecimal commissionsJuridique = calculerCommissionJuridique(dossier);

// Calculer les totaux
BigDecimal totalHT = fraisCreation
    .add(fraisEnquete)
    .add(fraisAmiable)
    .add(fraisJuridique)
    .add(commissionsAmiable)
    .add(commissionsJuridique);

BigDecimal tva = totalHT.multiply(new BigDecimal("0.19"));
BigDecimal totalTTC = totalHT.add(tva);

// Construire DetailFactureDTO
DetailFactureDTO detail = new DetailFactureDTO();
detail.setFraisCreation(fraisCreation);
detail.setFraisEnquete(fraisEnquete);
detail.setFraisAmiable(fraisAmiable);
detail.setFraisJuridique(fraisJuridique);
detail.setCommissionsAmiable(commissionsAmiable);
detail.setCommissionsJuridique(commissionsJuridique);
detail.setTotalHT(totalHT);
detail.setTva(tva);
detail.setTotalTTC(totalTTC);

// Construire FactureDetailDTO
FactureDetailDTO factureDetail = new FactureDetailDTO();
factureDetail.setFacture(factureDTO); // Depuis FactureService
factureDetail.setDetail(detail);

return ResponseEntity.ok(factureDetail);
```

## 🎯 Points de Vérification

### ✅ Backend

- [ ] `TarifDossierServiceImpl.genererFacture()` retourne `FactureDetailDTO`
- [ ] Les totaux par phase sont calculés depuis `TarifDossier.getMontantTotal()`
- [ ] Les commissions sont calculées selon l'annexe
- [ ] Le DTO correspond exactement à l'interface TypeScript
- [ ] Les dates de la facture sont correctement formatées

### ✅ Frontend

- [ ] `FinanceService.genererFacture()` attend `FactureDetailDTO`
- [ ] Les dates sont correctement converties en `Date` JavaScript
- [ ] La navigation vers `/finance/factures/{id}` fonctionne
- [ ] Les erreurs sont correctement gérées

## 🔧 Code Backend Recommandé

### Méthode `genererFacture` Complète

```java
@PostMapping("/dossier/{dossierId}/generer-facture")
public ResponseEntity<?> genererFacture(@PathVariable Long dossierId) {
    log.info("🔍 [GENERER-FACTURE] Dossier ID: {}", dossierId);
    
    // 1. Vérifier Finance
    Finance finance = financeRepository.findByDossierId(dossierId);
    if (finance == null) {
        return ResponseEntity.badRequest()
            .body("Finance introuvable pour le dossier " + dossierId);
    }
    
    if (finance.getStatutValidationTarifs() != StatutValidationTarifs.TOUS_TARIFS_VALIDES) {
        return ResponseEntity.badRequest()
            .body("Tous les tarifs ne sont pas validés. Statut: " + finance.getStatutValidationTarifs());
    }
    
    // 2. Récupérer les tarifs validés
    List<TarifDossier> tarifsValides = tarifDossierRepository.findByDossierIdAndStatut(
        dossierId, StatutTarif.VALIDE);
    
    if (tarifsValides == null || tarifsValides.isEmpty()) {
        log.error("❌ Aucun tarif validé trouvé pour dossier {}", dossierId);
        return ResponseEntity.badRequest()
            .body("Aucun frais validé à facturer pour ce dossier");
    }
    
    log.info("✅ {} tarifs validés trouvés", tarifsValides.size());
    
    // 3. Générer la facture via FactureService
    Facture facture = factureService.genererFactureAutomatique(dossierId);
    
    // 4. Calculer les détails par phase
    BigDecimal fraisCreation = calculerFraisParPhase(tarifsValides, PhaseFrais.CREATION);
    BigDecimal fraisEnquete = calculerFraisParPhase(tarifsValides, PhaseFrais.ENQUETE);
    BigDecimal fraisAmiable = calculerFraisParPhase(tarifsValides, PhaseFrais.AMIABLE);
    BigDecimal fraisJuridique = calculerFraisParPhase(tarifsValides, PhaseFrais.JURIDIQUE);
    
    // 5. Calculer les commissions
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new RuntimeException("Dossier introuvable"));
    BigDecimal commissionsAmiable = calculerCommissionAmiable(dossier);
    BigDecimal commissionsJuridique = calculerCommissionJuridique(dossier);
    
    // 6. Calculer les totaux
    BigDecimal totalHT = fraisCreation
        .add(fraisEnquete)
        .add(fraisAmiable)
        .add(fraisJuridique)
        .add(commissionsAmiable)
        .add(commissionsJuridique);
    BigDecimal tva = totalHT.multiply(new BigDecimal("0.19"));
    BigDecimal totalTTC = totalHT.add(tva);
    
    // 7. Construire DetailFactureDTO
    DetailFactureDTO detail = new DetailFactureDTO();
    detail.setFraisCreation(fraisCreation);
    detail.setFraisEnquete(fraisEnquete);
    detail.setFraisAmiable(fraisAmiable);
    detail.setFraisJuridique(fraisJuridique);
    detail.setCommissionsAmiable(commissionsAmiable);
    detail.setCommissionsJuridique(commissionsJuridique);
    detail.setTotalHT(totalHT);
    detail.setTva(tva);
    detail.setTotalTTC(totalTTC);
    
    // 8. Construire FactureDetailDTO
    FactureDetailDTO factureDetail = new FactureDetailDTO();
    factureDetail.setFacture(factureMapper.toDTO(facture));
    factureDetail.setDetail(detail);
    
    // 9. Mettre à jour Finance
    finance.setStatutValidationTarifs(StatutValidationTarifs.FACTURE_GENEREE);
    finance.setFactureFinalisee(true);
    finance.setDateFacturation(LocalDateTime.now());
    financeRepository.save(finance);
    
    log.info("✅ Facture générée avec succès: ID {}", facture.getId());
    
    return ResponseEntity.ok(factureDetail);
}

private BigDecimal calculerFraisParPhase(List<TarifDossier> tarifs, PhaseFrais phase) {
    return tarifs.stream()
        .filter(t -> t.getPhase() == phase)
        .map(TarifDossier::getMontantTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
}
```

## ✅ Test

**Appeler** : `POST /api/finances/dossier/42/generer-facture`

**Résultat attendu** :
```json
{
  "facture": {
    "id": 1,
    "numeroFacture": "FAC-2025-001",
    "dateEmission": "2025-12-02T04:00:00",
    "dateEcheance": "2026-01-01T04:00:00",
    "statut": "EMISE"
  },
  "detail": {
    "fraisCreation": 250.00,
    "fraisEnquete": 300.00,
    "fraisAmiable": 235.00,
    "fraisJuridique": 0.00,
    "commissionsAmiable": 0.00,
    "commissionsJuridique": 0.00,
    "totalHT": 785.00,
    "tva": 149.15,
    "totalTTC": 934.15
  }
}
```

---

**Date** : 2025-12-02  
**Statut** : ✅ Vérification et alignement


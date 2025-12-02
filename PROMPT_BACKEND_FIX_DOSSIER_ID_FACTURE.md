# 🔧 PROMPT BACKEND - Correction `dossierId` dans FactureDTO

## ❌ Problème Identifié

Le backend ne renvoie **PAS** le champ `dossierId` (ou `dossier_id`) dans les réponses JSON des endpoints de factures.

### Preuve du problème

**Endpoint appelé** : `GET /api/factures` ou `GET /api/factures/{id}`

**Réponse actuelle du backend** :
```json
{
  "id": 4,
  "numeroFacture": "FACT-2025-0001",
  "dateEmission": "2025-12-02",
  "dateEcheance": "2026-01-01",
  "montantHT": 785,
  "montantTTC": 934.15,
  "tva": 19,
  "statut": "BROUILLON",
  "envoyee": false,
  "relanceEnvoyee": false,
  "periodeDebut": "2025-12-01",
  "periodeFin": "2025-12-02",
  "pdfUrl": null
  // ❌ MANQUE : "dossierId": 42
}
```

**Dans la base de données** : La colonne `dossier_id` existe bien et contient la valeur `42` pour cette facture.

## ✅ Solution Requise

### 1. Vérifier l'entité `Facture`

**Fichier** : `Facture.java` ou `FactureEntity.java`

L'entité doit avoir :
```java
@Entity
@Table(name = "factures")
public class Facture {
    // ... autres champs ...
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;
    
    // OU si vous utilisez directement l'ID :
    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;
    
    // ... autres champs ...
}
```

### 2. Vérifier le DTO `FactureDTO`

**Fichier** : `FactureDTO.java` ou `FactureResponseDTO.java`

Le DTO **DOIT** inclure `dossierId` :
```java
public class FactureDTO {
    private Long id;
    private String numeroFacture;
    private Long dossierId;  // ✅ OBLIGATOIRE
    private LocalDate dateEmission;
    private LocalDate dateEcheance;
    private BigDecimal montantHT;
    private BigDecimal montantTTC;
    private BigDecimal tva;
    private String statut;
    private Boolean envoyee;
    private Boolean relanceEnvoyee;
    private LocalDate periodeDebut;
    private LocalDate periodeFin;
    private String pdfUrl;
    
    // Getters et setters
    public Long getDossierId() {
        return dossierId;
    }
    
    public void setDossierId(Long dossierId) {
        this.dossierId = dossierId;
    }
    
    // ... autres getters/setters ...
}
```

### 3. Vérifier le Mapper (MapStruct)

**Fichier** : `FactureMapper.java` ou `FactureMapper.java`

Le mapper **DOIT** mapper `dossierId` :
```java
@Mapper(componentModel = "spring")
public interface FactureMapper {
    
    @Mapping(source = "dossier.id", target = "dossierId")
    FactureDTO toDTO(Facture facture);
    
    // OU si vous utilisez directement dossierId dans l'entité :
    @Mapping(source = "dossierId", target = "dossierId")
    FactureDTO toDTO(Facture facture);
    
    List<FactureDTO> toDTOList(List<Facture> factures);
}
```

### 4. Vérifier les Controllers

**Fichier** : `FactureController.java`

Tous les endpoints qui renvoient des factures doivent utiliser le mapper :
```java
@RestController
@RequestMapping("/api/factures")
public class FactureController {
    
    private final FactureService factureService;
    private final FactureMapper factureMapper;
    
    @GetMapping
    public ResponseEntity<List<FactureDTO>> getAllFactures() {
        List<Facture> factures = factureService.findAll();
        List<FactureDTO> factureDTOs = factureMapper.toDTOList(factures);
        return ResponseEntity.ok(factureDTOs);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<FactureDTO> getFactureById(@PathVariable Long id) {
        Facture facture = factureService.findById(id);
        FactureDTO factureDTO = factureMapper.toDTO(facture);
        return ResponseEntity.ok(factureDTO);
    }
    
    // ... autres endpoints ...
}
```

## 🎯 Endpoints à Vérifier

Vérifier que **TOUS** ces endpoints renvoient `dossierId` :

1. ✅ `GET /api/factures` - Liste toutes les factures
2. ✅ `GET /api/factures/{id}` - Détails d'une facture
3. ✅ `GET /api/factures/dossier/{dossierId}` - Factures d'un dossier
4. ✅ `GET /api/factures/statut/{statut}` - Factures par statut
5. ✅ `GET /api/factures/en-retard` - Factures en retard
6. ✅ `POST /api/factures` - Créer une facture
7. ✅ `PUT /api/factures/{id}` - Mettre à jour une facture
8. ✅ `PUT /api/factures/{id}/finaliser` - Finaliser une facture
9. ✅ `PUT /api/factures/{id}/envoyer` - Envoyer une facture
10. ✅ `PUT /api/factures/{id}/relancer` - Relancer une facture
11. ✅ `POST /api/factures/dossier/{dossierId}/generer` - Générer facture automatique

## 📋 Checklist de Vérification

- [ ] L'entité `Facture` a bien le champ `dossier` ou `dossierId`
- [ ] Le DTO `FactureDTO` a bien le champ `dossierId` avec getter/setter
- [ ] Le mapper MapStruct mappe bien `dossier.id` vers `dossierId` (ou `dossierId` vers `dossierId`)
- [ ] Tous les endpoints utilisent le mapper pour convertir `Facture` en `FactureDTO`
- [ ] Tester avec Postman/curl que la réponse JSON contient bien `dossierId`

## 🧪 Test de Vérification

**Requête** :
```bash
curl -X GET "http://localhost:8089/carthage-creance/api/factures/4" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Réponse attendue** :
```json
{
  "id": 4,
  "numeroFacture": "FACT-2025-0001",
  "dossierId": 42,  // ✅ DOIT ÊTRE PRÉSENT
  "dateEmission": "2025-12-02",
  "dateEcheance": "2026-01-01",
  "montantHT": 785,
  "montantTTC": 934.15,
  "tva": 19,
  "statut": "BROUILLON",
  "envoyee": false,
  "relanceEnvoyee": false,
  "periodeDebut": "2025-12-01",
  "periodeFin": "2025-12-02",
  "pdfUrl": null
}
```

## ⚠️ Important

**Le frontend attend `dossierId` en camelCase**, pas `dossier_id` en snake_case. Si le backend renvoie `dossier_id`, le frontend le mappera automatiquement, mais il est préférable que le backend renvoie directement `dossierId` en camelCase pour être cohérent avec le reste de l'API.


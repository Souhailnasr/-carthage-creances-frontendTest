# 🔧 Corrections Backend : Traçabilité des Montants Recouvrés par Phase

## 📋 Table des Matières

1. [Problèmes Identifiés](#problèmes-identifiés)
2. [Endpoints à Créer/Corriger](#endpoints-à-créercorriger)
3. [Modifications des Entités](#modifications-des-entités)
4. [Modifications des Services](#modifications-des-services)
5. [Modifications des Controllers](#modifications-des-controllers)
6. [Tests à Effectuer](#tests-à-effectuer)

---

## 🚨 Problèmes Identifiés

### 1. Endpoint `/api/finances/dossier/{dossierId}/traitements` - 404 Not Found

**Problème :** L'endpoint `/api/finances/dossier/{dossierId}/traitements` retourne une erreur 404, ce qui empêche l'affichage des frais de recouvrement amiable dans la page de validation des tarifs.

**Erreur Backend :**
```
No static resource api/finances/dossier/6/traitements
org.springframework.web.servlet.resource.NoResourceFoundException
```

**Solution :** Créer l'endpoint dans le `FinanceController`.

---

### 2. Erreur "Query did not return a unique result: 2 results were returned"

**Problème :** Lors de la validation des honoraires d'avocat et des audiences, une erreur Hibernate indique qu'une requête qui devrait retourner un résultat unique retourne 2 résultats.

**Erreur :**
```
Query did not return a unique result: 2 results were returned
```

**Solution :** Vérifier les requêtes Hibernate qui utilisent `getSingleResult()` et s'assurer qu'elles retournent bien un seul résultat, ou utiliser `getResultList()` et prendre le premier élément.

---

### 3. Frais de Recouvrement Amiable Non Affichés

**Problème :** Les frais de recouvrement amiable ne s'affichent pas dans la page de validation des tarifs, malgré qu'ils soient correctement affichés dans les détails de la facture.

**Cause Probable :** L'endpoint `/traitements` ne retourne pas les actions amiables, ou elles ne sont pas correctement mappées.

---

## 🔌 Endpoints à Créer/Corriger

### 1. GET `/api/finances/dossier/{dossierId}/traitements`

**Description :** Récupère tous les traitements d'un dossier organisés par phase (création, enquête, amiable, juridique).

**Controller :** `FinanceController`

**Méthode :**
```java
@GetMapping("/dossier/{dossierId}/traitements")
public ResponseEntity<TraitementsDossierDTO> getTraitementsDossier(
    @PathVariable Long dossierId
) {
    try {
        TraitementsDossierDTO traitements = financeService.getTraitementsDossier(dossierId);
        return ResponseEntity.ok(traitements);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

**Service :** `FinanceService`

**Méthode à Implémenter :**
```java
public TraitementsDossierDTO getTraitementsDossier(Long dossierId) {
    // 1. Récupérer le dossier
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + dossierId));
    
    // 2. Construire TraitementsDossierDTO
    TraitementsDossierDTO dto = new TraitementsDossierDTO();
    
    // Phase Création
    dto.setPhaseCreation(buildPhaseCreation(dossier));
    
    // Phase Enquête
    dto.setPhaseEnquete(buildPhaseEnquete(dossier));
    
    // Phase Amiable - ✅ IMPORTANT : Inclure TOUTES les actions amiables
    dto.setPhaseAmiable(buildPhaseAmiable(dossier));
    
    // Phase Juridique
    dto.setPhaseJuridique(buildPhaseJuridique(dossier));
    
    return dto;
}

private PhaseAmiableDTO buildPhaseAmiable(Dossier dossier) {
    PhaseAmiableDTO phaseAmiable = new PhaseAmiableDTO();
    
    // ✅ Récupérer TOUTES les actions amiables du dossier
    List<ActionRecouvrement> actions = actionRecouvrementRepository
        .findByDossierId(dossier.getId());
    
    List<ActionAmiableDTO> actionsDTO = actions.stream()
        .map(action -> {
            ActionAmiableDTO dto = new ActionAmiableDTO();
            dto.setId(action.getId());
            dto.setType(action.getType());
            dto.setDate(action.getDateAction());
            dto.setOccurrences(action.getNbOccurrences() != null ? action.getNbOccurrences() : 1);
            
            // ✅ Priorité pour coutUnitaire :
            // 1. Si tarif existe : tarif.getCoutUnitaire()
            // 2. Sinon, si action.getCoutUnitaire() != null && > 0 : action.getCoutUnitaire()
            // 3. Sinon : null
            TarifDossier tarif = tarifDossierRepository
                .findByDossierIdAndPhaseAndActionAmiableId(
                    dossier.getId(), 
                    PhaseFrais.AMIABLE, 
                    action.getId()
                )
                .orElse(null);
            
            if (tarif != null && tarif.getCoutUnitaire() != null) {
                dto.setCoutUnitaire(tarif.getCoutUnitaire().doubleValue());
                dto.setTarifExistant(mapTarifToDTO(tarif));
            } else if (action.getCoutUnitaire() != null && action.getCoutUnitaire() > 0) {
                dto.setCoutUnitaire(action.getCoutUnitaire());
            } else {
                dto.setCoutUnitaire(null);
            }
            
            dto.setStatut(tarif != null ? tarif.getStatut() : StatutTarif.NON_VALIDE);
            
            return dto;
        })
        .collect(Collectors.toList());
    
    phaseAmiable.setActions(actionsDTO);
    return phaseAmiable;
}
```

---

### 2. Corriger les Requêtes Hibernate avec `getSingleResult()`

**Problème :** Certaines requêtes utilisent `getSingleResult()` mais retournent plusieurs résultats.

**Solution :** Remplacer par `getResultList()` et prendre le premier élément, ou ajouter des critères de filtrage supplémentaires.

**Exemple :**
```java
// ❌ AVANT (peut causer l'erreur)
TypedQuery<TarifDossier> query = em.createQuery(
    "SELECT t FROM TarifDossier t WHERE t.dossierId = :dossierId AND t.phase = :phase",
    TarifDossier.class
);
query.setParameter("dossierId", dossierId);
query.setParameter("phase", phase);
TarifDossier tarif = query.getSingleResult(); // ❌ Peut retourner plusieurs résultats

// ✅ APRÈS
List<TarifDossier> tarifs = query.getResultList();
if (tarifs.isEmpty()) {
    return null;
}
// Prendre le plus récent ou le plus pertinent
TarifDossier tarif = tarifs.stream()
    .sorted(Comparator.comparing(TarifDossier::getDateCreation).reversed())
    .findFirst()
    .orElse(null);
```

**Fichiers à Vérifier :**
- `TarifDossierRepository.java` - Méthodes qui utilisent `getSingleResult()`
- `FinanceService.java` - Méthodes qui récupèrent des tarifs
- Tous les repositories qui utilisent `getSingleResult()`

---

## 📝 Modifications des Entités

### 1. Entité Dossier

**Fichier :** `Dossier.java`

**Champs à Ajouter :**
```java
@Column(name = "montant_recouvre_phase_amiable", precision = 19, scale = 2)
private BigDecimal montantRecouvrePhaseAmiable;

@Column(name = "montant_recouvre_phase_juridique", precision = 19, scale = 2)
private BigDecimal montantRecouvrePhaseJuridique;

@Column(name = "montant_restant", precision = 19, scale = 2)
private BigDecimal montantRestant;

@Enumerated(EnumType.STRING)
@Column(name = "etat_dossier")
private EtatDossier etatDossier; // RECOVERED_TOTAL, RECOVERED_PARTIAL, NOT_RECOVERED
```

**Méthodes à Ajouter :**
```java
/**
 * Met à jour le montant recouvré pour la phase amiable
 */
public void updateMontantRecouvrePhaseAmiable(BigDecimal montant) {
    if (montant == null) {
        montant = BigDecimal.ZERO;
    }
    this.montantRecouvrePhaseAmiable = montant;
    this.recalculerMontantRecouvreTotal();
}

/**
 * Met à jour le montant recouvré pour la phase juridique
 */
public void updateMontantRecouvrePhaseJuridique(BigDecimal montant) {
    if (montant == null) {
        montant = BigDecimal.ZERO;
    }
    this.montantRecouvrePhaseJuridique = montant;
    this.recalculerMontantRecouvreTotal();
}

/**
 * Recalcule le montant total recouvré et le montant restant
 */
private void recalculerMontantRecouvreTotal() {
    BigDecimal totalAmiable = this.montantRecouvrePhaseAmiable != null 
        ? this.montantRecouvrePhaseAmiable 
        : BigDecimal.ZERO;
    BigDecimal totalJuridique = this.montantRecouvrePhaseJuridique != null 
        ? this.montantRecouvrePhaseJuridique 
        : BigDecimal.ZERO;
    
    this.montantRecouvre = totalAmiable.add(totalJuridique);
    
    if (this.montantCreance != null) {
        this.montantRestant = this.montantCreance.subtract(this.montantRecouvre);
        if (this.montantRestant.compareTo(BigDecimal.ZERO) < 0) {
            this.montantRestant = BigDecimal.ZERO;
        }
    }
}
```

---

### 2. Entité HistoriqueRecouvrement (NOUVELLE)

**Fichier :** `HistoriqueRecouvrement.java` (NOUVEAU)

```java
@Entity
@Table(name = "historique_recouvrement")
public class HistoriqueRecouvrement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "phase", nullable = false)
    private PhaseRecouvrement phase; // AMIABLE, JURIDIQUE
    
    @Column(name = "montant_recouvre", precision = 19, scale = 2, nullable = false)
    private BigDecimal montantRecouvre;
    
    @Column(name = "montant_total_recouvre", precision = 19, scale = 2, nullable = false)
    private BigDecimal montantTotalRecouvre;
    
    @Column(name = "montant_restant", precision = 19, scale = 2, nullable = false)
    private BigDecimal montantRestant;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type_action", nullable = false)
    private TypeActionRecouvrement typeAction; // ACTION_AMIABLE, ACTION_HUISSIER, FINALISATION_AMIABLE, FINALISATION_JURIDIQUE
    
    @Column(name = "action_id")
    private Long actionId; // ID de l'action amiable ou huissier (si applicable)
    
    @Column(name = "utilisateur_id")
    private Long utilisateurId; // ID de l'utilisateur qui a effectué l'action
    
    @Column(name = "date_enregistrement", nullable = false)
    private LocalDateTime dateEnregistrement;
    
    @Column(name = "commentaire", length = 1000)
    private String commentaire;
    
    // Getters et Setters
}
```

**Enum PhaseRecouvrement :**
```java
public enum PhaseRecouvrement {
    AMIABLE,
    JURIDIQUE
}
```

**Enum TypeActionRecouvrement :**
```java
public enum TypeActionRecouvrement {
    ACTION_AMIABLE,
    ACTION_HUISSIER,
    FINALISATION_AMIABLE,
    FINALISATION_JURIDIQUE
}
```

---

## 🔧 Modifications des Services

### 1. FinanceService - Méthode `getTraitementsDossier`

**Fichier :** `FinanceService.java`

**Méthode Complète :**
```java
public TraitementsDossierDTO getTraitementsDossier(Long dossierId) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + dossierId));
    
    TraitementsDossierDTO dto = new TraitementsDossierDTO();
    
    // Phase Création
    PhaseCreationDTO phaseCreation = new PhaseCreationDTO();
    List<TraitementCreationDTO> traitementsCreation = new ArrayList<>();
    
    // Récupérer les tarifs de création
    List<TarifDossier> tarifsCreation = tarifDossierRepository
        .findByDossierIdAndPhase(dossierId, PhaseFrais.CREATION);
    
    for (TarifDossier tarif : tarifsCreation) {
        TraitementCreationDTO traitement = new TraitementCreationDTO();
        traitement.setId(tarif.getId());
        traitement.setType(tarif.getCategorie());
        traitement.setDate(tarif.getDateCreation());
        traitement.setCoutUnitaire(tarif.getCoutUnitaire().doubleValue());
        traitement.setQuantite(tarif.getQuantite());
        traitement.setTarifExistant(mapTarifToDTO(tarif));
        traitement.setStatut(tarif.getStatut());
        traitementsCreation.add(traitement);
    }
    
    phaseCreation.setTraitements(traitementsCreation);
    dto.setPhaseCreation(phaseCreation);
    
    // Phase Enquête
    PhaseEnqueteDTO phaseEnquete = buildPhaseEnquete(dossier);
    dto.setPhaseEnquete(phaseEnquete);
    
    // ✅ Phase Amiable - IMPORTANT : Inclure TOUTES les actions
    PhaseAmiableDTO phaseAmiable = buildPhaseAmiable(dossier);
    dto.setPhaseAmiable(phaseAmiable);
    
    // Phase Juridique
    PhaseJuridiqueDTO phaseJuridique = buildPhaseJuridique(dossier);
    dto.setPhaseJuridique(phaseJuridique);
    
    return dto;
}

private PhaseAmiableDTO buildPhaseAmiable(Dossier dossier) {
    PhaseAmiableDTO phaseAmiable = new PhaseAmiableDTO();
    List<ActionAmiableDTO> actionsDTO = new ArrayList<>();
    
    // ✅ Récupérer TOUTES les actions amiables du dossier
    List<ActionRecouvrement> actions = actionRecouvrementRepository
        .findByDossierId(dossier.getId());
    
    for (ActionRecouvrement action : actions) {
        ActionAmiableDTO dto = new ActionAmiableDTO();
        dto.setId(action.getId());
        dto.setType(action.getType());
        dto.setDate(action.getDateAction());
        dto.setOccurrences(action.getNbOccurrences() != null ? action.getNbOccurrences() : 1);
        
        // ✅ Priorité pour coutUnitaire
        TarifDossier tarif = tarifDossierRepository
            .findByDossierIdAndPhaseAndActionAmiableId(
                dossier.getId(), 
                PhaseFrais.AMIABLE, 
                action.getId()
            )
            .stream()
            .sorted(Comparator.comparing(TarifDossier::getDateCreation).reversed())
            .findFirst()
            .orElse(null);
        
        if (tarif != null && tarif.getCoutUnitaire() != null) {
            dto.setCoutUnitaire(tarif.getCoutUnitaire().doubleValue());
            dto.setTarifExistant(mapTarifToDTO(tarif));
            dto.setStatut(tarif.getStatut());
        } else if (action.getCoutUnitaire() != null && action.getCoutUnitaire() > 0) {
            dto.setCoutUnitaire(action.getCoutUnitaire());
            dto.setStatut(StatutTarif.NON_VALIDE);
        } else {
            dto.setCoutUnitaire(null);
            dto.setStatut(StatutTarif.NON_VALIDE);
        }
        
        actionsDTO.add(dto);
    }
    
    phaseAmiable.setActions(actionsDTO);
    return phaseAmiable;
}
```

---

### 2. DossierService - Méthodes de Finalisation

**Fichier :** `DossierService.java`

**Méthode `finaliserDossierJuridique` :**
```java
@Transactional
public Dossier finaliserDossierJuridique(Long dossierId, FinalisationDossierDTO dto) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + dossierId));
    
    BigDecimal montantRecouvre = BigDecimal.valueOf(dto.getMontantRecouvre());
    BigDecimal montantRecouvreActuel = dossier.getMontantRecouvrePhaseJuridique() != null 
        ? dossier.getMontantRecouvrePhaseJuridique() 
        : BigDecimal.ZERO;
    
    // ✅ Mettre à jour le montant recouvré pour la phase juridique
    dossier.updateMontantRecouvrePhaseJuridique(montantRecouvreActuel.add(montantRecouvre));
    
    // Mettre à jour l'état du dossier
    if (dto.getEtatFinal() == EtatFinalDossierJuridique.RECOUVREMENT_TOTAL) {
        dossier.setEtatDossier(EtatDossier.RECOVERED_TOTAL);
        dossier.setDossierStatus(DossierStatus.CLOTURE);
        dossier.setDateCloture(LocalDateTime.now());
    } else if (dto.getEtatFinal() == EtatFinalDossierJuridique.RECOUVREMENT_PARTIEL) {
        dossier.setEtatDossier(EtatDossier.RECOVERED_PARTIAL);
    } else {
        dossier.setEtatDossier(EtatDossier.NOT_RECOVERED);
    }
    
    // ✅ Enregistrer dans l'historique
    enregistrerHistoriqueRecouvrement(
        dossierId,
        PhaseRecouvrement.JURIDIQUE,
        montantRecouvre,
        TypeActionRecouvrement.FINALISATION_JURIDIQUE,
        null, // actionId
        "Finalisation juridique - " + dto.getEtatFinal()
    );
    
    return dossierRepository.save(dossier);
}

@Transactional
public Dossier finaliserDossierAmiable(Long dossierId, FinalisationDossierDTO dto) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + dossierId));
    
    BigDecimal montantRecouvre = BigDecimal.valueOf(dto.getMontantRecouvre());
    BigDecimal montantRecouvreActuel = dossier.getMontantRecouvrePhaseAmiable() != null 
        ? dossier.getMontantRecouvrePhaseAmiable() 
        : BigDecimal.ZERO;
    
    // ✅ Mettre à jour le montant recouvré pour la phase amiable
    dossier.updateMontantRecouvrePhaseAmiable(montantRecouvreActuel.add(montantRecouvre));
    
    // Mettre à jour l'état du dossier
    if (dto.getEtatFinal() == EtatFinalDossierAmiable.RECOUVREMENT_TOTAL) {
        dossier.setEtatDossier(EtatDossier.RECOVERED_TOTAL);
        dossier.setDossierStatus(DossierStatus.CLOTURE);
        dossier.setDateCloture(LocalDateTime.now());
    } else if (dto.getEtatFinal() == EtatFinalDossierAmiable.RECOUVREMENT_PARTIEL) {
        dossier.setEtatDossier(EtatDossier.RECOVERED_PARTIAL);
    } else {
        dossier.setEtatDossier(EtatDossier.NOT_RECOVERED);
    }
    
    // ✅ Enregistrer dans l'historique
    enregistrerHistoriqueRecouvrement(
        dossierId,
        PhaseRecouvrement.AMIABLE,
        montantRecouvre,
        TypeActionRecouvrement.FINALISATION_AMIABLE,
        null, // actionId
        "Finalisation amiable - " + dto.getEtatFinal()
    );
    
    return dossierRepository.save(dossier);
}

private void enregistrerHistoriqueRecouvrement(
    Long dossierId,
    PhaseRecouvrement phase,
    BigDecimal montantRecouvre,
    TypeActionRecouvrement typeAction,
    Long actionId,
    String commentaire
) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + dossierId));
    
    HistoriqueRecouvrement historique = new HistoriqueRecouvrement();
    historique.setDossierId(dossierId);
    historique.setPhase(phase);
    historique.setMontantRecouvre(montantRecouvre);
    historique.setMontantTotalRecouvre(dossier.getMontantRecouvre());
    historique.setMontantRestant(dossier.getMontantRestant());
    historique.setTypeAction(typeAction);
    historique.setActionId(actionId);
    historique.setUtilisateurId(getCurrentUserId()); // Méthode à implémenter
    historique.setDateEnregistrement(LocalDateTime.now());
    historique.setCommentaire(commentaire);
    
    historiqueRecouvrementRepository.save(historique);
}
```

---

### 3. ActionRecouvrementService - Mise à Jour Montant Phase Amiable

**Fichier :** `ActionRecouvrementService.java`

**Méthode à Modifier :** Lors de la création/mise à jour d'une action amiable avec un montant recouvré, mettre à jour `montantRecouvrePhaseAmiable`.

```java
@Transactional
public ActionRecouvrement creerActionAmiable(ActionRecouvrementRequest request) {
    // ... création de l'action ...
    
    // ✅ Si l'action a un montant recouvré, mettre à jour le dossier
    if (request.getMontantRecouvre() != null && request.getMontantRecouvre() > 0) {
        Dossier dossier = action.getDossier();
        BigDecimal montantActuel = dossier.getMontantRecouvrePhaseAmiable() != null 
            ? dossier.getMontantRecouvrePhaseAmiable() 
            : BigDecimal.ZERO;
        BigDecimal nouveauMontant = montantActuel.add(BigDecimal.valueOf(request.getMontantRecouvre()));
        dossier.updateMontantRecouvrePhaseAmiable(nouveauMontant);
        dossierRepository.save(dossier);
        
        // ✅ Enregistrer dans l'historique
        enregistrerHistoriqueRecouvrement(
            dossier.getId(),
            PhaseRecouvrement.AMIABLE,
            BigDecimal.valueOf(request.getMontantRecouvre()),
            TypeActionRecouvrement.ACTION_AMIABLE,
            action.getId(),
            "Recouvrement suite à action amiable: " + action.getType()
        );
    }
    
    return action;
}
```

---

## 🎮 Modifications des Controllers

### 1. FinanceController - Endpoint `/traitements`

**Fichier :** `FinanceController.java`

**Méthode à Ajouter :**
```java
@GetMapping("/dossier/{dossierId}/traitements")
@PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT_FINANCE', 'SUPER_ADMIN')")
public ResponseEntity<TraitementsDossierDTO> getTraitementsDossier(
    @PathVariable Long dossierId
) {
    try {
        TraitementsDossierDTO traitements = financeService.getTraitementsDossier(dossierId);
        return ResponseEntity.ok(traitements);
    } catch (EntityNotFoundException e) {
        return ResponseEntity.notFound().build();
    } catch (Exception e) {
        logger.error("Erreur lors de la récupération des traitements pour le dossier " + dossierId, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

---

### 2. DossierController - Endpoints de Finalisation

**Fichier :** `DossierController.java`

**Méthode `finaliserDossierJuridique` :**
```java
@PutMapping("/{dossierId}/juridique/finaliser")
@PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE', 'SUPER_ADMIN')")
public ResponseEntity<DossierResponseDTO> finaliserDossierJuridique(
    @PathVariable Long dossierId,
    @RequestBody FinalisationDossierDTO dto
) {
    try {
        Dossier dossier = dossierService.finaliserDossierJuridique(dossierId, dto);
        DossierResponseDTO response = mapDossierToDTO(dossier);
        return ResponseEntity.ok(response);
    } catch (EntityNotFoundException e) {
        return ResponseEntity.notFound().build();
    } catch (Exception e) {
        logger.error("Erreur lors de la finalisation du dossier juridique " + dossierId, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

**Méthode `finaliserDossierAmiable` :**
```java
@PutMapping("/{dossierId}/amiable/finaliser")
@PreAuthorize("hasAnyRole('CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE', 'SUPER_ADMIN')")
public ResponseEntity<DossierResponseDTO> finaliserDossierAmiable(
    @PathVariable Long dossierId,
    @RequestBody FinalisationDossierDTO dto
) {
    try {
        Dossier dossier = dossierService.finaliserDossierAmiable(dossierId, dto);
        DossierResponseDTO response = mapDossierToDTO(dossier);
        return ResponseEntity.ok(response);
    } catch (EntityNotFoundException e) {
        return ResponseEntity.notFound().build();
    } catch (Exception e) {
        logger.error("Erreur lors de la finalisation du dossier amiable " + dossierId, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

---

### 3. HistoriqueRecouvrementController (NOUVEAU)

**Fichier :** `HistoriqueRecouvrementController.java` (NOUVEAU)

```java
@RestController
@RequestMapping("/api/historique-recouvrement")
@PreAuthorize("isAuthenticated()")
public class HistoriqueRecouvrementController {
    
    @Autowired
    private HistoriqueRecouvrementService historiqueService;
    
    @GetMapping("/dossier/{dossierId}")
    public ResponseEntity<List<HistoriqueRecouvrementDTO>> getHistoriqueByDossier(
        @PathVariable Long dossierId
    ) {
        List<HistoriqueRecouvrementDTO> historique = historiqueService.getHistoriqueByDossier(dossierId);
        return ResponseEntity.ok(historique);
    }
    
    @GetMapping("/dossier/{dossierId}/phase/{phase}")
    public ResponseEntity<List<HistoriqueRecouvrementDTO>> getHistoriqueByDossierAndPhase(
        @PathVariable Long dossierId,
        @PathVariable PhaseRecouvrement phase
    ) {
        List<HistoriqueRecouvrementDTO> historique = historiqueService.getHistoriqueByDossierAndPhase(dossierId, phase);
        return ResponseEntity.ok(historique);
    }
    
    @GetMapping("/dossier/{dossierId}/resume")
    public ResponseEntity<ResumeRecouvrementDTO> getResumeByDossier(
        @PathVariable Long dossierId
    ) {
        ResumeRecouvrementDTO resume = historiqueService.getResumeByDossier(dossierId);
        return ResponseEntity.ok(resume);
    }
}
```

---

## 🧪 Tests à Effectuer

### 1. Test Endpoint `/traitements`

- [ ] Vérifier que l'endpoint retourne bien tous les traitements par phase
- [ ] Vérifier que les actions amiables sont incluses dans `phaseAmiable.actions`
- [ ] Vérifier que les coûts unitaires sont correctement mappés
- [ ] Vérifier que les tarifs existants sont correctement inclus

### 2. Test Finalisation Juridique

- [ ] Vérifier que `montantRecouvrePhaseJuridique` est mis à jour
- [ ] Vérifier que `montantRecouvreTotal` est recalculé
- [ ] Vérifier que `montantRestant` est recalculé
- [ ] Vérifier que l'historique est enregistré
- [ ] Vérifier que l'état du dossier est mis à jour

### 3. Test Finalisation Amiable

- [ ] Vérifier que `montantRecouvrePhaseAmiable` est mis à jour
- [ ] Vérifier que `montantRecouvreTotal` est recalculé
- [ ] Vérifier que `montantRestant` est recalculé
- [ ] Vérifier que l'historique est enregistré
- [ ] Vérifier que l'état du dossier est mis à jour

### 4. Test Historique

- [ ] Vérifier que l'historique est enregistré pour chaque action
- [ ] Vérifier que le résumé par phase est correct
- [ ] Vérifier que les montants totaux sont corrects

### 5. Test Requêtes Hibernate

- [ ] Vérifier qu'aucune requête ne retourne plusieurs résultats quand un seul est attendu
- [ ] Tester avec des données qui pourraient causer des doublons
- [ ] Vérifier que les requêtes utilisent `getResultList()` au lieu de `getSingleResult()`

---

## 📝 Notes Importantes

1. **Migration Base de Données :** Ajouter les colonnes `montant_recouvre_phase_amiable`, `montant_recouvre_phase_juridique`, `montant_restant`, `etat_dossier` à la table `dossier`.

2. **Créer la Table `historique_recouvrement` :** Utiliser le script SQL fourni dans le guide de migration.

3. **Priorité des Coûts Unitaires :** Toujours respecter la priorité : tarif > action.coutUnitaire > null.

4. **Recalcul Automatique :** Le montant total recouvré et le montant restant doivent être recalculés automatiquement à chaque mise à jour.

5. **Historique Complet :** Toutes les actions qui modifient les montants recouvrés doivent être enregistrées dans l'historique.

---

## 🔧 Corrections Supplémentaires pour Endpoints Manquants

### Problème : Endpoints `/api/documents-huissier/dossier/{dossierId}` et `/api/actions-huissier/dossier/{dossierId}` retournent 500

**Solution Frontend :** Le fallback utilise maintenant les bons endpoints :
- `/api/huissier/documents?dossierId={id}` au lieu de `/api/documents-huissier/dossier/{id}`
- `/api/huissier/actions?dossierId={id}` au lieu de `/api/actions-huissier/dossier/{id}`

**Solution Backend :** Si ces endpoints n'existent pas, ils doivent être créés ou le fallback doit être désactivé.

### Problème : Validation des Frais Fixes

**Contexte :** Les frais de création (250 TND) et d'enquête (300 TND) sont fixes selon l'annexe et doivent être validés automatiquement.

**Solution Frontend :** 
- Le composant `validation-tarifs-creation` crée automatiquement le tarif puis le valide en une seule action
- Le composant `validation-tarifs-enquete` fait de même pour les frais d'enquête
- Amélioration de la gestion des erreurs avec messages détaillés

**Solution Backend :** 
- L'endpoint `POST /api/finances/dossier/{dossierId}/tarifs` doit accepter les frais fixes
- L'endpoint `POST /api/finances/tarifs/{tarifId}/valider` doit fonctionner correctement
- Pour les frais fixes (création et enquête), le backend pourrait automatiquement créer et valider le tarif en une seule opération

---

## ✅ Checklist d'Implémentation

- [ ] Créer l'endpoint `/api/finances/dossier/{dossierId}/traitements`
- [ ] Implémenter `buildPhaseAmiable()` pour inclure TOUTES les actions
- [ ] Corriger les requêtes Hibernate avec `getSingleResult()`
- [ ] Ajouter les champs par phase à l'entité `Dossier`
- [ ] Créer l'entité `HistoriqueRecouvrement`
- [ ] Implémenter les méthodes de finalisation dans `DossierService`
- [ ] Implémenter `enregistrerHistoriqueRecouvrement()`
- [ ] Mettre à jour `ActionRecouvrementService` pour enregistrer l'historique
- [ ] Créer `HistoriqueRecouvrementController`
- [ ] Créer `HistoriqueRecouvrementService`
- [ ] Créer les DTOs nécessaires
- [ ] Tester tous les endpoints
- [ ] Vérifier que les montants sont correctement calculés
- [ ] Vérifier que l'historique est complet

---

## 🚀 Prochaines Étapes

1. **Implémenter les corrections backend** selon ce document
2. **Tester avec des données réelles**
3. **Vérifier que le frontend fonctionne correctement** avec les nouveaux endpoints
4. **Documenter les changements** dans le README du projet


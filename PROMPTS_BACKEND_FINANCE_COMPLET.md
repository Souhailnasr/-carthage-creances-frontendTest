# 🔧 Prompts Backend - Workflow Finance Complet et Cohérent

## 📋 Vue d'Ensemble

Ce document contient **TOUS** les prompts détaillés pour implémenter les changements backend nécessaires pour être **100% cohérent** avec le frontend actuel et le workflow finance amélioré selon `WORKFLOW_FINANCE_AMELIORE_AVEC_ANNEXE.md`.

---

## 🎯 Prompt 1 : Entité TarifDossier et Enums

### Contexte
Le système doit gérer des tarifs spécifiques par dossier, avec validation par phase. Chaque tarif peut être lié à un traitement spécifique (document huissier, action, audience, enquête).

### Exigences

1. **Créer l'enum `StatutTarif`** :
```java
public enum StatutTarif {
    EN_ATTENTE_VALIDATION,  // Tarif créé mais pas encore validé
    VALIDE,                 // Tarif validé par le chef financier
    REJETE                  // Tarif rejeté par le chef financier
}
```

2. **Créer l'entité `TarifDossier`** :
```java
@Entity
@Table(name = "tarif_dossier")
public class TarifDossier {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PhaseFrais phase;
    
    @Column(nullable = false)
    private String categorie;  // Ex: "OUVERTURE_DOSSIER", "ENQUETE_PRECONTENTIEUSE", "EXPERTISE", "DEPLACEMENT", "DOCUMENT_HUISSIER", "ACTION_HUISSIER", "AUDIENCE"
    
    @Column(nullable = false)
    private String typeElement;  // Ex: "Ouverture de dossier", "Enquête Précontentieuse", "Expertise", "Signification"
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal coutUnitaire;
    
    @Column(nullable = false)
    private Integer quantite = 1;
    
    @Column(nullable = false, precision = 19, scale = 2)
    private BigDecimal montantTotal;  // Calculé : coutUnitaire × quantite
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatutTarif statut = StatutTarif.EN_ATTENTE_VALIDATION;
    
    @Column(nullable = false)
    private LocalDateTime dateCreation;
    
    @Column
    private LocalDateTime dateValidation;
    
    @Column(length = 1000)
    private String commentaire;
    
    // Relations optionnelles vers les traitements spécifiques
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_huissier_id")
    private DocumentHuissier documentHuissier;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_huissier_id")
    private ActionHuissier actionHuissier;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "audience_id")
    private Audience audience;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "action_amiable_id")
    private ActionAmiable actionAmiable;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "enquete_id")
    private Enquete enquete;
    
    // Getters, setters, constructeurs...
}
```

3. **Créer l'enum `StatutValidationTarifs`** :
```java
public enum StatutValidationTarifs {
    EN_COURS,                    // Validation en cours
    TARIFS_CREATION_VALIDES,     // Tarifs de création validés
    TARIFS_ENQUETE_VALIDES,      // Tarifs d'enquête validés
    TARIFS_AMIABLE_VALIDES,      // Tarifs amiable validés
    TARIFS_JURIDIQUE_VALIDES,    // Tarifs juridique validés
    TOUS_TARIFS_VALIDES,         // Tous les tarifs validés, prêt pour facturation
    FACTURE_GENEREE              // Facture générée
}
```

4. **Modifier l'entité `Finance`** :
```java
@Entity
@Table(name = "finance")
public class Finance {
    // ... champs existants ...
    
    @Enumerated(EnumType.STRING)
    @Column(name = "statut_validation_tarifs")
    private StatutValidationTarifs statutValidationTarifs = StatutValidationTarifs.EN_COURS;
    
    @OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<TarifDossier> tarifs = new ArrayList<>();
    
    // ... autres champs ...
}
```

5. **Créer le Repository `TarifDossierRepository`** :
```java
@Repository
public interface TarifDossierRepository extends JpaRepository<TarifDossier, Long> {
    List<TarifDossier> findByDossierId(Long dossierId);
    List<TarifDossier> findByDossierIdAndPhase(Long dossierId, PhaseFrais phase);
    List<TarifDossier> findByDossierIdAndStatut(Long dossierId, StatutTarif statut);
    long countByDossierIdAndPhaseAndStatut(Long dossierId, PhaseFrais phase, StatutTarif statut);
    Optional<TarifDossier> findByDossierIdAndPhaseAndCategorie(Long dossierId, PhaseFrais phase, String categorie);
}
```

---

## 🎯 Prompt 2 : Endpoint GET /api/finances/dossier/{dossierId}/traitements

### Contexte
Le frontend appelle cet endpoint pour récupérer tous les traitements d'un dossier organisés par phase. Les montants par défaut selon l'annexe doivent être inclus.

### Exigences

**Endpoint** : `GET /api/finances/dossier/{dossierId}/traitements`

**Response DTO** : `TraitementsDossierDTO`

**Logique détaillée** :

1. **Phase CREATION** :
   - **Toujours retourner** un traitement "OUVERTURE_DOSSIER"
   - Frais fixe : **250 TND** (selon annexe)
   - Si un tarif existe pour cette phase et catégorie, utiliser son statut
   - Sinon, statut : `EN_ATTENTE_TARIF`
   - **IMPORTANT** : Si l'enquête n'existe pas encore, créer automatiquement le tarif avec statut `VALIDE` (car c'est un frais fixe obligatoire)

2. **Phase ENQUETE** :
   - **Si le dossier a une enquête** :
     - Retourner `enquetePrecontentieuse` avec :
       - `type` : "ENQUETE_PRECONTENTIEUSE"
       - `date` : Date de l'enquête
       - `fraisFixe` : **300 TND** (selon annexe)
       - `tarifExistant` : TarifDossier existant (null si pas encore créé)
       - `statut` : Statut du tarif ou `EN_ATTENTE_TARIF` si pas de tarif
     - **IMPORTANT** : Si le tarif n'existe pas encore, le créer automatiquement avec statut `VALIDE` (car c'est un frais fixe obligatoire)
   - Retourner `traitementsPossibles` : Liste des traitements optionnels :
     - `{ type: "EXPERTISE", libelle: "Expertise", tarifExistant: null, statut: "EN_ATTENTE_TARIF" }`
     - `{ type: "DEPLACEMENT", libelle: "Déplacement", tarifExistant: null, statut: "EN_ATTENTE_TARIF" }`
     - `{ type: "AUTRES", libelle: "Autres traitements", tarifExistant: null, statut: "EN_ATTENTE_TARIF" }`
   - **Si le dossier n'a pas d'enquête** : Retourner `phaseEnquete: null`

3. **Phase AMIABLE** :
   - Retourner toutes les actions amiables du dossier avec :
     - `id` : ID de l'action
     - `type` : Type d'action (APPEL_TELEPHONIQUE, EMAIL, LETTRE, etc.)
     - `date` : Date de l'action
     - `occurrences` : Nombre d'occurrences
     - `coutUnitaire` : Coût unitaire du tarif existant (null si pas encore saisi)
     - `tarifExistant` : TarifDossier existant (null si pas encore créé)
     - `statut` : Statut du tarif ou `EN_ATTENTE_TARIF` si pas de tarif

4. **Phase JURIDIQUE** :
   - **Documents Huissier** : Tous les documents avec :
     - `id` : ID du document
     - `type` : Type de document
     - `date` : Date du document
     - `coutUnitaire` : Coût unitaire du tarif existant (null si pas encore saisi)
     - `tarifExistant` : TarifDossier existant (null si pas encore créé)
     - `statut` : Statut du tarif ou `EN_ATTENTE_TARIF` si pas de tarif
   - **Actions Huissier** : Toutes les actions avec les mêmes champs
   - **Audiences** : Toutes les audiences avec :
     - `id` : ID de l'audience
     - `date` : Date de l'audience
     - `type` : Type d'audience
     - `avocatId` : ID de l'avocat
     - `avocatNom` : Nom de l'avocat
     - `coutAudience` : Coût de l'audience (du tarif existant)
     - `coutAvocat` : Coût de l'avocat (du tarif existant)
     - `tarifAudience` : TarifDossier pour l'audience
     - `tarifAvocat` : TarifDossier pour l'avocat
     - `statut` : Statut des tarifs

**Code Java suggéré** :
```java
@GetMapping("/dossier/{dossierId}/traitements")
public ResponseEntity<TraitementsDossierDTO> getTraitementsDossier(@PathVariable Long dossierId) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new ResourceNotFoundException("Dossier non trouvé"));
    
    TraitementsDossierDTO dto = new TraitementsDossierDTO();
    
    // Phase CREATION
    PhaseCreationDTO phaseCreation = new PhaseCreationDTO();
    TraitementDTO traitementCreation = new TraitementDTO();
    traitementCreation.setType("OUVERTURE_DOSSIER");
    traitementCreation.setDate(dossier.getDateCreation());
    traitementCreation.setFraisFixe(new BigDecimal("250.00"));
    
    Optional<TarifDossier> tarifCreation = tarifDossierRepository
        .findByDossierIdAndPhaseAndCategorie(dossierId, PhaseFrais.CREATION, "OUVERTURE_DOSSIER");
    
    if (tarifCreation.isPresent()) {
        traitementCreation.setTarifExistant(mapToTarifDTO(tarifCreation.get()));
        traitementCreation.setStatut(tarifCreation.get().getStatut().name());
    } else {
        // Créer automatiquement le tarif avec statut VALIDE
        TarifDossier nouveauTarif = new TarifDossier();
        nouveauTarif.setDossier(dossier);
        nouveauTarif.setPhase(PhaseFrais.CREATION);
        nouveauTarif.setCategorie("OUVERTURE_DOSSIER");
        nouveauTarif.setTypeElement("Ouverture de dossier");
        nouveauTarif.setCoutUnitaire(new BigDecimal("250.00"));
        nouveauTarif.setQuantite(1);
        nouveauTarif.setMontantTotal(new BigDecimal("250.00"));
        nouveauTarif.setStatut(StatutTarif.VALIDE);  // Automatiquement validé
        nouveauTarif.setDateCreation(LocalDateTime.now());
        nouveauTarif.setDateValidation(LocalDateTime.now());
        nouveauTarif.setCommentaire("Frais fixe selon annexe - Validation automatique");
        tarifDossierRepository.save(nouveauTarif);
        
        traitementCreation.setTarifExistant(mapToTarifDTO(nouveauTarif));
        traitementCreation.setStatut(StatutTarif.VALIDE.name());
    }
    
    phaseCreation.setTraitements(List.of(traitementCreation));
    dto.setPhaseCreation(phaseCreation);
    
    // Phase ENQUETE
    Optional<Enquete> enqueteOpt = enqueteRepository.findByDossierId(dossierId);
    if (enqueteOpt.isPresent()) {
        Enquete enquete = enqueteOpt.get();
        PhaseEnqueteDTO phaseEnquete = new PhaseEnqueteDTO();
        
        // Enquête précontentieuse (obligatoire)
        TraitementDTO enquetePrecontentieuse = new TraitementDTO();
        enquetePrecontentieuse.setType("ENQUETE_PRECONTENTIEUSE");
        enquetePrecontentieuse.setDate(enquete.getDateEnquete() != null ? enquete.getDateEnquete() : enquete.getDateCreation());
        enquetePrecontentieuse.setFraisFixe(new BigDecimal("300.00"));
        
        Optional<TarifDossier> tarifEnquete = tarifDossierRepository
            .findByDossierIdAndPhaseAndCategorie(dossierId, PhaseFrais.ENQUETE, "ENQUETE_PRECONTENTIEUSE");
        
        if (tarifEnquete.isPresent()) {
            enquetePrecontentieuse.setTarifExistant(mapToTarifDTO(tarifEnquete.get()));
            enquetePrecontentieuse.setStatut(tarifEnquete.get().getStatut().name());
        } else {
            // Créer automatiquement le tarif avec statut VALIDE
            TarifDossier nouveauTarif = new TarifDossier();
            nouveauTarif.setDossier(dossier);
            nouveauTarif.setPhase(PhaseFrais.ENQUETE);
            nouveauTarif.setCategorie("ENQUETE_PRECONTENTIEUSE");
            nouveauTarif.setTypeElement("Enquête Précontentieuse");
            nouveauTarif.setCoutUnitaire(new BigDecimal("300.00"));
            nouveauTarif.setQuantite(1);
            nouveauTarif.setMontantTotal(new BigDecimal("300.00"));
            nouveauTarif.setStatut(StatutTarif.VALIDE);  // Automatiquement validé
            nouveauTarif.setDateCreation(LocalDateTime.now());
            nouveauTarif.setDateValidation(LocalDateTime.now());
            nouveauTarif.setCommentaire("Frais fixe selon annexe - Validation automatique");
            nouveauTarif.setEnquete(enquete);
            tarifDossierRepository.save(nouveauTarif);
            
            enquetePrecontentieuse.setTarifExistant(mapToTarifDTO(nouveauTarif));
            enquetePrecontentieuse.setStatut(StatutTarif.VALIDE.name());
        }
        
        phaseEnquete.setEnquetePrecontentieuse(enquetePrecontentieuse);
        
        // Traitements possibles (optionnels)
        List<TraitementPossibleDTO> traitementsPossibles = Arrays.asList(
            createTraitementPossible("EXPERTISE", "Expertise", dossierId),
            createTraitementPossible("DEPLACEMENT", "Déplacement", dossierId),
            createTraitementPossible("AUTRES", "Autres traitements", dossierId)
        );
        phaseEnquete.setTraitementsPossibles(traitementsPossibles);
        
        dto.setPhaseEnquete(phaseEnquete);
    }
    
    // Phase AMIABLE
    PhaseAmiableDTO phaseAmiable = new PhaseAmiableDTO();
    List<ActionAmiable> actions = actionAmiableRepository.findByDossierId(dossierId);
    List<ActionAmiableDTO> actionsDTO = actions.stream().map(action -> {
        ActionAmiableDTO dto = new ActionAmiableDTO();
        dto.setId(action.getId());
        dto.setType(action.getType().name());
        dto.setDate(action.getDateAction());
        dto.setOccurrences(action.getOccurrences());
        
        Optional<TarifDossier> tarif = tarifDossierRepository
            .findByDossierIdAndActionAmiableId(dossierId, action.getId());
        
        if (tarif.isPresent()) {
            dto.setCoutUnitaire(tarif.get().getCoutUnitaire());
            dto.setTarifExistant(mapToTarifDTO(tarif.get()));
            dto.setStatut(tarif.get().getStatut().name());
        } else {
            dto.setStatut("EN_ATTENTE_TARIF");
        }
        
        return dto;
    }).collect(Collectors.toList());
    
    phaseAmiable.setActions(actionsDTO);
    dto.setPhaseAmiable(phaseAmiable);
    
    // Phase JURIDIQUE (similaire pour documents, actions, audiences)
    // ... (code similaire)
    
    return ResponseEntity.ok(dto);
}
```

---

## 🎯 Prompt 3 : Endpoint POST /api/finances/dossier/{dossierId}/tarifs

### Contexte
Le chef financier ajoute un nouveau tarif pour un traitement spécifique.

### Exigences

**Endpoint** : `POST /api/finances/dossier/{dossierId}/tarifs`

**Request Body** : `TarifDossierRequest`
```json
{
  "phase": "ENQUETE",
  "categorie": "EXPERTISE",
  "typeElement": "Expertise",
  "coutUnitaire": 150.00,
  "quantite": 1,
  "commentaire": "Expertise effectuée"
}
```

**Response** : `TarifDossierDTO`

**Logique** :
1. Vérifier que le dossier existe
2. Créer un nouveau `TarifDossier` avec :
   - `statut` : `EN_ATTENTE_VALIDATION`
   - `montantTotal` : `coutUnitaire × quantite`
   - `dateCreation` : maintenant
3. Si `categorie` correspond à un traitement existant (document, action, audience), lier le tarif
4. Retourner le tarif créé

---

## 🎯 Prompt 4 : Endpoints Validation/Rejet de Tarifs

### Contexte
Le chef financier valide ou rejette un tarif.

### Exigences

**Endpoint Validation** : `POST /api/finances/tarifs/{tarifId}/valider`
- Request Body (optionnel) : `{ "commentaire": "..." }`
- Logique :
  1. Récupérer le tarif
  2. Vérifier qu'il est en `EN_ATTENTE_VALIDATION`
  3. Mettre à jour : `statut = VALIDE`, `dateValidation = maintenant`
  4. Mettre à jour le `statutValidationTarifs` du Finance si nécessaire
  5. Retourner le tarif mis à jour

**Endpoint Rejet** : `POST /api/finances/tarifs/{tarifId}/rejeter`
- Request Body : `{ "commentaire": "Motif du rejet" }` (obligatoire)
- Logique :
  1. Récupérer le tarif
  2. Vérifier qu'il est en `EN_ATTENTE_VALIDATION`
  3. Mettre à jour : `statut = REJETE`, `dateValidation = maintenant`, `commentaire = commentaire fourni`
  4. Retourner le tarif mis à jour

---

## 🎯 Prompt 5 : Endpoint GET /api/finances/dossier/{dossierId}/validation-etat

### Contexte
Le frontend a besoin de connaître l'état global de validation des tarifs pour activer/désactiver le bouton "Générer Facture".

### Exigences

**Endpoint** : `GET /api/finances/dossier/{dossierId}/validation-etat`

**Response** : `ValidationEtatDTO`
```json
{
  "dossierId": 42,
  "statutGlobal": "TARIFS_ENQUETE_VALIDES",
  "phases": {
    "CREATION": {
      "statut": "VALIDE",
      "tarifsTotal": 1,
      "tarifsValides": 1
    },
    "ENQUETE": {
      "statut": "VALIDE",
      "tarifsTotal": 1,
      "tarifsValides": 1
    },
    "AMIABLE": {
      "statut": "EN_ATTENTE_VALIDATION",
      "tarifsTotal": 3,
      "tarifsValides": 1
    },
    "JURIDIQUE": {
      "statut": "EN_ATTENTE_VALIDATION",
      "tarifsTotal": 5,
      "tarifsValides": 2
    }
  },
  "peutGenererFacture": false
}
```

**Logique** :
1. Pour chaque phase, compter les tarifs totaux et validés
2. Déterminer le statut global selon les règles :
   - Si tous les tarifs de CREATION sont validés → `TARIFS_CREATION_VALIDES`
   - Si tous les tarifs de ENQUETE sont validés → `TARIFS_ENQUETE_VALIDES`
   - etc.
3. `peutGenererFacture = true` si `statutGlobal == TOUS_TARIFS_VALIDES`

---

## 🎯 Prompt 6 : Endpoint GET /api/finances/dossier/{dossierId}/detail-facture (AMÉLIORATION)

### Contexte
Le frontend affiche le détail de la facture. **Les frais d'enquête (300 TND) doivent être inclus dans le calcul du total**.

### Exigences

**Endpoint** : `GET /api/finances/dossier/{dossierId}/detail-facture`

**Response** : `DetailFactureDTO`

**Logique de calcul** :
1. **Frais création** : Somme des tarifs validés de phase CREATION
2. **Frais enquête** : **Somme des tarifs validés de phase ENQUETE** (incluant le 300 TND fixe)
3. **Frais amiable** : Somme des tarifs validés de phase AMIABLE
4. **Frais juridique** : Somme des tarifs validés de phase JURIDIQUE (documents + actions + audiences + avocat)
5. **Commissions** : Calculées selon les pourcentages de l'annexe
6. **Total HT** : Somme de tous les frais + commissions
7. **TVA** : Total HT × 0.19
8. **Total TTC** : Total HT + TVA

**Code Java suggéré** :
```java
@GetMapping("/dossier/{dossierId}/detail-facture")
public ResponseEntity<DetailFactureDTO> getDetailFacture(@PathVariable Long dossierId) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new ResourceNotFoundException("Dossier non trouvé"));
    
    Finance finance = financeRepository.findByDossierId(dossierId)
        .orElseThrow(() -> new ResourceNotFoundException("Finance non trouvé"));
    
    DetailFactureDTO dto = new DetailFactureDTO();
    
    // Frais création
    List<TarifDossier> tarifsCreation = tarifDossierRepository
        .findByDossierIdAndPhase(dossierId, PhaseFrais.CREATION)
        .stream()
        .filter(t -> t.getStatut() == StatutTarif.VALIDE)
        .collect(Collectors.toList());
    BigDecimal fraisCreation = tarifsCreation.stream()
        .map(TarifDossier::getMontantTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    dto.setFraisCreationDossier(fraisCreation);
    
    // Frais enquête (IMPORTANT : inclure le 300 TND fixe)
    List<TarifDossier> tarifsEnquete = tarifDossierRepository
        .findByDossierIdAndPhase(dossierId, PhaseFrais.ENQUETE)
        .stream()
        .filter(t -> t.getStatut() == StatutTarif.VALIDE)
        .collect(Collectors.toList());
    BigDecimal fraisEnquete = tarifsEnquete.stream()
        .map(TarifDossier::getMontantTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    dto.setFraisEnquete(fraisEnquete);  // Nouveau champ dans DetailFactureDTO
    
    // Frais amiable
    List<TarifDossier> tarifsAmiable = tarifDossierRepository
        .findByDossierIdAndPhase(dossierId, PhaseFrais.AMIABLE)
        .stream()
        .filter(t -> t.getStatut() == StatutTarif.VALIDE)
        .collect(Collectors.toList());
    BigDecimal fraisAmiable = tarifsAmiable.stream()
        .map(TarifDossier::getMontantTotal)
        .reduce(BigDecimal.ZERO, BigDecimal::add);
    dto.setCoutActionsAmiable(fraisAmiable);
    
    // Frais juridique (documents + actions + audiences + avocat)
    // ... (code similaire)
    
    // Calcul du total
    BigDecimal totalHT = fraisCreation
        .add(fraisEnquete)  // INCLURE LES FRAIS D'ENQUÊTE
        .add(fraisAmiable)
        .add(fraisJuridique)
        .add(commissionsAmiable)
        .add(commissionsJuridique);
    
    BigDecimal tva = totalHT.multiply(new BigDecimal("0.19"));
    BigDecimal totalTTC = totalHT.add(tva);
    
    dto.setTotalFacture(totalTTC);
    
    return ResponseEntity.ok(dto);
}
```

**IMPORTANT** : Ajouter le champ `fraisEnquete` dans `DetailFactureDTO` :
```java
public class DetailFactureDTO {
    private BigDecimal fraisCreationDossier;
    private BigDecimal fraisEnquete;  // NOUVEAU CHAMP
    private BigDecimal coutGestionTotal;
    private BigDecimal coutActionsAmiable;
    // ... autres champs ...
    private BigDecimal totalFacture;
}
```

---

## 🎯 Prompt 7 : Endpoint POST /api/finances/dossier/{dossierId}/generer-facture

### Contexte
Le chef financier génère la facture une fois tous les tarifs validés.

### Exigences

**Endpoint** : `POST /api/finances/dossier/{dossierId}/generer-facture`

**Logique** :
1. Vérifier que `peutGenererFacture == true` (via l'endpoint validation-etat)
2. Calculer tous les montants (comme dans detail-facture)
3. Créer une nouvelle `Facture` avec :
   - `numeroFacture` : Généré automatiquement (ex: "FAC-2025-001")
   - `dossierId` : ID du dossier
   - `montantHT` : Total HT
   - `montantTTC` : Total TTC
   - `tva` : TVA
   - `statut` : `EMISE`
   - `dateEmission` : maintenant
4. Mettre à jour `Finance.statutValidationTarifs = FACTURE_GENEREE`
5. Retourner la facture créée

---

## 📝 Résumé des Changements Backend Nécessaires

1. ✅ Créer `TarifDossier` entity et `StatutTarif` enum
2. ✅ Créer `StatutValidationTarifs` enum
3. ✅ Modifier `Finance` entity pour ajouter `statutValidationTarifs` et relation `tarifs`
4. ✅ Créer `TarifDossierRepository`
5. ✅ Implémenter `GET /api/finances/dossier/{dossierId}/traitements` avec création automatique des tarifs fixes (250 TND création, 300 TND enquête) avec statut `VALIDE`
6. ✅ Implémenter `POST /api/finances/dossier/{dossierId}/tarifs`
7. ✅ Implémenter `POST /api/finances/tarifs/{tarifId}/valider`
8. ✅ Implémenter `POST /api/finances/tarifs/{tarifId}/rejeter`
9. ✅ Implémenter `GET /api/finances/dossier/{dossierId}/validation-etat`
10. ✅ **Modifier `GET /api/finances/dossier/{dossierId}/detail-facture` pour inclure les frais d'enquête dans le calcul du total**
11. ✅ Implémenter `POST /api/finances/dossier/{dossierId}/generer-facture`

---

## ⚠️ Points d'Attention

1. **Validation automatique des frais fixes** : Les frais de création (250 TND) et d'enquête (300 TND) doivent être **automatiquement créés et validés** lors de la première récupération des traitements.

2. **Cohérence des montants** : Tous les montants doivent être en `BigDecimal` avec précision 19,2.

3. **Gestion des dates** : Utiliser `LocalDateTime` pour les dates de création/validation.

4. **Relations optionnelles** : Les relations vers document/action/audience/enquête dans `TarifDossier` sont optionnelles (nullable).

5. **Calcul du total facture** : **IMPORTANT** - Ne pas oublier d'inclure les frais d'enquête dans le calcul du total.


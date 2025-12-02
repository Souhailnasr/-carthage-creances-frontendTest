# 📋 Prompt Backend : Finalisation du Dossier Juridique

## 🎯 Objectif

Permettre au chef juridique de finaliser un dossier après les audiences en indiquant :
- L'état final du dossier (Recouvrement Total, Recouvrement Partiel, Non Recouvré)
- Le montant recouvré dans cette étape juridique

---

## 📝 PROMPT 1 : Créer l'Enum EtatFinalDossierJuridique

**Créer** : `src/main/java/com/yourpackage/enums/EtatFinalDossierJuridique.java`

```java
package com.yourpackage.enums;

public enum EtatFinalDossierJuridique {
    RECOUVREMENT_TOTAL,
    RECOUVREMENT_PARTIEL,
    NON_RECOUVRE
}
```

---

## 📝 PROMPT 2 : Ajouter les Champs dans l'Entité Dossier

**Modifier** : `src/main/java/com/yourpackage/entities/Dossier.java`

Ajoutez ces champs :

```java
@Column(name = "etat_final_juridique")
@Enumerated(EnumType.STRING)
private EtatFinalDossierJuridique etatFinalJuridique;

@Column(name = "montant_recouvre_juridique")
private BigDecimal montantRecouvreJuridique;

@Column(name = "date_finalisation_juridique")
private LocalDateTime dateFinalisationJuridique;
```

---

## 📝 PROMPT 3 : Créer le DTO de Finalisation

**Créer** : `src/main/java/com/yourpackage/dto/FinalisationDossierJuridiqueDTO.java`

```java
package com.yourpackage.dto;

import com.yourpackage.enums.EtatFinalDossierJuridique;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;

public class FinalisationDossierJuridiqueDTO {
    @NotNull(message = "L'état final est obligatoire")
    private EtatFinalDossierJuridique etatFinal;
    
    @NotNull(message = "Le montant recouvré est obligatoire")
    @Min(value = 0, message = "Le montant recouvré doit être positif")
    private BigDecimal montantRecouvre;

    // Getters and Setters
    public EtatFinalDossierJuridique getEtatFinal() {
        return etatFinal;
    }

    public void setEtatFinal(EtatFinalDossierJuridique etatFinal) {
        this.etatFinal = etatFinal;
    }

    public BigDecimal getMontantRecouvre() {
        return montantRecouvre;
    }

    public void setMontantRecouvre(BigDecimal montantRecouvre) {
        this.montantRecouvre = montantRecouvre;
    }
}
```

---

## 📝 PROMPT 4 : Ajouter la Méthode dans le Service

**Modifier** : `src/main/java/com/yourpackage/services/DossierService.java`

```java
/**
 * Finalise un dossier juridique avec l'état final et le montant recouvré
 * 
 * @param dossierId L'ID du dossier
 * @param dto Le DTO contenant l'état final et le montant recouvré
 * @return Le dossier mis à jour
 * @throws EntityNotFoundException Si le dossier n'existe pas
 * @throws IllegalStateException Si le dossier n'a pas d'audiences
 */
Dossier finaliserDossierJuridique(Long dossierId, FinalisationDossierJuridiqueDTO dto);
```

---

## 📝 PROMPT 5 : Implémenter la Méthode dans le ServiceImpl

**Modifier** : `src/main/java/com/yourpackage/services/impl/DossierServiceImpl.java`

```java
@Override
@Transactional
public Dossier finaliserDossierJuridique(Long dossierId, FinalisationDossierJuridiqueDTO dto) {
    // 1. Vérifier que le dossier existe
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé avec l'ID: " + dossierId));
    
    // 2. Vérifier que le dossier est en recouvrement juridique
    if (dossier.getTypeRecouvrement() != TypeRecouvrement.JURIDIQUE) {
        throw new IllegalStateException("Ce dossier n'est pas en recouvrement juridique");
    }
    
    // 3. Vérifier que le dossier a au moins une audience
    List<Audience> audiences = audienceRepository.findByDossierId(dossierId);
    if (audiences.isEmpty()) {
        throw new IllegalStateException("Le dossier doit avoir au moins une audience pour être finalisé");
    }
    
    // 4. Validation du montant selon l'état
    BigDecimal montantCreance = dossier.getMontantCreance();
    BigDecimal montantRecouvre = dto.getMontantRecouvre();
    
    if (dto.getEtatFinal() == EtatFinalDossierJuridique.RECOUVREMENT_TOTAL) {
        // Pour un recouvrement total, le montant recouvré doit être égal au montant de la créance
        if (montantRecouvre.compareTo(montantCreance) != 0) {
            log.warn("Recouvrement total: montant recouvré ({}) différent du montant créance ({})", 
                montantRecouvre, montantCreance);
        }
    } else if (dto.getEtatFinal() == EtatFinalDossierJuridique.RECOUVREMENT_PARTIEL) {
        // Pour un recouvrement partiel, le montant recouvré doit être inférieur au montant de la créance
        if (montantRecouvre.compareTo(montantCreance) >= 0) {
            throw new IllegalArgumentException(
                "Pour un recouvrement partiel, le montant recouvré doit être inférieur au montant de la créance");
        }
    } else if (dto.getEtatFinal() == EtatFinalDossierJuridique.NON_RECOUVRE) {
        // Pour un non recouvré, le montant recouvré devrait être 0 (mais on accepte d'autres valeurs si nécessaire)
        if (montantRecouvre.compareTo(BigDecimal.ZERO) > 0) {
            log.warn("Non recouvré: un montant recouvré ({}) a été saisi", montantRecouvre);
        }
    }
    
    // 5. Mettre à jour le dossier
    dossier.setEtatFinalJuridique(dto.getEtatFinal());
    dossier.setMontantRecouvreJuridique(montantRecouvre);
    dossier.setDateFinalisationJuridique(LocalDateTime.now());
    
    // 6. Mettre à jour le montant recouvré global du dossier
    // (additionner avec le montant recouvré amiable si existant)
    BigDecimal montantRecouvreAmiable = dossier.getMontantRecouvreAmiable() != null 
        ? dossier.getMontantRecouvreAmiable() 
        : BigDecimal.ZERO;
    BigDecimal montantRecouvreTotal = montantRecouvreAmiable.add(montantRecouvre);
    dossier.setMontantRecouvre(montantRecouvreTotal);
    
    // 7. Sauvegarder
    Dossier dossierSauvegarde = dossierRepository.save(dossier);
    
    // 8. Créer une notification pour le chef financier
    notificationService.createNotification(
        "Dossier juridique finalisé",
        String.format("Le dossier %s a été finalisé avec l'état: %s. Montant recouvré: %s TND",
            dossier.getNumeroDossier(),
            dto.getEtatFinal(),
            montantRecouvre),
        NotificationType.DOSSIER_FINALISE,
        dossier.getId()
    );
    
    log.info("✅ Dossier juridique finalisé: ID={}, État={}, Montant={}", 
        dossierId, dto.getEtatFinal(), montantRecouvre);
    
    return dossierSauvegarde;
}
```

---

## 📝 PROMPT 6 : Créer l'Endpoint dans le Controller

**Modifier** : `src/main/java/com/yourpackage/controllers/DossierController.java`

```java
/**
 * Finalise un dossier juridique
 * PUT /api/dossiers/{dossierId}/juridique/finaliser
 * 
 * @param dossierId L'ID du dossier
 * @param dto Le DTO de finalisation
 * @return Le dossier mis à jour
 */
@PutMapping("/{dossierId}/juridique/finaliser")
@PreAuthorize("hasRole('CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE')")
public ResponseEntity<DossierDTO> finaliserDossierJuridique(
        @PathVariable Long dossierId,
        @Valid @RequestBody FinalisationDossierJuridiqueDTO dto) {
    try {
        Dossier dossier = dossierService.finaliserDossierJuridique(dossierId, dto);
        DossierDTO dossierDTO = dossierMapper.toDTO(dossier);
        return ResponseEntity.ok(dossierDTO);
    } catch (EntityNotFoundException e) {
        return ResponseEntity.notFound().build();
    } catch (IllegalStateException | IllegalArgumentException e) {
        return ResponseEntity.badRequest()
            .body(null); // Ou retourner un DTO d'erreur
    } catch (Exception e) {
        log.error("Erreur lors de la finalisation du dossier juridique", e);
        return ResponseEntity.internalServerError().build();
    }
}
```

---

## 📝 PROMPT 7 : Mettre à Jour le Mapper

**Modifier** : `src/main/java/com/yourpackage/mappers/DossierMapper.java`

Ajoutez le mapping pour les nouveaux champs :

```java
@Mapping(target = "etatFinalJuridique", source = "etatFinalJuridique")
@Mapping(target = "montantRecouvreJuridique", source = "montantRecouvreJuridique")
@Mapping(target = "dateFinalisationJuridique", source = "dateFinalisationJuridique")
DossierDTO toDTO(Dossier dossier);
```

---

## 📝 PROMPT 8 : Migration de Base de Données

**Créer** : `src/main/resources/db/migration/VXXX__add_finalisation_juridique_to_dossier.sql`

```sql
-- Ajouter les colonnes pour la finalisation juridique
ALTER TABLE dossier 
ADD COLUMN etat_final_juridique VARCHAR(50),
ADD COLUMN montant_recouvre_juridique DECIMAL(19, 2),
ADD COLUMN date_finalisation_juridique TIMESTAMP;

-- Ajouter un index pour les recherches
CREATE INDEX idx_dossier_etat_final_juridique ON dossier(etat_final_juridique);
```

---

## ✅ Checklist d'Implémentation

### Backend
- [ ] Enum `EtatFinalDossierJuridique` créé
- [ ] Champs ajoutés dans l'entité `Dossier`
- [ ] DTO `FinalisationDossierJuridiqueDTO` créé
- [ ] Méthode `finaliserDossierJuridique()` ajoutée dans le service
- [ ] Implémentation complète avec validations
- [ ] Endpoint `PUT /api/dossiers/{dossierId}/juridique/finaliser` créé
- [ ] Mapper mis à jour
- [ ] Migration de base de données créée
- [ ] Tests unitaires créés
- [ ] Tests d'intégration créés

### Frontend
- [x] Enum `EtatFinalDossierJuridique` créé
- [x] Formulaire de finalisation ajouté
- [x] Méthode `finaliserDossierJuridique()` ajoutée dans le service
- [x] UI complète avec 3 boutons pour les états
- [x] Validation du montant selon l'état
- [x] Styles CSS ajoutés

---

## 🎯 Règles de Validation

1. **Recouvrement Total** :
   - Le montant recouvré devrait être égal au montant de la créance
   - Avertissement si différent (mais accepté)

2. **Recouvrement Partiel** :
   - Le montant recouvré doit être strictement inférieur au montant de la créance
   - Erreur si supérieur ou égal

3. **Non Recouvré** :
   - Le montant recouvré devrait être 0
   - Avertissement si différent (mais accepté)

4. **Prérequis** :
   - Le dossier doit être en recouvrement juridique
   - Le dossier doit avoir au moins une audience

---

## 📋 Exemple de Requête

```http
PUT /api/dossiers/123/juridique/finaliser
Content-Type: application/json
Authorization: Bearer {token}

{
  "etatFinal": "RECOUVREMENT_PARTIEL",
  "montantRecouvre": 5000.00
}
```

---

## 📋 Exemple de Réponse

```json
{
  "id": 123,
  "numeroDossier": "DOS-2024-001",
  "etatFinalJuridique": "RECOUVREMENT_PARTIEL",
  "montantRecouvreJuridique": 5000.00,
  "dateFinalisationJuridique": "2024-12-01T10:30:00",
  "montantRecouvre": 5000.00,
  ...
}
```

---

**Tous les prompts nécessaires pour implémenter cette fonctionnalité ! 🎉**


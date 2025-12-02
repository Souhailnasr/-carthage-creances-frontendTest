# ✅ Confirmation - Approche Hybride pour Coûts Unitaires

## 📋 Décision

**Approche retenue** : **Approche Hybride (Recommandée)**

Les coûts unitaires peuvent être saisis à deux endroits :
1. **Lors de la création d'une action amiable** (par l'agent)
2. **Dans l'interface de validation des tarifs** (par le chef financier)

## ✅ Backend - Correction Appliquée

### Endpoint : `GET /api/finances/dossier/{dossierId}/traitements`

**Fichier** : `TarifDossierServiceImpl.java` (méthode `getTraitementsDossier`)

**Logique de priorité implémentée** :

```java
List<ActionAmiableDTO> actionsDTO = actions.stream().map(action -> {
    ActionAmiableDTO dto = new ActionAmiableDTO();
    dto.setId(action.getId());
    dto.setType(action.getType().name());
    dto.setDate(action.getDateAction());
    dto.setOccurrences(action.getOccurrences());
    
    Optional<TarifDossier> tarif = tarifDossierRepository
        .findByDossierIdAndActionAmiableId(dossierId, action.getId());
    
    if (tarif.isPresent()) {
        // ✅ Priorité 1 : Coût unitaire du tarif (BigDecimal)
        dto.setCoutUnitaire(tarif.get().getCoutUnitaire());
        dto.setTarifExistant(mapToTarifDTO(tarif.get()));
        dto.setStatut(tarif.get().getStatut().name());
    } else if (action.getCoutUnitaire() != null && action.getCoutUnitaire() > 0) {
        // ✅ Priorité 2 : Coût unitaire de l'action (Double -> BigDecimal)
        dto.setCoutUnitaire(BigDecimal.valueOf(action.getCoutUnitaire()));
        dto.setStatut("EN_ATTENTE_TARIF");
    } else {
        // ✅ Pas de coût unitaire : le chef devra le saisir
        dto.setStatut("EN_ATTENTE_TARIF");
    }
    
    return dto;
}).collect(Collectors.toList());
```

### Conversion de Types

- **Action.coutUnitaire** : `Double` (dans l'entité)
- **ActionAmiableTraitementDTO.coutUnitaire** : `BigDecimal` (dans le DTO)
- **Conversion** : `BigDecimal.valueOf(action.getCoutUnitaire())`

## ✅ Frontend - Gestion de la Conversion

### 1. `finance.service.ts`

Le service convertit `BigDecimal` (string ou number) en `number` JavaScript :

```typescript
if (traitements.phaseAmiable?.actions) {
  traitements.phaseAmiable.actions = traitements.phaseAmiable.actions.map(a => {
    // Le backend retourne coutUnitaire selon la priorité (BigDecimal)
    // Conversion BigDecimal -> number JavaScript
    if (a.coutUnitaire != null) {
      a.coutUnitaire = typeof a.coutUnitaire === 'string' 
        ? parseFloat(a.coutUnitaire) 
        : Number(a.coutUnitaire);
    } else if (a.tarifExistant?.coutUnitaire) {
      // Fallback : utiliser celui du tarif
      a.coutUnitaire = typeof a.tarifExistant.coutUnitaire === 'string' 
        ? parseFloat(a.tarifExistant.coutUnitaire) 
        : Number(a.tarifExistant.coutUnitaire);
    }
    return {
      ...a,
      date: typeof a.date === 'string' ? new Date(a.date) : a.date
    };
  });
}
```

### 2. `validation-tarifs-amiable.component.ts`

Le composant pré-remplit les coûts unitaires selon la priorité du backend :

```typescript
ngOnInit(): void {
  if (this.traitements) {
    this.actionsAmiables = (this.traitements.actions || []).map(action => {
      // Le backend retourne déjà coutUnitaire selon la priorité
      // On s'assure juste que le type est correct pour l'affichage
      if (action.coutUnitaire != null) {
        action.coutUnitaire = typeof action.coutUnitaire === 'string' 
          ? parseFloat(action.coutUnitaire) 
          : Number(action.coutUnitaire);
      } else if (action.tarifExistant?.coutUnitaire) {
        action.coutUnitaire = typeof action.tarifExistant.coutUnitaire === 'string'
          ? parseFloat(action.tarifExistant.coutUnitaire)
          : Number(action.tarifExistant.coutUnitaire);
      }
      return action;
    });
  }
}
```

## 🎯 Workflow Complet

### Scénario 1 : Action créée avec coût unitaire, pas encore de tarif

1. **Agent crée une action** avec `coutUnitaire = 5.00 TND`
2. **Backend stocke** : `Action.coutUnitaire = 5.0` (Double)
3. **Backend retourne** : `ActionAmiableDTO.coutUnitaire = BigDecimal.valueOf(5.0)` (Priorité 2)
4. **Frontend affiche** : Champ pré-rempli avec `5.00`
5. **Chef financier** : Peut valider tel quel ou modifier avant validation

### Scénario 2 : Action avec tarif existant

1. **Agent crée une action** avec `coutUnitaire = 5.00 TND`
2. **Chef financier crée un tarif** avec `coutUnitaire = 6.00 TND` (modifié)
3. **Backend retourne** : `ActionAmiableDTO.coutUnitaire = tarif.getCoutUnitaire()` = `6.00` (Priorité 1)
4. **Frontend affiche** : Champ pré-rempli avec `6.00` (depuis le tarif)
5. **Chef financier** : Peut valider le tarif

### Scénario 3 : Action sans coût unitaire

1. **Agent crée une action** sans `coutUnitaire`
2. **Backend retourne** : `ActionAmiableDTO.coutUnitaire = null`
3. **Frontend affiche** : Champ vide
4. **Chef financier** : Doit saisir le coût unitaire

## ✅ Avantages de l'Approche Hybride

1. ✅ **Pas de perte d'information** : Les coûts saisis lors de la création sont conservés
2. ✅ **Gain de temps** : Le chef voit les coûts pré-remplis et peut les valider rapidement
3. ✅ **Flexibilité** : Le chef peut modifier les coûts si nécessaire
4. ✅ **Traçabilité** : Historique des coûts saisis et validés
5. ✅ **Priorité claire** : Le tarif validé prime toujours sur le coût de l'action

## 📊 Résultat Attendu

Dans l'interface de validation des tarifs :

- ✅ **Actions avec tarifs** : Coûts unitaires pré-remplis depuis les tarifs (modifiables si `EN_ATTENTE_VALIDATION`, en lecture seule si `VALIDE`)
- ✅ **Actions avec coûts saisis** : Coûts unitaires pré-remplis depuis les actions (modifiables)
- ✅ **Actions sans coûts** : Champs vides (le chef devra saisir)

## ✅ Statut

- ✅ **Backend** : Correction appliquée (priorité 1 → tarif, priorité 2 → action)
- ✅ **Frontend** : Gestion de la conversion BigDecimal → number implémentée
- ✅ **Pré-remplissage** : Fonctionnel selon la priorité backend
- ✅ **Workflow** : Complet et cohérent

---

**Date** : 2025-12-02  
**Statut** : ✅ Implémenté et fonctionnel


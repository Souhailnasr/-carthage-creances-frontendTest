# 🔍 Vérification Backend - Remplissage de `coutUnitaire` dans `ActionAmiableDTO`

## 📋 Problème Identifié

Dans la page de validation des tarifs (phase amiable), les coûts unitaires ne sont pas pré-remplis depuis les tarifs existants. Le chef financier doit pouvoir voir les coûts unitaires déjà enregistrés et les valider directement.

## ✅ Solution Frontend Appliquée

### 1. Pré-remplissage dans `validation-tarifs-amiable.component.ts`

Le composant pré-remplit maintenant `action.coutUnitaire` depuis `action.tarifExistant.coutUnitaire` dans `ngOnInit()`.

### 2. Mapping dans `finance.service.ts`

Le service extrait maintenant `coutUnitaire` depuis `tarifExistant` si l'action n'en a pas.

## ⚠️ Vérification Backend Nécessaire

### Endpoint : `GET /api/finances/dossier/{dossierId}/traitements`

**Fichier Backend** : `TarifDossierServiceImpl.java` (méthode `getTraitementsDossier`)

**Code attendu** (selon `PROMPTS_BACKEND_FINANCE_COMPLET.md` ligne 317) :

```java
if (tarif.isPresent()) {
    dto.setCoutUnitaire(tarif.get().getCoutUnitaire());  // ✅ IMPORTANT
    dto.setTarifExistant(mapToTarifDTO(tarif.get()));
    dto.setStatut(tarif.get().getStatut().name());
} else {
    dto.setStatut("EN_ATTENTE_TARIF");
}
```

### ✅ Vérification à Faire

1. **Vérifier que le backend remplit `coutUnitaire` dans `ActionAmiableDTO`** :
   - Si un tarif existe pour l'action, `dto.setCoutUnitaire(tarif.get().getCoutUnitaire())` doit être appelé
   - Le DTO `ActionAmiableDTO` doit avoir le champ `coutUnitaire` rempli

2. **Vérifier le mapping pour les autres phases** :
   - `DocumentHuissierDTO` : `coutUnitaire` doit être rempli depuis `tarifExistant`
   - `ActionHuissierDTO` : `coutUnitaire` doit être rempli depuis `tarifExistant`
   - `AudienceDTO` : `coutAudience` et `coutAvocat` doivent être remplis depuis `tarifAudience` et `tarifAvocat`

## 📝 Code Backend Attendu

### Pour Phase Amiable

```java
// Dans TarifDossierServiceImpl.getTraitementsDossier()
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
        // ✅ IMPORTANT : Remplir coutUnitaire depuis le tarif
        dto.setCoutUnitaire(tarif.get().getCoutUnitaire());
        dto.setTarifExistant(mapToTarifDTO(tarif.get()));
        dto.setStatut(tarif.get().getStatut().name());
    } else {
        dto.setStatut("EN_ATTENTE_TARIF");
        // coutUnitaire reste null si pas de tarif
    }
    
    return dto;
}).collect(Collectors.toList());
```

## 🎯 Résultat Attendu

Une fois le backend corrigé, dans la page de validation des tarifs :

1. ✅ Les actions avec tarifs existants affichent leur `coutUnitaire` pré-rempli
2. ✅ Le chef financier peut voir les coûts et les valider directement
3. ✅ Les actions sans tarif affichent un champ vide à remplir

## ✅ Corrections Frontend Appliquées

1. ✅ Pré-remplissage dans `ngOnInit()` de `validation-tarifs-amiable.component.ts`
2. ✅ Mapping dans `finance.service.ts` pour extraire `coutUnitaire` depuis `tarifExistant`
3. ✅ Calcul du montant total utilise `coutUnitaire` ou `tarifExistant.coutUnitaire`

---

**Date** : 2025-12-02  
**Statut** : Frontend corrigé, vérification backend nécessaire


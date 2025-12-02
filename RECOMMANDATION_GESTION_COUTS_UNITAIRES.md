# 💡 Recommandation - Gestion des Coûts Unitaires pour Actions Amiables

## 📋 Contexte

Actuellement, les coûts unitaires peuvent être saisis à deux endroits :
1. **Lors de la création d'une action amiable** (dans `action-dialog-amiable.component`)
2. **Dans l'interface de validation des tarifs** (dans `validation-tarifs-amiable.component`)

## 🤔 Question

**Faut-il pré-remplir les coûts unitaires depuis les actions existantes, ou supprimer la saisie lors de la création ?**

## ✅ Recommandation : **Approche Hybride**

### Option Recommandée : **Pré-remplir depuis les actions existantes**

**Avantages** :
- ✅ Les agents peuvent saisir un coût unitaire indicatif lors de la création
- ✅ Le chef financier voit ces coûts et peut les valider/modifier
- ✅ Pas de perte d'information
- ✅ Flexibilité : le chef peut corriger si nécessaire

**Workflow** :
1. Agent crée une action avec un coût unitaire (optionnel, indicatif)
2. Le coût unitaire est stocké dans l'entité `ActionAmiable`
3. Dans l'interface de validation, le chef financier voit ce coût pré-rempli
4. Le chef peut :
   - Valider le coût tel quel (créer un tarif avec ce coût)
   - Modifier le coût avant validation
   - Laisser vide et saisir un nouveau coût

### Option Alternative : **Supprimer la saisie lors de la création**

**Avantages** :
- ✅ Séparation claire des responsabilités
- ✅ Le chef financier a le contrôle total sur les tarifs
- ✅ Pas de confusion entre coûts indicatifs et tarifs validés

**Inconvénients** :
- ❌ Perte d'information si l'agent connaît déjà le coût
- ❌ Double saisie si le chef doit tout ressaisir

## 🎯 Solution Implémentée (Approche Hybride)

### Backend : `GET /api/finances/dossier/{dossierId}/traitements`

Le backend doit retourner `coutUnitaire` dans `ActionAmiableDTO` selon cette priorité :

1. **Si un tarif existe** : `dto.setCoutUnitaire(tarif.get().getCoutUnitaire())`
2. **Sinon, si l'action a un coût unitaire** : `dto.setCoutUnitaire(action.getCoutUnitaire())`
3. **Sinon** : `coutUnitaire = null` (le chef devra le saisir)

**Code Backend attendu** :
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
        // Priorité 1 : Coût unitaire du tarif (source de vérité)
        dto.setCoutUnitaire(tarif.get().getCoutUnitaire());
        dto.setTarifExistant(mapToTarifDTO(tarif.get()));
        dto.setStatut(tarif.get().getStatut().name());
    } else if (action.getCoutUnitaire() != null && action.getCoutUnitaire() > 0) {
        // Priorité 2 : Coût unitaire de l'action (saisi lors de la création)
        dto.setCoutUnitaire(action.getCoutUnitaire());
        dto.setStatut("EN_ATTENTE_TARIF");
    } else {
        // Pas de coût unitaire : le chef devra le saisir
        dto.setStatut("EN_ATTENTE_TARIF");
    }
    
    return dto;
}).collect(Collectors.toList());
```

### Frontend : Pré-remplissage Intelligent

Le frontend pré-remplit maintenant selon cette logique :

1. **Si `tarifExistant.coutUnitaire` existe** : Utiliser celui-ci (tarif validé ou en attente)
2. **Sinon, si `action.coutUnitaire` existe** : Utiliser celui-ci (saisi lors de la création)
3. **Sinon** : Laisser vide (le chef devra saisir)

## 📝 Modifications Appliquées

### 1. `finance.service.ts`
- Mapping amélioré pour pré-remplir `coutUnitaire` depuis `tarifExistant` ou depuis l'action

### 2. `validation-tarifs-amiable.component.ts`
- Pré-remplissage intelligent dans `ngOnInit()`
- Priorité au tarif existant, sinon utilisation du coût de l'action

## ✅ Résultat

Dans l'interface de validation des tarifs :
- ✅ Les actions avec tarifs existants affichent leur coût unitaire (pré-rempli et en lecture seule si validé)
- ✅ Les actions avec coûts unitaires saisis lors de la création affichent ces coûts (pré-remplis, modifiables)
- ✅ Les actions sans coût affichent un champ vide (le chef devra saisir)

## 🎯 Recommandation Finale

**Conserver la saisie de coût unitaire lors de la création** avec cette approche :
- Les agents peuvent saisir un coût indicatif
- Le chef financier voit ces coûts et peut les valider/modifier
- Flexibilité maximale sans perte d'information

---

**Date** : 2025-12-02  
**Statut** : Implémenté et recommandé


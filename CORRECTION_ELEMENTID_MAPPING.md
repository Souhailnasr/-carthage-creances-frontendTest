# ✅ Correction - Mapping elementId vers Champs Backend

## 🐛 Problème Identifié

**Erreur Backend** :
```
JSON parse error: Unrecognized field "elementId" (class projet.carthagecreance_backend.DTO.TarifDossierRequest), not marked as ignorable
```

**Cause** : Le frontend envoie `elementId` dans `TarifDossierRequest`, mais le backend attend des champs spécifiques selon le type d'élément :
- `actionId` pour les actions amiables
- `documentHuissierId` pour les documents huissier
- `actionHuissierId` pour les actions huissier
- `audienceId` pour les audiences et honoraires d'avocat
- `enqueteId` pour les enquêtes

## ✅ Solution Appliquée

### Modification dans `finance.service.ts`

**Fichier** : `carthage-creance/src/app/core/services/finance.service.ts`

**Méthode** : `ajouterTarif(dossierId: number, tarif: TarifDossierRequest)`

**Logique de mapping** :

```typescript
// Mapper elementId vers le champ spécifique attendu par le backend
if (tarif.elementId) {
  if (tarif.phase === PhaseFrais.AMIABLE && tarif.categorie === 'ACTION_AMIABLE') {
    requestBody.actionId = tarif.elementId;
  } else if (tarif.phase === PhaseFrais.JURIDIQUE) {
    if (tarif.categorie === 'DOCUMENT_HUISSIER') {
      requestBody.documentHuissierId = tarif.elementId;
    } else if (tarif.categorie === 'ACTION_HUISSIER') {
      requestBody.actionHuissierId = tarif.elementId;
    } else if (tarif.categorie === 'AUDIENCE' || tarif.categorie === 'HONORAIRES_AVOCAT') {
      // Les honoraires d'avocat sont aussi liés à l'audience
      requestBody.audienceId = tarif.elementId;
    }
  } else if (tarif.phase === PhaseFrais.ENQUETE && tarif.categorie === 'ENQUETE_PRECONTENTIEUSE') {
    requestBody.enqueteId = tarif.elementId;
  }
}
```

## 📋 Mapping Complet

| Phase | Catégorie | Frontend (elementId) | Backend (champ attendu) |
|-------|-----------|---------------------|------------------------|
| AMIABLE | ACTION_AMIABLE | `action.id` | `actionId` |
| JURIDIQUE | DOCUMENT_HUISSIER | `doc.id` | `documentHuissierId` |
| JURIDIQUE | ACTION_HUISSIER | `action.id` | `actionHuissierId` |
| JURIDIQUE | AUDIENCE | `aud.id` | `audienceId` |
| JURIDIQUE | HONORAIRES_AVOCAT | `aud.id` | `audienceId` |
| ENQUETE | ENQUETE_PRECONTENTIEUSE | `enquete.id` | `enqueteId` |

## ✅ Avantages de cette Approche

1. ✅ **Centralisation** : Le mapping est fait dans le service, pas dans chaque composant
2. ✅ **Maintenabilité** : Un seul endroit à modifier si le backend change
3. ✅ **Cohérence** : Tous les composants utilisent la même logique
4. ✅ **Pas de breaking changes** : Les composants continuent d'utiliser `elementId`

## 🎯 Composants Affectés

Tous les composants suivants continuent de fonctionner sans modification :
- ✅ `validation-tarifs-amiable.component.ts` : Actions amiables
- ✅ `validation-tarifs-juridique.component.ts` : Documents, actions, audiences, honoraires
- ✅ `validation-tarifs-enquete.component.ts` : Enquêtes
- ✅ `validation-tarifs-creation.component.ts` : Création (pas d'elementId)

## ✅ Test

**Scénario de test** :
1. Ouvrir "Validation des Tarifs - Dossier #42"
2. Aller dans l'onglet "Amiable"
3. Saisir un coût unitaire (ex: 5.00 TND) pour une action
4. Cliquer sur "Enregistrer"

**Résultat attendu** :
- ✅ Pas d'erreur 500
- ✅ Tarif enregistré avec succès
- ✅ Message de succès affiché
- ✅ Statut mis à jour

## 📝 Notes

- Le frontend continue d'utiliser `elementId` dans `TarifDossierRequest` pour la simplicité
- Le service fait automatiquement le mapping vers le bon champ backend
- Si de nouveaux types sont ajoutés, il suffit d'ajouter un cas dans le mapping

---

**Date** : 2025-12-02  
**Statut** : ✅ Corrigé et testé


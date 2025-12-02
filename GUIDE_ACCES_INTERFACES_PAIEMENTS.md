# 📍 Guide d'Accès aux Interfaces de Gestion des Paiements

## 🎯 Où se Trouvent les Interfaces et Boutons

### 1. **Composant Principal : Gestion des Paiements**

**Fichier** : `src/app/finance/components/paiements-gestion/paiements-gestion.component.html`

**Route** : `/finance/paiements/facture/:factureId`

**Contenu** :
- ✅ Section "Informations Facture" avec :
  - Numéro de facture
  - Montant TTC
  - Total Payé
  - **Montant Restant** (nouveau)
  - Statut de la facture
- ✅ **Bouton "Clôturer et Archiver le Dossier"** (visible si `peutCloturer === true`)
- ✅ Liste des paiements avec actions (Valider/Refuser)
- ✅ Formulaire pour ajouter un nouveau paiement

---

## 🚀 Comment Accéder à l'Interface

### Méthode 1 : Depuis la Liste des Factures

1. **Aller dans** : `/finance/factures`
2. **Trouver une facture** avec statut `EMISE` ou `PAYEE`
3. **Cliquer sur l'icône de paiement** (icône `payment`) dans la colonne "Actions"
4. **Vous serez redirigé vers** : `/finance/paiements/facture/{factureId}`

### Méthode 2 : Depuis le Détail d'une Facture

1. **Aller dans** : `/finance/factures/{factureId}`
2. **Cliquer sur** "Gérer Paiements" (si disponible)
3. **Vous serez redirigé vers** : `/finance/paiements/facture/{factureId}`

### Méthode 3 : Accès Direct

**URL** : `http://localhost:4200/finance/paiements/facture/4`

(Remplacez `4` par l'ID de votre facture)

---

## 🔍 Vérification des Éléments Visibles

### ✅ Section "Informations Facture"

**Condition d'affichage** : `*ngIf="factureId && facture"`

**Visible si** :
- Une facture est sélectionnée (`factureId` existe)
- La facture a été chargée (`facture` existe)

**Contenu affiché** :
```html
- Numéro Facture: {{ facture.numeroFacture }}
- Montant TTC: {{ facture.montantTTC | number:'1.2-2' }} TND
- Total Payé: {{ totalPaiements | number:'1.2-2' }} TND
- Montant Restant: {{ montantRestant | number:'1.2-2' }} TND
- Statut Facture: {{ facture.statut }}
```

---

### ✅ Bouton "Clôturer et Archiver le Dossier"

**Condition d'affichage** : `*ngIf="peutCloturer"`

**Visible si** :
- `peutCloturer === true`
- `estEntierementPayee === true`
- `facture.statut === 'PAYEE'`
- `dossierId` existe

**Emplacement** : Dans la section `cloture-section` (lignes 50-64 du template)

**Code** :
```html
<div class="cloture-section" *ngIf="peutCloturer">
  <div class="cloture-info">
    <mat-icon class="success-icon">check_circle</mat-icon>
    <span class="cloture-message">La facture est entièrement payée. Vous pouvez clôturer et archiver le dossier.</span>
  </div>
  <button 
    mat-raised-button 
    color="accent" 
    (click)="cloturerEtArchiverDossier()"
    [disabled]="loading"
    class="btn-cloturer">
    <mat-icon>archive</mat-icon>
    Clôturer et Archiver le Dossier
  </button>
</div>
```

---

## 🔧 Vérification Technique

### 1. Vérifier que les Fichiers sont à Jour

**Commande** :
```bash
# Vérifier que le fichier HTML contient le bouton
grep -n "Clôturer et Archiver" src/app/finance/components/paiements-gestion/paiements-gestion.component.html
```

**Résultat attendu** : Ligne 62 devrait contenir "Clôturer et Archiver le Dossier"

---

### 2. Vérifier que le Composant TypeScript est à Jour

**Commande** :
```bash
# Vérifier que la méthode existe
grep -n "cloturerEtArchiverDossier" src/app/finance/components/paiements-gestion/paiements-gestion.component.ts
```

**Résultat attendu** : Devrait trouver la méthode `cloturerEtArchiverDossier()`

---

### 3. Rebuild l'Application Angular

**Si vous ne voyez pas les changements** :

```bash
# Arrêter le serveur de développement (Ctrl+C)
# Nettoyer le cache
rm -rf .angular
rm -rf node_modules/.cache

# Rebuild
ng serve
# ou
npm start
```

---

### 4. Vider le Cache du Navigateur

**Chrome/Edge** :
- `Ctrl + Shift + R` (Windows/Linux)
- `Cmd + Shift + R` (Mac)

**Ou** :
- Ouvrir les DevTools (F12)
- Clic droit sur le bouton de rafraîchissement
- Sélectionner "Vider le cache et effectuer un rechargement forcé"

---

## 🐛 Dépannage

### Problème 1 : Le Bouton n'Apparaît Pas

**Causes possibles** :
1. ❌ La facture n'est pas entièrement payée (`montantRestant > 0`)
2. ❌ Le statut de la facture n'est pas `PAYEE`
3. ❌ `peutCloturer === false`

**Solution** :
- Vérifier dans la console du navigateur (F12) :
  ```javascript
  // Dans la console
  console.log('peutCloturer:', peutCloturer);
  console.log('estEntierementPayee:', estEntierementPayee);
  console.log('montantRestant:', montantRestant);
  ```

---

### Problème 2 : La Section "Informations Facture" n'Apparaît Pas

**Causes possibles** :
1. ❌ `factureId` est `undefined`
2. ❌ `facture` n'a pas été chargée

**Solution** :
- Vérifier l'URL : doit être `/finance/paiements/facture/{factureId}`
- Vérifier dans la console :
  ```javascript
  console.log('factureId:', factureId);
  console.log('facture:', facture);
  ```

---

### Problème 3 : Les Données ne se Chargent Pas

**Causes possibles** :
1. ❌ Erreur backend (endpoint non disponible)
2. ❌ Erreur CORS
3. ❌ Token d'authentification expiré

**Solution** :
- Ouvrir la console du navigateur (F12)
- Vérifier l'onglet "Network" pour voir les erreurs HTTP
- Vérifier l'onglet "Console" pour voir les erreurs JavaScript

---

## 📋 Checklist de Vérification

### ✅ Fichiers Présents
- [ ] `paiements-gestion.component.html` contient la section "Informations Facture"
- [ ] `paiements-gestion.component.html` contient le bouton "Clôturer et Archiver"
- [ ] `paiements-gestion.component.ts` contient la méthode `cloturerEtArchiverDossier()`
- [ ] `paiements-gestion.component.ts` contient la propriété `peutCloturer`
- [ ] `paiements-gestion.component.scss` contient les styles pour `.cloture-section`

### ✅ Routes Configurées
- [ ] Route `/finance/paiements/facture/:factureId` existe dans `finance.module.ts`
- [ ] Le composant est correctement chargé

### ✅ Backend Disponible
- [ ] Endpoint `GET /api/factures/{factureId}/solde` fonctionne
- [ ] Endpoint `GET /api/dossiers/{dossierId}/peut-etre-cloture` fonctionne
- [ ] Endpoint `POST /api/dossiers/{dossierId}/cloturer-et-archiver` fonctionne

---

## 🎯 Test Rapide

### Test 1 : Vérifier l'Affichage de la Section

1. **Aller sur** : `http://localhost:4200/finance/paiements/facture/4`
   (Remplacez `4` par un ID de facture existant)

2. **Vérifier** :
   - ✅ La section "Informations Facture" apparaît
   - ✅ Le montant TTC est affiché
   - ✅ Le total payé est affiché
   - ✅ Le montant restant est affiché

### Test 2 : Vérifier l'Affichage du Bouton

1. **Créer un paiement** pour une facture
2. **Valider le paiement** jusqu'à ce que le solde soit 0
3. **Vérifier** :
   - ✅ Le bouton "Clôturer et Archiver" apparaît
   - ✅ Le message "La facture est entièrement payée" s'affiche

### Test 3 : Tester la Clôture

1. **Cliquer sur** "Clôturer et Archiver le Dossier"
2. **Confirmer** dans la boîte de dialogue
3. **Vérifier** :
   - ✅ Un message de succès s'affiche
   - ✅ Redirection vers `/finance/mes-dossiers`

---

## 📞 Support

Si après avoir suivi ce guide vous ne voyez toujours pas les interfaces :

1. **Vérifier les logs de la console** (F12)
2. **Vérifier les logs du serveur Angular**
3. **Vérifier que le backend répond correctement**
4. **Partager les erreurs** pour diagnostic

---

**Date de création** : 2025-12-02  
**Dernière mise à jour** : 2025-12-02


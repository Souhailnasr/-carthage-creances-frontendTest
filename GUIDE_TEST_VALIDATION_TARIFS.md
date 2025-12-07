# 🧪 Guide de Test - Validation des Tarifs

## 📋 Prérequis

1. ✅ Serveur Angular en cours d'exécution (`ng serve`)
2. ✅ Backend démarré et accessible
3. ✅ Base de données connectée
4. ✅ Navigateur ouvert avec la console développeur (F12)

---

## 🎯 Test 1 : Actions Amiables - Persistance du Statut "VALIDE"

### Objectif
Vérifier que le statut "VALIDE" reste affiché après rechargement de la page.

### Étapes

#### Étape 1 : Accéder à l'interface
1. Ouvrir le navigateur
2. Aller sur : `http://localhost:4200/finance/validation-tarifs/11`
   *(Remplacez `11` par l'ID d'un dossier qui a des actions amiables)*

#### Étape 2 : Ouvrir la console développeur
1. Appuyer sur `F12` pour ouvrir les outils de développement
2. Aller dans l'onglet **"Console"**
3. Vérifier que les logs sont visibles

#### Étape 3 : Naviguer vers l'onglet "Amiable"
1. Dans l'interface, cliquer sur l'onglet **"Amiable"**
2. Vous devriez voir un tableau avec des actions (Appel, Visite, etc.)

#### Étape 4 : Vérifier l'état initial
**À vérifier :**
- Les actions ont un statut "NON_VALIDE" (badge orange)
- Un bouton "Enregistrer" est visible pour chaque action
- Les champs "Coût unitaire" sont modifiables

**Dans la console, vous devriez voir :**
```
🔍 ngOnInit - Traitements disponible: true
🔄 Rechargement des tarifs depuis la base lors du chargement initial...
✅ Tarifs rechargés depuis la base: X
```

#### Étape 5 : Enregistrer un tarif
1. Saisir un montant dans "Coût unitaire" (ex: `5` pour Appel)
2. Cliquer sur le bouton **"Enregistrer"**
3. Attendre le message de succès : "Tarif enregistré avec succès..."

**À vérifier :**
- Le bouton "Enregistrer" disparaît
- Un bouton **"Valider"** apparaît (bleu)
- Le statut passe à "EN_ATTENTE_VALIDATION" (badge orange)

**Dans la console, vous devriez voir :**
```
✅ Tarif enregistré avec succès: {...}
✅ Action mise à jour localement avec le tarif: {...}
✅ Statut du tarif: EN_ATTENTE_VALIDATION
```

#### Étape 6 : Valider le tarif
1. Cliquer sur le bouton **"Valider"**
2. Attendre le message de succès : "Tarif validé avec succès"

**À vérifier :**
- Le statut passe à **"VALIDE"** (badge vert)
- L'icône "Validé" avec un checkmark apparaît
- Les boutons "Valider" et "Rejeter" disparaissent
- Le champ "Coût unitaire" devient en lecture seule

**Dans la console, vous devriez voir :**
```
🔍 Validation du tarif: {...}
✅ Tarif validé avec succès: {...}
✅ Statut du tarif validé: VALIDE
🔄 Rechargement des tarifs depuis la base après validation...
✅ Actions avec tarifs validés: X
```

#### Étape 7 : Recharger la page (TEST CRITIQUE)
1. Appuyer sur **`F5`** ou cliquer sur le bouton de rechargement du navigateur
2. Attendre que la page se recharge complètement

**✅ RÉSULTAT ATTENDU :**
- Le statut doit rester **"VALIDE"** (badge vert)
- L'icône "Validé" doit toujours être visible
- Le champ "Coût unitaire" doit rester en lecture seule
- **AUCUN** bouton "Enregistrer" ou "Valider" ne doit apparaître

**Dans la console, vous devriez voir :**
```
🔄 ngOnChanges - Changement détecté dans traitements
🔄 Rechargement des tarifs depuis la base après changement de traitements...
✅ Tarifs rechargés depuis la base: X
✅ Tarifs amiables pour ce dossier: X
✅ Tarif associé à l'action X Statut: VALIDE Validé: true
✅ Actions avec tarifs validés: 1 (ou plus)
```

#### Étape 8 : Vérification finale
**Checklist :**
- [ ] Le statut "VALIDE" est toujours visible après rechargement
- [ ] Le badge vert est présent
- [ ] L'icône "Validé" est visible
- [ ] Aucun bouton d'action n'est visible
- [ ] Les logs dans la console montrent "Statut: VALIDE"

---

## 🎯 Test 2 : Honoraires Avocat - Bouton "Valider Honoraires"

### Objectif
Vérifier que le bouton "Valider Honoraires" apparaît et permet une validation séparée.

### Étapes

#### Étape 1 : Accéder à l'interface
1. Aller sur : `http://localhost:4200/finance/validation-tarifs/11`
2. Ouvrir la console développeur (F12)

#### Étape 2 : Naviguer vers l'onglet "Audiences"
1. Cliquer sur l'onglet **"Juridique"**
2. Cliquer sur le sous-onglet **"Audiences"**
3. Vous devriez voir un tableau avec des audiences

#### Étape 3 : Vérifier l'état initial
**À vérifier :**
- Le tableau contient des audiences avec des dates
- Les colonnes "Coût audience" et "Honoraires avocat" sont visibles
- Un bouton "Enregistrer" est visible (si aucun tarif n'est enregistré)

**Dans la console, vous devriez voir :**
```
🔄 Chargement initial des tarifs depuis la base pour les audiences...
✅ Tarifs rechargés depuis la base: X
✅ Tarifs juridiques trouvés: X
```

#### Étape 4 : Enregistrer un tarif audience avec honoraires
1. Saisir un montant dans "Coût audience" (ex: `500`)
2. Saisir un montant dans "Honoraires avocat" (ex: `200`)
3. Cliquer sur le bouton **"Enregistrer"**
4. Attendre le message de succès : "Tarifs enregistrés. Vous pouvez maintenant les valider."

**À vérifier :**
- Le bouton "Enregistrer" disparaît
- **DEUX** boutons apparaissent :
  - **"Valider Audience"** (bleu/primary)
  - **"Valider Honoraires"** (violet/accent)
- Le statut affiche "EN_ATTENTE_VALIDATION"

**Dans la console, vous devriez voir :**
```
✅ Tarif audience enregistré avec succès: {...}
✅ Tarif avocat enregistré avec succès: {...}
✅ Tarifs enregistrés. Vous pouvez maintenant les valider.
```

#### Étape 5 : Valider uniquement l'audience
1. Cliquer sur le bouton **"Valider Audience"**
2. Attendre le message : "Tarif audience validé"

**✅ RÉSULTAT ATTENDU :**
- Le bouton "Valider Audience" **disparaît**
- Le bouton **"Valider Honoraires"** **reste visible**
- Le statut peut afficher "EN_ATTENTE_VALIDATION" (car les honoraires ne sont pas encore validés)
- Le champ "Coût audience" devient en lecture seule

**Dans la console, vous devriez voir :**
```
🔍 Validation du tarif audience: {...}
✅ Tarif audience validé avec succès: {...}
🔄 Rechargement des tarifs depuis la base après validation...
✅ Tarif AUDIENCE trouvé pour audience: X tarifId: X
```

#### Étape 6 : Valider les honoraires d'avocat
1. Cliquer sur le bouton **"Valider Honoraires"**
2. Attendre le message : "Tarif honoraires avocat validé"

**✅ RÉSULTAT ATTENDU :**
- Le bouton "Valider Honoraires" **disparaît**
- Le statut passe à **"VALIDE"** (badge vert)
- L'icône "Validé" avec un checkmark apparaît
- Le champ "Honoraires avocat" devient en lecture seule

**Dans la console, vous devriez voir :**
```
🔍 Validation du tarif honoraires avocat: {...}
✅ Tarif honoraires avocat validé avec succès: {...}
🔄 Rechargement des tarifs depuis la base après validation...
✅ Tarif HONORAIRES_AVOCAT trouvé pour audience: {
  audienceId: X,
  avocatId: X,
  tarifId: X,
  statut: VALIDE
}
```

#### Étape 7 : Recharger la page (TEST CRITIQUE)
1. Appuyer sur **`F5`**
2. Attendre que la page se recharge

**✅ RÉSULTAT ATTENDU :**
- Le statut reste **"VALIDE"** (badge vert)
- L'icône "Validé" reste visible
- Les deux champs sont en lecture seule
- **AUCUN** bouton d'action n'est visible

**Dans la console, vous devriez voir :**
```
🔄 Chargement initial des tarifs depuis la base pour les audiences...
✅ Tarifs rechargés depuis la base: X
✅ Tarifs juridiques trouvés: X
✅ Tarif AUDIENCE trouvé pour audience: X tarifId: X
✅ Tarif HONORAIRES_AVOCAT trouvé pour audience: {
  audienceId: X,
  avocatId: X,
  tarifId: X,
  statut: VALIDE
}
```

#### Étape 8 : Vérification finale
**Checklist :**
- [ ] Le bouton "Valider Honoraires" est visible après enregistrement
- [ ] La validation de l'audience et des honoraires est séparée
- [ ] Le statut "VALIDE" persiste après rechargement
- [ ] Les logs montrent le chargement des tarifs depuis la base

---

## 🔍 Points de Vérification dans la Console

### Logs Attendus pour Actions Amiables

```
✅ Logs de chargement initial :
🔍 ngOnInit - Traitements disponible: true
🔄 Rechargement des tarifs depuis la base lors du chargement initial...
✅ Tarifs rechargés depuis la base: X
✅ Tarifs amiables pour ce dossier: X
✅ Actions avec tarifs validés: X

✅ Logs après validation :
🔍 Validation du tarif: {...}
✅ Tarif validé avec succès: {...}
🔄 Rechargement des tarifs depuis la base après validation...
✅ Actions avec tarifs validés: X

✅ Logs après rechargement :
🔄 ngOnChanges - Changement détecté dans traitements
🔄 Rechargement des tarifs depuis la base après changement de traitements...
✅ Tarif associé à l'action X Statut: VALIDE Validé: true
```

### Logs Attendus pour Honoraires Avocat

```
✅ Logs de chargement initial :
🔄 Chargement initial des tarifs depuis la base pour les audiences...
✅ Tarifs rechargés depuis la base: X
✅ Tarifs juridiques trouvés: X
✅ Détails des tarifs juridiques: [...]
✅ Audiences disponibles: [...]

✅ Logs après enregistrement :
✅ Tarif audience enregistré avec succès: {...}
✅ Tarif avocat enregistré avec succès: {...}

✅ Logs après validation honoraires :
🔍 Validation du tarif honoraires avocat: {...}
✅ Tarif honoraires avocat validé avec succès: {...}
✅ Tarif HONORAIRES_AVOCAT trouvé pour audience: {
  audienceId: X,
  avocatId: X,
  tarifId: X,
  statut: VALIDE
}
```

---

## ❌ Problèmes Potentiels et Solutions

### Problème 1 : Le statut "VALIDE" disparaît après rechargement

**Symptômes :**
- Le statut revient à "NON_VALIDE" après F5
- Les boutons "Enregistrer" réapparaissent

**Solutions :**
1. Vérifier dans la console si `loadTarifsForActions()` est appelé
2. Vérifier si les tarifs sont bien chargés depuis la base
3. Vérifier les logs : `✅ Tarifs rechargés depuis la base: X`
4. Redémarrer le serveur Angular si nécessaire

### Problème 2 : Le bouton "Valider Honoraires" n'apparaît pas

**Symptômes :**
- Seul le bouton "Valider Audience" est visible
- Le tarif avocat n'est pas chargé

**Solutions :**
1. Vérifier dans la console si `rechargerTarifsDepuisBase()` est appelé
2. Vérifier les logs : `✅ Tarif HONORAIRES_AVOCAT trouvé pour audience`
3. Vérifier que `aud.avocatId` existe dans l'audience
4. Vérifier que le tarif avocat a bien été créé en base

### Problème 3 : Erreurs dans la console

**Symptômes :**
- Erreurs TypeScript ou runtime
- Requêtes HTTP qui échouent

**Solutions :**
1. Vérifier que le backend est démarré
2. Vérifier que la base de données est accessible
3. Vérifier les erreurs CORS si présentes
4. Vérifier les logs du backend

---

## ✅ Checklist Complète de Test

### Actions Amiables
- [ ] Les actions sont chargées correctement
- [ ] L'enregistrement d'un tarif fonctionne
- [ ] Le bouton "Valider" apparaît après enregistrement
- [ ] La validation fonctionne
- [ ] Le statut "VALIDE" persiste après rechargement
- [ ] Les logs de débogage sont présents dans la console

### Honoraires Avocat
- [ ] Les audiences sont chargées correctement
- [ ] L'enregistrement d'un tarif audience + honoraires fonctionne
- [ ] Le bouton "Valider Honoraires" apparaît
- [ ] La validation de l'audience est séparée de celle des honoraires
- [ ] Le statut "VALIDE" persiste après rechargement
- [ ] Les logs de débogage sont présents dans la console

---

## 📸 Captures d'Écran à Prendre

Pour documenter les tests, prendre des captures d'écran de :

1. **Avant validation** : Interface avec statut "NON_VALIDE"
2. **Après validation** : Interface avec statut "VALIDE" et badge vert
3. **Après rechargement** : Interface montrant que le statut reste "VALIDE"
4. **Console avec logs** : Montrant les logs de rechargement des tarifs
5. **Bouton "Valider Honoraires"** : Montrant les deux boutons séparés

---

## 🎉 Critères de Succès

Le test est **réussi** si :

1. ✅ Le statut "VALIDE" reste affiché après rechargement de la page
2. ✅ Le bouton "Valider Honoraires" apparaît et fonctionne
3. ✅ La validation de l'audience et des honoraires est séparée
4. ✅ Les logs de débogage montrent le chargement des tarifs depuis la base
5. ✅ Aucune erreur dans la console du navigateur

---

*Guide créé le : 2025-12-07*
*Dernière mise à jour : Après corrections validation tarifs*


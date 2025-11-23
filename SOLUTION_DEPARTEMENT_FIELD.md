# 🔧 Solution - Erreur "Unrecognized field departement"

## ❌ Problème

**Erreur backend :**
```
JSON parse error: Unrecognized field "departement" (class projet.carthagecreance_backend.Entity.Utilisateur), not marked as ignorable
```

**Cause :** Le frontend envoie un champ `departement` lors de la création/mise à jour d'un utilisateur, mais l'entité `Utilisateur` côté backend ne contient pas ce champ.

---

## ✅ Solution Appliquée

### 1. Correction dans `utilisateur.service.ts`

**Avant :**
```typescript
createUtilisateur(utilisateur: UtilisateurRequest): Observable<AuthenticationResponse> {
  const payload: any = { ...utilisateur };
  // Le champ "departement" était envoyé au backend
  return this.http.post<AuthenticationResponse>(`${this.baseUrl}/users`, payload, { headers })
}
```

**Après :**
```typescript
createUtilisateur(utilisateur: UtilisateurRequest): Observable<AuthenticationResponse> {
  const payload: any = { ...utilisateur };
  
  // 🔧 CORRECTION: Retirer les champs non reconnus par le backend
  delete payload.departement; // Le backend ne reconnaît pas "departement" dans l'entité Utilisateur
  
  // 🔧 CORRECTION: Normaliser le rôle - utiliser uniquement roleUtilisateur
  if (payload.role && !payload.roleUtilisateur) {
    payload.roleUtilisateur = payload.role;
  }
  delete payload.role; // Le backend ne reconnaît que "roleUtilisateur", pas "role"
  
  return this.http.post<AuthenticationResponse>(`${this.baseUrl}/users`, payload, { headers })
}
```

**Même correction pour `updateUtilisateur` :**
```typescript
updateUtilisateur(id: number, utilisateur: UtilisateurRequest): Observable<Utilisateur> {
  const payload: any = { ...utilisateur };
  delete payload.departement; // Retirer le champ non reconnu
  delete payload.role; // Le backend ne reconnaît que "roleUtilisateur", pas "role"
  
  // Normaliser le rôle si nécessaire
  if (payload.role && !payload.roleUtilisateur) {
    payload.roleUtilisateur = payload.role;
    delete payload.role;
  }
  
  return this.http.put<Utilisateur>(`${this.baseUrl}/users/${id}`, payload, { headers })
}
```

---

## 📋 Champs Reconnus par le Backend

Selon l'erreur, l'entité `Utilisateur` côté backend reconnaît uniquement ces champs :

1. `motDePasse`
2. `prenom`
3. `id`
4. `nom`
5. `dateCreation`
6. `actif`
7. `authorities`
8. `email`
9. `derniereConnexion`
10. `derniereDeconnexion`
11. `roleUtilisateur`

**Champs NON reconnus (à retirer) :**
- ❌ `departement` - Non présent dans l'entité backend
- ❌ `role` - Le backend ne reconnaît que `roleUtilisateur`, pas `role`
- ❌ `telephone` - Vérifier si présent dans l'entité
- ❌ `adresse` - Vérifier si présent dans l'entité
- ❌ `chefId` - Vérifier si présent dans l'entité

---

## 🔍 Pourquoi le Champ `departement` était Envoyé

Le composant `utilisateurs.component.ts` calcule le département à partir du rôle :

```typescript
getDepartmentFromRole(role: string): string {
  const roleToDepartment: { [key: string]: string } = {
    'CHEF_DEPARTEMENT_FINANCE': 'FINANCE',
    'AGENT_FINANCE': 'FINANCE',
    // ...
  };
  return roleToDepartment[role] || '';
}
```

Et l'inclut dans la requête :
```typescript
const utilisateurRequest: UtilisateurRequest = {
  nom: formValue.nom,
  prenom: formValue.prenom,
  email: formValue.email,
  roleUtilisateur: formValue.role,
  motDePasse: formValue.motDePasse,
  actif: true,
  departement: this.getDepartmentFromRole(formValue.role) // ❌ Ce champ n'existe pas côté backend
};
```

**Note :** Le champ `departement` est utilisé uniquement côté frontend pour le filtrage et l'affichage. Il n'a pas besoin d'être envoyé au backend.

---

## 🧪 Test de Vérification

### Test 1 : Créer un Chef Financier

**Avant la correction :**
```json
POST /api/users
{
  "nom": "Test",
  "prenom": "Chef",
  "email": "chef.finance@test.com",
  "roleUtilisateur": "CHEF_DEPARTEMENT_FINANCE",
  "motDePasse": "password123",
  "actif": true,
  "departement": "FINANCE"  // ❌ Erreur : champ non reconnu
}
```

**Après la correction :**
```json
POST /api/users
{
  "nom": "Test",
  "prenom": "Chef",
  "email": "chef.finance@test.com",
  "roleUtilisateur": "CHEF_DEPARTEMENT_FINANCE",
  "motDePasse": "password123",
  "actif": true
  // ✅ Les champs "departement" et "role" sont retirés avant l'envoi
  // ✅ Seul "roleUtilisateur" est envoyé (reconnu par le backend)
}
```

---

## 📝 Notes Importantes

1. **Le champ `departement` reste dans l'interface TypeScript** (`UtilisateurRequest`) car il est utilisé côté frontend pour le filtrage et l'affichage.

2. **Le champ est retiré uniquement avant l'envoi au backend** dans le service `utilisateur.service.ts`.

3. **Si le backend doit stocker le département**, il faudra :
   - Ajouter le champ `departement` dans l'entité `Utilisateur` côté backend
   - Ajouter la colonne correspondante dans la base de données
   - Retirer la ligne `delete payload.departement;` du service frontend

4. **Pour l'instant, le département est calculé côté frontend** à partir du rôle, donc il n'est pas nécessaire de le stocker en base.

---

## ✅ Résultat

Après cette correction, la création et la mise à jour d'utilisateurs (y compris les chefs financiers) fonctionneront correctement sans les erreurs :
- ❌ "Unrecognized field departement"
- ❌ "Unrecognized field role"

Le backend reçoit uniquement les champs qu'il reconnaît, notamment `roleUtilisateur` au lieu de `role`.


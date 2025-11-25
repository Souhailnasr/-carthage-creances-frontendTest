# ✅ Vérification Rapide : Logout avec JWT

## 🔍 Étape 1 : Vérifier dans la Console du Navigateur (F12)

### Ouvrir F12 → Network → Cliquer sur "Déconnexion"

**Vérifiez :**

- ✅ Une requête `POST /auth/logout` apparaît
- ✅ Status: `200 OK` (ou autre selon le backend)
- ✅ Request Headers contient `Authorization: Bearer ...`

**Si la requête n'apparaît PAS :**
→ Le frontend n'appelle pas l'endpoint (voir section "Correction du Service")

**Si la requête apparaît mais SANS le header Authorization :**
→ L'interceptor JWT ne fonctionne pas ou n'est pas appliqué (voir section "Correction de l'Interceptor")

---

## 📋 Checklist de Vérification

### ✅ Frontend

- [x] Le service `logout()` appelle `POST /auth/logout`
- [x] Le header `Authorization: Bearer {token}` est inclus (via interceptor)
- [x] L'interceptor JWT n'exclut PAS `/auth/logout`
- [x] L'interceptor est bien enregistré dans `app.config.ts`
- [x] Le composant appelle `jwtAuthService.logOut().subscribe(...)`
- [x] Dans Network (F12), la requête POST /auth/logout apparaît avec le header Authorization

### ✅ Backend

- [ ] Les logs backend montrent "=== DÉBUT LOGOUT ==="
- [ ] Les logs backend montrent "Logout: Token JWT extrait (longueur: XXX)"
- [ ] Les logs backend montrent "Logout: Utilisateur trouvé"
- [ ] Les logs backend montrent "Logout: derniere_deconnexion mise à jour"

### ✅ Base de Données

- [ ] La base de données montre `derniere_deconnexion` remplie

---

## 🧪 Test Manuel

### 1. Redémarrer le Frontend

```bash
cd carthage-creance
ng serve
```

### 2. Tester le Logout

1. **Se connecter** à l'application avec un utilisateur
2. **Ouvrir F12 → Network** (onglet Réseau)
3. **Cliquer sur "Déconnexion"**
4. **Vérifier dans Network** :
   - ✅ Une requête `POST /auth/logout` apparaît
   - ✅ Status: `200 OK` (ou autre selon le backend)
   - ✅ Request Headers contient `Authorization: Bearer {token}`
   - ✅ Response: `{"message":"Logout successful"}` (ou autre selon le backend)

### 3. Vérifier les Logs dans la Console (F12 → Console)

Vous devriez voir :

```
🔄 Début du processus de logout
🔄 Appel logout avec token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔄 URL de logout: http://localhost:8089/carthage-creance/auth/logout
🔍 AuthInterceptor - Requête vers: http://localhost:8089/carthage-creance/auth/logout
🔍 Token disponible: true
🔍 Token (premiers caractères): eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
🔐 AuthInterceptor - Requête /auth/logout détectée
✅ Token disponible pour logout: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ Header Authorization: Bearer {token} sera ajouté automatiquement
✅ AuthInterceptor - Token JWT ajouté à la requête JSON
✅ Logout réussi côté backend: {...}
🧹 Nettoyage complet du storage...
✅ Storage complètement nettoyé
✅ Storage nettoyé, redirection vers /login
```

### 4. Vérifier les Logs Backend

Vous devriez voir dans les logs du backend :

```
=== DÉBUT LOGOUT ===
Logout: Token JWT extrait (longueur: XXX)
Logout: Token trouvé, ID: XXX
Logout: Utilisateur trouvé - ID: XXX, Email: XXX
Logout: ✅ SUCCÈS - derniere_deconnexion correctement sauvegardée: 2025-11-25T...
```

### 5. Vérifier dans la Base de Données

```sql
SELECT id, email, derniere_connexion, derniere_deconnexion 
FROM utilisateur 
WHERE email = 'votre_email@example.com';
```

`derniere_deconnexion` devrait maintenant être remplie ! ✅

---

## 🚨 Si ça ne fonctionne toujours pas

### Vérifier dans la Console du Navigateur (F12 → Console)

1. **Y a-t-il des erreurs JavaScript ?**
   - Si oui, notez le message d'erreur

2. **Le message "🔄 Début du processus de logout" apparaît-il ?**
   - Si non, le composant n'appelle pas `logOut()`
   - Vérifiez le composant qui contient le bouton "Déconnexion"

3. **Le message "🔄 Appel logout avec token: ..." apparaît-il ?**
   - Si non, le token n'est pas trouvé dans `sessionStorage.getItem('auth-user')`
   - Vérifiez que le token est bien stocké après le login

4. **Le message "✅ Logout réussi côté backend" apparaît-il ?**
   - Si non, le backend a renvoyé une erreur
   - Vérifiez les logs backend pour plus de détails

### Vérifier dans Network (F12 → Network)

1. **La requête `POST /auth/logout` apparaît-elle ?**
   - Si non, le service n'appelle pas l'endpoint
   - Vérifiez `JwtAuthService.logOut()`

2. **Le header `Authorization` est-il présent ?**
   - Si non, l'interceptor ne fonctionne pas
   - Vérifiez `AuthInterceptor` et son enregistrement dans `app.config.ts`

3. **Quel est le Status de la réponse ?**
   - `200 OK` : ✅ Succès
   - `401 Unauthorized` : Token invalide ou expiré
   - `404 Not Found` : Endpoint `/auth/logout` n'existe pas dans le backend
   - `500 Internal Server Error` : Erreur côté backend

### Vérifier le Token dans sessionStorage

Ouvrez la Console (F12 → Console) et tapez :

```javascript
// Vérifier le token dans sessionStorage
const token = sessionStorage.getItem('auth-user');
console.log('Token:', token ? token.substring(0, 30) + '...' : 'AUCUN');

// Vérifier aussi dans localStorage (au cas où)
const tokenLocal = localStorage.getItem('token');
console.log('Token localStorage:', tokenLocal ? tokenLocal.substring(0, 30) + '...' : 'AUCUN');
```

Si aucun token n'est trouvé, le problème vient du login (le token n'est pas stocké correctement).

---

## 📝 Code de Référence

### Service JWT (`jwt-auth.service.ts`)

```typescript
logOut(): Observable<any> {
  console.log('🔄 Début du processus de logout');
  
  const token = this.getToken(); // sessionStorage.getItem('auth-user')
  
  if (!token) {
    console.warn('⚠️ Aucun token trouvé, nettoyage du storage uniquement');
    this.clearAllStorage();
    this.router.navigate(['/login'], { replaceUrl: true });
    return of({ message: 'Déconnexion locale effectuée (pas de token)' });
  }

  console.log('🔄 Appel logout avec token:', token.substring(0, 20) + '...');
  
  // L'interceptor ajoutera automatiquement le header Authorization: Bearer {token}
  return this.http.post(`${this.baseUrl}/auth/logout`, {}, httpOptions).pipe(
    tap((response) => {
      console.log('✅ Logout réussi côté backend:', response);
    }),
    catchError((error) => {
      console.error('❌ Erreur lors du logout backend:', error);
      return of({ message: 'Déconnexion locale effectuée (erreur backend ignorée)' });
    }),
    finalize(() => {
      this.clearAllStorage();
      this.router.navigate(['/login'], { replaceUrl: true });
    })
  );
}
```

### Interceptor (`auth.interceptor.ts`)

```typescript
export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const token = sessionStorage.getItem('auth-user');
  
  if (token) {
    // Ajouter le header Authorization à TOUTES les requêtes, y compris /auth/logout
    const cloned = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(cloned);
  }
  
  return next(req);
};
```

### Enregistrement (`app.config.ts`)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([AuthInterceptor, ErrorInterceptor])
    ),
    // ...
  ]
};
```

---

## ✅ Résultat Attendu

Après avoir suivi ces étapes, vous devriez avoir :

1. ✅ Une requête `POST /auth/logout` dans Network avec le header `Authorization: Bearer {token}`
2. ✅ Les logs dans la console montrent "✅ Logout réussi côté backend"
3. ✅ Les logs backend montrent "=== DÉBUT LOGOUT ===" et "derniere_deconnexion mise à jour"
4. ✅ La base de données montre `derniere_deconnexion` remplie
5. ✅ L'utilisateur est redirigé vers `/login`
6. ✅ Le token est supprimé de `sessionStorage`

---

## 📚 Fichiers à Vérifier

- **Service** : `carthage-creance/src/app/core/services/jwt-auth.service.ts`
- **Interceptor** : `carthage-creance/src/app/core/interceptors/auth.interceptor.ts`
- **Configuration** : `carthage-creance/src/app/app.config.ts`
- **Composants** : 
  - `carthage-creance/src/app/shared/components/sidebar/sidebar.component.ts`
  - `carthage-creance/src/app/juridique/components/juridique-sidebar/juridique-sidebar.component.ts`
  - `carthage-creance/src/app/chef-amiable/components/chef-amiable-layout/chef-amiable-layout.component.ts`
  - `carthage-creance/src/app/admin/components/admin-layout/admin-layout.component.ts`

---

## 🎯 Conclusion

Si toutes les vérifications sont passées mais que `derniere_deconnexion` reste NULL, le problème vient du **backend** (endpoint `/auth/logout` ne met pas à jour la base de données).

Si la requête n'apparaît pas ou n'a pas le header `Authorization`, le problème vient du **frontend** (service ou interceptor).


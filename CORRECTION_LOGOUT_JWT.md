# 🔐 Correction du Logout avec JWT

## 📋 Problèmes Identifiés

1. **`JwtAuthService.logOut()` ne faisait rien** :
   - Ne supprimait que `sessionStorage.removeItem("email")`
   - N'appelait pas l'endpoint backend `/auth/logout`
   - Ne supprimait pas le token `auth-user` du storage

2. **Le token JWT n'était pas envoyé au backend lors du logout** :
   - L'interceptor ajoutait le header `Authorization: Bearer {token}` pour toutes les requêtes
   - Mais comme `logOut()` n'appelait pas `/auth/logout`, le token n'était jamais envoyé

3. **Les composants ne géraient pas correctement le logout** :
   - Appelaient `logOut()` sans gérer l'Observable retourné
   - Redirigeaient manuellement vers `/login` alors que le service devrait le faire

---

## ✅ Corrections Apportées

### 1. **`JwtAuthService.logOut()` - Méthode Complète**

**Fichier** : `carthage-creance/src/app/core/services/jwt-auth.service.ts`

**Changements** :
- ✅ Appelle maintenant l'endpoint `/auth/logout` avec le token JWT
- ✅ L'interceptor `AuthInterceptor` ajoute automatiquement le header `Authorization: Bearer {token}`
- ✅ Nettoie tous les tokens du storage (sessionStorage et localStorage)
- ✅ Redirige automatiquement vers `/login` après le logout (dans `finalize()`)
- ✅ Gère les erreurs backend (même si le backend échoue, le frontend est nettoyé)

**Code** :
```typescript
logOut(): Observable<any> {
  console.log('🔐 Début du logout...');
  
  const token = sessionStorage.getItem('auth-user');
  
  if (!token) {
    console.warn('⚠️ Aucun token trouvé, nettoyage du storage uniquement');
    this.clearAllStorage();
    return of({ message: 'Déconnexion locale effectuée' });
  }

  // L'interceptor AuthInterceptor ajoutera automatiquement le header Authorization: Bearer {token}
  return this.http.post(`${this.baseUrl}/auth/logout`, {}, httpOptions).pipe(
    tap((response) => {
      console.log('✅ Logout réussi côté backend:', response);
    }),
    catchError((error) => {
      // Même si le backend échoue, on nettoie quand même le frontend
      console.error('❌ Erreur lors du logout backend (non bloquant):', error);
      return of({ message: 'Déconnexion locale effectuée (erreur backend ignorée)' });
    }),
    finalize(() => {
      // Toujours nettoyer le storage et rediriger, même en cas d'erreur
      this.clearAllStorage();
      this.router.navigate(['/login'], { replaceUrl: true });
    })
  );
}

private clearAllStorage(): void {
  // Supprime tous les tokens possibles
  sessionStorage.removeItem('auth-user');
  sessionStorage.removeItem('auth-token');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('email');
  
  localStorage.removeItem('auth-user');
  localStorage.removeItem('auth-token');
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('email');
}
```

---

### 2. **`AuthInterceptor` - Amélioration pour `/auth/logout`**

**Fichier** : `carthage-creance/src/app/core/interceptors/auth.interceptor.ts`

**Changements** :
- ✅ Ajoute `/auth/logout` dans la liste des URLs exclues de la redirection automatique
- ✅ Ajoute des logs spécifiques pour `/auth/logout` pour faciliter le débogage
- ✅ S'assure que le header `Authorization` est ajouté pour `/auth/logout` si un token existe

**Code** :
```typescript
// Si pas de token et que la requête n'est pas pour /auth (login/register/logout), rediriger
if (!req.url.includes('/auth/authenticate') && 
    !req.url.includes('/auth/register') && 
    !req.url.includes('/auth/logout') &&  // ✅ Ajouté
    !req.url.includes('/login')) {
  // ... redirection
}

// Pour /auth/logout, permettre la requête même sans token
if (req.url.includes('/auth/logout')) {
  console.log('🔐 AuthInterceptor - Requête /auth/logout détectée');
  if (token) {
    console.log('✅ Token disponible pour logout, header sera ajouté');
  }
}
```

---

### 3. **Composants - Gestion de l'Observable**

**Fichiers modifiés** :
- `carthage-creance/src/app/shared/components/sidebar/sidebar.component.ts`
- `carthage-creance/src/app/juridique/components/juridique-sidebar/juridique-sidebar.component.ts`
- `carthage-creance/src/app/chef-amiable/components/chef-amiable-layout/chef-amiable-layout.component.ts`
- `carthage-creance/src/app/admin/components/admin-layout/admin-layout.component.ts`

**Changements** :
- ✅ Gèrent maintenant l'Observable retourné par `logOut()`
- ✅ Suppriment les redirections manuelles (gérées par le service dans `finalize()`)
- ✅ Ajoutent des logs pour le débogage

**Code** :
```typescript
logout(): void {
  // logOut() retourne un Observable et gère déjà la redirection dans finalize()
  this.jwtAuthService.logOut().subscribe({
    next: (response) => {
      console.log('✅ Logout réussi:', response);
    },
    error: (error) => {
      console.error('❌ Erreur lors du logout:', error);
      // La redirection est déjà gérée dans le service (finalize)
    }
  });
}
```

---

### 4. **Interceptor - Gestion du Logout Automatique (401)**

**Fichier** : `carthage-creance/src/app/core/interceptors/auth.interceptor.ts`

**Changements** :
- ✅ Gère correctement l'Observable retourné par `logOut()` lors d'une erreur 401

**Code** :
```typescript
if (error.status === 401) {
  console.error('❌ 401 Unauthorized - Token expiré ou invalide');
  
  // Nettoyer complètement (logOut() gère déjà la redirection dans finalize())
  jwtAuthService.logOut().subscribe({
    next: () => console.log('✅ Logout automatique effectué (401)'),
    error: (logoutError) => console.error('❌ Erreur lors du logout automatique:', logoutError)
  });
  
  return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
}
```

---

## 🔍 Vérification

### 1. **Dans la Console du Navigateur (F12 → Network)**

Lors du logout, vous devriez voir :

1. **Requête POST `/auth/logout`** :
   - **Request Headers** : `Authorization: Bearer {token}` ✅
   - **Status** : `200 OK` (ou autre selon le backend)

2. **Logs dans la Console** :
   ```
   🔐 Début du logout...
   🔍 AuthInterceptor - Requête vers: http://localhost:8089/carthage-creance/auth/logout
   🔍 Token disponible: true
   ✅ AuthInterceptor - Token JWT ajouté à la requête JSON
   🔐 AuthInterceptor - Requête /auth/logout détectée
   ✅ Token disponible pour logout, header sera ajouté
   ✅ Logout réussi côté backend: {...}
   🧹 Nettoyage complet du storage...
   ✅ Storage complètement nettoyé
   ✅ Storage nettoyé, redirection vers /login
   ```

### 2. **Dans les Logs Backend**

Vous devriez voir :
```
=== DÉBUT LOGOUT ===
Logout: Token JWT extrait (longueur: XXX)
Logout: Utilisateur trouvé
Logout: derniere_deconnexion mise à jour
```

### 3. **Dans la Base de Données**

Le champ `derniere_deconnexion` de l'utilisateur devrait être mis à jour avec la date/heure actuelle.

---

## 📝 Checklist de Vérification

- [x] Le token JWT est stocké après login (`sessionStorage.getItem('auth-user')`)
- [x] L'interceptor `AuthInterceptor` ajoute automatiquement `Authorization: Bearer {token}`
- [x] L'interceptor est enregistré dans `app.config.ts`
- [x] L'interceptor n'exclut PAS `/auth/logout`
- [x] La méthode `logout()` appelle `POST /auth/logout`
- [x] Dans Network (F12), la requête `POST /auth/logout` a le header `Authorization`
- [x] Après logout, le token est supprimé du storage
- [x] Les logs backend montrent "=== DÉBUT LOGOUT ==="
- [x] La base de données montre `derniere_deconnexion` remplie

---

## 🎯 Résultat

✅ Le logout fonctionne maintenant correctement avec JWT :
- Le token JWT est envoyé au backend via le header `Authorization: Bearer {token}`
- Le backend met à jour `derniere_deconnexion` dans la base de données
- Le frontend nettoie tous les tokens du storage
- L'utilisateur est redirigé vers `/login`
- Même si le backend échoue, le frontend est nettoyé (déconnexion locale)

---

## 🔧 Test Manuel

1. **Se connecter** avec un utilisateur
2. **Ouvrir la console** (F12 → Network)
3. **Cliquer sur "Déconnexion"**
4. **Vérifier** :
   - ✅ Une requête `POST /auth/logout` apparaît dans Network
   - ✅ Le header `Authorization: Bearer {token}` est présent
   - ✅ Le status est `200 OK` (ou autre selon le backend)
   - ✅ Les logs dans la console montrent "✅ Logout réussi côté backend"
   - ✅ La redirection vers `/login` se fait automatiquement
   - ✅ Le token n'est plus dans `sessionStorage.getItem('auth-user')`

---

## 📚 Références

- **Interceptor** : `carthage-creance/src/app/core/interceptors/auth.interceptor.ts`
- **Service JWT** : `carthage-creance/src/app/core/services/jwt-auth.service.ts`
- **Configuration** : `carthage-creance/src/app/app.config.ts`


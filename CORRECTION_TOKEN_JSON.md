# 🔧 Correction : Token JWT Stocké comme Objet JSON

## 🐛 Problème Identifié

Le token JWT était stocké dans `sessionStorage.getItem('auth-user')` comme un objet JSON stringifié `{"token":"eyJ..."}` au lieu du token JWT directement `eyJ...`.

**Conséquence** : L'interceptor envoyait `Authorization: Bearer {"token":"eyJ..."}` au lieu de `Authorization: Bearer eyJ...`, ce qui faisait échouer l'authentification côté backend.

**Symptômes** :
- ✅ Le logout fonctionne dans Postman (token envoyé correctement)
- ❌ Le logout ne fonctionne pas depuis le frontend (token mal formaté)
- ❌ `derniere_deconnexion` reste NULL dans la base de données

---

## ✅ Solution Implémentée

### 1. **Fonction `extractJwtToken()` dans l'Interceptor**

**Fichier** : `carthage-creance/src/app/core/interceptors/auth.interceptor.ts`

**Fonction** : Extrait le token JWT même si `auth-user` contient un objet JSON.

```typescript
function extractJwtToken(): string | null {
  const authUser = sessionStorage.getItem('auth-user');
  if (!authUser) {
    return null;
  }

  // Si c'est déjà un token JWT (commence par "eyJ" pour JWT standard)
  if (authUser.startsWith('eyJ')) {
    return authUser;
  }

  // Si c'est un objet JSON stringifié, essayer de le parser
  try {
    const parsed = JSON.parse(authUser);
    // Chercher le token dans différentes propriétés possibles
    const token = parsed.accessToken || parsed.token || parsed.access_token || parsed.jwt;
    if (token && typeof token === 'string' && token.startsWith('eyJ')) {
      console.warn('⚠️ Token trouvé dans un objet JSON, extraction du token JWT');
      return token;
    }
  } catch (e) {
    // Ce n'est pas du JSON, retourner null
  }

  return null;
}
```

### 2. **Fonction `extractJwtToken()` dans le Service**

**Fichier** : `carthage-creance/src/app/core/services/jwt-auth.service.ts`

**Fonction** : Même logique que l'interceptor pour extraire le token JWT.

**Utilisation** :
- `getToken()` utilise maintenant `extractJwtToken()`
- `isUserLoggedIn()` utilise `getToken()`
- `loggedUserAuthority()` utilise `getToken()`
- `getCurrentUser()` utilise `getToken()`
- `getCurrentUserId()` utilise `getToken()`
- `logOut()` utilise `getToken()`

### 3. **Correction du Login Component**

**Fichier** : `carthage-creance/src/app/auth/components/login/login.component.ts`

**Changements** :
- ✅ Stocke **SEULEMENT** le token JWT dans `auth-user` (pas l'objet complet)
- ✅ Extrait le token depuis `data.accessToken` ou `data.token`
- ✅ Ne stocke plus l'objet complet dans `auth-user`

**Code** :
```typescript
// 🔧 CORRECTION: Extraire le token JWT (peut être dans accessToken ou token)
const jwtToken = data.accessToken || data.token || (data as any)?.access_token || (data as any)?.token;

if (!jwtToken) {
  console.error('❌ Aucun token JWT trouvé dans la réponse:', data);
  this.toastService.error('Erreur: Token non reçu du serveur');
  this.invalidLogin = true;
  return;
}

// 🔧 Stocker le token JWT dans auth-token
this.tokenStorage.saveToken(jwtToken);

// 🔧 IMPORTANT: Stocker SEULEMENT le token JWT (pas l'objet complet) dans auth-user
sessionStorage.setItem('auth-user', jwtToken);
```

---

## 🔍 Vérification

### 1. **Dans la Console (F12 → Console)**

Après le login, vous devriez voir :
```
✅ Token JWT stocké dans auth-user: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Pas** :
```
❌ Token (premiers caractères): {"token":"eyJ...
```

### 2. **Dans Network (F12 → Network)**

Lors du logout, vérifiez la requête `POST /auth/logout` :

**Request Headers** :
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... ✅
```

**Pas** :
```
Authorization: Bearer {"token":"eyJ... ❌
```

### 3. **Dans la Base de Données**

Après le logout, `derniere_deconnexion` devrait être remplie :
```sql
SELECT id, email, derniere_connexion, derniere_deconnexion 
FROM utilisateur 
WHERE email = 'votre_email@example.com';
```

---

## 📝 Fichiers Modifiés

1. ✅ `carthage-creance/src/app/core/interceptors/auth.interceptor.ts`
   - Ajout de `extractJwtToken()` pour extraire le token JWT même depuis un objet JSON

2. ✅ `carthage-creance/src/app/core/services/jwt-auth.service.ts`
   - Ajout de `extractJwtToken()` (méthode privée)
   - `getToken()` utilise maintenant `extractJwtToken()`
   - Toutes les méthodes utilisent `getToken()` au lieu de `sessionStorage.getItem('auth-user')` directement

3. ✅ `carthage-creance/src/app/auth/components/login/login.component.ts`
   - Stocke **SEULEMENT** le token JWT dans `auth-user`
   - Ne stocke plus l'objet complet dans `auth-user`

---

## 🎯 Résultat Attendu

Après ces corrections :

1. ✅ Le token JWT est stocké directement dans `auth-user` (pas comme objet JSON)
2. ✅ L'interceptor envoie `Authorization: Bearer eyJ...` (format correct)
3. ✅ Le backend reçoit le token correctement
4. ✅ `derniere_deconnexion` est mise à jour dans la base de données
5. ✅ Le logout fonctionne depuis le frontend comme depuis Postman

---

## 🧪 Test

1. **Se connecter** à l'application
2. **Ouvrir F12 → Console** et vérifier :
   ```
   ✅ Token JWT stocké dans auth-user: eyJ...
   ```
3. **Ouvrir F12 → Network**
4. **Cliquer sur "Déconnexion"**
5. **Vérifier la requête `POST /auth/logout`** :
   - Header `Authorization: Bearer eyJ...` (pas `Bearer {"token":"..."}`)
   - Status: `200 OK`
6. **Vérifier dans la base de données** :
   - `derniere_deconnexion` est remplie ✅

---

## 🔄 Compatibilité

La fonction `extractJwtToken()` est **rétrocompatible** :
- ✅ Si `auth-user` contient directement le token JWT → retourne le token
- ✅ Si `auth-user` contient un objet JSON → extrait le token depuis `accessToken`, `token`, `access_token`, ou `jwt`
- ✅ Si `auth-user` est vide ou invalide → retourne `null`

Cela garantit que le code fonctionne même si le token est stocké dans différents formats.


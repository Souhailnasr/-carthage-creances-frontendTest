# 🔍 Guide : Comment Vérifier si un Endpoint Backend Existe

## 📋 Méthodes de Vérification

### 1. **Vérifier dans la Console du Navigateur** (Méthode la plus simple)

Ouvrez la console du navigateur (F12) et regardez les messages :

#### ✅ Si l'endpoint existe :
```
📤 Récupération des dossiers recouvrement amiable: http://localhost:8089/carthage-creance/api/dossiers/recouvrement-amiable
```

#### ❌ Si l'endpoint n'existe pas :
```
📤 Récupération des dossiers recouvrement amiable: http://localhost:8089/carthage-creance/api/dossiers/recouvrement-amiable
⚠️ Endpoint /recouvrement-amiable non disponible, utilisation de getAllDossiers avec filtre côté client
```

### 2. **Vérifier dans les Logs Backend**

Regardez les logs de votre application Spring Boot. Si vous voyez :
```
Method parameter 'id': Failed to convert value of type 'java.lang.String' to required type 'java.lang.Long'; For input string: "recouvrement-amiable"
```

Cela signifie que Spring essaie d'interpréter `recouvrement-amiable` comme un ID numérique, donc l'endpoint n'existe pas.

### 3. **Tester avec Postman ou cURL**

#### Avec cURL :
```bash
# Tester l'endpoint recouvrement-amiable
curl -X GET "http://localhost:8089/carthage-creance/api/dossiers/recouvrement-amiable?page=0&size=10" \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"

# Si l'endpoint n'existe pas, vous obtiendrez :
# - 404 Not Found
# - 400 Bad Request (si Spring essaie de l'interpréter comme un ID)
# - 500 Internal Server Error
```

#### Avec Postman :
1. Créez une nouvelle requête GET
2. URL : `http://localhost:8089/carthage-creance/api/dossiers/recouvrement-amiable?page=0&size=10`
3. Headers : `Authorization: Bearer VOTRE_TOKEN_JWT`
4. Envoyez la requête
5. Si vous obtenez 404, 400 ou 500 → l'endpoint n'existe pas

### 4. **Vérifier dans le Code Backend (Spring Controller)**

Cherchez dans votre projet backend Java :

```java
// Cherchez un contrôleur comme :
@RestController
@RequestMapping("/api/dossiers")
public class DossierController {
    
    // Cherchez une méthode comme :
    @GetMapping("/recouvrement-amiable")
    public ResponseEntity<Page<Dossier>> getDossiersRecouvrementAmiable(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size
    ) {
        // ...
    }
}
```

**Si cette méthode n'existe pas** → l'endpoint n'est pas implémenté.

### 5. **Vérifier avec l'Explorateur de Réseau du Navigateur**

1. Ouvrez les DevTools (F12)
2. Allez dans l'onglet **Network** (Réseau)
3. Rechargez la page ou déclenchez l'action
4. Cherchez la requête vers `/recouvrement-amiable`
5. Regardez le **Status Code** :
   - **200 OK** → L'endpoint existe et fonctionne ✅
   - **404 Not Found** → L'endpoint n'existe pas ❌
   - **400 Bad Request** → L'endpoint n'existe pas (Spring essaie de l'interpréter comme un ID) ❌
   - **500 Internal Server Error** → L'endpoint n'existe pas ou il y a une erreur ❌

### 6. **Vérifier avec Swagger/OpenAPI (si disponible)**

Si votre backend expose une documentation Swagger :
1. Accédez à `http://localhost:8089/swagger-ui.html` ou similaire
2. Cherchez l'endpoint `/api/dossiers/recouvrement-amiable`
3. S'il n'apparaît pas dans la liste → l'endpoint n'existe pas

### 7. **Vérifier les Erreurs dans la Console Frontend**

Le code frontend gère déjà les erreurs et affiche des messages :

```typescript
// Dans dossier-api.service.ts
catchError((error) => {
  if (error.status === 404 || error.status === 500 || error.status === 400) {
    console.warn('⚠️ Endpoint /recouvrement-amiable non disponible...');
    // Fallback activé
  }
})
```

## 🎯 Endpoints à Vérifier

### Endpoints Actuellement Utilisés dans le Frontend :

1. **GET `/api/dossiers/recouvrement-amiable`**
   - Utilisé par : `getDossiersRecouvrementAmiable()`
   - Fallback : `getAllDossiers()` avec filtre côté client

2. **GET `/api/dossiers/recouvrement-juridique`**
   - Utilisé par : `getDossiersRecouvrementJuridique()`
   - Fallback : `getAllDossiers()` avec filtre côté client

3. **PUT `/api/dossiers/{id}/affecter/recouvrement-amiable`**
   - Utilisé par : `affecterAuRecouvrementAmiable()`
   - Pas de fallback (affiche un message d'erreur)

4. **PUT `/api/dossiers/{id}/affecter/recouvrement-juridique`**
   - Utilisé par : `affecterAuRecouvrementJuridique()`
   - Pas de fallback (affiche un message d'erreur)

5. **PUT `/api/dossiers/{id}/cloturer`**
   - Utilisé par : `cloturerDossier()`
   - Pas de fallback (affiche un message d'erreur)

6. **GET `/api/dossiers/valides-disponibles`**
   - Utilisé par : `getDossiersValidesDisponibles()`
   - Fallback : `getAllDossiers()` avec filtre côté client

## 📝 Script de Test Rapide

Créez un fichier `test-endpoints.html` pour tester rapidement :

```html
<!DOCTYPE html>
<html>
<head>
    <title>Test Endpoints Backend</title>
</head>
<body>
    <h1>Test des Endpoints Backend</h1>
    <button onclick="testEndpoint('/api/dossiers/recouvrement-amiable')">
        Tester /recouvrement-amiable
    </button>
    <button onclick="testEndpoint('/api/dossiers/recouvrement-juridique')">
        Tester /recouvrement-juridique
    </button>
    <div id="result"></div>

    <script>
        async function testEndpoint(endpoint) {
            const url = `http://localhost:8089/carthage-creance${endpoint}?page=0&size=10`;
            const resultDiv = document.getElementById('result');
            
            try {
                const response = await fetch(url, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('token')
                    }
                });
                
                if (response.ok) {
                    resultDiv.innerHTML = `<p style="color: green;">✅ ${endpoint} existe (Status: ${response.status})</p>`;
                } else {
                    resultDiv.innerHTML = `<p style="color: red;">❌ ${endpoint} n'existe pas ou erreur (Status: ${response.status})</p>`;
                }
            } catch (error) {
                resultDiv.innerHTML = `<p style="color: red;">❌ Erreur: ${error.message}</p>`;
            }
        }
    </script>
</body>
</html>
```

## 🔧 Solution : Implémenter les Endpoints dans le Backend

Si les endpoints n'existent pas, voici ce qu'il faut ajouter dans le contrôleur Spring :

```java
@RestController
@RequestMapping("/api/dossiers")
public class DossierController {
    
    @GetMapping("/recouvrement-amiable")
    public ResponseEntity<Page<Dossier>> getDossiersRecouvrementAmiable(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String sort
    ) {
        // Implémentation à ajouter
        // Filtrer les dossiers avec typeRecouvrement = AMIABLE
        // ou utiliser les heuristiques (pas d'avocat, pas d'huissier, etc.)
    }
    
    @GetMapping("/recouvrement-juridique")
    public ResponseEntity<Page<Dossier>> getDossiersRecouvrementJuridique(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(required = false) String sort
    ) {
        // Implémentation à ajouter
        // Filtrer les dossiers avec typeRecouvrement = JURIDIQUE
        // ou utiliser les heuristiques (a un avocat ou un huissier)
    }
}
```

## ✅ Résumé

**Méthode la plus rapide** : Ouvrir la console du navigateur (F12) et regarder les messages `⚠️` qui indiquent que l'endpoint n'est pas disponible.

**Méthode la plus fiable** : Tester avec Postman ou cURL pour voir le code de statut HTTP exact.


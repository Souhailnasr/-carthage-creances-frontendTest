# Corrections Backend Nécessaires

## 🚨 **Problèmes Identifiés**

### 1. **Endpoint `/api/auth/login` Inexistant**
```
No static resource api/auth/login
```

### 2. **Endpoint `/api/utilisateurs/by-email/{email}` Potentiellement Inexistant**
Le frontend essaie d'appeler cet endpoint pour récupérer l'ID utilisateur.

## 🛠️ **Corrections Backend Requises**

### 1. **Créer l'Endpoint de Login**

#### **Option A: Endpoint `/api/auth/login`**
```java
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            // Votre logique d'authentification existante
            // Retourner le token et les données utilisateur
            
            LoginResponse response = new LoginResponse();
            response.setToken(jwtToken);
            response.setUser(user); // Inclure l'ID utilisateur
            response.setExpiresIn(expirationTime);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Identifiants invalides"));
        }
    }
}
```

#### **Option B: Utiliser l'Endpoint Existant**
Si vous avez déjà un endpoint de login, vérifiez qu'il retourne bien l'ID utilisateur :

```java
// Dans votre réponse de login existante
public class LoginResponse {
    private String token;
    private User user; // Assurez-vous que l'ID est inclus
    private long expiresIn;
    
    // Getters et setters
}
```

### 2. **Créer l'Endpoint `/api/utilisateurs/by-email/{email}`**

```java
@RestController
@RequestMapping("/api/utilisateurs")
@CrossOrigin(origins = "*")
public class UtilisateurController {

    @GetMapping("/by-email/{email}")
    public ResponseEntity<?> getUtilisateurByEmail(@PathVariable String email) {
        try {
            Optional<Utilisateur> utilisateur = utilisateurService.findByEmail(email);
            
            if (utilisateur.isPresent()) {
                UtilisateurResponse response = new UtilisateurResponse();
                response.setId(utilisateur.get().getId());
                response.setNom(utilisateur.get().getNom());
                response.setPrenom(utilisateur.get().getPrenom());
                response.setEmail(utilisateur.get().getEmail());
                response.setRole(utilisateur.get().getRole());
                
                return ResponseEntity.ok(response);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Erreur lors de la récupération de l'utilisateur"));
        }
    }
}
```

### 3. **Modèle de Réponse Utilisateur**

```java
public class UtilisateurResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String role;
    
    // Constructeurs, getters et setters
}
```

### 4. **Service Utilisateur**

```java
@Service
public class UtilisateurService {
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    public Optional<Utilisateur> findByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }
}
```

### 5. **Repository Utilisateur**

```java
@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    Optional<Utilisateur> findByEmail(String email);
}
```

## 🔍 **Vérifications à Effectuer**

### 1. **Vérifier les Endpoints Existants**
```bash
# Vérifier quels endpoints existent
curl -X GET http://localhost:8089/carthage-creance/api/auth/login
curl -X GET http://localhost:8089/carthage-creance/api/utilisateurs/by-email/test@example.com
```

### 2. **Vérifier la Structure de la Base de Données**
```sql
-- Vérifier que la table utilisateur existe et contient les bonnes colonnes
DESCRIBE utilisateur;

-- Vérifier qu'il y a des utilisateurs avec des emails
SELECT id, nom, prenom, email, role FROM utilisateur LIMIT 5;
```

### 3. **Vérifier les Logs Backend**
Rechercher dans les logs :
- Erreurs de mapping d'endpoints
- Erreurs de base de données
- Erreurs d'authentification

## 🚀 **Ordre de Priorité**

1. **URGENT** : Créer l'endpoint `/api/auth/login` ou corriger l'existant
2. **IMPORTANT** : Créer l'endpoint `/api/utilisateurs/by-email/{email}`
3. **VÉRIFICATION** : Tester les endpoints avec Postman ou curl
4. **TEST** : Tester la connexion depuis le frontend

## 📋 **Tests à Effectuer**

### Test 1: Endpoint de Login
```bash
curl -X POST http://localhost:8089/carthage-creance/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"souhailnsrpro98@gmail.com","password":"votre_mot_de_passe"}'
```

### Test 2: Endpoint Utilisateur par Email
```bash
curl -X GET http://localhost:8089/carthage-creance/api/utilisateurs/by-email/souhailnsrpro98@gmail.com \
  -H "Authorization: Bearer VOTRE_TOKEN"
```

## ✅ **Résultat Attendu**

Après ces corrections :
- ✅ Le frontend pourra se connecter via `/api/auth/login`
- ✅ Le frontend pourra récupérer l'ID utilisateur via `/api/utilisateurs/by-email/{email}`
- ✅ L'`agent_createur_id` sera correctement rempli avec l'ID réel
- ✅ Plus d'erreurs "No static resource" dans les logs backend




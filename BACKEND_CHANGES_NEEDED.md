# 🔧 Changements Backend Nécessaires

## 🎯 Problèmes Identifiés

### **1. Erreur 500 sur `/api/dossiers`**
- **Problème** : L'endpoint `/api/dossiers` retourne une erreur 500 (Internal Server Error)
- **Cause probable** : Le backend ne gère pas correctement les requêtes sans paramètres ou avec des paramètres invalides

### **2. Endpoint manquant pour récupérer l'ID utilisateur par email**
- **Problème** : Le frontend ne peut pas récupérer l'ID utilisateur depuis l'email du token
- **Solution** : Créer un endpoint `/api/utilisateurs/by-email/{email}`

## 🚀 Solutions Backend à Implémenter

### **1. Corriger l'endpoint `/api/dossiers`**

```java
@GetMapping
public ResponseEntity<List<DossierApi>> getAllDossiers(
    @RequestParam(required = false) String role,
    @RequestParam(required = false) Long userId
) {
    try {
        List<DossierApi> dossiers;
        
        if (role != null && userId != null) {
            // Filtrer par rôle et utilisateur
            dossiers = dossierService.getDossiersByRoleAndUser(role, userId);
        } else if (role != null) {
            // Filtrer par rôle seulement
            dossiers = dossierService.getDossiersByRole(role);
        } else {
            // Retourner tous les dossiers
            dossiers = dossierService.getAllDossiers();
        }
        
        return ResponseEntity.ok(dossiers);
    } catch (Exception e) {
        log.error("Erreur lors de la récupération des dossiers", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Collections.emptyList());
    }
}
```

### **2. Créer l'endpoint pour récupérer l'ID utilisateur par email**

```java
@GetMapping("/by-email/{email}")
public ResponseEntity<UtilisateurResponse> getUtilisateurByEmail(@PathVariable String email) {
    try {
        Utilisateur utilisateur = utilisateurService.findByEmail(email);
        if (utilisateur != null) {
            UtilisateurResponse response = new UtilisateurResponse();
            response.setId(utilisateur.getId());
            response.setNom(utilisateur.getNom());
            response.setPrenom(utilisateur.getPrenom());
            response.setEmail(utilisateur.getEmail());
            response.setRole(utilisateur.getRole());
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.notFound().build();
        }
    } catch (Exception e) {
        log.error("Erreur lors de la récupération de l'utilisateur par email: " + email, e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

### **3. Classe de réponse UtilisateurResponse**

```java
public class UtilisateurResponse {
    private Long id;
    private String nom;
    private String prenom;
    private String email;
    private String role;
    
    // Getters et setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    
    public String getNom() { return nom; }
    public void setNom(String nom) { this.nom = nom; }
    
    public String getPrenom() { return prenom; }
    public void setPrenom(String prenom) { this.prenom = prenom; }
    
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}
```

### **4. Méthodes dans UtilisateurService**

```java
@Service
public class UtilisateurService {
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    public Utilisateur findByEmail(String email) {
        return utilisateurRepository.findByEmail(email);
    }
    
    public Optional<Utilisateur> findById(Long id) {
        return utilisateurRepository.findById(id);
    }
}
```

### **5. Méthodes dans DossierService**

```java
@Service
public class DossierService {
    
    @Autowired
    private DossierRepository dossierRepository;
    
    public List<DossierApi> getAllDossiers() {
        List<Dossier> dossiers = dossierRepository.findAll();
        return dossiers.stream()
            .map(this::convertToApi)
            .collect(Collectors.toList());
    }
    
    public List<DossierApi> getDossiersByRole(String role) {
        // Logique pour filtrer par rôle
        List<Dossier> dossiers = dossierRepository.findByRole(role);
        return dossiers.stream()
            .map(this::convertToApi)
            .collect(Collectors.toList());
    }
    
    public List<DossierApi> getDossiersByRoleAndUser(String role, Long userId) {
        // Logique pour filtrer par rôle et utilisateur
        List<Dossier> dossiers = dossierRepository.findByRoleAndUser(role, userId);
        return dossiers.stream()
            .map(this::convertToApi)
            .collect(Collectors.toList());
    }
    
    private DossierApi convertToApi(Dossier dossier) {
        // Conversion de l'entité vers l'API
        DossierApi api = new DossierApi();
        api.setId(dossier.getId());
        api.setTitre(dossier.getTitre());
        api.setNumeroDossier(dossier.getNumeroDossier());
        api.setMontantCreance(dossier.getMontantCreance());
        // ... autres propriétés
        return api;
    }
}
```

## 🔍 Endpoints Backend Requis

### **1. Endpoints Dossiers**
- `GET /api/dossiers` - Tous les dossiers
- `GET /api/dossiers?role=CHEF` - Dossiers par rôle
- `GET /api/dossiers?role=CHEF&userId=123` - Dossiers par rôle et utilisateur
- `POST /api/dossiers` - Créer un dossier
- `PUT /api/dossiers/{id}` - Modifier un dossier
- `DELETE /api/dossiers/{id}` - Supprimer un dossier
- `PUT /api/dossiers/{id}/valider` - Valider un dossier
- `PUT /api/dossiers/{id}/rejeter` - Rejeter un dossier
- `PUT /api/dossiers/{id}/cloturer` - Clôturer un dossier

### **2. Endpoints Utilisateurs**
- `GET /api/utilisateurs/by-email/{email}` - Récupérer utilisateur par email
- `GET /api/utilisateurs/{id}` - Récupérer utilisateur par ID

### **3. Endpoints Validation**
- `GET /api/validation/dossiers` - Toutes les validations
- `POST /api/validation/dossiers` - Créer une validation
- `PUT /api/validation/dossiers/{id}` - Modifier une validation
- `DELETE /api/validation/dossiers/{id}` - Supprimer une validation
- `POST /api/validation/dossiers/{id}/valider` - Valider un dossier
- `POST /api/validation/dossiers/{id}/rejeter` - Rejeter un dossier

## 🎯 Priorités d'Implémentation

### **Phase 1 (Critique)**
1. ✅ Corriger l'endpoint `/api/dossiers` pour éviter l'erreur 500
2. ✅ Créer l'endpoint `/api/utilisateurs/by-email/{email}`
3. ✅ Tester la récupération des dossiers

### **Phase 2 (Fonctionnalités)**
1. ✅ Implémenter les endpoints de validation
2. ✅ Ajouter la gestion des erreurs appropriée
3. ✅ Tester tous les CRUD operations

### **Phase 3 (Optimisation)**
1. ✅ Ajouter la pagination
2. ✅ Implémenter les filtres avancés
3. ✅ Ajouter la recherche textuelle

## 🚨 Points d'Attention

1. **Gestion des erreurs** : Tous les endpoints doivent retourner des erreurs HTTP appropriées
2. **Validation des paramètres** : Vérifier que les paramètres sont valides
3. **Sécurité** : Vérifier les permissions utilisateur pour chaque endpoint
4. **Logs** : Ajouter des logs pour le débogage
5. **Tests** : Tester tous les endpoints avec Postman ou un client REST

## 📝 Notes Techniques

- **Base URL** : `http://localhost:8089/carthage-creance`
- **Headers requis** : `Authorization: Bearer {token}`
- **Format de réponse** : JSON
- **Gestion des erreurs** : Codes HTTP standards (200, 400, 401, 403, 404, 500)




























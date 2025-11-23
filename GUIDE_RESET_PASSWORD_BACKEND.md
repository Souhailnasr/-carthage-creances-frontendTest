# 🔐 Guide - Réinitialisation Mot de Passe Backend

## 📋 Problème : Bad Credentials

L'erreur "Bad credentials" signifie que le mot de passe hashé en base de données ne correspond pas au mot de passe saisi.

---

## 🔧 Solution 1 : Script SQL pour Réinitialiser le Mot de Passe

### Étape 1 : Générer un Hash BCrypt

**Option A : Utiliser un outil en ligne**
1. Aller sur https://bcrypt-generator.com/
2. Entrer le nombre de rounds : `10`
3. Entrer le mot de passe : `Souhail01`
4. Cliquer sur "Generate Hash"
5. Copier le hash généré (commence par `$2a$10$...`)

**Option B : Utiliser Java**
```java
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class PasswordHashGenerator {
    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);
        String password = "Souhail01";
        String hash = encoder.encode(password);
        System.out.println("Hash BCrypt pour '" + password + "':");
        System.out.println(hash);
    }
}
```

### Étape 2 : Mettre à Jour en Base de Données

```sql
-- Remplacer 'VOTRE_HASH_BCRYPT' par le hash généré
UPDATE utilisateur 
SET mot_de_passe = 'VOTRE_HASH_BCRYPT'
WHERE email = 'ayechi.fahmi@gmail.com';

-- Vérifier la mise à jour
SELECT email, 
       LEFT(mot_de_passe, 10) as hash_prefix,
       LENGTH(mot_de_passe) as longueur
FROM utilisateur 
WHERE email = 'ayechi.fahmi@gmail.com';
```

---

## 🔧 Solution 2 : Créer un Endpoint de Réinitialisation (Recommandé)

### Backend : Créer le Controller

```java
@RestController
@RequestMapping("/auth")
public class AuthenticationController {
    
    @Autowired
    private AuthenticationService authenticationService;
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    /**
     * Réinitialiser le mot de passe d'un utilisateur (pour admin)
     */
    @PostMapping("/reset-password")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        try {
            Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));
            
            // Hasher le nouveau mot de passe
            String hashedPassword = passwordEncoder.encode(request.getNewPassword());
            utilisateur.setMotDePasse(hashedPassword);
            utilisateurRepository.save(utilisateur);
            
            return ResponseEntity.ok(Map.of(
                "message", "Mot de passe réinitialisé avec succès",
                "email", utilisateur.getEmail()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Erreur lors de la réinitialisation", "message", e.getMessage()));
        }
    }
}

// DTO pour la requête
public class ResetPasswordRequest {
    private String email;
    private String newPassword;
    
    // Getters et setters
}
```

### Frontend : Créer un Service de Réinitialisation

```typescript
// Dans auth.service.ts
resetPassword(email: string, newPassword: string): Observable<any> {
  return this.http.post(`${this.apiUrl}/reset-password`, {
    email,
    newPassword
  });
}
```

---

## 🔧 Solution 3 : Vérifier et Corriger le Format du Hash

### Vérifier le Format Actuel

```sql
SELECT 
    email,
    mot_de_passe,
    CASE 
        WHEN mot_de_passe LIKE '$2a$%' THEN 'BCrypt (2a)'
        WHEN mot_de_passe LIKE '$2b$%' THEN 'BCrypt (2b)'
        WHEN mot_de_passe LIKE '$2y$%' THEN 'BCrypt (2y)'
        WHEN LENGTH(mot_de_passe) < 50 THEN 'Probablement non hashé'
        ELSE 'Format inconnu'
    END as format_hash,
    LENGTH(mot_de_passe) as longueur
FROM utilisateur
WHERE email = 'ayechi.fahmi@gmail.com';
```

### Si le Mot de Passe n'est Pas Hashé

**Script Java pour hasher tous les mots de passe en texte brut :**

```java
@Service
public class PasswordMigrationService {
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Transactional
    public void migratePasswords() {
        List<Utilisateur> users = utilisateurRepository.findAll();
        
        for (Utilisateur user : users) {
            String password = user.getMotDePasse();
            
            // Vérifier si déjà hashé
            if (!password.startsWith("$2a$") && !password.startsWith("$2b$")) {
                // Hasher le mot de passe
                String hashedPassword = passwordEncoder.encode(password);
                user.setMotDePasse(hashedPassword);
                utilisateurRepository.save(user);
                System.out.println("Mot de passe hashé pour: " + user.getEmail());
            }
        }
    }
}
```

---

## 🔧 Solution 4 : Vérifier la Configuration Spring Security

### Vérifier PasswordEncoder

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        // Utiliser BCrypt avec 10 rounds (défaut)
        return new BCryptPasswordEncoder(10);
    }
    
    // ... reste de la configuration
}
```

### Vérifier UserDetailsService

```java
@Service
public class UserDetailsServiceImpl implements UserDetailsService {
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Override
    @Transactional
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé: " + email));
        
        // Vérifier que le mot de passe est bien chargé
        String password = utilisateur.getMotDePasse();
        if (password == null || password.isEmpty()) {
            throw new IllegalStateException("Mot de passe manquant pour l'utilisateur: " + email);
        }
        
        // Vérifier le format du hash
        if (!password.startsWith("$2a$") && !password.startsWith("$2b$")) {
            throw new IllegalStateException("Format de mot de passe invalide pour: " + email);
        }
        
        // Construire les authorities
        RoleUtilisateur role = utilisateur.getRoleUtilisateur();
        if (role == null) {
            throw new IllegalStateException("Rôle manquant pour: " + email);
        }
        
        List<GrantedAuthority> authorities = Collections.singletonList(
            new SimpleGrantedAuthority(role.getNomRole())
        );
        
        return User.builder()
            .username(utilisateur.getEmail())
            .password(utilisateur.getMotDePasse())
            .authorities(authorities)
            .accountExpired(false)
            .accountLocked(false)
            .credentialsExpired(false)
            .disabled(!utilisateur.isActif())
            .build();
    }
}
```

---

## 🧪 Test de Vérification

### Test 1 : Vérifier le Hash

```sql
-- Vérifier que le hash est au format BCrypt
SELECT 
    email,
    CASE 
        WHEN mot_de_passe LIKE '$2a$10$%' THEN '✅ BCrypt valide (2a, 10 rounds)'
        WHEN mot_de_passe LIKE '$2b$10$%' THEN '✅ BCrypt valide (2b, 10 rounds)'
        WHEN mot_de_passe LIKE '$2a$%' THEN '⚠️ BCrypt mais nombre de rounds différent'
        WHEN mot_de_passe LIKE '$2b$%' THEN '⚠️ BCrypt mais nombre de rounds différent'
        ELSE '❌ Format invalide - Doit être hashé avec BCrypt'
    END as verification,
    LENGTH(mot_de_passe) as longueur
FROM utilisateur
WHERE email = 'ayechi.fahmi@gmail.com';
```

### Test 2 : Tester la Correspondance

**Avec Java :**
```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String password = "Souhail01";
String hashFromDB = "VOTRE_HASH_DE_LA_BASE";

boolean matches = encoder.matches(password, hashFromDB);
System.out.println("Le mot de passe correspond: " + matches);
```

---

## 📋 Checklist de Résolution

- [ ] **Vérifier le format du hash** en base de données
- [ ] **Générer un nouveau hash BCrypt** pour "Souhail01"
- [ ] **Mettre à jour le mot de passe** en base avec le nouveau hash
- [ ] **Vérifier PasswordEncoder** dans la configuration Spring Security
- [ ] **Vérifier UserDetailsService** charge correctement le mot de passe
- [ ] **Tester la connexion** avec Postman/curl
- [ ] **Vérifier les logs backend** pour d'autres erreurs

---

## 🔐 Exemple de Hash BCrypt Valide

**Pour le mot de passe "Souhail01" :**
```
$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
```

**Format :**
- `$2a$` = Version BCrypt
- `10` = Nombre de rounds (2^10 = 1024 itérations)
- `N9qo8uLOickgx2ZMRZoMye` = Salt (22 caractères)
- `IjZAgcfl7p92ldGxad68LJZdL17lhWy` = Hash (31 caractères)

**Longueur totale :** 60 caractères

---

## ⚠️ Important

1. **Ne jamais stocker les mots de passe en texte brut**
2. **Toujours utiliser BCryptPasswordEncoder**
3. **Vérifier que le nombre de rounds correspond** (généralement 10)
4. **Tester après chaque modification**

---

**Une fois le mot de passe corrigé en base, la connexion devrait fonctionner !**


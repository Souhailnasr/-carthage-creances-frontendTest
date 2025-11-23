# 🔧 Solution - Erreur "Bad credentials" Chef Financier

## ❌ Problème

**Erreur backend :**
```
BadCredentialsException: Bad credentials
at DaoAuthenticationProvider.additionalAuthenticationChecks
```

**Cause :** Le mot de passe saisi ne correspond pas au mot de passe hashé en base de données.

---

## 🔍 Diagnostic

### 1. Vérifier le Mot de Passe en Base de Données

**Requête SQL :**
```sql
SELECT 
    u.id,
    u.email,
    u.mot_de_passe,  -- Voir le hash
    u.actif
FROM utilisateur u
WHERE u.email = 'ayechi.fahmi@gmail.com';
```

**Vérifications :**
- ✅ Le mot de passe est hashé (commence par `$2a$`, `$2b$`, ou similaire pour BCrypt)
- ✅ Le format correspond à l'algorithme utilisé par Spring Security

---

### 2. Vérifier l'Algorithme de Hash

**Dans le backend, vérifier :**
```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder(); // ou BCryptPasswordEncoder(10)
}
```

**Vérifier que le hash en base correspond à BCrypt :**
- Format BCrypt : `$2a$10$...` ou `$2b$10$...`
- Longueur : ~60 caractères

---

### 3. Solutions Possibles

### Solution 1 : Réinitialiser le Mot de Passe

**Option A : Via SQL (si vous connaissez le hash BCrypt du mot de passe)**

```sql
-- Générer un hash BCrypt pour "Souhail01" (utiliser un outil en ligne ou Java)
-- Exemple de hash BCrypt pour "Souhail01" :
-- $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

UPDATE utilisateur 
SET mot_de_passe = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
WHERE email = 'ayechi.fahmi@gmail.com';
```

**Option B : Créer un Endpoint de Réinitialisation (Recommandé)**

Créer un endpoint backend pour réinitialiser le mot de passe :

```java
@PostMapping("/auth/reset-password")
public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
    // 1. Vérifier l'utilisateur
    Utilisateur utilisateur = utilisateurRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new EntityNotFoundException("Utilisateur non trouvé"));
    
    // 2. Hasher le nouveau mot de passe
    String hashedPassword = passwordEncoder.encode(request.getNewPassword());
    
    // 3. Mettre à jour
    utilisateur.setMotDePasse(hashedPassword);
    utilisateurRepository.save(utilisateur);
    
    return ResponseEntity.ok(Map.of("message", "Mot de passe réinitialisé avec succès"));
}
```

---

### Solution 2 : Vérifier le Format du Mot de Passe

**Problème possible :** Le mot de passe en base n'est pas hashé ou utilise un autre format.

**Vérification :**
```sql
-- Si le mot de passe n'est pas hashé (texte brut), il faut le hasher
SELECT 
    email,
    mot_de_passe,
    LENGTH(mot_de_passe) as longueur,
    CASE 
        WHEN mot_de_passe LIKE '$2a$%' THEN 'BCrypt'
        WHEN mot_de_passe LIKE '$2b$%' THEN 'BCrypt'
        ELSE 'Non hashé ou autre format'
    END as format
FROM utilisateur
WHERE email = 'ayechi.fahmi@gmail.com';
```

**Si le mot de passe n'est pas hashé :**
- Il faut le hasher avec BCrypt avant de le sauvegarder
- Utiliser `BCryptPasswordEncoder` pour générer le hash

---

### Solution 3 : Utiliser JwtAuthentication (Comme demandé)

Si le backend utilise un système JWT personnalisé au lieu de Spring Security standard, il faut vérifier :

**1. Vérifier le Controller d'Authentification :**

```java
@RestController
@RequestMapping("/auth")
public class AuthenticationController {
    
    @Autowired
    private AuthenticationService authenticationService;
    
    @PostMapping("/authenticate")
    public ResponseEntity<?> authenticate(@RequestBody LoginRequest request) {
        try {
            // Utiliser le service JWT personnalisé
            AuthenticationResponse response = authenticationService.authenticate(
                request.getEmail(),
                request.getPassword()
            );
            return ResponseEntity.ok(response);
        } catch (BadCredentialsException e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "Bad credentials", "message", e.getMessage()));
        }
    }
}
```

**2. Vérifier le Service d'Authentification :**

```java
@Service
public class AuthenticationService {
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    
    public AuthenticationResponse authenticate(String email, String password) {
        // 1. Trouver l'utilisateur
        Utilisateur utilisateur = utilisateurRepository.findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Utilisateur non trouvé"));
        
        // 2. Vérifier le mot de passe
        if (!passwordEncoder.matches(password, utilisateur.getMotDePasse())) {
            throw new BadCredentialsException("Bad credentials");
        }
        
        // 3. Vérifier que l'utilisateur est actif
        if (!utilisateur.isActif()) {
            throw new DisabledException("Compte désactivé");
        }
        
        // 4. Générer le token JWT
        String token = jwtTokenProvider.generateToken(utilisateur);
        
        // 5. Construire la réponse
        return AuthenticationResponse.builder()
            .userId(utilisateur.getId())
            .email(utilisateur.getEmail())
            .nom(utilisateur.getNom())
            .prenom(utilisateur.getPrenom())
            .role(utilisateur.getRoleUtilisateur().getNomRole())
            .accessToken(token)
            .build();
    }
}
```

**3. Vérifier le JwtTokenProvider :**

```java
@Component
public class JwtTokenProvider {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration}")
    private long jwtExpiration;
    
    public String generateToken(Utilisateur utilisateur) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtExpiration);
        
        Claims claims = Jwts.claims().setSubject(utilisateur.getEmail());
        claims.put("userId", utilisateur.getId());
        claims.put("email", utilisateur.getEmail());
        claims.put("nom", utilisateur.getNom());
        claims.put("prenom", utilisateur.getPrenom());
        
        // Ajouter le rôle
        if (utilisateur.getRoleUtilisateur() != null) {
            claims.put("role", Collections.singletonList(
                Map.of("authority", utilisateur.getRoleUtilisateur().getNomRole())
            ));
        }
        
        return Jwts.builder()
            .setClaims(claims)
            .setIssuedAt(now)
            .setExpiration(expiryDate)
            .signWith(SignatureAlgorithm.HS512, jwtSecret)
            .compact();
    }
}
```

---

## 🔧 Actions Immédiates

### 1. Vérifier le Mot de Passe en Base

```sql
-- Voir le hash actuel
SELECT email, mot_de_passe, actif 
FROM utilisateur 
WHERE email = 'ayechi.fahmi@gmail.com';
```

**Si le mot de passe est en texte brut :**
- Il faut le hasher avec BCrypt
- Utiliser un script Java ou un outil en ligne

### 2. Générer un Nouveau Hash BCrypt

**Option A : Utiliser un outil en ligne**
- https://bcrypt-generator.com/
- Entrer "Souhail01"
- Copier le hash généré

**Option B : Utiliser Java**
```java
BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
String hash = encoder.encode("Souhail01");
System.out.println(hash);
```

### 3. Mettre à Jour le Mot de Passe

```sql
-- Remplacer par le hash généré
UPDATE utilisateur 
SET mot_de_passe = '$2a$10$VOTRE_HASH_BCRYPT_ICI'
WHERE email = 'ayechi.fahmi@gmail.com';
```

---

## 🧪 Test de Vérification

### Test 1 : Vérifier le Hash

```sql
-- Vérifier que le hash est au bon format
SELECT 
    email,
    CASE 
        WHEN mot_de_passe LIKE '$2a$%' OR mot_de_passe LIKE '$2b$%' THEN 'OK - BCrypt'
        ELSE 'ERREUR - Format incorrect'
    END as verification
FROM utilisateur
WHERE email = 'ayechi.fahmi@gmail.com';
```

### Test 2 : Tester avec Postman

```bash
POST http://localhost:8089/carthage-creance/auth/authenticate
Content-Type: application/json

{
  "email": "ayechi.fahmi@gmail.com",
  "password": "Souhail01"
}
```

**Résultat attendu :**
- Si 200 OK → Le mot de passe est correct
- Si 500 Bad credentials → Le mot de passe est incorrect

---

## 📋 Checklist de Résolution

- [ ] Vérifier que le mot de passe en base est hashé (format BCrypt)
- [ ] Vérifier que l'algorithme de hash correspond (BCryptPasswordEncoder)
- [ ] Générer un nouveau hash BCrypt pour le mot de passe "Souhail01"
- [ ] Mettre à jour le mot de passe en base avec le nouveau hash
- [ ] Tester la connexion avec Postman
- [ ] Vérifier que le backend utilise JwtAuthentication correctement
- [ ] Vérifier que le JwtTokenProvider génère le token avec le rôle

---

## 🔐 Sécurité

**⚠️ Important :**
- Ne jamais stocker les mots de passe en texte brut
- Toujours utiliser BCrypt ou un algorithme de hash sécurisé
- Ne jamais logger les mots de passe
- Utiliser des mots de passe forts

---

## 📞 Support Backend

Si le problème persiste, vérifier côté backend :

1. **PasswordEncoder configuré :**
   ```java
   @Bean
   public PasswordEncoder passwordEncoder() {
       return new BCryptPasswordEncoder(10);
   }
   ```

2. **Utilisateur existe et est actif :**
   ```sql
   SELECT * FROM utilisateur WHERE email = 'ayechi.fahmi@gmail.com';
   ```

3. **Rôle assigné :**
   ```sql
   SELECT u.*, r.nom_role 
   FROM utilisateur u
   JOIN role_utilisateur r ON u.role_utilisateur_id = r.id
   WHERE u.email = 'ayechi.fahmi@gmail.com';
   ```

4. **JwtTokenProvider configuré :**
   - `jwt.secret` dans `application.properties`
   - `jwt.expiration` dans `application.properties`

---

**Note :** Le frontend est maintenant configuré pour afficher des messages d'erreur plus clairs selon le type d'erreur (Bad credentials, erreur serveur, etc.).


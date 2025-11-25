# Exemples de Code Backend - Entités et DTOs

Ce document fournit des exemples de code détaillés pour les entités et DTOs nécessaires aux endpoints.

## 1. Entités

### DocumentHuissier.java

```java
package projet.carthagecreance_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "document_huissier")
public class DocumentHuissier {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeDocumentHuissier typeDocument;
    
    @Column(nullable = false)
    private String huissierName;
    
    @Column
    private String pieceJointeUrl;
    
    @Column
    private Integer delaiLegalDays;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private StatutDocumentHuissier status;
    
    @Column(nullable = false)
    private LocalDateTime dateCreation;
    
    // Getters et Setters
    // ...
}
```

### ActionHuissier.java

```java
package projet.carthagecreance_backend.Entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "action_huissier")
public class ActionHuissier {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeActionHuissier typeAction;
    
    @Column
    private BigDecimal montantRecouvre;
    
    @Column
    private BigDecimal montantRestant;
    
    @Column(nullable = false)
    private String huissierName;
    
    @Column
    private String pieceJointeUrl;
    
    @Column(nullable = false)
    private LocalDateTime dateAction;
    
    @Column
    @Enumerated(EnumType.STRING)
    private EtatDossier etatDossier;
    
    // Getters et Setters
    // ...
}
```

### NotificationHuissier.java

```java
package projet.carthagecreance_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notification_huissier")
public class NotificationHuissier {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeNotificationHuissier type;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private CanalNotification canal;
    
    @Column(nullable = false)
    private Boolean acked = false;
    
    @Column
    private Long ackedBy;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    // Getters et Setters
    // ...
}
```

### Recommendation.java

```java
package projet.carthagecreance_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendation")
public class Recommendation {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;
    
    @Column(nullable = false)
    private String title;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private PrioriteRecommendation priority;
    
    @Column(nullable = false)
    private String ruleCode;
    
    @Column(nullable = false)
    private Boolean acknowledged = false;
    
    @Column
    private Long acknowledgedBy;
    
    @Column(nullable = false)
    private LocalDateTime createdAt;
    
    // Getters et Setters
    // ...
}
```

### AuditLog.java

```java
package projet.carthagecreance_backend.Entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;
    
    @ManyToOne
    @JoinColumn(name = "user_id")
    private Utilisateur user;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeChangementAudit changeType;
    
    @Column(columnDefinition = "TEXT")
    private String description;
    
    @Column(nullable = false)
    private LocalDateTime timestamp;
    
    // Getters et Setters
    // ...
}
```

## 2. DTOs (Data Transfer Objects)

### DocumentHuissierDTO.java

```java
package projet.carthagecreance_backend.DTO;

import lombok.Data;
import projet.carthagecreance_backend.Entity.TypeDocumentHuissier;
import projet.carthagecreance_backend.Entity.StatutDocumentHuissier;

@Data
public class DocumentHuissierDTO {
    private Long dossierId;
    private TypeDocumentHuissier typeDocument;
    private String huissierName;
    private String pieceJointeUrl;
    private Integer delaiLegalDays;
    private StatutDocumentHuissier status;
}
```

### ActionHuissierDTO.java

```java
package projet.carthagecreance_backend.DTO;

import lombok.Data;
import projet.carthagecreance_backend.Entity.TypeActionHuissier;
import java.math.BigDecimal;

@Data
public class ActionHuissierDTO {
    private Long dossierId;
    private TypeActionHuissier typeAction;
    private BigDecimal montantRecouvre;
    private String huissierName;
    private String pieceJointeUrl;
    private String updateMode; // "ADD" ou "SET"
}
```

## 3. Enums

### TypeDocumentHuissier.java

```java
package projet.carthagecreance_backend.Entity;

public enum TypeDocumentHuissier {
    PV_MISE_EN_DEMEURE,
    ORDONNANCE_PAIEMENT,
    PV_NOTIFICATION_ORDONNANCE
}
```

### StatutDocumentHuissier.java

```java
package projet.carthagecreance_backend.Entity;

public enum StatutDocumentHuissier {
    PENDING,
    EXPIRED,
    COMPLETED
}
```

### TypeActionHuissier.java

```java
package projet.carthagecreance_backend.Entity;

public enum TypeActionHuissier {
    ACLA_TA7AFOUDHIA,  // Saisie conservatoire
    ACLA_TANFITHIA,    // Saisie exécutive
    ACLA_TAW9IFIYA,    // Saisie de blocage
    ACLA_A9ARYA        // Saisie immobilière
}
```

### TypeNotificationHuissier.java

```java
package projet.carthagecreance_backend.Entity;

public enum TypeNotificationHuissier {
    DOCUMENT_EXPIRING,
    ACTION_REQUIRED,
    DEADLINE_APPROACHING,
    PAYMENT_RECEIVED
}
```

### CanalNotification.java

```java
package projet.carthagecreance_backend.Entity;

public enum CanalNotification {
    EMAIL,
    SMS,
    IN_APP,
    SYSTEM
}
```

### PrioriteRecommendation.java

```java
package projet.carthagecreance_backend.Entity;

public enum PrioriteRecommendation {
    LOW,
    MEDIUM,
    HIGH
}
```

### TypeChangementAudit.java

```java
package projet.carthagecreance_backend.Entity;

public enum TypeChangementAudit {
    CREATED,
    UPDATED,
    DELETED,
    STATUS_CHANGED,
    AMOUNT_CHANGED,
    ASSIGNED
}
```

## 4. Exemple de Mapper (DocumentHuissier)

```java
@Service
public class DocumentHuissierMapper {
    
    public DocumentHuissier toEntity(DocumentHuissierDTO dto, Dossier dossier) {
        DocumentHuissier document = new DocumentHuissier();
        document.setDossier(dossier);
        document.setTypeDocument(dto.getTypeDocument());
        document.setHuissierName(dto.getHuissierName());
        document.setPieceJointeUrl(dto.getPieceJointeUrl());
        document.setDelaiLegalDays(dto.getDelaiLegalDays());
        document.setStatus(dto.getStatus() != null ? dto.getStatus() : StatutDocumentHuissier.PENDING);
        document.setDateCreation(LocalDateTime.now());
        return document;
    }
    
    public DocumentHuissierDTO toDTO(DocumentHuissier document) {
        DocumentHuissierDTO dto = new DocumentHuissierDTO();
        dto.setDossierId(document.getDossier().getId());
        dto.setTypeDocument(document.getTypeDocument());
        dto.setHuissierName(document.getHuissierName());
        dto.setPieceJointeUrl(document.getPieceJointeUrl());
        dto.setDelaiLegalDays(document.getDelaiLegalDays());
        dto.setStatus(document.getStatus());
        return dto;
    }
}
```

## 5. Exemple de Service complet (DocumentHuissierService)

```java
@Service
@Transactional
public class DocumentHuissierService {
    
    @Autowired
    private DocumentHuissierRepository documentHuissierRepository;
    
    @Autowired
    private DossierRepository dossierRepository;
    
    @Autowired
    private DocumentHuissierMapper mapper;
    
    public List<DocumentHuissier> getDocumentsByDossier(Long dossierId) {
        return documentHuissierRepository.findByDossierId(dossierId);
    }
    
    public DocumentHuissier createDocument(DocumentHuissierDTO dto) {
        Dossier dossier = dossierRepository.findById(dto.getDossierId())
            .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + dto.getDossierId()));
        
        DocumentHuissier document = mapper.toEntity(dto, dossier);
        return documentHuissierRepository.save(document);
    }
    
    public DocumentHuissier getDocumentById(Long id) {
        return documentHuissierRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Document non trouvé: " + id));
    }
}
```

## 6. Configuration de sécurité pour les endpoints

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Routes API nécessitant authentification
                .requestMatchers("/api/users/**").authenticated()
                .requestMatchers("/api/huissier/**").authenticated()
                .requestMatchers("/api/notifications/**").authenticated()
                .requestMatchers("/api/recommendations/**").authenticated()
                .requestMatchers("/api/audit-logs/**").authenticated()
                // Routes publiques
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/**")
            )
            .sessionManagement(session -> session
                .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .addFilterBefore(jwtAuthenticationFilter(), UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }
    
    @Bean
    public JwtAuthenticationFilter jwtAuthenticationFilter() {
        return new JwtAuthenticationFilter();
    }
}
```

## 7. Exemple de GlobalExceptionHandler

```java
@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleEntityNotFound(EntityNotFoundException ex) {
        logger.error("Entité non trouvée: {}", ex.getMessage());
        Map<String, String> error = new HashMap<>();
        error.put("message", ex.getMessage());
        error.put("status", "404");
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleGenericException(Exception ex) {
        logger.error("Erreur générique détectée: {}", ex.getMessage(), ex);
        Map<String, String> error = new HashMap<>();
        error.put("message", "Erreur interne du serveur. Réessayez plus tard.");
        error.put("status", "500");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

---

## Checklist de vérification

- [ ] Tous les contrôleurs sont créés avec `@RestController` et `@RequestMapping("/api/...")`
- [ ] Tous les services sont créés avec `@Service`
- [ ] Tous les repositories étendent `JpaRepository<Entity, Long>`
- [ ] Les méthodes de recherche sont définies dans les repositories
- [ ] Les entités ont les annotations JPA correctes (`@Entity`, `@Table`, `@Id`, etc.)
- [ ] Les DTOs sont créés pour les requêtes POST/PUT
- [ ] Les enums sont définis pour les types et statuts
- [ ] La configuration de sécurité autorise les routes `/api/**`
- [ ] Le `GlobalExceptionHandler` gère les erreurs correctement
- [ ] Les logs sont configurés pour le débogage

---

## Commandes de test (curl)

```bash
# Tester l'endpoint des agents du chef
curl -X GET "http://localhost:8089/carthage-creance/api/users/chef/46" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tester les documents huissier
curl -X GET "http://localhost:8089/carthage-creance/api/huissier/documents?dossierId=39" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tester les actions huissier
curl -X GET "http://localhost:8089/carthage-creance/api/huissier/actions?dossierId=39" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tester les notifications
curl -X GET "http://localhost:8089/carthage-creance/api/notifications?dossierId=39" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tester les recommandations
curl -X GET "http://localhost:8089/carthage-creance/api/recommendations?dossierId=39" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Tester les audit logs
curl -X GET "http://localhost:8089/carthage-creance/api/audit-logs?dossierId=39" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Notes importantes

1. **Préfixe `/api`** : Tous les endpoints doivent commencer par `/api` pour éviter les conflits
2. **Authentification JWT** : Tous les endpoints doivent vérifier le token JWT
3. **Gestion des erreurs** : Utilisez `GlobalExceptionHandler` pour une gestion centralisée
4. **Validation** : Ajoutez `@Valid` sur les paramètres `@RequestBody` pour valider les données
5. **Transactions** : Utilisez `@Transactional` sur les méthodes de service qui modifient la base de données


# Guide de Correction des Endpoints Backend

Ce document explique comment corriger les erreurs backend rencontrées dans l'application.

## Problèmes identifiés

### 1. Erreur 500 sur `/api/users/chef/{id}`
L'endpoint retourne une erreur 500 lors du chargement des agents d'un chef.

### 2. Erreurs "No static resource" pour :
- `/huissier/documents`
- `/huissier/actions`
- `/notifications`
- `/recommendations`
- `/audit-logs`

Ces erreurs indiquent que Spring traite ces URLs comme des ressources statiques au lieu de les router vers des contrôleurs.

---

## Solution 1 : Corriger l'endpoint `/api/users/chef/{id}`

### Étape 1 : Vérifier le contrôleur UtilisateurController

Localisez le fichier `UtilisateurController.java` et vérifiez qu'il contient l'endpoint suivant :

```java
@RestController
@RequestMapping("/api/users")
public class UtilisateurController {
    
    @Autowired
    private UtilisateurService utilisateurService;
    
    /**
     * Obtenir les agents d'un chef
     * GET /api/users/chef/{chefId}
     */
    @GetMapping("/chef/{chefId}")
    public ResponseEntity<List<Utilisateur>> getAgentsByChef(@PathVariable Long chefId) {
        try {
            List<Utilisateur> agents = utilisateurService.getAgentsByChef(chefId);
            return ResponseEntity.ok(agents);
        } catch (Exception e) {
            logger.error("Erreur lors de la récupération des agents du chef " + chefId, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(null);
        }
    }
}
```

### Étape 2 : Vérifier le service UtilisateurService

Dans `UtilisateurService.java`, assurez-vous que la méthode existe :

```java
@Service
public class UtilisateurService {
    
    @Autowired
    private UtilisateurRepository utilisateurRepository;
    
    /**
     * Récupérer les agents d'un chef
     * Pour le chef dossier, retourner uniquement les agents dossier
     */
    public List<Utilisateur> getAgentsByChef(Long chefId) {
        // Récupérer le chef
        Utilisateur chef = utilisateurRepository.findById(chefId)
            .orElseThrow(() -> new EntityNotFoundException("Chef non trouvé avec l'ID: " + chefId));
        
        // Déterminer le rôle du chef pour filtrer les agents appropriés
        String chefRole = chef.getRoleUtilisateur();
        
        List<Utilisateur> agents;
        
        if ("CHEF_DEPARTEMENT_DOSSIER".equals(chefRole)) {
            // Chef dossier : uniquement les agents dossier
            agents = utilisateurRepository.findByRoleUtilisateur("AGENT_DOSSIER");
        } else if ("CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE".equals(chefRole)) {
            // Chef amiable : uniquement les agents amiable
            agents = utilisateurRepository.findByRoleUtilisateur("AGENT_RECOUVREMENT_AMIABLE");
        } else if ("CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE".equals(chefRole)) {
            // Chef juridique : uniquement les agents juridique
            agents = utilisateurRepository.findByRoleUtilisateur("AGENT_RECOUVREMENT_JURIDIQUE");
        } else if ("CHEF_DEPARTEMENT_FINANCE".equals(chefRole)) {
            // Chef finance : uniquement les agents finance
            agents = utilisateurRepository.findByRoleUtilisateur("AGENT_FINANCE");
        } else {
            // Pour les autres rôles (SUPER_ADMIN), retourner tous les agents
            agents = utilisateurRepository.findByRoleUtilisateurIn(
                Arrays.asList("AGENT_DOSSIER", "AGENT_RECOUVREMENT_AMIABLE", 
                             "AGENT_RECOUVREMENT_JURIDIQUE", "AGENT_FINANCE")
            );
        }
        
        return agents;
    }
}
```

### Étape 3 : Vérifier le repository UtilisateurRepository

Dans `UtilisateurRepository.java`, ajoutez les méthodes nécessaires :

```java
@Repository
public interface UtilisateurRepository extends JpaRepository<Utilisateur, Long> {
    
    // Trouver par rôle
    List<Utilisateur> findByRoleUtilisateur(String roleUtilisateur);
    
    // Trouver par plusieurs rôles
    List<Utilisateur> findByRoleUtilisateurIn(List<String> roles);
    
    // Trouver les agents d'un chef (si vous avez une relation chef-agent)
    // List<Utilisateur> findByChefId(Long chefId);
}
```

---

## Solution 2 : Corriger les erreurs "No static resource"

Ces erreurs se produisent parce que Spring essaie de traiter ces URLs comme des ressources statiques. Il faut créer des contrôleurs pour ces endpoints.

### Étape 1 : Créer le contrôleur DocumentHuissierController

Créez le fichier `DocumentHuissierController.java` :

```java
package projet.carthagecreance_backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projet.carthagecreance_backend.Entity.DocumentHuissier;
import projet.carthagecreance_backend.Service.DocumentHuissierService;

import java.util.List;

@RestController
@RequestMapping("/api/huissier")
@CrossOrigin(origins = "*")
public class DocumentHuissierController {
    
    @Autowired
    private DocumentHuissierService documentHuissierService;
    
    /**
     * GET /api/huissier/documents?dossierId={id}
     * Récupérer les documents huissier d'un dossier
     */
    @GetMapping("/documents")
    public ResponseEntity<List<DocumentHuissier>> getDocumentsByDossier(
            @RequestParam Long dossierId) {
        try {
            List<DocumentHuissier> documents = documentHuissierService.getDocumentsByDossier(dossierId);
            return ResponseEntity.ok(documents);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/huissier/document
     * Créer un nouveau document huissier
     */
    @PostMapping("/document")
    public ResponseEntity<DocumentHuissier> createDocument(
            @RequestBody DocumentHuissierDTO dto) {
        try {
            DocumentHuissier document = documentHuissierService.createDocument(dto);
            return ResponseEntity.ok(document);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/huissier/document/{id}
     * Récupérer un document par ID
     */
    @GetMapping("/document/{id}")
    public ResponseEntity<DocumentHuissier> getDocumentById(@PathVariable Long id) {
        try {
            DocumentHuissier document = documentHuissierService.getDocumentById(id);
            return ResponseEntity.ok(document);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
```

### Étape 2 : Créer le contrôleur ActionHuissierController

Créez le fichier `ActionHuissierController.java` :

```java
package projet.carthagecreance_backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projet.carthagecreance_backend.Entity.ActionHuissier;
import projet.carthagecreance_backend.Service.ActionHuissierService;

import java.util.List;

@RestController
@RequestMapping("/api/huissier")
@CrossOrigin(origins = "*")
public class ActionHuissierController {
    
    @Autowired
    private ActionHuissierService actionHuissierService;
    
    /**
     * GET /api/huissier/actions?dossierId={id}
     * Récupérer les actions huissier d'un dossier
     */
    @GetMapping("/actions")
    public ResponseEntity<List<ActionHuissier>> getActionsByDossier(
            @RequestParam Long dossierId) {
        try {
            List<ActionHuissier> actions = actionHuissierService.getActionsByDossier(dossierId);
            return ResponseEntity.ok(actions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/huissier/action
     * Créer une nouvelle action huissier
     */
    @PostMapping("/action")
    public ResponseEntity<ActionHuissier> createAction(
            @RequestBody ActionHuissierDTO dto) {
        try {
            ActionHuissier action = actionHuissierService.createAction(dto);
            return ResponseEntity.ok(action);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * GET /api/huissier/action/{id}
     * Récupérer une action par ID
     */
    @GetMapping("/action/{id}")
    public ResponseEntity<ActionHuissier> getActionById(@PathVariable Long id) {
        try {
            ActionHuissier action = actionHuissierService.getActionById(id);
            return ResponseEntity.ok(action);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }
}
```

### Étape 3 : Créer le contrôleur NotificationHuissierController

Créez le fichier `NotificationHuissierController.java` :

```java
package projet.carthagecreance_backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projet.carthagecreance_backend.Entity.NotificationHuissier;
import projet.carthagecreance_backend.Service.NotificationHuissierService;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class NotificationHuissierController {
    
    @Autowired
    private NotificationHuissierService notificationHuissierService;
    
    /**
     * GET /api/notifications?dossierId={id}
     * Récupérer les notifications d'un dossier
     */
    @GetMapping("/notifications")
    public ResponseEntity<List<NotificationHuissier>> getNotificationsByDossier(
            @RequestParam Long dossierId) {
        try {
            List<NotificationHuissier> notifications = 
                notificationHuissierService.getNotificationsByDossier(dossierId);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/notifications/{id}/ack
     * Acquitter une notification
     */
    @PostMapping("/notifications/{id}/ack")
    public ResponseEntity<?> acknowledgeNotification(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            notificationHuissierService.acknowledgeNotification(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

### Étape 4 : Créer le contrôleur RecommendationController

Créez le fichier `RecommendationController.java` :

```java
package projet.carthagecreance_backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projet.carthagecreance_backend.Entity.Recommendation;
import projet.carthagecreance_backend.Service.RecommendationService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class RecommendationController {
    
    @Autowired
    private RecommendationService recommendationService;
    
    /**
     * GET /api/recommendations?dossierId={id}
     * Récupérer les recommandations d'un dossier
     */
    @GetMapping("/recommendations")
    public ResponseEntity<List<Recommendation>> getRecommendationsByDossier(
            @RequestParam Long dossierId) {
        try {
            List<Recommendation> recommendations = 
                recommendationService.getRecommendationsByDossier(dossierId);
            return ResponseEntity.ok(recommendations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    /**
     * POST /api/recommendations/{id}/ack
     * Acquitter une recommandation
     */
    @PostMapping("/recommendations/{id}/ack")
    public ResponseEntity<?> acknowledgeRecommendation(
            @PathVariable Long id,
            @RequestBody Map<String, Long> request) {
        try {
            Long userId = request.get("userId");
            recommendationService.acknowledgeRecommendation(id, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

### Étape 5 : Créer le contrôleur AuditLogController

Créez le fichier `AuditLogController.java` :

```java
package projet.carthagecreance_backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projet.carthagecreance_backend.Entity.AuditLog;
import projet.carthagecreance_backend.Service.AuditLogService;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class AuditLogController {
    
    @Autowired
    private AuditLogService auditLogService;
    
    /**
     * GET /api/audit-logs?dossierId={id}
     * Récupérer les logs d'audit d'un dossier
     */
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getLogsByDossier(
            @RequestParam(required = false) Long dossierId,
            @RequestParam(required = false) Long userId) {
        try {
            List<AuditLog> logs;
            if (dossierId != null) {
                logs = auditLogService.getLogsByDossier(dossierId);
            } else if (userId != null) {
                logs = auditLogService.getLogsByUser(userId);
            } else {
                return ResponseEntity.badRequest().build();
            }
            return ResponseEntity.ok(logs);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
```

---

## Solution 3 : Configuration Spring pour éviter les conflits de routes

### Vérifier la configuration WebMvcConfigurer

Dans votre classe de configuration (par exemple `WebConfig.java` ou `SecurityConfig.java`), assurez-vous que les routes API sont correctement configurées :

```java
@Configuration
public class WebConfig implements WebMvcConfigurer {
    
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Configurer les ressources statiques
        registry.addResourceHandler("/static/**")
                .addResourceLocations("classpath:/static/");
        
        // Ne pas traiter les routes /api/* comme des ressources statiques
        // Les contrôleurs @RestController s'en chargeront
    }
    
    @Override
    public void configurePathMatch(PathMatchConfigurer configurer) {
        // S'assurer que les routes API sont prioritaires
        configurer.setUseTrailingSlashMatch(false);
    }
}
```

### Vérifier l'ordre des filtres dans SecurityConfig

Dans `SecurityConfig.java`, assurez-vous que les routes API sont autorisées :

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Autoriser les routes API
                .requestMatchers("/api/**").authenticated()
                // Autoriser les ressources statiques
                .requestMatchers("/static/**", "/css/**", "/js/**", "/images/**").permitAll()
                .anyRequest().authenticated()
            )
            .csrf(csrf -> csrf
                .ignoringRequestMatchers("/api/**")
            );
        
        return http.build();
    }
}
```

---

## Solution 4 : Créer les Services nécessaires

### DocumentHuissierService.java

```java
@Service
public class DocumentHuissierService {
    
    @Autowired
    private DocumentHuissierRepository documentHuissierRepository;
    
    public List<DocumentHuissier> getDocumentsByDossier(Long dossierId) {
        return documentHuissierRepository.findByDossierId(dossierId);
    }
    
    public DocumentHuissier createDocument(DocumentHuissierDTO dto) {
        DocumentHuissier document = new DocumentHuissier();
        // Mapper les champs depuis le DTO
        // ...
        return documentHuissierRepository.save(document);
    }
    
    public DocumentHuissier getDocumentById(Long id) {
        return documentHuissierRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Document non trouvé"));
    }
}
```

### ActionHuissierService.java

```java
@Service
public class ActionHuissierService {
    
    @Autowired
    private ActionHuissierRepository actionHuissierRepository;
    
    public List<ActionHuissier> getActionsByDossier(Long dossierId) {
        return actionHuissierRepository.findByDossierId(dossierId);
    }
    
    public ActionHuissier createAction(ActionHuissierDTO dto) {
        ActionHuissier action = new ActionHuissier();
        // Mapper les champs depuis le DTO
        // ...
        return actionHuissierRepository.save(action);
    }
    
    public ActionHuissier getActionById(Long id) {
        return actionHuissierRepository.findById(id)
            .orElseThrow(() -> new EntityNotFoundException("Action non trouvée"));
    }
}
```

### NotificationHuissierService.java

```java
@Service
public class NotificationHuissierService {
    
    @Autowired
    private NotificationHuissierRepository notificationHuissierRepository;
    
    public List<NotificationHuissier> getNotificationsByDossier(Long dossierId) {
        return notificationHuissierRepository.findByDossierId(dossierId);
    }
    
    public void acknowledgeNotification(Long notificationId, Long userId) {
        NotificationHuissier notification = notificationHuissierRepository.findById(notificationId)
            .orElseThrow(() -> new EntityNotFoundException("Notification non trouvée"));
        notification.setAcked(true);
        notification.setAckedBy(userId);
        notificationHuissierRepository.save(notification);
    }
}
```

### RecommendationService.java

```java
@Service
public class RecommendationService {
    
    @Autowired
    private RecommendationRepository recommendationRepository;
    
    public List<Recommendation> getRecommendationsByDossier(Long dossierId) {
        return recommendationRepository.findByDossierId(dossierId);
    }
    
    public void acknowledgeRecommendation(Long recommendationId, Long userId) {
        Recommendation recommendation = recommendationRepository.findById(recommendationId)
            .orElseThrow(() -> new EntityNotFoundException("Recommandation non trouvée"));
        recommendation.setAcknowledged(true);
        recommendation.setAcknowledgedBy(userId);
        recommendationRepository.save(recommendation);
    }
}
```

### AuditLogService.java

```java
@Service
public class AuditLogService {
    
    @Autowired
    private AuditLogRepository auditLogRepository;
    
    public List<AuditLog> getLogsByDossier(Long dossierId) {
        return auditLogRepository.findByDossierIdOrderByTimestampDesc(dossierId);
    }
    
    public List<AuditLog> getLogsByUser(Long userId) {
        return auditLogRepository.findByUserIdOrderByTimestampDesc(userId);
    }
}
```

---

## Solution 5 : Créer les Repositories nécessaires

### DocumentHuissierRepository.java

```java
@Repository
public interface DocumentHuissierRepository extends JpaRepository<DocumentHuissier, Long> {
    List<DocumentHuissier> findByDossierId(Long dossierId);
}
```

### ActionHuissierRepository.java

```java
@Repository
public interface ActionHuissierRepository extends JpaRepository<ActionHuissier, Long> {
    List<ActionHuissier> findByDossierId(Long dossierId);
}
```

### NotificationHuissierRepository.java

```java
@Repository
public interface NotificationHuissierRepository extends JpaRepository<NotificationHuissier, Long> {
    List<NotificationHuissier> findByDossierId(Long dossierId);
}
```

### RecommendationRepository.java

```java
@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    List<Recommendation> findByDossierId(Long dossierId);
}
```

### AuditLogRepository.java

```java
@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByDossierIdOrderByTimestampDesc(Long dossierId);
    List<AuditLog> findByUserIdOrderByTimestampDesc(Long userId);
}
```

---

## Vérification

Après avoir implémenté ces corrections :

1. **Redémarrer le serveur backend**
2. **Vérifier les logs** pour s'assurer qu'il n'y a pas d'erreurs de démarrage
3. **Tester les endpoints** avec Postman ou curl :
   - `GET http://localhost:8089/carthage-creance/api/users/chef/46`
   - `GET http://localhost:8089/carthage-creance/api/huissier/documents?dossierId=39`
   - `GET http://localhost:8089/carthage-creance/api/huissier/actions?dossierId=39`
   - `GET http://localhost:8089/carthage-creance/api/notifications?dossierId=39`
   - `GET http://localhost:8089/carthage-creance/api/recommendations?dossierId=39`
   - `GET http://localhost:8089/carthage-creance/api/audit-logs?dossierId=39`

---

## Notes importantes

1. **Préfixe `/api`** : Tous les endpoints doivent commencer par `/api` pour éviter les conflits avec les ressources statiques
2. **CORS** : Assurez-vous que `@CrossOrigin(origins = "*")` est présent sur tous les contrôleurs
3. **Authentification** : Vérifiez que les endpoints sont protégés par JWT si nécessaire
4. **Gestion d'erreurs** : Utilisez `GlobalExceptionHandler` pour gérer les erreurs de manière cohérente

---

## Structure de fichiers recommandée

```
src/main/java/projet/carthagecreance_backend/
├── Controller/
│   ├── UtilisateurController.java
│   ├── DocumentHuissierController.java
│   ├── ActionHuissierController.java
│   ├── NotificationHuissierController.java
│   ├── RecommendationController.java
│   └── AuditLogController.java
├── Service/
│   ├── UtilisateurService.java
│   ├── DocumentHuissierService.java
│   ├── ActionHuissierService.java
│   ├── NotificationHuissierService.java
│   ├── RecommendationService.java
│   └── AuditLogService.java
├── Repository/
│   ├── UtilisateurRepository.java
│   ├── DocumentHuissierRepository.java
│   ├── ActionHuissierRepository.java
│   ├── NotificationHuissierRepository.java
│   ├── RecommendationRepository.java
│   └── AuditLogRepository.java
└── Entity/
    ├── DocumentHuissier.java
    ├── ActionHuissier.java
    ├── NotificationHuissier.java
    ├── Recommendation.java
    └── AuditLog.java
```

---

## Résumé des corrections

1. ✅ Créer l'endpoint `/api/users/chef/{id}` dans `UtilisateurController`
2. ✅ Implémenter la logique dans `UtilisateurService` pour filtrer les agents par rôle du chef
3. ✅ Créer les contrôleurs pour les endpoints manquants (documents, actions, notifications, recommendations, audit-logs)
4. ✅ Créer les services correspondants
5. ✅ Créer les repositories avec les méthodes de recherche nécessaires
6. ✅ Configurer Spring pour ne pas traiter les routes `/api/*` comme des ressources statiques

Une fois ces corrections appliquées, toutes les erreurs "No static resource" devraient disparaître et l'endpoint `/api/users/chef/{id}` devrait fonctionner correctement.


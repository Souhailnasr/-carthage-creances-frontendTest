# 🔧 Endpoint Backend : Marquer un Document Huissier comme Complété

## ❌ Problème Actuel

L'endpoint `PUT /api/huissier/document/{id}/complete` n'existe pas dans le backend, ce qui cause l'erreur :
```
No static resource api/huissier/document/1/complete
```

## ✅ Solution : Créer l'Endpoint dans le Backend

### Étape 1 : Ajouter la Méthode dans le Service

Dans votre `DocumentHuissierService` (ou `DocumentHuissierServiceImpl`), ajoutez cette méthode :

```java
/**
 * Marque un document comme complété
 * 
 * Contraintes :
 * - Seulement si le statut est PENDING
 * - Impossible si le statut est EXPIRED
 * - Impossible si le statut est déjà COMPLETED
 * 
 * @param id ID du document
 * @return Document mis à jour
 * @throws IllegalArgumentException si le document ne peut pas être marqué comme complété
 */
public DocumentHuissier markAsCompleted(Long id) {
    DocumentHuissier document = documentHuissierRepository.findById(id)
        .orElseThrow(() -> new EntityNotFoundException("Document non trouvé avec l'ID: " + id));
    
    // Vérifier les contraintes
    if (document.getStatus() == StatutDocumentHuissier.EXPIRED) {
        throw new IllegalArgumentException("Impossible de marquer un document expiré comme complété");
    }
    
    if (document.getStatus() == StatutDocumentHuissier.COMPLETED) {
        throw new IllegalArgumentException("Ce document est déjà marqué comme complété");
    }
    
    // Mettre à jour le statut
    document.setStatus(StatutDocumentHuissier.COMPLETED);
    
    // Sauvegarder
    return documentHuissierRepository.save(document);
}
```

### Étape 2 : Ajouter l'Endpoint dans le Contrôleur

Dans votre `DocumentHuissierController`, ajoutez cette méthode :

```java
/**
 * PUT /api/huissier/document/{id}/complete
 * Marque un document comme complété
 * 
 * Contraintes :
 * - Seulement si le statut est PENDING
 * - Impossible si le statut est EXPIRED
 * - Impossible si le statut est déjà COMPLETED
 */
@PutMapping("/document/{id}/complete")
public ResponseEntity<?> markDocumentAsCompleted(@PathVariable Long id) {
    try {
        DocumentHuissier document = documentHuissierService.markAsCompleted(id);
        return ResponseEntity.ok(document);
    } catch (EntityNotFoundException e) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("error", e.getMessage()));
    } catch (IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(Map.of("error", e.getMessage()));
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("error", "Erreur lors du marquage du document: " + e.getMessage()));
    }
}
```

### Étape 3 : Structure Complète du Contrôleur (Exemple)

```java
package projet.carthagecreance_backend.Controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projet.carthagecreance_backend.Entity.DocumentHuissier;
import projet.carthagecreance_backend.Service.DocumentHuissierService;

import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/huissier")
@CrossOrigin(origins = "*")
public class DocumentHuissierController {
    
    @Autowired
    private DocumentHuissierService documentHuissierService;
    
    // ... autres endpoints existants ...
    
    /**
     * PUT /api/huissier/document/{id}/complete
     * Marque un document comme complété
     */
    @PutMapping("/document/{id}/complete")
    public ResponseEntity<?> markDocumentAsCompleted(@PathVariable Long id) {
        try {
            DocumentHuissier document = documentHuissierService.markAsCompleted(id);
            return ResponseEntity.ok(document);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur lors du marquage du document: " + e.getMessage()));
        }
    }
    
    /**
     * PUT /api/huissier/document/{id}/expire
     * Marque un document comme expiré (utilisé par le scheduler)
     */
    @PutMapping("/document/{id}/expire")
    public ResponseEntity<?> markDocumentAsExpired(@PathVariable Long id) {
        try {
            DocumentHuissier document = documentHuissierService.markAsExpired(id);
            return ResponseEntity.ok(document);
        } catch (EntityNotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Erreur lors du marquage du document: " + e.getMessage()));
        }
    }
}
```

## 📋 Checklist d'Implémentation Backend

- [ ] Ajouter la méthode `markAsCompleted(Long id)` dans le Service
- [ ] Ajouter les validations (EXPIRED, COMPLETED)
- [ ] Ajouter l'endpoint `PUT /api/huissier/document/{id}/complete` dans le Contrôleur
- [ ] Gérer les exceptions (EntityNotFoundException, IllegalArgumentException)
- [ ] Tester l'endpoint avec Postman/curl
- [ ] Vérifier que le statut est bien mis à jour en base de données

## 🧪 Test de l'Endpoint

### Avec cURL :
```bash
curl -X PUT "http://localhost:8089/carthage-creance/api/huissier/document/1/complete" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

### Avec Postman :
- **Method**: PUT
- **URL**: `http://localhost:8089/carthage-creance/api/huissier/document/1/complete`
- **Headers**: 
  - `Authorization: Bearer YOUR_JWT_TOKEN`
  - `Content-Type: application/json`
- **Body**: (vide, car aucun body n'est nécessaire)

## ⚠️ Notes Importantes

1. **Sécurité** : Assurez-vous que l'endpoint est protégé par l'authentification JWT
2. **Validation** : Les contraintes doivent être vérifiées côté backend (ne pas faire confiance uniquement au frontend)
3. **Transactions** : Utilisez `@Transactional` si nécessaire pour garantir la cohérence des données
4. **Logging** : Ajoutez des logs pour tracer les opérations

## 🔄 Après l'Implémentation

Une fois l'endpoint créé dans le backend :
1. Redémarrez le serveur backend
2. Testez l'endpoint avec Postman/curl
3. Le frontend devrait maintenant fonctionner correctement

---

**Le frontend est déjà prêt et attend cet endpoint !** ✅


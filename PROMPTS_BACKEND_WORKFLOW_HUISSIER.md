# 🎯 Prompts Backend : Workflow Huissier Complet

Ce document contient tous les prompts nécessaires pour implémenter le workflow huissier côté backend.

---

## 📋 Table des Matières

1. [Champ `etapeHuissier` dans l'entité Dossier](#1-champ-etepehuissier-dans-lentité-dossier)
2. [Endpoints de Transition](#2-endpoints-de-transition)
3. [Endpoints de Filtrage des Dossiers](#3-endpoints-de-filtrage-des-dossiers)
4. [Upload de Fichiers pour Documents et Actions](#4-upload-de-fichiers-pour-documents-et-actions)
5. [Endpoints de Récupération des Documents/Actions par Dossier](#5-endpoints-de-récupération-des-documentsactions-par-dossier)
6. [Service de Stockage de Fichiers](#6-service-de-stockage-de-fichiers)

---

## 1. Champ `etapeHuissier` dans l'entité Dossier

### Prompt

```
Ajouter un champ `etapeHuissier` de type Enum dans l'entité Dossier pour gérer le workflow huissier.

Enum EtapeHuissier :
- EN_ATTENTE_DOCUMENTS (par défaut) : Dossier en attente de création de documents
- EN_DOCUMENTS : Dossier à l'étape documents (documents en cours de création)
- EN_ACTIONS : Dossier à l'étape actions (actions en cours)
- EN_AUDIENCES : Dossier prêt pour les audiences (toutes les actions sont terminées)

Modifications nécessaires :
1. Créer l'enum EtapeHuissier dans le package Entity ou Enum
2. Ajouter le champ `etapeHuissier` dans l'entité Dossier avec valeur par défaut EN_ATTENTE_DOCUMENTS
3. Ajouter la colonne dans la base de données (migration ou script SQL)
4. Mettre à jour les constructeurs et getters/setters
```

### Code Java suggéré

```java
// Enum EtapeHuissier.java
package projet.carthagecreance_backend.Entity;

public enum EtapeHuissier {
    EN_ATTENTE_DOCUMENTS,
    EN_DOCUMENTS,
    EN_ACTIONS,
    EN_AUDIENCES
}

// Dans Dossier.java
@Enumerated(EnumType.STRING)
@Column(name = "etape_huissier", nullable = false)
private EtapeHuissier etapeHuissier = EtapeHuissier.EN_ATTENTE_DOCUMENTS;
```

---

## 2. Endpoints de Transition

### Prompt 2.1 : Passer aux Actions

```
Créer un endpoint POST /api/dossiers/{dossierId}/huissier/passer-aux-actions qui :

1. Vérifie que le dossier existe
2. Vérifie qu'il y a au moins un document huissier créé pour ce dossier
3. Met à jour `etapeHuissier` à EN_ACTIONS
4. Retourne le dossier mis à jour

Validations :
- Le dossier doit exister
- Le dossier doit avoir au moins un document huissier
- Le dossier doit être à l'étape EN_DOCUMENTS (optionnel mais recommandé)

Réponses :
- 200 OK : Dossier mis à jour avec succès
- 400 Bad Request : Aucun document trouvé ou étape invalide
- 404 Not Found : Dossier non trouvé
```

### Code Java suggéré

```java
@PostMapping("/dossiers/{dossierId}/huissier/passer-aux-actions")
public ResponseEntity<Dossier> passerAuxActions(@PathVariable Long dossierId) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new ResourceNotFoundException("Dossier non trouvé"));
    
    // Vérifier qu'il y a au moins un document
    List<DocumentHuissier> documents = documentHuissierRepository.findByDossierId(dossierId);
    if (documents.isEmpty()) {
        throw new BadRequestException("Vous devez créer au moins un document avant de passer aux actions");
    }
    
    // Vérifier l'étape actuelle (optionnel)
    if (dossier.getEtapeHuissier() != EtapeHuissier.EN_DOCUMENTS) {
        throw new BadRequestException("Le dossier doit être à l'étape documents");
    }
    
    dossier.setEtapeHuissier(EtapeHuissier.EN_ACTIONS);
    Dossier updated = dossierRepository.save(dossier);
    
    return ResponseEntity.ok(updated);
}
```

### Prompt 2.2 : Passer aux Audiences

```
Créer un endpoint POST /api/dossiers/{dossierId}/huissier/passer-aux-audiences qui :

1. Vérifie que le dossier existe
2. Vérifie qu'il y a au moins une action huissier créée pour ce dossier
3. Met à jour `etapeHuissier` à EN_AUDIENCES
4. Retourne le dossier mis à jour

Validations :
- Le dossier doit exister
- Le dossier doit avoir au moins une action huissier
- Le dossier doit être à l'étape EN_ACTIONS (optionnel mais recommandé)

Réponses :
- 200 OK : Dossier mis à jour avec succès
- 400 Bad Request : Aucune action trouvée ou étape invalide
- 404 Not Found : Dossier non trouvé
```

### Code Java suggéré

```java
@PostMapping("/dossiers/{dossierId}/huissier/passer-aux-audiences")
public ResponseEntity<Dossier> passerAuxAudiences(@PathVariable Long dossierId) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new ResourceNotFoundException("Dossier non trouvé"));
    
    // Vérifier qu'il y a au moins une action
    List<ActionHuissier> actions = actionHuissierRepository.findByDossierId(dossierId);
    if (actions.isEmpty()) {
        throw new BadRequestException("Vous devez créer au moins une action avant de passer aux audiences");
    }
    
    // Vérifier l'étape actuelle (optionnel)
    if (dossier.getEtapeHuissier() != EtapeHuissier.EN_ACTIONS) {
        throw new BadRequestException("Le dossier doit être à l'étape actions");
    }
    
    dossier.setEtapeHuissier(EtapeHuissier.EN_AUDIENCES);
    Dossier updated = dossierRepository.save(dossier);
    
    return ResponseEntity.ok(updated);
}
```

---

## 3. Endpoints de Filtrage des Dossiers

### Prompt 3.1 : Dossiers à l'étape Documents

```
Créer un endpoint GET /api/dossiers/huissier/documents qui retourne tous les dossiers à l'étape EN_DOCUMENTS.

Paramètres de pagination :
- page : numéro de page (défaut : 0)
- size : taille de page (défaut : 100, max : 100)

Réponse : Page<Dossier> avec les dossiers filtrés par etapeHuissier = EN_DOCUMENTS
```

### Code Java suggéré

```java
@GetMapping("/dossiers/huissier/documents")
public ResponseEntity<Page<Dossier>> getDossiersEnDocuments(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "100") int size
) {
    if (size > 100) {
        size = 100; // Limiter à 100
    }
    
    Pageable pageable = PageRequest.of(page, size);
    Page<Dossier> dossiers = dossierRepository.findByEtapeHuissier(
        EtapeHuissier.EN_DOCUMENTS, 
        pageable
    );
    
    return ResponseEntity.ok(dossiers);
}
```

### Prompt 3.2 : Dossiers à l'étape Actions

```
Créer un endpoint GET /api/dossiers/huissier/actions qui retourne tous les dossiers à l'étape EN_ACTIONS.

Paramètres de pagination :
- page : numéro de page (défaut : 0)
- size : taille de page (défaut : 100, max : 100)

Réponse : Page<Dossier> avec les dossiers filtrés par etapeHuissier = EN_ACTIONS
```

### Code Java suggéré

```java
@GetMapping("/dossiers/huissier/actions")
public ResponseEntity<Page<Dossier>> getDossiersEnActions(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "100") int size
) {
    if (size > 100) {
        size = 100; // Limiter à 100
    }
    
    Pageable pageable = PageRequest.of(page, size);
    Page<Dossier> dossiers = dossierRepository.findByEtapeHuissier(
        EtapeHuissier.EN_ACTIONS, 
        pageable
    );
    
    return ResponseEntity.ok(dossiers);
}
```

### Repository Method

```java
// Dans DossierRepository.java
Page<Dossier> findByEtapeHuissier(EtapeHuissier etapeHuissier, Pageable pageable);
```

---

## 4. Upload de Fichiers pour Documents et Actions

### Prompt 4.1 : Modifier DocumentHuissierController pour accepter MultipartFile

```
Modifier les endpoints POST et PUT de DocumentHuissierController pour accepter MultipartFile au lieu d'URL.

Changements nécessaires :
1. Modifier DocumentHuissierDTO pour accepter MultipartFile (ou créer un DTO séparé)
2. Utiliser FileStorageService pour sauvegarder le fichier
3. Stocker l'URL générée dans pieceJointeUrl
4. Gérer les erreurs de taille et type de fichier

Contraintes :
- Taille maximale : 10MB
- Types acceptés : PDF, JPEG, PNG
- Générer un nom de fichier unique
```

### Code Java suggéré

```java
@PostMapping("/document")
public ResponseEntity<DocumentHuissier> createDocument(
    @RequestParam("dossierId") Long dossierId,
    @RequestParam("typeDocument") TypeDocumentHuissier typeDocument,
    @RequestParam("huissierName") String huissierName,
    @RequestParam(value = "pieceJointe", required = false) MultipartFile file
) {
    // Valider le fichier
    if (file != null && !file.isEmpty()) {
        validateFile(file);
    }
    
    DocumentHuissier document = new DocumentHuissier();
    document.setDossierId(dossierId);
    document.setTypeDocument(typeDocument);
    document.setHuissierName(huissierName);
    
    // Sauvegarder le fichier si présent
    if (file != null && !file.isEmpty()) {
        String fileUrl = fileStorageService.storeFile(file, "huissier/documents");
        document.setPieceJointeUrl(fileUrl);
    }
    
    // Mettre à jour l'étape du dossier si c'est le premier document
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new ResourceNotFoundException("Dossier non trouvé"));
    if (dossier.getEtapeHuissier() == EtapeHuissier.EN_ATTENTE_DOCUMENTS) {
        dossier.setEtapeHuissier(EtapeHuissier.EN_DOCUMENTS);
        dossierRepository.save(dossier);
    }
    
    DocumentHuissier saved = documentHuissierRepository.save(document);
    return ResponseEntity.ok(saved);
}

private void validateFile(MultipartFile file) {
    // Vérifier la taille
    if (file.getSize() > 10 * 1024 * 1024) { // 10MB
        throw new BadRequestException("Le fichier est trop volumineux. Taille maximale : 10MB");
    }
    
    // Vérifier le type
    String contentType = file.getContentType();
    List<String> allowedTypes = Arrays.asList(
        "application/pdf",
        "image/jpeg",
        "image/png",
        "image/jpg"
    );
    
    if (!allowedTypes.contains(contentType)) {
        throw new BadRequestException("Type de fichier non autorisé. Formats acceptés : PDF, JPEG, PNG");
    }
}
```

### Prompt 4.2 : Modifier ActionHuissierController pour accepter MultipartFile

```
Modifier les endpoints POST et PUT de ActionHuissierController pour accepter MultipartFile au lieu d'URL.

Même logique que pour les documents :
1. Accepter MultipartFile dans les paramètres
2. Valider taille et type
3. Sauvegarder via FileStorageService
4. Stocker l'URL dans pieceJointeUrl
```

---

## 5. Endpoints de Récupération des Documents/Actions par Dossier

### Prompt 5.1 : GET /api/dossiers/{dossierId}/huissier/documents

```
Créer un endpoint GET /api/dossiers/{dossierId}/huissier/documents qui retourne tous les documents huissier d'un dossier.

Réponse : List<DocumentHuissier>
```

### Code Java suggéré

```java
@GetMapping("/dossiers/{dossierId}/huissier/documents")
public ResponseEntity<List<DocumentHuissier>> getDocumentsByDossier(@PathVariable Long dossierId) {
    List<DocumentHuissier> documents = documentHuissierRepository.findByDossierId(dossierId);
    return ResponseEntity.ok(documents);
}
```

### Prompt 5.2 : GET /api/dossiers/{dossierId}/huissier/actions

```
Créer un endpoint GET /api/dossiers/{dossierId}/huissier/actions qui retourne toutes les actions huissier d'un dossier.

Réponse : List<ActionHuissier>
```

### Code Java suggéré

```java
@GetMapping("/dossiers/{dossierId}/huissier/actions")
public ResponseEntity<List<ActionHuissier>> getActionsByDossier(@PathVariable Long dossierId) {
    List<ActionHuissier> actions = actionHuissierRepository.findByDossierId(dossierId);
    return ResponseEntity.ok(actions);
}
```

---

## 6. Service de Stockage de Fichiers

### Prompt 6.1 : Créer FileStorageService

```
Créer un service FileStorageService pour gérer le stockage des fichiers uploadés.

Fonctionnalités :
1. Méthode storeFile(MultipartFile file, String subdirectory) : sauvegarde le fichier et retourne l'URL
2. Méthode loadFile(String fileName) : charge un fichier
3. Méthode deleteFile(String fileName) : supprime un fichier
4. Générer des noms de fichiers uniques (UUID + extension)
5. Créer les répertoires si nécessaire
6. Gérer les erreurs (espace disque, permissions, etc.)

Configuration :
- Chemin de base : application.properties (ex: file.upload-dir=/uploads)
- Structure : /uploads/{subdirectory}/{uuid}.{extension}
- URL retournée : /api/files/{subdirectory}/{uuid}.{extension}
```

### Code Java suggéré

```java
@Service
public class FileStorageService {
    
    @Value("${file.upload-dir:./uploads}")
    private String uploadDir;
    
    @Value("${file.base-url:http://localhost:8089/carthage-creance/api/files}")
    private String baseUrl;
    
    public String storeFile(MultipartFile file, String subdirectory) {
        try {
            // Générer un nom unique
            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            String fileName = UUID.randomUUID().toString() + extension;
            
            // Créer le répertoire si nécessaire
            Path directory = Paths.get(uploadDir, subdirectory);
            Files.createDirectories(directory);
            
            // Sauvegarder le fichier
            Path filePath = directory.resolve(fileName);
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            // Retourner l'URL
            return baseUrl + "/" + subdirectory + "/" + fileName;
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la sauvegarde du fichier", e);
        }
    }
    
    public Resource loadFile(String fileName, String subdirectory) {
        try {
            Path filePath = Paths.get(uploadDir, subdirectory, fileName);
            Resource resource = new UrlResource(filePath.toUri());
            
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new RuntimeException("Fichier non trouvé : " + fileName);
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("Erreur lors du chargement du fichier", e);
        }
    }
    
    public void deleteFile(String fileName, String subdirectory) {
        try {
            Path filePath = Paths.get(uploadDir, subdirectory, fileName);
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            throw new RuntimeException("Erreur lors de la suppression du fichier", e);
        }
    }
}
```

### Prompt 6.2 : Endpoint de Téléchargement

```
Créer des endpoints GET pour télécharger les fichiers :
- GET /api/files/huissier/documents/{fileName}
- GET /api/files/huissier/actions/{fileName}

Ces endpoints utilisent FileStorageService pour charger et retourner les fichiers.
```

### Code Java suggéré

```java
@GetMapping("/files/huissier/documents/{fileName:.+}")
public ResponseEntity<Resource> downloadDocument(@PathVariable String fileName) {
    Resource resource = fileStorageService.loadFile(fileName, "huissier/documents");
    
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
        .body(resource);
}

@GetMapping("/files/huissier/actions/{fileName:.+}")
public ResponseEntity<Resource> downloadAction(@PathVariable String fileName) {
    Resource resource = fileStorageService.loadFile(fileName, "huissier/actions");
    
    return ResponseEntity.ok()
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resource.getFilename() + "\"")
        .body(resource);
}
```

---

## 7. Configuration Application Properties

### Prompt

```
Ajouter les propriétés suivantes dans application.properties :

# File Storage Configuration
file.upload-dir=./uploads
file.base-url=http://localhost:8089/carthage-creance/api/files

# Multipart Configuration
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```

---

## 8. Ordre d'Implémentation Recommandé

1. ✅ Créer l'enum `EtapeHuissier` et ajouter le champ dans `Dossier`
2. ✅ Créer `FileStorageService` et les endpoints de téléchargement
3. ✅ Modifier les endpoints de création/modification de documents pour accepter `MultipartFile`
4. ✅ Modifier les endpoints de création/modification d'actions pour accepter `MultipartFile`
5. ✅ Créer les endpoints de transition (`passer-aux-actions`, `passer-aux-audiences`)
6. ✅ Créer les endpoints de filtrage (`getDossiersEnDocuments`, `getDossiersEnActions`)
7. ✅ Créer les endpoints de récupération par dossier (`getDocumentsByDossier`, `getActionsByDossier`)
8. ✅ Tester le workflow complet

---

## 9. Notes Importantes

- **Sécurité** : Valider les types de fichiers et la taille pour éviter les attaques
- **Performance** : Utiliser un stockage cloud (S3, Azure Blob) en production
- **Migration** : Mettre à jour les dossiers existants avec `etapeHuissier = EN_ATTENTE_DOCUMENTS`
- **Transactions** : Utiliser `@Transactional` pour les opérations de transition
- **Logs** : Logger toutes les transitions de workflow pour audit

---

## 10. Tests Recommandés

1. Test de transition avec documents/actions valides
2. Test de transition sans documents/actions (doit échouer)
3. Test d'upload de fichier valide
4. Test d'upload de fichier trop volumineux (doit échouer)
5. Test d'upload de type de fichier invalide (doit échouer)
6. Test de filtrage des dossiers par étape
7. Test de récupération des documents/actions par dossier

---

**Fin du document**


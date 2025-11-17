# 🔧 PROMPT BACKEND - Correction Sauvegarde Dossier dans Audience

## ❌ Problème Actuel

Lors de la création d'une audience via `POST /api/audiences`, le champ `dossier_id` est sauvegardé comme `NULL` dans la base de données, même si le frontend envoie correctement `dossier: { id: 38 }`.

**Payload envoyé par le frontend :**
```json
{
  "dateAudience": "2025-11-17",
  "dateProchaine": "2025-11-27",
  "tribunalType": "TRIBUNAL_PREMIERE_INSTANCE",
  "lieuTribunal": "Tunis",
  "commentaireDecision": null,
  "resultat": "Rapporter",
  "dossier": { "id": 38 },
  "avocat": { "id": 3 },
  "huissier": null
}
```

**Résultat dans la base de données :**
- `dossier_id`: `NULL` ❌
- `avocat_id`: `3` ✅
- `hussier_id`: `NULL` ✅

## 🎯 PROMPT À COPIER DANS CURSOR AI (Backend)

```
Dans le projet Spring Boot backend, corrigez le problème de sauvegarde du dossier_id lors de la création d'une audience.

PROBLÈME:
- Lors de l'appel POST /api/audiences avec payload { "dossier": { "id": 38 }, ... }
- Le dossier_id est sauvegardé comme NULL dans la base de données
- L'avocat_id est correctement sauvegardé (donc le mapping fonctionne pour avocat mais pas pour dossier)

CORRECTIONS À APPLIQUER:

1. Vérifiez l'entité Audience (src/main/java/.../entity/Audience.java):

L'entité doit avoir une relation @ManyToOne avec Dossier correctement mappée:

```java
@Entity
@Table(name = "audience")
public class Audience {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    // ✅ CORRECTION: Relation avec Dossier
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false) // nullable = false si le dossier est obligatoire
    private Dossier dossier;
    
    // ✅ CORRECTION: Relation avec Avocat (probablement déjà correct)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avocat_id", nullable = true)
    private Avocat avocat;
    
    // ✅ CORRECTION: Relation avec Huissier
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hussier_id", nullable = true) // Note: vérifiez le nom exact de la colonne
    private Huissier huissier;
    
    @Column(name = "date_audience", nullable = false)
    private LocalDate dateAudience;
    
    @Column(name = "date_prochaine")
    private LocalDate dateProchaine;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tribunal_type", nullable = false)
    private TribunalType tribunalType;
    
    @Column(name = "lieu_tribunal", nullable = false)
    private String lieuTribunal;
    
    @Column(name = "commentaire_decision", columnDefinition = "TEXT")
    private String commentaireDecision;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "resultat")
    private DecisionResult resultat; // Note: le champ s'appelle "resultat" pas "decisionResult"
    
    // Getters et setters
    public Dossier getDossier() {
        return dossier;
    }
    
    public void setDossier(Dossier dossier) {
        this.dossier = dossier;
    }
    
    // ... autres getters/setters
}
```

2. Vérifiez le DTO/Request (si vous utilisez un DTO):

Fichier: src/main/java/.../dto/AudienceRequest.java (ou similaire)

```java
public class AudienceRequest {
    
    // ✅ CORRECTION: Accepter soit dossierId soit dossier.id
    @JsonAlias({"dossierId", "dossier.id"})
    private Long dossierId;
    
    // OU mieux: accepter un objet Dossier
    private DossierReference dossier; // Classe interne ou séparée
    
    // ... autres champs
    
    public static class DossierReference {
        private Long id;
        
        public Long getId() {
            return id;
        }
        
        public void setId(Long id) {
            this.id = id;
        }
    }
}
```

3. Vérifiez le Controller (src/main/java/.../controller/AudienceController.java):

```java
@RestController
@RequestMapping("/api/audiences")
public class AudienceController {
    
    @Autowired
    private AudienceService audienceService;
    
    @PostMapping
    public ResponseEntity<Audience> createAudience(@RequestBody AudienceRequest request) {
        // ✅ CORRECTION: Convertir le DTO en entité et charger le dossier
        Audience audience = new Audience();
        
        // ✅ IMPORTANT: Charger le dossier depuis la base de données
        if (request.getDossier() != null && request.getDossier().getId() != null) {
            Dossier dossier = dossierRepository.findById(request.getDossier().getId())
                .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + request.getDossier().getId()));
            audience.setDossier(dossier);
        } else if (request.getDossierId() != null) {
            Dossier dossier = dossierRepository.findById(request.getDossierId())
                .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + request.getDossierId()));
            audience.setDossier(dossier);
        }
        
        // Même chose pour avocat et huissier
        if (request.getAvocat() != null && request.getAvocat().getId() != null) {
            Avocat avocat = avocatRepository.findById(request.getAvocat().getId())
                .orElseThrow(() -> new EntityNotFoundException("Avocat non trouvé"));
            audience.setAvocat(avocat);
        }
        
        if (request.getHuissier() != null && request.getHuissier().getId() != null) {
            Huissier huissier = huissierRepository.findById(request.getHuissier().getId())
                .orElseThrow(() -> new EntityNotFoundException("Huissier non trouvé"));
            audience.setHuissier(huissier);
        }
        
        // Mapper les autres champs
        audience.setDateAudience(request.getDateAudience());
        audience.setDateProchaine(request.getDateProchaine());
        audience.setTribunalType(request.getTribunalType());
        audience.setLieuTribunal(request.getLieuTribunal());
        audience.setCommentaireDecision(request.getCommentaireDecision());
        audience.setResultat(request.getResultat());
        
        Audience savedAudience = audienceService.save(audience);
        return ResponseEntity.ok(savedAudience);
    }
}
```

4. Vérifiez le Service (src/main/java/.../service/AudienceService.java):

```java
@Service
public class AudienceService {
    
    @Autowired
    private AudienceRepository audienceRepository;
    
    @Autowired
    private DossierRepository dossierRepository;
    
    public Audience save(Audience audience) {
        // ✅ VÉRIFICATION: S'assurer que le dossier est bien attaché
        if (audience.getDossier() != null && audience.getDossier().getId() != null) {
            // S'assurer que l'entité est gérée (attached) par JPA
            if (!entityManager.contains(audience.getDossier())) {
                Dossier managedDossier = dossierRepository.findById(audience.getDossier().getId())
                    .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé"));
                audience.setDossier(managedDossier);
            }
        }
        
        return audienceRepository.save(audience);
    }
}
```

5. Vérifiez les annotations Jackson (si vous utilisez @JsonIgnoreProperties):

```java
@Entity
@Table(name = "audience")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // Pour éviter les erreurs de sérialisation
public class Audience {
    // ...
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    @JsonIgnoreProperties({"audiences", "actions", "enquettes"}) // Éviter les références circulaires
    private Dossier dossier;
    
    // ...
}
```

POINTS IMPORTANTS À VÉRIFIER:

1. ✅ Le nom de la colonne dans @JoinColumn doit correspondre exactement au nom dans la base de données
2. ✅ Le dossier doit être chargé depuis la base de données (pas juste créer un objet avec un ID)
3. ✅ L'entité Dossier doit être "managed" par JPA (attachée au contexte de persistance)
4. ✅ Vérifiez que le nom de la colonne est bien "dossier_id" et non "dossiers_id" ou autre
5. ✅ Si nullable = false, assurez-vous que le dossier est toujours fourni

TEST:
Après correction, testez avec:
- POST /api/audiences avec { "dossier": { "id": 38 }, ... }
- Vérifiez dans la base de données que dossier_id = 38 (pas NULL)
```

## 📋 Checklist de Vérification Backend

1. **Entité Audience** :
   - [ ] Relation `@ManyToOne` avec `Dossier` présente
   - [ ] `@JoinColumn(name = "dossier_id")` correctement configuré
   - [ ] Getter/Setter pour `dossier` présents

2. **Controller** :
   - [ ] Le dossier est chargé depuis la base de données (pas juste créé avec un ID)
   - [ ] `dossierRepository.findById()` est appelé
   - [ ] L'entité chargée est assignée à `audience.setDossier()`

3. **Service** :
   - [ ] L'entité Dossier est "managed" (attachée au contexte JPA)
   - [ ] Pas de création d'une nouvelle entité Dossier avec juste un ID

4. **Base de données** :
   - [ ] La colonne s'appelle bien `dossier_id` (pas `dossiers_id`)
   - [ ] La colonne accepte NULL ou non selon votre logique métier
   - [ ] La clé étrangère est correctement configurée

## 🔍 Diagnostic

Pour diagnostiquer le problème, ajoutez des logs dans le Controller :

```java
@PostMapping
public ResponseEntity<Audience> createAudience(@RequestBody AudienceRequest request) {
    log.info("📥 Requête reçue: {}", request);
    log.info("📥 Dossier dans request: {}", request.getDossier());
    
    Audience audience = new Audience();
    
    if (request.getDossier() != null && request.getDossier().getId() != null) {
        Long dossierId = request.getDossier().getId();
        log.info("🔍 Recherche du dossier avec ID: {}", dossierId);
        
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé: " + dossierId));
        
        log.info("✅ Dossier trouvé: {}", dossier.getId());
        audience.setDossier(dossier);
        log.info("✅ Dossier assigné à l'audience: {}", audience.getDossier() != null ? audience.getDossier().getId() : "NULL");
    }
    
    Audience saved = audienceService.save(audience);
    log.info("💾 Audience sauvegardée avec dossier_id: {}", saved.getDossier() != null ? saved.getDossier().getId() : "NULL");
    
    return ResponseEntity.ok(saved);
}
```

## ⚠️ Erreurs Communes

1. **Créer un objet Dossier avec juste un ID** :
   ```java
   // ❌ MAUVAIS
   Dossier dossier = new Dossier();
   dossier.setId(38L);
   audience.setDossier(dossier);
   
   // ✅ BON
   Dossier dossier = dossierRepository.findById(38L)
       .orElseThrow(() -> new EntityNotFoundException("Dossier non trouvé"));
   audience.setDossier(dossier);
   ```

2. **Nom de colonne incorrect** :
   ```java
   // ❌ MAUVAIS (si la colonne s'appelle dossier_id)
   @JoinColumn(name = "dossiers_id")
   
   // ✅ BON
   @JoinColumn(name = "dossier_id")
   ```

3. **Oublier de charger l'entité** :
   ```java
   // ❌ MAUVAIS
   audience.setDossier(request.getDossier()); // Objet détaché
   
   // ✅ BON
   Dossier dossier = dossierRepository.findById(request.getDossier().getId())
       .orElseThrow(...);
   audience.setDossier(dossier); // Objet géré par JPA
   ```


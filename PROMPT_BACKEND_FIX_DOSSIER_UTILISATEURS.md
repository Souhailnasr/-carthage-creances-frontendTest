# 🔧 PROMPT BACKEND - Correction Erreur Affectation Dossier

## ❌ Erreur Actuelle

```
Field 'dossiers_id' doesn't have a default value
[insert into dossier_utilisateurs (dossier_id,utilisateur_id) values (?,?)]
```

## 🎯 PROMPT À COPIER DANS CURSOR AI (Backend)

```
Dans le projet Spring Boot backend, corrigez l'erreur lors de l'affectation d'un dossier au recouvrement amiable.

ERREUR ACTUELLE:
- Lors de l'appel PUT /api/dossiers/{dossierId}/affecter/recouvrement-amiable
- Erreur SQL: Field 'dossiers_id' doesn't have a default value
- Table concernée: dossier_utilisateurs
- INSERT: insert into dossier_utilisateurs (dossier_id,utilisateur_id) values (?,?)

PROBLÈME IDENTIFIÉ:
La table `dossier_utilisateurs` a probablement un champ `dossiers_id` qui n'est pas inclus dans l'INSERT, ou il y a une confusion entre `dossier_id` et `dossiers_id` dans le mapping JPA.

CORRECTIONS À APPLIQUER:

1. Vérifiez l'entité DossierUtilisateur (ou la table de jointure):

Fichier: src/main/java/.../entity/DossierUtilisateur.java (ou similaire)

```java
@Entity
@Table(name = "dossier_utilisateurs")
public class DossierUtilisateur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // Si la table a un ID auto-incrémenté
    
    // OPTION 1: Si la table a un champ dossiers_id séparé
    @Column(name = "dossiers_id")
    private Long dossiersId;
    
    @Column(name = "dossier_id")
    private Long dossierId;
    
    @Column(name = "utilisateur_id")
    private Long utilisateurId;
    
    // Getters et setters
}
```

OU

```java
// OPTION 2: Si dossiers_id et dossier_id sont la même chose
@Entity
@Table(name = "dossier_utilisateurs")
public class DossierUtilisateur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "dossier_id") // Utiliser dossier_id au lieu de dossiers_id
    private Long dossierId;
    
    @Column(name = "utilisateur_id")
    private Long utilisateurId;
    
    // Getters et setters
}
```

2. Vérifiez la méthode affecterAuRecouvrementAmiable dans DossierController:

Fichier: src/main/java/.../controller/DossierController.java

```java
@PutMapping("/{dossierId}/affecter/recouvrement-amiable")
public ResponseEntity<Dossier> affecterAuRecouvrementAmiable(
    @PathVariable Long dossierId,
    Authentication authentication
) {
    try {
        // Récupérer le dossier
        Dossier dossier = dossierService.findById(dossierId)
            .orElseThrow(() -> new NoResourceFoundException("Dossier non trouvé avec l'ID: " + dossierId));
        
        // Vérifier que le dossier est validé
        if (!dossier.isValide()) {
            return ResponseEntity.badRequest()
                .body(null); // Ou retourner une erreur appropriée
        }
        
        // Récupérer le chef du département recouvrement amiable
        Utilisateur chefAmiable = utilisateurService.findChefRecouvrementAmiable()
            .orElseThrow(() -> new NoResourceFoundException("Aucun chef du département recouvrement amiable trouvé"));
        
        // CORRECTION: Créer correctement l'entité DossierUtilisateur
        DossierUtilisateur dossierUtilisateur = new DossierUtilisateur();
        
        // Si la table a dossiers_id ET dossier_id, utiliser les deux
        dossierUtilisateur.setDossierId(dossierId);
        dossierUtilisateur.setDossiersId(dossierId); // Si nécessaire
        dossierUtilisateur.setUtilisateurId(chefAmiable.getId());
        
        // OU si dossiers_id n'existe pas, utiliser seulement dossier_id
        // dossierUtilisateur.setDossierId(dossierId);
        // dossierUtilisateur.setUtilisateurId(chefAmiable.getId());
        
        // Sauvegarder la relation
        dossierUtilisateurRepository.save(dossierUtilisateur);
        
        // Mettre à jour le dossier
        dossier.setTypeRecouvrement(TypeRecouvrement.AMIABLE);
        dossier.setAgentResponsable(chefAmiable);
        
        Dossier dossierMisAJour = dossierService.save(dossier);
        
        return ResponseEntity.ok(dossierMisAJour);
        
    } catch (NoResourceFoundException e) {
        return ResponseEntity.notFound().build();
    } catch (Exception e) {
        logger.error("Erreur lors de l'affectation au recouvrement amiable", e);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

3. Vérifiez la structure de la table dans la base de données:

Exécutez cette requête SQL pour voir la structure:
```sql
DESCRIBE dossier_utilisateurs;
-- ou
SHOW CREATE TABLE dossier_utilisateurs;
```

4. Si la table a un champ dossiers_id qui doit être rempli:

OPTION A: Modifier l'entité pour inclure dossiers_id dans l'INSERT:
```java
@Column(name = "dossiers_id", nullable = false)
private Long dossiersId;
```

OPTION B: Si dossiers_id doit avoir la même valeur que dossier_id:
```java
@PrePersist
public void prePersist() {
    if (this.dossiersId == null && this.dossierId != null) {
        this.dossiersId = this.dossierId;
    }
}
```

OPTION C: Si dossiers_id n'est pas nécessaire, modifier la table:
```sql
ALTER TABLE dossier_utilisateurs DROP COLUMN dossiers_id;
-- ou
ALTER TABLE dossier_utilisateurs MODIFY COLUMN dossiers_id BIGINT DEFAULT NULL;
```

5. Vérifiez le Repository:

Fichier: src/main/java/.../repository/DossierUtilisateurRepository.java

```java
@Repository
public interface DossierUtilisateurRepository extends JpaRepository<DossierUtilisateur, Long> {
    // Vérifiez que les méthodes utilisent les bons noms de colonnes
}
```

6. SOLUTION RECOMMANDÉE (si dossiers_id et dossier_id sont redondants):

Si `dossiers_id` et `dossier_id` sont la même chose, supprimez `dossiers_id` de la table ou modifiez l'entité pour utiliser seulement `dossier_id`:

```java
@Entity
@Table(name = "dossier_utilisateurs")
public class DossierUtilisateur {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "dossier_id", nullable = false)
    private Long dossierId;
    
    @Column(name = "utilisateur_id", nullable = false)
    private Long utilisateurId;
    
    // Constructeurs, getters, setters
}
```

Et dans le contrôleur:
```java
DossierUtilisateur dossierUtilisateur = new DossierUtilisateur();
dossierUtilisateur.setDossierId(dossierId);
dossierUtilisateur.setUtilisateurId(chefAmiable.getId());
dossierUtilisateurRepository.save(dossierUtilisateur);
```

IMPORTANT:
- Vérifiez d'abord la structure réelle de la table `dossier_utilisateurs` dans la base de données
- Assurez-vous que tous les champs NOT NULL sont remplis lors de l'INSERT
- Testez après chaque modification
- Ajoutez des logs pour déboguer: logger.info("Insertion DossierUtilisateur: dossierId={}, utilisateurId={}", dossierId, utilisateurId);
```

---

## 🔍 Étapes de Diagnostic

1. **Vérifier la structure de la table:**
   ```sql
   DESCRIBE dossier_utilisateurs;
   ```

2. **Vérifier les contraintes:**
   ```sql
   SHOW CREATE TABLE dossier_utilisateurs;
   ```

3. **Vérifier l'entité JPA:**
   - Nom des colonnes
   - Annotations @Column
   - Champs nullable vs NOT NULL

4. **Vérifier le code d'insertion:**
   - Tous les champs NOT NULL sont-ils remplis?
   - Les noms de colonnes correspondent-ils?

---

## ✅ Solution Rapide (Si dossiers_id = dossier_id)

Si `dossiers_id` doit avoir la même valeur que `dossier_id`, ajoutez dans l'entité:

```java
@PrePersist
public void prePersist() {
    if (this.dossiersId == null) {
        this.dossiersId = this.dossierId;
    }
}
```

Ou dans le contrôleur avant le save:

```java
dossierUtilisateur.setDossiersId(dossierId); // Si dossiers_id existe
```


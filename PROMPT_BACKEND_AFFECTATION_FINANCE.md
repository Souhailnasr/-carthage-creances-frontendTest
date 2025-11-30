# 🎯 Prompt Backend : Affectation au Département Finance

Ce document contient les instructions pour implémenter l'endpoint d'affectation d'un dossier traité au département finance.

---

## 📋 Vue d'Ensemble

Le chef juridique doit pouvoir affecter un dossier qui a été traité (avec documents, actions, et audiences) au département finance pour finaliser le processus de recouvrement.

---

## 🔧 Endpoint à Créer

### POST /api/dossiers/{dossierId}/affecter/finance

**Méthode** : `PUT` (ou `POST` selon votre convention)

**Description** : Affecte un dossier traité au département finance

**Conditions préalables** :
1. Le dossier doit exister
2. Le dossier doit avoir **au moins une audience créée** (condition principale)
3. Un chef du département finance doit exister dans le système

**Note importante** : L'affectation au finance peut se faire **indépendamment de l'étape** du workflow huissier. 
Cela signifie que même si le dossier est à l'étape `EN_ATTENTE_DOCUMENTS`, `EN_DOCUMENTS`, ou `EN_ACTIONS`, 
tant qu'il a au moins une audience, il peut être affecté au finance.

**Actions à effectuer** :
1. Vérifier que le dossier a au moins une audience (condition principale)
2. Vérifier qu'un chef finance existe
3. Mettre à jour le `typeRecouvrement` du dossier à `FINANCE` (ou créer cette valeur dans l'enum si elle n'existe pas)
4. Optionnel : Mettre à jour `etapeHuissier` à une nouvelle valeur (ex: `AFFECTE_FINANCE`) ou laisser l'étape actuelle
5. Créer une notification pour le chef finance
6. Retourner le dossier mis à jour

**Réponses** :
- `200 OK` : Dossier affecté avec succès
- `400 Bad Request` : Dossier sans audiences ou conditions non remplies
- `404 Not Found` : Dossier non trouvé ou chef finance non trouvé
- `500 Internal Server Error` : Erreur serveur

---

## 📝 Code Java Suggéré

### 1. Controller

```java
@PutMapping("/dossiers/{dossierId}/affecter/finance")
public ResponseEntity<Dossier> affecterAuFinance(@PathVariable Long dossierId) {
    try {
        Dossier dossier = dossierService.affecterAuFinance(dossierId);
        return ResponseEntity.ok(dossier);
    } catch (ResourceNotFoundException e) {
        return ResponseEntity.notFound().build();
    } catch (BadRequestException e) {
        return ResponseEntity.badRequest().body(null);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
}
```

### 2. Service

```java
@Transactional
public Dossier affecterAuFinance(Long dossierId) {
    // 1. Récupérer le dossier
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new ResourceNotFoundException("Dossier non trouvé avec l'ID: " + dossierId));
    
    // 2. Vérifier qu'au moins une audience existe (CONDITION PRINCIPALE)
    // Cette vérification est indépendante de l'étape du workflow huissier
    List<Audience> audiences = audienceRepository.findByDossierId(dossierId);
    if (audiences.isEmpty()) {
        throw new BadRequestException(
            "Le dossier doit avoir au moins une audience avant d'être affecté au finance"
        );
    }
    
    // 4. Trouver un chef du département finance
    Utilisateur chefFinance = utilisateurRepository.findByRoleUtilisateur(RoleUtilisateur.CHEF_DEPARTEMENT_FINANCE)
        .stream()
        .findFirst()
        .orElseThrow(() -> new ResourceNotFoundException(
            "Aucun chef du département finance trouvé. Veuillez créer un chef finance d'abord."
        ));
    
    // 5. Mettre à jour le typeRecouvrement
    // Option A : Si FINANCE existe dans l'enum TypeRecouvrement
    dossier.setTypeRecouvrement(TypeRecouvrement.FINANCE);
    
    // Option B : Si FINANCE n'existe pas, créer un nouveau champ ou utiliser une autre méthode
    // Par exemple : créer un champ affecteAuFinance: boolean = true
    // ou : mettre à jour etapeHuissier à AFFECTE_FINANCE
    
    // 6. Optionnel : Mettre à jour l'étape huissier
    // dossier.setEtapeHuissier(EtapeHuissier.AFFECTE_FINANCE); // Si cette valeur existe
    
    // 7. Sauvegarder le dossier
    Dossier dossierUpdated = dossierRepository.save(dossier);
    
    // 8. Créer une notification pour le chef finance
    try {
        notificationService.creerNotification(
            chefFinance.getId(),
            "Nouveau dossier affecté",
            String.format(
                "Le dossier %s a été affecté au département finance. " +
                "Montant: %s TND. Créancier: %s",
                dossier.getNumeroDossier(),
                dossier.getMontantCreance(),
                dossier.getCreancier() != null ? dossier.getCreancier().getNom() : "N/A"
            ),
            NotificationType.DOSSIER_AFFECTE
        );
    } catch (Exception e) {
        // Logger l'erreur mais ne pas faire échouer l'affectation
        logger.error("Erreur lors de la création de la notification", e);
    }
    
    return dossierUpdated;
}
```

---

## 🔄 Option : Ajouter FINANCE à l'enum TypeRecouvrement

Si `FINANCE` n'existe pas dans l'enum `TypeRecouvrement`, vous avez deux options :

### Option 1 : Ajouter FINANCE à l'enum (Recommandé)

```java
public enum TypeRecouvrement {
    NON_AFFECTE = 'NON_AFFECTE',
    AMIABLE = 'AMIABLE',
    JURIDIQUE = 'JURIDIQUE',
    FINANCE = 'FINANCE'  // Nouvelle valeur
}
```

### Option 2 : Utiliser un champ séparé

Créer un nouveau champ dans l'entité Dossier :
```java
@Column(name = "affecte_au_finance")
private Boolean affecteAuFinance = false;
```

---

## 📋 Validations à Implémenter

1. **Vérification des audiences** : Au moins une audience doit exister (CONDITION PRINCIPALE)
   - Cette vérification est **indépendante de l'étape** du workflow huissier
   - Le dossier peut être à n'importe quelle étape (EN_ATTENTE_DOCUMENTS, EN_DOCUMENTS, EN_ACTIONS, EN_AUDIENCES)
   - Tant qu'il a au moins une audience, il peut être affecté au finance
2. **Vérification du chef finance** : Un chef finance doit exister
3. **Vérification du statut** : Le dossier doit être validé (optionnel)

---

## 🔔 Notifications

Créer une notification pour le chef finance avec :
- Titre : "Nouveau dossier affecté"
- Message : Détails du dossier (numéro, montant, créancier)
- Type : `DOSSIER_AFFECTE` ou `NOUVEAU_DOSSIER_FINANCE`
- Lien vers le dossier : `/finance/dossier/{dossierId}`

---

## 📊 Logs et Audit

Logger les actions suivantes :
- Tentative d'affectation
- Succès de l'affectation
- Échec avec raison
- Notification créée (ou erreur de notification)

---

## 🧪 Tests Recommandés

1. **Test de succès - étape EN_AUDIENCES** : Dossier à l'étape audiences avec audiences → affectation réussie
2. **Test de succès - étape EN_DOCUMENTS** : Dossier à l'étape documents mais avec audiences → affectation réussie
3. **Test de succès - étape EN_ACTIONS** : Dossier à l'étape actions mais avec audiences → affectation réussie
4. **Test de succès - étape EN_ATTENTE_DOCUMENTS** : Dossier à l'étape attente documents mais avec audiences → affectation réussie
5. **Test d'échec - pas d'audiences** : Dossier sans audiences → erreur 400
6. **Test d'échec - pas de chef finance** : Aucun chef finance → erreur 404
7. **Test d'échec - dossier inexistant** : ID invalide → erreur 404

---

## 🔗 Intégration avec le Frontend

Le frontend appelle :
```typescript
PUT /api/dossiers/{dossierId}/affecter/finance
```

Sans body (ou avec un body vide `{}`).

---

## 📝 Notes Importantes

1. **Transaction** : Utiliser `@Transactional` pour garantir la cohérence
2. **Notifications** : Gérer les notifications dans une transaction séparée pour ne pas bloquer l'affectation
3. **Historique** : Optionnel : créer un historique d'affectation pour traçabilité
4. **Permissions** : Vérifier que seul le chef juridique peut affecter au finance

---

**Fin du document**


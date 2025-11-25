# 🔧 Correction : Dossiers Affectés à un Agent

## 🐛 Problèmes Identifiés

1. **Erreur 400 "La taille de page doit être entre 1 et 100"** :
   - Le fallback utilisait `getAllDossiers(0, 1000)` avec `size=1000`
   - Le backend limite `size` à 100 maximum

2. **Dossiers non affichés malgré leur présence en base** :
   - L'endpoint `/api/dossiers/agent/{agentId}` peut ne pas fonctionner correctement
   - Le fallback ne chargeait qu'une seule page (100 dossiers max)
   - Si l'agent a des dossiers mais qu'ils ne sont pas dans les 100 premiers, ils ne sont pas chargés

3. **Table `dossier_utilisateurs` non utilisée** :
   - La table `dossier_utilisateurs` montre les affectations (dossier_id, utilisateur_id)
   - Mais le frontend filtre par `agentResponsable.id` dans les dossiers
   - Il faut vérifier que le backend utilise bien cette table pour l'endpoint `/api/dossiers/agent/{agentId}`

---

## ✅ Corrections Apportées

### 1. **Fallback avec Pagination Correcte**

**Fichier** : `carthage-creance/src/app/dossier/components/liste-dossiers-agent/liste-dossiers-agent.component.ts`

**Changements** :
- ✅ Utilise `size=100` (max autorisé) au lieu de `size=1000`
- ✅ Charge **toutes les pages** avec `expand` et `reduce` de RxJS
- ✅ Filtre correctement par `agentResponsable.id === agentId`

**Code** :
```typescript
private loadDossiersFallback(agentId: number): Observable<DossierApi[]> {
  const pageSize = 100; // Taille max autorisée par le backend
  
  // Charger la première page
  return this.dossierApiService.getAllDossiers(0, pageSize).pipe(
    // Utiliser expand pour charger toutes les pages suivantes
    expand((page) => {
      const currentPage = page.number || 0;
      const totalPages = page.totalPages || 0;
      const isLast = page.last || false;
      
      // Si ce n'est pas la dernière page, charger la suivante
      if (!isLast && (currentPage + 1) < totalPages) {
        return this.dossierApiService.getAllDossiers(currentPage + 1, pageSize);
      } else {
        return EMPTY; // Arrêter l'expansion
      }
    }),
    // Réduire toutes les pages en un seul tableau
    reduce((allDossiers: DossierApi[], page: any) => {
      if (page && page.content) {
        return [...allDossiers, ...page.content];
      }
      return allDossiers;
    }, []),
    // Filtrer les dossiers où agentResponsable.id === agentId
    map((allDossiers) => {
      return allDossiers.filter(dossier => {
        const agentRespId = dossier.agentResponsable?.id;
        return agentRespId && Number(agentRespId) === Number(agentId);
      });
    })
  );
}
```

### 2. **Amélioration de la Logique de Chargement**

**Changements** :
- ✅ Si l'endpoint `/agent/{id}` retourne une liste vide, vérifie via le fallback
- ✅ Si le fallback trouve des dossiers, les affiche (l'endpoint principal ne fonctionne pas)
- ✅ Si le fallback ne trouve rien, affiche "Aucun dossier trouvé" (normal)

**Code** :
```typescript
this.dossierApiService.getDossiersByAgent(agentId)
  .pipe(...)
  .subscribe({
    next: (dossiers) => {
      if (dossiers && dossiers.length > 0) {
        // Des dossiers ont été trouvés
        this.dossiers = dossiers;
      } else {
        // Liste vide - vérifier via fallback
        this.loadDossiersFallback(agentId)
          .subscribe({
            next: (fallbackDossiers) => {
              if (fallbackDossiers && fallbackDossiers.length > 0) {
                // Le fallback a trouvé des dossiers
                this.dossiers = fallbackDossiers;
              } else {
                // Aucun dossier trouvé
                this.dossiers = [];
              }
            }
          });
      }
    }
  });
```

### 3. **Logs de Débogage Améliorés**

**Fichier** : `carthage-creance/src/app/core/services/dossier-api.service.ts`

**Changements** :
- ✅ Logs détaillés dans `getDossiersByAgent()` pour déboguer
- ✅ Affiche l'URL appelée, l'agentId, et la réponse reçue

---

## 🔍 Vérification Backend

### Problème Potentiel : Table `dossier_utilisateurs` Non Utilisée

D'après les captures, la table `dossier_utilisateurs` contient :
- `dossier_id: 38`
- `utilisateur_id: 20` (l'agent)

Mais le frontend filtre par `agentResponsable.id` dans les dossiers.

**Vérifier dans le backend** :

1. **L'endpoint `/api/dossiers/agent/{agentId}` utilise-t-il la table `dossier_utilisateurs` ?**

   ```java
   // ✅ CORRECT - Utilise la table de liaison
   @GetMapping("/agent/{agentId}")
   public List<Dossier> getDossiersByAgent(@PathVariable Long agentId) {
       return dossierRepository.findByUtilisateurId(agentId);
   }
   
   // ❌ INCORRECT - Ne filtre que par agentResponsable
   @GetMapping("/agent/{agentId}")
   public List<Dossier> getDossiersByAgent(@PathVariable Long agentId) {
       return dossierRepository.findByAgentResponsableId(agentId);
   }
   ```

2. **La méthode du repository utilise-t-elle la table de liaison ?**

   ```java
   // ✅ CORRECT
   @Query("SELECT d FROM Dossier d JOIN d.utilisateurs u WHERE u.id = :agentId")
   List<Dossier> findByUtilisateurId(@Param("agentId") Long agentId);
   
   // ❌ INCORRECT
   List<Dossier> findByAgentResponsableId(Long agentId);
   ```

---

## 🧪 Test

### 1. **Vérifier dans la Console (F12 → Console)**

Après avoir cliqué sur "Mes dossiers affectés", vous devriez voir :

```
✅ ID agent extrait du token: 20
🔍 DossierApiService.getDossiersByAgent - URL: http://localhost:8089/carthage-creance/api/dossiers/agent/20
🔍 DossierApiService.getDossiersByAgent - agentId: 20
✅ DossierApiService.getDossiersByAgent - Réponse reçue: X dossiers
```

**Si la réponse est 0 dossiers mais que le fallback en trouve** :
```
⚠️ Liste vide depuis l'endpoint /agent/{id}
⚠️ Vérification via fallback pour confirmer...
🔄 Fallback: Chargement de tous les dossiers et filtrage par agentResponsable...
🔄 Page 1/X chargée: 100 dossiers
✅ Dossier affecté trouvé: 38 ...
✅ Dossiers affectés filtrés: 1
```

### 2. **Vérifier dans Network (F12 → Network)**

- ✅ Plus d'erreur 400 "La taille de page doit être entre 1 et 100"
- ✅ Les appels utilisent `size=100` (pas 1000)
- ✅ Plusieurs appels paginés si nécessaire (`page=0`, `page=1`, etc.)

### 3. **Vérifier dans la Base de Données**

```sql
-- Vérifier les affectations dans dossier_utilisateurs
SELECT * FROM dossier_utilisateurs WHERE utilisateur_id = 20;

-- Vérifier les dossiers avec agentResponsable
SELECT id, titre, agent_responsable_id FROM dossier WHERE agent_responsable_id = 20;
```

**Si `dossier_utilisateurs` contient des affectations mais que `agent_responsable_id` est NULL** :
→ Le backend doit utiliser la table `dossier_utilisateurs` pour l'endpoint `/api/dossiers/agent/{agentId}`

---

## 📝 Fichiers Modifiés

1. ✅ `carthage-creance/src/app/dossier/components/liste-dossiers-agent/liste-dossiers-agent.component.ts`
   - Fallback avec pagination correcte (size=100, toutes les pages)
   - Logique améliorée pour gérer les listes vides

2. ✅ `carthage-creance/src/app/core/services/dossier-api.service.ts`
   - Logs de débogage dans `getDossiersByAgent()`

---

## 🎯 Résultat Attendu

Après ces corrections :

1. ✅ Plus d'erreur 400 "La taille de page doit être entre 1 et 100"
2. ✅ Tous les dossiers affectés sont chargés (même s'il y en a plus de 100)
3. ✅ Les dossiers s'affichent correctement dans l'interface
4. ✅ Les logs permettent de déboguer si l'endpoint principal ne fonctionne pas

---

## ⚠️ Action Backend Requise

Si les dossiers ne s'affichent toujours pas après ces corrections, **vérifier le backend** :

1. **L'endpoint `/api/dossiers/agent/{agentId}` utilise-t-il la table `dossier_utilisateurs` ?**
2. **La relation entre `Dossier` et `Utilisateur` est-elle correctement configurée ?**
3. **Le champ `agentResponsable` est-il rempli lors de l'affectation ?**

Si le backend utilise seulement `agentResponsable` et pas `dossier_utilisateurs`, il faut :
- Soit modifier le backend pour utiliser `dossier_utilisateurs`
- Soit s'assurer que `agentResponsable` est rempli lors de l'affectation

---

## 🔄 Prochaines Étapes

1. **Tester le frontend** avec les corrections
2. **Vérifier les logs** dans la console
3. **Si les dossiers ne s'affichent toujours pas**, vérifier le backend :
   - L'endpoint `/api/dossiers/agent/{agentId}` utilise-t-il `dossier_utilisateurs` ?
   - Le champ `agentResponsable` est-il rempli lors de l'affectation ?


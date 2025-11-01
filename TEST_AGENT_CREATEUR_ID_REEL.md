# Test de l'agentCreateurId avec ID Utilisateur Réel

## 🎯 Objectif
Vérifier que l'`agent_createur_id` utilise l'ID utilisateur réel de la base de données au lieu d'un ID généré.

## 🔧 Corrections Appliquées

### 1. **Service d'Authentification (`auth.service.ts`)**
- ✅ Modification de `getCurrentUserIdNumber()` pour ne plus générer d'ID
- ✅ Retour de `null` si l'ID est un email pour forcer la récupération depuis le backend
- ✅ Suppression de la méthode `hashEmailToNumber()` qui générait des IDs

### 2. **Composant de Gestion des Dossiers (`dossier-gestion.component.ts`)**
- ✅ Modification de `initializeAgentCreateurId()` pour récupérer l'ID réel depuis le backend
- ✅ Modification de `onIsChefChange()` pour récupérer l'ID réel depuis le backend
- ✅ Utilisation de `getUserIdFromBackend()` pour obtenir l'ID utilisateur réel

## 🔄 Flux de Récupération de l'ID

### 1. **Tentative Directe**
- Vérifier si l'ID utilisateur est déjà numérique
- Si oui → Utiliser directement

### 2. **Récupération depuis le Backend**
- Si l'ID est un email → Appeler `getUserIdFromBackend()`
- Cette méthode fait un appel à `/api/utilisateurs/by-email/{email}`
- Retourne l'ID réel de l'utilisateur depuis la base de données

### 3. **Fallback**
- Si la récupération échoue → Utiliser l'ID par défaut `1`

## 🧪 Tests à Effectuer

### Test 1: Vérification de l'ID Utilisateur Réel
1. **Se connecter** à l'application
2. **Ouvrir la console** du navigateur
3. **Aller dans "Gestion des Dossiers"**
4. **Cliquer sur "Nouveau Dossier"**
5. **Vérifier les logs** dans la console :
   ```
   🔄 Initialisation de l'agentCreateurId
   🔍 ID utilisateur numérique: [ID ou null]
   ⚠️ ID numérique non trouvé, tentative de récupération depuis le backend...
   ✅ ID utilisateur réel récupéré depuis le backend: [ID_RÉEL]
   ```

### Test 2: Création de Dossier par un Agent
1. **Se connecter en tant qu'agent**
2. **Créer un nouveau dossier** (sans cocher "Créer en tant que Chef")
3. **Vérifier dans phpMyAdmin** :
   ```sql
   SELECT id, titre, agent_createur_id, statut FROM dossier ORDER BY id DESC LIMIT 1;
   ```
4. **L'`agent_createur_id` doit contenir l'ID réel de l'agent**

### Test 3: Création de Dossier par un Chef
1. **Se connecter en tant que chef**
2. **Créer un nouveau dossier** avec "Créer en tant que Chef" coché
3. **Vérifier dans phpMyAdmin** :
   ```sql
   SELECT id, titre, agent_createur_id, statut FROM dossier ORDER BY id DESC LIMIT 1;
   ```
4. **L'`agent_createur_id` doit contenir l'ID réel du chef**

## 🔍 Vérifications dans phpMyAdmin

### Avant les Corrections
```sql
-- La plupart des dossiers avaient agent_createur_id = NULL
SELECT id, titre, agent_createur_id, statut FROM dossier WHERE agent_createur_id IS NULL;
```

### Après les Corrections
```sql
-- Tous les nouveaux dossiers devraient avoir l'ID utilisateur réel
SELECT id, titre, agent_createur_id, statut FROM dossier ORDER BY id DESC LIMIT 10;

-- Vérifier que l'ID correspond à un utilisateur existant
SELECT u.id, u.nom, u.prenom, u.email, u.role 
FROM utilisateur u 
WHERE u.id IN (
  SELECT DISTINCT agent_createur_id 
  FROM dossier 
  WHERE agent_createur_id IS NOT NULL
);
```

## 📊 Logs de Débogage

### Dans la Console du Navigateur
Rechercher ces logs lors de la création d'un dossier :
- `🔄 Initialisation de l'agentCreateurId`
- `🔍 ID utilisateur numérique: [ID ou null]`
- `⚠️ ID numérique non trouvé, tentative de récupération depuis le backend...`
- `✅ ID utilisateur réel récupéré depuis le backend: [ID_RÉEL]`
- `🔍 Données envoyées au backend:`
- `🔍 agentCreateurId dans dossierRequest: [ID_RÉEL]`

### Dans les Logs Backend
Vérifier que l'endpoint `/api/utilisateurs/by-email/{email}` est appelé et retourne l'ID correct.

## 🎯 Résultats Attendus

### Pour un Agent
- `agent_createur_id` = ID réel de l'agent depuis la table `utilisateur`
- `statut` = "EN_ATTENTE_VALIDATION"

### Pour un Chef
- `agent_createur_id` = ID réel du chef depuis la table `utilisateur`
- `statut` = "VALIDE"

## 🚨 Points d'Attention

1. **ID Réel**: L'ID utilisé est maintenant l'ID réel de l'utilisateur dans la base de données
2. **Endpoint Backend**: L'endpoint `/api/utilisateurs/by-email/{email}` doit être fonctionnel
3. **Fallback**: Si l'endpoint échoue, le système utilise l'ID `1` par défaut
4. **Logs**: Tous les logs sont disponibles dans la console pour le débogage

## ✅ Validation Finale

Après les tests, vérifier que :
- [ ] L'ID utilisé correspond à l'ID réel de l'utilisateur dans la table `utilisateur`
- [ ] Plus aucun nouveau dossier n'a `agent_createur_id = NULL`
- [ ] Les agents ont leur ID réel correctement assigné
- [ ] Les chefs ont leur ID réel correctement assigné
- [ ] Les logs montrent la récupération de l'ID réel depuis le backend
- [ ] Le backend reçoit bien l'`agentCreateurId` avec l'ID réel

## 🔧 Endpoint Backend Requis

Assurez-vous que cet endpoint fonctionne :
```
GET /api/utilisateurs/by-email/{email}
```

Il doit retourner :
```json
{
  "id": 123,
  "nom": "Nom",
  "prenom": "Prénom",
  "email": "email@example.com",
  "role": "AGENT_DOSSIER"
}
```




# 🧪 TEST DE L'ENDPOINT BACKEND

## 🎯 **OBJECTIF**

Vérifier que l'endpoint `/api/utilisateurs/by-email/{email}` fonctionne correctement et retourne un ID numérique.

## 🔍 **ÉTAPES DE TEST**

### **Étape 1 : Test avec Postman/Insomnia**

1. **Ouvrez Postman ou Insomnia**
2. **Créez une nouvelle requête GET**
3. **URL :** `http://localhost:8089/carthage-creance/api/utilisateurs/by-email/souhailnasr80@gmail.com`
4. **Headers :**
   - `Authorization: Bearer VOTRE_TOKEN_JWT`
   - `Content-Type: application/json`

### **Étape 2 : Vérifier la réponse**

**Réponse attendue (200 OK) :**
```json
{
  "id": 32,
  "nom": "Nasr",
  "prenom": "Souhail",
  "email": "souhailnasr80@gmail.com",
  "role": "CHEF_DEPARTEMENT_DOSSIER"
}
```

**Si vous obtenez une erreur 404 :**
- L'utilisateur n'existe pas dans la base de données
- Vérifiez que l'email est correct

**Si vous obtenez une erreur 500 :**
- L'endpoint n'est pas correctement implémenté
- Vérifiez les logs du backend

### **Étape 3 : Test dans le navigateur**

1. **Ouvrez les outils de développement (F12)**
2. **Allez dans l'onglet Console**
3. **Exécutez cette commande :**
```javascript
fetch('http://localhost:8089/carthage-creance/api/utilisateurs/by-email/souhailnasr80@gmail.com', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token'),
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Réponse backend:', data))
.catch(error => console.error('Erreur:', error));
```

## 🎯 **RÉSULTATS ATTENDUS**

### **✅ SUCCÈS :**
- **Code de statut :** 200 OK
- **Corps de la réponse :** Objet JSON avec `id` numérique
- **Logs frontend :** `✅ ID utilisateur récupéré depuis le backend: 32`

### **❌ ÉCHEC :**
- **Code de statut :** 404, 500, ou autre
- **Erreur dans la console :** Message d'erreur spécifique
- **Logs frontend :** `❌ Impossible de récupérer l'ID utilisateur depuis le backend`

## 🔧 **SOLUTIONS SELON LE RÉSULTAT**

### **Si 404 Not Found :**
- L'utilisateur n'existe pas dans la base de données
- Vérifiez que l'email est correct
- Créez l'utilisateur dans la base de données

### **Si 500 Internal Server Error :**
- L'endpoint n'est pas correctement implémenté
- Vérifiez les logs du backend
- Vérifiez que la méthode `findByEmail` existe dans le service

### **Si 401 Unauthorized :**
- Le token JWT est invalide ou expiré
- Reconnectez-vous pour obtenir un nouveau token

## 📋 **LOGS À SURVEILLER**

Après le test, vous devriez voir dans la console :
- `⚠️ ID utilisateur non trouvé localement, tentative de récupération depuis le backend...`
- `✅ ID utilisateur récupéré depuis le backend: 32`
- `✅ Case "Créer en tant que Chef" cochée - agentCreateurId défini à: 32`
- `🔍 Valeur du contrôle après setValue: 32`

**Si vous voyez ces logs, l'endpoint fonctionne correctement !** 🎉






















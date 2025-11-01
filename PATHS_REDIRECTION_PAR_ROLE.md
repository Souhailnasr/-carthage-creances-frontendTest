# 🗺️ Chemins de Redirection après Connexion par Rôle

## 📋 **Tableau Récapitulatif**

| Rôle | Chemin de Redirection | Description |
|------|----------------------|-------------|
| **SUPER_ADMIN** | `/admin/dashboard` | Tableau de bord Super Administrateur |
| **CHEF_DEPARTEMENT_DOSSIER** | `/dossier/chef-dashboard` | Interface Chef Département Dossier |
| **AGENT_DOSSIER** | `/dossier/dashboard` | Tableau de bord Agent Dossier |
| **CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE** | `/juridique/dashboard` | Interface Chef Département Recouvrement Juridique |
| **AGENT_RECOUVREMENT_JURIDIQUE** | `/juridique/dashboard` | Interface Agent Recouvrement Juridique |
| **CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE** | `/chef-amiable/dashboard` | Interface Chef Département Recouvrement Amiable |
| **AGENT_RECOUVREMENT_AMIABLE** | `/chef-amiable/dashboard` | Interface Agent Recouvrement Amiable |
| **CHEF_DEPARTEMENT_FINANCE** | `/dashboard` | Tableau de bord Chef Département Finance |
| **AGENT_FINANCE** | `/dashboard` | Tableau de bord Agent Finance |

---

## 🔐 **Détails par Rôle**

### 1. **SUPER_ADMIN**
- **Rôle** : `SUPER_ADMIN`
- **Chemin de redirection** : `/admin/dashboard`
- **Description** : Tableau de bord Super Administrateur avec accès complet à toutes les fonctionnalités

### 2. **CHEF_DEPARTEMENT_DOSSIER**
- **Rôle** : `CHEF_DEPARTEMENT_DOSSIER`
- **Chemin de redirection** : `/dossier/chef-dashboard`
- **Description** : Interface Chef Département Dossier pour la validation et gestion des dossiers

### 3. **AGENT_DOSSIER**
- **Rôle** : `AGENT_DOSSIER`
- **Chemin de redirection** : `/dossier/dashboard`
- **Description** : Tableau de bord Agent Dossier pour la création et gestion de ses dossiers

### 4. **CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE**
- **Rôle** : `CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE`
- **Chemin de redirection** : `/juridique/dashboard`
- **Description** : Interface Chef Département Recouvrement Juridique

### 5. **AGENT_RECOUVREMENT_JURIDIQUE**
- **Rôle** : `AGENT_RECOUVREMENT_JURIDIQUE`
- **Chemin de redirection** : `/juridique/dashboard`
- **Description** : Interface Agent Recouvrement Juridique (partage le même dashboard que le chef)

### 6. **CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE**
- **Rôle** : `CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE`
- **Chemin de redirection** : `/chef-amiable/dashboard`
- **Description** : Interface Chef Département Recouvrement Amiable

### 7. **AGENT_RECOUVREMENT_AMIABLE**
- **Rôle** : `AGENT_RECOUVREMENT_AMIABLE`
- **Chemin de redirection** : `/chef-amiable/dashboard`
- **Description** : Interface Agent Recouvrement Amiable (partage le même dashboard que le chef)

### 8. **CHEF_DEPARTEMENT_FINANCE**
- **Rôle** : `CHEF_DEPARTEMENT_FINANCE`
- **Chemin de redirection** : `/dashboard`
- **Description** : Tableau de bord Chef Département Finance

### 9. **AGENT_FINANCE**
- **Rôle** : `AGENT_FINANCE`
- **Chemin de redirection** : `/dashboard`
- **Description** : Tableau de bord Agent Finance (partage le même dashboard que le chef)

---

## 📝 **Mapping Code (Référence)**

Si vous devez implémenter la redirection dans votre code :

```typescript
// Exemple de structure switch/case
switch (user.role) {
  case 'SUPER_ADMIN':
  case 'RoleUtilisateur_SUPER_ADMIN':
    return '/admin/dashboard';
    
  case 'CHEF_DEPARTEMENT_DOSSIER':
  case 'RoleUtilisateur_CHEF_DEPARTEMENT_DOSSIER':
    return '/dossier/chef-dashboard';
    
  case 'AGENT_DOSSIER':
  case 'RoleUtilisateur_AGENT_DOSSIER':
    return '/dossier/dashboard';
    
  case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
  case 'RoleUtilisateur_CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
    return '/juridique/dashboard';
    
  case 'AGENT_RECOUVREMENT_JURIDIQUE':
  case 'RoleUtilisateur_AGENT_RECOUVREMENT_JURIDIQUE':
    return '/juridique/dashboard';
    
  case 'CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
  case 'RoleUtilisateur_CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE':
    return '/chef-amiable/dashboard';
    
  case 'AGENT_RECOUVREMENT_AMIABLE':
  case 'RoleUtilisateur_AGENT_RECOUVREMENT_AMIABLE':
    return '/chef-amiable/dashboard';
    
  case 'CHEF_DEPARTEMENT_FINANCE':
  case 'RoleUtilisateur_CHEF_DEPARTEMENT_FINANCE':
    return '/dashboard';
    
  case 'AGENT_FINANCE':
  case 'RoleUtilisateur_AGENT_FINANCE':
    return '/dashboard';
    
  default:
    return '/dashboard'; // Route par défaut
}
```

---

## ⚠️ **Notes Importantes**

1. **Variantes de format de rôle** : Le backend peut retourner les rôles avec ou sans préfixe `RoleUtilisateur_`. Vérifiez les deux formats dans votre code.

2. **Chemins partagés** : Certains rôles partagent le même chemin de redirection :
   - Agents et Chefs du même département utilisent souvent le même dashboard
   - Les agents juridiques et leur chef → `/juridique/dashboard`
   - Les agents amiables et leur chef → `/chef-amiable/dashboard`

3. **Route par défaut** : Si le rôle n'est pas reconnu, utilisez `/dashboard` comme fallback.

4. **Validation** : Assurez-vous que tous ces chemins existent dans votre fichier de routes Angular (`app.routes.ts` ou modules de routing).

---

## ✅ **Vérification des Routes**

Assurez-vous que ces routes sont bien définies dans vos fichiers de routing :

- ✅ `/admin/dashboard` → `AdminModule` ou composant Admin Dashboard
- ✅ `/dossier/chef-dashboard` → `DossierModule` → Chef Dashboard Component
- ✅ `/dossier/dashboard` → `DossierModule` → Agent Dashboard Component
- ✅ `/juridique/dashboard` → `JuridiqueModule` → Juridique Dashboard Component
- ✅ `/chef-amiable/dashboard` → `ChefAmiableModule` → Chef Amiable Dashboard Component
- ✅ `/dashboard` → Dashboard générique (`DashboardComponent`)

---

## 🎯 **Comptes Réels de Test**

| Email | Rôle | Chemin de Redirection |
|-------|------|----------------------|
| `ali.mejri@gmail.com` | `SUPER_ADMIN` | `/admin/dashboard` |
| `mohamed.daas@gmail.com` | `CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE` | `/chef-amiable/dashboard` |
| `ahmed.daas@gmail.com` | `CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE` | `/juridique/dashboard` |
| `souhailnsrpro98@gmail.com` | `AGENT_DOSSIER` | `/dossier/dashboard` |
| `souhailnasr80@gmail.com` | `CHEF_DEPARTEMENT_DOSSIER` | `/dossier/chef-dashboard` |


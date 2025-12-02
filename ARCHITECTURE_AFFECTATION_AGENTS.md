# 🏗️ Architecture : Système d'Affectation de Dossiers aux Agents

## 📋 Vue d'Ensemble

Ce document décrit l'architecture complète du système d'affectation de dossiers aux agents avec les règles de permissions et les flux de travail.

---

## 🎯 Objectifs du Système

1. **Affectation de Dossiers** : Permettre aux chefs d'affecter des dossiers à leurs agents
2. **Gestion des Permissions** : Contrôler ce que les agents peuvent modifier
3. **Traçabilité** : Enregistrer toutes les modifications effectuées par les agents
4. **Validation** : Permettre aux chefs de valider les travaux des agents
5. **Historique** : Conserver un historique complet des affectations et modifications

---

## 🔄 Flux de Travail par Rôle

### 👔 Chef Dossier

#### 1. Affectation Simple
```
Chef Dossier → Sélectionne un dossier → Affecte à un Agent Dossier
→ Agent peut gérer le dossier
```

#### 2. Affectation avec Enquête
```
Chef Dossier → Sélectionne un dossier → Affecte avec enquête à un Agent Dossier
→ Agent gère l'enquête → Agent envoie l'enquête (statut: ENVOYEE)
→ Chef valide ou rejette l'enquête (statut: VALIDEE ou REJETEE)
```

### 👔 Chef Amiable

#### Affectation avec Actions
```
Chef Amiable → Crée des actions sur un dossier → Affecte le dossier avec actions à un Agent Amiable
→ Agent peut VOIR les actions du chef (lecture seule)
→ Agent peut AJOUTER de nouvelles actions
→ Agent peut MODIFIER/SUPPRIMER uniquement ses propres actions
→ Chef peut examiner toutes les modifications de l'agent
```

### 👔 Chef Juridique

#### Affectation avec Documents/Actions/Audiences
```
Chef Juridique → Crée documents/actions/audiences → Affecte le dossier à un Agent Juridique
→ Agent peut VOIR les documents/actions/audiences du chef (lecture seule)
→ Agent peut AJOUTER de nouveaux documents/actions/audiences
→ Agent peut MODIFIER/SUPPRIMER uniquement ses propres créations
→ Chef peut examiner toutes les modifications de l'agent
```

### 👤 Agent Dossier

#### Gestion des Dossiers
- Voir les dossiers qui lui sont affectés
- Gérer les informations du dossier
- Si enquête : gérer l'enquête et l'envoyer pour validation

### 👤 Agent Amiable

#### Gestion des Actions
- Voir les dossiers affectés avec leurs actions
- Consulter les actions créées par le chef (lecture seule)
- Ajouter de nouvelles actions
- Modifier/Supprimer uniquement ses propres actions

### 👤 Agent Juridique

#### Gestion Juridique
- Voir les dossiers affectés avec documents/actions/audiences
- Consulter les créations du chef (lecture seule)
- Ajouter de nouveaux documents/actions/audiences
- Modifier/Supprimer uniquement ses propres créations

---

## 🗄️ Modèle de Données

### Entité AffectationAgent

```sql
CREATE TABLE affectation_agent (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dossier_id BIGINT NOT NULL,
    agent_id BIGINT NOT NULL,
    chef_id BIGINT NOT NULL,
    type_affectation VARCHAR(50) NOT NULL,
    date_affectation DATETIME NOT NULL,
    date_fin_affectation DATETIME,
    statut VARCHAR(20) NOT NULL,
    commentaire TEXT,
    peut_modifier_actions_chef BOOLEAN DEFAULT FALSE,
    peut_modifier_documents_chef BOOLEAN DEFAULT FALSE,
    peut_modifier_audiences_chef BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (dossier_id) REFERENCES dossier(id),
    FOREIGN KEY (agent_id) REFERENCES user(id),
    FOREIGN KEY (chef_id) REFERENCES user(id)
);
```

### Modifications de l'Entité Dossier

```sql
ALTER TABLE dossier ADD COLUMN agent_dossier_id BIGINT;
ALTER TABLE dossier ADD COLUMN agent_amiable_id BIGINT;
ALTER TABLE dossier ADD COLUMN agent_juridique_id BIGINT;
ALTER TABLE dossier ADD COLUMN date_affectation_agent DATETIME;
ALTER TABLE dossier ADD COLUMN statut_enquete VARCHAR(20);
```

### Entité HistoriqueModification

```sql
CREATE TABLE historique_modification (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    dossier_id BIGINT,
    utilisateur_id BIGINT NOT NULL,
    type_modification VARCHAR(50) NOT NULL,
    entite_id BIGINT,
    action VARCHAR(20) NOT NULL,
    date_modification DATETIME NOT NULL,
    details TEXT,
    FOREIGN KEY (dossier_id) REFERENCES dossier(id),
    FOREIGN KEY (utilisateur_id) REFERENCES user(id)
);
```

---

## 🔐 Règles de Permissions

### Matrice des Permissions

| Rôle | Voir Actions Chef | Modifier Actions Chef | Ajouter Actions | Modifier Ses Actions |
|------|-------------------|---------------------|-----------------|---------------------|
| **Chef Amiable** | ✅ | ✅ | ✅ | ✅ |
| **Agent Amiable** | ✅ | ❌ | ✅ | ✅ |

| Rôle | Voir Documents Chef | Modifier Documents Chef | Ajouter Documents | Modifier Ses Documents |
|------|---------------------|----------------------|-------------------|----------------------|
| **Chef Juridique** | ✅ | ✅ | ✅ | ✅ |
| **Agent Juridique** | ✅ | ❌ | ✅ | ✅ |

| Rôle | Voir Audiences Chef | Modifier Audiences Chef | Ajouter Audiences | Modifier Ses Audiences |
|------|---------------------|----------------------|-------------------|----------------------|
| **Chef Juridique** | ✅ | ✅ | ✅ | ✅ |
| **Agent Juridique** | ✅ | ❌ | ✅ | ✅ |

---

## 🔄 Flux d'Affectation

### 1. Chef Affecte un Dossier

```
1. Chef sélectionne un dossier
2. Chef clique sur "Affecter à un Agent"
3. Dialog s'ouvre avec liste des agents disponibles
4. Chef sélectionne un agent et ajoute un commentaire (optionnel)
5. Backend crée une AffectationAgent avec statut ACTIVE
6. Backend met à jour le dossier avec l'agent affecté
7. Frontend affiche une notification de succès
8. Le dossier apparaît dans la liste des dossiers de l'agent
```

### 2. Agent Consulte un Dossier Affecté

```
1. Agent ouvre "Mes Dossiers"
2. Frontend charge les affectations actives de l'agent
3. Agent sélectionne un dossier
4. Frontend charge les permissions de l'agent pour ce dossier
5. Frontend affiche les actions/documents/audiences avec les permissions
6. Les actions du chef sont en lecture seule
7. L'agent peut ajouter de nouvelles actions
```

### 3. Agent Modifie une Action

```
1. Agent tente de modifier une action
2. Frontend vérifie les permissions :
   - Si action créée par l'agent → Modification autorisée
   - Si action créée par le chef → Vérification backend
3. Backend vérifie les permissions via AffectationAgentService
4. Si autorisé → Modification effectuée
5. Backend enregistre dans HistoriqueModification
6. Frontend met à jour l'affichage
```

### 4. Chef Valide une Enquête

```
1. Agent envoie l'enquête (statut: ENVOYEE)
2. Chef voit l'enquête en attente de validation
3. Chef valide ou rejette l'enquête
4. Backend met à jour le statut de l'enquête dans le dossier
5. Backend met à jour l'affectation avec le commentaire
6. Frontend affiche le résultat
```

---

## 📡 Endpoints API

### Affectation

- `POST /api/affectations/dossier` - Affecter un dossier (Chef Dossier)
- `POST /api/affectations/dossier/enquete` - Affecter avec enquête (Chef Dossier)
- `POST /api/affectations/actions-amiable` - Affecter avec actions (Chef Amiable)
- `POST /api/affectations/actions-juridique` - Affecter avec juridique (Chef Juridique)
- `PUT /api/affectations/{id}/terminer` - Terminer une affectation
- `PUT /api/affectations/enquete/valider` - Valider une enquête

### Consultation

- `GET /api/affectations/agent/{agentId}` - Affectations actives d'un agent
- `GET /api/affectations/dossier/{dossierId}` - Affectations d'un dossier
- `GET /api/affectations/chef/{chefId}` - Affectations créées par un chef
- `GET /api/affectations/permissions` - Permissions d'un agent sur un dossier

### Historique

- `GET /api/historique/dossier/{dossierId}` - Historique des modifications d'un dossier

---

## 🎨 Composants Frontend

### Composants Chefs

1. **GestionActionsComponent** (Chef Amiable)
   - Liste des dossiers
   - Bouton "Affecter à un Agent"
   - Dialog d'affectation

2. **GestionAudiencesComponent** (Chef Juridique)
   - Liste des dossiers
   - Bouton "Affecter à un Agent"
   - Dialog d'affectation

3. **HistoriqueModificationsComponent**
   - Affichage de l'historique des modifications
   - Filtres par type de modification
   - Détails des modifications

### Composants Agents

1. **MesDossiersComponent** (Agent Amiable/Juridique/Dossier)
   - Liste des dossiers affectés
   - Filtres et recherche
   - Accès aux détails

2. **DossierActionsAmiableComponent** (Modifié)
   - Affichage avec permissions
   - Boutons modifiés selon permissions
   - Indicateurs visuels pour les actions du chef

3. **HuissierDocumentsComponent** (Modifié)
   - Affichage avec permissions
   - Boutons modifiés selon permissions

4. **HuissierActionsComponent** (Modifié)
   - Affichage avec permissions
   - Boutons modifiés selon permissions

### Composants Partagés

1. **AffectationDialogComponent**
   - Sélection d'un agent
   - Commentaire optionnel
   - Confirmation

---

## 🔍 Vérifications Backend

### Lors de la Modification d'une Action

```java
// Dans ActionRecouvrementServiceImpl.updateAction()

1. Récupérer l'action
2. Récupérer l'utilisateur
3. Si utilisateur est AGENT_AMIABLE :
   a. Si action créée par l'agent → Autoriser
   b. Sinon → Vérifier permissions via AffectationAgentService
   c. Si peutModifierActionsChef = false → Rejeter
4. Si utilisateur est CHEF_AMIABLE → Autoriser
5. Effectuer la modification
6. Enregistrer dans HistoriqueModification
```

### Lors de la Suppression d'une Action

Même logique que pour la modification.

---

## ✅ Validation pour l'Affectation au Finance

### Conditions Requises

1. **Dossier Amiable** :
   - Au moins une action amiable créée

2. **Dossier Juridique** :
   - Au moins un document huissier OU
   - Au moins une action huissier OU
   - Au moins une audience

3. **Dossier avec Enquête** :
   - Enquête validée (statut: VALIDEE)

4. **Historique Complet** :
   - Toutes les étapes du workflow doivent être complétées

---

## 📊 Tableau de Bord

### Pour les Chefs

- Nombre de dossiers affectés par agent
- Nombre de dossiers en attente de validation
- Statistiques des modifications des agents

### Pour les Agents

- Nombre de dossiers affectés
- Nombre de dossiers en cours
- Nombre de dossiers terminés

---

## 🔔 Notifications

### Types de Notifications

1. **Affectation** : Notifier l'agent lorsqu'un dossier lui est affecté
2. **Validation** : Notifier l'agent lorsque son enquête est validée/rejetée
3. **Modification** : Notifier le chef lorsqu'un agent modifie quelque chose

---

## 🧪 Tests à Effectuer

### Tests Backend

- [ ] Test d'affectation d'un dossier
- [ ] Test d'affectation avec enquête
- [ ] Test de validation d'enquête
- [ ] Test des permissions (modification actions chef)
- [ ] Test de l'historique des modifications
- [ ] Test de validation pour affectation au finance

### Tests Frontend

- [ ] Test d'affichage des dossiers affectés
- [ ] Test des permissions dans l'interface
- [ ] Test du dialog d'affectation
- [ ] Test de l'historique des modifications
- [ ] Test de la validation pour affectation au finance

---

## 📝 Notes Importantes

1. **Sécurité** : Toutes les vérifications de permissions doivent être faites côté backend
2. **Performance** : Utiliser la pagination pour les listes de dossiers
3. **Traçabilité** : Toutes les modifications doivent être enregistrées dans l'historique
4. **UX** : Afficher clairement les permissions et restrictions dans l'interface
5. **Validation** : Valider toutes les conditions avant l'affectation au finance

---

**Architecture complète du système d'affectation ! 🎉**


# 🔗 Guide des Liens entre Modules et Dossiers

## 📋 Table des Matières

1. [Vue d'Ensemble](#vue-densemble)
2. [Structure d'un Dossier](#structure-dun-dossier)
3. [Liens Finance ↔ Dossiers](#liens-finance--dossiers)
4. [Liens Juridique ↔ Dossiers](#liens-juridique--dossiers)
5. [Liens Amiable ↔ Dossiers](#liens-amiable--dossiers)
6. [Flux Complet d'un Dossier](#flux-complet-dun-dossier)
7. [Routes et Navigation](#routes-et-navigation)
8. [Exemples Concrets](#exemples-concrets)

---

## 🎯 Vue d'Ensemble

Un **dossier** est l'élément central du système. Il peut passer par plusieurs phases et générer des frais à chaque étape. Le module **Finance** centralise tous ces frais et génère les factures.

### Modules Interconnectés

```
                    ┌─────────────┐
                    │   DOSSIER   │
                    │  (Central)  │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│    FINANCE    │  │   JURIDIQUE   │  │    AMIABLE     │
│               │  │               │  │                │
│ - Frais       │  │ - Audiences   │  │ - Actions      │
│ - Factures    │  │ - Avocats     │  │ - Relances     │
│ - Validation  │  │ - Huissiers   │  │ - Négociations │
│ - Rapports    │  │               │  │                │
└───────────────┘  └───────────────┘  └───────────────┘
        ▲                  ▲                  ▲
        │                  │                  │
        └──────────────────┴──────────────────┘
                           │
                    ┌──────┴──────┐
                    │   FINANCE   │
                    │ (Centralise)│
                    └─────────────┘
```

---

## 📁 Structure d'un Dossier

### Propriétés Principales

```typescript
interface Dossier {
  id: number;
  numeroDossier: string;
  titre: string;
  description: string;
  montantCreance: number;
  dateCreation: string;
  dossierStatus: 'ENCOURSDETRAITEMENT' | 'CLOTURE';
  statut: 'EN_ATTENTE_VALIDATION' | 'VALIDE' | 'REJETE' | 'EN_COURS' | 'CLOTURE';
  
  // Relations
  creancier: Creancier;
  debiteur: Debiteur;
  agentCreateur: Utilisateur;
  agentResponsable: Utilisateur;
  
  // Modules
  enquette?: Enquette;
  audiences?: Audience[];
  actions?: Action[];
  finance?: FinanceData;
  
  // Type de recouvrement
  typeRecouvrement?: 'AMIABLE' | 'JURIDIQUE';
}
```

### Phases d'un Dossier

1. **CREATION** : Dossier créé par un agent dossier
2. **AMIABLE** : Passage en recouvrement amiable
3. **ENQUETE** : Enquête effectuée
4. **JURIDIQUE** : Passage en recouvrement juridique
5. **CLOTURE** : Dossier clôturé

---

## 💰 Liens Finance ↔ Dossiers

### 1. Accès aux Dossiers depuis Finance

#### Routes
- **Dashboard Finance** : `/finance/dashboard`
  - Affiche les alertes avec liens vers les dossiers
  - Format : `[Dossier #123]` → Clic → `/dossier/detail/123`

- **Onglet Finance dans Dossier** : `/finance/dossier/:id/finance`
  - Accessible depuis : `/dossier/detail/:id` → Onglet "Finance"
  - Affiche tous les frais du dossier

- **Détail Facture** : `/finance/dossier/:id/facture`
  - Accessible depuis l'historique des factures
  - Affiche le détail d'une facture

#### Navigation
```typescript
// Depuis une alerte dans le dashboard
router.navigate(['/dossier', 'detail', dossierId]);

// Depuis le détail d'un dossier
router.navigate(['/finance', 'dossier', dossierId, 'finance']);

// Depuis une facture
router.navigate(['/finance', 'dossier', dossierId, 'facture']);
```

### 2. Création de Frais depuis un Dossier

#### Processus
1. Agent accède au dossier : `/dossier/detail/:id`
2. Clique sur l'onglet "Finance"
3. Clique sur "Ajouter un Frais"
4. Remplit le formulaire :
   - Phase : CREATION, AMIABLE, ENQUETE, ou JURIDIQUE
   - Catégorie : Type de frais
   - Quantité, Tarif, Fournisseur
5. Soumet → Frais créé avec statut "EN_ATTENTE"

#### Code TypeScript
```typescript
// Dans dossier-finance-tab.component.ts
createFrais(fraisData: FraisFormData): void {
  const frais: FluxFrais = {
    dossierId: this.dossierId,
    phase: fraisData.phase,
    categorie: fraisData.categorie,
    quantite: fraisData.quantite,
    tarifUnitaire: fraisData.tarifUnitaire,
    montant: fraisData.quantite * fraisData.tarifUnitaire,
    statut: 'EN_ATTENTE',
    dateAction: new Date().toISOString()
  };
  
  this.financeService.createFrais(frais).subscribe({
    next: () => {
      // Recharger les frais du dossier
      this.loadDossierFrais();
    }
  });
}
```

### 3. Génération de Facture

#### Processus
1. Dans l'onglet Finance d'un dossier
2. Vérifier qu'il y a des frais validés
3. Cliquer sur "Générer une Facture"
4. La facture est créée avec tous les frais validés
5. Télécharger le PDF

#### Code TypeScript
```typescript
generateFacture(): void {
  this.financeService.generateFacture(this.dossierId).subscribe({
    next: (facture) => {
      // Afficher la facture
      this.router.navigate(['/finance', 'dossier', this.dossierId, 'facture', facture.id]);
    }
  });
}
```

### 4. Suivi Financier d'un Dossier

#### Métriques Affichées
- **Total Frais Engagés** : Somme de tous les frais
- **Frais Validés** : Frais avec statut "VALIDE"
- **Frais en Attente** : Frais avec statut "EN_ATTENTE"
- **Montant Recouvré** : Montant récupéré sur la créance
- **Bénéfice Net** : Recouvré - Frais

#### Répartition par Phase
- Frais CREATION
- Frais AMIABLE
- Frais ENQUETE
- Frais JURIDIQUE

---

## ⚖️ Liens Juridique ↔ Dossiers

### 1. Affectation d'un Dossier au Recouvrement Juridique

#### Processus
1. Chef Dossier ou Super Admin affecte un dossier au recouvrement juridique
2. Le dossier apparaît dans `/dossiers/juridique`
3. Les agents juridiques peuvent y accéder

#### Route
- **Dossiers Juridiques** : `/dossiers/juridique`
- **Détail Dossier** : `/dossier/detail/:id`

### 2. Création d'Audiences

#### Processus
1. Agent juridique accède au dossier
2. Crée une audience (date, type, avocat, etc.)
3. L'audience est liée au dossier

#### Génération de Frais
- Lors de la création d'une audience, des frais peuvent être générés :
  - Honoraires avocat
  - Frais d'huissier
  - Frais de procédure

#### Code TypeScript
```typescript
// Dans juridique module
createAudience(dossierId: number, audienceData: AudienceData): void {
  this.juridiqueService.createAudience(dossierId, audienceData).subscribe({
    next: (audience) => {
      // Si des frais sont associés
      if (audienceData.frais) {
        this.createFraisJuridique(dossierId, audienceData.frais);
      }
    }
  });
}

createFraisJuridique(dossierId: number, fraisData: FraisData): void {
  const frais: FluxFrais = {
    dossierId: dossierId,
    phase: 'JURIDIQUE',
    categorie: fraisData.categorie, // "Honoraires Avocat", "Frais Huissier", etc.
    quantite: fraisData.quantite,
    tarifUnitaire: fraisData.tarifUnitaire,
    montant: fraisData.quantite * fraisData.tarifUnitaire,
    statut: 'EN_ATTENTE',
    dateAction: new Date().toISOString()
  };
  
  // Le frais est créé et apparaît dans "Validation Frais" (chef financier)
  this.financeService.createFrais(frais).subscribe();
}
```

### 3. Navigation entre Juridique et Finance

#### Depuis Juridique vers Finance
- Dans le détail d'un dossier juridique
- Onglet "Finance" → Affiche les frais juridiques
- Lien vers "Validation Frais" (si chef financier)

#### Depuis Finance vers Juridique
- Dans une alerte financière
- Clic sur le dossier → Redirection vers le détail
- Si le dossier est en phase juridique, affichage des audiences

---

## 🤝 Liens Amiable ↔ Dossiers

### 1. Affectation d'un Dossier au Recouvrement Amiable

#### Processus
1. Chef Dossier affecte un dossier au recouvrement amiable
2. Le dossier apparaît dans `/dossiers/amiable`
3. Les agents amiables peuvent y accéder

#### Route
- **Dossiers Amiables** : `/dossiers/amiable`
- **Détail Dossier** : `/dossier/detail/:id`

### 2. Création d'Actions Amiables

#### Types d'Actions
- **Appel téléphonique** : Contact avec le débiteur
- **Relance email** : Envoi d'email de relance
- **Relance courrier** : Envoi de courrier
- **Négociation** : Discussion pour un arrangement
- **Rendez-vous** : Rencontre avec le débiteur

#### Génération de Frais
- Certaines actions peuvent générer des frais :
  - Frais de déplacement
  - Frais de communication
  - Frais de courrier

#### Code TypeScript
```typescript
// Dans amiable module
createActionAmiable(dossierId: number, actionData: ActionAmiableData): void {
  this.amiableService.createAction(dossierId, actionData).subscribe({
    next: (action) => {
      // Si des frais sont associés
      if (actionData.frais) {
        this.createFraisAmiable(dossierId, actionData.frais);
      }
    }
  });
}

createFraisAmiable(dossierId: number, fraisData: FraisData): void {
  const frais: FluxFrais = {
    dossierId: dossierId,
    phase: 'AMIABLE',
    categorie: fraisData.categorie, // "Déplacement", "Communication", etc.
    quantite: fraisData.quantite,
    tarifUnitaire: fraisData.tarifUnitaire,
    montant: fraisData.quantite * fraisData.tarifUnitaire,
    statut: 'EN_ATTENTE',
    dateAction: new Date().toISOString()
  };
  
  // Le frais est créé et apparaît dans "Validation Frais" (chef financier)
  this.financeService.createFrais(frais).subscribe();
}
```

### 3. Navigation entre Amiable et Finance

#### Depuis Amiable vers Finance
- Dans le détail d'un dossier amiable
- Onglet "Finance" → Affiche les frais amiables
- Lien vers "Validation Frais" (si chef financier)

#### Depuis Finance vers Amiable
- Dans une alerte financière
- Clic sur le dossier → Redirection vers le détail
- Si le dossier est en phase amiable, affichage des actions

---

## 🔄 Flux Complet d'un Dossier

### Exemple : Dossier de Recouvrement Complet

```
1. CRÉATION
   ├─ Agent Dossier crée le dossier
   ├─ Ajoute des frais de création
   └─ Frais → Finance (EN_ATTENTE)

2. VALIDATION DOSSIER
   ├─ Chef Dossier valide le dossier
   └─ Dossier passe en statut VALIDE

3. RECOUVREMENT AMIABLE
   ├─ Dossier affecté au recouvrement amiable
   ├─ Agent Amiable crée des actions
   ├─ Génère des frais amiables
   └─ Frais → Finance (EN_ATTENTE)

4. VALIDATION FRAIS AMIABLES
   ├─ Chef Financier valide les frais
   └─ Frais passent en statut VALIDE

5. RECOUVREMENT JURIDIQUE
   ├─ Dossier affecté au recouvrement juridique
   ├─ Agent Juridique crée des audiences
   ├─ Génère des frais juridiques
   └─ Frais → Finance (EN_ATTENTE)

6. VALIDATION FRAIS JURIDIQUES
   ├─ Chef Financier valide les frais
   └─ Frais passent en statut VALIDE

7. GÉNÉRATION FACTURE
   ├─ Tous les frais sont validés
   ├─ Génération de la facture
   └─ Facture envoyée au créancier

8. CLÔTURE
   ├─ Dossier clôturé
   └─ Rapport final généré
```

---

## 🗺️ Routes et Navigation

### Routes Principales

#### Module Dossier
```typescript
/dossier
  ├─ /gestion              // Liste des dossiers
  ├─ /detail/:id           // Détail d'un dossier
  │   ├─ Onglet "Général"
  │   ├─ Onglet "Finance"   → /finance/dossier/:id/finance
  │   ├─ Onglet "Enquête"
  │   ├─ Onglet "Juridique"
  │   └─ Onglet "Amiable"
  ├─ /dashboard            // Dashboard agent dossier
  └─ /chef-dashboard       // Dashboard chef dossier
```

#### Module Finance
```typescript
/finance
  ├─ /dashboard            // Dashboard finance
  ├─ /validation-frais     // Validation des frais
  ├─ /tarifs               // Catalogue tarifs
  ├─ /import-frais         // Import CSV
  ├─ /rapports             // Rapports prédéfinis
  ├─ /reporting            // Reporting personnalisé
  ├─ /insights             // Insights IA
  ├─ /utilisateurs         // Gestion agents finance
  ├─ /dossier/:id/finance  // Onglet finance d'un dossier
  └─ /dossier/:id/facture  // Détail d'une facture
```

#### Module Juridique
```typescript
/juridique
  ├─ /dashboard            // Dashboard juridique
  ├─ /avocats              // Liste des avocats
  ├─ /huissiers            // Liste des huissiers
  └─ /audiences            // Liste des audiences

/dossiers/juridique        // Dossiers affectés au juridique
```

#### Module Amiable
```typescript
/amiable
  ├─ /actions              // Actions amiables
  └─ /relances             // Relances

/dossiers/amiable          // Dossiers affectés à l'amiable
```

### Navigation Inter-Modules

#### Depuis Finance vers Dossier
```typescript
// Dans une alerte
router.navigate(['/dossier', 'detail', dossierId]);

// Dans l'onglet finance d'un dossier
router.navigate(['/finance', 'dossier', dossierId, 'finance']);
```

#### Depuis Dossier vers Finance
```typescript
// Dans l'onglet finance
router.navigate(['/finance', 'dossier', dossierId, 'finance']);

// Vers validation frais (si chef financier)
router.navigate(['/finance', 'validation-frais']);
```

#### Depuis Juridique vers Finance
```typescript
// Dans le détail d'un dossier juridique
router.navigate(['/finance', 'dossier', dossierId, 'finance']);
```

#### Depuis Amiable vers Finance
```typescript
// Dans le détail d'un dossier amiable
router.navigate(['/finance', 'dossier', dossierId, 'finance']);
```

---

## 💡 Exemples Concrets

### Exemple 1 : Dossier avec Frais Multi-Phases

#### Scénario
Un dossier passe par toutes les phases et génère des frais à chaque étape.

#### Données
```json
{
  "dossier": {
    "id": 123,
    "numeroDossier": "DOS-2024-001",
    "montantCreance": 10000.00
  },
  "frais": [
    {
      "id": 1,
      "dossierId": 123,
      "phase": "CREATION",
      "categorie": "Frais de dossier",
      "montant": 50.00,
      "statut": "VALIDE"
    },
    {
      "id": 2,
      "dossierId": 123,
      "phase": "AMIABLE",
      "categorie": "Déplacement",
      "montant": 100.00,
      "statut": "VALIDE"
    },
    {
      "id": 3,
      "dossierId": 123,
      "phase": "ENQUETE",
      "categorie": "Expertise",
      "montant": 500.00,
      "statut": "VALIDE"
    },
    {
      "id": 4,
      "dossierId": 123,
      "phase": "JURIDIQUE",
      "categorie": "Honoraires Avocat",
      "montant": 800.00,
      "statut": "VALIDE"
    }
  ],
  "facture": {
    "id": 1,
    "dossierId": 123,
    "montantTotal": 1450.00,
    "statut": "GENEREE"
  }
}
```

#### Navigation
1. **Dashboard Finance** → Alerte sur dossier 123 → Clic → `/dossier/detail/123`
2. **Détail Dossier** → Onglet "Finance" → `/finance/dossier/123/finance`
3. **Onglet Finance** → Voir tous les frais → Total : 1450.00 TND
4. **Générer Facture** → Facture créée → `/finance/dossier/123/facture/1`

### Exemple 2 : Import en Masse et Validation

#### Scénario
Un agent financier importe 20 frais via CSV, puis le chef financier les valide.

#### Processus
1. **Agent Financier** :
   - Va dans `/finance/import-frais`
   - Importe le CSV avec 20 frais
   - Vérifie le rapport d'import

2. **Chef Financier** :
   - Va dans `/finance/validation-frais`
   - Voit les 20 frais en attente
   - Valide les frais un par un ou en masse
   - Vérifie les statistiques mises à jour

3. **Résultat** :
   - Tous les frais sont validés
   - Les dossiers concernés sont mis à jour
   - Les factures peuvent être générées

### Exemple 3 : Suivi d'un Dossier Juridique

#### Scénario
Un dossier passe en recouvrement juridique, génère des frais, et est suivi financièrement.

#### Processus
1. **Agent Juridique** :
   - Accède au dossier 456
   - Crée une audience
   - Ajoute un frais "Honoraires Avocat" : 500 TND

2. **Chef Financier** :
   - Voit le frais dans `/finance/validation-frais`
   - Valide le frais
   - Le frais passe en statut "VALIDE"

3. **Retour au Dossier** :
   - Dans `/dossier/detail/456` → Onglet "Finance"
   - Le frais juridique apparaît comme "VALIDE"
   - Le total des frais est mis à jour

---

## 🔍 Points d'Attention

### 1. Permissions
- Seul le **Chef Financier** peut valider les frais
- Les **Agents Finance** peuvent créer des frais mais pas les valider
- Les **Agents Dossier/Juridique/Amiable** peuvent créer des frais dans leurs modules respectifs

### 2. Statuts des Frais
- **EN_ATTENTE** : En attente de validation
- **VALIDE** : Validé par le chef financier
- **REJETE** : Rejeté par le chef financier
- **FACTURE** : Inclus dans une facture
- **PAYE** : Facture payée

### 3. Phases
- Les frais doivent être associés à une phase
- La phase détermine le contexte du frais
- Les phases sont : CREATION, AMIABLE, ENQUETE, JURIDIQUE

### 4. Liens entre Modules
- Tous les frais sont centralisés dans le module Finance
- Les dossiers sont accessibles depuis tous les modules
- La navigation est bidirectionnelle entre les modules

---

**Dernière mise à jour** : 2024-01-XX
**Version** : 1.0.0


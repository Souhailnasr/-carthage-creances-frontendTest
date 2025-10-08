# Module Juridique - Chef Juridique

## Vue d'ensemble
Ce module contient toutes les fonctionnalités pour le Chef Juridique, permettant de gérer les avocats, huissiers, audiences, et d'affecter les dossiers aux professionnels juridiques.

## Structure du Module

### Composants Principaux

#### 1. **JuridiqueDashboardComponent** (Tableau de Bord)
- **Fichiers**: 
  - `components/juridique-dashboard/juridique-dashboard.component.ts`
  - `components/juridique-dashboard/juridique-dashboard.component.html`
  - `components/juridique-dashboard/juridique-dashboard.component.scss`
  
- **Fonctionnalités**:
  - Statistiques globales des dossiers juridiques
  - Nombre total de dossiers, avocats, huissiers
  - Nombre d'audiences programmées et terminées
  - Taux de réussite global
  - **Performance des Agents Juridiques**:
    - Classement par montant récupéré
    - Nombre de dossiers assignés
    - Nombre d'audiences réalisées
    - Taux de réussite par agent
  - Liste des audiences récentes

#### 2. **AvocatsComponent** (Gestion des Avocats)
- **Fichiers**:
  - `components/avocats/avocats.component.ts`
  - `components/avocats/avocats.component.html`
  - `components/avocats/avocats.component.scss`
  
- **Fonctionnalités**:
  - Ajouter un nouvel avocat
  - Modifier les informations d'un avocat
  - Supprimer un avocat
  - Rechercher des avocats
  - Afficher la liste complète des avocats

#### 3. **HuissiersComponent** (Gestion des Huissiers)
- **Fichiers**:
  - `components/huissiers/huissiers.component.ts`
  - `components/huissiers/huissiers.component.html`
  - `components/huissiers/huissiers.component.scss`
  
- **Fonctionnalités**:
  - Ajouter un nouvel huissier
  - Modifier les informations d'un huissier
  - Supprimer un huissier
  - Rechercher des huissiers
  - Afficher la liste complète des huissiers

#### 4. **AffectationDossiersComponent** (Affectation des Dossiers)
- **Fichiers**:
  - `components/affectation-dossiers/affectation-dossiers.component.ts`
  - `components/affectation-dossiers/affectation-dossiers.component.html`
  - `components/affectation-dossiers/affectation-dossiers.component.scss`
  
- **Fonctionnalités**:
  - Afficher tous les dossiers en recouvrement juridique
  - Affecter un avocat à un dossier
  - Affecter un huissier à un dossier
  - Visualiser les affectations actuelles

#### 5. **AudiencesComponent** (Gestion des Audiences)
- **Fichiers**:
  - `components/audiences/audiences.component.ts`
  - `components/audiences/audiences.component.html`
  - `components/audiences/audiences.component.scss`
  
- **Fonctionnalités**:
  - Ajouter une nouvelle audience
  - Visualiser toutes les audiences par dossier
  - Enregistrer les décisions judiciaires
  - Supprimer des audiences
  - Calendrier pour sélectionner les dates
  - Types de tribunal: Première Instance, Appel, Cassation
  - Résultats de décision: Positive, Négative, Rapportée

### Composants de Support

#### Formulaires
- **AvocatFormComponent**: Formulaire pour ajouter/modifier un avocat
- **HuissierFormComponent**: Formulaire pour ajouter/modifier un huissier
- **AudienceFormComponent**: Formulaire pour ajouter/modifier une audience

#### Listes
- **AvocatListComponent**: Liste des avocats avec recherche
- **HuissierListComponent**: Liste des huissiers avec recherche

### Navigation
- **JuridiqueSidebarComponent**: Barre latérale de navigation
- **JuridiqueLayoutComponent**: Layout principal avec sidebar et contenu

## Services

### 1. **AvocatService**
- Gestion des avocats (CRUD)
- Endpoints: `/api/avocats`

### 2. **HuissierService**
- Gestion des huissiers (CRUD)
- Endpoints: `/api/huissiers`

### 3. **AudienceService**
- Gestion des audiences (CRUD)
- Endpoints: `/api/audiences`

## Modèles de Données

### Avocat
```typescript
interface Avocat {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  specialite?: string;
  numeroOrdre?: string;
  dateCreation?: Date;
}
```

### Huissier
```typescript
interface Huissier {
  id?: number;
  nom: string;
  prenom: string;
  email: string;
  telephone?: string;
  adresse?: string;
  numeroResidence?: string;
  dateCreation?: Date;
}
```

### Audience
```typescript
interface Audience {
  id?: number;
  dossierId: number;
  dateAudience: Date;
  dateProchaine?: Date;
  tribunalType: TribunalType;
  lieuTribunal: string;
  commentaireDecision?: string;
  decisionResult?: DecisionResult;
  avocatId?: number;
  huissierId?: number;
  avocat?: Avocat;
  huissier?: Huissier;
}

enum TribunalType {
  TRIBUNAL_PREMIERE_INSTANCE = 'TRIBUNAL_PREMIERE_INSTANCE',
  TRIBUNAL_APPEL = 'TRIBUNAL_APPEL',
  TRIBUNAL_CASSATION = 'TRIBUNAL_CASSATION'
}

enum DecisionResult {
  POSITIVE = 'POSITIVE',
  NEGATIVE = 'NEGATIVE',
  RAPPORTER = 'RAPPORTER'
}
```

## Routage

Le module utilise des composants standalone et le routage est défini dans `juridique-routes.ts`:

```typescript
export const juridiqueRoutes: Routes = [
  {
    path: '',
    component: JuridiqueLayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: JuridiqueDashboardComponent },
      { path: 'avocats', component: AvocatsComponent },
      { path: 'huissiers', component: HuissiersComponent },
      { path: 'affectation-dossiers', component: AffectationDossiersComponent },
      { path: 'audiences', component: AudiencesComponent }
    ]
  }
];
```

## Styles

### Fichier de Styles Global
- **`juridique-styles.scss`**: Contient tous les styles globaux réutilisables pour le module juridique
  - Variables de couleurs
  - Styles de formulaires
  - Styles de boutons
  - Styles de cartes
  - Styles de listes
  - Classes utilitaires
  - Animations
  - Responsive design

### Architecture des Styles
Tous les composants importent le fichier de styles global:
```scss
@import '../../../juridique-styles.scss';
```

## Fonctionnalités Spéciales

### 1. Statistiques de Performance des Agents
Le tableau de bord affiche un classement des agents juridiques (avocats et huissiers) par:
- Montant récupéré
- Nombre de dossiers assignés
- Nombre d'audiences réalisées
- Taux de réussite

### 2. Gestion des Audiences
- Ajout multiple d'audiences par dossier
- Suivi des décisions judiciaires
- Enregistrement des dates d'audiences suivantes
- Commentaires sur les décisions

### 3. Affectation Dynamique
- Interface intuitive pour affecter les professionnels
- Visualisation en temps réel des affectations
- Filtrage des dossiers en recouvrement juridique

## Sécurité et Accès

### Rôles Autorisés
- **CHEF_JURIDIQUE**: Accès complet à toutes les fonctionnalités
- **AGENT_JURIDIQUE**: Accès en lecture seule (à implémenter)

### Guards de Route
À implémenter pour protéger les routes:
```typescript
{
  path: 'juridique',
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['CHEF_JURIDIQUE', 'AGENT_JURIDIQUE'] },
  loadChildren: () => import('./juridique/juridique-routes').then(m => m.juridiqueRoutes)
}
```

## Intégration avec le Backend

### Endpoints Requis
- `GET /api/avocats`: Liste des avocats
- `POST /api/avocats`: Créer un avocat
- `PUT /api/avocats/{id}`: Modifier un avocat
- `DELETE /api/avocats/{id}`: Supprimer un avocat
- `GET /api/huissiers`: Liste des huissiers
- `POST /api/huissiers`: Créer un huissier
- `PUT /api/huissiers/{id}`: Modifier un huissier
- `DELETE /api/huissiers/{id}`: Supprimer un huissier
- `GET /api/audiences`: Liste des audiences
- `POST /api/audiences`: Créer une audience
- `PUT /api/audiences/{id}`: Modifier une audience
- `DELETE /api/audiences/{id}`: Supprimer une audience
- `GET /api/dossiers`: Liste des dossiers (filtrés par statut juridique)
- `PUT /api/dossiers/{id}/affecter-avocat`: Affecter un avocat
- `PUT /api/dossiers/{id}/affecter-huissier`: Affecter un huissier

## À Faire (TODO)

### Court Terme
- [ ] Implémenter les guards de route pour la sécurité
- [ ] Ajouter la validation des données côté backend
- [ ] Implémenter la gestion des erreurs avec des messages appropriés
- [ ] Ajouter des tests unitaires pour les composants
- [ ] Ajouter des tests E2E pour les flux principaux

### Moyen Terme
- [ ] Implémenter l'accès agent juridique en lecture seule
- [ ] Ajouter la pagination côté serveur
- [ ] Ajouter des filtres avancés pour les audiences
- [ ] Implémenter l'export PDF des rapports de performance
- [ ] Ajouter des notifications en temps réel

### Long Terme
- [ ] Intégrer un système de rappels pour les audiences
- [ ] Ajouter un calendrier interactif pour visualiser les audiences
- [ ] Implémenter un système de suivi des documents juridiques
- [ ] Ajouter des graphiques de performance
- [ ] Implémenter l'archivage des anciennes audiences

## Notes de Développement

### Composants Standalone
Tous les composants de ce module sont des composants standalone, ce qui signifie:
- Pas besoin de NgModule
- Imports directs dans le décorateur @Component
- Plus simple à tester et à réutiliser

### RxJS et Observables
Le module utilise intensivement RxJS pour:
- Gestion de l'état avec BehaviorSubject
- Souscriptions aux données
- Gestion des événements asynchrones

### Responsive Design
Tous les composants sont entièrement responsive et s'adaptent à:
- Desktop (> 1200px)
- Tablet (768px - 1200px)
- Mobile (< 768px)

## Support et Documentation

Pour toute question ou problème, consultez:
- Documentation Angular: https://angular.io/docs
- Documentation RxJS: https://rxjs.dev/guide/overview
- Guide TypeScript: https://www.typescriptlang.org/docs/

# Service DossierService - Documentation

## Vue d'ensemble

Le `DossierService` est un service Angular qui fournit une interface complète pour interagir avec l'API REST des dossiers. Il utilise `HttpClient` pour effectuer des requêtes HTTP et retourne des `Observable` pour une gestion asynchrone optimale.

## Configuration

### URL de Base
```
http://localhost:8089/carthage-creance/api/dossiers
```

### HttpClient
Le service utilise `HttpClient` qui est déjà configuré dans `app.config.ts` avec l'intercepteur d'erreur.

## Méthodes Disponibles

### 1. Création de Dossiers

#### `createDossier(dossierData: any): Observable<any>`
- **Endpoint**: `POST /api/dossiers/create`
- **Content-Type**: `application/json`
- **Description**: Crée un dossier avec les données JSON uniquement
- **Paramètres**: 
  - `dossierData`: Objet contenant toutes les propriétés du dossier
- **Retour**: Observable avec la réponse du serveur

#### `createDossierWithFiles(dossierData: any, contratFile?: File, pouvoirFile?: File): Observable<any>`
- **Endpoint**: `POST /api/dossiers/create`
- **Content-Type**: `multipart/form-data`
- **Description**: Crée un dossier avec fichiers joints
- **Paramètres**:
  - `dossierData`: Objet contenant les propriétés du dossier
  - `contratFile`: Fichier de contrat (optionnel)
  - `pouvoirFile`: Fichier de pouvoir (optionnel)
- **Retour**: Observable avec la réponse du serveur

### 2. Lecture de Dossiers

#### `getAllDossiers(): Observable<any>`
- **Endpoint**: `GET /api/dossiers`
- **Description**: Récupère tous les dossiers
- **Retour**: Observable avec la liste des dossiers

#### `getDossierById(id: number): Observable<any>`
- **Endpoint**: `GET /api/dossiers/{id}`
- **Description**: Récupère un dossier par son ID
- **Paramètres**:
  - `id`: Identifiant du dossier
- **Retour**: Observable avec les détails du dossier

#### `searchDossiers(term: string): Observable<any>`
- **Endpoint**: `GET /api/dossiers/search?term={term}`
- **Description**: Recherche des dossiers par terme
- **Paramètres**:
  - `term`: Terme de recherche
- **Retour**: Observable avec les résultats de recherche

### 3. Modification de Dossiers

#### `updateDossier(id: number, data: any): Observable<any>`
- **Endpoint**: `PUT /api/dossiers/{id}`
- **Content-Type**: `application/json`
- **Description**: Met à jour un dossier existant
- **Paramètres**:
  - `id`: Identifiant du dossier
  - `data`: Nouvelles données du dossier
- **Retour**: Observable avec la réponse du serveur

#### `deleteDossier(id: number): Observable<any>`
- **Endpoint**: `DELETE /api/dossiers/{id}`
- **Description**: Supprime un dossier
- **Paramètres**:
  - `id`: Identifiant du dossier à supprimer
- **Retour**: Observable avec la réponse du serveur

### 4. Assignation

#### `assignAgent(dossierId: number, agentId: number): Observable<any>`
- **Endpoint**: `PUT /api/dossiers/{dossierId}/assign/agent?agentId={agentId}`
- **Description**: Assigne un agent à un dossier
- **Paramètres**:
  - `dossierId`: Identifiant du dossier
  - `agentId`: Identifiant de l'agent
- **Retour**: Observable avec la réponse du serveur

#### `assignAvocat(dossierId: number, avocatId: number): Observable<any>`
- **Endpoint**: `PUT /api/dossiers/{dossierId}/assign/avocat?avocatId={avocatId}`
- **Description**: Assigne un avocat à un dossier
- **Paramètres**:
  - `dossierId`: Identifiant du dossier
  - `avocatId`: Identifiant de l'avocat
- **Retour**: Observable avec la réponse du serveur

#### `assignHuissier(dossierId: number, huissierId: number): Observable<any>`
- **Endpoint**: `PUT /api/dossiers/{dossierId}/assign/huissier?huissierId={huissierId}`
- **Description**: Assigne un huissier à un dossier
- **Paramètres**:
  - `dossierId`: Identifiant du dossier
  - `huissierId`: Identifiant du huissier
- **Retour**: Observable avec la réponse du serveur

## Gestion d'Erreurs

Toutes les méthodes du service incluent une gestion d'erreurs robuste :

1. **Interception des erreurs HTTP** avec `catchError`
2. **Affichage des erreurs dans la console** avec des messages détaillés
3. **Retour d'Observable d'erreur** pour permettre la gestion côté composant
4. **Messages d'erreur contextuels** spécifiques à chaque opération

## Composants d'Exemple

### DossierFormComponent
- Formulaire complet pour créer des dossiers
- Support des fichiers (contrat, pouvoir)
- Gestion de l'état de chargement
- Affichage des résultats et erreurs

### DossierListComponent
- Affichage de la liste des dossiers
- Recherche et filtrage
- Modification et suppression
- Modal de détail/édition
- Assignation d'agents/avocats/huissiers

### DossierDemoComponent
- Composant de démonstration
- Interface à onglets
- Documentation intégrée
- Exemples d'utilisation

## Utilisation

### Injection du Service
```typescript
import { DossierService } from './core/services/dossier.service';

constructor(private dossierService: DossierService) { }
```

### Exemple de Création
```typescript
const dossierData = {
  titre: 'Dossier Test',
  description: 'Description du dossier',
  montantCreance: 1000,
  // ... autres propriétés
};

this.dossierService.createDossier(dossierData).subscribe({
  next: (response) => {
    console.log('Dossier créé:', response);
  },
  error: (error) => {
    console.error('Erreur:', error);
  }
});
```

### Exemple avec Fichiers
```typescript
const contratFile = this.fileInput.nativeElement.files[0];
const pouvoirFile = this.fileInput2.nativeElement.files[0];

this.dossierService.createDossierWithFiles(dossierData, contratFile, pouvoirFile).subscribe({
  next: (response) => {
    console.log('Dossier créé avec fichiers:', response);
  },
  error: (error) => {
    console.error('Erreur:', error);
  }
});
```

## Structure des Données

### Objet Dossier
```typescript
interface DossierData {
  titre: string;
  description: string;
  numeroDossier: string;
  montantCreance: number;
  typeDocumentJustificatif: 'FACTURE' | 'CONTRAT' | 'BON_COMMANDE' | 'AUTRE';
  urgence: 'FAIBLE' | 'MOYENNE' | 'ELEVEE' | 'CRITIQUE';
  
  // Créancier
  typeCreancier: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  nomCreancier: string;
  prenomCreancier?: string;
  emailCreancier: string;
  telCreancier: string;
  adresseCreancier: string;
  
  // Débiteur
  typeDebiteur: 'PERSONNE_PHYSIQUE' | 'PERSONNE_MORALE';
  nomDebiteur: string;
  prenomDebiteur?: string;
  emailDebiteur: string;
  telDebiteur: string;
  adresseDebiteur: string;
  
  // Options
  pouvoir: boolean;
  contratSigne: boolean;
  isChef: boolean;
}
```

## Notes Importantes

1. **Pas de validation côté frontend** : Le service envoie les données telles quelles au backend
2. **Gestion asynchrone** : Toutes les méthodes retournent des Observable
3. **Gestion d'erreurs centralisée** : Les erreurs sont interceptées et loggées automatiquement
4. **Support des fichiers** : Méthode dédiée pour l'upload de fichiers
5. **Headers automatiques** : Le service configure automatiquement les headers appropriés
6. **URLs paramétrées** : Utilisation de HttpParams pour les paramètres de requête

## Tests

Pour tester le service, utilisez le composant `DossierDemoComponent` qui fournit une interface complète pour tester toutes les fonctionnalités.






















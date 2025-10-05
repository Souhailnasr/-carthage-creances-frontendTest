# ListeDossiersChefComponent

## Description
Composant Angular qui permet aux chefs de dossier de visualiser et valider les dossiers en attente de validation.

## Fonctionnalités

### Affichage des dossiers en attente
- **Titre** : Nom du dossier avec numéro et description
- **Montant** : Montant de la créance formaté en TND
- **Agent Créateur** : Nom/prénom de l'agent qui a créé le dossier
- **Date de création** : Date formatée en français

### Actions de validation
- **Bouton "Valider"** pour chaque dossier
- **Indicateur de chargement** pendant la validation
- **Rechargement automatique** après validation
- **Messages de succès/erreur** via ToastService

### Statistiques
- Nombre total de dossiers en attente
- Montant total des dossiers en attente

## Utilisation

### Dans un template
```html
<app-liste-dossiers-chef></app-liste-dossiers-chef>
```

### Dans un module
```typescript
import { ListeDossiersChefComponent } from './components/liste-dossiers-chef/liste-dossiers-chef.component';

@NgModule({
  declarations: [
    // autres composants
  ],
  imports: [
    ListeDossiersChefComponent
  ]
})
export class DossierModule { }
```

## API utilisée
- `getDossiersByStatut('ENCOURSDETRAITEMENT')` : Récupère les dossiers en attente
- `validateDossier(dossierId, chefId)` : Valide un dossier

## Dépendances
- `DossierApiService` : Service pour les appels API des dossiers
- `AuthService` : Service pour l'authentification
- `ToastService` : Service pour les notifications

## Workflow de validation
1. L'utilisateur clique sur "Valider"
2. Le composant appelle `validateDossier(dossierId, chefId)`
3. En cas de succès : message de succès + rechargement de la liste
4. En cas d'erreur : message d'erreur

## États du composant
- **Chargement** : Indicateur de chargement pendant les appels API
- **Erreur** : Message d'erreur en cas de problème
- **Vide** : Message quand aucun dossier en attente
- **Validation** : Bouton désactivé pendant la validation

## Design
- Interface moderne avec tableau responsive
- Boutons d'action avec états visuels
- Statistiques en haut de page
- Animations et transitions fluides
- Design responsive pour mobile

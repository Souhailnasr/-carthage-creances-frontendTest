# 🎨 Prompts Frontend - Workflow Finance Amélioré

## 📋 Vue d'Ensemble

Ce document contient les prompts détaillés pour implémenter les changements frontend nécessaires selon le document `WORKFLOW_FINANCE_AMELIORE_AVEC_ANNEXE.md`.

---

## 🎯 Prompt 1 : Service Finance - Gestion des Tarifs

### Contexte
Créer ou modifier le service Angular pour gérer les tarifs de dossier selon le nouveau workflow.

### Exigences

**Fichier** : `carthage-creance/src/app/core/services/finance.service.ts`

**Méthodes à ajouter/modifier** :

1. **`getTraitementsDossier(dossierId: number): Observable<TraitementsDossierDTO>`**
   - Appel : `GET /api/finances/dossier/{dossierId}/traitements`
   - Retourne tous les traitements organisés par phase
   - Gère les erreurs avec `catchError` et `ToastService`

2. **`ajouterTarif(dossierId: number, tarif: TarifDossierRequest): Observable<TarifDossierDTO>`**
   - Appel : `POST /api/finances/dossier/{dossierId}/tarif`
   - Body : `{ phase, categorie, typeElement, coutUnitaire, quantite, commentaire, elementId? }`
   - Retourne le tarif créé

3. **`validerTarif(tarifId: number, commentaire?: string): Observable<TarifDossierDTO>`**
   - Appel : `PUT /api/finances/tarif/{tarifId}/valider`
   - Body optionnel : `{ commentaire }`
   - Retourne le tarif validé

4. **`rejeterTarif(tarifId: number, commentaire: string): Observable<TarifDossierDTO>`**
   - Appel : `PUT /api/finances/tarif/{tarifId}/rejeter`
   - Body : `{ commentaire }` (obligatoire)
   - Retourne le tarif rejeté

5. **`getValidationEtat(dossierId: number): Observable<ValidationEtatDTO>`**
   - Appel : `GET /api/finances/dossier/{dossierId}/validation-etat`
   - Retourne l'état de validation par phase

6. **`genererFacture(dossierId: number): Observable<FactureDetailDTO>`**
   - Appel : `POST /api/finances/dossier/{dossierId}/generer-facture`
   - Retourne la facture générée avec détails

**Interfaces TypeScript à créer** :

```typescript
// Dans finance.models.ts ou nouveau fichier tarif.models.ts

export interface TarifDossierDTO {
  id?: number;
  dossierId: number;
  phase: PhaseFrais;
  categorie: string;
  typeElement: string;
  coutUnitaire: number;
  quantite: number;
  montantTotal: number;
  statut: StatutTarif;
  dateCreation?: Date | string;
  dateValidation?: Date | string;
  commentaire?: string;
  documentHuissierId?: number;
  actionHuissierId?: number;
  audienceId?: number;
  actionAmiableId?: number;
  enqueteId?: number;
}

export interface TarifDossierRequest {
  phase: PhaseFrais;
  categorie: string;
  typeElement: string;
  coutUnitaire: number;
  quantite?: number;
  commentaire?: string;
  elementId?: number; // ID de l'élément lié (action, document, audience, etc.)
}

export enum StatutTarif {
  EN_ATTENTE_VALIDATION = 'EN_ATTENTE_VALIDATION',
  VALIDE = 'VALIDE',
  REJETE = 'REJETE'
}

export interface TraitementsDossierDTO {
  phaseCreation: PhaseCreationDTO;
  phaseEnquete: PhaseEnqueteDTO;
  phaseAmiable: PhaseAmiableDTO;
  phaseJuridique: PhaseJuridiqueDTO;
}

export interface PhaseEnqueteDTO {
  enquetePrecontentieuse: TraitementDTO;
  traitementsPossibles: TraitementPossibleDTO[];
}

export interface TraitementPossibleDTO {
  type: string;
  libelle: string;
  tarifExistant: TarifDossierDTO | null;
  statut: string;
}

export interface ValidationEtatDTO {
  dossierId: number;
  statutGlobal: string;
  phases: {
    [key: string]: {
      statut: string;
      tarifsTotal: number;
      tarifsValides: number;
    };
  };
  peutGenererFacture: boolean;
}
```

---

## 🎯 Prompt 2 : Composant Validation des Tarifs - Phase Enquête

### Contexte
Créer un composant pour la phase ENQUETE où le chef financier peut cocher les traitements effectués (expertise, déplacement, etc.) et ajouter leurs coûts unitaires.

### Exigences

**Fichier** : `carthage-creance/src/app/finance/components/validation-tarifs-enquete/validation-tarifs-enquete.component.ts`

**Fonctionnalités** :

1. **Affichage** :
   - Afficher l'enquête précontentieuse avec frais fixe 300 TND
   - Afficher une liste de cases à cocher pour les traitements possibles :
     - ☐ Expertise
     - ☐ Déplacement
     - ☐ Autres traitements
   - Pour chaque traitement coché, afficher un formulaire :
     - Champ "Coût unitaire" (obligatoire, nombre)
     - Champ "Quantité" (optionnel, par défaut 1)
     - Champ "Commentaire" (optionnel, texte)

2. **Actions** :
   - Bouton "Ajouter Tarif" pour chaque traitement coché
   - Bouton "Valider" pour chaque tarif ajouté
   - Bouton "Rejeter" pour chaque tarif (avec commentaire obligatoire)

3. **Logique** :
   - `loadTraitements()` : Charger les traitements depuis l'API
   - `onTraitementToggle(traitement: TraitementPossibleDTO, checked: boolean)` : Gérer la sélection
   - `ajouterTarif(traitement: TraitementPossibleDTO)` : Créer le tarif
   - `validerTarif(tarif: TarifDossierDTO)` : Valider le tarif
   - `rejeterTarif(tarif: TarifDossierDTO, commentaire: string)` : Rejeter le tarif

4. **Affichage des tarifs** :
   - Liste des tarifs ajoutés avec :
     - Type de traitement
     - Coût unitaire
     - Quantité
     - Montant total
     - Statut (badge coloré : vert=validé, orange=en attente, rouge=rejeté)
     - Boutons d'action selon le statut

**Template HTML** :

```html
<div class="phase-enquete">
  <h3>Phase Enquête</h3>
  
  <!-- Enquête précontentieuse (fixe) -->
  <div class="traitement-fixe">
    <div class="traitement-info">
      <strong>Enquête Précontentieuse</strong>
      <span class="frais-fixe">300 TND (Fixe - Annexé)</span>
    </div>
    <div class="statut-badge" [ngClass]="getStatutClass(enquetePrecontentieuse.statut)">
      {{ enquetePrecontentieuse.statut }}
    </div>
    <button *ngIf="enquetePrecontentieuse.statut === 'EN_ATTENTE_TARIF'" 
            (click)="validerTarifFixe(enquetePrecontentieuse)">
      Valider
    </button>
  </div>
  
  <!-- Traitements possibles -->
  <div class="traitements-possibles">
    <h4>Traitements Additionnels</h4>
    <div *ngFor="let traitement of traitementsPossibles" class="traitement-item">
      <div class="checkbox-container">
        <input type="checkbox" 
               [id]="'traitement-' + traitement.type"
               [(ngModel)]="traitement.selected"
               (change)="onTraitementToggle(traitement, $event.target.checked)">
        <label [for]="'traitement-' + traitement.type">
          {{ traitement.libelle }}
        </label>
      </div>
      
      <!-- Formulaire si coché -->
      <div *ngIf="traitement.selected" class="tarif-form">
        <div class="form-group">
          <label>Coût unitaire (TND) *</label>
          <input type="number" 
                 [(ngModel)]="traitement.coutUnitaire"
                 min="0"
                 step="0.01"
                 class="form-control">
        </div>
        <div class="form-group">
          <label>Quantité</label>
          <input type="number" 
                 [(ngModel)]="traitement.quantite"
                 min="1"
                 value="1"
                 class="form-control">
        </div>
        <div class="form-group">
          <label>Commentaire</label>
          <textarea [(ngModel)]="traitement.commentaire" 
                    class="form-control"
                    rows="2"></textarea>
        </div>
        <button (click)="ajouterTarif(traitement)" 
                class="btn btn-primary">
          Ajouter Tarif
        </button>
      </div>
      
      <!-- Tarif existant -->
      <div *ngIf="traitement.tarifExistant" class="tarif-existant">
        <div class="tarif-info">
          <span>{{ traitement.tarifExistant.typeElement }}</span>
          <span>{{ traitement.tarifExistant.coutUnitaire }} TND × {{ traitement.tarifExistant.quantite }} = {{ traitement.tarifExistant.montantTotal }} TND</span>
        </div>
        <div class="statut-badge" [ngClass]="getStatutClass(traitement.tarifExistant.statut)">
          {{ traitement.tarifExistant.statut }}
        </div>
        <button *ngIf="traitement.tarifExistant.statut === 'EN_ATTENTE_VALIDATION'" 
                (click)="validerTarif(traitement.tarifExistant)"
                class="btn btn-success">
          Valider
        </button>
        <button *ngIf="traitement.tarifExistant.statut === 'EN_ATTENTE_VALIDATION'" 
                (click)="ouvrirModalRejet(traitement.tarifExistant)"
                class="btn btn-danger">
          Rejeter
        </button>
      </div>
    </div>
  </div>
  
  <!-- Total phase enquête -->
  <div class="total-phase">
    <strong>Total Phase Enquête : {{ totalPhaseEnquete }} TND</strong>
  </div>
</div>
```

**Styles SCSS** :
- Badges colorés pour les statuts
- Formulaire inline pour chaque traitement
- Espacement et alignement clairs

---

## 🎯 Prompt 3 : Composant Validation des Tarifs - Phase Amiable

### Contexte
Créer un composant pour la phase AMIABLE où le chef financier **vérifie** le coût unitaire de chaque action (qui peut déjà être présent) et valide le tarif.

### Exigences

**Fichier** : `carthage-creance/src/app/finance/components/validation-tarifs-amiable/validation-tarifs-amiable.component.ts`

**Fonctionnalités** :

1. **Affichage** :
   - Tableau des actions amiables avec colonnes :
     - Type d'action
     - Date
     - Nombre d'occurrences
     - Coût unitaire (éditable)
     - Montant total (calculé automatiquement : coût unitaire × occurrences)
     - Statut
     - Actions

2. **Actions** :
   - Modification du coût unitaire directement dans le tableau
   - Bouton "Enregistrer Tarif" pour chaque action
   - Bouton "Valider" pour chaque tarif enregistré
   - Bouton "Rejeter" pour chaque tarif

3. **Commissions** :
   - Section séparée pour les commissions
   - Affichage de la commission amiable (12%) si recouvrement réussi
   - Affichage de la commission relance < 6 mois (5%) si applicable
   - Boutons de validation pour les commissions

**Template HTML** :

```html
<div class="phase-amiable">
  <h3>Phase Amiable</h3>
  
  <!-- Actions amiables -->
  <div class="actions-amiable">
    <table class="table">
      <thead>
        <tr>
          <th>Type</th>
          <th>Date</th>
          <th>Occurrences</th>
          <th>Coût unitaire (TND)</th>
          <th>Montant total</th>
          <th>Statut</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr *ngFor="let action of actionsAmiables">
          <td>{{ getTypeActionLabel(action.type) }}</td>
          <td>{{ action.date | date:'dd/MM/yyyy' }}</td>
          <td>{{ action.occurrences }}</td>
          <td>
            <input type="number" 
                   [(ngModel)]="action.coutUnitaire"
                   min="0"
                   step="0.01"
                   class="form-control form-control-sm"
                   [readonly]="action.tarifExistant?.statut === 'VALIDE'">
          </td>
          <td>
            <strong>{{ calculerMontantTotal(action) }} TND</strong>
          </td>
          <td>
            <span *ngIf="action.tarifExistant" 
                  class="statut-badge" 
                  [ngClass]="getStatutClass(action.tarifExistant.statut)">
              {{ action.tarifExistant.statut }}
            </span>
            <span *ngIf="!action.tarifExistant" class="statut-badge en-attente">
              EN_ATTENTE_TARIF
            </span>
          </td>
          <td>
            <button *ngIf="!action.tarifExistant" 
                    (click)="enregistrerTarif(action)"
                    class="btn btn-sm btn-primary">
              Enregistrer
            </button>
            <button *ngIf="action.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION'" 
                    (click)="validerTarif(action.tarifExistant)"
                    class="btn btn-sm btn-success">
              Valider
            </button>
            <button *ngIf="action.tarifExistant?.statut === 'EN_ATTENTE_VALIDATION'" 
                    (click)="ouvrirModalRejet(action.tarifExistant)"
                    class="btn btn-sm btn-danger">
              Rejeter
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  
  <!-- Commissions -->
  <div class="commissions-section">
    <h4>Commissions</h4>
    <div *ngIf="commissionAmiable" class="commission-item">
      <div class="commission-info">
        <strong>Commission Recouvrement Amiable (12%)</strong>
        <span>{{ commissionAmiable.montant }} TND</span>
      </div>
      <div class="statut-badge" [ngClass]="getStatutClass(commissionAmiable.statut)">
        {{ commissionAmiable.statut }}
      </div>
      <button *ngIf="commissionAmiable.statut === 'EN_ATTENTE_VALIDATION'" 
              (click)="validerCommission(commissionAmiable)"
              class="btn btn-success">
        Valider Commission
      </button>
    </div>
  </div>
  
  <!-- Total phase amiable -->
  <div class="total-phase">
    <strong>Total Phase Amiable : {{ totalPhaseAmiable }} TND</strong>
  </div>
</div>
```

---

## 🎯 Prompt 4 : Composant Validation des Tarifs - Phase Juridique

### Contexte
Créer un composant pour la phase JURIDIQUE avec trois sous-sections : Documents Huissier, Actions Huissier, et Audiences.

### Exigences

**Fichier** : `carthage-creance/src/app/finance/components/validation-tarifs-juridique/validation-tarifs-juridique.component.ts`

**Fonctionnalités** :

1. **Onglets ou Sections** :
   - Onglet 1 : Documents Huissier
   - Onglet 2 : Actions Huissier
   - Onglet 3 : Audiences
   - Onglet 4 : Frais Fixes
   - Onglet 5 : Commissions

2. **Documents Huissier** :
   - Tableau avec colonnes : Type, Date, Coût unitaire (éditable), Statut, Actions
   - Bouton "Enregistrer Tarif" pour chaque document
   - Bouton "Valider" / "Rejeter" selon le statut

3. **Actions Huissier** :
   - Même structure que Documents Huissier

4. **Audiences** :
   - Tableau avec colonnes : Date, Type, Avocat, Coût audience (éditable), Honoraires avocat (éditable), Statut, Actions
   - Deux champs de saisie par audience (coût audience + honoraires avocat)

5. **Frais Fixes** :
   - Avance recouvrement judiciaire : 1000 TND (automatique)
   - Attestation de carence : 500 TND (si applicable)
   - Boutons de validation

6. **Commissions** :
   - Commission recouvrement judiciaire (15%)
   - Commission intérêts (50%)
   - Boutons de validation

---

## 🎯 Prompt 5 : Composant Principal - Validation Complète des Tarifs

### Contexte
Créer le composant principal qui affiche toutes les phases et permet la validation complète avant génération de facture.

### Exigences

**Fichier** : `carthage-creance/src/app/finance/components/validation-tarifs-complete/validation-tarifs-complete.component.ts`

**Fonctionnalités** :

1. **Structure** :
   - Onglets ou accordéon pour chaque phase
   - Récapitulatif global en bas
   - Bouton "Générer Facture" (activé uniquement si tous les tarifs validés)

2. **Chargement** :
   - `ngOnInit()` : Charger les traitements du dossier
   - `loadValidationEtat()` : Charger l'état de validation
   - Rafraîchissement automatique après chaque action

3. **Récapitulatif** :
   - Total par phase
   - Total HT
   - TVA (19%)
   - Total TTC
   - Indicateur visuel : "Tous les tarifs sont validés" ou "X tarifs en attente"

4. **Génération de Facture** :
   - Bouton désactivé si `peutGenererFacture === false`
   - Modal de confirmation
   - Appel API `genererFacture()`
   - Redirection vers la page de détail de la facture

**Template HTML** :

```html
<div class="validation-tarifs-complete">
  <h2>Validation des Tarifs - Dossier #{{ dossierId }}</h2>
  
  <!-- Onglets par phase -->
  <mat-tab-group>
    <mat-tab label="Création">
      <app-validation-tarifs-creation 
        [dossierId]="dossierId"
        [traitements]="traitements.phaseCreation"
        (tarifValide)="onTarifValide()">
      </app-validation-tarifs-creation>
    </mat-tab>
    
    <mat-tab label="Enquête">
      <app-validation-tarifs-enquete 
        [dossierId]="dossierId"
        [traitements]="traitements.phaseEnquete"
        (tarifValide)="onTarifValide()">
      </app-validation-tarifs-enquete>
    </mat-tab>
    
    <mat-tab label="Amiable">
      <app-validation-tarifs-amiable 
        [dossierId]="dossierId"
        [traitements]="traitements.phaseAmiable"
        (tarifValide)="onTarifValide()">
      </app-validation-tarifs-amiable>
    </mat-tab>
    
    <mat-tab label="Juridique">
      <app-validation-tarifs-juridique 
        [dossierId]="dossierId"
        [traitements]="traitements.phaseJuridique"
        (tarifValide)="onTarifValide()">
      </app-validation-tarifs-juridique>
    </mat-tab>
  </mat-tab-group>
  
  <!-- Récapitulatif -->
  <div class="recapitulatif">
    <h3>Récapitulatif</h3>
    <div class="totaux">
      <div class="ligne-total">
        <span>Frais Phase Création :</span>
        <strong>{{ totalCreation }} TND</strong>
      </div>
      <div class="ligne-total">
        <span>Frais Phase Enquête :</span>
        <strong>{{ totalEnquete }} TND</strong>
      </div>
      <div class="ligne-total">
        <span>Frais Phase Amiable :</span>
        <strong>{{ totalAmiable }} TND</strong>
      </div>
      <div class="ligne-total">
        <span>Commissions Amiable :</span>
        <strong>{{ totalCommissionsAmiable }} TND</strong>
      </div>
      <div class="ligne-total">
        <span>Frais Phase Juridique :</span>
        <strong>{{ totalJuridique }} TND</strong>
      </div>
      <div class="ligne-total">
        <span>Commissions Juridique :</span>
        <strong>{{ totalCommissionsJuridique }} TND</strong>
      </div>
      <hr>
      <div class="ligne-total">
        <span>TOTAL HT :</span>
        <strong>{{ totalHT }} TND</strong>
      </div>
      <div class="ligne-total">
        <span>TVA (19%) :</span>
        <strong>{{ tva }} TND</strong>
      </div>
      <div class="ligne-total total-ttc">
        <span>TOTAL TTC :</span>
        <strong>{{ totalTTC }} TND</strong>
      </div>
    </div>
    
    <!-- Indicateur de validation -->
    <div class="indicateur-validation" [ngClass]="getIndicateurClass()">
      <mat-icon>{{ getIndicateurIcon() }}</mat-icon>
      <span>{{ getIndicateurMessage() }}</span>
    </div>
    
    <!-- Bouton génération facture -->
    <button mat-raised-button 
            color="primary"
            [disabled]="!validationEtat?.peutGenererFacture"
            (click)="genererFacture()"
            class="btn-generer-facture">
      <mat-icon>receipt</mat-icon>
      Générer Facture
    </button>
  </div>
</div>
```

---

## 🎯 Prompt 6 : Routes et Navigation

### Exigences

**Fichier** : `carthage-creance/src/app/finance/finance-routes.ts`

**Routes à ajouter** :

```typescript
{
  path: 'validation-tarifs/:dossierId',
  component: ValidationTarifsCompleteComponent,
  canActivate: [AuthGuard],
  data: { roles: ['CHEF_DEPARTEMENT_FINANCE'] }
}
```

**Navigation** :
- Depuis le dashboard finance : Lien "Valider les tarifs" pour chaque dossier
- Depuis le détail d'un dossier : Onglet "Validation Tarifs"

---

## 🎯 Prompt 7 : Styles et UX

### Exigences

**Styles SCSS à créer** :

1. **Badges de statut** :
   - `.statut-badge.valide` : Fond vert, texte blanc
   - `.statut-badge.en-attente` : Fond orange, texte blanc
   - `.statut-badge.rejete` : Fond rouge, texte blanc

2. **Formulaires inline** :
   - Espacement cohérent
   - Champs de saisie alignés
   - Boutons d'action visibles

3. **Tableaux** :
   - Lignes alternées (zebra)
   - Hover sur les lignes
   - Colonnes alignées

4. **Récapitulatif** :
   - Fond légèrement gris
   - Totaux en gras
   - Total TTC mis en évidence

5. **Indicateurs visuels** :
   - Icônes Material pour les statuts
   - Messages clairs et colorés
   - Animations subtiles

---

## 🎯 Prompt 8 : Gestion des Erreurs et Notifications

### Exigences

**ToastService** :
- Succès : "Tarif ajouté avec succès", "Tarif validé", "Facture générée"
- Erreur : "Erreur lors de l'ajout du tarif", "Impossible de valider le tarif"
- Avertissement : "Veuillez remplir tous les champs obligatoires"

**Gestion des erreurs** :
- Afficher les messages d'erreur du backend
- Validation côté client avant envoi
- Désactiver les boutons pendant les appels API

---

## 📋 Checklist de Vérification Frontend

- [ ] Service `FinanceService` mis à jour avec nouvelles méthodes
- [ ] Interfaces TypeScript créées (`TarifDossierDTO`, `TraitementsDossierDTO`, etc.)
- [ ] Composant `ValidationTarifsEnqueteComponent` créé
- [ ] Composant `ValidationTarifsAmiableComponent` créé
- [ ] Composant `ValidationTarifsJuridiqueComponent` créé
- [ ] Composant `ValidationTarifsCompleteComponent` créé
- [ ] Routes configurées
- [ ] Styles SCSS appliqués
- [ ] Gestion des erreurs implémentée
- [ ] Notifications ToastService intégrées
- [ ] Tests unitaires pour les composants
- [ ] Tests d'intégration pour le workflow complet

---

**Dernière mise à jour** : 2024-12-01


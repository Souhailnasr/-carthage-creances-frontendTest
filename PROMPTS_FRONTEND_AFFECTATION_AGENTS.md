# 📋 Prompts Frontend : Système d'Affectation de Dossiers aux Agents

## 🎯 Vue d'Ensemble

Ce document contient tous les prompts nécessaires pour implémenter l'interface frontend du système d'affectation de dossiers aux agents avec des règles de permissions spécifiques.

---

## 📝 PROMPT 1 : Créer le Modèle AffectationAgent

### **Fichier à créer** : `src/app/shared/models/affectation-agent.model.ts`

```typescript
export interface AffectationAgent {
  id?: number;
  dossierId: number;
  numeroDossier?: string;
  agentId: number;
  agentNom?: string;
  agentPrenom?: string;
  chefId: number;
  chefNom?: string;
  chefPrenom?: string;
  typeAffectation: TypeAffectation;
  dateAffectation: Date | string;
  dateFinAffectation?: Date | string;
  statut: StatutAffectation;
  commentaire?: string;
  peutModifierActionsChef: boolean;
  peutModifierDocumentsChef: boolean;
  peutModifierAudiencesChef: boolean;
}

export enum TypeAffectation {
  DOSSIER = 'DOSSIER',
  ENQUETE = 'ENQUETE',
  ACTIONS_AMIABLES = 'ACTIONS_AMIABLES',
  ACTIONS_JURIDIQUES = 'ACTIONS_JURIDIQUES'
}

export enum StatutAffectation {
  ACTIVE = 'ACTIVE',
  TERMINEE = 'TERMINEE',
  ANNULEE = 'ANNULEE'
}

export enum StatutEnquete {
  EN_ATTENTE = 'EN_ATTENTE',
  EN_COURS = 'EN_COURS',
  ENVOYEE = 'ENVOYEE',
  VALIDEE = 'VALIDEE',
  REJETEE = 'REJETEE'
}

export interface PermissionsAgent {
  peutModifierActionsChef: boolean;
  peutModifierDocumentsChef: boolean;
  peutModifierAudiencesChef: boolean;
}
```

---

## 📝 PROMPT 2 : Créer le Service AffectationAgentService

### **Fichier à créer** : `src/app/core/services/affectation-agent.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AffectationAgent, PermissionsAgent, TypeAffectation } from '../../shared/models/affectation-agent.model';

@Injectable({
  providedIn: 'root'
})
export class AffectationAgentService {
  private apiUrl = `${environment.apiUrl}/affectations`;

  constructor(private http: HttpClient) {}

  /**
   * Affecter un dossier à un agent (Chef Dossier)
   */
  affecterDossier(dossierId: number, agentId: number, chefId: number, commentaire?: string): Observable<AffectationAgent> {
    const params = new HttpParams()
      .set('dossierId', dossierId.toString())
      .set('agentId', agentId.toString())
      .set('chefId', chefId.toString())
      .set('commentaire', commentaire || '');
    
    return this.http.post<AffectationAgent>(`${this.apiUrl}/dossier`, null, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Affecter un dossier avec enquête à un agent (Chef Dossier)
   */
  affecterDossierAvecEnquete(dossierId: number, agentId: number, chefId: number, commentaire?: string): Observable<AffectationAgent> {
    const params = new HttpParams()
      .set('dossierId', dossierId.toString())
      .set('agentId', agentId.toString())
      .set('chefId', chefId.toString())
      .set('commentaire', commentaire || '');
    
    return this.http.post<AffectationAgent>(`${this.apiUrl}/dossier/enquete`, null, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Affecter un dossier avec actions à un agent (Chef Amiable)
   */
  affecterDossierAvecActions(dossierId: number, agentId: number, chefId: number, commentaire?: string): Observable<AffectationAgent> {
    const params = new HttpParams()
      .set('dossierId', dossierId.toString())
      .set('agentId', agentId.toString())
      .set('chefId', chefId.toString())
      .set('commentaire', commentaire || '');
    
    return this.http.post<AffectationAgent>(`${this.apiUrl}/actions-amiable`, null, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Affecter un dossier avec documents/actions/audiences juridiques à un agent (Chef Juridique)
   */
  affecterDossierAvecJuridique(dossierId: number, agentId: number, chefId: number, commentaire?: string): Observable<AffectationAgent> {
    const params = new HttpParams()
      .set('dossierId', dossierId.toString())
      .set('agentId', agentId.toString())
      .set('chefId', chefId.toString())
      .set('commentaire', commentaire || '');
    
    return this.http.post<AffectationAgent>(`${this.apiUrl}/actions-juridique`, null, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Terminer une affectation
   */
  terminerAffectation(affectationId: number, chefId: number): Observable<AffectationAgent> {
    const params = new HttpParams()
      .set('chefId', chefId.toString());
    
    return this.http.put<AffectationAgent>(`${this.apiUrl}/${affectationId}/terminer`, null, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Valider une enquête (Chef Dossier)
   */
  validerEnquete(dossierId: number, chefId: number, valide: boolean, commentaire?: string): Observable<AffectationAgent> {
    const params = new HttpParams()
      .set('dossierId', dossierId.toString())
      .set('chefId', chefId.toString())
      .set('valide', valide.toString())
      .set('commentaire', commentaire || '');
    
    return this.http.put<AffectationAgent>(`${this.apiUrl}/enquete/valider`, null, { params })
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir toutes les affectations actives d'un agent
   */
  getAffectationsActivesAgent(agentId: number): Observable<AffectationAgent[]> {
    return this.http.get<AffectationAgent[]>(`${this.apiUrl}/agent/${agentId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir toutes les affectations d'un dossier
   */
  getAffectationsDossier(dossierId: number): Observable<AffectationAgent[]> {
    return this.http.get<AffectationAgent[]>(`${this.apiUrl}/dossier/${dossierId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir toutes les affectations créées par un chef
   */
  getAffectationsChef(chefId: number): Observable<AffectationAgent[]> {
    return this.http.get<AffectationAgent[]>(`${this.apiUrl}/chef/${chefId}`)
      .pipe(catchError(this.handleError));
  }

  /**
   * Obtenir les permissions d'un agent sur un dossier
   */
  getPermissions(dossierId: number, agentId: number): Observable<PermissionsAgent> {
    const params = new HttpParams()
      .set('dossierId', dossierId.toString())
      .set('agentId', agentId.toString());
    
    return this.http.get<PermissionsAgent>(`${this.apiUrl}/permissions`, { params })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans AffectationAgentService:', error);
    throw error;
  }
}
```

---

## 📝 PROMPT 3 : Créer le Composant Dialog d'Affectation

### **Fichier à créer** : `src/app/shared/components/dialogs/affectation-dialog/affectation-dialog.component.ts`

```typescript
import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AffectationAgentService } from '../../../../core/services/affectation-agent.service';
import { UserService } from '../../../../core/services/user.service';
import { User } from '../../../../shared/models/user.model';
import { TypeAffectation } from '../../../../shared/models/affectation-agent.model';

export interface AffectationDialogData {
  dossierId: number;
  numeroDossier: string;
  typeAffectation: TypeAffectation;
  chefId: number;
}

@Component({
  selector: 'app-affectation-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './affectation-dialog.component.html',
  styleUrls: ['./affectation-dialog.component.scss']
})
export class AffectationDialogComponent implements OnInit {
  agents: User[] = [];
  selectedAgentId: number | null = null;
  commentaire: string = '';
  loading = false;

  constructor(
    public dialogRef: MatDialogRef<AffectationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: AffectationDialogData,
    private affectationService: AffectationAgentService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadAgents();
  }

  loadAgents(): void {
    // Charger les agents selon le type d'affectation
    let roleName = '';
    switch (this.data.typeAffectation) {
      case TypeAffectation.DOSSIER:
      case TypeAffectation.ENQUETE:
        roleName = 'AGENT_DOSSIER';
        break;
      case TypeAffectation.ACTIONS_AMIABLES:
        roleName = 'AGENT_AMIABLE';
        break;
      case TypeAffectation.ACTIONS_JURIDIQUES:
        roleName = 'AGENT_JURIDIQUE';
        break;
    }

    this.userService.getUsersByRole(roleName).subscribe({
      next: (users) => {
        this.agents = users;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des agents:', error);
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (!this.selectedAgentId) {
      return;
    }

    this.loading = true;

    let affectationObservable;
    switch (this.data.typeAffectation) {
      case TypeAffectation.DOSSIER:
        affectationObservable = this.affectationService.affecterDossier(
          this.data.dossierId,
          this.selectedAgentId,
          this.data.chefId,
          this.commentaire
        );
        break;
      case TypeAffectation.ENQUETE:
        affectationObservable = this.affectationService.affecterDossierAvecEnquete(
          this.data.dossierId,
          this.selectedAgentId,
          this.data.chefId,
          this.commentaire
        );
        break;
      case TypeAffectation.ACTIONS_AMIABLES:
        affectationObservable = this.affectationService.affecterDossierAvecActions(
          this.data.dossierId,
          this.selectedAgentId,
          this.data.chefId,
          this.commentaire
        );
        break;
      case TypeAffectation.ACTIONS_JURIDIQUES:
        affectationObservable = this.affectationService.affecterDossierAvecJuridique(
          this.data.dossierId,
          this.selectedAgentId,
          this.data.chefId,
          this.commentaire
        );
        break;
    }

    if (affectationObservable) {
      affectationObservable.subscribe({
        next: (affectation) => {
          this.loading = false;
          this.dialogRef.close(affectation);
        },
        error: (error) => {
          console.error('Erreur lors de l\'affectation:', error);
          this.loading = false;
        }
      });
    }
  }
}
```

### **Fichier à créer** : `src/app/shared/components/dialogs/affectation-dialog/affectation-dialog.component.html`

```html
<h2 mat-dialog-title>
  <mat-icon>assignment_ind</mat-icon>
  Affecter le Dossier {{ data.numeroDossier }}
</h2>

<mat-dialog-content>
  <div class="affectation-form">
    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Agent</mat-label>
      <mat-select [(ngModel)]="selectedAgentId" required>
        <mat-option *ngFor="let agent of agents" [value]="agent.id">
          {{ agent.prenom }} {{ agent.nom }}
        </mat-option>
      </mat-select>
    </mat-form-field>

    <mat-form-field appearance="outline" class="full-width">
      <mat-label>Commentaire (optionnel)</mat-label>
      <textarea matInput [(ngModel)]="commentaire" rows="4"></textarea>
    </mat-form-field>
  </div>
</mat-dialog-content>

<mat-dialog-actions align="end">
  <button mat-button (click)="onCancel()" [disabled]="loading">Annuler</button>
  <button mat-raised-button color="primary" (click)="onConfirm()" [disabled]="!selectedAgentId || loading">
    <mat-icon *ngIf="loading" class="spinning">refresh</mat-icon>
    Confirmer
  </button>
</mat-dialog-actions>
```

---

## 📝 PROMPT 4 : Modifier le Composant GestionActions (Chef Amiable)

### **Modifier** : `src/app/chef-amiable/components/gestion-actions/gestion-actions.component.ts`

Ajouter les méthodes suivantes :

```typescript
import { AffectationAgentService } from '../../../core/services/affectation-agent.service';
import { AffectationDialogComponent, AffectationDialogData } from '../../../shared/components/dialogs/affectation-dialog/affectation-dialog.component';
import { TypeAffectation } from '../../../shared/models/affectation-agent.model';

// Dans la classe
affecterDossierAvecActions(): void {
  if (!this.dossierSelectionne || !this.dossierSelectionne.id) {
    return;
  }

  const currentUser = this.jwtAuthService.getCurrentUser();
  if (!currentUser || !currentUser.id) {
    this.snackBar.open('Utilisateur non connecté', 'Fermer', { duration: 3000 });
    return;
  }

  const dialogData: AffectationDialogData = {
    dossierId: this.dossierSelectionne.id,
    numeroDossier: this.dossierSelectionne.numeroDossier,
    typeAffectation: TypeAffectation.ACTIONS_AMIABLES,
    chefId: currentUser.id
  };

  const dialogRef = this.dialog.open(AffectationDialogComponent, {
    width: '500px',
    data: dialogData
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.snackBar.open('Dossier affecté avec succès', 'Fermer', { duration: 3000 });
      this.loadDossiers();
    }
  });
}
```

### **Modifier** : `src/app/chef-amiable/components/gestion-actions/gestion-actions.component.html`

Ajouter un bouton dans la section des actions rapides :

```html
<button mat-raised-button color="accent" 
        (click)="affecterDossierAvecActions()" 
        [disabled]="loading || !dossierSelectionne"
        matTooltip="Affecter ce dossier avec ses actions à un agent">
  <mat-icon>assignment_ind</mat-icon>
  Affecter à un Agent
</button>
```

---

## 📝 PROMPT 5 : Créer le Composant pour les Agents (Vue Agent)

### **Fichier à créer** : `src/app/agent-amiable/components/mes-dossiers/mes-dossiers.component.ts`

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AffectationAgentService } from '../../../core/services/affectation-agent.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { AffectationAgent } from '../../../shared/models/affectation-agent.model';
import { DossierApi } from '../../../shared/models/dossier-api.model';

@Component({
  selector: 'app-mes-dossiers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mes-dossiers.component.html',
  styleUrls: ['./mes-dossiers.component.scss']
})
export class MesDossiersComponent implements OnInit, OnDestroy {
  affectations: AffectationAgent[] = [];
  dossiers: Map<number, DossierApi> = new Map();
  loading = false;
  private destroy$ = new Subject<void>();

  constructor(
    private affectationService: AffectationAgentService,
    private dossierService: DossierApiService,
    private jwtAuthService: JwtAuthService
  ) {}

  ngOnInit(): void {
    this.loadAffectations();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAffectations(): void {
    const currentUser = this.jwtAuthService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      return;
    }

    this.loading = true;
    this.affectationService.getAffectationsActivesAgent(currentUser.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (affectations) => {
          this.affectations = affectations;
          // Charger les détails de chaque dossier
          affectations.forEach(affectation => {
            this.loadDossierDetails(affectation.dossierId);
          });
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des affectations:', error);
          this.loading = false;
        }
      });
  }

  loadDossierDetails(dossierId: number): void {
    this.dossierService.getDossierById(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossier) => {
          this.dossiers.set(dossierId, dossier);
        },
        error: (error) => {
          console.error(`Erreur lors du chargement du dossier ${dossierId}:`, error);
        }
      });
  }

  getDossier(dossierId: number): DossierApi | undefined {
    return this.dossiers.get(dossierId);
  }
}
```

---

## 📝 PROMPT 6 : Modifier DossierActionsAmiableComponent pour Gérer les Permissions

### **Modifier** : `src/app/dossier/components/dossier-actions-amiable/dossier-actions-amiable.component.ts`

```typescript
import { AffectationAgentService } from '../../../core/services/affectation-agent.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { PermissionsAgent } from '../../../shared/models/affectation-agent.model';

// Dans la classe
permissions: PermissionsAgent = {
  peutModifierActionsChef: false,
  peutModifierDocumentsChef: false,
  peutModifierAudiencesChef: false
};

ngOnInit(): void {
  // ... code existant ...
  this.loadPermissions();
}

loadPermissions(): void {
  if (!this.dossierId) {
    return;
  }

  const currentUser = this.jwtAuthService.getCurrentUser();
  if (!currentUser || !currentUser.id) {
    return;
  }

  // Vérifier si l'utilisateur est un agent
  const userRole = currentUser.role?.name;
  if (userRole !== 'AGENT_AMIABLE' && userRole !== 'AGENT_JURIDIQUE' && userRole !== 'AGENT_DOSSIER') {
    return;
  }

  this.affectationService.getPermissions(this.dossierId, currentUser.id)
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: (permissions) => {
        this.permissions = permissions;
      },
      error: (error) => {
        console.error('Erreur lors du chargement des permissions:', error);
      }
    });
}

canModifyAction(action: ActionRecouvrement): boolean {
  const currentUser = this.jwtAuthService.getCurrentUser();
  if (!currentUser || !currentUser.id) {
    return false;
  }

  // Si l'utilisateur est le créateur de l'action, il peut la modifier
  if (action.createurId === currentUser.id) {
    return true;
  }

  // Si l'utilisateur est un agent et que l'action a été créée par le chef
  const userRole = currentUser.role?.name;
  if (userRole === 'AGENT_AMIABLE') {
    // Vérifier si l'agent peut modifier les actions du chef
    return this.permissions.peutModifierActionsChef;
  }

  // Les chefs peuvent toujours modifier
  return userRole === 'CHEF_AMIABLE' || userRole === 'CHEF_DOSSIER';
}

canDeleteAction(action: ActionRecouvrement): boolean {
  // Même logique que canModifyAction
  return this.canModifyAction(action);
}
```

### **Modifier** : `src/app/dossier/components/dossier-actions-amiable/dossier-actions-amiable.component.html`

```html
<!-- Dans le tableau des actions -->
<td mat-cell *matCellDef="let action">
  <button mat-icon-button 
          (click)="editAction(action)" 
          [disabled]="!canModifyAction(action)"
          matTooltip="Modifier">
    <mat-icon>edit</mat-icon>
  </button>
  <button mat-icon-button 
          (click)="deleteAction(action.id!)" 
          [disabled]="!canDeleteAction(action)"
          matTooltip="Supprimer" 
          color="warn">
    <mat-icon>delete</mat-icon>
  </button>
</td>
```

---

## 📝 PROMPT 7 : Créer le Composant d'Historique des Modifications

### **Fichier à créer** : `src/app/chef-amiable/components/historique-modifications/historique-modifications.component.ts`

```typescript
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HistoriqueModificationService } from '../../../core/services/historique-modification.service';
import { HistoriqueModification } from '../../../shared/models/historique-modification.model';

@Component({
  selector: 'app-historique-modifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './historique-modifications.component.html',
  styleUrls: ['./historique-modifications.component.scss']
})
export class HistoriqueModificationsComponent implements OnInit {
  @Input() dossierId!: number;
  modifications: HistoriqueModification[] = [];
  loading = false;

  constructor(private historiqueService: HistoriqueModificationService) {}

  ngOnInit(): void {
    if (this.dossierId) {
      this.loadHistorique();
    }
  }

  loadHistorique(): void {
    this.loading = true;
    this.historiqueService.getHistoriqueDossier(this.dossierId).subscribe({
      next: (modifications) => {
        this.modifications = modifications;
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.loading = false;
      }
    });
  }
}
```

---

## 📝 PROMPT 8 : Modifier les Composants Huissier pour Gérer les Permissions

### **Modifier** : `src/app/juridique/components/huissier-documents/huissier-documents.component.ts`

Ajouter la même logique de permissions que pour les actions amiable :

```typescript
import { AffectationAgentService } from '../../../core/services/affectation-agent.service';
import { PermissionsAgent } from '../../../shared/models/affectation-agent.model';

permissions: PermissionsAgent = {
  peutModifierActionsChef: false,
  peutModifierDocumentsChef: false,
  peutModifierAudiencesChef: false
};

canModifyDocument(document: DocumentHuissier): boolean {
  const currentUser = this.jwtAuthService.getCurrentUser();
  if (!currentUser || !currentUser.id) {
    return false;
  }

  // Si l'utilisateur est le créateur du document, il peut le modifier
  if (document.createurId === currentUser.id) {
    return true;
  }

  // Si l'utilisateur est un agent et que le document a été créé par le chef
  const userRole = currentUser.role?.name;
  if (userRole === 'AGENT_JURIDIQUE') {
    return this.permissions.peutModifierDocumentsChef;
  }

  // Les chefs peuvent toujours modifier
  return userRole === 'CHEF_JURIDIQUE';
}
```

---

## 📝 PROMPT 9 : Ajouter les Routes pour les Agents

### **Modifier** : `src/app/app-routes.ts` ou le fichier de routes approprié

```typescript
// Routes pour les agents
{
  path: 'agent-amiable',
  loadChildren: () => import('./agent-amiable/agent-amiable-routes').then(m => m.agentAmiableRoutes),
  canActivate: [AuthGuard],
  data: { roles: ['AGENT_AMIABLE'] }
},
{
  path: 'agent-juridique',
  loadChildren: () => import('./agent-juridique/agent-juridique-routes').then(m => m.agentJuridiqueRoutes),
  canActivate: [AuthGuard],
  data: { roles: ['AGENT_JURIDIQUE'] }
},
{
  path: 'agent-dossier',
  loadChildren: () => import('./agent-dossier/agent-dossier-routes').then(m => m.agentDossierRoutes),
  canActivate: [AuthGuard],
  data: { roles: ['AGENT_DOSSIER'] }
}
```

---

## 📝 PROMPT 10 : Modifier le Sidebar pour Ajouter les Menus Agents

### **Modifier** : `src/app/shared/components/sidebar/sidebar.component.ts`

```typescript
// Ajouter dans menuItems selon le rôle
if (userRole === 'AGENT_AMIABLE') {
  this.menuItems.push({
    label: 'Mes Dossiers',
    icon: 'folder',
    route: '/agent-amiable/mes-dossiers'
  });
}

if (userRole === 'AGENT_JURIDIQUE') {
  this.menuItems.push({
    label: 'Mes Dossiers',
    icon: 'folder',
    route: '/agent-juridique/mes-dossiers'
  });
}

if (userRole === 'AGENT_DOSSIER') {
  this.menuItems.push({
    label: 'Mes Dossiers',
    icon: 'folder',
    route: '/agent-dossier/mes-dossiers'
  });
  this.menuItems.push({
    label: 'Mes Enquêtes',
    icon: 'search',
    route: '/agent-dossier/mes-enquetes'
  });
}
```

---

## 📝 PROMPT 11 : Créer le Service HistoriqueModificationService

### **Fichier à créer** : `src/app/core/services/historique-modification.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { HistoriqueModification } from '../../shared/models/historique-modification.model';

@Injectable({
  providedIn: 'root'
})
export class HistoriqueModificationService {
  private apiUrl = `${environment.apiUrl}/historique`;

  constructor(private http: HttpClient) {}

  getHistoriqueDossier(dossierId: number): Observable<HistoriqueModification[]> {
    return this.http.get<HistoriqueModification[]>(`${this.apiUrl}/dossier/${dossierId}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any): Observable<never> {
    console.error('Erreur dans HistoriqueModificationService:', error);
    throw error;
  }
}
```

---

## 📝 PROMPT 12 : Modifier la Validation pour l'Affectation au Finance

### **Modifier** : `src/app/core/services/dossier-api.service.ts`

```typescript
affecterAuFinance(dossierId: number): Observable<DossierApi> {
  // Vérifier d'abord si le dossier peut être affecté au finance
  return this.http.get<{ canAffect: boolean; errors: string[] }>(
    `${this.apiUrl}/${dossierId}/can-affect-finance`
  ).pipe(
    switchMap(validation => {
      if (!validation.canAffect) {
        throw new Error('Impossible d\'affecter au finance: ' + validation.errors.join(', '));
      }
      return this.http.put<DossierApi>(`${this.apiUrl}/${dossierId}/affecter/finance`, {});
    }),
    catchError(this.handleError)
  );
}
```

---

## ✅ Checklist d'Implémentation Frontend

- [ ] Créer le modèle `AffectationAgent` avec toutes les interfaces et énumérations
- [ ] Créer le service `AffectationAgentService` avec toutes les méthodes
- [ ] Créer le composant dialog `AffectationDialogComponent`
- [ ] Modifier `GestionActionsComponent` (Chef Amiable) pour ajouter le bouton d'affectation
- [ ] Créer le composant `MesDossiersComponent` pour les agents
- [ ] Modifier `DossierActionsAmiableComponent` pour gérer les permissions
- [ ] Modifier `HuissierDocumentsComponent` pour gérer les permissions
- [ ] Modifier `HuissierActionsComponent` pour gérer les permissions
- [ ] Modifier `GestionAudiencesComponent` pour gérer les permissions
- [ ] Créer le composant `HistoriqueModificationsComponent`
- [ ] Créer le service `HistoriqueModificationService`
- [ ] Ajouter les routes pour les agents
- [ ] Modifier le sidebar pour ajouter les menus agents
- [ ] Modifier la validation pour l'affectation au finance
- [ ] Ajouter les styles CSS nécessaires
- [ ] Tester toutes les fonctionnalités

---

## 🎨 Suggestions d'Amélioration UI/UX

1. **Badge d'affectation** : Afficher un badge sur les dossiers affectés
2. **Notifications** : Notifier les agents lorsqu'un dossier leur est affecté
3. **Filtres** : Permettre aux chefs de filtrer les dossiers par agent
4. **Statistiques** : Afficher le nombre de dossiers affectés par agent
5. **Timeline** : Afficher une timeline des affectations et modifications

---

**Tous les prompts frontend nécessaires pour implémenter le système d'affectation ! 🎉**


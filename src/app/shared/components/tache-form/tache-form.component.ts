import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { TacheCompleteService } from '../../../core/services/tache-complete.service';
import { UtilisateurService } from '../../../services/utilisateur.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import {
  CreateTacheUrgenteRequest,
  UpdateTacheUrgenteRequest,
  TypeTache,
  PrioriteTache,
  TacheUrgente
} from '../../../shared/models/tache-complete.model';
import { User } from '../../../shared/models/user.model';
import { Role } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-tache-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardModule,
    MatSnackBarModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './tache-form.component.html',
  styleUrls: ['./tache-form.component.scss']
})
export class TacheFormComponent implements OnInit {
  tacheForm: FormGroup;
  agents: User[] = [];
  loading = false;
  isEditMode = false;
  tacheId?: number;
  currentUser: User | null = null;
  isChef = false;
  isSuperAdmin = false;

  constructor(
    private fb: FormBuilder,
    private tacheService: TacheCompleteService,
    private utilisateurService: UtilisateurService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.tacheForm = this.fb.group({
      titre: ['', Validators.required],
      description: [''],
      type: ['', Validators.required],
      priorite: ['', Validators.required],
      agentAssignéId: ['', Validators.required],
      dateEcheance: ['', Validators.required],
      dossierId: [null],
      enqueteId: [null]
    });
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    
    // Vérifier si on est en mode édition
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.isEditMode = true;
        this.tacheId = +params['id'];
        this.loadTache(this.tacheId);
      }
    });
  }

  /**
   * Charge l'utilisateur actuel pour déterminer les permissions
   * Utilise JwtAuthService qui retourne un Observable<User>
   */
  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        if (user) {
          const role = String(user.roleUtilisateur || '');
          this.isChef = role.includes('CHEF');
          this.isSuperAdmin = role === String(Role.SUPER_ADMIN);
        }
        // Charger les agents après avoir obtenu l'utilisateur
        this.loadAgents();
      },
      error: (error) => {
        console.error('Erreur lors du chargement de l\'utilisateur:', error);
        // Essayer avec AuthService en fallback
        const fallbackUser = this.authService.getCurrentUser();
        if (fallbackUser) {
          this.currentUser = fallbackUser;
          const role = String(fallbackUser.roleUtilisateur || '');
          this.isChef = role.includes('CHEF');
          this.isSuperAdmin = role === String(Role.SUPER_ADMIN);
          this.loadAgents();
        }
      }
    });
  }

  /**
   * Charge les agents du département
   */
  loadAgents(): void {
    if (!this.currentUser) {
      return;
    }

    if (this.isSuperAdmin) {
      // SuperAdmin peut voir tous les agents
      this.utilisateurService.getAllUtilisateurs().subscribe({
        next: (users) => {
          // Mapper Utilisateur vers User et filtrer les agents
          this.agents = users
            .filter((u: any) => {
              const role = String(u.roleUtilisateur || u.role || '');
              return role.includes('AGENT');
            })
            .map((u: any) => new User({
              id: String(u.id || ''),
              nom: u.nom || '',
              prenom: u.prenom || '',
              email: u.email || '',
              roleUtilisateur: (u.roleUtilisateur || u.role || Role.AGENT_DOSSIER) as Role,
              actif: u.actif !== undefined ? u.actif : true
            }));
        },
        error: (error) => {
          console.error('Erreur lors du chargement des utilisateurs:', error);
        }
      });
    } else if (this.isChef && this.currentUser?.id) {
      // Chef peut voir ses agents
      const chefId = this.jwtAuthService.getCurrentUserId();
      if (chefId) {
        this.utilisateurService.getAgentsByChef(chefId).subscribe({
          next: (users) => {
            // Mapper Utilisateur vers User
            this.agents = users.map((u: any) => new User({
              id: String(u.id || ''),
              nom: u.nom || '',
              prenom: u.prenom || '',
              email: u.email || '',
              roleUtilisateur: (u.roleUtilisateur || u.role || Role.AGENT_DOSSIER) as Role,
              actif: u.actif !== undefined ? u.actif : true
            }));
          },
          error: (error) => {
            console.error('Erreur lors du chargement des agents:', error);
          }
        });
      }
    }
  }

  /**
   * Charge une tâche pour édition
   */
  loadTache(id: number): void {
    this.loading = true;
    this.tacheService.getTacheById(id).subscribe({
      next: (tache) => {
        const dateEcheance = typeof tache.dateEcheance === 'string' 
          ? new Date(tache.dateEcheance) 
          : tache.dateEcheance;
        this.tacheForm.patchValue({
          titre: tache.titre,
          description: tache.description,
          type: tache.type,
          priorite: tache.priorite,
          agentAssignéId: tache.agentAssignéId,
          dateEcheance: dateEcheance,
          dossierId: tache.dossierId,
          enqueteId: tache.enqueteId
        });
        this.loading = false;
      },
      error: (error) => {
        console.error('Erreur lors du chargement:', error);
        this.snackBar.open('Erreur lors du chargement de la tâche', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  /**
   * Soumet le formulaire
   */
  onSubmit(): void {
    if (this.tacheForm.invalid) {
      this.snackBar.open('Veuillez remplir tous les champs obligatoires', 'Fermer', { duration: 3000 });
      return;
    }

    const formValue = this.tacheForm.value;
    const dateEcheance = formValue.dateEcheance instanceof Date 
      ? formValue.dateEcheance 
      : new Date(formValue.dateEcheance);

    this.loading = true;

    if (this.isEditMode && this.tacheId) {
      // Mise à jour
      const request: UpdateTacheUrgenteRequest = {
        titre: formValue.titre,
        description: formValue.description,
        type: formValue.type,
        priorite: formValue.priorite,
        agentAssignéId: formValue.agentAssignéId,
        dateEcheance: dateEcheance,
        dossierId: formValue.dossierId || undefined,
        enqueteId: formValue.enqueteId || undefined
      };
      this.tacheService.updateTache(this.tacheId, request).subscribe({
        next: () => {
          this.snackBar.open('Tâche mise à jour avec succès', 'Fermer', { duration: 2000 });
          this.router.navigate(['/taches']);
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.snackBar.open('Erreur lors de la mise à jour', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
    } else {
      // Création
      const request: CreateTacheUrgenteRequest = {
        titre: formValue.titre,
        description: formValue.description,
        type: formValue.type,
        priorite: formValue.priorite,
        agentAssignéId: formValue.agentAssignéId,
        dateEcheance: dateEcheance,
        dossierId: formValue.dossierId || undefined,
        enqueteId: formValue.enqueteId || undefined
      };
      this.tacheService.createTache(request).subscribe({
        next: () => {
          this.snackBar.open('Tâche créée avec succès', 'Fermer', { duration: 2000 });
          this.router.navigate(['/taches']);
        },
        error: (error) => {
          console.error('Erreur:', error);
          this.snackBar.open('Erreur lors de la création', 'Fermer', { duration: 3000 });
          this.loading = false;
        }
      });
    }
  }
}


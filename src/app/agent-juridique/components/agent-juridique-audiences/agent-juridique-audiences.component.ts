import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AgentJuridiqueService, Audience } from '../../../core/services/agent-juridique.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { User } from '../../../shared/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-agent-juridique-audiences',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  templateUrl: './agent-juridique-audiences.component.html',
  styleUrls: ['./agent-juridique-audiences.component.scss']
})
export class AgentJuridiqueAudiencesComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  audiences: Audience[] = [];
  loading = false;
  showForm = false;
  audienceForm!: FormGroup;
  editingAudience: Audience | null = null;
  selectedDossierId: number | null = null;
  filterType: 'all' | 'my' | 'dossier' = 'all';
  
  statuts = ['PLANIFIEE', 'EN_COURS', 'TERMINEE', 'ANNULEE'];
  
  displayedColumns: string[] = ['dateAudience', 'typeAudience', 'tribunal', 'dossierId', 'statut', 'actions'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private agentJuridiqueService: AgentJuridiqueService,
    private jwtAuthService: JwtAuthService,
    private fb: FormBuilder,
    private toastService: ToastService,
    private route: ActivatedRoute
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.route.queryParams.subscribe(params => {
      if (params['dossierId']) {
        this.selectedDossierId = parseInt(params['dossierId']);
        this.filterType = 'dossier';
        this.loadAudiences();
      } else {
        this.loadAudiences();
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.audienceForm = this.fb.group({
      dossierId: [null, Validators.required],
      dateAudience: [new Date(), Validators.required],
      typeAudience: ['', Validators.required],
      tribunal: [''],
      avocatId: [null],
      huissierId: [null],
      statut: ['PLANIFIEE', Validators.required],
      resultat: [''],
      commentaire: ['']
    });
  }

  loadCurrentUser(): void {
    this.jwtAuthService.getCurrentUser().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.loadAudiences();
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement de l\'utilisateur:', error);
      }
    });
  }

  loadAudiences(): void {
    this.loading = true;
    
    if (this.filterType === 'dossier' && this.selectedDossierId) {
      this.agentJuridiqueService.getAudiencesByDossier(this.selectedDossierId).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (audiences) => {
          this.audiences = audiences;
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des audiences:', error);
          this.toastService.error('Erreur lors du chargement des audiences');
          this.loading = false;
        }
      });
    } else if (this.filterType === 'my' && this.currentUser?.id) {
      this.agentJuridiqueService.getAudiencesAffectees(parseInt(this.currentUser.id)).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (audiences) => {
          this.audiences = audiences;
          this.loading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des audiences:', error);
          this.toastService.error('Erreur lors du chargement des audiences');
          this.loading = false;
        }
      });
    } else {
      // Charger toutes les audiences (si l'agent a accès)
      this.loading = false;
      this.audiences = [];
    }
  }

  showCreateForm(dossierId?: number): void {
    this.editingAudience = null;
    this.showForm = true;
    if (dossierId) {
      this.selectedDossierId = dossierId;
      this.audienceForm.patchValue({ dossierId });
    } else if (this.selectedDossierId) {
      this.audienceForm.patchValue({ dossierId: this.selectedDossierId });
    }
    if (this.currentUser?.id) {
      this.audienceForm.patchValue({ agentId: parseInt(this.currentUser.id) });
    }
  }

  showEditForm(audience: Audience): void {
    this.editingAudience = audience;
    this.showForm = true;
    this.audienceForm.patchValue({
      dossierId: audience.dossierId,
      dateAudience: new Date(audience.dateAudience),
      typeAudience: audience.typeAudience,
      tribunal: audience.tribunal || '',
      avocatId: audience.avocatId,
      huissierId: audience.huissierId,
      statut: audience.statut,
      resultat: audience.resultat || '',
      commentaire: audience.commentaire || ''
    });
    this.selectedDossierId = audience.dossierId;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingAudience = null;
    this.initForm();
  }

  onSubmit(): void {
    if (this.audienceForm.invalid) {
      this.audienceForm.markAllAsTouched();
      return;
    }

    const formValue = this.audienceForm.value;
    const audienceData: Partial<Audience> = {
      dossierId: formValue.dossierId || this.selectedDossierId,
      dateAudience: formValue.dateAudience.toISOString(),
      typeAudience: formValue.typeAudience,
      tribunal: formValue.tribunal,
      avocatId: formValue.avocatId,
      huissierId: formValue.huissierId,
      statut: formValue.statut,
      resultat: formValue.resultat,
      commentaire: formValue.commentaire,
      agentId: this.currentUser?.id ? parseInt(this.currentUser.id) : undefined
    };

    if (this.editingAudience && this.editingAudience.id) {
      // Modifier
      this.agentJuridiqueService.updateAudience(this.editingAudience.id, audienceData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.toastService.success('Audience modifiée avec succès');
          this.cancelForm();
          this.loadAudiences();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la modification:', error);
          this.toastService.error('Erreur lors de la modification de l\'audience');
        }
      });
    } else {
      // Créer
      this.agentJuridiqueService.createAudience(audienceData).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.toastService.success('Audience créée avec succès');
          this.cancelForm();
          this.loadAudiences();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la création:', error);
          this.toastService.error('Erreur lors de la création de l\'audience');
        }
      });
    }
  }

  deleteAudience(audience: Audience): void {
    if (!audience.id) return;
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer cette audience ?`)) {
      this.agentJuridiqueService.deleteAudience(audience.id).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: () => {
          this.toastService.success('Audience supprimée avec succès');
          this.loadAudiences();
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression:', error);
          this.toastService.error('Erreur lors de la suppression de l\'audience');
        }
      });
    }
  }

  getStatutLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'PLANIFIEE': 'Planifiée',
      'EN_COURS': 'En Cours',
      'TERMINEE': 'Terminée',
      'ANNULEE': 'Annulée'
    };
    return labels[statut] || statut;
  }

  getStatutColor(statut: string): string {
    const colors: { [key: string]: string } = {
      'PLANIFIEE': 'primary',
      'EN_COURS': 'accent',
      'TERMINEE': '',
      'ANNULEE': 'warn'
    };
    return colors[statut] || '';
  }
}


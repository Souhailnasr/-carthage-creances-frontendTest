import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { DossierService } from '../../../core/services/dossier.service';
import { AvocatService } from '../../services/avocat.service';
import { HuissierService } from '../../services/huissier.service';
import { Avocat } from '../../models/avocat.model';
import { Huissier } from '../../models/huissier.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-affectation-dossiers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './affectation-dossiers.component.html',
  styleUrls: ['./affectation-dossiers.component.scss']
})
export class AffectationDossiersComponent implements OnInit, OnDestroy {
  dossiers: DossierApi[] = [];
  filteredDossiers: DossierApi[] = [];
  avocats: Avocat[] = [];
  huissiers: Huissier[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  showAssignmentForm: boolean = false;
  selectedDossier: DossierApi | null = null;
  assignmentForm!: FormGroup;
  private destroy$ = new Subject<void>();

  constructor(
    private dossierService: DossierService,
    private avocatService: AvocatService,
    private huissierService: HuissierService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.assignmentForm = this.fb.group({
      assigneeType: ['avocat', Validators.required],
      assigneeId: ['', Validators.required]
    });
  }

  loadData(): void {
    this.isLoading = true;
    
    // Load dossiers assigned to "recouvrement Juridique"
    this.dossierService.loadAll()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiers: any[]) => {
          // Filter dossiers assigned to juridical recovery
          this.dossiers = dossiers.filter((dossier: any) => 
            dossier.dossierStatus === 'ENCOURSDETRAITEMENT'
          );
          this.filteredDossiers = [...this.dossiers];
          this.isLoading = false;
        },
        error: (error: any) => {
          console.error('❌ Erreur lors du chargement des dossiers:', error);
          this.toastService.error('Erreur lors du chargement des dossiers');
          this.isLoading = false;
        }
      });

    // Load avocats
    this.avocatService.getAllAvocats()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocats) => {
          this.avocats = avocats;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des avocats:', error);
        }
      });

    // Load huissiers
    this.huissierService.getAllHuissiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissiers) => {
          this.huissiers = huissiers;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des huissiers:', error);
        }
      });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredDossiers = [...this.dossiers];
    } else {
      this.filteredDossiers = this.dossiers.filter(dossier =>
        dossier.numeroDossier?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.creancier.nom?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.debiteur.nom?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  showAssignmentModal(dossier: DossierApi): void {
    this.selectedDossier = dossier;
    this.showAssignmentForm = true;
    this.assignmentForm.reset();
    this.assignmentForm.patchValue({
      assigneeType: 'avocat'
    });
  }

  onAssigneeTypeChange(): void {
    this.assignmentForm.patchValue({
      assigneeId: ''
    });
  }

  onSubmitAssignment(): void {
    if (this.assignmentForm.invalid || !this.selectedDossier) {
      this.assignmentForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    const formValue = this.assignmentForm.value;
    const assigneeType = formValue.assigneeType;
    const assigneeId = formValue.assigneeId;

    let assigneeName = '';
    if (assigneeType === 'avocat') {
      const avocat = this.avocats.find(a => a.id === assigneeId);
      assigneeName = avocat ? `${avocat.prenom} ${avocat.nom}` : '';
    } else {
      const huissier = this.huissiers.find(h => h.id === assigneeId);
      assigneeName = huissier ? `${huissier.prenom} ${huissier.nom}` : '';
    }

    // Here you would typically call an API to assign the dossier
    // For now, we'll just show a success message
    this.toastService.success(`Dossier ${this.selectedDossier.numeroDossier} assigné à ${assigneeName}`);
    this.cancelAssignment();
  }

  cancelAssignment(): void {
    this.showAssignmentForm = false;
    this.selectedDossier = null;
    this.assignmentForm.reset();
  }

  getAssigneeOptions(): any[] {
    const assigneeType = this.assignmentForm.get('assigneeType')?.value;
    
    if (assigneeType === 'avocat') {
      return this.avocats.map(avocat => ({
        id: avocat.id,
        name: `${avocat.prenom} ${avocat.nom}`,
        email: avocat.email
      }));
    } else {
      return this.huissiers.map(huissier => ({
        id: huissier.id,
        name: `${huissier.prenom} ${huissier.nom}`,
        email: huissier.email
      }));
    }
  }
}
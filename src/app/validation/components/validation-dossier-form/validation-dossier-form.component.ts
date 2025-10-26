import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ValidationDossierRequest } from '../../../shared/models/validation-dossier.model';
import { ValidationDossierService, CreateValidationRequest } from '../../../core/services/validation-dossier.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { DossierApi } from '../../../shared/models/dossier-api.model';
import { Page } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-validation-dossier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './validation-dossier-form.component.html',
  styleUrls: ['./validation-dossier-form.component.scss']
})
export class ValidationDossierFormComponent implements OnInit, OnDestroy {
  @Input() dossierId?: number;
  @Output() validationCreated = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  validationForm: FormGroup;
  availableDossiers: DossierApi[] = [];
  loading = false;
  error: string | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private validationService: ValidationDossierService,
    private authService: AuthService,
    private toastService: ToastService,
    private dossierApiService: DossierApiService
  ) {
    this.validationForm = this.fb.group({
      dossierId: ['', Validators.required],
      commentaires: ['']
    });
  }

  ngOnInit(): void {
    this.loadAvailableDossiers();
    this.setupFormListeners();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormListeners(): void {
    // Si un dossierId est fourni en input, le pré-remplir
    if (this.dossierId) {
      this.validationForm.patchValue({
        dossierId: this.dossierId
      });
    }
  }

  private loadAvailableDossiers(): void {
    this.loading = true;
    this.error = null;

    // Charger tous les dossiers disponibles pour validation
    this.dossierApiService.getAllDossiers()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (dossiersPage: Page<DossierApi>) => {
          this.availableDossiers = dossiersPage.content;
          this.loading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des dossiers:', error);
          this.error = 'Erreur lors du chargement des dossiers';
          this.loading = false;
        }
      });
  }

  onSubmit(): void {
    if (this.validationForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.toastService.showError('Utilisateur non connecté');
      return;
    }

    const formValue = this.validationForm.value;
    const validationRequest: ValidationDossierRequest = {
      dossierId: parseInt(formValue.dossierId),
      agentCreateurId: parseInt(currentUser.id),
      commentaires: formValue.commentaires || undefined
    };

    this.loading = true;
    this.error = null;

    const createRequest: CreateValidationRequest = {
      dossier: { id: validationRequest.dossierId },
      agentCreateur: { id: validationRequest.agentCreateurId },
      commentaires: validationRequest.commentaires
    };
    
    this.validationService.createValidationDossier(createRequest)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (validation) => {
          console.log('Validation créée avec succès:', validation);
          this.toastService.showSuccess('Validation créée avec succès');
          this.validationCreated.emit();
          this.resetForm();
        },
        error: (error) => {
          console.error('Erreur lors de la création de la validation:', error);
          this.error = 'Erreur lors de la création de la validation';
          this.loading = false;
        }
      });
  }

  onCancel(): void {
    this.cancelled.emit();
  }

  private resetForm(): void {
    this.validationForm.reset();
    this.loading = false;
    this.error = null;
  }

  private markFormGroupTouched(): void {
    Object.keys(this.validationForm.controls).forEach(key => {
      const control = this.validationForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string | null {
    const field = this.validationForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} est requis`;
      }
    }
    return null;
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      dossierId: 'Dossier',
      commentaires: 'Commentaires'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.validationForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  getSelectedDossier(): DossierApi | null {
    const dossierId = this.validationForm.get('dossierId')?.value;
    return this.availableDossiers.find(d => d.id === parseInt(dossierId)) || null;
  }

  getCurrentUserName(): string {
    const user = this.authService.getCurrentUser();
    return user ? user.getFullName() : 'Utilisateur inconnu';
  }

  getCurrentDate(): string {
    return new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date());
  }
}

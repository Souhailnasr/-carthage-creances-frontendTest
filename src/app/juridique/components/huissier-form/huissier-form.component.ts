import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
// MatSnackBarModule not needed in standalone components
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged, takeUntil, Subject } from 'rxjs';

import { HuissierService } from '../../services/huissier.service';
import { ToastService } from '../../../core/services/toast.service';
import { Huissier, HuissierRequest } from '../../models/huissier.model';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-huissier-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatDialogModule
  ],
  templateUrl: './huissier-form.component.html',
  styleUrls: ['./huissier-form.component.scss']
})
export class HuissierFormComponent implements OnInit, OnDestroy {
  huissierForm!: FormGroup;
  isEditMode = false;
  isLoading = false;
  isSubmitting = false;
  huissierId: number | null = null;
  originalEmail = '';
  originalPhone = '';

  // Specialties for dropdown
  specialties: string[] = [
    'Signification',
    'Saisie',
    'Expulsion',
    'Recouvrement',
    'Autre'
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private huissierService: HuissierService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router,
    @Inject(MatDialog) private dialog: MatDialog
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.setupFormValidation();
    this.loadHuissierData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm(): void {
    this.huissierForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telephone: ['', [
        Validators.required,
        Validators.pattern(/^\d{8}$/)
      ]],
      adresse: ['', [Validators.maxLength(200)]],
      specialite: ['']
    });
  }

  private setupFormValidation(): void {
    // Email validation with debounce
    this.huissierForm.get('email')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(email => {
        if (email && email !== this.originalEmail && this.huissierForm.get('email')?.valid) {
          this.checkEmailExists(email);
        }
      });

    // Phone validation with debounce
    this.huissierForm.get('telephone')?.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(phone => {
        if (phone && phone !== this.originalPhone && this.huissierForm.get('telephone')?.valid) {
          this.checkPhoneExists(phone);
        }
      });
  }

  private loadHuissierData(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.isEditMode = true;
        this.huissierId = +id;
        this.loadHuissier(+id);
      }
    });
  }

  private loadHuissier(id: number): void {
    this.isLoading = true;
    this.huissierService.getHuissierById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissier) => {
          this.populateForm(huissier);
          this.originalEmail = huissier.email;
          this.originalPhone = huissier.telephone || '';
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement du huissier:', error);
          this.toastService.error('Erreur lors du chargement du huissier');
          this.isLoading = false;
          this.router.navigate(['/juridique/huissiers']);
        }
      });
  }

  private populateForm(huissier: Huissier): void {
    this.huissierForm.patchValue({
      nom: huissier.nom,
      prenom: huissier.prenom,
      email: huissier.email,
      telephone: huissier.telephone || '',
      adresse: huissier.adresse || '',
      specialite: huissier.specialite || ''
    });
  }

  private checkEmailExists(email: string): void {
    this.huissierService.checkEmailExists(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          if (exists) {
            this.huissierForm.get('email')?.setErrors({ emailExists: true });
            this.toastService.warning('Cet email est déjà utilisé par un autre huissier');
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors de la vérification de l\'email:', error);
        }
      });
  }

  private checkPhoneExists(phone: string): void {
    this.huissierService.checkPhoneExists(phone)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          if (exists) {
            this.huissierForm.get('telephone')?.setErrors({ phoneExists: true });
            this.toastService.warning('Ce numéro de téléphone est déjà utilisé par un autre huissier');
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors de la vérification du téléphone:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.huissierForm.invalid || this.isSubmitting) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.huissierForm.value;
    
    // Clean phone number to ensure 8 digits
    const cleanedPhone = (formValue.telephone || '').replace(/\D/g, '').slice(-8);
    
    const huissierRequest: HuissierRequest = {
      nom: formValue.nom.trim(),
      prenom: formValue.prenom.trim(),
      email: formValue.email.trim().toLowerCase(),
      telephone: cleanedPhone,
      adresse: formValue.adresse?.trim() || null,
      specialite: formValue.specialite?.trim() || null
    };

    const operation = this.isEditMode 
      ? this.huissierService.updateHuissier(this.huissierId!, huissierRequest)
      : this.huissierService.createHuissier(huissierRequest);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissier) => {
          const message = this.isEditMode 
            ? 'Huissier modifié avec succès' 
            : 'Huissier créé avec succès';
          this.toastService.success(message);
          this.router.navigate(['/juridique/huissiers']);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la sauvegarde:', error);
          this.toastService.error('Erreur lors de la sauvegarde du huissier');
          this.isSubmitting = false;
        }
      });
  }

  onCancel(): void {
    if (this.huissierForm.dirty) {
      const dialogRef = this.dialog.open(ConfirmDialogComponent, {
        width: '400px',
        data: {
          title: 'Confirmer l\'annulation',
          message: 'Vous avez des modifications non sauvegardées. Êtes-vous sûr de vouloir quitter ?',
          confirmText: 'Quitter',
          cancelText: 'Continuer'
        }
      });

      dialogRef.afterClosed().subscribe((result: boolean) => {
        if (result) {
          this.router.navigate(['/juridique/huissiers']);
        }
      });
    } else {
      this.router.navigate(['/juridique/huissiers']);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.huissierForm.controls).forEach(key => {
      const control = this.huissierForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.huissierForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} est requis`;
      }
      if (field.errors['email']) {
        return 'Format d\'email invalide';
      }
      if (field.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} doit contenir au moins ${field.errors['minlength'].requiredLength} caractères`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${field.errors['maxlength'].requiredLength} caractères`;
      }
      if (field.errors['pattern']) {
        if (fieldName === 'telephone') {
          return 'Le téléphone doit contenir exactement 8 chiffres';
        }
        return 'Format invalide';
      }
      if (field.errors['emailExists']) {
        return 'Cet email est déjà utilisé';
      }
      if (field.errors['phoneExists']) {
        return 'Ce numéro de téléphone est déjà utilisé';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      nom: 'Le nom',
      prenom: 'Le prénom',
      email: 'L\'email',
      telephone: 'Le téléphone',
      adresse: 'L\'adresse',
      specialite: 'La spécialité'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.huissierForm.get(fieldName);
    return !!(field?.invalid && field.touched);
  }

  get pageTitle(): string {
    return this.isEditMode ? 'Modifier le huissier' : 'Ajouter un huissier';
  }

  get submitButtonText(): string {
    return this.isEditMode ? 'Modifier' : 'Créer';
  }
}

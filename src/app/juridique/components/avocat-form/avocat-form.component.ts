import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { Avocat, AvocatRequest } from '../../models/avocat.model';
import { AvocatService } from '../../services/avocat.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-avocat-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  templateUrl: './avocat-form.component.html',
  styleUrls: ['./avocat-form.component.scss']
})
export class AvocatFormComponent implements OnInit, OnDestroy {
  @Input() avocat: Avocat | null = null;
  @Input() isEditMode: boolean = false;
  @Output() avocatSaved = new EventEmitter<Avocat>();
  @Output() formCancelled = new EventEmitter<void>();

  avocatForm!: FormGroup;
  isLoading: boolean = false;
  isCheckingEmail: boolean = false;
  isCheckingPhone: boolean = false;
  emailExists: boolean = false;
  phoneExists: boolean = false;
  avocatId: number | null = null;

  // Spécialités disponibles
  specialties: string[] = [
    'Droit civil',
    'Droit commercial',
    'Droit pénal',
    'Droit du travail',
    'Droit fiscal',
    'Droit immobilier',
    'Droit de la famille',
    'Droit des affaires',
    'Droit administratif',
    'Droit international'
  ];

  private destroy$ = new Subject<void>();

  // Getters pour les contrôles de formulaire
  get nomControl(): FormControl { return this.avocatForm.get('nom') as FormControl; }
  get prenomControl(): FormControl { return this.avocatForm.get('prenom') as FormControl; }
  get emailControl(): FormControl { return this.avocatForm.get('email') as FormControl; }
  get telephoneControl(): FormControl { return this.avocatForm.get('telephone') as FormControl; }
  get adresseControl(): FormControl { return this.avocatForm.get('adresse') as FormControl; }
  get specialiteControl(): FormControl { return this.avocatForm.get('specialite') as FormControl; }
  get numeroOrdreControl(): FormControl { return this.avocatForm.get('numeroOrdre') as FormControl; }
  get actifControl(): FormControl { return this.avocatForm.get('actif') as FormControl; }

  constructor(
    private fb: FormBuilder,
    private avocatService: AvocatService,
    private toastService: ToastService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupFormValidation();
    this.loadAvocatData();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadAvocatData(): void {
    // Vérifier si on est en mode édition via l'URL
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['id']) {
        this.avocatId = +params['id'];
        this.isEditMode = true;
        this.loadAvocat();
      }
    });
  }

  private loadAvocat(): void {
    if (this.avocatId) {
      this.isLoading = true;
      this.avocatService.getAvocatById(this.avocatId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (avocat) => {
            this.avocat = avocat;
            this.populateForm();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('❌ Erreur lors du chargement de l\'avocat:', error);
            this.toastService.error('Erreur lors du chargement de l\'avocat');
            this.router.navigate(['/juridique/avocats']);
            this.isLoading = false;
          }
        });
    }
  }

  initializeForm(): void {
    this.avocatForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      prenom: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(50)]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(100)]],
      telephone: ['', [
        Validators.required,
        Validators.pattern(/^\d{8}$/)
      ]],
      adresse: ['', [Validators.maxLength(200)]],
      specialite: [''],
      // backend entity does not include numeroOrdre/actif: removed from payload, but keep optional UI state if needed
      // numeroOrdre: ['', [Validators.maxLength(20)]],
      // actif: [true]
    });
  }

  private setupFormValidation(): void {
    // Validation en temps réel de l'email
    this.emailControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(email => {
        if (email && this.emailControl.valid && (!this.isEditMode || email !== this.avocat?.email)) {
          this.checkEmailExists(email);
        } else {
          this.emailExists = false;
        }
      });

    // Validation en temps réel du téléphone
    this.telephoneControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(phone => {
        if (phone && this.telephoneControl.valid && (!this.isEditMode || phone !== this.avocat?.telephone)) {
          this.checkPhoneExists(phone);
        } else {
          this.phoneExists = false;
        }
      });
  }

  private checkEmailExists(email: string): void {
    this.isCheckingEmail = true;
    this.avocatService.checkEmailExists(email)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          this.emailExists = exists;
          this.isCheckingEmail = false;
          if (exists) {
            this.emailControl.setErrors({ emailExists: true });
          } else {
            const errors = this.emailControl.errors;
            if (errors) {
              delete errors['emailExists'];
              this.emailControl.setErrors(Object.keys(errors).length ? errors : null);
            }
          }
        },
        error: () => {
          this.isCheckingEmail = false;
        }
      });
  }

  private checkPhoneExists(phone: string): void {
    this.isCheckingPhone = true;
    this.avocatService.checkPhoneExists(phone)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (exists) => {
          this.phoneExists = exists;
          this.isCheckingPhone = false;
          if (exists) {
            this.telephoneControl.setErrors({ phoneExists: true });
          } else {
            const errors = this.telephoneControl.errors;
            if (errors) {
              delete errors['phoneExists'];
              this.telephoneControl.setErrors(Object.keys(errors).length ? errors : null);
            }
          }
        },
        error: () => {
          this.isCheckingPhone = false;
        }
      });
  }

  populateForm(): void {
    if (this.avocat) {
      this.avocatForm.patchValue({
        nom: this.avocat.nom,
        prenom: this.avocat.prenom,
        email: this.avocat.email,
        telephone: this.avocat.telephone,
        adresse: this.avocat.adresse,
        specialite: this.avocat.specialite,
        numeroOrdre: this.avocat.numeroOrdre,
        actif: this.avocat.actif
      });
    }
  }

  onSubmit(): void {
    if (this.avocatForm.invalid) {
      this.avocatForm.markAllAsTouched();
      this.toastService.error('Veuillez corriger les erreurs dans le formulaire.');
      return;
    }

    if (this.emailExists) {
      this.toastService.error('Cette adresse email est déjà utilisée.');
      return;
    }

    if (this.phoneExists) {
      this.toastService.error('Ce numéro de téléphone est déjà utilisé.');
      return;
    }

    this.isLoading = true;
    const formValue = this.avocatForm.value;
    const cleanedPhone = (formValue.telephone || '').replace(/\D/g, '').slice(-8);
    const avocatRequest: AvocatRequest = {
      nom: formValue.nom.trim(),
      prenom: formValue.prenom.trim(),
      email: formValue.email.trim().toLowerCase(),
      telephone: cleanedPhone,
      adresse: formValue.adresse?.trim() || null,
      specialite: formValue.specialite?.trim() || null
    };

    const operation = this.isEditMode && this.avocatId
      ? this.avocatService.updateAvocat(this.avocatId, avocatRequest)
      : this.avocatService.createAvocat(avocatRequest);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedAvocat) => {
          this.isLoading = false;
          const message = this.isEditMode ? 'Avocat mis à jour avec succès.' : 'Avocat créé avec succès.';
          this.toastService.success(message);
          
          if (this.isEditMode) {
            this.router.navigate(['/juridique/avocats']);
          } else {
            this.avocatSaved.emit(savedAvocat);
            this.router.navigate(['/juridique/avocats']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('❌ Erreur lors de la sauvegarde:', error);
          const message = this.isEditMode ? 'Erreur lors de la mise à jour de l\'avocat.' : 'Erreur lors de la création de l\'avocat.';
          this.toastService.error(message);
        }
      });
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/juridique/avocats']);
    } else {
      this.formCancelled.emit();
    }
  }

  getFieldError(fieldName: string): string {
    const control = this.avocatForm.get(fieldName);
    if (control && control.invalid && control.touched) {
      if (control.errors?.['required']) {
        return `${this.getFieldLabel(fieldName)} est requis.`;
      }
      if (control.errors?.['email']) {
        return 'Format d\'email invalide.';
      }
      if (control.errors?.['emailExists']) {
        return 'Cette adresse email est déjà utilisée.';
      }
      if (control.errors?.['phoneExists']) {
        return 'Ce numéro de téléphone est déjà utilisé.';
      }
      if (control.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} doit contenir au moins ${control.errors['minlength'].requiredLength} caractères.`;
      }
      if (control.errors?.['maxlength']) {
        return `${this.getFieldLabel(fieldName)} ne peut pas dépasser ${control.errors['maxlength'].requiredLength} caractères.`;
      }
      if (control.errors?.['pattern']) {
        return 'Format de téléphone invalide.';
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
      specialite: 'La spécialité',
      numeroOrdre: 'Le numéro d\'ordre'
    };
    return labels[fieldName] || fieldName;
  }

  getPageTitle(): string {
    return this.isEditMode ? 'Modifier l\'avocat' : 'Ajouter un avocat';
  }

  getSubmitButtonText(): string {
    return this.isEditMode ? 'Mettre à jour' : 'Créer';
  }
}

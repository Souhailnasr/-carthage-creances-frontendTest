import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { Avocat, AvocatRequest } from '../../models/avocat.model';
import { AvocatService } from '../../services/avocat.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-avocat-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
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
  private destroy$ = new Subject<void>();

  // Getters pour les contrôles de formulaire
  get nomControl(): FormControl { return this.avocatForm.get('nom') as FormControl; }
  get prenomControl(): FormControl { return this.avocatForm.get('prenom') as FormControl; }
  get emailControl(): FormControl { return this.avocatForm.get('email') as FormControl; }
  get telephoneControl(): FormControl { return this.avocatForm.get('telephone') as FormControl; }
  get adresseControl(): FormControl { return this.avocatForm.get('adresse') as FormControl; }
  get specialiteControl(): FormControl { return this.avocatForm.get('specialite') as FormControl; }
  get numeroOrdreControl(): FormControl { return this.avocatForm.get('numeroOrdre') as FormControl; }

  constructor(
    private fb: FormBuilder,
    private avocatService: AvocatService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    if (this.avocat && this.isEditMode) {
      this.populateForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.avocatForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.pattern(/^[0-9+\-\s()]+$/)]],
      adresse: [''],
      specialite: [''],
      numeroOrdre: ['', [Validators.required]]
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
        numeroOrdre: this.avocat.numeroOrdre
      });
    }
  }

  onSubmit(): void {
    if (this.avocatForm.invalid) {
      this.avocatForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    this.isLoading = true;
    const formValue = this.avocatForm.value;
    const avocatRequest: AvocatRequest = {
      ...formValue,
      actif: true
    };

    const operation = this.isEditMode && this.avocat
      ? this.avocatService.updateAvocat(this.avocat.id!, avocatRequest)
      : this.avocatService.createAvocat(avocatRequest);

    operation
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (savedAvocat) => {
          this.isLoading = false;
          const message = this.isEditMode ? 'Avocat mis à jour avec succès.' : 'Avocat créé avec succès.';
          this.toastService.success(message);
          this.avocatSaved.emit(savedAvocat);
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
    this.formCancelled.emit();
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
      if (control.errors?.['minlength']) {
        return `${this.getFieldLabel(fieldName)} doit contenir au moins ${control.errors['minlength'].requiredLength} caractères.`;
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
}

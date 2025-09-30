import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AvocatService } from '../../services/avocat.service';
import { ToastService } from '../../../core/services/toast.service';
import { Avocat } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-avocat-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormInputComponent],
  templateUrl: './avocat-form.component.html',
  styleUrls: ['./avocat-form.component.scss']
})
export class AvocatFormComponent implements OnInit, OnDestroy {
  avocatForm!: FormGroup;
  isEditMode: boolean = false;
  avocatId: string | null = null;
  private destroy$ = new Subject<void>();

  // Getters for form controls
  get nomControl(): FormControl { return this.avocatForm.get('nom') as FormControl; }
  get prenomControl(): FormControl { return this.avocatForm.get('prenom') as FormControl; }
  get emailControl(): FormControl { return this.avocatForm.get('email') as FormControl; }
  get telephoneControl(): FormControl { return this.avocatForm.get('telephone') as FormControl; }
  get specialiteControl(): FormControl { return this.avocatForm.get('specialite') as FormControl; }
  get adresseControl(): FormControl { return this.avocatForm.get('adresse') as FormControl; }

  constructor(
    private fb: FormBuilder,
    private avocatService: AvocatService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.avocatForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      specialite: ['', Validators.required],
      adresse: ['', Validators.required]
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.avocatId = params.get('id');
      if (this.avocatId) {
        this.isEditMode = true;
        this.loadAvocat(this.avocatId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAvocat(id: string): void {
    this.avocatService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (avocat) => {
          if (avocat) {
            this.avocatForm.patchValue(avocat);
          } else {
            this.toastService.error('Avocat non trouvé.');
            this.router.navigate(['/juridique/avocats']);
          }
        },
        error: (err) => {
          this.toastService.error('Erreur lors du chargement de l\'avocat.');
          console.error(err);
          this.router.navigate(['/juridique/avocats']);
        }
      });
  }

  onSubmit(): void {
    if (this.avocatForm.invalid) {
      this.avocatForm.markAllAsTouched();
      this.toastService.error('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    const avocat: Avocat = this.avocatForm.value;

    if (this.isEditMode && this.avocatId) {
      this.avocatService.update(this.avocatId, avocat)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Avocat mis à jour avec succès.');
            this.router.navigate(['/juridique/avocats']);
          },
          error: (err) => {
            this.toastService.error('Erreur lors de la mise à jour de l\'avocat.');
            console.error(err);
          }
        });
    } else {
      this.avocatService.create(avocat)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Avocat ajouté avec succès.');
            this.router.navigate(['/juridique/avocats']);
          },
          error: (err) => {
            this.toastService.error('Erreur lors de l\'ajout de l\'avocat.');
            console.error(err);
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/juridique/avocats']);
  }
}

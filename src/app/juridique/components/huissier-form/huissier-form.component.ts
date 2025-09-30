import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HuissierService } from '../../services/huissier.service';
import { ToastService } from '../../../core/services/toast.service';
import { Huissier } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-huissier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormInputComponent],
  templateUrl: './huissier-form.component.html',
  styleUrls: ['./huissier-form.component.scss']
})
export class HuissierFormComponent implements OnInit, OnDestroy {
  huissierForm!: FormGroup;
  isEditMode: boolean = false;
  huissierId: string | null = null;
  private destroy$ = new Subject<void>();

  // Getters for form controls
  get nomControl(): FormControl { return this.huissierForm.get('nom') as FormControl; }
  get prenomControl(): FormControl { return this.huissierForm.get('prenom') as FormControl; }
  get emailControl(): FormControl { return this.huissierForm.get('email') as FormControl; }
  get telephoneControl(): FormControl { return this.huissierForm.get('telephone') as FormControl; }
  get specialiteControl(): FormControl { return this.huissierForm.get('specialite') as FormControl; }
  get adresseControl(): FormControl { return this.huissierForm.get('adresse') as FormControl; }

  constructor(
    private fb: FormBuilder,
    private huissierService: HuissierService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.huissierForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      specialite: ['', Validators.required],
      adresse: ['', Validators.required]
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.huissierId = params.get('id');
      if (this.huissierId) {
        this.isEditMode = true;
        this.loadHuissier(this.huissierId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadHuissier(id: string): void {
    this.huissierService.getById(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (huissier) => {
          if (huissier) {
            this.huissierForm.patchValue(huissier);
          } else {
            this.toastService.error('Huissier non trouvé.');
            this.router.navigate(['/juridique/huissiers']);
          }
        },
        error: (err) => {
          this.toastService.error('Erreur lors du chargement de l\'huissier.');
          console.error(err);
          this.router.navigate(['/juridique/huissiers']);
        }
      });
  }

  onSubmit(): void {
    if (this.huissierForm.invalid) {
      this.huissierForm.markAllAsTouched();
      this.toastService.error('Veuillez corriger les erreurs du formulaire.');
      return;
    }

    const huissier: Huissier = this.huissierForm.value;

    if (this.isEditMode && this.huissierId) {
      this.huissierService.update(this.huissierId, huissier)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Huissier mis à jour avec succès.');
            this.router.navigate(['/juridique/huissiers']);
          },
          error: (err) => {
            this.toastService.error('Erreur lors de la mise à jour de l\'huissier.');
            console.error(err);
          }
        });
    } else {
      this.huissierService.create(huissier)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Huissier ajouté avec succès.');
            this.router.navigate(['/juridique/huissiers']);
          },
          error: (err) => {
            this.toastService.error('Erreur lors de l\'ajout de l\'huissier.');
            console.error(err);
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/juridique/huissiers']);
  }
}

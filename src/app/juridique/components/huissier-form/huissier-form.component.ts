import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Huissier } from '../../models/huissier.model';
import { HuissierService } from '../../services/huissier.service';
import { ToastService } from '../../../core/services/toast.service';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';

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
  huissierId: number | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private huissierService: HuissierService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.isEditMode = true;
        this.huissierId = +id;
        this.loadHuissier(this.huissierId);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.huissierForm = this.fb.group({
      nom: ['', Validators.required],
      prenom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      telephone: [''],
      adresse: ['']
    });
  }

  loadHuissier(id: number): void {
    this.huissierService.getHuissierById(id).pipe(takeUntil(this.destroy$)).subscribe({
      next: (huissier) => {
        this.huissierForm.patchValue(huissier);
      },
      error: (err) => {
        console.error('Error loading huissier', err);
        this.toastService.error('Erreur lors du chargement de l\'huissier.');
        this.router.navigate(['/juridique/huissiers']);
      }
    });
  }

  onSubmit(): void {
    if (this.huissierForm.invalid) {
      this.huissierForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    const huissier: Huissier = this.huissierForm.value;

    if (this.isEditMode && this.huissierId) {
      this.huissierService.updateHuissier(this.huissierId, huissier).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.toastService.success('Huissier mis à jour avec succès.');
          this.router.navigate(['/juridique/huissiers']);
        },
        error: (err) => {
          console.error('Error updating huissier', err);
          this.toastService.error('Erreur lors de la mise à jour de l\'huissier.');
        }
      });
    } else {
      this.huissierService.createHuissier(huissier).pipe(takeUntil(this.destroy$)).subscribe({
        next: () => {
          this.toastService.success('Huissier ajouté avec succès.');
          this.router.navigate(['/juridique/huissiers']);
        },
        error: (err) => {
          console.error('Error creating huissier', err);
          this.toastService.error('Erreur lors de l\'ajout de l\'huissier.');
        }
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/juridique/huissiers']);
  }
}
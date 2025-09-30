import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CreancierService } from '../../services/creancier.service';
import { DebiteurService } from '../../services/debiteur.service';
import { ToastService } from '../../../core/services/toast.service';
import { Creancier, Debiteur } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-partie-prenante-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormInputComponent],
  templateUrl: './partie-prenante-form.component.html',
  styleUrls: ['./partie-prenante-form.component.scss']
})
export class PartiePrenanteFormComponent implements OnInit, OnDestroy {
  creancierForm!: FormGroup;
  debiteurForm!: FormGroup;
  activeTab: 'creancier' | 'debiteur' = 'creancier';
  isEditMode: boolean = false;
  partiePrenanteId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private creancierService: CreancierService,
    private debiteurService: DebiteurService,
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.creancierForm = this.fb.group({
      codeCreancier: ['', Validators.required],
      codeCreance: ['', Validators.required],
      nom: ['', Validators.required],
      prenom: [''], // Prénom est optionnel pour un créancier (entreprise)
      adresse: ['', Validators.required],
      ville: ['', Validators.required],
      codePostal: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      fax: [''], // Fax est optionnel
      email: ['', [Validators.required, Validators.email]]
    });

    this.debiteurForm = this.fb.group({
      codeCreance: ['', Validators.required],
      nom: ['', Validators.required],
      prenom: ['', Validators.required], // Prénom est obligatoire pour un débiteur (personne)
      adresse: ['', Validators.required],
      ville: ['', Validators.required],
      codePostal: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],
      telephone: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      fax: [''], // Fax est optionnel
      email: ['', [Validators.required, Validators.email]]
    });

    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe(params => {
      this.partiePrenanteId = params.get('id');
      const type = params.get('type'); // 'creancier' or 'debiteur'

      if (this.partiePrenanteId && type) {
        this.isEditMode = true;
        this.activeTab = type as 'creancier' | 'debiteur';
        this.loadPartiePrenante(this.partiePrenanteId, type);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPartiePrenante(id: string, type: string): void {
    if (type === 'creancier') {
      this.creancierService.getById(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (creancier) => {
            if (creancier) {
              this.creancierForm.patchValue(creancier);
            } else {
              this.toastService.error('Créancier non trouvé.');
              this.router.navigate(['/dossier/parties-prenantes']);
            }
          },
          error: (err) => {
            this.toastService.error('Erreur lors du chargement du créancier.');
            console.error(err);
            this.router.navigate(['/dossier/parties-prenantes']);
          }
        });
    } else if (type === 'debiteur') {
      this.debiteurService.getById(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (debiteur) => {
            if (debiteur) {
              this.debiteurForm.patchValue(debiteur);
            } else {
              this.toastService.error('Débiteur non trouvé.');
              this.router.navigate(['/dossier/parties-prenantes']);
            }
          },
          error: (err) => {
            this.toastService.error('Erreur lors du chargement du débiteur.');
            console.error(err);
            this.router.navigate(['/dossier/parties-prenantes']);
          }
        });
    }
  }

  setActiveTab(tab: 'creancier' | 'debiteur'): void {
    this.activeTab = tab;
  }

  onSubmitCreancier(): void {
    if (this.creancierForm.invalid) {
      this.creancierForm.markAllAsTouched();
      this.toastService.error('Veuillez corriger les erreurs du formulaire créancier.');
      return;
    }

    const creancier: Creancier = this.creancierForm.value;

    if (this.isEditMode && this.partiePrenanteId && this.activeTab === 'creancier') {
      this.creancierService.update(this.partiePrenanteId, creancier)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Créancier mis à jour avec succès.');
            this.router.navigate(['/dossier/parties-prenantes']);
          },
          error: (err) => {
            this.toastService.error('Erreur lors de la mise à jour du créancier.');
            console.error(err);
          }
        });
    } else {
      this.creancierService.create(creancier)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Créancier ajouté avec succès.');
            this.router.navigate(['/dossier/parties-prenantes']);
          },
          error: (err) => {
            this.toastService.error('Erreur lors de l\'ajout du créancier.');
            console.error(err);
          }
        });
    }
  }

  onSubmitDebiteur(): void {
    if (this.debiteurForm.invalid) {
      this.debiteurForm.markAllAsTouched();
      this.toastService.error('Veuillez corriger les erreurs du formulaire débiteur.');
      return;
    }

    const debiteur: Debiteur = this.debiteurForm.value;

    if (this.isEditMode && this.partiePrenanteId && this.activeTab === 'debiteur') {
      this.debiteurService.update(this.partiePrenanteId, debiteur)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Débiteur mis à jour avec succès.');
            this.router.navigate(['/dossier/parties-prenantes']);
          },
          error: (err) => {
            this.toastService.error('Erreur lors de la mise à jour du débiteur.');
            console.error(err);
          }
        });
    } else {
      this.debiteurService.create(debiteur)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.success('Débiteur ajouté avec succès.');
            this.router.navigate(['/dossier/parties-prenantes']);
          },
          error: (err) => {
            this.toastService.error('Erreur lors de l\'ajout du débiteur.');
            console.error(err);
          }
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/dossier/parties-prenantes']);
  }

  // Getters for form controls
  get creancierCodeCreancierControl(): FormControl {
    return this.creancierForm.get('codeCreancier') as FormControl;
  }

  get creancierCodeCreanceControl(): FormControl {
    return this.creancierForm.get('codeCreance') as FormControl;
  }

  get creancierNomControl(): FormControl {
    return this.creancierForm.get('nom') as FormControl;
  }

  get creancierPrenomControl(): FormControl {
    return this.creancierForm.get('prenom') as FormControl;
  }

  get creancierAdresseControl(): FormControl {
    return this.creancierForm.get('adresse') as FormControl;
  }

  get creancierVilleControl(): FormControl {
    return this.creancierForm.get('ville') as FormControl;
  }

  get creancierCodePostalControl(): FormControl {
    return this.creancierForm.get('codePostal') as FormControl;
  }

  get creancierTelephoneControl(): FormControl {
    return this.creancierForm.get('telephone') as FormControl;
  }

  get creancierFaxControl(): FormControl {
    return this.creancierForm.get('fax') as FormControl;
  }

  get creancierEmailControl(): FormControl {
    return this.creancierForm.get('email') as FormControl;
  }

  get debiteurCodeCreanceControl(): FormControl {
    return this.debiteurForm.get('codeCreance') as FormControl;
  }

  get debiteurNomControl(): FormControl {
    return this.debiteurForm.get('nom') as FormControl;
  }

  get debiteurPrenomControl(): FormControl {
    return this.debiteurForm.get('prenom') as FormControl;
  }

  get debiteurAdresseControl(): FormControl {
    return this.debiteurForm.get('adresse') as FormControl;
  }

  get debiteurVilleControl(): FormControl {
    return this.debiteurForm.get('ville') as FormControl;
  }

  get debiteurCodePostalControl(): FormControl {
    return this.debiteurForm.get('codePostal') as FormControl;
  }

  get debiteurTelephoneControl(): FormControl {
    return this.debiteurForm.get('telephone') as FormControl;
  }

  get debiteurFaxControl(): FormControl {
    return this.debiteurForm.get('fax') as FormControl;
  }

  get debiteurEmailControl(): FormControl {
    return this.debiteurForm.get('email') as FormControl;
  }
}

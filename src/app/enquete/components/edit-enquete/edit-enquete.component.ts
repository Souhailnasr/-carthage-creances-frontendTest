import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { finalize, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { EnqueteService } from '../../../core/services/enquete.service';
import { AuthService } from '../../../core/services/auth.service';
import { Enquette } from '../../../shared/models';

@Component({
  selector: 'app-edit-enquete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './edit-enquete.component.html',
  styleUrls: ['./edit-enquete.component.scss']
})
export class EditEnqueteComponent implements OnInit {
  enqueteForm: FormGroup;
  enquete: Enquette | null = null;
  loading = false;
  loadingEnquete = false;
  canEdit = false;

  constructor(
    private fb: FormBuilder,
    private enqueteService: EnqueteService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.enqueteForm = this.createForm();
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEnquete(Number(id));
    } else {
      this.snackBar.open('ID d\'enquête manquant', 'Fermer', { duration: 3000 });
      this.router.navigate(['/enquetes']);
    }
  }

  createForm(): FormGroup {
    return this.fb.group({
      rapportCode: [''],
      // Éléments financiers
      nomElementFinancier: [''],
      pourcentage: [null],
      banqueAgence: [''],
      banques: [''],
      exercices: [''],
      chiffreAffaire: [null],
      resultatNet: [null],
      disponibiliteBilan: [''],
      // Solvabilité
      appreciationBancaire: [''],
      paiementsCouverture: [''],
      reputationCommerciale: [''],
      incidents: [''],
      // Patrimoine débiteur
      bienImmobilier: [''],
      situationJuridiqueImmobilier: [''],
      bienMobilier: [''],
      situationJuridiqueMobilier: [''],
      // Autres affaires & observations
      autresAffaires: [''],
      observations: [''],
      // Décision comité recouvrement
      decisionComite: [''],
      visaDirecteurJuridique: [''],
      visaEnqueteur: [''],
      visaDirecteurCommercial: [''],
      registreCommerce: [''],
      codeDouane: [''],
      matriculeFiscale: [''],
      formeJuridique: [''],
      capital: [null],
      // Dirigeants
      pdg: [''],
      directeurAdjoint: [''],
      directeurFinancier: [''],
      directeurCommercial: [''],
      // Activité
      descriptionActivite: [''],
      secteurActivite: [''],
      effectif: [null],
      // Informations diverses
      email: [''],
      marques: [''],
      groupe: ['']
    });
  }

  loadEnquete(id: number): void {
    this.loadingEnquete = true;
    this.enqueteService.getEnqueteById(id)
      .pipe(
        finalize(() => this.loadingEnquete = false),
        catchError(error => {
          this.snackBar.open('Erreur lors du chargement de l\'enquête', 'Fermer', { duration: 3000 });
          this.router.navigate(['/enquetes']);
          return throwError(() => error);
        })
      )
      .subscribe(enquete => {
        this.enquete = enquete;
        this.checkCanEdit();
        if (this.canEdit) {
          this.populateForm(enquete);
        }
      });
  }

  checkCanEdit(): void {
    if (!this.enquete) {
      this.canEdit = false;
      return;
    }

    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser.id) {
      this.canEdit = false;
      return;
    }

    // Seulement si l'enquête n'est pas validée et que l'utilisateur est le créateur
    this.canEdit = !this.enquete.valide && 
                   currentUser.id === this.enquete.agentCreateur?.id?.toString();
  }

  populateForm(enquete: Enquette): void {
    this.enqueteForm.patchValue({
      rapportCode: enquete.rapportCode || '',
      nomElementFinancier: enquete.nomElementFinancier || '',
      pourcentage: enquete.pourcentage || null,
      banqueAgence: enquete.banqueAgence || '',
      banques: enquete.banques || '',
      exercices: enquete.exercices || '',
      chiffreAffaire: enquete.chiffreAffaire || null,
      resultatNet: enquete.resultatNet || null,
      disponibiliteBilan: enquete.disponibiliteBilan || '',
      appreciationBancaire: enquete.appreciationBancaire || '',
      paiementsCouverture: enquete.paiementsCouverture || '',
      reputationCommerciale: enquete.reputationCommerciale || '',
      incidents: enquete.incidents || '',
      bienImmobilier: enquete.bienImmobilier || '',
      situationJuridiqueImmobilier: enquete.situationJuridiqueImmobilier || '',
      bienMobilier: enquete.bienMobilier || '',
      situationJuridiqueMobilier: enquete.situationJuridiqueMobilier || '',
      autresAffaires: enquete.autresAffaires || '',
      observations: enquete.observations || '',
      decisionComite: enquete.decisionComite || '',
      visaDirecteurJuridique: enquete.visaDirecteurJuridique || '',
      visaEnqueteur: enquete.visaEnqueteur || '',
      visaDirecteurCommercial: enquete.visaDirecteurCommercial || '',
      registreCommerce: enquete.registreCommerce || '',
      codeDouane: enquete.codeDouane || '',
      matriculeFiscale: enquete.matriculeFiscale || '',
      formeJuridique: enquete.formeJuridique || '',
      capital: enquete.capital || null,
      pdg: enquete.pdg || '',
      directeurAdjoint: enquete.directeurAdjoint || '',
      directeurFinancier: enquete.directeurFinancier || '',
      directeurCommercial: enquete.directeurCommercial || '',
      descriptionActivite: enquete.descriptionActivite || '',
      secteurActivite: enquete.secteurActivite || '',
      effectif: enquete.effectif || null,
      email: enquete.email || '',
      marques: enquete.marques || '',
      groupe: enquete.groupe || ''
    });
  }

  onSubmit(): void {
    if (this.enqueteForm.valid && this.enquete) {
      this.loading = true;
      const enqueteData: Partial<Enquette> = {
        ...this.enqueteForm.value
      };

      this.enqueteService.updateEnquete(this.enquete.id!, enqueteData)
        .pipe(
          finalize(() => this.loading = false),
          catchError(error => {
            const message = error.error?.message || error.message || 'Erreur lors de la modification';
            this.snackBar.open(message, 'Fermer', { duration: 5000 });
            return throwError(() => error);
          })
        )
        .subscribe(enquete => {
          this.snackBar.open('Enquête modifiée avec succès', 'Fermer', { duration: 3000 });
          this.router.navigate(['/enquetes', enquete.id]);
        });
    }
  }

  onCancel(): void {
    this.router.navigate(['/enquetes']);
  }
}


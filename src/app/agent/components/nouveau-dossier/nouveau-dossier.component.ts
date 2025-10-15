import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-nouveau-dossier',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="nouveau-dossier">
      <h1>Créer un nouveau dossier</h1>

      <form [formGroup]="dossierForm" (ngSubmit)="onSubmit()" class="dossier-form">
        <!-- Créancier -->
        <fieldset class="section">
          <legend>Créancier</legend>

          <div class="form-row">
            <div class="form-group">
              <label for="typeCreancier">Type de Créancier *</label>
              <select id="typeCreancier" formControlName="typeCreancier" class="form-control" [class.is-invalid]="typeCreancierControl?.invalid && typeCreancierControl?.touched">
                <option *ngFor="let type of personTypes" [value]="type.value">{{ type.label }}</option>
              </select>
              <div class="invalid-feedback" *ngIf="typeCreancierControl?.invalid && typeCreancierControl?.touched">
                <div *ngIf="typeCreancierControl?.errors?.['required']">Le type de créancier est requis</div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="nomCreancier">{{ getCreancierNomLabel() }}</label>
              <input id="nomCreancier" type="text" formControlName="nomCreancier" class="form-control" [class.is-invalid]="nomCreancierControl?.invalid && nomCreancierControl?.touched" [placeholder]="getCreancierNomPlaceholder()" />
              <div class="invalid-feedback" *ngIf="nomCreancierControl?.invalid && nomCreancierControl?.touched">
                <div *ngIf="nomCreancierControl?.errors?.['required']">{{ isCreancierPersonneMorale() ? "Le nom de l'entreprise est requis" : 'Le nom est requis' }}</div>
                <div *ngIf="nomCreancierControl?.errors?.['minlength']">{{ isCreancierPersonneMorale() ? "Le nom de l'entreprise doit contenir au moins 2 caractères" : 'Le nom doit contenir au moins 2 caractères' }}</div>
              </div>
            </div>

            <div class="form-group" *ngIf="isCreancierPersonnePhysique()">
              <label for="prenomCreancier">Prénom *</label>
              <input id="prenomCreancier" type="text" formControlName="prenomCreancier" class="form-control" [class.is-invalid]="prenomCreancierControl?.invalid && prenomCreancierControl?.touched" placeholder="Prénom du créancier" />
              <div class="invalid-feedback" *ngIf="prenomCreancierControl?.invalid && prenomCreancierControl?.touched">
                <div *ngIf="prenomCreancierControl?.errors?.['required']">Le prénom est requis</div>
                <div *ngIf="prenomCreancierControl?.errors?.['minlength']">Le prénom doit contenir au moins 2 caractères</div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="emailCreancier">Email *</label>
              <input id="emailCreancier" type="email" formControlName="emailCreancier" class="form-control" [class.is-invalid]="emailCreancierControl?.invalid && emailCreancierControl?.touched" placeholder="email@exemple.com" />
              <div class="invalid-feedback" *ngIf="emailCreancierControl?.invalid && emailCreancierControl?.touched">
                <div *ngIf="emailCreancierControl?.errors?.['required']">L'email est requis</div>
                <div *ngIf="emailCreancierControl?.errors?.['email']">Format d'email invalide</div>
              </div>
            </div>

            <div class="form-group">
              <label for="telCreancier">Téléphone *</label>
              <input id="telCreancier" type="tel" formControlName="telCreancier" class="form-control" [class.is-invalid]="telCreancierControl?.invalid && telCreancierControl?.touched" placeholder="+216 20 123 456" />
              <div class="invalid-feedback" *ngIf="telCreancierControl?.invalid && telCreancierControl?.touched">
                <div *ngIf="telCreancierControl?.errors?.['required']">Le téléphone est requis</div>
                <div *ngIf="telCreancierControl?.errors?.['pattern']">Format de téléphone invalide</div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="adresseCreancier">Adresse *</label>
            <textarea id="adresseCreancier" rows="2" formControlName="adresseCreancier" class="form-control" [class.is-invalid]="adresseCreancierControl?.invalid && adresseCreancierControl?.touched" placeholder="Adresse complète du créancier"></textarea>
            <div class="invalid-feedback" *ngIf="adresseCreancierControl?.invalid && adresseCreancierControl?.touched">
              <div *ngIf="adresseCreancierControl?.errors?.['required']">L'adresse est requise</div>
              <div *ngIf="adresseCreancierControl?.errors?.['minlength']">L'adresse doit contenir au moins 5 caractères</div>
            </div>
          </div>
        </fieldset>

        <!-- Débiteur -->
        <fieldset class="section">
          <legend>Débiteur</legend>

          <div class="form-row">
            <div class="form-group">
              <label for="typeDebiteur">Type de Débiteur *</label>
              <select id="typeDebiteur" formControlName="typeDebiteur" class="form-control" [class.is-invalid]="typeDebiteurControl?.invalid && typeDebiteurControl?.touched">
                <option *ngFor="let type of personTypes" [value]="type.value">{{ type.label }}</option>
              </select>
              <div class="invalid-feedback" *ngIf="typeDebiteurControl?.invalid && typeDebiteurControl?.touched">
                <div *ngIf="typeDebiteurControl?.errors?.['required']">Le type de débiteur est requis</div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="nomDebiteur">{{ getDebiteurNomLabel() }}</label>
              <input id="nomDebiteur" type="text" formControlName="nomDebiteur" class="form-control" [class.is-invalid]="nomDebiteurControl?.invalid && nomDebiteurControl?.touched" [placeholder]="getDebiteurNomPlaceholder()" />
              <div class="invalid-feedback" *ngIf="nomDebiteurControl?.invalid && nomDebiteurControl?.touched">
                <div *ngIf="nomDebiteurControl?.errors?.['required']">{{ isDebiteurPersonneMorale() ? "Le nom de l'entreprise est requis" : 'Le nom est requis' }}</div>
                <div *ngIf="nomDebiteurControl?.errors?.['minlength']">{{ isDebiteurPersonneMorale() ? "Le nom de l'entreprise doit contenir au moins 2 caractères" : 'Le nom doit contenir au moins 2 caractères' }}</div>
              </div>
            </div>

            <div class="form-group" *ngIf="isDebiteurPersonnePhysique()">
              <label for="prenomDebiteur">Prénom *</label>
              <input id="prenomDebiteur" type="text" formControlName="prenomDebiteur" class="form-control" [class.is-invalid]="prenomDebiteurControl?.invalid && prenomDebiteurControl?.touched" placeholder="Prénom du débiteur" />
              <div class="invalid-feedback" *ngIf="prenomDebiteurControl?.invalid && prenomDebiteurControl?.touched">
                <div *ngIf="prenomDebiteurControl?.errors?.['required']">Le prénom est requis</div>
                <div *ngIf="prenomDebiteurControl?.errors?.['minlength']">Le prénom doit contenir au moins 2 caractères</div>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="emailDebiteur">Email *</label>
              <input id="emailDebiteur" type="email" formControlName="emailDebiteur" class="form-control" [class.is-invalid]="emailDebiteurControl?.invalid && emailDebiteurControl?.touched" placeholder="email@exemple.com" />
              <div class="invalid-feedback" *ngIf="emailDebiteurControl?.invalid && emailDebiteurControl?.touched">
                <div *ngIf="emailDebiteurControl?.errors?.['required']">L'email est requis</div>
                <div *ngIf="emailDebiteurControl?.errors?.['email']">Format d'email invalide</div>
              </div>
            </div>

            <div class="form-group">
              <label for="telDebiteur">Téléphone *</label>
              <input id="telDebiteur" type="tel" formControlName="telDebiteur" class="form-control" [class.is-invalid]="telDebiteurControl?.invalid && telDebiteurControl?.touched" placeholder="+216 20 123 456" />
              <div class="invalid-feedback" *ngIf="telDebiteurControl?.invalid && telDebiteurControl?.touched">
                <div *ngIf="telDebiteurControl?.errors?.['required']">Le téléphone est requis</div>
                <div *ngIf="telDebiteurControl?.errors?.['pattern']">Format de téléphone invalide</div>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="adresseDebiteur">Adresse *</label>
            <textarea id="adresseDebiteur" rows="2" formControlName="adresseDebiteur" class="form-control" [class.is-invalid]="adresseDebiteurControl?.invalid && adresseDebiteurControl?.touched" placeholder="Adresse complète du débiteur"></textarea>
            <div class="invalid-feedback" *ngIf="adresseDebiteurControl?.invalid && adresseDebiteurControl?.touched">
              <div *ngIf="adresseDebiteurControl?.errors?.['required']">L'adresse est requise</div>
              <div *ngIf="adresseDebiteurControl?.errors?.['minlength']">L'adresse doit contenir au moins 5 caractères</div>
            </div>
          </div>
        </fieldset>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" [disabled]="dossierForm.invalid">Créer le dossier</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .nouveau-dossier {
      padding: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .section {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 16px;
    }
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 12px;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-control {
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      font-size: 14px;
    }
    .form-control.is-invalid {
      border-color: #ef4444;
    }
    .invalid-feedback {
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
    }
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    .btn {
      padding: 8px 14px;
      border-radius: 6px;
      border: none;
      cursor: pointer;
    }
    .btn-primary {
      background: #3b82f6;
      color: #fff;
    }
  `]
})
export class NouveauDossierComponent {
  dossierForm: FormGroup;

  personTypes = [
    { value: 'PERSONNE_PHYSIQUE', label: 'Personne Physique' },
    { value: 'PERSONNE_MORALE', label: 'Personne Morale' }
  ];

  constructor(private fb: FormBuilder) {
    this.dossierForm = this.fb.group({
      // Créancier
      typeCreancier: ['PERSONNE_PHYSIQUE', [Validators.required]],
      nomCreancier: ['', [Validators.required, Validators.minLength(2)]],
      prenomCreancier: ['', [Validators.required, Validators.minLength(2)]],
      emailCreancier: ['', [Validators.required, Validators.email]],
      telCreancier: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      adresseCreancier: ['', [Validators.required, Validators.minLength(5)]],

      // Débiteur
      typeDebiteur: ['PERSONNE_PHYSIQUE', [Validators.required]],
      nomDebiteur: ['', [Validators.required, Validators.minLength(2)]],
      prenomDebiteur: ['', [Validators.required, Validators.minLength(2)]],
      emailDebiteur: ['', [Validators.required, Validators.email]],
      telDebiteur: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]+$/)]],
      adresseDebiteur: ['', [Validators.required, Validators.minLength(5)]]
    });

    // Synchroniser la logique de type pour Créancier
    this.dossierForm.get('typeCreancier')?.valueChanges.subscribe(type => {
      this.onTypeCreancierChange(type);
    });

    // Synchroniser la logique de type pour Débiteur
    this.dossierForm.get('typeDebiteur')?.valueChanges.subscribe(type => {
      this.onTypeDebiteurChange(type);
    });
  }

  // Soumission (pour l'instant, affichage console)
  onSubmit(): void {
    if (this.dossierForm.valid) {
      const value = this.dossierForm.value;
      console.log('Création dossier avec:', value);
      // TODO: brancher le service de création du dossier quand disponible
      this.dossierForm.reset({
        typeCreancier: 'PERSONNE_PHYSIQUE',
        typeDebiteur: 'PERSONNE_PHYSIQUE'
      });
    } else {
      Object.values(this.dossierForm.controls).forEach(c => c.markAsTouched());
    }
  }

  // Logique type Créancier
  onTypeCreancierChange(type: string): void {
    const prenom = this.dossierForm.get('prenomCreancier');
    if (type === 'PERSONNE_MORALE') {
      prenom?.clearValidators();
      prenom?.setValue('');
    } else {
      prenom?.setValidators([Validators.required, Validators.minLength(2)]);
    }
    prenom?.updateValueAndValidity();
  }

  // Logique type Débiteur
  onTypeDebiteurChange(type: string): void {
    const prenom = this.dossierForm.get('prenomDebiteur');
    if (type === 'PERSONNE_MORALE') {
      prenom?.clearValidators();
      prenom?.setValue('');
    } else {
      prenom?.setValidators([Validators.required, Validators.minLength(2)]);
    }
    prenom?.updateValueAndValidity();
  }

  // Helpers Créancier
  isCreancierPersonnePhysique(): boolean {
    return this.dossierForm.get('typeCreancier')?.value === 'PERSONNE_PHYSIQUE';
  }
  isCreancierPersonneMorale(): boolean {
    return this.dossierForm.get('typeCreancier')?.value === 'PERSONNE_MORALE';
  }

  getCreancierNomLabel(): string {
    return this.isCreancierPersonneMorale() ? "Nom de l'entreprise *" : 'Nom *';
    }

  getCreancierNomPlaceholder(): string {
    return this.isCreancierPersonneMorale() ? "Nom de l'entreprise" : 'Nom du créancier';
  }

  // Helpers Débiteur
  isDebiteurPersonnePhysique(): boolean {
    return this.dossierForm.get('typeDebiteur')?.value === 'PERSONNE_PHYSIQUE';
  }
  isDebiteurPersonneMorale(): boolean {
    return this.dossierForm.get('typeDebiteur')?.value === 'PERSONNE_MORALE';
  }

  getDebiteurNomLabel(): string {
    return this.isDebiteurPersonneMorale() ? "Nom de l'entreprise *" : 'Nom *';
  }

  getDebiteurNomPlaceholder(): string {
    return this.isDebiteurPersonneMorale() ? "Nom de l'entreprise" : 'Nom du débiteur';
  }

  // Getters
  get typeCreancierControl() { return this.dossierForm.get('typeCreancier'); }
  get nomCreancierControl() { return this.dossierForm.get('nomCreancier'); }
  get prenomCreancierControl() { return this.dossierForm.get('prenomCreancier'); }
  get emailCreancierControl() { return this.dossierForm.get('emailCreancier'); }
  get telCreancierControl() { return this.dossierForm.get('telCreancier'); }
  get adresseCreancierControl() { return this.dossierForm.get('adresseCreancier'); }

  get typeDebiteurControl() { return this.dossierForm.get('typeDebiteur'); }
  get nomDebiteurControl() { return this.dossierForm.get('nomDebiteur'); }
  get prenomDebiteurControl() { return this.dossierForm.get('prenomDebiteur'); }
  get emailDebiteurControl() { return this.dossierForm.get('emailDebiteur'); }
  get telDebiteurControl() { return this.dossierForm.get('telDebiteur'); }
  get adresseDebiteurControl() { return this.dossierForm.get('adresseDebiteur'); }
}

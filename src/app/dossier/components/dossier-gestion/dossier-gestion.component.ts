import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl, FormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { Dossier, TypeDocumentJustificatif, UrgenceDossier, StatutDossier, Role } from '../../../shared/models';
import { FormInputComponent } from '../../../shared/components/form-input/form-input.component';
import { ToastService } from '../../../core/services/toast.service';
import { AuthService } from '../../../core/services/auth.service';
import { AgentDossierService } from '../../../core/services/agent-dossier.service';
import { ChefDossierService } from '../../../core/services/chef-dossier.service';
import { CreancierApiService } from '../../../core/services/creancier-api.service';
import { DebiteurApiService } from '../../../core/services/debiteur-api.service';
import { DossierApi, DossierRequest, Urgence, DossierStatus, TypeDocumentJustificatif as ApiTypeDocument, CreancierApi, DebiteurApi } from '../../../shared/models/dossier-api.model';

@Component({
  selector: 'app-dossier-gestion',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, FormInputComponent],
  templateUrl: './dossier-gestion.component.html',
  styleUrls: ['./dossier-gestion.component.scss']
})
export class DossierGestionComponent implements OnInit, OnDestroy {
  dossiers: Dossier[] = [];
  filteredDossiers: Dossier[] = [];
  searchTerm: string = '';
  showCreateForm: boolean = false;
  dossierForm!: FormGroup;
  isEditMode: boolean = false;
  editingDossier: Dossier | null = null;
  currentUser: any = null;
  private destroy$ = new Subject<void>();

  // Enums pour les options
  typeDocumentOptions = Object.values(TypeDocumentJustificatif);
  urgenceOptions = Object.values(UrgenceDossier);

  // Getters pour les contrôles de formulaire
  get titreControl(): FormControl { return this.dossierForm.get('titre') as FormControl; }
  get descriptionControl(): FormControl { return this.dossierForm.get('description') as FormControl; }
  get numeroDossierControl(): FormControl { return this.dossierForm.get('numeroDossier') as FormControl; }
  get montantCreanceControl(): FormControl { return this.dossierForm.get('montantCreance') as FormControl; }
  get typeDocumentControl(): FormControl { return this.dossierForm.get('typeDocumentJustificatif') as FormControl; }
  get urgenceControl(): FormControl { return this.dossierForm.get('urgence') as FormControl; }
  get nomCreancierControl(): FormControl { return this.dossierForm.get('nomCreancier') as FormControl; }
  get nomDebiteurControl(): FormControl { return this.dossierForm.get('nomDebiteur') as FormControl; }
  get pouvoirControl(): FormControl { return this.dossierForm.get('pouvoir') as FormControl; }
  get contratSigneControl(): FormControl { return this.dossierForm.get('contratSigne') as FormControl; }

  constructor(
    private fb: FormBuilder,
    private toastService: ToastService,
    private authService: AuthService,
    private agentDossierService: AgentDossierService,
    private chefDossierService: ChefDossierService,
    private creancierApiService: CreancierApiService,
    private debiteurApiService: DebiteurApiService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.initializeForm();
    this.loadDossiers();
    this.loadCurrentUser();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initializeForm(): void {
    this.dossierForm = this.fb.group({
      titre: ['', Validators.required],
      description: ['', Validators.required],
      numeroDossier: ['', Validators.required],
      montantCreance: [0, [Validators.required, Validators.min(0)]],
      typeDocumentJustificatif: [TypeDocumentJustificatif.FACTURE, Validators.required],
      urgence: [UrgenceDossier.FAIBLE, Validators.required],
      nomCreancier: ['', Validators.required],
      nomDebiteur: ['', Validators.required],
      pouvoir: [false],
      contratSigne: [false]
    });
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  loadDossiers(): void {
    this.currentUser = this.authService.getCurrentUser();
    
    if (this.currentUser?.role === Role.AGENT_DOSSIER) {
      // Pour les agents : charger leurs dossiers créés
      this.agentDossierService.loadMesDossiers()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dossiersApi: DossierApi[]) => {
            this.dossiers = this.convertApiDossiersToLocal(dossiersApi);
            this.filterDossiers();
          },
          error: (error) => {
            console.error('Erreur lors du chargement des dossiers:', error);
            this.toastService.showError('Erreur lors du chargement des dossiers');
            // Fallback avec données mock
            this.loadMockDossiers();
          }
        });
    } else if (this.currentUser?.role === Role.CHEF_DEPARTEMENT_DOSSIER) {
      // Pour les chefs : charger les dossiers en attente de validation
      this.chefDossierService.loadDossiersEnAttente()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (dossiersApi: DossierApi[]) => {
            this.dossiers = this.convertApiDossiersToLocal(dossiersApi);
            this.filterDossiers();
          },
          error: (error) => {
            console.error('Erreur lors du chargement des dossiers:', error);
            this.toastService.showError('Erreur lors du chargement des dossiers');
            // Fallback avec données mock
            this.loadMockDossiers();
          }
        });
    } else {
      // Fallback pour les autres rôles
      this.loadMockDossiers();
    }
  }

  private loadMockDossiers(): void {
    // Données de fallback
    this.dossiers = [
      new Dossier({
        id: '1',
        titre: 'Dossier Client ABC',
        description: 'Recouvrement facture impayée',
        numeroDossier: 'DOS-2024-001',
        montantCreance: 15000,
        dateCreation: new Date('2024-01-15'),
        statut: StatutDossier.EN_COURS,
        urgence: UrgenceDossier.MOYENNE,
        agentResponsable: 'John Doe',
        agentCreateur: 'John Doe',
        typeDocumentJustificatif: TypeDocumentJustificatif.FACTURE,
        pouvoir: true,
        contratSigne: true,
        valide: false,
        dateValidation: undefined
      }),
      new Dossier({
        id: '2',
        titre: 'Dossier Client XYZ',
        description: 'Recouvrement contrat non honoré',
        numeroDossier: 'DOS-2024-002',
        montantCreance: 25000,
        dateCreation: new Date('2024-01-20'),
        statut: StatutDossier.EN_COURS,
        urgence: UrgenceDossier.TRES_URGENT,
        agentResponsable: 'Jane Smith',
        agentCreateur: 'Jane Smith',
        typeDocumentJustificatif: TypeDocumentJustificatif.CONTRAT,
        pouvoir: false,
        contratSigne: true,
        valide: false,
        dateValidation: undefined
      })
    ];
    this.filterDossiers();
  }

  filterDossiers(): void {
    if (this.currentUser?.role === 'AGENT_DOSSIER') {
      // Pour les agents, ne montrer que les dossiers qui leur sont assignés
      this.filteredDossiers = this.dossiers.filter(dossier => 
        dossier.agentResponsable === this.currentUser.getFullName()
      );
    } else {
      // Pour les chefs, montrer tous les dossiers
      this.filteredDossiers = [...this.dossiers];
    }
  }

  /**
   * Convertit les dossiers API vers le format local
   */
  private convertApiDossiersToLocal(dossiersApi: DossierApi[]): Dossier[] {
    return dossiersApi.map(dossierApi => new Dossier({
      id: dossierApi.id.toString(),
      titre: dossierApi.titre,
      description: dossierApi.description,
      numeroDossier: dossierApi.numeroDossier,
      montantCreance: dossierApi.montantCreance,
      dateCreation: new Date(dossierApi.dateCreation),
      dateCloture: dossierApi.dateCloture ? new Date(dossierApi.dateCloture) : undefined,
      statut: this.convertApiStatusToLocal(dossierApi.dossierStatus),
      urgence: this.convertApiUrgenceToLocal(dossierApi.urgence),
      agentResponsable: dossierApi.agentResponsable ? `${dossierApi.agentResponsable.prenom} ${dossierApi.agentResponsable.nom}` : '',
      agentCreateur: dossierApi.agentCreateur ? `${dossierApi.agentCreateur.prenom} ${dossierApi.agentCreateur.nom}` : '',
      typeDocumentJustificatif: this.convertApiTypeDocumentToLocal(dossierApi.typeDocumentJustificatif),
      pouvoir: !!dossierApi.pouvoir,
      contratSigne: !!dossierApi.contratSigne,
      valide: dossierApi.valide,
      dateValidation: dossierApi.dateValidation ? new Date(dossierApi.dateValidation) : undefined
    }));
  }

  private convertApiStatusToLocal(apiStatus: DossierStatus): StatutDossier {
    switch (apiStatus) {
      case DossierStatus.ENCOURSDETRAITEMENT:
        return StatutDossier.EN_COURS;
      case DossierStatus.CLOTURE:
        return StatutDossier.CLOTURE;
      case DossierStatus.SUSPENDU:
        return StatutDossier.EN_COURS; // Fallback
      case DossierStatus.ANNULE:
        return StatutDossier.EN_COURS; // Fallback
      default:
        return StatutDossier.EN_COURS;
    }
  }

  private convertApiUrgenceToLocal(apiUrgence: Urgence): UrgenceDossier {
    switch (apiUrgence) {
      case Urgence.FAIBLE:
        return UrgenceDossier.FAIBLE;
      case Urgence.MOYENNE:
        return UrgenceDossier.MOYENNE;
      case Urgence.ELEVEE:
        return UrgenceDossier.TRES_URGENT; // Fallback
      case Urgence.CRITIQUE:
        return UrgenceDossier.TRES_URGENT;
      default:
        return UrgenceDossier.MOYENNE;
    }
  }

  private convertApiTypeDocumentToLocal(apiType: ApiTypeDocument): TypeDocumentJustificatif {
    switch (apiType) {
      case ApiTypeDocument.CONTRAT:
        return TypeDocumentJustificatif.CONTRAT;
      case ApiTypeDocument.FACTURE:
        return TypeDocumentJustificatif.FACTURE;
      case ApiTypeDocument.BON_COMMANDE:
        return TypeDocumentJustificatif.BON_DE_COMMANDE;
      case ApiTypeDocument.AUTRE:
        return TypeDocumentJustificatif.FACTURE; // Fallback
      default:
        return TypeDocumentJustificatif.FACTURE;
    }
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filterDossiers();
    } else {
      const baseDossiers = this.currentUser?.role === 'AGENT_DOSSIER' 
        ? this.dossiers.filter(dossier => dossier.agentResponsable === this.currentUser.getFullName())
        : this.dossiers;
        
      this.filteredDossiers = baseDossiers.filter(dossier =>
        dossier.titre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.numeroDossier.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.creancier.nom.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        dossier.debiteur.nom.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }
  }

  showCreateDossierForm(): void {
    this.showCreateForm = true;
    this.isEditMode = false;
    this.editingDossier = null;
    this.initializeForm();
  }

  showEditDossierForm(dossier: Dossier): void {
    this.showCreateForm = true;
    this.isEditMode = true;
    this.editingDossier = dossier;
    this.dossierForm.patchValue({
      titre: dossier.titre,
      description: dossier.description,
      numeroDossier: dossier.numeroDossier,
      montantCreance: dossier.montantCreance,
      typeDocumentJustificatif: dossier.typeDocumentJustificatif,
      urgence: dossier.urgence,
      nomCreancier: dossier.creancier ? dossier.creancier.nom : '',
      nomDebiteur: dossier.debiteur ? dossier.debiteur.nom : '',
      pouvoir: dossier.pouvoir,
      contratSigne: dossier.contratSigne
    });
  }

  onSubmit(): void {
    if (this.dossierForm.invalid) {
      this.dossierForm.markAllAsTouched();
      this.toastService.error('Veuillez remplir tous les champs requis.');
      return;
    }

    const formValue = this.dossierForm.value;
    
    if (this.isEditMode && this.editingDossier) {
      // Mise à jour via API
      this.updateDossierApi(parseInt(this.editingDossier.id), formValue);
    } else {
      // Création via API
      this.createDossierApi(formValue);
    }
  }

  private createDossierApi(formValue: any): void {
    // Rechercher les IDs des créanciers et débiteurs basés sur les noms
    this.findCreancierAndDebiteurIds(formValue.nomCreancier, formValue.nomDebiteur)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ creancierId, debiteurId }: { creancierId: number, debiteurId: number }) => {
          const dossierRequest: DossierRequest = {
            titre: formValue.titre,
            description: formValue.description,
            numeroDossier: formValue.numeroDossier,
            montantCreance: formValue.montantCreance,
            typeDocumentJustificatif: this.convertLocalTypeDocumentToApi(formValue.typeDocumentJustificatif),
            urgence: this.convertLocalUrgenceToApi(formValue.urgence),
            creancierId: creancierId,
            debiteurId: debiteurId,
            contratSigne: formValue.contratSigne ? 'uploaded' : undefined,
            pouvoir: formValue.pouvoir ? 'uploaded' : undefined
          };

          this.agentDossierService.creerDossier(dossierRequest)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (nouveauDossier) => {
                this.toastService.success('Dossier créé avec succès.');
                this.cancelForm();
                this.loadDossiers(); // Recharger les dossiers
              },
              error: (error) => {
                console.error('Erreur lors de la création du dossier:', error);
                this.toastService.error('Erreur lors de la création du dossier.');
              }
            });
        },
        error: (error: any) => {
          console.error('Erreur lors de la recherche des créanciers/débiteurs:', error);
          this.toastService.error('Erreur lors de la recherche des créanciers/débiteurs.');
        }
      });
  }

  private findCreancierAndDebiteurIds(nomCreancier: string, nomDebiteur: string): Observable<{ creancierId: number, debiteurId: number }> {
    return new Observable((observer: any) => {
      // Rechercher le créancier
      this.creancierApiService.searchCreancierByName(nomCreancier)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (creanciers) => {
            if (creanciers.length === 0) {
              observer.error('Créancier non trouvé: ' + nomCreancier);
              return;
            }

            const creancierId = creanciers[0].id;

            // Rechercher le débiteur
            this.debiteurApiService.searchDebiteurByName(nomDebiteur)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (debiteurs) => {
                  if (debiteurs.length === 0) {
                    observer.error('Débiteur non trouvé: ' + nomDebiteur);
                    return;
                  }

                  const debiteurId = debiteurs[0].id;
                  observer.next({ creancierId, debiteurId });
                  observer.complete();
                },
                error: (error) => {
                  console.error('Erreur lors de la recherche des débiteurs:', error);
                  observer.error('Erreur lors de la recherche du débiteur: ' + error);
                }
              });
          },
          error: (error) => {
            console.error('Erreur lors de la recherche des créanciers:', error);
            observer.error('Erreur lors de la recherche du créancier: ' + error);
          }
        });
    });
  }

  private updateDossierApi(dossierId: number, formValue: any): void {
    // Pour l'instant, on utilise la logique locale
    // TODO: Implémenter la mise à jour via API
    const index = this.dossiers.findIndex(d => d.id === this.editingDossier!.id);
    if (index !== -1) {
      this.dossiers[index] = { ...this.dossiers[index], ...formValue };
      this.toastService.success('Dossier mis à jour avec succès.');
    }
    this.cancelForm();
  }

  private convertLocalTypeDocumentToApi(localType: TypeDocumentJustificatif): ApiTypeDocument {
    switch (localType) {
      case TypeDocumentJustificatif.CONTRAT:
        return ApiTypeDocument.CONTRAT;
      case TypeDocumentJustificatif.FACTURE:
        return ApiTypeDocument.FACTURE;
      case TypeDocumentJustificatif.BON_DE_COMMANDE:
        return ApiTypeDocument.BON_COMMANDE;
      default:
        return ApiTypeDocument.FACTURE;
    }
  }

  private convertLocalUrgenceToApi(localUrgence: UrgenceDossier): Urgence {
    switch (localUrgence) {
      case UrgenceDossier.FAIBLE:
        return Urgence.FAIBLE;
      case UrgenceDossier.MOYENNE:
        return Urgence.MOYENNE;
      case UrgenceDossier.TRES_URGENT:
        return Urgence.CRITIQUE;
      default:
        return Urgence.MOYENNE;
    }
  }

  deleteDossier(dossier: Dossier): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce dossier ?')) {
      const index = this.dossiers.findIndex(d => d.id === dossier.id);
      if (index !== -1) {
        this.dossiers.splice(index, 1);
        this.filteredDossiers = [...this.dossiers];
        this.toastService.success('Dossier supprimé avec succès.');
      }
    }
  }

  viewDossierDetails(dossier: Dossier): void {
    this.router.navigate(['/dossier/detail', dossier.id]);
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.isEditMode = false;
    this.editingDossier = null;
    this.initializeForm();
  }

  getUrgenceClass(urgence: UrgenceDossier): string {
    switch (urgence) {
      case UrgenceDossier.TRES_URGENT:
        return 'urgence-tres-urgent';
      case UrgenceDossier.MOYENNE:
        return 'urgence-moyenne';
      case UrgenceDossier.FAIBLE:
        return 'urgence-faible';
      default:
        return '';
    }
  }

  getUrgenceLabel(urgence: UrgenceDossier): string {
    switch (urgence) {
      case UrgenceDossier.TRES_URGENT:
        return 'Très Urgent';
      case UrgenceDossier.MOYENNE:
        return 'Moyenne';
      case UrgenceDossier.FAIBLE:
        return 'Faible';
      default:
        return urgence;
    }
  }

  // Méthodes pour la validation des dossiers
  canValidateDossier(dossier: Dossier): boolean {
    // Seul le Chef de Dossier peut valider les dossiers créés par des agents
    return this.currentUser && 
           this.currentUser.role === Role.CHEF_DOSSIER && 
           !dossier.valide && 
           dossier.agentCreateur !== this.currentUser.getFullName();
  }

  validateDossier(dossier: Dossier): void {
    if (confirm('Êtes-vous sûr de vouloir valider ce dossier ? Il sera envoyé en phase d\'enquête.')) {
      const index = this.dossiers.findIndex(d => d.id === dossier.id);
      if (index !== -1) {
        this.dossiers[index].valide = true;
        this.dossiers[index].dateValidation = new Date();
        this.dossiers[index].statut = StatutDossier.ENQUETE;
        this.dossiers[index].agentResponsable = this.currentUser.getFullName();
        
        this.filteredDossiers = [...this.dossiers];
        this.toastService.success('Dossier validé avec succès. Il a été envoyé en phase d\'enquête.');
      }
    }
  }

  isDossierValidated(dossier: Dossier): boolean {
    return dossier.valide;
  }

  getValidationStatus(dossier: Dossier): string {
    if (dossier.valide) {
      return 'Validé';
    }
    return 'En attente';
  }

  getValidationClass(dossier: Dossier): string {
    if (dossier.valide) {
      return 'status-validated';
    }
    return 'status-pending';
  }
}

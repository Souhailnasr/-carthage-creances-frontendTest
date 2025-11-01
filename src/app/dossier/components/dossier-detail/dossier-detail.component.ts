import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { Dossier, UrgenceDossier, TypeDocumentJustificatif, Creancier, Debiteur } from '../../../shared/models';
import { ValidationStatut } from '../../../shared/models/enums.model';
import { Role } from '../../../shared/models/enums.model';
import { ToastService } from '../../../core/services/toast.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dossier-detail.component.html',
  styleUrls: ['./dossier-detail.component.scss']
})
export class DossierDetailComponent implements OnInit, OnDestroy {
  dossier: Dossier | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private dossierApiService: DossierApiService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const dossierId = params['id'];
        if (dossierId) {
          this.loadDossier(dossierId);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadDossier(id: string): void {
    const dossierId = parseInt(id, 10);
    if (Number.isNaN(dossierId)) {
      this.toastService.error('Identifiant de dossier invalide.');
      this.router.navigate(['/dossier/gestion']);
      return;
    }

    this.dossierApiService.getDossierById(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (api) => {
          // Créer les objets créancier et débiteur avec les données disponibles
          const creancier = new Creancier({
            id: (api as any).creancier?.id || 0,
            nom: (api as any).creancier?.nom || '',
            prenom: (api as any).creancier?.prenom || '',
            type: (api as any).creancier?.type || 'PERSONNE_PHYSIQUE',
            codeCreancier: (api as any).creancier?.codeCreancier || '',
            codeCreance: (api as any).creancier?.codeCreance || '',
            adresse: (api as any).creancier?.adresse || '',
            ville: (api as any).creancier?.ville || '',
            codePostal: (api as any).creancier?.codePostal || '',
            telephone: (api as any).creancier?.telephone || '',
            fax: (api as any).creancier?.fax || '',
            email: (api as any).creancier?.email || ''
          });

          const debiteur = new Debiteur({
            id: (api as any).debiteur?.id || 0,
            nom: (api as any).debiteur?.nom || '',
            prenom: (api as any).debiteur?.prenom || '',
            type: (api as any).debiteur?.type || 'PERSONNE_PHYSIQUE',
            codeCreance: (api as any).debiteur?.codeCreance || '',
            adresse: (api as any).debiteur?.adresse || '',
            ville: (api as any).debiteur?.ville || '',
            codePostal: (api as any).debiteur?.codePostal || '',
            telephone: (api as any).debiteur?.telephone || '',
            fax: (api as any).debiteur?.fax || '',
            email: (api as any).debiteur?.email || ''
          });

          // Mapper le modèle API vers le modèle local utilisé par l'UI
          const mapped = new Dossier({
            id: String(api.id),
            titre: api.titre || '',
            description: api.description || '',
            numeroDossier: api.numeroDossier || '',
            montantCreance: (api.montantCreance as any) ?? 0,
            dateCreation: api.dateCreation ? new Date(api.dateCreation as any) : new Date(),
            statut: this.convertBackendStatutToLocal((api as any).statut),
            dossierStatus: api.dossierStatus as any,
            urgence: this.convertApiUrgenceToLocal(api.urgence as any),
            agentResponsable: api.agentResponsable ? `${(api.agentResponsable as any).prenom} ${(api.agentResponsable as any).nom}` : '',
            agentCreateur: api.agentCreateur ? `${(api.agentCreateur as any).prenom} ${(api.agentCreateur as any).nom}` : '',
            typeDocumentJustificatif: this.convertApiTypeDocumentToLocal(api.typeDocumentJustificatif as any),
            pouvoir: !!(api as any).pouvoir,
            contratSigne: !!(api as any).contratSigne,
            valide: (api as any).valide,
            dateValidation: (api as any).dateValidation ? new Date((api as any).dateValidation) : undefined,
            creancier: creancier,
            debiteur: debiteur,
            // Ajouter les types pour l'affichage
            typeCreancier: (api as any).creancier?.type || 'PERSONNE_PHYSIQUE',
            typeDebiteur: (api as any).debiteur?.type || 'PERSONNE_PHYSIQUE'
          });

          this.dossier = mapped;
        },
        error: () => {
          this.toastService.error('Dossier non trouvé.');
          this.router.navigate(['/dossier/gestion']);
        }
      });
  }

  private convertBackendStatutToLocal(statut: any): ValidationStatut {
    switch (statut) {
      case 'EN_ATTENTE_VALIDATION': return ValidationStatut.EN_ATTENTE_VALIDATION;
      case 'VALIDE': return ValidationStatut.VALIDE;
      case 'REJETE': return ValidationStatut.REJETE;
      case 'EN_COURS': return ValidationStatut.EN_COURS;
      case 'CLOTURE': return ValidationStatut.CLOTURE;
      default: return ValidationStatut.EN_COURS;
    }
  }

  private convertApiUrgenceToLocal(apiUrgence: any): UrgenceDossier {
    switch (apiUrgence) {
      case 'TRES_URGENT':
        return UrgenceDossier.TRES_URGENT;
      case 'MOYENNE':
        return UrgenceDossier.MOYENNE;
      case 'FAIBLE':
        return UrgenceDossier.FAIBLE;
      default:
        return UrgenceDossier.FAIBLE;
    }
  }

  private convertApiTypeDocumentToLocal(apiType: any): TypeDocumentJustificatif {
    switch (apiType) {
      case 'FACTURE':
        return TypeDocumentJustificatif.FACTURE;
      case 'CONTRAT':
        return TypeDocumentJustificatif.CONTRAT;
      default:
        return TypeDocumentJustificatif.FACTURE;
    }
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

  getStatutClass(statut: ValidationStatut): string {
    switch (statut) {
      case ValidationStatut.EN_ATTENTE_VALIDATION:
        return 'statut-en-attente';
      case ValidationStatut.VALIDE:
        return 'statut-valide';
      case ValidationStatut.REJETE:
        return 'statut-rejete';
      case ValidationStatut.EN_COURS:
        return 'statut-en-cours';
      case ValidationStatut.CLOTURE:
        return 'statut-cloture';
      default:
        return '';
    }
  }

  getStatutLabel(statut: ValidationStatut): string {
    switch (statut) {
      case ValidationStatut.EN_ATTENTE_VALIDATION:
        return 'En attente de validation';
      case ValidationStatut.VALIDE:
        return 'Validé';
      case ValidationStatut.REJETE:
        return 'Rejeté';
      case ValidationStatut.EN_COURS:
        return 'En cours';
      case ValidationStatut.CLOTURE:
        return 'Clôturé';
      default:
        return statut;
    }
  }

  getTypeClass(type: string | undefined): string {
    switch (type) {
      case 'PERSONNE_PHYSIQUE':
        return 'type-physique';
      case 'PERSONNE_MORALE':
        return 'type-morale';
      default:
        return 'type-default';
    }
  }

  getTypeLabel(type: string | undefined): string {
    switch (type) {
      case 'PERSONNE_PHYSIQUE':
        return 'Physique';
      case 'PERSONNE_MORALE':
        return 'Morale';
      default:
        return type || 'Physique';
    }
  }

  getDossierStatusClass(status?: 'ENCOURSDETRAITEMENT' | 'CLOTURE'): string {
    if (status === 'CLOTURE') return 'statut-cloture';
    return 'statut-en-cours';
  }

  getDossierStatusLabel(status?: 'ENCOURSDETRAITEMENT' | 'CLOTURE'): string {
    if (status === 'CLOTURE') return 'Clôturé';
    return 'En cours de traitement';
  }

  goBack(): void {
    this.router.navigate(['/dossier/gestion']);
  }

  editDossier(): void {
    if (this.dossier) {
      this.router.navigate(['/dossier/gestion'], { 
        queryParams: { edit: this.dossier.id } 
      });
    }
  }

  // Gestion des fichiers PDF
  canManageFiles(): boolean {
    const user = this.authService.getCurrentUser();
    if (!user || !this.dossier) return false;
    // Agents: uniquement leurs dossiers; Chefs: tous
    if (user.roleUtilisateur === Role.CHEF_DEPARTEMENT_DOSSIER || user.roleUtilisateur === Role.SUPER_ADMIN) return true;
    return this.dossier.agentResponsable === user.getFullName();
  }

  onUploadContrat(event: any): void {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file || !this.dossier) return;
    this.dossierApiService.uploadPdf(parseInt(this.dossier.id), 'contratSigne', file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.toastService.success('Contrat signé téléversé.'),
        error: () => this.toastService.error('Erreur lors du téléversement du contrat.')
      });
  }

  onUploadPouvoir(event: any): void {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file || !this.dossier) return;
    this.dossierApiService.uploadPdf(parseInt(this.dossier.id), 'pouvoir', file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.toastService.success('Pouvoir téléversé.'),
        error: () => this.toastService.error('Erreur lors du téléversement du pouvoir.')
      });
  }

  deleteContrat(): void {
    if (!this.dossier) return;
    this.dossierApiService.deletePdf(parseInt(this.dossier.id), 'contratSigne')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.toastService.success('Contrat supprimé.'),
        error: () => this.toastService.error('Erreur lors de la suppression du contrat.')
      });
  }

  deletePouvoir(): void {
    if (!this.dossier) return;
    this.dossierApiService.deletePdf(parseInt(this.dossier.id), 'pouvoir')
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => this.toastService.success('Pouvoir supprimé.'),
        error: () => this.toastService.error('Erreur lors de la suppression du pouvoir.')
      });
  }
}

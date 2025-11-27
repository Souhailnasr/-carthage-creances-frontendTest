import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormsModule } from '@angular/forms';
import { interval, Subject, Subscription, takeUntil } from 'rxjs';
import {
  ActionHuissier,
  AuditLog,
  Creancier,
  Debiteur,
  DocumentHuissier,
  Dossier,
  User,
  NotificationHuissier,
  Recommendation,
  TypeDocumentJustificatif,
  UrgenceDossier,
  ValidationStatut
} from '../../../shared/models';
import { Role } from '../../../shared/models/enums.model';
import { ToastService } from '../../../core/services/toast.service';
import { DossierApiService } from '../../../core/services/dossier-api.service';
import { AuthService } from '../../../core/services/auth.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { UtilisateurService, Utilisateur } from '../../../services/utilisateur.service';
import { DossierMontantService } from '../../../core/services/dossier-montant.service';
import { ActionAmiableService } from '../../../core/services/action-amiable.service';
import { DocumentHuissierService } from '../../../core/services/document-huissier.service';
import { ActionHuissierService } from '../../../core/services/action-huissier.service';
import { NotificationHuissierService } from '../../../core/services/notification-huissier.service';
import { RecommendationService } from '../../../core/services/recommendation.service';
import { AuditLogService } from '../../../core/services/audit-log.service';
import { montantRecouvreInfTotal, montantValidator } from '../../../shared/validators/montant.validator';
import { TndPipe } from '../../../shared/pipes/tnd.pipe';

@Component({
  selector: 'app-dossier-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, FormsModule, TndPipe],
  templateUrl: './dossier-detail.component.html',
  styleUrls: ['./dossier-detail.component.scss']
})
export class DossierDetailComponent implements OnInit, OnDestroy {
  dossier: Dossier | null = null;
  documents: DocumentHuissier[] = [];
  actionsHuissier: ActionHuissier[] = [];
  notifications: NotificationHuissier[] = [];
  recommendations: Recommendation[] = [];
  auditLogs: AuditLog[] = [];
  unreadNotifications = 0;
  highPriorityRecommendations = 0;
  loadingStates = {
    dossier: false,
    documents: false,
    actions: false,
    notifications: false,
    recommendations: false,
    audit: false
  };
  montantForm: FormGroup;
  documentForm: FormGroup;
  actionForm: FormGroup;
  amiableForm: FormGroup;
  currentUser: User | null = null;
  isChefUser = false;
  isChefDossierUser = false; // Propriété calculée pour le template
  assignAgentPanelOpen = false;
  agentsChef: Utilisateur[] = [];
  loadingAgents = false;
  agentLoadError: string | null = null;
  selectedAgentId: number | null = null;
  assigningAgent = false;
  private destroy$ = new Subject<void>();
  private pollingSubscription?: Subscription;
  private currentDossierId?: number;
  private readonly chefRoles: Role[] = [
    Role.CHEF_DEPARTEMENT_DOSSIER,
    Role.CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE,
    Role.CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE,
    Role.CHEF_DEPARTEMENT_FINANCE,
    Role.SUPER_ADMIN
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private toastService: ToastService,
    private dossierApiService: DossierApiService,
    private authService: AuthService,
    private jwtAuthService: JwtAuthService,
    private dossierMontantService: DossierMontantService,
    private actionAmiableService: ActionAmiableService,
    private documentHuissierService: DocumentHuissierService,
    private actionHuissierService: ActionHuissierService,
    private notificationHuissierService: NotificationHuissierService,
    private recommendationService: RecommendationService,
    private auditLogService: AuditLogService,
    private utilisateurService: UtilisateurService,
    private fb: FormBuilder
  ) {
    this.montantForm = this.fb.group({
      montantTotal: [0, [Validators.required, montantValidator]],
      montantRecouvre: [0, [Validators.required, montantValidator]],
      updateMode: ['SET', Validators.required]
    }, { validators: montantRecouvreInfTotal });

    this.documentForm = this.fb.group({
      typeDocument: ['PV_MISE_EN_DEMEURE', Validators.required],
      huissierName: ['', Validators.required],
      pieceJointeUrl: [''],
      delaiLegalDays: [10, [Validators.min(1)]]
    });

    this.actionForm = this.fb.group({
      typeAction: ['ACLA_TA7AFOUDHIA', Validators.required],
      montantRecouvre: [0, [montantValidator]],
      huissierName: ['', Validators.required],
      pieceJointeUrl: [''],
      updateMode: ['ADD']
    });

    this.amiableForm = this.fb.group({
      montantRecouvre: [0, [Validators.required, montantValidator]]
    });
  }

  ngOnInit(): void {
    // Charger l'utilisateur de manière asynchrone
    this.jwtAuthService.getCurrentUser()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (user) => {
          this.currentUser = user;
          this.isChefUser = this.hasChefPrivileges();
          this.isChefDossierUser = this.isChefDossier();
          // Debug: Vérifier l'utilisateur et le rôle
          console.log('🔍 DossierDetail - currentUser:', this.currentUser);
          console.log('🔍 DossierDetail - isChefUser:', this.isChefUser);
          console.log('🔍 DossierDetail - isChefDossier:', this.isChefDossierUser);
          console.log('🔍 DossierDetail - roleUtilisateur:', this.currentUser?.roleUtilisateur);
        },
        error: (err) => {
          console.error('❌ Erreur lors du chargement de l\'utilisateur:', err);
          // Fallback vers AuthService
          this.currentUser = this.authService.getCurrentUser();
          this.isChefUser = this.hasChefPrivileges();
          this.isChefDossierUser = this.isChefDossier();
        }
      });
    
    this.route.params
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const dossierId = params['id'];
        if (dossierId) {
          const parsedId = parseInt(dossierId, 10);
          this.currentDossierId = parsedId;
          this.loadAllData(parsedId);
          this.startPolling(parsedId);
        }
      });
  }

  ngOnDestroy(): void {
    this.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  private startPolling(dossierId: number): void {
    this.stopPolling();
    this.pollingSubscription = interval(30000)
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadAllData(dossierId));
  }

  private stopPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  private loadAllData(dossierId: number): void {
    this.loadDossier(String(dossierId));
    this.loadDocuments(dossierId);
    this.loadActions(dossierId);
    this.loadNotifications(dossierId);
    this.loadRecommendations(dossierId);
    this.loadAuditLogs(dossierId);
  }

  loadDossier(id: string): void {
    const dossierId = parseInt(id, 10);
    if (Number.isNaN(dossierId)) {
      this.toastService.error('Identifiant de dossier invalide.');
      this.router.navigate(['/dossier/gestion']);
      return;
    }

    this.loadingStates.dossier = true;
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
          const montantTotal = (api as any).montantTotal ?? (api.montantCreance as any) ?? 0;
          const montantRecouvre = (api as any).montantRecouvre ?? 0;
          // Calculer montantRestant = montantTotal - montantRecouvre (toujours calculé)
          const montantRestant = montantTotal - montantRecouvre;
          
          const mapped = new Dossier({
            id: String(api.id),
            titre: api.titre || '',
            description: api.description || '',
            numeroDossier: api.numeroDossier || '',
            montantCreance: (api.montantCreance as any) ?? 0,
            montantTotal: montantTotal,
            montantRecouvre: montantRecouvre,
            montantRestant: montantRestant,
            etatDossier: (api as any).etatDossier,
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
          // Debug: Vérifier le dossier et canAssignToAgent après chargement
          console.log('🔍 DossierDetail - Dossier chargé:', this.dossier);
          console.log('🔍 DossierDetail - canAssignToAgent après chargement:', this.canAssignToAgent());
          this.montantForm.patchValue({
            montantTotal: mapped.montantTotal || mapped.montantCreance,
            montantRecouvre: mapped.montantRecouvre,
            updateMode: 'SET'
          });
        },
        error: () => {
          this.toastService.error('Dossier non trouvé.');
          this.router.navigate(['/dossier/gestion']);
        },
        complete: () => {
          this.loadingStates.dossier = false;
        }
      });
  }

  private loadDocuments(dossierId: number): void {
    this.loadingStates.documents = true;
    this.documentHuissierService.getDocumentsByDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: docs => {
          this.documents = docs || [];
        },
        error: err => {
          console.error('Erreur documents huissier:', err);
          // En cas d'erreur backend, initialiser avec un tableau vide
          this.documents = [];
        },
        complete: () => this.loadingStates.documents = false
      });
  }

  private loadActions(dossierId: number): void {
    this.loadingStates.actions = true;
    this.actionHuissierService.getActionsByDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: actions => {
          this.actionsHuissier = actions || [];
        },
        error: err => {
          console.error('Erreur actions huissier:', err);
          // En cas d'erreur backend, initialiser avec un tableau vide
          this.actionsHuissier = [];
        },
        complete: () => this.loadingStates.actions = false
      });
  }

  private loadNotifications(dossierId: number): void {
    this.loadingStates.notifications = true;
    this.notificationHuissierService.getNotificationsByDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: notifications => {
          this.notifications = notifications || [];
          this.unreadNotifications = this.notifications.filter(n => !n.acked).length;
        },
        error: err => {
          console.error('Erreur notifications:', err);
          // En cas d'erreur backend, initialiser avec un tableau vide
          this.notifications = [];
          this.unreadNotifications = 0;
        },
        complete: () => this.loadingStates.notifications = false
      });
  }

  private loadRecommendations(dossierId: number): void {
    this.loadingStates.recommendations = true;
    this.recommendationService.getRecommendationsByDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: recs => {
          this.recommendations = recs || [];
          this.highPriorityRecommendations = this.recommendations.filter(r => r.priority === 'HIGH' && !r.acknowledged).length;
        },
        error: err => {
          console.error('Erreur recommandations:', err);
          // En cas d'erreur backend, initialiser avec un tableau vide
          this.recommendations = [];
          this.highPriorityRecommendations = 0;
        },
        complete: () => this.loadingStates.recommendations = false
      });
  }

  private loadAuditLogs(dossierId: number): void {
    this.loadingStates.audit = true;
    this.auditLogService.getLogsByDossier(dossierId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: logs => {
          this.auditLogs = logs || [];
        },
        error: err => {
          console.error('Erreur audit logs:', err);
          // En cas d'erreur backend, initialiser avec un tableau vide
          this.auditLogs = [];
        },
        complete: () => this.loadingStates.audit = false
      });
  }

  onSubmitMontants(): void {
    if (!this.dossier || this.montantForm.invalid) {
      this.toastService.error('Veuillez vérifier les montants saisis.');
      return;
    }

    const dto = this.montantForm.value;
    this.dossierMontantService.updateMontants(parseInt(this.dossier.id, 10), dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: dossier => {
          this.toastService.success('Montants mis à jour avec succès');
          // Recalculer montantRestant après mise à jour
          const montantTotal = dossier.montantTotal ?? this.dossier!.montantTotal;
          const montantRecouvre = dossier.montantRecouvre ?? this.dossier!.montantRecouvre;
          const montantRestant = montantTotal - montantRecouvre;
          this.dossier = new Dossier({
            ...this.dossier,
            montantTotal: montantTotal,
            montantRecouvre: montantRecouvre,
            montantRestant: montantRestant,
            etatDossier: (dossier as any).etatDossier
          });
          this.loadAuditLogs(parseInt(this.dossier.id, 10));
        },
        error: err => console.error('Erreur mise à jour montants:', err)
      });
  }

  enregistrerActionAmiable(): void {
    if (!this.dossier || this.amiableForm.invalid) {
      this.toastService.error('Montant recouvré invalide.');
      return;
    }

    const montant = this.amiableForm.get('montantRecouvre')?.value;
    this.actionAmiableService.enregistrerActionAmiable(parseInt(this.dossier.id, 10), montant)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: dossier => {
          this.toastService.success(`Montant recouvré: ${montant} TND`);
          // Recalculer montantRestant après mise à jour
          const montantTotal = (dossier as any).montantTotal ?? this.dossier!.montantTotal;
          const montantRecouvre = (dossier as any).montantRecouvre ?? this.dossier!.montantRecouvre;
          const montantRestant = montantTotal - montantRecouvre;
          this.dossier = new Dossier({
            ...this.dossier,
            ...dossier,
            montantTotal: montantTotal,
            montantRecouvre: montantRecouvre,
            montantRestant: montantRestant
          });
          this.amiableForm.reset({ montantRecouvre: 0 });
          this.loadAuditLogs(parseInt(this.dossier.id, 10));
        },
        error: err => console.error('Erreur action amiable:', err)
      });
  }

  createDocument(): void {
    const dossierId = this.currentDossierId;
    if (!dossierId || this.documentForm.invalid) {
      this.toastService.error('Veuillez renseigner les informations du document.');
      return;
    }

    const dto = {
      ...this.documentForm.value,
      dossierId
    };

    this.documentHuissierService.createDocument(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Document huissier créé.');
          this.documentForm.reset({
            typeDocument: 'PV_MISE_EN_DEMEURE',
            huissierName: '',
            pieceJointeUrl: '',
            delaiLegalDays: 10
          });
          this.loadDocuments(dossierId);
          this.loadNotifications(dossierId);
        },
        error: err => console.error('Erreur création document:', err)
      });
  }

  createActionHuissier(): void {
    const dossierId = this.currentDossierId;
    if (!dossierId || this.actionForm.invalid) {
      this.toastService.error('Veuillez renseigner les informations de l’action.');
      return;
    }

    const dto = {
      ...this.actionForm.value,
      dossierId
    };

    this.actionHuissierService.createAction(dto)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.toastService.success('Action huissier créée.');
          this.actionForm.reset({
            typeAction: 'ACLA_TA7AFOUDHIA',
            montantRecouvre: 0,
            huissierName: '',
            pieceJointeUrl: '',
            updateMode: 'ADD'
          });
          this.loadActions(dossierId);
          this.loadNotifications(dossierId);
          this.loadAuditLogs(dossierId);
        },
        error: err => console.error('Erreur création action:', err)
      });
  }

  acknowledgeNotification(notificationId: number): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.toastService.error('Utilisateur non authentifié.');
      return;
    }

    this.notificationHuissierService.acknowledgeNotification(notificationId, parseInt(userId, 10))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.currentDossierId) {
            this.loadNotifications(this.currentDossierId);
          }
        },
        error: err => console.error('Erreur acknowledgement notification:', err)
      });
  }

  acknowledgeRecommendation(recommendationId: number): void {
    const userId = this.authService.getCurrentUser()?.id;
    if (!userId) {
      this.toastService.error('Utilisateur non authentifié.');
      return;
    }

    this.recommendationService.acknowledgeRecommendation(recommendationId, parseInt(userId, 10))
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          if (this.currentDossierId) {
            this.loadRecommendations(this.currentDossierId);
          }
        },
        error: err => console.error('Erreur acknowledgement recommandation:', err)
      });
  }

  executeRecommendation(recommendation: Recommendation): void {
    const actionMap: Record<string, () => void> = {
      ESCALATE_TO_ORDONNANCE: () => this.documentForm.patchValue({ typeDocument: 'ORDONNANCE_PAIEMENT' }),
      INITIATE_EXECUTION: () => this.actionForm.patchValue({ typeAction: 'ACLA_TA7AFOUDHIA' }),
      ASSIGN_AVOCAT: () => this.toastService.info('Ouvrez le module juridique pour assigner un avocat.'),
      INITIATE_BANK_SAISIE: () => this.actionForm.patchValue({ typeAction: 'ACLA_TAW9IFIYA' }),
      ESCALATE_TO_DIRECTOR: () => this.toastService.warning('Alertez votre chef depuis le module notifications.')
    };

    actionMap[recommendation.ruleCode]?.();
    this.acknowledgeRecommendation(recommendation.id);
  }

  canAssignToAgent(): boolean {
    if (!this.isChefUser || !this.dossier) {
      console.log('🔍 canAssignToAgent - isChefUser:', this.isChefUser, 'dossier:', !!this.dossier);
      return false;
    }
    // Le chef dossier peut affecter tous les dossiers (validés ou non)
    // Pour les autres chefs, seuls les dossiers validés peuvent être affectés
    if (this.isChefDossierUser || this.isChefDossier()) {
      // Le chef dossier peut affecter tous les dossiers
      console.log('🔍 canAssignToAgent - Chef dossier, retourne true');
      return true;
    }
    // Pour les autres chefs (amiable, juridique, finance), seuls les dossiers validés
    const isValide = this.dossier.statut === ValidationStatut.VALIDE || 
                     this.dossier.dossierStatus === 'CLOTURE' ||
                     this.dossier.valide === true;
    console.log('🔍 canAssignToAgent - Autre chef, isValide:', isValide);
    return isValide;
  }

  toggleAssignAgentPanel(): void {
    if (!this.canAssignToAgent()) {
      return;
    }
    this.assignAgentPanelOpen = !this.assignAgentPanelOpen;
    if (!this.assignAgentPanelOpen) {
      this.selectedAgentId = null;
      return;
    }
    if (this.assignAgentPanelOpen && !this.agentsChef.length) {
      this.loadAgentsForChef();
    }
  }

  private loadAgentsForChef(): void {
    if (!this.currentUser?.id) {
      this.agentLoadError = 'Chef non identifié';
      return;
    }
    const chefId = Number(this.currentUser.id);
    if (Number.isNaN(chefId)) {
      this.agentLoadError = 'Identifiant chef invalide';
      return;
    }
    this.loadingAgents = true;
    this.agentLoadError = null;

    // Essayer d'abord l'endpoint spécifique pour les agents du chef
    this.utilisateurService.getAgentsByChef(chefId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (agents) => {
          this.agentsChef = agents || [];
          this.loadingAgents = false;
          console.log('✅ Agents chargés via endpoint /chef/:', this.agentsChef.length);
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des agents via endpoint /chef/:', error);
          console.error('❌ Détails:', {
            status: error?.status,
            statusText: error?.statusText,
            message: error?.message,
            url: error?.url
          });
          // Fallback: charger tous les utilisateurs et filtrer les agents dossier
          console.log('🔄 Tentative de fallback: chargement de tous les utilisateurs et filtrage...');
          this.loadAgentsFallback();
        }
      });
  }

  private loadAgentsFallback(): void {
    // Pour le chef dossier, charger tous les utilisateurs et filtrer les agents dossier
    this.utilisateurService.getAllUtilisateurs()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allUsers) => {
          // Filtrer uniquement les agents dossier
          this.agentsChef = allUsers.filter(user => {
            const role = user.roleUtilisateur || user.role || '';
            return role === Role.AGENT_DOSSIER || 
                   role === 'AGENT_DOSSIER' ||
                   String(role) === String(Role.AGENT_DOSSIER);
          });
          this.loadingAgents = false;
          if (this.agentsChef.length === 0) {
            this.agentLoadError = 'Aucun agent dossier trouvé.';
          } else {
            console.log('✅ Agents dossier chargés via fallback:', this.agentsChef.length);
          }
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des utilisateurs (fallback):', error);
          // Extraire un message d'erreur plus clair
          let errorMsg = 'Erreur lors du chargement des agents.';
          if (error?.message) {
            errorMsg = error.message;
          } else if (error?.error?.message) {
            errorMsg = error.error.message;
          } else if (error?.status === 500) {
            errorMsg = 'Erreur serveur interne. L\'endpoint backend /api/users/chef/{id} n\'est peut-être pas disponible.';
          } else if (error?.status === 0) {
            errorMsg = 'Impossible de se connecter au serveur. Vérifiez que le backend est démarré.';
          }
          this.agentLoadError = errorMsg;
          this.loadingAgents = false;
        }
      });
  }

  assignToAgent(): void {
    if (!this.dossier) {
      this.toastService.error('Dossier introuvable.');
      return;
    }
    if (!this.selectedAgentId) {
      this.toastService.error('Veuillez sélectionner un agent.');
      return;
    }
    const dossierId = Number(this.dossier.id);
    if (Number.isNaN(dossierId)) {
      this.toastService.error('Identifiant dossier invalide.');
      return;
    }

    this.assigningAgent = true;
    this.dossierApiService.assignerAgent(dossierId, this.selectedAgentId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          const fallbackName = this.selectedAgentId ? this.getAgentNameFromList(this.selectedAgentId) : '';
          const agentName = this.extractAgentName(updated) || fallbackName;
          this.dossier = new Dossier({
            ...this.dossier,
            agentResponsable: agentName
          });
          this.toastService.success('Dossier affecté à l’agent sélectionné.');
          this.assignAgentPanelOpen = false;
          this.selectedAgentId = null;
          this.assigningAgent = false;
        },
        error: (error) => {
          console.error('Erreur lors de l’assignation de l’agent:', error);
          this.toastService.error(error?.message || 'Erreur lors de l’affectation.');
          this.assigningAgent = false;
        }
      });
  }

  trackAgent(index: number, agent: Utilisateur): number {
    return agent.id ?? index;
  }

  private extractAgentName(dossierApi: any): string {
    if (!dossierApi?.agentResponsable) {
      return '';
    }
    if (typeof dossierApi.agentResponsable === 'string') {
      return dossierApi.agentResponsable;
    }
    const agent = dossierApi.agentResponsable;
    return `${agent?.prenom || ''} ${agent?.nom || ''}`.trim();
  }

  private getAgentNameFromList(agentId: number): string {
    const agent = this.agentsChef.find(a => Number(a.id) === Number(agentId));
    return agent ? `${agent.prenom || ''} ${agent.nom || ''}`.trim() : '';
  }

  private hasChefPrivileges(): boolean {
    const role = this.currentUser?.roleUtilisateur || (this.currentUser as any)?.role;
    if (!role) {
      return false;
    }
    return this.chefRoles.includes(role as Role);
  }

  isChefDossier(): boolean {
    if (!this.currentUser) {
      console.log('🔍 isChefDossier - currentUser est null');
      return false;
    }
    const role = this.currentUser?.roleUtilisateur || (this.currentUser as any)?.role;
    if (!role) {
      return false;
    }
    // Comparer en convertissant en string pour gérer les cas enum et string
    const roleStr = String(role);
    const expectedRoleStr = String(Role.CHEF_DEPARTEMENT_DOSSIER);
    const isChef = roleStr === expectedRoleStr || role === Role.CHEF_DEPARTEMENT_DOSSIER;
    console.log('🔍 isChefDossier - role:', role, 'type:', typeof role, 'Role.CHEF_DEPARTEMENT_DOSSIER:', Role.CHEF_DEPARTEMENT_DOSSIER, 'isChef:', isChef);
    return isChef;
  }

  getEtatDossierBadgeClass(state?: string): string {
    switch (state) {
      case 'RECOVERED_TOTAL':
        return 'badge-success';
      case 'RECOVERED_PARTIAL':
        return 'badge-warning';
      case 'NOT_RECOVERED':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  getDocumentStatusClass(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'badge-info';
      case 'EXPIRED':
        return 'badge-danger';
      case 'COMPLETED':
        return 'badge-success';
      default:
        return 'badge-secondary';
    }
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'HIGH':
        return 'alert-danger';
      case 'MEDIUM':
        return 'alert-warning';
      case 'LOW':
        return 'alert-info';
      default:
        return 'alert-secondary';
    }
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

  trackById(_: number, item: { id: number }): number {
    return item.id;
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

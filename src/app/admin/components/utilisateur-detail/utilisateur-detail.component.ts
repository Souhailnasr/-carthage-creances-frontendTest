import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UtilisateurService, Utilisateur } from '../../../services/utilisateur.service';

@Component({
  selector: 'app-utilisateur-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="utilisateur-detail-container">
      <!-- Header -->
      <div class="detail-header">
        <button class="back-btn" (click)="goBack()">
          <i class="fas fa-arrow-left"></i>
          Retour
        </button>
        <div class="header-actions">
          <button class="btn btn-warning" (click)="editUtilisateur()">
            <i class="fas fa-edit"></i>
            Modifier
          </button>
          <button class="btn btn-danger" (click)="deleteUtilisateur()">
            <i class="fas fa-trash"></i>
            Supprimer
          </button>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="detail-content" *ngIf="utilisateur">
        <!-- Informations personnelles -->
        <div class="info-section">
          <div class="section-header">
            <h2>Informations Personnelles</h2>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <label>Nom complet</label>
              <div class="info-value">{{ utilisateur.prenom }} {{ utilisateur.nom }}</div>
            </div>
            <div class="info-item">
              <label>Email</label>
              <div class="info-value">{{ utilisateur.email }}</div>
            </div>
            <div class="info-item">
              <label>Téléphone</label>
              <div class="info-value">{{ utilisateur.telephone || 'Non renseigné' }}</div>
            </div>
            <div class="info-item">
              <label>Adresse</label>
              <div class="info-value">{{ utilisateur.adresse || 'Non renseignée' }}</div>
            </div>
          </div>
        </div>

        <!-- Informations professionnelles -->
        <div class="info-section">
          <div class="section-header">
            <h2>Informations Professionnelles</h2>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <label>Rôle</label>
              <div class="info-value">
                <span class="role-badge" [class]="'role-' + (utilisateur.role || '').toLowerCase()">
                  {{ getRoleDisplay(utilisateur.role) }}
                </span>
              </div>
            </div>
            <div class="info-item">
              <label>Département</label>
              <div class="info-value">{{ utilisateur.departement || 'Non renseigné' }}</div>
            </div>
            <div class="info-item">
              <label>Statut</label>
              <div class="info-value">
                <span class="status-badge" [class]="utilisateur.actif ? 'status-active' : 'status-inactive'">
                  {{ utilisateur.actif ? 'Actif' : 'Inactif' }}
                </span>
              </div>
            </div>
            <div class="info-item" *ngIf="utilisateur.chefId">
              <label>Chef de département</label>
              <div class="info-value">ID: {{ utilisateur.chefId }}</div>
            </div>
          </div>
        </div>

        <!-- Informations système -->
        <div class="info-section">
          <div class="section-header">
            <h2>Informations Système</h2>
          </div>
          <div class="info-grid">
            <div class="info-item">
              <label>ID Utilisateur</label>
              <div class="info-value">{{ utilisateur.id }}</div>
            </div>
            <div class="info-item" *ngIf="utilisateur.dateCreation">
              <label>Date de création</label>
              <div class="info-value">{{ utilisateur.dateCreation | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
            <div class="info-item" *ngIf="utilisateur.dateModification">
              <label>Dernière modification</label>
              <div class="info-value">{{ utilisateur.dateModification | date:'dd/MM/yyyy HH:mm' }}</div>
            </div>
          </div>
        </div>

        <!-- Statistiques (si disponibles) -->
        <div class="info-section" *ngIf="utilisateurStats">
          <div class="section-header">
            <h2>Statistiques</h2>
          </div>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-folder"></i>
              </div>
              <div class="stat-content">
                <h3>{{ utilisateurStats.dossiersCrees || 0 }}</h3>
                <p>Dossiers créés</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-check-circle"></i>
              </div>
              <div class="stat-content">
                <h3>{{ utilisateurStats.dossiersValides || 0 }}</h3>
                <p>Dossiers validés</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-clock"></i>
              </div>
              <div class="stat-content">
                <h3>{{ utilisateurStats.dossiersEnAttente || 0 }}</h3>
                <p>En attente</p>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <i class="fas fa-money-bill-wave"></i>
              </div>
              <div class="stat-content">
                <h3>{{ utilisateurStats.montantRecupere || 0 | currency:'TND':'symbol':'1.0-0' }}</h3>
                <p>Montant récupéré</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div class="loading" *ngIf="isLoading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement...</p>
      </div>

      <!-- Error -->
      <div class="error" *ngIf="error">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button class="btn btn-primary" (click)="loadUtilisateur()">
          Réessayer
        </button>
      </div>
    </div>
  `,
  styles: [`
    .utilisateur-detail-container {
      padding: 30px;
      background-color: #f8f9fa;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px 30px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 20px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }

    .back-btn:hover {
      background: #5a6268;
    }

    .header-actions {
      display: flex;
      gap: 15px;
    }

    .detail-content {
      display: grid;
      gap: 30px;
    }

    .info-section {
      background: white;
      border-radius: 15px;
      padding: 30px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .section-header {
      margin-bottom: 25px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f8f9fa;
    }

    .section-header h2 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
      color: #2c3e50;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 25px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .info-item label {
      font-weight: 600;
      color: #7f8c8d;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 1.1rem;
      color: #2c3e50;
      font-weight: 500;
    }

    .role-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .role-badge.role-super_admin {
      background: #e74c3c;
      color: white;
    }

    .role-badge.role-chef_departement_dossier {
      background: #f39c12;
      color: white;
    }

    .role-badge.role-agent_dossier {
      background: #3498db;
      color: white;
    }

    .role-badge.role-agent_juridique {
      background: #9b59b6;
      color: white;
    }

    .status-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 0.9rem;
      font-weight: 600;
    }

    .status-active {
      background: #d4edda;
      color: #155724;
    }

    .status-inactive {
      background: #f8d7da;
      color: #721c24;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 25px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 25px;
      background: #f8f9fa;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: white;
      background: linear-gradient(135deg, #3498db, #2980b9);
    }

    .stat-content h3 {
      font-size: 1.8rem;
      font-weight: 700;
      margin: 0 0 5px 0;
      color: #2c3e50;
    }

    .stat-content p {
      margin: 0;
      color: #7f8c8d;
      font-weight: 500;
    }

    .loading, .error {
      text-align: center;
      padding: 60px 20px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .loading i, .error i {
      font-size: 3rem;
      margin-bottom: 20px;
      color: #3498db;
    }

    .error i {
      color: #e74c3c;
    }

    .btn {
      padding: 12px 24px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-warning {
      background: #ffc107;
      color: #333;
    }

    .btn-warning:hover {
      background: #e0a800;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-danger:hover {
      background: #c82333;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .utilisateur-detail-container {
        padding: 15px;
      }

      .detail-header {
        flex-direction: column;
        gap: 20px;
        text-align: center;
      }

      .header-actions {
        justify-content: center;
      }

      .info-grid {
        grid-template-columns: 1fr;
      }

      .stats-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class UtilisateurDetailComponent implements OnInit, OnDestroy {
  utilisateur: Utilisateur | null = null;
  utilisateurStats: any = null;
  isLoading = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private utilisateurService: UtilisateurService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUtilisateur();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUtilisateur(): void {
    this.isLoading = true;
    this.error = null;

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.utilisateurService.getUtilisateurById(+id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (utilisateur) => {
            this.utilisateur = utilisateur;
            this.isLoading = false;
            this.loadUtilisateurStats(+id);
          },
          error: (error) => {
            this.error = 'Erreur lors du chargement de l\'utilisateur';
            this.isLoading = false;
            console.error('Erreur:', error);
          }
        });
    } else {
      this.error = 'ID utilisateur manquant';
      this.isLoading = false;
    }
  }

  loadUtilisateurStats(utilisateurId: number): void {
    // TODO: Implémenter le chargement des statistiques
    // this.utilisateurService.getUtilisateurStats(utilisateurId)
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (stats) => {
    //       this.utilisateurStats = stats;
    //     },
    //     error: (error) => {
    //       console.error('Erreur lors du chargement des statistiques:', error);
    //     }
    //   });
  }

  editUtilisateur(): void {
    if (this.utilisateur) {
      this.router.navigate(['/admin/utilisateurs/edit', this.utilisateur.id]);
    }
  }

  deleteUtilisateur(): void {
    if (this.utilisateur && confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${this.utilisateur.prenom} ${this.utilisateur.nom} ?`)) {
      this.utilisateurService.deleteUtilisateur(this.utilisateur.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.router.navigate(['/admin/utilisateurs']);
          },
          error: (error) => {
            console.error('Erreur lors de la suppression:', error);
          }
        });
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/utilisateurs']);
  }

  getRoleDisplay(role: string | undefined): string {
    const roleMap: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Administrateur',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef de Département',
      'AGENT_DOSSIER': 'Agent de Dossier',
      'AGENT_JURIDIQUE': 'Agent Juridique',
      'AGENT_FINANCE': 'Agent Finance'
    };
    if (!role) return 'N/A';
    return roleMap[role] || role;
  }
}

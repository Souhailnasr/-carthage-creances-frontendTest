import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { CreancierApiService } from '../../../core/services/creancier-api.service';
import { DebiteurApiService } from '../../../core/services/debiteur-api.service';

@Component({
  selector: 'app-auth-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-test-container">
      <h3>Test d'Authentification JWT</h3>
      
      <div class="status-section">
        <h4>Statut d'authentification :</h4>
        <p [class]="isAuthenticated ? 'status-success' : 'status-error'">
          {{ isAuthenticated ? '✅ Connecté' : '❌ Non connecté' }}
        </p>
        <p *ngIf="token">Token: {{ token.substring(0, 20) }}...</p>
      </div>

      <div class="actions-section">
        <button class="btn btn-primary" (click)="testLogin()" [disabled]="isLoading">
          {{ isLoading ? 'Connexion...' : 'Tester la connexion' }}
        </button>
        <button class="btn btn-secondary" (click)="testApi()" [disabled]="!isAuthenticated || isLoading">
          Tester l'API
        </button>
        <button class="btn btn-danger" (click)="logout()">
          Se déconnecter
        </button>
      </div>

      <div class="results-section" *ngIf="results.length > 0">
        <h4>Résultats des tests :</h4>
        <div *ngFor="let result of results" class="result-item" [class]="result.success ? 'success' : 'error'">
          <strong>{{ result.action }}:</strong> {{ result.message }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-test-container {
      padding: 20px;
      max-width: 600px;
      margin: 20px auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }

    .status-section, .actions-section, .results-section {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #e1e5e9;
      border-radius: 6px;
    }

    .status-success {
      color: #28a745;
      font-weight: bold;
    }

    .status-error {
      color: #dc3545;
      font-weight: bold;
    }

    .btn {
      margin: 5px;
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary {
      background: #007bff;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .result-item {
      margin: 5px 0;
      padding: 8px;
      border-radius: 4px;
    }

    .result-item.success {
      background: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .result-item.error {
      background: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }
  `]
})
export class AuthTestComponent implements OnInit {
  isAuthenticated = false;
  token: string | null = null;
  isLoading = false;
  results: Array<{action: string, message: string, success: boolean}> = [];

  constructor(
    private jwtAuthService: JwtAuthService,
    private creancierApiService: CreancierApiService,
    private debiteurApiService: DebiteurApiService
  ) {}

  ngOnInit(): void {
    this.checkAuthStatus();
  }

  checkAuthStatus(): void {
    this.isAuthenticated = this.jwtAuthService.isAuthenticated();
    this.token = this.jwtAuthService.getCurrentToken();
  }

  testLogin(): void {
    this.isLoading = true;
    this.results = [];
    
    this.jwtAuthService.loginDev().subscribe({
      next: (response) => {
        this.addResult('Connexion', 'Connexion réussie ! Token obtenu.', true);
        this.checkAuthStatus();
        this.isLoading = false;
      },
      error: (error) => {
        this.addResult('Connexion', `Échec de la connexion: ${error.message || error}`, false);
        this.isLoading = false;
      }
    });
  }

  testApi(): void {
    this.isLoading = true;
    
    // Tester l'API des créanciers
    this.creancierApiService.getAllCreanciers().subscribe({
      next: (creanciers) => {
        this.addResult('API Créanciers', `Récupération réussie: ${creanciers.length} créanciers`, true);
        this.isLoading = false;
      },
      error: (error) => {
        this.addResult('API Créanciers', `Erreur: ${error.message || error}`, false);
        this.isLoading = false;
      }
    });
  }

  logout(): void {
    this.jwtAuthService.logout();
    this.checkAuthStatus();
    this.addResult('Déconnexion', 'Déconnexion réussie', true);
  }

  private addResult(action: string, message: string, success: boolean): void {
    this.results.push({ action, message, success });
  }
}

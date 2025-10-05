import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-network-error',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="network-error">
      <div class="error-container">
        <h1>🌐</h1>
        <h2>Erreur Réseau</h2>
        <p>Impossible de contacter le serveur. Vérifiez votre connexion internet.</p>
        <a routerLink="/dashboard" class="btn btn-primary">Retour au tableau de bord</a>
      </div>
    </div>
  `,
  styles: [`
    .network-error {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background: #f8f9fa;
    }
    .error-container {
      text-align: center;
      padding: 40px;
    }
    h1 {
      font-size: 6rem;
      margin: 0;
    }
    h2 {
      color: #495057;
      margin: 20px 0;
    }
    p {
      color: #6c757d;
      margin-bottom: 30px;
    }
  `]
})
export class NetworkErrorComponent {}

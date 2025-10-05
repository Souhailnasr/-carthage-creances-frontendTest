import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-server-error',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="server-error">
      <div class="error-container">
        <h1>500</h1>
        <h2>Erreur Serveur</h2>
        <p>Une erreur serveur s'est produite. Veuillez réessayer plus tard.</p>
        <a routerLink="/dashboard" class="btn btn-primary">Retour au tableau de bord</a>
      </div>
    </div>
  `,
  styles: [`
    .server-error {
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
      color: #dc3545;
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
export class ServerErrorComponent {}

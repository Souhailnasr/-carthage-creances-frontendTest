import { Component } from '@angular/core';

@Component({
  selector: 'app-taches',
  standalone: true,
  template: `
    <div class="taches-page">
      <div class="page-header">
        <h2>Gestion des Tâches</h2>
        <p class="page-description">
          Gérez vos tâches et suivez leur progression
        </p>
      </div>
      
      <div class="page-content">
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <h4>Module en développement</h4>
          <p>La gestion des tâches sera bientôt disponible.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .taches-page {
      padding: 2rem;
      min-height: 100vh;
      background: #f8f9fa;
    }
    
    .page-header {
      margin-bottom: 2rem;
    }
    
    .page-header h2 {
      margin: 0 0 0.5rem 0;
      color: #2c3e50;
      font-size: 2rem;
      font-weight: 600;
    }
    
    .page-description {
      margin: 0;
      color: #7f8c8d;
      font-size: 1.1rem;
    }
    
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      text-align: center;
      color: #7f8c8d;
    }
    
    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }
    
    .empty-state h4 {
      margin: 0 0 0.5rem 0;
      color: #34495e;
      font-size: 1.3rem;
    }
    
    .empty-state p {
      margin: 0;
      font-size: 1rem;
    }
  `]
})
export class TachesComponent {
  constructor() {}
}

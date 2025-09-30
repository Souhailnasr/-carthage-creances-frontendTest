import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiDiagnosticService } from '../../../core/services/api-diagnostic.service';

@Component({
  selector: 'app-api-diagnostic',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="diagnostic-container">
      <h2>Diagnostic API</h2>
      
      <div class="diagnostic-section">
        <h3>Test de connectivité</h3>
        <button (click)="runDiagnostic()" [disabled]="loading" class="btn btn-primary">
          {{ loading ? 'Test en cours...' : 'Lancer le diagnostic' }}
        </button>
      </div>

      <div *ngIf="diagnosticResults" class="results">
        <h3>Résultats du diagnostic</h3>
        
        <div class="result-item" [class.success]="diagnosticResults.backend.status === 'SUCCESS'" 
             [class.error]="diagnosticResults.backend.status === 'ERROR'">
          <h4>Backend</h4>
          <p><strong>Status:</strong> {{ diagnosticResults.backend.status }}</p>
          <p><strong>Message:</strong> {{ diagnosticResults.backend.message }}</p>
        </div>

        <div class="result-item" [class.success]="diagnosticResults.creancier.status === 'SUCCESS'" 
             [class.error]="diagnosticResults.creancier.status === 'ERROR'">
          <h4>Endpoint Créancier</h4>
          <p><strong>Status:</strong> {{ diagnosticResults.creancier.status }}</p>
          <p><strong>Message:</strong> {{ diagnosticResults.creancier.message }}</p>
        </div>

        <div class="result-item" [class.success]="diagnosticResults.debiteur.status === 'SUCCESS'" 
             [class.error]="diagnosticResults.debiteur.status === 'ERROR'">
          <h4>Endpoint Débiteur</h4>
          <p><strong>Status:</strong> {{ diagnosticResults.debiteur.status }}</p>
          <p><strong>Message:</strong> {{ diagnosticResults.debiteur.message }}</p>
        </div>

      </div>

      <div *ngIf="errorMessage" class="error-message">
        <h4>Erreur</h4>
        <p>{{ errorMessage }}</p>
      </div>
    </div>
  `,
  styles: [`
    .diagnostic-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .diagnostic-section {
      margin-bottom: 20px;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }

    .results {
      margin-top: 20px;
    }

    .result-item {
      margin: 10px 0;
      padding: 15px;
      border-radius: 5px;
      border: 1px solid #ddd;
    }

    .result-item.success {
      background-color: #d4edda;
      border-color: #c3e6cb;
    }

    .result-item.error {
      background-color: #f8d7da;
      border-color: #f5c6cb;
    }

    .error-message {
      margin-top: 20px;
      padding: 15px;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 5px;
      color: #721c24;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }

    .btn-primary {
      background-color: #007bff;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  `]
})
export class ApiDiagnosticComponent implements OnInit {
  loading = false;
  diagnosticResults: any = null;
  errorMessage: string = '';

  constructor(private diagnosticService: ApiDiagnosticService) { }

  ngOnInit(): void {
    // Auto-run diagnostic on init
    this.runDiagnostic();
  }

  runDiagnostic(): void {
    this.loading = true;
    this.diagnosticResults = null;
    this.errorMessage = '';

    this.diagnosticService.runFullDiagnostic().subscribe({
      next: (results) => {
        this.diagnosticResults = results;
        this.loading = false;
        console.log('Diagnostic results:', results);
      },
      error: (error) => {
        this.errorMessage = `Erreur lors du diagnostic: ${error.message}`;
        this.loading = false;
        console.error('Diagnostic error:', error);
      }
    });
  }
}

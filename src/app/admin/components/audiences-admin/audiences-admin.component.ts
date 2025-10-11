import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-audiences-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './audiences-admin.component.html',
  styleUrls: ['./audiences-admin.component.scss']
})
export class AudiencesAdminComponent implements OnInit {
  audiences: any[] = [];

  ngOnInit(): void {
    // Simuler les audiences (à remplacer par un vrai service)
    this.audiences = [
      { 
        id: 1, 
        date: '2024-01-15', 
        type: 'Audience civile', 
        statut: 'Programmée',
        tribunal: 'Tribunal de Tunis',
        dossier: 'Dossier #2024-001'
      },
      { 
        id: 2, 
        date: '2024-01-20', 
        type: 'Audience pénale', 
        statut: 'En cours',
        tribunal: 'Tribunal de Sfax',
        dossier: 'Dossier #2024-002'
      },
      { 
        id: 3, 
        date: '2024-01-25', 
        type: 'Audience commerciale', 
        statut: 'Terminée',
        tribunal: 'Tribunal de Sousse',
        dossier: 'Dossier #2024-003'
      }
    ];
  }

  getStatusClass(statut: string): string {
    return statut.toLowerCase().replace(' ', '-');
  }
}

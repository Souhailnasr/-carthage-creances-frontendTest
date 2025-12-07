import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExportService {
  private apiUrl = `${environment.apiUrl}/api/admin/export`;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('❌ Erreur ExportService:', error);
    return throwError(() => error);
  }

  /**
   * Exporte un dossier complet en PDF
   */
  exportDossierPDF(dossierId: number): Observable<Blob> {
    const headers = this.getHeaders();
    return this.http.get(
      `${this.apiUrl}/dossier/${dossierId}/pdf`,
      { headers, responseType: 'blob' }
    ).pipe(
      tap(() => console.log('✅ PDF dossier généré')),
      catchError(this.handleError)
    );
  }

  /**
   * Exporte un tableau de données en CSV
   */
  exportTableauCSV(data: any[], filename: string): void {
    if (!data || data.length === 0) {
      console.warn('⚠️ Aucune donnée à exporter');
      return;
    }

    // Créer les en-têtes CSV
    const headers = Object.keys(data[0]);
    const csvHeaders = headers.join(',');
    
    // Créer les lignes CSV
    const csvRows = data.map(row => {
      return headers.map(header => {
        const value = row[header];
        // Gérer les valeurs null/undefined et échapper les virgules
        if (value === null || value === undefined) return '';
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',');
    });

    // Combiner headers et rows
    const csvContent = [csvHeaders, ...csvRows].join('\n');
    
    // Créer le blob et télécharger
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ CSV exporté:', filename);
  }

  /**
   * Exporte un rapport personnalisé depuis le backend
   */
  exportRapportComplet(filters: {
    type?: string;
    dateDebut?: string;
    dateFin?: string;
    departement?: string[];
    format?: 'pdf' | 'csv' | 'excel';
  }): Observable<Blob> {
    const headers = this.getHeaders();
    let params = new HttpParams();
    
    if (filters.type) params = params.set('type', filters.type);
    if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
    if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
    if (filters.departement && filters.departement.length > 0) {
      filters.departement.forEach(d => params = params.append('departement', d));
    }
    if (filters.format) params = params.set('format', filters.format);

    const contentType = filters.format === 'pdf' ? 'application/pdf' : 
                        filters.format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' :
                        'text/csv';

    return this.http.get(
      `${this.apiUrl}/rapport`,
      { headers, params, responseType: 'blob' }
    ).pipe(
      tap(() => console.log('✅ Rapport généré')),
      catchError(this.handleError)
    );
  }

  /**
   * Télécharge un fichier blob
   */
  downloadBlob(blob: Blob, filename: string): void {
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Libérer l'URL après téléchargement
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }
}


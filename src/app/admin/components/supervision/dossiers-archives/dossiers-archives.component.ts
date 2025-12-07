import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupervisionService } from '../../../../core/services/supervision.service';
import { ExportService } from '../../../../core/services/export.service';
import { DossierApi, DossierStatus } from '../../../../shared/models/dossier-api.model';
import { DossierApiService } from '../../../../core/services/dossier-api.service';

@Component({
  selector: 'app-dossiers-archives',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './dossiers-archives.component.html',
  styleUrls: ['./dossiers-archives.component.scss']
})
export class DossiersArchivesComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Recherche globale
  rechercheGlobale = '';
  
  // Données
  dossiers: DossierApi[] = [];
  
  // Pagination
  totalElements = 0;
  pageSize = 50;
  pageIndex = 0;
  
  // États
  loading = false;
  
  // Colonnes du tableau
  displayedColumns: string[] = [
    'reference',
    'debiteur',
    'montant',
    'dateArchivage',
    'raisonArchivage',
    'departementOrigine',
    'actions'
  ];
  
  constructor(
    private supervisionService: SupervisionService,
    private exportService: ExportService,
    private dossierApiService: DossierApiService,
    private snackBar: MatSnackBar
  ) {}
  
  ngOnInit(): void {
    this.loadDossiers();
    
    // Debounce sur la recherche globale
    // Note: Pour une vraie recherche full-text, il faudrait un endpoint backend
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  loadDossiers(): void {
    this.loading = true;
    
    console.log('📥 Chargement des dossiers archivés ET clôturés...');
    
    // ✅ CORRECTION : Charger à la fois les dossiers archivés ET les dossiers clôturés
    // Utiliser forkJoin pour charger les deux en parallèle
    
    // Préparer les filtres pour les dossiers archivés
    const filtersArchives: any = {
      page: 0, // Charger toutes les pages pour les archives
      size: 100 // ✅ CORRECTION : Limiter à 100 (limite du backend)
    };
    
    if (this.rechercheGlobale && this.rechercheGlobale.trim()) {
      filtersArchives.recherche = this.rechercheGlobale.trim();
    }
    
    // Préparer les filtres pour les dossiers clôturés
    const filtersClotures: any = {
      page: 0,
      size: 100 // ✅ CORRECTION : Limiter à 100 (limite du backend)
    };
    
    // Charger les deux types de dossiers en parallèle
    // ✅ CORRECTION : Intercepter les erreurs AVANT qu'elles n'atteignent l'intercepteur global
    // pour éviter d'afficher le message d'erreur si le fallback fonctionne
    forkJoin({
      archives: this.supervisionService.getDossiersArchives(filtersArchives).pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          // ✅ CORRECTION : Intercepter l'erreur silencieusement pour éviter l'affichage du message d'erreur
          // L'erreur est attendue si les endpoints ne sont pas implémentés ou retournent une erreur 500
          console.warn('⚠️ Endpoint getDossiersArchives non disponible ou erreur (attendu):', err.status || 'N/A');
          console.warn('⚠️ Utilisation du fallback getAllDossiers...');
          // Retourner un Observable vide sans propager l'erreur
          return of({ content: [], totalElements: 0, totalPages: 0 });
        })
      ),
      clotures: this.supervisionService.getDossiersClotures(filtersClotures).pipe(
        takeUntil(this.destroy$),
        catchError(err => {
          // ✅ CORRECTION : Intercepter l'erreur silencieusement pour éviter l'affichage du message d'erreur
          console.warn('⚠️ Endpoint getDossiersClotures non disponible ou erreur (attendu):', err.status || 'N/A');
          console.warn('⚠️ Utilisation du fallback getAllDossiers...');
          // Retourner un Observable vide sans propager l'erreur
          return of({ content: [], totalElements: 0, totalPages: 0 });
        })
      )
    }).pipe(
      takeUntil(this.destroy$),
      // ✅ CORRECTION : Intercepter aussi les erreurs au niveau du forkJoin
      catchError(err => {
        console.warn('⚠️ Erreur dans forkJoin (attendu si les endpoints ne sont pas disponibles):', err);
        // Si forkJoin échoue complètement, utiliser directement le fallback
        this.loadDossiersFallback();
        // Retourner un Observable vide pour éviter la propagation de l'erreur
        return of({ archives: { content: [], totalElements: 0, totalPages: 0 }, clotures: { content: [], totalElements: 0, totalPages: 0 } });
      })
    ).subscribe({
      next: (results) => {
        console.log('✅ Dossiers archivés récupérés:', results.archives);
        console.log('✅ Dossiers clôturés récupérés:', results.clotures);
        console.log('✅ Nombre d\'archives:', results.archives.content?.length || 0);
        console.log('✅ Nombre de clôtures:', results.clotures.content?.length || 0);
        
        // Combiner les deux listes
        const archives = results.archives.content || [];
        const clotures = results.clotures.content || [];
        
        // Créer un Map pour éviter les doublons (basé sur l'ID du dossier)
        const dossiersUniques = new Map<number, DossierApi>();
        
        // Ajouter les dossiers archivés
        archives.forEach(d => {
          if (d.id) {
            dossiersUniques.set(d.id, d);
          }
        });
        
        // Ajouter les dossiers clôturés (qui ne sont pas déjà dans les archives)
        clotures.forEach(d => {
          if (d.id && !dossiersUniques.has(d.id)) {
            dossiersUniques.set(d.id, d);
          }
        });
        
        console.log(`✅ Total de dossiers uniques après fusion: ${dossiersUniques.size}`);
        
        // ✅ CORRECTION : Si les endpoints retournent des tableaux vides, utiliser le fallback
        // Cela peut arriver si les endpoints backend ne sont pas encore implémentés ou retournent toujours vide
        // Vérifier aussi si totalElements est 0 pour les deux endpoints
        const totalArchives = results.archives.totalElements || 0;
        const totalClotures = results.clotures.totalElements || 0;
        
        if (dossiersUniques.size === 0 && archives.length === 0 && clotures.length === 0 && totalArchives === 0 && totalClotures === 0) {
          console.warn('⚠️ Aucun dossier trouvé via les endpoints spécialisés (archives et clôtures vides), utilisation de getAllDossiers...');
          console.warn('⚠️ Les endpoints backend peuvent ne pas être implémentés ou retourner toujours vide');
          this.loadDossiersFallback();
          return;
        }
        
        // Convertir la Map en tableau
        let allDossiers = Array.from(dossiersUniques.values());
        
        // Appliquer la recherche globale si présente
        if (this.rechercheGlobale && this.rechercheGlobale.trim()) {
          const recherche = this.rechercheGlobale.toLowerCase();
          allDossiers = allDossiers.filter(d => {
            const debiteurNom = `${d.debiteur?.nom || ''} ${d.debiteur?.prenom || ''}`.toLowerCase();
            const numeroDossier = (d.numeroDossier || '').toLowerCase();
            const titre = (d.titre || '').toLowerCase();
            const raisonArchivage = ((d as any).raisonArchivage || '').toLowerCase();
            
            return numeroDossier.includes(recherche) ||
                   debiteurNom.includes(recherche) ||
                   titre.includes(recherche) ||
                   raisonArchivage.includes(recherche);
          });
        }
        
        // Trier par date d'archivage (si disponible) ou date de clôture, du plus récent au plus ancien
        allDossiers.sort((a, b) => {
          const dateA = (a as any).dateArchivage ? new Date((a as any).dateArchivage).getTime() : 
                       (a.dateCloture ? new Date(a.dateCloture).getTime() : 0);
          const dateB = (b as any).dateArchivage ? new Date((b as any).dateArchivage).getTime() : 
                       (b.dateCloture ? new Date(b.dateCloture).getTime() : 0);
          return dateB - dateA; // Plus récent en premier
        });
        
        // Appliquer la pagination côté client
        this.totalElements = allDossiers.length;
        const startIndex = this.pageIndex * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        this.dossiers = allDossiers.slice(startIndex, endIndex);
        
        this.loading = false;
        
        console.log(`✅ ${this.totalElements} dossiers archivés/clôturés trouvés, ${this.dossiers.length} affichés sur la page ${this.pageIndex + 1}`);
        
        if (this.dossiers.length === 0 && this.totalElements === 0) {
          console.warn('⚠️ Aucun dossier archivé ou clôturé trouvé');
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des dossiers:', error);
        // Fallback vers getAllDossiers
        this.loadDossiersFallback();
      }
    });
  }
  
  private loadDossiersFallback(): void {
    console.log('📥 Fallback: Chargement via getAllDossiers...');
    
    // ✅ CORRECTION : Charger plusieurs pages si nécessaire (limite backend = 100 par page)
    const pageSize = 100; // Limite du backend
    let allDossiers: DossierApi[] = [];
    let currentPage = 0;
    let totalPages = 1;
    
    const loadPage = (page: number): void => {
      this.dossierApiService.getAllDossiers(page, pageSize).pipe(
        takeUntil(this.destroy$)
      ).subscribe({
        next: (pageResponse) => {
          console.log(`✅ Page ${page + 1} récupérée: ${pageResponse.content.length} dossiers`);
          
          // Ajouter les dossiers de cette page
          allDossiers = [...allDossiers, ...pageResponse.content];
          totalPages = pageResponse.totalPages || 1;
          
          // Si il y a d'autres pages, les charger
          if (page < totalPages - 1) {
            loadPage(page + 1);
          } else {
            // Toutes les pages sont chargées, maintenant filtrer
            this.processFallbackDossiers(allDossiers);
          }
        },
        error: (error) => {
          console.error(`❌ Erreur lors du chargement de la page ${page + 1}:`, error);
          
          // Si c'est la première page qui échoue, afficher l'erreur
          if (page === 0) {
            this.snackBar.open('Erreur lors du chargement des dossiers archivés', 'Fermer', { duration: 3000 });
            this.loading = false;
          } else {
            // Si une page suivante échoue, traiter les dossiers déjà chargés
            this.processFallbackDossiers(allDossiers);
          }
        }
      });
    };
    
    // Commencer par charger la première page
    loadPage(0);
  }
  
  private processFallbackDossiers(allDossiers: DossierApi[]): void {
    console.log(`✅ Total de ${allDossiers.length} dossiers récupérés, filtrage en cours...`);
    
    // Filtrer les dossiers clôturés ou archivés
    let filtered = allDossiers.filter(d => {
      const isCloture = d.dossierStatus === DossierStatus.CLOTURE || 
                       String(d.dossierStatus).toUpperCase() === 'CLOTURE' ||
                       String(d.dossierStatus).toUpperCase() === 'CLOTURÉ';
      const isArchive = (d as any).archive === true || (d as any).estArchive === true;
      return isCloture || isArchive;
    });
    
    console.log(`✅ ${filtered.length} dossiers clôturés/archivés trouvés après filtrage`);
    
    // Appliquer recherche globale si présente
    if (this.rechercheGlobale && this.rechercheGlobale.trim()) {
      const recherche = this.rechercheGlobale.toLowerCase();
      filtered = filtered.filter(d => {
        const debiteurNom = `${d.debiteur?.nom || ''} ${d.debiteur?.prenom || ''}`.toLowerCase();
        const numeroDossier = (d.numeroDossier || '').toLowerCase();
        const titre = (d.titre || '').toLowerCase();
        
        return numeroDossier.includes(recherche) ||
               debiteurNom.includes(recherche) ||
               titre.includes(recherche);
      });
    }
    
    // Trier par date de clôture ou archivage
    filtered.sort((a, b) => {
      const dateA = (a as any).dateArchivage ? new Date((a as any).dateArchivage).getTime() : 
                   (a.dateCloture ? new Date(a.dateCloture).getTime() : 0);
      const dateB = (b as any).dateArchivage ? new Date((b as any).dateArchivage).getTime() : 
                   (b.dateCloture ? new Date(b.dateCloture).getTime() : 0);
      return dateB - dateA;
    });
    
    // Appliquer la pagination
    this.totalElements = filtered.length;
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.dossiers = filtered.slice(startIndex, endIndex);
    
    this.loading = false;
    
    console.log(`✅ ${this.totalElements} dossiers clôturés/archivés trouvés, ${this.dossiers.length} affichés sur la page ${this.pageIndex + 1}`);
    
    if (this.dossiers.length === 0 && this.totalElements === 0) {
      console.warn('⚠️ Aucun dossier clôturé ou archivé trouvé');
      this.snackBar.open('Aucun dossier archivé ou clôturé trouvé', 'Fermer', { duration: 3000 });
    }
  }
  
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadDossiers();
  }
  
  onRechercheChange(): void {
    this.pageIndex = 0;
    this.loadDossiers();
  }
  
  voirDetails(dossier: DossierApi): void {
    // TODO: Ouvrir modal avec détails complets (read-only)
    console.log('Voir détails:', dossier);
  }
  
  telechargerDossierComplet(dossier: DossierApi): void {
    this.supervisionService.telechargerDossierCompletPDF(dossier.id!).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (blob) => {
        this.exportService.downloadBlob(blob, `DOSSIER-ARCHIVE-${dossier.numeroDossier}.pdf`);
        this.snackBar.open('PDF exporté avec succès', 'Fermer', { duration: 2000 });
      },
      error: (error) => {
        console.error('❌ Erreur lors du téléchargement:', error);
        this.snackBar.open('Erreur lors du téléchargement', 'Fermer', { duration: 3000 });
      }
    });
  }
  
  exporterSelectionCSV(): void {
    this.exportService.exportTableauCSV(this.dossiers, 'dossiers_archives');
    this.snackBar.open('CSV exporté avec succès', 'Fermer', { duration: 2000 });
  }
  
  // ✅ Méthodes utilitaires pour le template
  getDateArchivage(dossier: DossierApi): string | null {
    return (dossier as any).dateArchivage || dossier.dateCloture || null;
  }
  
  getRaisonArchivage(dossier: DossierApi): string | null {
    return (dossier as any).raisonArchivage || (dossier as any).motifCloture || null;
  }
  
  getDepartementOrigine(dossier: DossierApi): string | null {
    return (dossier as any).departementOrigine || dossier.typeRecouvrement || null;
  }
}


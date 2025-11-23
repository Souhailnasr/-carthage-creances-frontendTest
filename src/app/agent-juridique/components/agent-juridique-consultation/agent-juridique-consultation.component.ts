import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AgentJuridiqueService } from '../../../core/services/agent-juridique.service';
import { Avocat } from '../../../juridique/models/avocat.model';
import { Huissier } from '../../../juridique/models/huissier.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-agent-juridique-consultation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './agent-juridique-consultation.component.html',
  styleUrls: ['./agent-juridique-consultation.component.scss']
})
export class AgentJuridiqueConsultationComponent implements OnInit, OnDestroy {
  avocats: Avocat[] = [];
  huissiers: Huissier[] = [];
  filteredAvocats: Avocat[] = [];
  filteredHuissiers: Huissier[] = [];
  loading = false;
  searchAvocat = '';
  searchHuissier = '';
  
  displayedColumnsAvocats: string[] = ['nom', 'prenom', 'email', 'telephone', 'specialite', 'numeroOrdre'];
  displayedColumnsHuissiers: string[] = ['nom', 'prenom', 'email', 'telephone', 'adresse'];
  
  private destroy$ = new Subject<void>();

  constructor(
    private agentJuridiqueService: AgentJuridiqueService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadAvocats();
    this.loadHuissiers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAvocats(): void {
    this.loading = true;
    this.agentJuridiqueService.getAvocats().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (avocats) => {
        this.avocats = avocats;
        this.filteredAvocats = avocats;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des avocats:', error);
        this.toastService.error('Erreur lors du chargement des avocats');
        this.loading = false;
      }
    });
  }

  loadHuissiers(): void {
    this.loading = true;
    this.agentJuridiqueService.getHuissiers().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (huissiers) => {
        this.huissiers = huissiers;
        this.filteredHuissiers = huissiers;
        this.loading = false;
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des huissiers:', error);
        this.toastService.error('Erreur lors du chargement des huissiers');
        this.loading = false;
      }
    });
  }

  filterAvocats(): void {
    if (!this.searchAvocat.trim()) {
      this.filteredAvocats = [...this.avocats];
      return;
    }
    
    const searchLower = this.searchAvocat.toLowerCase();
    this.filteredAvocats = this.avocats.filter(a =>
      a.nom?.toLowerCase().includes(searchLower) ||
      a.prenom?.toLowerCase().includes(searchLower) ||
      a.email?.toLowerCase().includes(searchLower) ||
      a.specialite?.toLowerCase().includes(searchLower) ||
      a.numeroOrdre?.toLowerCase().includes(searchLower)
    );
  }

  filterHuissiers(): void {
    if (!this.searchHuissier.trim()) {
      this.filteredHuissiers = [...this.huissiers];
      return;
    }
    
    const searchLower = this.searchHuissier.toLowerCase();
    this.filteredHuissiers = this.huissiers.filter(h =>
      h.nom?.toLowerCase().includes(searchLower) ||
      h.prenom?.toLowerCase().includes(searchLower) ||
      h.email?.toLowerCase().includes(searchLower) ||
      h.adresse?.toLowerCase().includes(searchLower)
    );
  }
}


import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { UtilisateurService, Utilisateur, UtilisateurRequest } from '../../../core/services/utilisateur.service';
import { JwtAuthService } from '../../../core/services/jwt-auth.service';
import { Role } from '../../../shared/models/enums.model';

@Component({
  selector: 'app-utilisateurs',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <div class="utilisateurs-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <h1>Gestion des Utilisateurs</h1>
          <p>Gérez les comptes utilisateurs et leurs permissions</p>
          <div class="user-context" *ngIf="currentUser">
            <span class="context-info">
              <i class="fas fa-user-shield"></i>
              Connecté en tant que <strong>{{ currentUser.prenom }} {{ currentUser.nom }}</strong>
              <span class="role-badge" [class]="'role-' + (currentUser.role || '').toLowerCase()">
                {{ getRoleDisplay(currentUser.role) }}
              </span>
            </span>
          </div>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()" [disabled]="!canCreateUsers()">
          <i class="fas fa-plus"></i>
          Nouvel Utilisateur
        </button>
      </div>

      <!-- Filtres et recherche -->
      <div class="filters-section">
        <div class="search-box">
          <i class="fas fa-search" [class.searching]="isLoading"></i>
          <input 
            type="text" 
            placeholder="Rechercher par nom, prénom ou email..." 
            [(ngModel)]="searchTerm"
            (input)="onSearch()"
            (keyup.enter)="onSearch()"
            class="search-input"
            [disabled]="isLoading"
          >
          <button 
            class="search-clear-btn" 
            *ngIf="searchTerm && !isLoading"
            (click)="clearSearch()"
            title="Effacer la recherche"
          >
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="filter-buttons">
          <button 
            class="filter-btn" 
            [class.active]="selectedStatus === ''"
            (click)="filterByStatus('')"
            title="Tous les utilisateurs"
          >
            <i class="fas fa-users"></i>
            Tous
          </button>
          <button 
            class="filter-btn" 
            [class.active]="selectedStatus === 'actif'"
            (click)="filterByStatus('actif')"
            title="Utilisateurs actifs"
          >
            <i class="fas fa-check-circle"></i>
            Actifs
          </button>
          <button 
            class="filter-btn" 
            [class.active]="selectedStatus === 'inactif'"
            (click)="filterByStatus('inactif')"
            title="Utilisateurs inactifs"
          >
            <i class="fas fa-times-circle"></i>
            Inactifs
          </button>
          <button 
            class="filter-btn" 
            [class.active]="showRecentOnly"
            (click)="toggleRecentFilter()"
            title="Utilisateurs créés récemment"
          >
            <i class="fas fa-clock"></i>
            Récents
          </button>
          <button 
            class="filter-btn" 
            (click)="exportUsers()"
            title="Exporter la liste"
          >
            <i class="fas fa-download"></i>
            Exporter
          </button>
        </div>
      </div>

      <!-- Indicateur de chargement -->
      <div class="loading" *ngIf="isLoading">
        <i class="fas fa-spinner fa-spin"></i>
        <p>Chargement des utilisateurs...</p>
      </div>

      <!-- Tableau des utilisateurs -->
      <div class="table-container" *ngIf="!isLoading">
        <table class="utilisateurs-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let utilisateur of filteredUtilisateurs" class="table-row">
              <td>
                <div class="user-info">
                  <div class="user-avatar">
                    <i class="fas fa-user"></i>
                  </div>
                  <div class="user-details">
                    <div class="user-name">{{ utilisateur.prenom }} {{ utilisateur.nom }}</div>
                    <div class="user-phone" *ngIf="utilisateur.telephone">{{ utilisateur.telephone }}</div>
                  </div>
                </div>
              </td>
              <td>{{ utilisateur.email }}</td>
              <td>
                <span class="role-badge" [class]="'role-' + (getUserRole(utilisateur) || '').toLowerCase()">
                  {{ getRoleDisplay(getUserRole(utilisateur)) }}
                </span>
              </td>
              <td>
                <span class="status-badge" [class]="utilisateur.actif ? 'status-active' : 'status-inactive'">
                  {{ utilisateur.actif ? 'Actif' : 'Inactif' }}
                </span>
              </td>
              <td>
                <div class="action-buttons">
                  <button class="btn btn-sm btn-info" (click)="viewUtilisateur(utilisateur)" title="Voir">
                    <i class="fas fa-eye"></i>
                  </button>
                  <button class="btn btn-sm btn-warning" (click)="editUtilisateur(utilisateur)" title="Modifier">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button 
                    class="btn btn-sm" 
                    [class.btn-success]="!utilisateur.actif"
                    [class.btn-danger]="utilisateur.actif"
                    (click)="toggleStatus(utilisateur)"
                    [title]="utilisateur.actif ? 'Désactiver' : 'Activer'"
                  >
                    <i class="fas" [class.fa-check]="!utilisateur.actif" [class.fa-times]="utilisateur.actif"></i>
                  </button>
                  <button class="btn btn-sm btn-danger" (click)="deleteUtilisateur(utilisateur)" title="Supprimer">
                    <i class="fas fa-trash"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

      <!-- Message si aucun utilisateur -->
      <div class="no-data" *ngIf="filteredUtilisateurs.length === 0 && !isLoading">
        <i class="fas fa-users" *ngIf="!searchTerm"></i>
        <i class="fas fa-search" *ngIf="searchTerm"></i>
        <p *ngIf="!searchTerm">Aucun utilisateur trouvé</p>
        <p *ngIf="searchTerm">Aucun résultat pour "{{ searchTerm }}"</p>
        <p class="info-text" *ngIf="!searchTerm">Les données sont chargées depuis la base de données MySQL</p>
        <p class="info-text" *ngIf="searchTerm">Essayez avec d'autres mots-clés</p>
        <div class="role-context" *ngIf="currentUser && !searchTerm">
          <p class="context-message">
            <i class="fas fa-info-circle"></i>
            En tant que <strong>{{ getRoleDisplay(currentUser.role) }}</strong>, 
            vous ne voyez que les utilisateurs de votre département.
          </p>
        </div>
        <div class="search-suggestions" *ngIf="searchTerm">
          <p class="suggestion-text">Suggestions :</p>
          <ul>
            <li>Vérifiez l'orthographe</li>
            <li>Essayez des mots-clés plus généraux</li>
            <li>Recherchez par nom, prénom ou email</li>
          </ul>
        </div>
      </div>
      </div>

      <!-- Modal de création/édition -->
      <div class="modal" [class.show]="showModal" *ngIf="showModal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ isEditMode ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur' }}</h2>
            <button class="close-btn" (click)="closeModal()">
              <i class="fas fa-times"></i>
            </button>
          </div>

          <form [formGroup]="utilisateurForm" (ngSubmit)="onSubmit()" class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label for="prenom">Prénom *</label>
                <input 
                  type="text" 
                  id="prenom" 
                  formControlName="prenom"
                  class="form-control"
                  [class.error]="prenomControl.invalid && prenomControl.touched"
                >
                <div class="error-message" *ngIf="prenomControl.invalid && prenomControl.touched">
                  Le prénom est requis
                </div>
              </div>

              <div class="form-group">
                <label for="nom">Nom *</label>
                <input 
                  type="text" 
                  id="nom" 
                  formControlName="nom"
                  class="form-control"
                  [class.error]="nomControl.invalid && nomControl.touched"
                >
                <div class="error-message" *ngIf="nomControl.invalid && nomControl.touched">
                  Le nom est requis
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email *</label>
              <input 
                type="email" 
                id="email" 
                formControlName="email"
                class="form-control"
                [class.error]="emailControl.invalid && emailControl.touched"
              >
              <div class="error-message" *ngIf="emailControl.invalid && emailControl.touched">
                <span *ngIf="emailControl.errors?.['required']">L'email est requis</span>
                <span *ngIf="emailControl.errors?.['email']">Format d'email invalide</span>
              </div>
            </div>

            <div class="form-group">
              <label for="motDePasse">Mot de passe *</label>
              <input 
                type="password" 
                id="motDePasse" 
                formControlName="motDePasse"
                class="form-control"
                [class.error]="motDePasseControl.invalid && motDePasseControl.touched"
                placeholder="Mot de passe"
              >
              <div class="error-message" *ngIf="motDePasseControl.invalid && motDePasseControl.touched">
                <span *ngIf="motDePasseControl.errors?.['required']">Le mot de passe est requis</span>
                <span *ngIf="motDePasseControl.errors?.['minlength']">Minimum 6 caractères</span>
              </div>
            </div>

            <div class="form-group">
              <label for="confirmPassword">Confirmez le mot de passe *</label>
              <input 
                type="password" 
                id="confirmPassword" 
                formControlName="confirmPassword"
                class="form-control"
                [class.error]="utilisateurForm.hasError('passwordMismatch') && utilisateurForm.touched"
                placeholder="Confirmez le mot de passe"
              >
              <div class="error-message" *ngIf="utilisateurForm.hasError('passwordMismatch') && utilisateurForm.touched">
                Les mots de passe ne correspondent pas
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="telephone">Téléphone</label>
                <input 
                  type="tel" 
                  id="telephone" 
                  formControlName="telephone"
                  class="form-control"
                >
              </div>

              <div class="form-group">
                <label for="role">Rôle *</label>
                <select 
                  id="role" 
                  formControlName="role"
                  class="form-control"
                  [class.error]="roleControl.invalid && roleControl.touched"
                >
                  <option value="">Sélectionner un rôle</option>
                  <option 
                    *ngFor="let role of getAvailableRoles()" 
                    [value]="role.value"
                    [disabled]="role.disabled"
                    [style.color]="role.disabled ? '#adb5bd' : '#2c3e50'"
                    [style.font-style]="role.disabled ? 'italic' : 'normal'"
                  >
                    {{ role.disabled ? '🔒 ' : '' }}{{ role.label }}
                  </option>
                </select>
                <div class="error-message" *ngIf="roleControl.invalid && roleControl.touched">
                  Le rôle est requis
                </div>
                <div class="role-info" *ngIf="getRoleRestrictionMessage()">
                  <i class="fas fa-info-circle"></i>
                  {{ getRoleRestrictionMessage() }}
                </div>
              </div>
            </div>


            <div class="form-group">
              <label for="adresse">Adresse</label>
              <textarea 
                id="adresse" 
                formControlName="adresse"
                class="form-control"
                rows="3"
              ></textarea>
            </div>

            <div class="form-group checkbox-group">
              <label class="checkbox-wrapper">
                <input type="checkbox" formControlName="actif">
                <span class="checkmark"></span>
                Utilisateur actif
              </label>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">
                Annuler
              </button>
              <button 
                type="submit" 
                class="btn btn-primary" 
                [disabled]="utilisateurForm.invalid || isLoading"
              >
                <i class="fas fa-spinner fa-spin" *ngIf="isLoading"></i>
                {{ isEditMode ? 'Modifier' : 'Créer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .utilisateurs-container {
      padding: 30px;
      background-color: #f8f9fa;
      min-height: 100vh;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 30px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .header-content h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #2c3e50;
      margin: 0 0 10px 0;
    }

    .header-content p {
      color: #7f8c8d;
      margin: 0;
    }

    .filters-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
    }

    .search-box {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-box i {
      position: absolute;
      left: 15px;
      color: #7f8c8d;
      z-index: 2;
      transition: all 0.3s ease;
    }

    .search-box i.searching {
      color: #3498db;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .search-input {
      padding: 12px 45px 12px 45px;
      border: 2px solid #e9ecef;
      border-radius: 10px;
      font-size: 1rem;
      width: 350px;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
    }

    .search-input:disabled {
      background: #f8f9fa;
      cursor: not-allowed;
    }

    .search-clear-btn {
      position: absolute;
      right: 10px;
      background: none;
      border: none;
      color: #7f8c8d;
      cursor: pointer;
      padding: 5px;
      border-radius: 50%;
      transition: all 0.3s ease;
      z-index: 2;
    }

    .search-clear-btn:hover {
      background: #f8f9fa;
      color: #e74c3c;
    }

    .filter-buttons {
      display: flex;
      gap: 10px;
    }

    .filter-btn {
      padding: 12px 16px;
      border: 2px solid #e9ecef;
      background: white;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.9rem;
    }

    .filter-btn:hover {
      border-color: #3498db;
      color: #3498db;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.15);
    }

    .filter-btn.active {
      background: #3498db;
      border-color: #3498db;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }

    .filter-btn i {
      font-size: 0.8rem;
    }

    .table-container {
      background: white;
      border-radius: 15px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
      overflow: hidden;
    }

    .utilisateurs-table {
      width: 100%;
      border-collapse: collapse;
    }

    .utilisateurs-table th {
      background: #f8f9fa;
      padding: 20px;
      text-align: left;
      font-weight: 600;
      color: #2c3e50;
      border-bottom: 2px solid #e9ecef;
    }

    .utilisateurs-table td {
      padding: 20px;
      border-bottom: 1px solid #f8f9fa;
    }

    .table-row:hover {
      background: #f8f9fa;
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3498db, #2980b9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1rem;
    }

    .user-name {
      font-weight: 600;
      color: #2c3e50;
    }

    .user-phone {
      font-size: 0.9rem;
      color: #7f8c8d;
    }

    .role-badge {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
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
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.8rem;
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

    .action-buttons {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
    }

    .btn-info {
      background: #17a2b8;
      color: white;
    }

    .btn-warning {
      background: #ffc107;
      color: #333;
    }

    .btn-success {
      background: #28a745;
      color: white;
    }

    .btn-danger {
      background: #dc3545;
      color: white;
    }

    .btn-secondary {
      background: #6c757d;
      color: white;
    }

    .btn-sm {
      padding: 6px 10px;
      font-size: 0.8rem;
    }

    .no-data {
      text-align: center;
      padding: 60px 20px;
      color: #7f8c8d;
    }

    .no-data i {
      font-size: 3rem;
      margin-bottom: 20px;
    }

    .info-text {
      font-size: 0.9rem;
      color: #6c757d;
      margin-top: 10px;
    }

    .role-context {
      margin-top: 20px;
      padding: 15px;
      background: linear-gradient(135deg, #e3f2fd, #f3e5f5);
      border-radius: 10px;
      border-left: 4px solid #2196f3;
    }

    .context-message {
      margin: 0;
      font-size: 0.9rem;
      color: #1976d2;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .context-message i {
      color: #2196f3;
    }

    .search-suggestions {
      margin-top: 20px;
      padding: 15px;
      background: linear-gradient(135deg, #fff3cd, #ffeaa7);
      border-radius: 10px;
      border-left: 4px solid #ffc107;
    }

    .suggestion-text {
      margin: 0 0 10px 0;
      font-weight: 600;
      color: #856404;
    }

    .search-suggestions ul {
      margin: 0;
      padding-left: 20px;
      color: #856404;
    }

    .search-suggestions li {
      margin-bottom: 5px;
    }

    .user-context {
      margin-top: 15px;
      padding: 15px;
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border-radius: 10px;
      border-left: 4px solid #3498db;
    }

    .context-info {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.9rem;
      color: #2c3e50;
    }

    .context-info i {
      color: #3498db;
    }

    .role-info {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 8px;
      padding: 8px 12px;
      background: #e3f2fd;
      border-radius: 6px;
      font-size: 0.85rem;
      color: #1976d2;
    }

    .role-info i {
      color: #1976d2;
    }

    .modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
    }

    .modal.show {
      opacity: 1;
      visibility: visible;
    }

    .modal-content {
      background: white;
      border-radius: 20px;
      width: 95%;
      max-width: 800px;
      max-height: 95vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      border: 1px solid #e9ecef;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 30px 40px;
      border-bottom: 2px solid #f8f9fa;
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border-radius: 20px 20px 0 0;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 1.8rem;
      font-weight: 700;
      color: #2c3e50;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .modal-header h2::before {
      content: '👤';
      font-size: 1.5rem;
    }

    .close-btn {
      background: #f8f9fa;
      border: 2px solid #e9ecef;
      font-size: 1.2rem;
      color: #6c757d;
      cursor: pointer;
      padding: 8px;
      border-radius: 50%;
      transition: all 0.3s ease;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .close-btn:hover {
      background: #dc3545;
      border-color: #dc3545;
      color: white;
      transform: scale(1.1);
    }

    .modal-body {
      padding: 40px;
      background: #fafbfc;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 25px;
      margin-bottom: 25px;
    }

    .form-group {
      margin-bottom: 25px;
      position: relative;
    }

    .form-group label {
      display: block;
      margin-bottom: 10px;
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.95rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .form-control {
      width: 100%;
      padding: 15px 20px;
      border: 2px solid #e9ecef;
      border-radius: 12px;
      font-size: 1rem;
      transition: all 0.3s ease;
      background: white;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .form-control:focus {
      outline: none;
      border-color: #3498db;
      box-shadow: 0 0 0 4px rgba(52, 152, 219, 0.15);
      transform: translateY(-1px);
    }

    .form-control.error {
      border-color: #e74c3c;
      box-shadow: 0 0 0 4px rgba(231, 76, 60, 0.15);
    }

    .form-control:disabled {
      background: #f8f9fa;
      color: #6c757d;
      cursor: not-allowed;
    }

    select.form-control option:disabled {
      background: #f8f9fa;
      color: #adb5bd;
      font-style: italic;
    }

    select.form-control option:not(:disabled) {
      background: white;
      color: #2c3e50;
    }

    .error-message {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-top: 8px;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 5px;
    }

    .error-message::before {
      content: '⚠️';
      font-size: 0.8rem;
    }

    .checkbox-group {
      margin-top: 20px;
    }

    .checkbox-wrapper {
      display: flex;
      align-items: center;
      gap: 10px;
      cursor: pointer;
    }

    .checkbox-wrapper input[type="checkbox"] {
      display: none;
    }

    .checkmark {
      width: 20px;
      height: 20px;
      border: 2px solid #bdc3c7;
      border-radius: 4px;
      position: relative;
      transition: all 0.3s ease;
    }

    .checkbox-wrapper input[type="checkbox"]:checked + .checkmark {
      background: #3498db;
      border-color: #3498db;
    }

    .checkbox-wrapper input[type="checkbox"]:checked + .checkmark::after {
      content: '✓';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 12px;
      font-weight: bold;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 20px;
      padding: 30px 40px;
      border-top: 2px solid #f8f9fa;
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      border-radius: 0 0 20px 20px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .utilisateurs-container {
        padding: 15px;
      }

      .page-header {
        flex-direction: column;
        gap: 20px;
        text-align: center;
      }

      .filters-section {
        flex-direction: column;
        gap: 20px;
      }

      .search-input {
        width: 100%;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .utilisateurs-table {
        font-size: 0.9rem;
      }

      .utilisateurs-table th,
      .utilisateurs-table td {
        padding: 15px 10px;
      }
    }
  `]
})
export class UtilisateursComponent implements OnInit, OnDestroy {
  utilisateurs: Utilisateur[] = [];
  filteredUtilisateurs: Utilisateur[] = [];
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  showRecentOnly = false;
  showModal = false;
  isEditMode = false;
  isLoading = false;
  currentUtilisateur: Utilisateur | null = null;
  currentUser: any = null;
  private destroy$ = new Subject<void>();

  utilisateurForm!: FormGroup;

  constructor(
    private utilisateurService: UtilisateurService,
    private jwtAuthService: JwtAuthService,
    private fb: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.jwtAuthService.getCurrentUser();
    console.log('👤 Utilisateur connecté dans ngOnInit:', this.currentUser);
    this.initForm();
    this.loadUtilisateurs();
  }

  private passwordsMatchValidator = (group: FormGroup) => {
    const pass = group.get('motDePasse')?.value;
    const confirm = group.get('confirmPassword')?.value;
    
    // En édition, si aucun mot de passe n'est fourni, pas de validation
    if (this.isEditMode && !pass && !confirm) {
      return null;
    }
    
    // Si on est en création ou si un mot de passe est fourni en édition
    if (!pass || !confirm) {
      return null; // La validation required se charge du reste
    }
    
    return pass === confirm ? null : { passwordMismatch: true };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initForm(): void {
    this.utilisateurForm = this.fb.group({
      prenom: ['', Validators.required],
      nom: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      motDePasse: ['', [Validators.minLength(6)]],
      confirmPassword: [''],
      telephone: [''],
      adresse: [''],
      role: ['', Validators.required],
      actif: [true]
    }, { validators: this.passwordsMatchValidator });
  }

  get prenomControl() { return this.utilisateurForm.get('prenom')!; }
  get nomControl() { return this.utilisateurForm.get('nom')!; }
  get emailControl() { return this.utilisateurForm.get('email')!; }
  get motDePasseControl() { return this.utilisateurForm.get('motDePasse')!; }
  get roleControl() { return this.utilisateurForm.get('role')!; }

  loadUtilisateurs(): void {
    console.log('🔄 Chargement des utilisateurs depuis l\'API...');
    console.log('🔍 URL de l\'API:', 'http://localhost:8089/carthage-creance/api/users');
    console.log('👤 Utilisateur connecté:', this.currentUser);
    this.isLoading = true;

    // Charger les utilisateurs selon le rôle de l'utilisateur connecté
    let usersObservable;
    
    if (this.currentUser) {
      switch (this.currentUser.role) {
        case 'CHEF_DEPARTEMENT_DOSSIER':
          console.log('🔍 Chef de Département Dossier - Chargement des Agents de Dossier uniquement');
          // Charger tous les utilisateurs puis filtrer côté client
          usersObservable = this.utilisateurService.getAllUtilisateurs();
          break;
        case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
          console.log('🔍 Chef Juridique - Chargement des Agents Juridiques uniquement');
          // Charger tous les utilisateurs puis filtrer côté client
          usersObservable = this.utilisateurService.getAllUtilisateurs();
          break;
        case 'SUPER_ADMIN':
        default:
          console.log('🔍 Super Admin - Chargement de tous les utilisateurs');
          usersObservable = this.utilisateurService.getAllUtilisateurs();
          break;
      }
    } else {
      console.log('🔍 Aucun utilisateur connecté - Chargement de tous les utilisateurs');
      usersObservable = this.utilisateurService.getAllUtilisateurs();
    }

    usersObservable
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Utilisateurs chargés depuis l\'API:', response);
          const list = Array.isArray(response) ? response : (response as any)?.content || [];
          console.log('📊 Nombre d\'utilisateurs avant filtrage:', list.length);
          
          // Filtrer les utilisateurs selon le rôle de l'utilisateur connecté
          this.utilisateurs = this.filterUsersByRole(list);
          console.log('📊 Nombre d\'utilisateurs après filtrage:', this.utilisateurs.length);
          console.log('🔍 Utilisateurs filtrés:', this.utilisateurs);
          
          this.filteredUtilisateurs = [...this.utilisateurs];
          this.isLoading = false;
        },
        error: (error) => {
          console.error('❌ Erreur lors du chargement des utilisateurs:', error);
          console.error('🔍 Détails de l\'erreur:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message
          });
          this.isLoading = false;
          this.utilisateurs = []; // Pas de données mock
          this.filteredUtilisateurs = [];
          alert('Erreur lors du chargement des utilisateurs: ' + error.message);
        }
      });
  }

  private filterUsersByRole(users: Utilisateur[]): Utilisateur[] {
    if (!this.currentUser) return users;

    console.log('🔍 Filtrage des utilisateurs pour le rôle:', this.currentUser.role);
    console.log('📋 Utilisateurs à filtrer:', users.map(u => ({ 
      id: u.id, 
      nom: u.nom, 
      role: u.role, 
      roleUtilisateur: u.roleUtilisateur 
    })));

    let filteredUsers: Utilisateur[];

    switch (this.currentUser.role) {
      case 'SUPER_ADMIN':
        // Super admin voit tous les utilisateurs
        filteredUsers = users;
        console.log('✅ Super Admin - Tous les utilisateurs affichés');
        break;
      
      case 'CHEF_DEPARTEMENT_DOSSIER':
        // Chef dossier ne voit que les agents dossier
        filteredUsers = users.filter(user => {
          const userRole = user.roleUtilisateur || user.role; // Utiliser roleUtilisateur en priorité
          return userRole === 'AGENT_DOSSIER' || user.id === this.currentUser?.id;
        });
        console.log('✅ Chef Dossier - Seuls les Agents de Dossier sont affichés');
        break;
      
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        // Chef juridique ne voit que les agents juridique
        filteredUsers = users.filter(user => {
          const userRole = user.roleUtilisateur || user.role; // Utiliser roleUtilisateur en priorité
          return userRole === 'AGENT_JURIDIQUE' || user.id === this.currentUser?.id;
        });
        console.log('✅ Chef Juridique - Seuls les Agents Juridiques sont affichés');
        break;
      
      default:
        // Autres rôles ne voient que leur propre profil
        filteredUsers = users.filter(user => user.id === this.currentUser?.id);
        console.log('✅ Autre rôle - Seul le profil personnel est affiché');
    }

    console.log('📊 Utilisateurs après filtrage:', filteredUsers.map(u => ({ 
      id: u.id, 
      nom: u.nom, 
      role: u.role, 
      roleUtilisateur: u.roleUtilisateur 
    })));
    return filteredUsers;
  }

  onSearch(): void {
    if (this.searchTerm.trim()) {
      this.performSearch();
    } else {
      this.loadUtilisateurs(); // Recharger tous les utilisateurs si la recherche est vide
    }
  }

  private performSearch(): void {
    console.log('🔍 Recherche d\'utilisateurs avec le terme:', this.searchTerm);
    this.isLoading = true;
    
    this.utilisateurService.searchUtilisateurs(this.searchTerm)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Résultats de recherche:', response);
          const list = Array.isArray(response) ? response : (response as any)?.content || [];
          
          // Appliquer le filtrage par rôle après la recherche
          this.utilisateurs = this.filterUsersByRole(list);
          this.filteredUtilisateurs = [...this.utilisateurs];
          this.isLoading = false;
          
          console.log('📊 Utilisateurs après recherche et filtrage:', this.utilisateurs.length);
        },
        error: (error) => {
          console.error('❌ Erreur lors de la recherche:', error);
          this.isLoading = false;
          // En cas d'erreur, recharger tous les utilisateurs
          this.loadUtilisateurs();
        }
      });
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
    this.applyFilters();
  }

  toggleRecentFilter(): void {
    this.showRecentOnly = !this.showRecentOnly;
    this.applyFilters();
  }

  exportUsers(): void {
    console.log('📊 Export des utilisateurs:', this.filteredUtilisateurs);
    
    // Créer un CSV simple
    const headers = ['Nom', 'Prénom', 'Email', 'Rôle', 'Statut', 'Téléphone'];
    const csvContent = [
      headers.join(','),
      ...this.filteredUtilisateurs.map(user => [
        user.nom,
        user.prenom,
        user.email,
        this.getRoleDisplay(this.getUserRole(user)),
        user.actif ? 'Actif' : 'Inactif',
        user.telephone || ''
      ].join(','))
    ].join('\n');

    // Télécharger le fichier
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('✅ Export terminé');
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.loadUtilisateurs(); // Recharger tous les utilisateurs
  }

  applyFilters(): void {
    let filtered = [...this.utilisateurs];

    // Si on a un terme de recherche, utiliser l'API de recherche
    if (this.searchTerm && this.searchTerm.trim()) {
      this.performSearch();
      return; // La recherche API gère déjà le filtrage
    }

    // Filtre par statut (actif/inactif)
    if (this.selectedStatus) {
      filtered = filtered.filter(u => {
        if (this.selectedStatus === 'actif') {
          return u.actif === true;
        } else if (this.selectedStatus === 'inactif') {
          return u.actif === false;
        }
        return true;
      });
    }

    // Filtre par utilisateurs récents (créés dans les 30 derniers jours)
    if (this.showRecentOnly) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      filtered = filtered.filter(u => {
        if (u.dateCreation) {
          const creationDate = new Date(u.dateCreation);
          return creationDate >= thirtyDaysAgo;
        }
        return false;
      });
    }

    this.filteredUtilisateurs = filtered;
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.currentUtilisateur = null;
    this.utilisateurForm.reset();
    this.utilisateurForm.patchValue({ actif: true });
    
    // Sélection automatique du rôle selon l'utilisateur connecté
    if (this.currentUser) {
      let defaultRole = '';
      switch (this.currentUser.role) {
        case 'CHEF_DEPARTEMENT_DOSSIER':
          defaultRole = 'AGENT_DOSSIER';
          break;
        case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
          defaultRole = 'AGENT_JURIDIQUE';
          break;
      }
      if (defaultRole) {
        this.utilisateurForm.patchValue({ role: defaultRole });
        console.log('🎯 Rôle automatiquement sélectionné:', defaultRole);
      }
    }
    
    // mot de passe requis en création
    this.motDePasseControl.setValidators([Validators.required, Validators.minLength(6)]);
    this.motDePasseControl.updateValueAndValidity();
    this.utilisateurForm.get('confirmPassword')?.setValidators([Validators.required]);
    this.utilisateurForm.get('confirmPassword')?.updateValueAndValidity();
    this.showModal = true;
  }

  editUtilisateur(utilisateur: Utilisateur): void {
    this.isEditMode = true;
    this.currentUtilisateur = utilisateur;
    
    // Préparer les données pour le formulaire
    const formData = {
      ...utilisateur,
      role: this.getUserRole(utilisateur) // Utiliser le bon champ de rôle
    };
    
    this.utilisateurForm.patchValue(formData);
    
    // mot de passe optionnel en édition
    this.motDePasseControl.clearValidators();
    this.motDePasseControl.addValidators([Validators.minLength(6)]);
    this.motDePasseControl.updateValueAndValidity();
    this.utilisateurForm.get('confirmPassword')?.clearValidators();
    this.utilisateurForm.get('confirmPassword')?.updateValueAndValidity();
    this.showModal = true;
  }

  viewUtilisateur(utilisateur: Utilisateur): void {
    console.log('👁️ Voir détails utilisateur:', utilisateur);
    // Naviguer vers la page de détails de l'utilisateur
    this.router.navigate(['/admin/utilisateurs', utilisateur.id]);
  }

  closeModal(): void {
    this.showModal = false;
    this.currentUtilisateur = null;
    this.utilisateurForm.reset();
  }

  onSubmit(): void {
    console.log('onSubmit appelé');
    console.log('Formulaire valide:', this.utilisateurForm.valid);
    console.log('Valeurs du formulaire:', this.utilisateurForm.value);
    
    if (this.utilisateurForm.hasError('passwordMismatch')) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }

    if (this.utilisateurForm.valid) {
      this.isLoading = true;
      const formData = this.utilisateurForm.getRawValue();
      console.log('Données à envoyer:', formData);

      if (this.isEditMode && this.currentUtilisateur) {
        console.log('Mode édition - ID:', this.currentUtilisateur.id);
        const updatePayload: any = { ...formData };
        if (updatePayload.role && !updatePayload.roleUtilisateur) {
          updatePayload.roleUtilisateur = updatePayload.role;
          delete updatePayload.role;
        }
        if (!updatePayload.motDePasse) {
          delete updatePayload.motDePasse;
        }
        delete updatePayload.confirmPassword;

        this.utilisateurService.updateUtilisateur(this.currentUtilisateur.id!, updatePayload)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (updatedUtilisateur) => {
              this.isLoading = false;
              this.closeModal();
              console.log('Utilisateur modifié avec succès:', updatedUtilisateur);
              alert('Utilisateur modifié avec succès !');
              this.loadUtilisateurs(); // Recharger la liste
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Erreur lors de la modification:', error);
              alert('Erreur lors de la modification: ' + error.message);
            }
          });
      } else {
        console.log('Mode création');
        
        // Générer un email unique pour éviter les conflits
        if (formData.email && formData.email.includes('@example.com')) {
          formData.email = `test${Date.now()}@example.com`;
          console.log('📧 Email modifié pour éviter les conflits:', formData.email);
        }
        
        // Convertir le format pour le backend
        const backendData = {
          ...formData,
          roleUtilisateur: formData.role, // Convertir 'role' en 'roleUtilisateur'
          motDePasse: formData.motDePasse || 'password123' // Mot de passe par défaut
        };
        delete backendData.role; // Supprimer l'ancien champ 'role'
        
        console.log('📤 Données formatées pour le backend:', backendData);
        
        this.utilisateurService.createUtilisateur(backendData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (newUtilisateur) => {
              this.isLoading = false;
              this.closeModal();
              console.log('Utilisateur créé avec succès:', newUtilisateur);
              alert('Utilisateur créé avec succès !');
              this.loadUtilisateurs(); // Recharger la liste
            },
            error: (error) => {
              this.isLoading = false;
              console.error('Erreur lors de la création:', error);
              alert('Erreur lors de la création: ' + error.message);
            }
          });
      }
    } else {
      console.log('Formulaire invalide');
      this.utilisateurForm.markAllAsTouched();
      alert('Veuillez corriger les erreurs du formulaire');
    }
  }

  toggleStatus(utilisateur: Utilisateur): void {
    this.utilisateurService.toggleUtilisateurStatus(utilisateur.id!, !utilisateur.actif)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedUtilisateur) => {
          console.log('Statut modifié:', updatedUtilisateur);
        },
        error: (error) => {
          console.error('Erreur lors du changement de statut:', error);
        }
      });
  }

  deleteUtilisateur(utilisateur: Utilisateur): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${utilisateur.prenom} ${utilisateur.nom} ?`)) {
      console.log('🗑️ Tentative de suppression de l\'utilisateur:', utilisateur);
      
      this.utilisateurService.deleteUtilisateur(utilisateur.id!)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            console.log('✅ Utilisateur supprimé avec succès');
            alert('Utilisateur supprimé avec succès !');
            this.loadUtilisateurs(); // Recharger la liste
          },
          error: (error) => {
            console.error('❌ Erreur lors de la suppression:', error);
            let errorMessage = 'Erreur lors de la suppression de l\'utilisateur.';
            
            if (error.status === 404) {
              errorMessage = 'Utilisateur non trouvé. Il a peut-être déjà été supprimé.';
            } else if (error.status === 403) {
              errorMessage = 'Vous n\'avez pas les permissions pour supprimer cet utilisateur.';
            } else if (error.status === 500) {
              errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            }
            
            alert(errorMessage);
          }
        });
    }
  }

  getUserRole(utilisateur: Utilisateur): string {
    return utilisateur.roleUtilisateur || utilisateur.role || '';
  }

  getRoleDisplay(role: string | undefined): string {
    const roleMap: { [key: string]: string } = {
      'SUPER_ADMIN': 'Super Admin',
      'CHEF_DEPARTEMENT_DOSSIER': 'Chef Département',
      'AGENT_DOSSIER': 'Agent Dossier',
      'AGENT_JURIDIQUE': 'Agent Juridique',
      'AGENT_FINANCE': 'Agent Finance',
      'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE': 'Chef Juridique'
    };
    if (!role) return 'N/A';
    return roleMap[role] || role;
  }

  canCreateUsers(): boolean {
    if (!this.currentUser) return false;
    const allowedRoles = ['SUPER_ADMIN', 'CHEF_DEPARTEMENT_DOSSIER', 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE'];
    return allowedRoles.includes(this.currentUser.role);
  }

  getAvailableRoles(): any[] {
    if (!this.currentUser) return [];

    const allRoles = [
      { value: 'SUPER_ADMIN', label: 'Super Administrateur', disabled: false },
      { value: 'CHEF_DEPARTEMENT_DOSSIER', label: 'Chef de Département Dossier', disabled: false },
      { value: 'AGENT_DOSSIER', label: 'Agent de Dossier', disabled: false },
      { value: 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE', label: 'Chef Juridique', disabled: false },
      { value: 'AGENT_JURIDIQUE', label: 'Agent Juridique', disabled: false },
      { value: 'AGENT_FINANCE', label: 'Agent Finance', disabled: false }
    ];

    console.log('🔍 Rôle de l\'utilisateur connecté:', this.currentUser.role);

    // Logique de restriction basée sur le rôle de l'utilisateur connecté
    let filteredRoles: any[];
    
    switch (this.currentUser.role) {
      case 'SUPER_ADMIN':
        // Super admin peut créer tous les rôles
        filteredRoles = allRoles;
        break;
      
      case 'CHEF_DEPARTEMENT_DOSSIER':
        // Chef dossier ne peut créer que des agents dossier
        filteredRoles = allRoles.map(role => ({
          ...role,
          disabled: role.value !== 'AGENT_DOSSIER'
        }));
        break;
      
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        // Chef juridique ne peut créer que des agents juridique
        filteredRoles = allRoles.map(role => ({
          ...role,
          disabled: role.value !== 'AGENT_JURIDIQUE'
        }));
        break;
      
      default:
        // Autres rôles ne peuvent pas créer d'utilisateurs
        filteredRoles = allRoles.map(role => ({
          ...role,
          disabled: true
        }));
    }

    console.log('📋 Rôles disponibles après filtrage:', filteredRoles);
    return filteredRoles;
  }

  getRoleRestrictionMessage(): string {
    if (!this.currentUser) return '';

    switch (this.currentUser.role) {
      case 'CHEF_DEPARTEMENT_DOSSIER':
        return 'En tant que Chef de Département Dossier, vous ne pouvez créer que des Agents de Dossier.';
      
      case 'CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE':
        return 'En tant que Chef Juridique, vous ne pouvez créer que des Agents Juridiques.';
      
      case 'SUPER_ADMIN':
        return 'En tant que Super Administrateur, vous pouvez créer tous types d\'utilisateurs.';
      
      default:
        return 'Vous n\'avez pas les permissions pour créer des utilisateurs.';
    }
  }
}
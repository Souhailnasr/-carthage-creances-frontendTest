import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

interface SystemSettings {
  general: {
    appName: string;
    appVersion: string;
    maintenanceMode: boolean;
    maxLoginAttempts: number;
    sessionTimeout: number;
  };
  notifications: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    pushNotifications: boolean;
    notificationEmail: string;
  };
  security: {
    passwordMinLength: number;
    requireSpecialChars: boolean;
    requireNumbers: boolean;
    requireUppercase: boolean;
    twoFactorAuth: boolean;
  };
  backup: {
    autoBackup: boolean;
    backupFrequency: string;
    backupRetention: number;
    backupLocation: string;
  };
}

@Component({
  selector: 'app-parametres',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parametres.component.html',
  styleUrls: ['./parametres.component.scss']
})
export class ParametresComponent implements OnInit {
  settings: SystemSettings = {
    general: {
      appName: 'Carthage Créance',
      appVersion: '1.0.0',
      maintenanceMode: false,
      maxLoginAttempts: 5,
      sessionTimeout: 30
    },
    notifications: {
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      notificationEmail: 'admin@carthage-creance.tn'
    },
    security: {
      passwordMinLength: 8,
      requireSpecialChars: true,
      requireNumbers: true,
      requireUppercase: true,
      twoFactorAuth: false
    },
    backup: {
      autoBackup: true,
      backupFrequency: 'daily',
      backupRetention: 30,
      backupLocation: '/backups'
    }
  };

  activeTab: string = 'general';
  isLoading: boolean = false;
  hasChanges: boolean = false;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.loadSettings();
  }

  loadSettings(): void {
    // Simuler le chargement des paramètres depuis l'API
    this.isLoading = true;
    setTimeout(() => {
      this.isLoading = false;
      this.toastService.success('Paramètres chargés avec succès');
    }, 1000);
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  onSettingChange(): void {
    this.hasChanges = true;
  }

  saveSettings(): void {
    this.isLoading = true;
    
    // Simuler la sauvegarde
    setTimeout(() => {
      this.isLoading = false;
      this.hasChanges = false;
      this.toastService.success('Paramètres sauvegardés avec succès');
    }, 1500);
  }

  resetSettings(): void {
    if (confirm('Êtes-vous sûr de vouloir réinitialiser tous les paramètres ?')) {
      this.loadSettings();
      this.hasChanges = false;
      this.toastService.info('Paramètres réinitialisés');
    }
  }

  exportSettings(): void {
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'parametres-carthage-creance.json';
    link.click();
    URL.revokeObjectURL(url);
    this.toastService.success('Paramètres exportés avec succès');
  }

  importSettings(event: any): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target?.result as string);
          this.settings = { ...this.settings, ...importedSettings };
          this.hasChanges = true;
          this.toastService.success('Paramètres importés avec succès');
        } catch (error) {
          this.toastService.error('Erreur lors de l\'importation du fichier');
        }
      };
      reader.readAsText(file);
    }
  }
}

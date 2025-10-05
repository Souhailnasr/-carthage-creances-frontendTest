import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MockDataService {
  
  // Comptes utilisateurs de test
  getTestUsers() {
    return [
      {
        id: 1,
        nom: 'Ben Ali',
        prenom: 'Ahmed',
        email: 'admin@carthage-creance.tn',
        password: 'admin123',
        role: 'SUPER_ADMIN',
        telephone: '+216 98 123 456',
        adresse: 'Tunis, Tunisie',
        dateCreation: '2024-01-15',
        actif: true,
        departement: 'Administration'
      },
      {
        id: 2,
        nom: 'Trabelsi',
        prenom: 'Fatma',
        email: 'chef@carthage-creance.tn',
        password: 'chef123',
        role: 'CHEF_DEPARTEMENT_DOSSIER',
        telephone: '+216 98 234 567',
        adresse: 'Sfax, Tunisie',
        dateCreation: '2024-01-20',
        actif: true,
        departement: 'Département Dossiers'
      },
      {
        id: 3,
        nom: 'Khelil',
        prenom: 'Mohamed',
        email: 'agent@carthage-creance.tn',
        password: 'agent123',
        role: 'AGENT_DOSSIER',
        telephone: '+216 98 345 678',
        adresse: 'Sousse, Tunisie',
        dateCreation: '2024-02-01',
        actif: true,
        departement: 'Département Dossiers',
        chefId: 2
      },
      {
        id: 4,
        nom: 'Bouazizi',
        prenom: 'Amina',
        email: 'juridique@carthage-creance.tn',
        password: 'juridique123',
        role: 'AGENT_JURIDIQUE',
        telephone: '+216 98 456 789',
        adresse: 'Monastir, Tunisie',
        dateCreation: '2024-02-10',
        actif: true,
        departement: 'Département Juridique'
      },
      {
        id: 5,
        nom: 'Ben Salem',
        prenom: 'Karim',
        email: 'agent2@carthage-creance.tn',
        password: 'agent123',
        role: 'AGENT_DOSSIER',
        telephone: '+216 98 567 890',
        adresse: 'Bizerte, Tunisie',
        dateCreation: '2024-02-15',
        actif: true,
        departement: 'Département Dossiers',
        chefId: 2
      },
      {
        id: 6,
        nom: 'Mansouri',
        prenom: 'Salma',
        email: 'agent3@carthage-creance.tn',
        password: 'agent123',
        role: 'AGENT_DOSSIER',
        telephone: '+216 98 678 901',
        adresse: 'Gabès, Tunisie',
        dateCreation: '2024-03-01',
        actif: true,
        departement: 'Département Dossiers',
        chefId: 2
      }
    ];
  }

  // Créanciers de test
  getTestCreanciers() {
    return [
      {
        id: 1,
        nom: 'Banque Internationale Arabe de Tunisie',
        type: 'BANQUE',
        adresse: 'Avenue Habib Bourguiba, Tunis',
        telephone: '+216 71 123 456',
        email: 'contact@biat.com.tn',
        dateCreation: '2024-01-15',
        actif: true
      },
      {
        id: 2,
        nom: 'Société Tunisienne de Banque',
        type: 'BANQUE',
        adresse: 'Avenue de la République, Tunis',
        telephone: '+216 71 234 567',
        email: 'info@stb.com.tn',
        dateCreation: '2024-01-20',
        actif: true
      },
      {
        id: 3,
        nom: 'Orange Tunisie',
        type: 'TELECOM',
        adresse: 'Les Berges du Lac, Tunis',
        telephone: '+216 71 345 678',
        email: 'contact@orange.tn',
        dateCreation: '2024-02-01',
        actif: true
      },
      {
        id: 4,
        nom: 'Tunisie Télécom',
        type: 'TELECOM',
        adresse: 'Centre Urbain Nord, Tunis',
        telephone: '+216 71 456 789',
        email: 'info@tunisietelecom.tn',
        dateCreation: '2024-02-10',
        actif: true
      }
    ];
  }

  // Débiteurs de test
  getTestDebiteurs() {
    return [
      {
        id: 1,
        nom: 'Ben Salem',
        prenom: 'Ali',
        type: 'PERSONNE_PHYSIQUE',
        cin: '12345678',
        adresse: 'Rue de la République, Tunis',
        telephone: '+216 98 111 222',
        email: 'ali.bensalem@email.com',
        dateCreation: '2024-01-15',
        actif: true
      },
      {
        id: 2,
        nom: 'Entreprise ABC SARL',
        prenom: '',
        type: 'PERSONNE_MORALE',
        cin: '12345678',
        adresse: 'Zone Industrielle, Sfax',
        telephone: '+216 74 333 444',
        email: 'contact@abc-sarl.tn',
        dateCreation: '2024-01-20',
        actif: true
      },
      {
        id: 3,
        nom: 'Trabelsi',
        prenom: 'Fatma',
        type: 'PERSONNE_PHYSIQUE',
        cin: '87654321',
        adresse: 'Avenue Habib Bourguiba, Sousse',
        telephone: '+216 98 555 666',
        email: 'fatma.trabelsi@email.com',
        dateCreation: '2024-02-01',
        actif: true
      },
      {
        id: 4,
        nom: 'Société XYZ SA',
        prenom: '',
        type: 'PERSONNE_MORALE',
        cin: '87654321',
        adresse: 'Centre Urbain Nord, Tunis',
        telephone: '+216 71 777 888',
        email: 'info@xyz-sa.tn',
        dateCreation: '2024-02-10',
        actif: true
      }
    ];
  }

  // Dossiers de test
  getTestDossiers() {
    return [
      {
        id: 1,
        numero: 'DOS-2024-001',
        creancierId: 1,
        debiteurId: 1,
        montant: 15000.00,
        devise: 'TND',
        dateCreation: '2024-01-15',
        statut: 'EN_ATTENTE',
        urgence: 'NORMALE',
        agentCreateurId: 3,
        description: 'Créance bancaire - Prêt immobilier',
        documents: ['Contrat de prêt', 'Relevé de compte'],
        dateEcheance: '2024-06-15'
      },
      {
        id: 2,
        numero: 'DOS-2024-002',
        creancierId: 2,
        debiteurId: 2,
        montant: 25000.00,
        devise: 'TND',
        dateCreation: '2024-01-20',
        statut: 'VALIDE',
        urgence: 'HAUTE',
        agentCreateurId: 3,
        description: 'Créance télécom - Factures impayées',
        documents: ['Factures', 'Relances'],
        dateEcheance: '2024-05-20'
      },
      {
        id: 3,
        numero: 'DOS-2024-003',
        creancierId: 3,
        debiteurId: 3,
        montant: 5000.00,
        devise: 'TND',
        dateCreation: '2024-02-01',
        statut: 'EN_COURS',
        urgence: 'NORMALE',
        agentCreateurId: 3,
        description: 'Créance télécom - Abonnement mobile',
        documents: ['Contrat d\'abonnement', 'Factures'],
        dateEcheance: '2024-08-01'
      },
      {
        id: 4,
        numero: 'DOS-2024-004',
        creancierId: 4,
        debiteurId: 4,
        montant: 30000.00,
        devise: 'TND',
        dateCreation: '2024-02-10',
        statut: 'EN_ATTENTE',
        urgence: 'URGENTE',
        agentCreateurId: 3,
        description: 'Créance télécom - Ligne professionnelle',
        documents: ['Contrat professionnel', 'Factures'],
        dateEcheance: '2024-07-10'
      }
    ];
  }

  // Statistiques de test
  getTestStats() {
    return {
      totalCreanciers: 4,
      totalDebiteurs: 4,
      totalDossiers: 4,
      dossiersEnAttente: 2,
      dossiersValides: 1,
      dossiersEnCours: 1,
      montantTotal: 75000.00,
      montantRecupere: 25000.00,
      tauxRecuperation: 33.33
    };
  }

  // Actions de test
  getTestActions() {
    return [
      {
        id: 1,
        dossierId: 1,
        type: 'RELANCE_TELEPHONE',
        description: 'Relance téléphonique effectuée',
        date: '2024-01-20',
        agentId: 3,
        statut: 'TERMINE'
      },
      {
        id: 2,
        dossierId: 2,
        type: 'ENVOI_LETTRE',
        description: 'Lettre de mise en demeure envoyée',
        date: '2024-01-25',
        agentId: 3,
        statut: 'TERMINE'
      },
      {
        id: 3,
        dossierId: 3,
        type: 'RENDEZ_VOUS',
        description: 'Rendez-vous programmé',
        date: '2024-02-15',
        agentId: 3,
        statut: 'EN_COURS'
      }
    ];
  }

  // Statistiques de performance des agents
  getAgentPerformanceStats() {
    return [
      {
        agentId: 3,
        nom: 'Khelil',
        prenom: 'Mohamed',
        dossiersCrees: 15,
        dossiersValides: 12,
        dossiersEnAttente: 3,
        montantRecupere: 45000.00,
        tauxReussite: 80.0,
        actionsEffectuees: 25,
        moyenneTraitement: 3.2, // jours
        performance: 'EXCELLENTE'
      },
      {
        agentId: 5,
        nom: 'Ben Salem',
        prenom: 'Karim',
        dossiersCrees: 12,
        dossiersValides: 8,
        dossiersEnAttente: 4,
        montantRecupere: 32000.00,
        tauxReussite: 66.7,
        actionsEffectuees: 18,
        moyenneTraitement: 4.1, // jours
        performance: 'BONNE'
      },
      {
        agentId: 6,
        nom: 'Mansouri',
        prenom: 'Salma',
        dossiersCrees: 8,
        dossiersValides: 5,
        dossiersEnAttente: 3,
        montantRecupere: 18000.00,
        tauxReussite: 62.5,
        actionsEffectuees: 12,
        moyenneTraitement: 5.8, // jours
        performance: 'MOYENNE'
      }
    ];
  }

  // Statistiques globales du département
  getDepartmentStats() {
    return {
      totalAgents: 3,
      totalDossiers: 35,
      dossiersValides: 25,
      dossiersEnAttente: 10,
      montantTotal: 95000.00,
      montantRecupere: 95000.00,
      tauxRecuperation: 100.0,
      moyenneTraitement: 4.2,
      objectifMensuel: 100000.00,
      progressionObjectif: 95.0
    };
  }

  // Données pour le dashboard chef
  getChefDashboardData() {
    return {
      departmentStats: this.getDepartmentStats(),
      agentPerformance: this.getAgentPerformanceStats(),
      recentActivity: [
        {
          id: 1,
          type: 'DOSSIER_VALIDE',
          description: 'Dossier DOS-2024-015 validé par Mohamed Khelil',
          date: '2024-10-04T10:30:00',
          agent: 'Mohamed Khelil'
        },
        {
          id: 2,
          type: 'NOUVEAU_DOSSIER',
          description: 'Nouveau dossier créé par Karim Ben Salem',
          date: '2024-10-04T09:15:00',
          agent: 'Karim Ben Salem'
        },
        {
          id: 3,
          type: 'ACTION_EFFECTUEE',
          description: 'Relance effectuée par Salma Mansouri',
          date: '2024-10-04T08:45:00',
          agent: 'Salma Mansouri'
        }
      ],
      alerts: [
        {
          id: 1,
          type: 'URGENT',
          message: '3 dossiers en attente depuis plus de 5 jours',
          count: 3
        },
        {
          id: 2,
          type: 'WARNING',
          message: 'Objectif mensuel à 95% - 5% restant',
          count: 1
        }
      ]
    };
  }
}

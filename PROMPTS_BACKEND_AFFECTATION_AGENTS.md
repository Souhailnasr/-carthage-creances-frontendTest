# 📋 Prompts Backend : Système d'Affectation de Dossiers aux Agents

## 🎯 Vue d'Ensemble

Ce document contient tous les prompts nécessaires pour implémenter le système d'affectation de dossiers aux agents avec des règles de permissions spécifiques selon le rôle (Chef Dossier, Chef Amiable, Chef Juridique).

---

## 📝 PROMPT 1 : Modifications de l'Entité Dossier

### **Objectif**
Ajouter les champs nécessaires pour gérer l'affectation des dossiers aux agents.

### **Fichier à modifier** : `Dossier.java` ou `DossierEntity.java`

```java
// Ajouter ces champs dans l'entité Dossier

/**
 * Agent affecté au dossier (pour le recouvrement amiable)
 */
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "agent_amiable_id")
private User agentAmiable;

/**
 * Agent affecté au dossier (pour le recouvrement juridique)
 */
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "agent_juridique_id")
private User agentJuridique;

/**
 * Agent affecté au dossier (pour la gestion des dossiers)
 */
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "agent_dossier_id")
private User agentDossier;

/**
 * Date d'affectation au dernier agent
 */
@Column(name = "date_affectation_agent")
private LocalDateTime dateAffectationAgent;

/**
 * Statut de l'enquête (si applicable)
 * Valeurs possibles: EN_ATTENTE, EN_COURS, ENVOYEE, VALIDEE, REJETEE
 */
@Enumerated(EnumType.STRING)
@Column(name = "statut_enquete")
private StatutEnquete statutEnquete;

/**
 * Historique des affectations aux agents
 */
@OneToMany(mappedBy = "dossier", cascade = CascadeType.ALL, orphanRemoval = true)
private List<AffectationAgent> historiqueAffectations = new ArrayList<>();
```

### **Créer l'énumération StatutEnquete**

```java
package projet.carthagecreance_backend.Entity;

public enum StatutEnquete {
    EN_ATTENTE,
    EN_COURS,
    ENVOYEE,
    VALIDEE,
    REJETEE
}
```

---

## 📝 PROMPT 2 : Créer l'Entité AffectationAgent

### **Objectif**
Créer une entité pour tracer l'historique des affectations de dossiers aux agents.

### **Fichier à créer** : `AffectationAgent.java`

```java
package projet.carthagecreance_backend.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "affectation_agent")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AffectationAgent {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id", nullable = false)
    private Dossier dossier;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private User agent;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_id", nullable = false)
    private User chef; // Le chef qui a fait l'affectation
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type_affectation", nullable = false)
    private TypeAffectation typeAffectation; // DOSSIER, ENQUETE, ACTIONS_AMIABLES, ACTIONS_JURIDIQUES
    
    @Column(name = "date_affectation", nullable = false)
    private LocalDateTime dateAffectation;
    
    @Column(name = "date_fin_affectation")
    private LocalDateTime dateFinAffectation;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "statut", nullable = false)
    private StatutAffectation statut; // ACTIVE, TERMINEE, ANNULEE
    
    @Column(name = "commentaire", length = 1000)
    private String commentaire;
    
    // Champs pour les permissions spécifiques
    @Column(name = "peut_modifier_actions_chef")
    private Boolean peutModifierActionsChef = false;
    
    @Column(name = "peut_modifier_documents_chef")
    private Boolean peutModifierDocumentsChef = false;
    
    @Column(name = "peut_modifier_audiences_chef")
    private Boolean peutModifierAudiencesChef = false;
}

// Énumération TypeAffectation
public enum TypeAffectation {
    DOSSIER,              // Affectation simple du dossier
    ENQUETE,              // Affectation avec enquête
    ACTIONS_AMIABLES,     // Affectation avec actions amiable
    ACTIONS_JURIDIQUES    // Affectation avec documents/actions/audiences juridiques
}

// Énumération StatutAffectation
public enum StatutAffectation {
    ACTIVE,
    TERMINEE,
    ANNULEE
}
```

---

## 📝 PROMPT 3 : Créer le Repository AffectationAgentRepository

### **Fichier à créer** : `AffectationAgentRepository.java`

```java
package projet.carthagecreance_backend.Repository;

import projet.carthagecreance_backend.Entity.AffectationAgent;
import projet.carthagecreance_backend.Entity.StatutAffectation;
import projet.carthagecreance_backend.Entity.TypeAffectation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AffectationAgentRepository extends JpaRepository<AffectationAgent, Long> {
    
    // Trouver toutes les affectations actives d'un agent
    List<AffectationAgent> findByAgentIdAndStatut(Long agentId, StatutAffectation statut);
    
    // Trouver toutes les affectations actives d'un dossier
    List<AffectationAgent> findByDossierIdAndStatut(Long dossierId, StatutAffectation statut);
    
    // Trouver l'affectation active d'un dossier pour un agent
    Optional<AffectationAgent> findByDossierIdAndAgentIdAndStatut(
        Long dossierId, 
        Long agentId, 
        StatutAffectation statut
    );
    
    // Trouver toutes les affectations d'un chef
    @Query("SELECT a FROM AffectationAgent a WHERE a.chef.id = :chefId ORDER BY a.dateAffectation DESC")
    List<AffectationAgent> findByChefId(@Param("chefId") Long chefId);
    
    // Trouver toutes les affectations d'un type spécifique
    List<AffectationAgent> findByTypeAffectationAndStatut(
        TypeAffectation typeAffectation, 
        StatutAffectation statut
    );
    
    // Compter les affectations actives d'un agent
    long countByAgentIdAndStatut(Long agentId, StatutAffectation statut);
}
```

---

## 📝 PROMPT 4 : Créer le DTO AffectationAgentDTO

### **Fichier à créer** : `AffectationAgentDTO.java`

```java
package projet.carthagecreance_backend.DTO;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import projet.carthagecreance_backend.Entity.StatutAffectation;
import projet.carthagecreance_backend.Entity.TypeAffectation;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AffectationAgentDTO {
    private Long id;
    private Long dossierId;
    private String numeroDossier;
    private Long agentId;
    private String agentNom;
    private String agentPrenom;
    private Long chefId;
    private String chefNom;
    private String chefPrenom;
    private TypeAffectation typeAffectation;
    private LocalDateTime dateAffectation;
    private LocalDateTime dateFinAffectation;
    private StatutAffectation statut;
    private String commentaire;
    private Boolean peutModifierActionsChef;
    private Boolean peutModifierDocumentsChef;
    private Boolean peutModifierAudiencesChef;
}
```

---

## 📝 PROMPT 5 : Créer le Service AffectationAgentService

### **Fichier à créer** : `AffectationAgentService.java` (Interface)

```java
package projet.carthagecreance_backend.Service;

import projet.carthagecreance_backend.DTO.AffectationAgentDTO;
import projet.carthagecreance_backend.Entity.TypeAffectation;

import java.util.List;

public interface AffectationAgentService {
    
    /**
     * Affecter un dossier à un agent (Chef Dossier)
     */
    AffectationAgentDTO affecterDossier(Long dossierId, Long agentId, Long chefId, String commentaire);
    
    /**
     * Affecter un dossier avec enquête à un agent (Chef Dossier)
     */
    AffectationAgentDTO affecterDossierAvecEnquete(Long dossierId, Long agentId, Long chefId, String commentaire);
    
    /**
     * Affecter un dossier avec actions à un agent (Chef Amiable)
     */
    AffectationAgentDTO affecterDossierAvecActions(Long dossierId, Long agentId, Long chefId, String commentaire);
    
    /**
     * Affecter un dossier avec documents/actions/audiences juridiques à un agent (Chef Juridique)
     */
    AffectationAgentDTO affecterDossierAvecJuridique(Long dossierId, Long agentId, Long chefId, String commentaire);
    
    /**
     * Terminer une affectation
     */
    AffectationAgentDTO terminerAffectation(Long affectationId, Long chefId);
    
    /**
     * Obtenir toutes les affectations actives d'un agent
     */
    List<AffectationAgentDTO> getAffectationsActivesAgent(Long agentId);
    
    /**
     * Obtenir toutes les affectations d'un dossier
     */
    List<AffectationAgentDTO> getAffectationsDossier(Long dossierId);
    
    /**
     * Obtenir toutes les affectations créées par un chef
     */
    List<AffectationAgentDTO> getAffectationsChef(Long chefId);
    
    /**
     * Vérifier si un agent peut modifier les actions du chef
     */
    Boolean peutModifierActionsChef(Long dossierId, Long agentId);
    
    /**
     * Vérifier si un agent peut modifier les documents du chef
     */
    Boolean peutModifierDocumentsChef(Long dossierId, Long agentId);
    
    /**
     * Vérifier si un agent peut modifier les audiences du chef
     */
    Boolean peutModifierAudiencesChef(Long dossierId, Long agentId);
    
    /**
     * Valider une enquête envoyée par un agent (Chef Dossier)
     */
    AffectationAgentDTO validerEnquete(Long dossierId, Long chefId, Boolean valide, String commentaire);
}
```

---

## 📝 PROMPT 6 : Implémenter AffectationAgentServiceImpl

### **Fichier à créer** : `AffectationAgentServiceImpl.java`

```java
package projet.carthagecreance_backend.Service.Impl;

import projet.carthagecreance_backend.DTO.AffectationAgentDTO;
import projet.carthagecreance_backend.Entity.*;
import projet.carthagecreance_backend.Repository.*;
import projet.carthagecreance_backend.Service.AffectationAgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class AffectationAgentServiceImpl implements AffectationAgentService {
    
    @Autowired
    private AffectationAgentRepository affectationAgentRepository;
    
    @Autowired
    private DossierRepository dossierRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Override
    public AffectationAgentDTO affecterDossier(Long dossierId, Long agentId, Long chefId, String commentaire) {
        // Vérifier que le chef a le rôle CHEF_DOSSIER
        User chef = userRepository.findById(chefId)
            .orElseThrow(() -> new RuntimeException("Chef non trouvé"));
        
        if (!chef.getRole().getName().equals("CHEF_DOSSIER")) {
            throw new RuntimeException("Seul un chef dossier peut affecter un dossier");
        }
        
        // Vérifier que l'agent a le rôle AGENT_DOSSIER
        User agent = userRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé"));
        
        if (!agent.getRole().getName().equals("AGENT_DOSSIER")) {
            throw new RuntimeException("L'agent doit avoir le rôle AGENT_DOSSIER");
        }
        
        // Terminer les affectations actives précédentes pour ce dossier
        terminerAffectationsActives(dossierId);
        
        // Créer la nouvelle affectation
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));
        
        AffectationAgent affectation = new AffectationAgent();
        affectation.setDossier(dossier);
        affectation.setAgent(agent);
        affectation.setChef(chef);
        affectation.setTypeAffectation(TypeAffectation.DOSSIER);
        affectation.setDateAffectation(LocalDateTime.now());
        affectation.setStatut(StatutAffectation.ACTIVE);
        affectation.setCommentaire(commentaire);
        affectation.setPeutModifierActionsChef(false);
        affectation.setPeutModifierDocumentsChef(false);
        affectation.setPeutModifierAudiencesChef(false);
        
        // Mettre à jour le dossier
        dossier.setAgentDossier(agent);
        dossier.setDateAffectationAgent(LocalDateTime.now());
        
        affectation = affectationAgentRepository.save(affectation);
        dossierRepository.save(dossier);
        
        return convertToDTO(affectation);
    }
    
    @Override
    public AffectationAgentDTO affecterDossierAvecEnquete(Long dossierId, Long agentId, Long chefId, String commentaire) {
        // Même logique que affecterDossier mais avec TypeAffectation.ENQUETE
        // Et initialiser le statut de l'enquête à EN_ATTENTE
        AffectationAgentDTO affectation = affecterDossier(dossierId, agentId, chefId, commentaire);
        
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));
        dossier.setStatutEnquete(StatutEnquete.EN_ATTENTE);
        dossierRepository.save(dossier);
        
        // Mettre à jour le type d'affectation
        AffectationAgent affectationEntity = affectationAgentRepository.findById(affectation.getId())
            .orElseThrow(() -> new RuntimeException("Affectation non trouvée"));
        affectationEntity.setTypeAffectation(TypeAffectation.ENQUETE);
        affectationAgentRepository.save(affectationEntity);
        
        return convertToDTO(affectationEntity);
    }
    
    @Override
    public AffectationAgentDTO affecterDossierAvecActions(Long dossierId, Long agentId, Long chefId, String commentaire) {
        // Vérifier que le chef a le rôle CHEF_AMIABLE
        User chef = userRepository.findById(chefId)
            .orElseThrow(() -> new RuntimeException("Chef non trouvé"));
        
        if (!chef.getRole().getName().equals("CHEF_AMIABLE")) {
            throw new RuntimeException("Seul un chef amiable peut affecter un dossier avec actions");
        }
        
        // Vérifier que l'agent a le rôle AGENT_AMIABLE
        User agent = userRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé"));
        
        if (!agent.getRole().getName().equals("AGENT_AMIABLE")) {
            throw new RuntimeException("L'agent doit avoir le rôle AGENT_AMIABLE");
        }
        
        // Terminer les affectations actives précédentes
        terminerAffectationsActives(dossierId);
        
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));
        
        AffectationAgent affectation = new AffectationAgent();
        affectation.setDossier(dossier);
        affectation.setAgent(agent);
        affectation.setChef(chef);
        affectation.setTypeAffectation(TypeAffectation.ACTIONS_AMIABLES);
        affectation.setDateAffectation(LocalDateTime.now());
        affectation.setStatut(StatutAffectation.ACTIVE);
        affectation.setCommentaire(commentaire);
        // L'agent peut voir mais ne peut pas modifier les actions du chef
        affectation.setPeutModifierActionsChef(false);
        affectation.setPeutModifierDocumentsChef(false);
        affectation.setPeutModifierAudiencesChef(false);
        
        dossier.setAgentAmiable(agent);
        dossier.setDateAffectationAgent(LocalDateTime.now());
        
        affectation = affectationAgentRepository.save(affectation);
        dossierRepository.save(dossier);
        
        return convertToDTO(affectation);
    }
    
    @Override
    public AffectationAgentDTO affecterDossierAvecJuridique(Long dossierId, Long agentId, Long chefId, String commentaire) {
        // Vérifier que le chef a le rôle CHEF_JURIDIQUE
        User chef = userRepository.findById(chefId)
            .orElseThrow(() -> new RuntimeException("Chef non trouvé"));
        
        if (!chef.getRole().getName().equals("CHEF_JURIDIQUE")) {
            throw new RuntimeException("Seul un chef juridique peut affecter un dossier avec actions juridiques");
        }
        
        // Vérifier que l'agent a le rôle AGENT_JURIDIQUE
        User agent = userRepository.findById(agentId)
            .orElseThrow(() -> new RuntimeException("Agent non trouvé"));
        
        if (!agent.getRole().getName().equals("AGENT_JURIDIQUE")) {
            throw new RuntimeException("L'agent doit avoir le rôle AGENT_JURIDIQUE");
        }
        
        // Terminer les affectations actives précédentes
        terminerAffectationsActives(dossierId);
        
        Dossier dossier = dossierRepository.findById(dossierId)
            .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));
        
        AffectationAgent affectation = new AffectationAgent();
        affectation.setDossier(dossier);
        affectation.setAgent(agent);
        affectation.setChef(chef);
        affectation.setTypeAffectation(TypeAffectation.ACTIONS_JURIDIQUES);
        affectation.setDateAffectation(LocalDateTime.now());
        affectation.setStatut(StatutAffectation.ACTIVE);
        affectation.setCommentaire(commentaire);
        // L'agent peut voir mais ne peut pas modifier ce qui a été fait par le chef
        affectation.setPeutModifierActionsChef(false);
        affectation.setPeutModifierDocumentsChef(false);
        affectation.setPeutModifierAudiencesChef(false);
        
        dossier.setAgentJuridique(agent);
        dossier.setDateAffectationAgent(LocalDateTime.now());
        
        affectation = affectationAgentRepository.save(affectation);
        dossierRepository.save(dossier);
        
        return convertToDTO(affectation);
    }
    
    @Override
    public AffectationAgentDTO terminerAffectation(Long affectationId, Long chefId) {
        AffectationAgent affectation = affectationAgentRepository.findById(affectationId)
            .orElseThrow(() -> new RuntimeException("Affectation non trouvée"));
        
        // Vérifier que c'est le chef qui a créé l'affectation
        if (!affectation.getChef().getId().equals(chefId)) {
            throw new RuntimeException("Seul le chef qui a créé l'affectation peut la terminer");
        }
        
        affectation.setStatut(StatutAffectation.TERMINEE);
        affectation.setDateFinAffectation(LocalDateTime.now());
        
        // Réinitialiser l'agent dans le dossier
        Dossier dossier = affectation.getDossier();
        if (affectation.getTypeAffectation() == TypeAffectation.DOSSIER || 
            affectation.getTypeAffectation() == TypeAffectation.ENQUETE) {
            dossier.setAgentDossier(null);
        } else if (affectation.getTypeAffectation() == TypeAffectation.ACTIONS_AMIABLES) {
            dossier.setAgentAmiable(null);
        } else if (affectation.getTypeAffectation() == TypeAffectation.ACTIONS_JURIDIQUES) {
            dossier.setAgentJuridique(null);
        }
        
        affectationAgentRepository.save(affectation);
        dossierRepository.save(dossier);
        
        return convertToDTO(affectation);
    }
    
    @Override
    public AffectationAgentDTO validerEnquete(Long dossierId, Long chefId, Boolean valide, String commentaire) {
        // Trouver l'affectation active avec enquête
        List<AffectationAgent> affectations = affectationAgentRepository
            .findByDossierIdAndStatut(dossierId, StatutAffectation.ACTIVE);
        
        AffectationAgent affectation = affectations.stream()
            .filter(a -> a.getTypeAffectation() == TypeAffectation.ENQUETE)
            .findFirst()
            .orElseThrow(() -> new RuntimeException("Aucune affectation avec enquête active trouvée"));
        
        // Vérifier que c'est le chef qui a créé l'affectation
        if (!affectation.getChef().getId().equals(chefId)) {
            throw new RuntimeException("Seul le chef qui a créé l'affectation peut valider l'enquête");
        }
        
        Dossier dossier = affectation.getDossier();
        if (valide) {
            dossier.setStatutEnquete(StatutEnquete.VALIDEE);
        } else {
            dossier.setStatutEnquete(StatutEnquete.REJETEE);
        }
        
        affectation.setCommentaire(commentaire);
        
        affectationAgentRepository.save(affectation);
        dossierRepository.save(dossier);
        
        return convertToDTO(affectation);
    }
    
    @Override
    public Boolean peutModifierActionsChef(Long dossierId, Long agentId) {
        Optional<AffectationAgent> affectation = affectationAgentRepository
            .findByDossierIdAndAgentIdAndStatut(dossierId, agentId, StatutAffectation.ACTIVE);
        
        return affectation.map(AffectationAgent::getPeutModifierActionsChef).orElse(false);
    }
    
    @Override
    public Boolean peutModifierDocumentsChef(Long dossierId, Long agentId) {
        Optional<AffectationAgent> affectation = affectationAgentRepository
            .findByDossierIdAndAgentIdAndStatut(dossierId, agentId, StatutAffectation.ACTIVE);
        
        return affectation.map(AffectationAgent::getPeutModifierDocumentsChef).orElse(false);
    }
    
    @Override
    public Boolean peutModifierAudiencesChef(Long dossierId, Long agentId) {
        Optional<AffectationAgent> affectation = affectationAgentRepository
            .findByDossierIdAndAgentIdAndStatut(dossierId, agentId, StatutAffectation.ACTIVE);
        
        return affectation.map(AffectationAgent::getPeutModifierAudiencesChef).orElse(false);
    }
    
    @Override
    public List<AffectationAgentDTO> getAffectationsActivesAgent(Long agentId) {
        return affectationAgentRepository
            .findByAgentIdAndStatut(agentId, StatutAffectation.ACTIVE)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<AffectationAgentDTO> getAffectationsDossier(Long dossierId) {
        return affectationAgentRepository
            .findByDossierIdAndStatut(dossierId, StatutAffectation.ACTIVE)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<AffectationAgentDTO> getAffectationsChef(Long chefId) {
        return affectationAgentRepository
            .findByChefId(chefId)
            .stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    // Méthodes privées
    private void terminerAffectationsActives(Long dossierId) {
        List<AffectationAgent> affectationsActives = affectationAgentRepository
            .findByDossierIdAndStatut(dossierId, StatutAffectation.ACTIVE);
        
        for (AffectationAgent affectation : affectationsActives) {
            affectation.setStatut(StatutAffectation.TERMINEE);
            affectation.setDateFinAffectation(LocalDateTime.now());
        }
        
        affectationAgentRepository.saveAll(affectationsActives);
    }
    
    private AffectationAgentDTO convertToDTO(AffectationAgent affectation) {
        AffectationAgentDTO dto = new AffectationAgentDTO();
        dto.setId(affectation.getId());
        dto.setDossierId(affectation.getDossier().getId());
        dto.setNumeroDossier(affectation.getDossier().getNumeroDossier());
        dto.setAgentId(affectation.getAgent().getId());
        dto.setAgentNom(affectation.getAgent().getNom());
        dto.setAgentPrenom(affectation.getAgent().getPrenom());
        dto.setChefId(affectation.getChef().getId());
        dto.setChefNom(affectation.getChef().getNom());
        dto.setChefPrenom(affectation.getChef().getPrenom());
        dto.setTypeAffectation(affectation.getTypeAffectation());
        dto.setDateAffectation(affectation.getDateAffectation());
        dto.setDateFinAffectation(affectation.getDateFinAffectation());
        dto.setStatut(affectation.getStatut());
        dto.setCommentaire(affectation.getCommentaire());
        dto.setPeutModifierActionsChef(affectation.getPeutModifierActionsChef());
        dto.setPeutModifierDocumentsChef(affectation.getPeutModifierDocumentsChef());
        dto.setPeutModifierAudiencesChef(affectation.getPeutModifierAudiencesChef());
        return dto;
    }
}
```

---

## 📝 PROMPT 7 : Créer le Controller AffectationAgentController

### **Fichier à créer** : `AffectationAgentController.java`

```java
package projet.carthagecreance_backend.Controller;

import projet.carthagecreance_backend.DTO.AffectationAgentDTO;
import projet.carthagecreance_backend.Service.AffectationAgentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/affectations")
@CrossOrigin(origins = "*")
public class AffectationAgentController {
    
    @Autowired
    private AffectationAgentService affectationAgentService;
    
    /**
     * POST /api/affectations/dossier
     * Affecter un dossier à un agent (Chef Dossier)
     */
    @PostMapping("/dossier")
    @PreAuthorize("hasRole('CHEF_DOSSIER')")
    public ResponseEntity<AffectationAgentDTO> affecterDossier(
            @RequestParam Long dossierId,
            @RequestParam Long agentId,
            @RequestParam Long chefId,
            @RequestParam(required = false) String commentaire) {
        try {
            AffectationAgentDTO affectation = affectationAgentService
                .affecterDossier(dossierId, agentId, chefId, commentaire);
            return ResponseEntity.ok(affectation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * POST /api/affectations/dossier/enquete
     * Affecter un dossier avec enquête à un agent (Chef Dossier)
     */
    @PostMapping("/dossier/enquete")
    @PreAuthorize("hasRole('CHEF_DOSSIER')")
    public ResponseEntity<AffectationAgentDTO> affecterDossierAvecEnquete(
            @RequestParam Long dossierId,
            @RequestParam Long agentId,
            @RequestParam Long chefId,
            @RequestParam(required = false) String commentaire) {
        try {
            AffectationAgentDTO affectation = affectationAgentService
                .affecterDossierAvecEnquete(dossierId, agentId, chefId, commentaire);
            return ResponseEntity.ok(affectation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * POST /api/affectations/actions-amiable
     * Affecter un dossier avec actions à un agent (Chef Amiable)
     */
    @PostMapping("/actions-amiable")
    @PreAuthorize("hasRole('CHEF_AMIABLE')")
    public ResponseEntity<AffectationAgentDTO> affecterDossierAvecActions(
            @RequestParam Long dossierId,
            @RequestParam Long agentId,
            @RequestParam Long chefId,
            @RequestParam(required = false) String commentaire) {
        try {
            AffectationAgentDTO affectation = affectationAgentService
                .affecterDossierAvecActions(dossierId, agentId, chefId, commentaire);
            return ResponseEntity.ok(affectation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * POST /api/affectations/actions-juridique
     * Affecter un dossier avec documents/actions/audiences juridiques à un agent (Chef Juridique)
     */
    @PostMapping("/actions-juridique")
    @PreAuthorize("hasRole('CHEF_JURIDIQUE')")
    public ResponseEntity<AffectationAgentDTO> affecterDossierAvecJuridique(
            @RequestParam Long dossierId,
            @RequestParam Long agentId,
            @RequestParam Long chefId,
            @RequestParam(required = false) String commentaire) {
        try {
            AffectationAgentDTO affectation = affectationAgentService
                .affecterDossierAvecJuridique(dossierId, agentId, chefId, commentaire);
            return ResponseEntity.ok(affectation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * PUT /api/affectations/{id}/terminer
     * Terminer une affectation
     */
    @PutMapping("/{id}/terminer")
    @PreAuthorize("hasAnyRole('CHEF_DOSSIER', 'CHEF_AMIABLE', 'CHEF_JURIDIQUE')")
    public ResponseEntity<AffectationAgentDTO> terminerAffectation(
            @PathVariable Long id,
            @RequestParam Long chefId) {
        try {
            AffectationAgentDTO affectation = affectationAgentService.terminerAffectation(id, chefId);
            return ResponseEntity.ok(affectation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * PUT /api/affectations/enquete/valider
     * Valider une enquête envoyée par un agent (Chef Dossier)
     */
    @PutMapping("/enquete/valider")
    @PreAuthorize("hasRole('CHEF_DOSSIER')")
    public ResponseEntity<AffectationAgentDTO> validerEnquete(
            @RequestParam Long dossierId,
            @RequestParam Long chefId,
            @RequestParam Boolean valide,
            @RequestParam(required = false) String commentaire) {
        try {
            AffectationAgentDTO affectation = affectationAgentService
                .validerEnquete(dossierId, chefId, valide, commentaire);
            return ResponseEntity.ok(affectation);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * GET /api/affectations/agent/{agentId}
     * Obtenir toutes les affectations actives d'un agent
     */
    @GetMapping("/agent/{agentId}")
    @PreAuthorize("hasAnyRole('AGENT_DOSSIER', 'AGENT_AMIABLE', 'AGENT_JURIDIQUE')")
    public ResponseEntity<List<AffectationAgentDTO>> getAffectationsActivesAgent(
            @PathVariable Long agentId) {
        try {
            List<AffectationAgentDTO> affectations = affectationAgentService
                .getAffectationsActivesAgent(agentId);
            return ResponseEntity.ok(affectations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * GET /api/affectations/dossier/{dossierId}
     * Obtenir toutes les affectations d'un dossier
     */
    @GetMapping("/dossier/{dossierId}")
    @PreAuthorize("hasAnyRole('CHEF_DOSSIER', 'CHEF_AMIABLE', 'CHEF_JURIDIQUE')")
    public ResponseEntity<List<AffectationAgentDTO>> getAffectationsDossier(
            @PathVariable Long dossierId) {
        try {
            List<AffectationAgentDTO> affectations = affectationAgentService
                .getAffectationsDossier(dossierId);
            return ResponseEntity.ok(affectations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * GET /api/affectations/chef/{chefId}
     * Obtenir toutes les affectations créées par un chef
     */
    @GetMapping("/chef/{chefId}")
    @PreAuthorize("hasAnyRole('CHEF_DOSSIER', 'CHEF_AMIABLE', 'CHEF_JURIDIQUE')")
    public ResponseEntity<List<AffectationAgentDTO>> getAffectationsChef(
            @PathVariable Long chefId) {
        try {
            List<AffectationAgentDTO> affectations = affectationAgentService
                .getAffectationsChef(chefId);
            return ResponseEntity.ok(affectations);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
    
    /**
     * GET /api/affectations/permissions
     * Vérifier les permissions d'un agent sur un dossier
     */
    @GetMapping("/permissions")
    public ResponseEntity<Map<String, Boolean>> getPermissions(
            @RequestParam Long dossierId,
            @RequestParam Long agentId) {
        try {
            Map<String, Boolean> permissions = new HashMap<>();
            permissions.put("peutModifierActionsChef", 
                affectationAgentService.peutModifierActionsChef(dossierId, agentId));
            permissions.put("peutModifierDocumentsChef", 
                affectationAgentService.peutModifierDocumentsChef(dossierId, agentId));
            permissions.put("peutModifierAudiencesChef", 
                affectationAgentService.peutModifierAudiencesChef(dossierId, agentId));
            return ResponseEntity.ok(permissions);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
    }
}
```

---

## 📝 PROMPT 8 : Modifier les Services pour Vérifier les Permissions

### **Modifier ActionRecouvrementService**

Ajouter des vérifications dans les méthodes `updateAction` et `deleteAction` :

```java
// Dans ActionRecouvrementServiceImpl

@Override
public ActionRecouvrement updateAction(Long id, ActionRecouvrementDTO dto, Long userId) {
    ActionRecouvrement action = actionRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Action non trouvée"));
    
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    
    // Vérifier si l'utilisateur est un agent
    if (user.getRole().getName().equals("AGENT_AMIABLE")) {
        // Vérifier si l'agent peut modifier cette action
        if (action.getCreateur().getId().equals(userId)) {
            // L'agent peut modifier ses propres actions
        } else {
            // Vérifier si l'agent peut modifier les actions du chef
            Boolean peutModifier = affectationAgentService
                .peutModifierActionsChef(action.getDossier().getId(), userId);
            if (!peutModifier) {
                throw new RuntimeException("Vous n'avez pas la permission de modifier cette action créée par le chef");
            }
        }
    }
    
    // Continuer avec la mise à jour...
}

@Override
public void deleteAction(Long id, Long userId) {
    ActionRecouvrement action = actionRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Action non trouvée"));
    
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("Utilisateur non trouvé"));
    
    // Vérifier si l'utilisateur est un agent
    if (user.getRole().getName().equals("AGENT_AMIABLE")) {
        // Vérifier si l'agent peut supprimer cette action
        if (action.getCreateur().getId().equals(userId)) {
            // L'agent peut supprimer ses propres actions
        } else {
            // Vérifier si l'agent peut modifier les actions du chef
            Boolean peutModifier = affectationAgentService
                .peutModifierActionsChef(action.getDossier().getId(), userId);
            if (!peutModifier) {
                throw new RuntimeException("Vous n'avez pas la permission de supprimer cette action créée par le chef");
            }
        }
    }
    
    // Continuer avec la suppression...
}
```

### **Modifier DocumentHuissierService et ActionHuissierService**

Même logique pour les documents et actions huissier, mais avec `peutModifierDocumentsChef` et `peutModifierAudiencesChef`.

---

## 📝 PROMPT 9 : Créer un Endpoint pour Obtenir les Dossiers d'un Agent

### **Modifier DossierController**

```java
/**
 * GET /api/dossiers/agent/{agentId}
 * Obtenir tous les dossiers affectés à un agent
 */
@GetMapping("/agent/{agentId}")
@PreAuthorize("hasAnyRole('AGENT_DOSSIER', 'AGENT_AMIABLE', 'AGENT_JURIDIQUE')")
public ResponseEntity<Page<DossierDTO>> getDossiersAgent(
        @PathVariable Long agentId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size) {
    try {
        Page<DossierDTO> dossiers = dossierService.getDossiersByAgent(agentId, page, size);
        return ResponseEntity.ok(dossiers);
    } catch (Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
    }
}
```

---

## 📝 PROMPT 10 : Créer un Endpoint pour Obtenir l'Historique des Modifications

### **Créer une entité HistoriqueModification**

```java
@Entity
@Table(name = "historique_modification")
public class HistoriqueModification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dossier_id")
    private Dossier dossier;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "utilisateur_id")
    private User utilisateur;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "type_modification")
    private TypeModification typeModification; // ACTION, DOCUMENT, AUDIENCE, ENQUETE
    
    @Column(name = "entite_id")
    private Long entiteId; // ID de l'action, document, audience, etc.
    
    @Column(name = "action")
    private String action; // CREATED, UPDATED, DELETED
    
    @Column(name = "date_modification")
    private LocalDateTime dateModification;
    
    @Column(name = "details", columnDefinition = "TEXT")
    private String details; // JSON avec les détails de la modification
}
```

### **Créer le Service et Controller pour l'historique**

```java
@GetMapping("/historique/dossier/{dossierId}")
@PreAuthorize("hasAnyRole('CHEF_DOSSIER', 'CHEF_AMIABLE', 'CHEF_JURIDIQUE')")
public ResponseEntity<List<HistoriqueModificationDTO>> getHistoriqueDossier(
        @PathVariable Long dossierId) {
    // Retourner l'historique des modifications faites par les agents
}
```

---

## 📝 PROMPT 11 : Validation pour l'Affectation au Finance

### **Modifier la méthode affecterAuFinance dans DossierService**

```java
@Override
public Dossier affecterAuFinance(Long dossierId, Long userId) {
    Dossier dossier = dossierRepository.findById(dossierId)
        .orElseThrow(() -> new RuntimeException("Dossier non trouvé"));
    
    // Vérifier que le dossier contient toutes les informations nécessaires
    List<String> erreurs = new ArrayList<>();
    
    // Vérifier les actions amiable
    if (dossier.getTypeRecouvrement() == TypeRecouvrement.AMIABLE) {
        List<ActionRecouvrement> actions = actionRecouvrementRepository
            .findByDossierId(dossierId);
        if (actions.isEmpty()) {
            erreurs.add("Le dossier doit contenir au moins une action amiable");
        }
    }
    
    // Vérifier les documents/actions/audiences juridiques
    if (dossier.getTypeRecouvrement() == TypeRecouvrement.JURIDIQUE) {
        List<DocumentHuissier> documents = documentHuissierRepository
            .findByDossierId(dossierId);
        List<ActionHuissier> actions = actionHuissierRepository
            .findByDossierId(dossierId);
        List<Audience> audiences = audienceRepository
            .findByDossierId(dossierId);
        
        if (documents.isEmpty() && actions.isEmpty() && audiences.isEmpty()) {
            erreurs.add("Le dossier juridique doit contenir au moins un document, une action ou une audience");
        }
    }
    
    // Vérifier que l'enquête est validée (si applicable)
    if (dossier.getStatutEnquete() != null && 
        dossier.getStatutEnquete() != StatutEnquete.VALIDEE) {
        erreurs.add("L'enquête doit être validée avant l'affectation au finance");
    }
    
    if (!erreurs.isEmpty()) {
        throw new RuntimeException("Impossible d'affecter au finance: " + String.join(", ", erreurs));
    }
    
    // Affecter au finance
    dossier.setTypeRecouvrement(TypeRecouvrement.FINANCE);
    dossier.setDateAffectationFinance(LocalDateTime.now());
    
    return dossierRepository.save(dossier);
}
```

---

## ✅ Checklist d'Implémentation Backend

- [ ] Créer l'entité `AffectationAgent` avec tous les champs
- [ ] Créer les énumérations `TypeAffectation`, `StatutAffectation`, `StatutEnquete`
- [ ] Créer le repository `AffectationAgentRepository`
- [ ] Créer le DTO `AffectationAgentDTO`
- [ ] Créer le service `AffectationAgentService` et son implémentation
- [ ] Créer le controller `AffectationAgentController` avec tous les endpoints
- [ ] Modifier l'entité `Dossier` pour ajouter les champs d'affectation
- [ ] Modifier `ActionRecouvrementService` pour vérifier les permissions
- [ ] Modifier `DocumentHuissierService` pour vérifier les permissions
- [ ] Modifier `ActionHuissierService` pour vérifier les permissions
- [ ] Modifier `AudienceService` pour vérifier les permissions
- [ ] Créer l'entité `HistoriqueModification` pour tracer les modifications
- [ ] Créer le service et controller pour l'historique
- [ ] Modifier la méthode `affecterAuFinance` pour valider les conditions
- [ ] Ajouter les tests unitaires et d'intégration

---

**Tous les prompts backend nécessaires pour implémenter le système d'affectation ! 🎉**


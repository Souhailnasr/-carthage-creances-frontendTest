# Modifications Backend Nécessaires pour la Finalisation des Dossiers

## Résumé des modifications frontend

Le frontend a été modifié pour permettre la finalisation des dossiers amiable et juridique avec les fonctionnalités suivantes :

1. **Formulaire de finalisation juridique** : 
   - Montant recouvré automatique = montant créance si "Recouvrement Total"
   - Affichage du montant restant au lieu du montant total
   - Champ montant recouvré masqué si "Non Recouvré"
   - Validation dynamique selon l'état final

2. **Formulaire de finalisation amiable** :
   - Même logique que le formulaire juridique
   - Bouton "Finaliser" visible uniquement si recouvrement total (montant restant = 0)
   - Badge "Finalisé" affiché pour les dossiers finalisés
   - Désactivation des actions et affectations pour les dossiers finalisés

3. **Recommandations** :
   - Remplacement de "Passer au Finance" par "Finaliser" si recouvrement total
   - Bouton "Finaliser" activé uniquement si état = RECOVERED_TOTAL

## Modifications backend nécessaires

### 1. Endpoint pour finaliser un dossier amiable

**Endpoint à créer :**
```
PUT /api/dossiers/{dossierId}/amiable/finaliser
```

**Payload :**
```json
{
  "etatFinal": "RECOUVREMENT_TOTAL" | "RECOUVREMENT_PARTIEL" | "NON_RECOUVRE",
  "montantRecouvre": number
}
```

**Réponse :**
```json
{
  "id": number,
  "numeroDossier": string,
  "montantCreance": number,
  "montantRecouvre": number,
  "etatDossier": "RECOVERED_TOTAL" | "RECOVERED_PARTIAL" | "NOT_RECOVERED",
  "dossierStatus": "CLOTURE",
  // ... autres champs du dossier
}
```

**Logique backend :**
- Mettre à jour le `montantRecouvre` du dossier
- Mettre à jour `etatDossier` selon `etatFinal`
- Si `etatFinal = RECOUVREMENT_TOTAL` : `dossierStatus = CLOTURE` et `etatDossier = RECOVERED_TOTAL`
- Si `etatFinal = RECOUVREMENT_PARTIEL` : `etatDossier = RECOVERED_PARTIAL`
- Si `etatFinal = NON_RECOUVRE` : `etatDossier = NOT_RECOVERED`
- Vérifier que le dossier a au moins une action amiable
- Vérifier que le montant recouvré est cohérent avec l'état final

### 2. Champ `etatDossier` dans DossierApi

**Vérification :**
- Le backend doit retourner `etatDossier` dans la réponse `DossierApi`
- Les valeurs possibles : `RECOVERED_TOTAL`, `RECOVERED_PARTIAL`, `NOT_RECOVERED`
- Ce champ doit être mis à jour lors de la finalisation

### 3. Vérification de l'état finalisé

**Méthode frontend :**
```typescript
isDossierFinalise(dossier: DossierApi): boolean {
  return dossier.etatPrediction === 'RECOVERED_TOTAL' || 
         dossier.etatDossier === 'RECOVERED_TOTAL' ||
         (dossier.finance && dossier.finance.montantRecupere >= dossier.montantCreance);
}
```

**Backend doit :**
- Retourner `etatDossier = RECOVERED_TOTAL` si le dossier est finalisé avec recouvrement total
- Retourner `dossierStatus = CLOTURE` si le dossier est finalisé
- S'assurer que `etatDossier` est cohérent avec `montantRecouvre` et `montantCreance`

### 4. Validation des montants

**Règles de validation :**
- Si `etatFinal = RECOUVREMENT_TOTAL` : `montantRecouvre` doit être égal à `montantCreance`
- Si `etatFinal = RECOUVREMENT_PARTIEL` : `montantRecouvre` doit être > 0 et < `montantCreance`
- Si `etatFinal = NON_RECOUVRE` : `montantRecouvre` doit être 0

### 5. Désactivation des actions pour dossiers finalisés

**Frontend :**
- Les dossiers finalisés ne peuvent plus avoir d'actions ajoutées
- Les boutons "Affecter au Juridique" et "Affecter au Finance" sont désactivés
- Le badge "Finalisé" est affiché

**Backend doit :**
- Vérifier que le dossier n'est pas finalisé avant d'autoriser l'ajout d'actions
- Retourner une erreur 400 si on essaie d'ajouter une action à un dossier finalisé
- Retourner une erreur 400 si on essaie d'affecter un dossier finalisé

### 6. Endpoint existant pour finalisation juridique

**Vérification :**
- L'endpoint `PUT /api/dossiers/{dossierId}/juridique/finaliser` existe déjà
- Vérifier qu'il retourne bien `etatDossier` dans la réponse
- Vérifier qu'il met à jour `dossierStatus = CLOTURE` si recouvrement total

## Checklist backend

- [ ] Créer l'endpoint `PUT /api/dossiers/{dossierId}/amiable/finaliser`
- [ ] Vérifier que `etatDossier` est retourné dans toutes les réponses `DossierApi`
- [ ] Implémenter la validation des montants selon l'état final
- [ ] Mettre à jour `dossierStatus` et `etatDossier` lors de la finalisation
- [ ] Vérifier que les actions ne peuvent pas être ajoutées aux dossiers finalisés
- [ ] Vérifier que les affectations ne peuvent pas être faites sur les dossiers finalisés
- [ ] Vérifier que l'endpoint juridique retourne bien `etatDossier`
- [ ] Tester tous les scénarios de finalisation (total, partiel, non recouvré)

## Notes importantes

1. **Cohérence des données** : Le backend doit s'assurer que `etatDossier`, `montantRecouvre`, et `montantCreance` sont cohérents
2. **Sécurité** : Seuls les chefs de département concernés peuvent finaliser les dossiers
3. **Historique** : Considérer l'ajout d'un historique des finalisations
4. **Notifications** : Considérer l'envoi de notifications lors de la finalisation


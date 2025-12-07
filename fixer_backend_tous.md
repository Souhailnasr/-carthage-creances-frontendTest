# Prompts Backend - Correction des Erreurs de Finalisation et Dossiers Archivés

## Analyse des Erreurs

### Erreur 1 : Endpoint de Finalisation Juridique N'existe Pas
**Erreur Backend :**
```
No static resource api/dossiers/4/juridique/finaliser
```

**Analyse :**
- L'endpoint `PUT /api/dossiers/{dossierId}/juridique/finaliser` n'existe pas dans le backend
- Spring essaie de servir cette URL comme une ressource statique au lieu d'un endpoint API
- **C'est une erreur BACKEND uniquement** - le frontend envoie correctement la requête

### Erreur 2 : Montant Recouvré Incorrect
**Problème :**
- Le montant recouvré automatique reçoit 230000 (montant total) au lieu de 149000.05 (montant restant)
- **C'est une erreur FRONTEND** - le calcul dans `setEtatFinal()` utilise peut-être le mauvais montant

### Erreur 3 : Endpoint Dossiers Archivés N'existe Pas
**Erreur Backend :**
```
Failed to load resource: the server responded with a status of 500
GET /api/admin/supervision/dossiers-archives?page=0&size=50
```

**Analyse :**
- L'endpoint `GET /api/admin/supervision/dossiers-archives` n'existe pas dans le backend
- **C'est une erreur BACKEND uniquement** - le frontend appelle correctement l'endpoint

---

## Prompt 1 : Vérifier et Créer l'Endpoint de Finalisation Juridique

```
Vérifier si l'endpoint PUT /api/dossiers/{dossierId}/juridique/finaliser existe dans le backend.

Si l'endpoint n'existe pas, créer un contrôleur ou une méthode dans le DossierController avec les spécifications suivantes :

**Endpoint :**
PUT /api/dossiers/{dossierId}/juridique/finaliser

**Paramètres :**
- Path variable : dossierId (Long)
- Request body :
  {
    "etatFinal": "RECOUVREMENT_TOTAL" | "RECOUVREMENT_PARTIEL" | "NON_RECOUVRE",
    "montantRecouvre": number (BigDecimal)
  }

**Logique :**
1. Récupérer le dossier par ID
2. Vérifier que le dossier existe (retourner 404 si non trouvé)
3. Vérifier que le dossier a au moins une audience (retourner 400 si aucune audience)
4. Récupérer le montant déjà recouvré actuel (depuis finance.montantRecupere ou montantRecouvre)
5. Calculer le montant total recouvré = montant déjà recouvré + montantRecouvre (de la requête)
6. Mettre à jour le montant recouvré total du dossier
7. Mettre à jour l'état du dossier selon etatFinal :
   - Si RECOUVREMENT_TOTAL : dossierStatus = CLOTURE, etatDossier = RECOVERED_TOTAL
   - Si RECOUVREMENT_PARTIEL : etatDossier = RECOVERED_PARTIAL
   - Si NON_RECOUVRE : etatDossier = NOT_RECOVERED
8. Sauvegarder le dossier
9. Retourner le dossier mis à jour avec tous les champs (DossierApi)

**Validations :**
- Si etatFinal = RECOUVREMENT_TOTAL : vérifier que montant total recouvré = montant créance (ou retourner 400)
- Si etatFinal = RECOUVREMENT_PARTIEL : vérifier que montant recouvré > 0 et < montant créance
- Si etatFinal = NON_RECOUVRE : montant recouvré peut être 0 ou le montant restant

**Sécurité :**
- Seuls les utilisateurs avec le rôle CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE peuvent finaliser
- Vérifier l'authentification et l'autorisation

**Réponses HTTP :**
- 200 OK : Dossier finalisé avec succès (retourner DossierApi)
- 400 Bad Request : Validation échouée (détails dans le message d'erreur)
- 404 Not Found : Dossier non trouvé
- 403 Forbidden : Utilisateur non autorisé
- 500 Internal Server Error : Erreur serveur (détails dans le message)
```

---

## Prompt 2 : Créer l'Endpoint de Finalisation Amiable

```
Créer un endpoint pour finaliser un dossier amiable avec les mêmes spécifications que la finalisation juridique.

**Endpoint :**
PUT /api/dossiers/{dossierId}/amiable/finaliser

**Paramètres :**
- Path variable : dossierId (Long)
- Request body :
  {
    "etatFinal": "RECOUVREMENT_TOTAL" | "RECOUVREMENT_PARTIEL" | "NON_RECOUVRE",
    "montantRecouvre": number (BigDecimal)
  }

**Logique :**
1. Récupérer le dossier par ID
2. Vérifier que le dossier existe (retourner 404 si non trouvé)
3. Vérifier que le dossier a au moins une action amiable (retourner 400 si aucune action)
4. Récupérer le montant déjà recouvré actuel (depuis finance.montantRecupere ou montantRecouvre)
5. Calculer le montant total recouvré = montant déjà recouvré + montantRecouvre (de la requête)
6. Mettre à jour le montant recouvré total du dossier
7. Mettre à jour l'état du dossier selon etatFinal :
   - Si RECOUVREMENT_TOTAL : dossierStatus = CLOTURE, etatDossier = RECOVERED_TOTAL
   - Si RECOUVREMENT_PARTIEL : etatDossier = RECOVERED_PARTIAL
   - Si NON_RECOUVRE : etatDossier = NOT_RECOVERED
8. Sauvegarder le dossier
9. Retourner le dossier mis à jour avec tous les champs (DossierApi)

**Validations :**
- Si etatFinal = RECOUVREMENT_TOTAL : vérifier que montant total recouvré = montant créance (ou retourner 400)
- Si etatFinal = RECOUVREMENT_PARTIEL : vérifier que montant recouvré > 0 et < montant créance
- Si etatFinal = NON_RECOUVRE : montant recouvré peut être 0 ou le montant restant

**Sécurité :**
- Seuls les utilisateurs avec le rôle CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE peuvent finaliser
- Vérifier l'authentification et l'autorisation

**Réponses HTTP :**
- 200 OK : Dossier finalisé avec succès (retourner DossierApi)
- 400 Bad Request : Validation échouée (détails dans le message d'erreur)
- 404 Not Found : Dossier non trouvé
- 403 Forbidden : Utilisateur non autorisé
- 500 Internal Server Error : Erreur serveur (détails dans le message)
```

---

## Prompt 3 : Créer l'Endpoint pour les Dossiers Archivés

```
Créer un endpoint pour récupérer les dossiers archivés pour le Super Admin.

**Endpoint :**
GET /api/admin/supervision/dossiers-archives

**Paramètres de requête (optionnels) :**
- page : int (défaut : 0)
- size : int (défaut : 50, max : 100)
- search : String (recherche globale par numéro, créancier, débiteur)

**Logique :**
1. Récupérer tous les dossiers avec dossierStatus = CLOTURE
2. Filtrer les dossiers archivés selon les critères :
   - Dossiers clôturés depuis plus de 1 an OU
   - Dossiers avec une date de clôture définie
3. Appliquer la recherche globale si le paramètre search est fourni
4. Appliquer la pagination
5. Retourner une Page<DossierApi> avec les dossiers archivés

**Sécurité :**
- Seuls les utilisateurs avec le rôle SUPER_ADMIN peuvent accéder à cet endpoint
- Vérifier l'authentification et l'autorisation

**Réponses HTTP :**
- 200 OK : Liste paginée des dossiers archivés (Page<DossierApi>)
- 403 Forbidden : Utilisateur non autorisé
- 500 Internal Server Error : Erreur serveur (détails dans le message)

**Format de réponse :**
{
  "content": [
    {
      "id": number,
      "numeroDossier": string,
      "montantCreance": number,
      "dateCloture": string,
      "dossierStatus": "CLOTURE",
      "creancier": {...},
      "debiteur": {...},
      ...
    }
  ],
  "totalElements": number,
  "totalPages": number,
  "size": number,
  "number": number
}
```

---

## Prompt 4 : Vérifier le Champ etatDossier dans DossierApi

```
Vérifier que le champ etatDossier est retourné dans toutes les réponses DossierApi.

**Vérifications :**
1. Le DTO DossierApi ou DossierResponse doit inclure le champ etatDossier
2. Les valeurs possibles : "RECOVERED_TOTAL", "RECOVERED_PARTIAL", "NOT_RECOVERED"
3. Ce champ doit être mis à jour lors de la finalisation (juridique ou amiable)
4. Ce champ doit être retourné dans :
   - GET /api/dossiers/{id}
   - GET /api/dossiers
   - PUT /api/dossiers/{id}/juridique/finaliser
   - PUT /api/dossiers/{id}/amiable/finaliser
   - Tous les autres endpoints qui retournent DossierApi

**Si le champ n'existe pas :**
- Ajouter etatDossier au DTO DossierApi/DossierResponse
- Mapper ce champ depuis l'entité Dossier vers le DTO
- Mettre à jour ce champ lors de la finalisation
```

---

## Prompt 5 : Corriger le Calcul du Montant Recouvré (Optionnel - Backend)

```
Si le backend doit valider le montant recouvré, vérifier la logique suivante :

**Lors de la finalisation :**
- Le frontend envoie le montant recouvré dans CETTE étape (juridique ou amiable)
- Le backend doit :
  1. Récupérer le montant déjà recouvré avant cette étape
  2. Calculer : montant total recouvré = montant déjà recouvré + montant recouvré (de la requête)
  3. Vérifier que montant total recouvré <= montant créance
  4. Si RECOUVREMENT_TOTAL : vérifier que montant total recouvré = montant créance

**Exemple :**
- Montant créance : 230,000.00 TND
- Montant déjà recouvré (amiable) : 81,000.00 TND
- Montant restant : 149,000.05 TND
- Si finalisation juridique avec RECOUVREMENT_TOTAL :
  - Montant recouvré dans cette étape = 149,000.05 TND
  - Montant total recouvré = 81,000.00 + 149,000.05 = 230,000.05 TND (≈ 230,000.00)
  - Le dossier est marqué comme RECOVERED_TOTAL
```

---

## Résumé des Actions Backend Nécessaires

1. ✅ **Créer PUT /api/dossiers/{dossierId}/juridique/finaliser**
2. ✅ **Créer PUT /api/dossiers/{dossierId}/amiable/finaliser**
3. ✅ **Créer GET /api/admin/supervision/dossiers-archives**
4. ✅ **Vérifier que etatDossier est retourné dans DossierApi**
5. ✅ **Implémenter la logique de calcul du montant recouvré total**

---

## Notes Importantes

- **Erreur Frontend (Montant 230000)** : Le frontend envoie peut-être le montant total au lieu du montant restant. Vérifier le calcul dans `setEtatFinal()` - il devrait utiliser `getMontantRestantActuel()` et non `montantCreance`.
- **Cohérence des données** : Le backend doit s'assurer que `etatDossier`, `montantRecouvre`, et `montantCreance` sont cohérents
- **Sécurité** : Tous les endpoints doivent vérifier l'authentification et l'autorisation par rôle
- **Validation** : Valider les montants selon l'état final sélectionné


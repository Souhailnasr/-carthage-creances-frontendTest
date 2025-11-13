# 🔧 Correction : Validation avec Query Parameters

## ❌ Problème Identifié

L'erreur backend indique :
```
Required request parameter 'chefId' for method parameter type Long is not present
```

**Cause** : Le backend attend `chefId` comme `@RequestParam` (query parameter dans l'URL), mais le frontend essayait d'abord d'envoyer les données dans le body JSON.

## ✅ Solution Implémentée

### Modification du Service `validation-enquete.service.ts`

**Avant** :
- Le service essayait d'abord d'envoyer `chefId` dans le body JSON
- Si erreur 400, fallback vers query params
- Problème : Le backend rejetait avec erreur 500 car il attend directement les query params

**Maintenant** :
- Le service envoie **directement** `chefId` comme query parameter
- Format : `POST /api/validation/enquetes/{id}/valider?chefId={chefId}&commentaire={commentaire}`
- Body : `null` (le backend n'attend pas de body)

### Code Modifié

```typescript
validerEnquete(validationId: number, chefId: number, commentaire?: string): Observable<ValidationEnquete> {
  // Le backend attend chefId comme query parameter (@RequestParam)
  let params = new HttpParams().set('chefId', chefId.toString());
  
  if (commentaire) {
    params = params.set('commentaire', commentaire);
  }
  
  // Envoyer avec query params (body null)
  return this.http.post<ValidationEnquete>(
    `${this.API_URL}/${validationId}/valider`, 
    null, 
    { params }
  );
}
```

## 📋 Format de la Requête

**URL** : `POST /api/validation/enquetes/5/valider?chefId=32&commentaire=...`

**Headers** :
- `Content-Type: application/json`
- `Authorization: Bearer <token>`

**Body** : `null` (vide)

**Query Parameters** :
- `chefId` : ID du chef validateur (obligatoire)
- `commentaire` : Commentaire optionnel

## ✅ Résultat Attendu

Maintenant, la validation devrait fonctionner correctement :
1. Le frontend envoie `chefId` comme query parameter
2. Le backend reçoit `chefId` via `@RequestParam`
3. La validation est effectuée avec succès

## 🔍 Vérifications

Dans la console du navigateur, vous devriez voir :
- `📦 Query params: { chefId: 32, commentaire: '...' }`
- `📦 URL complète: .../api/validation/enquetes/5/valider?chefId=32&commentaire=...`
- Pas d'erreur 500 "Required request parameter 'chefId' ... not present"

---

**Date de correction** : 2025-11-13


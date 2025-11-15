# 🤖 Prompts Cursor AI - Vérification Backend

> 📌 **Note** : Pour les prompts Frontend et l'intégration complète, consultez également [PROMPTS_FRONTEND_CURSOR_AI.md](./PROMPTS_FRONTEND_CURSOR_AI.md)

## 📋 PROMPT 1 : Vérifier l'Existence des Endpoints

```
Dans le projet Spring Boot backend, vérifiez si les endpoints suivants existent dans le contrôleur DossierController (ou équivalent) :

1. GET /api/dossiers/recouvrement-amiable
   - Paramètres : page (int, default 0), size (int, default 10), sort (String, optional)
   - Retourne : Page<Dossier> avec les dossiers affectés au recouvrement amiable

2. GET /api/dossiers/recouvrement-juridique
   - Paramètres : page (int, default 0), size (int, default 10), sort (String, optional)
   - Retourne : Page<Dossier> avec les dossiers affectés au recouvrement juridique

3. PUT /api/dossiers/{id}/affecter/recouvrement-amiable
   - Paramètre path : id (Long)
   - Retourne : Dossier mis à jour

4. PUT /api/dossiers/{id}/affecter/recouvrement-juridique
   - Paramètre path : id (Long)
   - Retourne : Dossier mis à jour

5. PUT /api/dossiers/{id}/cloturer
   - Paramètre path : id (Long)
   - Retourne : Dossier clôturé

6. GET /api/dossiers/valides-disponibles
   - Paramètres : page, size, sort, direction, search (tous optionnels)
   - Retourne : Page<Dossier> avec les dossiers validés et disponibles pour affectation

Pour chaque endpoint :
- Indiquez s'il existe ou non
- Si oui, montrez le code de la méthode
- Si non, indiquez où il devrait être ajouté
- Vérifiez la logique de filtrage/affectation
- Vérifiez la gestion des erreurs (404, 400, 500)
```

---

## 📋 PROMPT 2 : Vérifier la Logique d'Affectation des Dossiers

```
Dans le projet Spring Boot backend, analysez la logique d'affectation des dossiers au recouvrement amiable et juridique.

Pour chaque méthode d'affectation (affecterAuRecouvrementAmiable, affecterAuRecouvrementJuridique) :

1. Vérifiez que :
   - Le dossier existe (retourne 404 si non trouvé)
   - Le dossier est validé (valide = true, statut = VALIDE)
   - Le chef du département correspondant existe
   - Le typeRecouvrement est correctement mis à jour
   - Les règles métier sont respectées (ex: un dossier avec avocat/huissier ne peut pas être affecté à l'amiable)

2. Vérifiez la gestion des erreurs :
   - Dossier non trouvé → 404 avec message clair
   - Dossier non validé → 400 avec message "Seuls les dossiers validés peuvent être affectés"
   - Chef non trouvé → 400 avec message "Aucun chef du département recouvrement [amiable/juridique] trouvé"
   - Erreur serveur → 500 avec message générique

3. Vérifiez que :
   - Le champ typeRecouvrement est mis à jour dans la base de données
   - Les relations avec les chefs/agents sont correctement gérées
   - Les logs sont appropriés pour le débogage

4. Montrez le code complet de chaque méthode avec les annotations Spring appropriées (@PutMapping, @PathVariable, etc.)

5. Indiquez s'il y a des problèmes ou des améliorations à apporter
```

---

## 📋 PROMPT 3 : Vérifier la Logique de Filtrage des Dossiers

```
Dans le projet Spring Boot backend, analysez la logique de filtrage pour récupérer les dossiers par type de recouvrement.

Pour les endpoints GET /api/dossiers/recouvrement-amiable et GET /api/dossiers/recouvrement-juridique :

1. Vérifiez le critère de filtrage :
   - Les dossiers sont filtrés par le champ typeRecouvrement (enum TypeRecouvrement)
   - Pour amiable : typeRecouvrement = AMIABLE
   - Pour juridique : typeRecouvrement = JURIDIQUE

2. Vérifiez les conditions supplémentaires :
   - Les dossiers doivent être validés (valide = true)
   - Les dossiers doivent être en cours (statut = EN_COURS ou dossierStatus = ENCOURSDETRAITEMENT)
   - Les dossiers ne doivent pas être clôturés (dateCloture = null)

3. Vérifiez la pagination :
   - La pagination est correctement implémentée avec Spring Data JPA
   - Les paramètres page, size, sort sont correctement gérés
   - Le tri (sort) fonctionne correctement

4. Vérifiez les performances :
   - Les requêtes sont optimisées (pas de N+1 queries)
   - Les index de base de données sont appropriés
   - La pagination limite le nombre de résultats

5. Montrez le code complet de chaque méthode avec :
   - La requête JPA/Query
   - La gestion des paramètres
   - La gestion des erreurs
   - Les logs appropriés

6. Si les endpoints n'existent pas, proposez une implémentation complète
```

---

## 📋 PROMPT 4 : Implémenter les Endpoints Manquants

```
Dans le projet Spring Boot backend, implémentez les endpoints suivants s'ils n'existent pas :

1. GET /api/dossiers/recouvrement-amiable
   - Utilise Spring Data JPA avec pagination
   - Filtre les dossiers où typeRecouvrement = 'AMIABLE'
   - Retourne Page<Dossier>
   - Gère les paramètres : page, size, sort
   - Gère les erreurs appropriées

2. GET /api/dossiers/recouvrement-juridique
   - Même logique que pour amiable mais avec typeRecouvrement = 'JURIDIQUE'

3. PUT /api/dossiers/{id}/affecter/recouvrement-amiable
   - Vérifie que le dossier existe (404 si non)
   - Vérifie que le dossier est validé (400 si non)
   - Trouve le chef du département recouvrement amiable (400 si non trouvé)
   - Met à jour typeRecouvrement = AMIABLE
   - Sauvegarde et retourne le dossier mis à jour
   - Gère toutes les erreurs avec messages clairs

4. PUT /api/dossiers/{id}/affecter/recouvrement-juridique
   - Même logique que pour amiable mais avec typeRecouvrement = 'JURIDIQUE'

5. PUT /api/dossiers/{id}/cloturer
   - Vérifie que le dossier existe (404 si non)
   - Vérifie que le dossier est validé (400 si non)
   - Met à jour dateCloture = LocalDateTime.now()
   - Met à jour statut = 'CLOTURE'
   - Sauvegarde et retourne le dossier mis à jour

6. GET /api/dossiers/valides-disponibles
   - Filtre les dossiers validés (valide = true, statut = 'VALIDE')
   - Exclut les dossiers déjà affectés (typeRecouvrement != null)
   - Exclut les dossiers clôturés (dateCloture = null)
   - Supporte la pagination, tri et recherche

Pour chaque endpoint :
- Utilisez les annotations Spring appropriées (@GetMapping, @PutMapping, etc.)
- Ajoutez la gestion des erreurs avec @ExceptionHandler ou ResponseEntity
- Ajoutez des logs pour le débogage
- Utilisez des messages d'erreur clairs et en français
- Respectez les conventions REST
```

---

## 📋 PROMPT 5 : Vérifier l'Enum TypeRecouvrement

```
Dans le projet Spring Boot backend, vérifiez si l'enum TypeRecouvrement existe et est correctement utilisé.

1. Cherchez l'enum TypeRecouvrement :
   - Il devrait avoir les valeurs : NON_AFFECTE, AMIABLE, JURIDIQUE
   - Il devrait être utilisé dans l'entité Dossier

2. Vérifiez l'entité Dossier :
   - Le champ typeRecouvrement existe et est de type TypeRecouvrement
   - Le champ est mappé correctement dans la base de données (@Column)
   - Le champ peut être null (pour les dossiers non affectés)

3. Vérifiez les migrations de base de données :
   - La colonne type_recouvrement existe dans la table dossiers
   - Le type de colonne est approprié (VARCHAR, ENUM, etc.)

4. Si l'enum n'existe pas, créez-le avec :
   - Les valeurs NON_AFFECTE, AMIABLE, JURIDIQUE
   - Les annotations JPA appropriées si nécessaire

5. Si le champ n'existe pas dans Dossier, ajoutez-le avec :
   - Le type TypeRecouvrement
   - L'annotation @Column appropriée
   - La possibilité d'être null

6. Montrez le code complet de l'enum et de la modification de l'entité Dossier
```

---

## 📋 PROMPT 6 : Tester les Endpoints avec des Cas d'Usage

```
Dans le projet Spring Boot backend, créez des tests unitaires et d'intégration pour vérifier le bon fonctionnement des endpoints d'affectation.

1. Tests pour GET /api/dossiers/recouvrement-amiable :
   - Test avec des dossiers affectés à l'amiable (doit retourner ces dossiers)
   - Test avec des dossiers non affectés (ne doit pas les retourner)
   - Test avec pagination (page 0, size 10)
   - Test avec tri (sort par dateCreation)
   - Test avec aucun dossier (doit retourner page vide)

2. Tests pour PUT /api/dossiers/{id}/affecter/recouvrement-amiable :
   - Test avec un dossier validé existant (doit réussir)
   - Test avec un dossier non validé (doit retourner 400)
   - Test avec un dossier inexistant (doit retourner 404)
   - Test avec un chef amiable inexistant (doit retourner 400)
   - Test avec un dossier déjà affecté (vérifier le comportement)

3. Tests pour PUT /api/dossiers/{id}/cloturer :
   - Test avec un dossier validé (doit réussir et mettre dateCloture)
   - Test avec un dossier non validé (doit retourner 400)
   - Test avec un dossier inexistant (doit retourner 404)
   - Test avec un dossier déjà clôturé (vérifier le comportement)

4. Utilisez :
   - @SpringBootTest pour les tests d'intégration
   - @MockBean ou @Autowired pour les dépendances
   - AssertJ ou JUnit pour les assertions
   - TestContainers ou H2 pour la base de données de test

5. Montrez le code complet des tests avec :
   - Les annotations appropriées
   - Les données de test (fixtures)
   - Les assertions complètes
   - La gestion des cas d'erreur
```

---

## 📋 PROMPT 7 : Vérifier les Routes et la Configuration Spring

```
Dans le projet Spring Boot backend, vérifiez la configuration des routes pour éviter les conflits.

1. Vérifiez le contrôleur DossierController :
   - Les routes sont correctement définies avec @RequestMapping
   - L'ordre des routes est correct (routes spécifiques avant routes génériques)
   - Exemple de problème : GET /api/dossiers/{id} peut intercepter GET /api/dossiers/recouvrement-amiable

2. Vérifiez l'ordre des méthodes dans le contrôleur :
   - Les routes spécifiques (comme /recouvrement-amiable) doivent être AVANT les routes avec @PathVariable
   - Sinon, Spring peut interpréter "recouvrement-amiable" comme un ID

3. Si vous avez ce problème, réorganisez les méthodes :
   ```java
   // ✅ BON : Route spécifique AVANT route générique
   @GetMapping("/recouvrement-amiable")
   public ResponseEntity<Page<Dossier>> getDossiersAmiable(...) { }
   
   @GetMapping("/{id}")
   public ResponseEntity<Dossier> getDossierById(@PathVariable Long id) { }
   ```

4. Vérifiez la configuration CORS :
   - Les endpoints sont accessibles depuis le frontend (localhost:4200)
   - Les headers Authorization sont autorisés

5. Vérifiez la sécurité :
   - Les endpoints nécessitent une authentification JWT
   - Les rôles appropriés sont vérifiés (si nécessaire)

6. Montrez la configuration complète du contrôleur avec l'ordre correct des routes
```

---

## 📋 PROMPT 8 : Vérifier la Logique Métier d'Affectation

```
Dans le projet Spring Boot backend, analysez en détail la logique métier pour l'affectation des dossiers.

1. Règles métier à vérifier pour affecterAuRecouvrementAmiable :
   - Un dossier avec un avocat ou un huissier ne peut PAS être affecté à l'amiable
   - Un dossier déjà clôturé ne peut pas être affecté
   - Un dossier doit être validé avant d'être affecté
   - Le chef du département recouvrement amiable doit exister et être actif

2. Règles métier à vérifier pour affecterAuRecouvrementJuridique :
   - Un dossier peut être affecté au juridique même s'il a déjà été en amiable
   - Un dossier doit être validé avant d'être affecté
   - Le chef du département recouvrement juridique doit exister et être actif
   - Si un avocat ou huissier est assigné, le dossier est automatiquement juridique

3. Vérifiez les transitions d'état :
   - NON_AFFECTE → AMIABLE (via affecterAuRecouvrementAmiable)
   - NON_AFFECTE → JURIDIQUE (via affecterAuRecouvrementJuridique)
   - AMIABLE → JURIDIQUE (transition possible ?)
   - JURIDIQUE → AMIABLE (transition possible ?)

4. Vérifiez la cohérence des données :
   - Si typeRecouvrement = AMIABLE, alors avocat = null et huissier = null
   - Si typeRecouvrement = JURIDIQUE, alors avocat != null OU huissier != null (ou les deux)
   - Si dateCloture != null, alors le dossier ne peut plus être affecté

5. Montrez le code complet avec :
   - Toutes les validations métier
   - Les messages d'erreur appropriés
   - La gestion des transitions d'état
   - Les logs pour le débogage
```

---

## 📋 PROMPT 9 : Vérifier les Relations et les Entités

```
Dans le projet Spring Boot backend, vérifiez les relations entre les entités pour l'affectation des dossiers.

1. Vérifiez l'entité Dossier :
   - Relation avec Utilisateur (chef du département)
   - Relation avec Avocat (si applicable)
   - Relation avec Huissier (si applicable)
   - Champ typeRecouvrement (TypeRecouvrement enum)
   - Champ dateCloture (LocalDateTime)
   - Champ statut (String ou enum)

2. Vérifiez l'entité Utilisateur :
   - Le champ roleUtilisateur permet d'identifier les chefs
   - Les rôles CHEF_DEPARTEMENT_RECOUVREMENT_AMIABLE et CHEF_DEPARTEMENT_RECOUVREMENT_JURIDIQUE existent

3. Vérifiez les requêtes de recherche :
   - La méthode pour trouver le chef par rôle fonctionne correctement
   - La méthode pour trouver les dossiers par typeRecouvrement fonctionne correctement

4. Vérifiez les cascades et les contraintes :
   - Les relations sont correctement configurées (@ManyToOne, @OneToMany, etc.)
   - Les contraintes de base de données sont appropriées
   - Les suppressions en cascade sont gérées correctement

5. Montrez :
   - Le code complet de l'entité Dossier
   - Les méthodes de repository pour les requêtes
   - Les relations et leurs configurations
```

---

## 📋 PROMPT 10 : Créer un Endpoint de Test Complet

```
Dans le projet Spring Boot backend, créez un endpoint de test complet pour vérifier toute la logique d'affectation.

1. Créez GET /api/dossiers/test-affectation qui :
   - Retourne un rapport complet de l'état du système
   - Liste tous les endpoints d'affectation et leur statut (existe/n'existe pas)
   - Teste chaque endpoint et retourne le résultat
   - Vérifie la présence de l'enum TypeRecouvrement
   - Vérifie la présence du champ typeRecouvrement dans Dossier
   - Vérifie l'existence des chefs de département
   - Retourne des statistiques (nombre de dossiers par typeRecouvrement)

2. Le format de réponse devrait être :
```json
{
  "endpoints": {
    "getRecouvrementAmiable": { "exists": true, "status": "OK" },
    "getRecouvrementJuridique": { "exists": false, "status": "NOT_FOUND" },
    "affecterAmiable": { "exists": true, "status": "OK" },
    "affecterJuridique": { "exists": false, "status": "NOT_FOUND" },
    "cloturer": { "exists": true, "status": "OK" }
  },
  "entities": {
    "typeRecouvrementEnum": { "exists": true },
    "typeRecouvrementField": { "exists": true, "nullable": true }
  },
  "chefs": {
    "chefAmiable": { "exists": true, "count": 1 },
    "chefJuridique": { "exists": true, "count": 1 }
  },
  "statistics": {
    "totalDossiers": 100,
    "dossiersAmiable": 25,
    "dossiersJuridique": 15,
    "dossiersNonAffectes": 60
  }
}
```

3. Cet endpoint devrait être accessible uniquement en développement (profile dev)
   - Utilisez @Profile("dev") ou une condition similaire

4. Montrez le code complet de l'endpoint avec toutes les vérifications
```

---

## 🎯 Utilisation des Prompts

1. **Copiez le prompt** qui correspond à votre besoin
2. **Collez-le dans Cursor AI** dans votre projet backend
3. **Laissez Cursor AI analyser** votre code
4. **Suivez les recommandations** et corrigez les problèmes identifiés

## 📝 Notes Importantes

- Ces prompts sont conçus pour Spring Boot avec JPA/Hibernate
- Adaptez-les selon votre architecture (MongoDB, etc.)
- Les prompts vérifient à la fois l'existence et la logique
- Utilisez les prompts dans l'ordre pour une vérification complète


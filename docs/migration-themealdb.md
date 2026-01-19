# Plan de Migration : Unsplash → TheMealDB

**Objectif** : Remplacer complètement Unsplash par TheMealDB pour les images d'ingrédients

**Avantages TheMealDB** :
- ✅ 100% gratuit (pas de quota, pas de limite)
- ✅ Images normalisées sur fond blanc
- ✅ 600+ ingrédients disponibles
- ✅ Aucune API key requise
- ✅ URLs statiques simples

**Stratégie** : TheMealDB uniquement → Si pas trouvé → Emoji par défaut (🍽️)

---

## 📋 Vue d'ensemble

### Fichiers à modifier
1. `src/services/image.service.ts` - Réécrire la logique de recherche
2. `app.config.js` - Retirer la config Unsplash
3. `.env.local` - Supprimer UNSPLASH_ACCESS_KEY (optionnel)
4. `package.json` - Désinstaller unsplash-js (optionnel, pour réduire bundle)

### Fichiers à vérifier (ne devraient pas nécessiter de modification)
- `src/hooks/useRecipes.ts` - Utilise déjà `ImageService.batchSearchIngredientImages`
- `src/hooks/useGroceryList.ts` - Utilise déjà `ImageService.searchIngredientImage`
- `src/components/recipe/IngredientImageAvatar.tsx` - Composant générique, pas de changement

---

## 🔧 Étape 1 : Modifier `src/services/image.service.ts`

### 1.1 Supprimer les imports Unsplash

**AVANT** (lignes ~12-22):
```typescript
import { createApi } from "unsplash-js";
import Constants from "expo-constants";
import { supabase } from "@/lib/supabase";
import {
  unsplashSearchSchema,
  type UnsplashPhoto,
} from "@/lib/validators";
import type {
  IngredientImageResult,
  IngredientImageOptions,
  ServiceResponse,
} from "@/types/ai";
```

**APRÈS**:
```typescript
import { supabase } from "@/lib/supabase";
import type {
  IngredientImageResult,
  IngredientImageOptions,
  ServiceResponse,
} from "@/types/ai";
```

**Actions** :
- ❌ Supprimer `import { createApi } from "unsplash-js";`
- ❌ Supprimer `import Constants from "expo-constants";`
- ❌ Supprimer `import { unsplashSearchSchema, type UnsplashPhoto } from "@/lib/validators";`

---

### 1.2 Supprimer la config Unsplash

**AVANT** (lignes ~25-41):
```typescript
/**
 * Unsplash API Access Key (loaded from Expo config)
 */
const UNSPLASH_ACCESS_KEY =
  Constants.expoConfig?.extra?.unsplashAccessKey || "";

console.log(
  "🔑 UNSPLASH_ACCESS_KEY loaded:",
  UNSPLASH_ACCESS_KEY ? "✅ YES" : "❌ NO"
);

/**
 * Unsplash API client
 */
const unsplash = createApi({
  accessKey: UNSPLASH_ACCESS_KEY,
});
```

**APRÈS**:
```typescript
/**
 * TheMealDB base URL for ingredient images
 * Format: https://www.themealdb.com/images/ingredients/{Name}.png
 */
const THEMEALDB_IMAGE_BASE_URL =
  "https://www.themealdb.com/images/ingredients";
```

**Actions** :
- ❌ Supprimer toute la section UNSPLASH_ACCESS_KEY
- ❌ Supprimer la création du client Unsplash
- ✅ Ajouter la constante THEMEALDB_IMAGE_BASE_URL

---

### 1.3 Réécrire la méthode `searchIngredientImage()`

**AVANT** (lignes ~61-133):
```typescript
static async searchIngredientImage(
  options: IngredientImageOptions
): Promise<IngredientImageResult> {
  const { ingredientName, size = "regular", language = "fr" } = options;

  try {
    // Check if Unsplash API key is configured
    if (!UNSPLASH_ACCESS_KEY) {
      return {
        success: false,
        error: "Unsplash API key not configured",
      };
    }

    // Build search query
    const searchQuery =
      language === "fr"
        ? `${ingredientName} aliment`
        : `${ingredientName} food`;

    // Search Unsplash
    const response = await unsplash.search.getPhotos({
      query: searchQuery,
      page: 1,
      perPage: 5,
      orientation: "squarish",
    });

    // [... validation logic ...]

    return {
      success: true,
      imageUrl,
      source: "unsplash",
      attribution: { ... },
    };
  } catch (error) {
    return {
      success: false,
      error: ...,
    };
  }
}
```

**APRÈS**:
```typescript
/**
 * Search for an ingredient image on TheMealDB
 *
 * @param options - Image search options
 * @returns Promise resolving to image result
 *
 * @example
 * ```typescript
 * const result = await ImageService.searchIngredientImage({
 *   ingredientName: "tomate"
 * });
 *
 * if (result.success) {
 *   console.log("Image URL:", result.imageUrl);
 * }
 * ```
 */
static async searchIngredientImage(
  options: IngredientImageOptions
): Promise<IngredientImageResult> {
  const { ingredientName } = options;

  try {
    // Normalize ingredient name for TheMealDB
    // Examples: "tomate" → "Tomato", "chicken breast" → "Chicken Breast"
    const normalizedName = this.normalizeIngredientName(ingredientName);

    // Build TheMealDB image URL
    const imageUrl = `${THEMEALDB_IMAGE_BASE_URL}/${encodeURIComponent(normalizedName)}.png`;

    // Check if image exists by trying to fetch it
    const response = await fetch(imageUrl, { method: "HEAD" });

    if (!response.ok) {
      // Image not found on TheMealDB
      return {
        success: false,
        error: `No image found for "${ingredientName}" on TheMealDB`,
      };
    }

    // Image found!
    return {
      success: true,
      imageUrl,
      source: "themealdb",
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? `Image search failed: ${error.message}`
          : "Image search failed",
    };
  }
}
```

**Actions** :
- ❌ Supprimer toute la logique Unsplash (API key check, search query, photo validation)
- ✅ Ajouter normalisation du nom d'ingrédient
- ✅ Construire l'URL TheMealDB statique
- ✅ Vérifier l'existence de l'image avec `fetch HEAD`
- ✅ Retourner `source: "themealdb"` au lieu de `"unsplash"`
- ❌ Supprimer l'objet `attribution` (pas nécessaire pour TheMealDB)

---

### 1.4 Modifier la méthode `batchSearchIngredientImages()`

**AVANT** (lignes ~149-169):
```typescript
static async batchSearchIngredientImages(
  ingredientNames: string[]
): Promise<Record<string, string>> {
  const imageMap: Record<string, string> = {};

  for (const name of ingredientNames) {
    const result = await this.searchIngredientImage({
      ingredientName: name,
    });

    if (result.success && result.imageUrl) {
      imageMap[name] = result.imageUrl;
    }

    // Rate limit: Unsplash free tier allows 50 requests/hour
    // Add small delay between requests
    await this.delay(100);
  }

  return imageMap;
}
```

**APRÈS**:
```typescript
static async batchSearchIngredientImages(
  ingredientNames: string[]
): Promise<Record<string, string>> {
  const imageMap: Record<string, string> = {};

  for (const name of ingredientNames) {
    const result = await this.searchIngredientImage({
      ingredientName: name,
    });

    if (result.success && result.imageUrl) {
      imageMap[name] = result.imageUrl;
    }

    // Small delay to avoid overwhelming the server
    await this.delay(50);
  }

  return imageMap;
}
```

**Actions** :
- ✅ Modifier le commentaire (pas de rate limit TheMealDB)
- ✅ Réduire le délai de 100ms → 50ms (TheMealDB plus rapide)

---

### 1.5 Ajouter la méthode `normalizeIngredientName()`

**Nouvelle méthode privée** (à ajouter après `batchSearchIngredientImages`):

```typescript
/**
 * Normalize ingredient name for TheMealDB
 *
 * Converts ingredient names to TheMealDB format:
 * - Capitalizes first letter of each word
 * - Handles basic French→English mapping
 *
 * @param name - Raw ingredient name
 * @returns Normalized name for TheMealDB
 *
 * @example
 * ```typescript
 * normalizeIngredientName("tomate")        → "Tomato"
 * normalizeIngredientName("chicken breast") → "Chicken Breast"
 * normalizeIngredientName("oignon")        → "Onion"
 * ```
 */
private static normalizeIngredientName(name: string): string {
  // Basic French→English mapping for common ingredients
  const frenchToEnglish: Record<string, string> = {
    // Vegetables
    tomate: "Tomato",
    tomates: "Tomato",
    oignon: "Onion",
    oignons: "Onion",
    ail: "Garlic",
    carotte: "Carrot",
    carottes: "Carrot",
    pomme: "Apple",
    pommes: "Apple",
    "pomme de terre": "Potato",
    "pommes de terre": "Potato",
    courgette: "Zucchini",
    courgettes: "Zucchini",
    aubergine: "Eggplant",
    aubergines: "Eggplant",
    poivron: "Bell Pepper",
    poivrons: "Bell Pepper",
    champignon: "Mushroom",
    champignons: "Mushroom",
    épinard: "Spinach",
    épinards: "Spinach",
    salade: "Lettuce",
    laitue: "Lettuce",
    concombre: "Cucumber",
    brocoli: "Broccoli",
    chou: "Cabbage",
    "chou-fleur": "Cauliflower",
    haricot: "Bean",
    haricots: "Bean",
    "haricots verts": "Green Beans",
    pois: "Peas",
    "petits pois": "Peas",
    radis: "Radish",
    navet: "Turnip",
    betterave: "Beetroot",
    céleri: "Celery",
    poireau: "Leek",
    poireaux: "Leek",

    // Meats
    poulet: "Chicken",
    boeuf: "Beef",
    porc: "Pork",
    agneau: "Lamb",
    veau: "Veal",
    bacon: "Bacon",
    jambon: "Ham",
    saucisse: "Sausage",
    saucisses: "Sausage",
    "blanc de poulet": "Chicken Breast",
    "blancs de poulet": "Chicken Breast",
    "cuisse de poulet": "Chicken Thighs",
    "cuisses de poulet": "Chicken Thighs",
    dinde: "Turkey",
    canard: "Duck",

    // Seafood
    saumon: "Salmon",
    thon: "Tuna",
    crevette: "Shrimp",
    crevettes: "Shrimp",
    moule: "Mussel",
    moules: "Mussel",
    calamar: "Squid",
    poulpe: "Octopus",
    cabillaud: "Cod",
    truite: "Trout",
    anchois: "Anchovy",
    sardine: "Sardine",

    // Dairy
    lait: "Milk",
    beurre: "Butter",
    fromage: "Cheese",
    crème: "Cream",
    "crème fraîche": "Cream",
    yaourt: "Yogurt",
    "fromage blanc": "Cottage Cheese",
    parmesan: "Parmesan",
    mozzarella: "Mozzarella",
    gruyère: "Gruyere",

    // Grains & Pasta
    riz: "Rice",
    pâte: "Pasta",
    pâtes: "Pasta",
    farine: "Flour",
    pain: "Bread",
    spaghetti: "Spaghetti",
    macaroni: "Macaroni",
    quinoa: "Quinoa",
    boulgour: "Bulgur",
    couscous: "Couscous",

    // Herbs & Spices
    basilic: "Basil",
    persil: "Parsley",
    thym: "Thyme",
    romarin: "Rosemary",
    origan: "Oregano",
    coriandre: "Cilantro",
    menthe: "Mint",
    laurier: "Bay Leaf",
    "feuille de laurier": "Bay Leaf",
    sel: "Salt",
    poivre: "Pepper",
    paprika: "Paprika",
    cumin: "Cumin",
    curry: "Curry Powder",
    cannelle: "Cinnamon",
    muscade: "Nutmeg",
    gingembre: "Ginger",
    piment: "Chili",

    // Fruits
    citron: "Lemon",
    orange: "Orange",
    banane: "Banana",
    fraise: "Strawberry",
    fraises: "Strawberry",
    framboise: "Raspberry",
    framboises: "Raspberry",
    myrtille: "Blueberry",
    myrtilles: "Blueberry",
    pêche: "Peach",
    abricot: "Apricot",
    prune: "Plum",
    raisin: "Grapes",
    ananas: "Pineapple",
    mangue: "Mango",
    avocat: "Avocado",

    // Nuts & Seeds
    amande: "Almond",
    amandes: "Almond",
    noix: "Walnut",
    noisette: "Hazelnut",
    noisettes: "Hazelnut",
    pistache: "Pistachio",
    cacahuète: "Peanut",
    cacahuètes: "Peanut",

    // Others
    oeuf: "Egg",
    oeufs: "Egg",
    sucre: "Sugar",
    huile: "Oil",
    "huile d'olive": "Olive Oil",
    vinaigre: "Vinegar",
    moutarde: "Mustard",
    miel: "Honey",
    chocolat: "Chocolate",
    "chocolat noir": "Dark Chocolate",
    tofu: "Tofu",
    "pâte feuilletée": "Puff Pastry",
    "pâte brisée": "Shortcrust Pastry",
  };

  // Normalize to lowercase for lookup
  const lowerName = name.toLowerCase().trim();

  // Check if we have a French→English mapping
  if (frenchToEnglish[lowerName]) {
    return frenchToEnglish[lowerName];
  }

  // Fallback: capitalize first letter of each word (for English ingredients)
  return name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
```

**Actions** :
- ✅ Créer le dictionnaire FR→EN avec 100+ ingrédients
- ✅ Organiser par catégories (légumes, viandes, produits laitiers, etc.)
- ✅ Gérer singulier/pluriel (tomate/tomates → Tomato)
- ✅ Fallback: capitalisation automatique pour ingrédients anglais

---

### 1.6 Supprimer les méthodes Unsplash inutiles

**À SUPPRIMER** :

```typescript
/**
 * Get photo URL for specified size
 */
private static getPhotoUrl(
  photo: UnsplashPhoto,
  size: "thumb" | "small" | "regular" | "full"
): string {
  return photo.urls[size];
}

/**
 * Track download (required by Unsplash API guidelines)
 */
private static async trackUnsplashDownload(photoId: string): Promise<void> {
  try {
    await unsplash.photos.trackDownload({ downloadLocation: photoId });
  } catch (error) {
    console.error("Failed to track Unsplash download:", error);
  }
}
```

**Actions** :
- ❌ Supprimer `getPhotoUrl()` (plus utilisée)
- ❌ Supprimer `trackUnsplashDownload()` (spécifique Unsplash)

---

### 1.7 Mettre à jour les commentaires JSDoc

**AVANT** (ligne ~1):
```typescript
/**
 * Image Service
 *
 * Handles image search and storage for ingredients and recipes:
 * 1. Search Unsplash for high-quality ingredient photos
 * 2. Upload and store images in Supabase Storage
 * 3. Generate image URLs for database storage
 *
 * @module services/image
 */
```

**APRÈS**:
```typescript
/**
 * Image Service
 *
 * Handles image search and storage for ingredients and recipes:
 * 1. Search TheMealDB for normalized ingredient photos (white background)
 * 2. Upload and store images in Supabase Storage
 * 3. Generate image URLs for database storage
 *
 * @module services/image
 */
```

**Actions** :
- ✅ Remplacer "Unsplash" par "TheMealDB"
- ✅ Ajouter "(white background)" pour clarifier

---

## 🔧 Étape 2 : Modifier `app.config.js`

### 2.1 Supprimer la config Unsplash

**AVANT**:
```javascript
module.exports = {
  expo: {
    name: "Paprika",
    slug: "paprika",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "paprika",
    newArchEnabled: true,
    extra: {
      unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY,
    },
    splash: {
      // ...
    },
  },
};
```

**APRÈS**:
```javascript
module.exports = {
  expo: {
    name: "Paprika",
    slug: "paprika",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    scheme: "paprika",
    newArchEnabled: true,
    splash: {
      // ...
    },
  },
};
```

**Actions** :
- ❌ Supprimer la section `extra` complète

---

## 🔧 Étape 3 : Nettoyer `.env.local` (Optionnel)

**Fichier** : `.env.local`

**AVANT**:
```
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
UNSPLASH_ACCESS_KEY=...
ANTHROPIC_API_KEY=...
```

**APRÈS**:
```
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
ANTHROPIC_API_KEY=...
```

**Actions** :
- ❌ Supprimer la ligne `UNSPLASH_ACCESS_KEY=...` (ou la commenter)

**Note** : Cette étape est optionnelle car la variable n'est plus utilisée nulle part.

---

## 🔧 Étape 4 : Désinstaller `unsplash-js` (Optionnel)

**Objectif** : Réduire la taille du bundle en supprimant la dépendance inutilisée.

**Commande** :
```bash
npm uninstall unsplash-js
```

**Vérification** :
```bash
npm list unsplash-js
# Devrait afficher: (empty)
```

**Note** : Cette étape est optionnelle mais recommandée pour réduire la taille de l'app (~50KB).

---

## 🔧 Étape 5 : Redémarrer Expo

**Commande** :
```bash
npm start -- --clear
```

**Pourquoi `--clear` ?**
- Efface le cache Metro Bundler
- Force le rechargement complet du code
- Garantit que les changements sont pris en compte

---

## ✅ Étape 6 : Tests de Vérification

### Test 1 : Vérifier qu'il n'y a pas d'erreur au démarrage

**Méthode** :
1. Lancer l'app dans le simulateur/émulateur
2. Regarder les logs de la console
3. Vérifier qu'il n'y a pas d'erreur de type:
   - `unsplash is not defined`
   - `Constants is not defined`
   - `UNSPLASH_ACCESS_KEY is not configured`

**Résultat attendu** :
- ✅ Aucune erreur dans la console
- ✅ L'app démarre normalement

---

### Test 2 : Importer une recette et vérifier les images

**Étapes** :
1. Aller dans l'app → Importer une recette
2. Choisir une recette avec des ingrédients courants (ex: https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx)
3. Observer les logs console pendant l'import

**Logs attendus** :
```
🔍 Searching images for 4 ingredients...
✅ Found X ingredient images
```

**Résultat attendu** :
- Ingrédients courants (tomate, oignon, poulet, etc.) → Images TheMealDB
- Ingrédients rares → Emoji 🍽️ par défaut
- Aucun appel à Unsplash

---

### Test 3 : Vérifier l'affichage des images dans la fiche recette

**Étapes** :
1. Ouvrir la recette importée
2. Vérifier les images d'ingrédients

**Résultat attendu** :
- ✅ Images circulaires 48x48px
- ✅ Photos sur fond blanc (TheMealDB)
- ✅ Pas d'images artistiques/colorées (Unsplash)
- ✅ Emoji 🍽️ uniquement pour ingrédients non trouvés

**Exemples d'URLs attendues** :
```
https://www.themealdb.com/images/ingredients/Tomato.png
https://www.themealdb.com/images/ingredients/Onion.png
https://www.themealdb.com/images/ingredients/Chicken.png
https://www.themealdb.com/images/ingredients/Garlic.png
```

---

### Test 4 : Tester avec la liste de courses

**Étapes** :
1. Créer une liste de courses
2. Ajouter manuellement un item (ex: "Tomate")
3. Vérifier qu'une image s'affiche

**Résultat attendu** :
- ✅ Image TheMealDB pour ingrédients courants
- ✅ Emoji de catégorie pour ingrédients non trouvés

---

### Test 5 : Tester des ingrédients français

**Ingrédients à tester** :

| Ingrédient FR     | Traduction attendue | URL attendue                                                      |
|-------------------|---------------------|-------------------------------------------------------------------|
| tomate            | Tomato              | https://www.themealdb.com/images/ingredients/Tomato.png           |
| oignon            | Onion               | https://www.themealdb.com/images/ingredients/Onion.png            |
| poulet            | Chicken             | https://www.themealdb.com/images/ingredients/Chicken.png          |
| ail               | Garlic              | https://www.themealdb.com/images/ingredients/Garlic.png           |
| pomme de terre    | Potato              | https://www.themealdb.com/images/ingredients/Potato.png           |
| fromage           | Cheese              | https://www.themealdb.com/images/ingredients/Cheese.png           |

**Méthode** :
1. Importer une recette contenant ces ingrédients
2. Vérifier que les images s'affichent correctement

---

## 🐛 Dépannage

### Problème : Erreur "unsplash is not defined"

**Cause** : Ancienne version du code en cache

**Solutions** :
1. Redémarrer Expo avec `npm start -- --clear`
2. Vider le cache Metro manuellement: `npx expo start -c`
3. Redémarrer l'émulateur/simulateur

---

### Problème : Toutes les images affichent 🍽️

**Cause** : Les requêtes TheMealDB échouent

**Solutions** :
1. Vérifier la connexion Internet du simulateur/émulateur
2. Tester une URL manuellement dans le navigateur:
   ```
   https://www.themealdb.com/images/ingredients/Tomato.png
   ```
3. Ajouter des logs de debug dans `searchIngredientImage()`:
   ```typescript
   console.log("🔍 Searching TheMealDB:", normalizedName);
   console.log("📦 URL:", imageUrl);
   console.log("✅ Response status:", response.status);
   ```

---

### Problème : Certains ingrédients français ne sont pas trouvés

**Cause** : Ingrédient manquant dans le dictionnaire FR→EN

**Solutions** :
1. Identifier l'ingrédient manquant dans les logs
2. Ajouter la traduction dans `normalizeIngredientName()`:
   ```typescript
   const frenchToEnglish: Record<string, string> = {
     // ...
     "nouvel ingredient": "New Ingredient",
   };
   ```
3. Redémarrer l'app

**Liste des ingrédients manquants potentiels** :
- Ajouter au fur et à mesure selon les besoins
- Proposer une mise à jour du dictionnaire si nécessaire

---

### Problème : Images ne s'affichent pas sur iOS mais OK sur Android

**Cause** : Problème de cache iOS

**Solutions** :
1. Nettoyer le cache de l'app iOS: Menu → "Erase All Content and Settings"
2. Rebuild l'app: `npx expo run:ios`
3. Vérifier les permissions réseau dans Info.plist (normalement OK)

---

## 📊 Critères de Succès

La migration est **réussie** si :

- ✅ Aucune référence à Unsplash dans le code
- ✅ Aucune erreur console liée à Unsplash
- ✅ Les images d'ingrédients courants s'affichent (TheMealDB)
- ✅ Les images ont un fond blanc uniforme
- ✅ Les ingrédients non trouvés affichent l'emoji 🍽️
- ✅ Import de recette fonctionne normalement
- ✅ Liste de courses fonctionne normalement
- ✅ Pas de dégradation de performance

---

## 🎯 Résumé des Modifications

| Fichier                         | Action                               | Lignes modifiées |
|---------------------------------|--------------------------------------|------------------|
| `src/services/image.service.ts` | Réécriture complète                  | ~150 lignes      |
| `app.config.js`                 | Suppression section `extra`          | ~3 lignes        |
| `.env.local`                    | Suppression UNSPLASH_ACCESS_KEY      | 1 ligne          |
| `package.json`                  | Désinstallation unsplash-js          | 1 dépendance     |

**Total** : ~155 lignes modifiées, -1 dépendance

---

## 📈 Améliorations Futures (Hors Scope)

### Phase 2 : Cache PostgreSQL

Une fois la migration TheMealDB stabilisée, on pourra implémenter le système de cache pour:
- ⚡ Éviter les requêtes réseau répétées
- 🎯 Garantir la cohérence (même image = même ingrédient)
- 📊 Tracking des ingrédients les plus utilisés

Voir le plan détaillé dans `peaceful-tickling-beacon.md` (Phase 2).

---

### Enrichissement du Dictionnaire FR→EN

Au fil du temps, on pourra enrichir le dictionnaire avec:
- Plus d'ingrédients rares
- Variations régionales (ex: "courgette" vs "zucchini")
- Traduction automatique via API (si nécessaire)

---

## 📝 Notes Importantes

1. **TheMealDB gratuit mais limité** : 600+ ingrédients disponibles. Les ingrédients très rares n'auront pas d'image.

2. **Pas de fallback Unsplash** : Choix volontaire pour simplifier. Si un ingrédient n'est pas trouvé → emoji 🍽️.

3. **Dictionnaire FR→EN manuel** : Plus fiable qu'une traduction automatique pour les 100 ingrédients courants.

4. **Performance** : TheMealDB est plus rapide qu'Unsplash (URLs statiques vs recherche API).

5. **Coût** : 0€ (vs potentiellement payant avec Unsplash au-delà de 50 req/h).

---

## ✅ Checklist de Migration

Utiliser cette checklist pendant l'implémentation :

### Préparation
- [ ] Lire ce document en entier
- [ ] Créer une branche Git: `git checkout -b migration/themealdb`
- [ ] Sauvegarder l'état actuel: `git commit -am "backup before migration"`

### Modifications du Code
- [ ] Modifier `src/services/image.service.ts` - Supprimer imports Unsplash
- [ ] Modifier `src/services/image.service.ts` - Ajouter constante TheMealDB
- [ ] Modifier `src/services/image.service.ts` - Réécrire `searchIngredientImage()`
- [ ] Modifier `src/services/image.service.ts` - Modifier `batchSearchIngredientImages()`
- [ ] Modifier `src/services/image.service.ts` - Ajouter `normalizeIngredientName()`
- [ ] Modifier `src/services/image.service.ts` - Supprimer méthodes Unsplash
- [ ] Modifier `src/services/image.service.ts` - Mettre à jour JSDoc
- [ ] Modifier `app.config.js` - Supprimer section `extra`
- [ ] Modifier `.env.local` - Supprimer UNSPLASH_ACCESS_KEY (optionnel)
- [ ] Désinstaller `unsplash-js` (optionnel)

### Tests
- [ ] Redémarrer Expo avec `npm start -- --clear`
- [ ] Test 1 : Aucune erreur au démarrage
- [ ] Test 2 : Importer une recette avec ingrédients courants
- [ ] Test 3 : Vérifier affichage images dans fiche recette
- [ ] Test 4 : Tester liste de courses
- [ ] Test 5 : Tester ingrédients français (tomate, oignon, poulet, etc.)

### Validation
- [ ] Aucune référence à Unsplash dans le code
- [ ] Images sur fond blanc (TheMealDB)
- [ ] Emoji 🍽️ pour ingrédients non trouvés
- [ ] Performance OK (pas de ralentissement)

### Finalisation
- [ ] Commit des changements: `git commit -am "feat: migrate from Unsplash to TheMealDB"`
- [ ] Merge dans develop: `git checkout develop && git merge migration/themealdb`
- [ ] Mettre à jour la documentation si nécessaire

---

**Temps estimé total** : 1-2 heures

**Prêt à commencer ?** Suivez les étapes dans l'ordre et cochez la checklist au fur et à mesure ! 🚀

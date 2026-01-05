# 🔄 Migration Automatique des Images

Guide pour utiliser la migration automatique des images externes vers Supabase Storage.

---

## 🎯 **Objectif**

Migrer automatiquement les anciennes recettes avec URLs externes (Instagram, TikTok, sites web) vers Supabase Storage pour :
- ✅ **Permanence** : Les images ne disparaissent jamais
- ✅ **Performance** : CDN Supabase rapide
- ✅ **Qualité** : Images Instagram/TikTok **sans bouton play**

---

## 🏗️ **Architecture**

### **Edge Function** : `migrate-recipe-image`

Située dans `supabase/functions/migrate-recipe-image/index.ts`

**Fonctionnalités** :
1. Détecte si l'URL est Instagram/TikTok
2. Pour Instagram : Re-scrape pour extraire `video_image.uri` (sans bouton play)
3. Télécharge l'image
4. Upload dans Storage : `recipes/{userId}/{recipeId}-{timestamp}.jpg`
5. Met à jour la recette en DB

**Paramètres** :
```typescript
{
  recipeId: string,        // ID de la recette
  externalUrl: string,     // URL externe actuelle (avec potentiel bouton play)
  importUrl: string | null, // URL d'import originale (Instagram/TikTok)
  userId: string           // ID de l'utilisateur
}
```

**Réponse** :
```typescript
{
  success: boolean,
  newUrl?: string,    // Nouvelle URL Supabase Storage
  oldUrl?: string,    // Ancienne URL externe
  error?: string
}
```

### **Service Frontend** : `RecipeService`

Deux nouvelles méthodes dans `src/services/recipe.service.ts` :

#### `migrateImageToStorage()`
```typescript
static async migrateImageToStorage(
  recipeId: string,
  externalUrl: string,
  importUrl?: string | null
): Promise<ServiceResponse<string>>
```

Appelle l'Edge Function pour migrer l'image.

#### `isExternalImage()`
```typescript
static isExternalImage(imageUrl: string | null | undefined): boolean
```

Détecte si une URL est externe (pas Supabase Storage).

---

## 📱 **Intégration dans RecipeDetailScreen**

### **Étape 1 : Importer le service**

```typescript
import { RecipeService } from "@/services/recipe.service";
```

### **Étape 2 : Ajouter useEffect pour migration lazy**

```typescript
import { useEffect, useState } from "react";

export function RecipeDetailScreen({ route }) {
  const { recipeId } = route.params;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [imageMigrated, setImageMigrated] = useState(false);

  // ... useEffect pour charger la recette

  // Migration lazy des images externes
  useEffect(() => {
    if (!recipe || imageMigrated) return;

    // Vérifier si l'image est externe
    if (RecipeService.isExternalImage(recipe.coverImageUrl)) {
      console.log("🔄 Detected external image, migrating...");

      // Migrer en background (non-bloquant)
      RecipeService.migrateImageToStorage(
        recipe.id,
        recipe.coverImageUrl!,
        recipe.importUrl
      )
        .then(({ data: newUrl, error }) => {
          if (newUrl) {
            console.log("✅ Image migrated to Storage:", newUrl);
            setImageMigrated(true);

            // Optionnel : Mettre à jour l'affichage local
            setRecipe((prev) => prev ? { ...prev, coverImageUrl: newUrl } : null);
          } else {
            console.warn("⚠️ Image migration failed:", error);
          }
        });
    }
  }, [recipe, imageMigrated]);

  // ... reste du composant
}
```

### **Option Alternative : Migration Silencieuse**

Si vous ne voulez pas mettre à jour l'affichage immédiatement :

```typescript
useEffect(() => {
  if (!recipe) return;

  if (RecipeService.isExternalImage(recipe.coverImageUrl)) {
    // Migration silencieuse en background
    RecipeService.migrateImageToStorage(
      recipe.id,
      recipe.coverImageUrl!,
      recipe.importUrl
    )
      .then(({ data: newUrl }) => {
        if (newUrl) {
          console.log("✅ Image migrated (will use on next load)");
        }
      })
      .catch(() => {
        // Échec silencieux, l'image externe continuera de s'afficher
      });
  }
}, [recipe?.id]); // N'exécuter qu'une fois par recette
```

---

## 🧪 **Tests**

### **Test 1 : Recette Instagram avec bouton play**

1. Ouvrez une ancienne recette importée d'Instagram
2. Vérifiez dans les logs : `🔄 Detected external image, migrating...`
3. Après quelques secondes : `✅ Image migrated to Storage`
4. Vérifiez dans Storage → `recipe-images/recipes/{userId}/`
5. L'image ne devrait **plus avoir de bouton play**

### **Test 2 : Recette site web classique**

1. Ouvrez une recette importée d'un site web (Marmiton, etc.)
2. La migration se fait normalement
3. L'image est stockée dans Storage

### **Test 3 : Recette déjà migrée**

1. Ouvrez une recette dont l'image est déjà dans Storage
2. `isExternalImage()` retourne `false`
3. Pas de migration (évite les doublons)

---

## 📊 **Monitoring**

### **Logs Edge Function**

👉 https://supabase.com/dashboard/project/iiwykxsbldhmyuriqozd/functions/migrate-recipe-image/logs

Cherchez :
```
🔄 Migrating image for recipe {id}...
🎯 Detected social media URL, extracting clean image...
✅ Using clean Instagram image
📥 Downloading image from: https://...
⬆️  Uploading to Supabase Storage: recipes/{userId}/{id}-{timestamp}.jpg
✅ Image uploaded successfully: https://...
✅ Recipe {id} migrated successfully
```

### **Logs Frontend**

Dans la console React Native :
```
🔄 Detected external image, migrating...
✅ Image migrated to Storage: https://...
```

---

## 🔧 **Configuration**

### **Variables d'Environnement**

L'Edge Function nécessite :
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (pour upload)

Déjà configurées dans Supabase.

### **Permissions Storage**

Le bucket `recipe-images` doit :
- ✅ Être public (lecture)
- ✅ Autoriser uploads via SERVICE_ROLE_KEY

---

## 🚀 **Migration Batch (Optionnel)**

Si vous voulez migrer **toutes** les recettes d'un coup :

### **Créer un bouton dans SettingsScreen**

```typescript
import { RecipeService } from "@/services/recipe.service";

function SettingsScreen() {
  const [migrating, setMigrating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const handleMigrateAllImages = async () => {
    setMigrating(true);

    try {
      // 1. Récupérer toutes les recettes avec images externes
      const { data: recipes } = await RecipeService.getUserRecipes(user.id, true);

      const externalRecipes = recipes?.filter((r) =>
        RecipeService.isExternalImage(r.coverImageUrl)
      ) || [];

      setProgress({ current: 0, total: externalRecipes.length });

      // 2. Migrer une par une
      for (let i = 0; i < externalRecipes.length; i++) {
        const recipe = externalRecipes[i];

        await RecipeService.migrateImageToStorage(
          recipe.id,
          recipe.coverImageUrl!,
          recipe.importUrl
        );

        setProgress({ current: i + 1, total: externalRecipes.length });

        // Pause entre chaque pour éviter rate limit
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      Alert.alert(
        "✅ Migration terminée",
        `${externalRecipes.length} images migrées vers Supabase Storage`
      );
    } catch (error) {
      Alert.alert("❌ Erreur", "La migration a échoué");
    } finally {
      setMigrating(false);
    }
  };

  return (
    <View>
      <Button
        onPress={handleMigrateAllImages}
        disabled={migrating}
      >
        {migrating
          ? `Migration... ${progress.current}/${progress.total}`
          : "Migrer toutes mes images vers Storage"
        }
      </Button>
    </View>
  );
}
```

---

## 💡 **Meilleures Pratiques**

### ✅ **Faire**
- Migrer automatiquement en background (lazy)
- Logger les migrations pour debug
- Gérer les erreurs silencieusement (fallback sur URL externe)
- Limiter le nombre de migrations simultanées (rate limit)

### ❌ **Éviter**
- Bloquer l'UI pendant la migration
- Migrer plusieurs fois la même image
- Afficher des erreurs à l'utilisateur (c'est transparent)
- Supprimer l'URL externe avant confirmation upload

---

## 🐛 **Dépannage**

### **Migration échoue**

**Causes possibles** :
1. URL externe déjà invalide (404)
2. Bucket Storage plein (limite free tier)
3. Rate limit Edge Function

**Solution** :
- Vérifier les logs Edge Function
- Vérifier l'espace Storage disponible
- Ajouter un délai entre migrations

### **Image toujours avec bouton play**

**Cause** : Instagram a changé sa structure HTML

**Solution** :
- Mettre à jour les patterns d'extraction dans `migrate-recipe-image/index.ts`
- Ou accepter l'image avec bouton play (mieux que rien)

### **Images ne s'affichent pas**

**Cause** : Bucket pas public

**Solution** :
- Vérifier que `recipe-images` est public dans Storage settings

---

## 📈 **Statistiques**

Pour voir combien d'images ont été migrées :

```sql
-- Compter les recettes avec images Supabase vs externes
SELECT
  COUNT(*) FILTER (WHERE cover_image_url LIKE '%supabase.co/storage%') AS migrated,
  COUNT(*) FILTER (WHERE cover_image_url NOT LIKE '%supabase.co/storage%' AND cover_image_url IS NOT NULL) AS external,
  COUNT(*) FILTER (WHERE cover_image_url IS NULL) AS no_image
FROM recipes
WHERE user_id = '{your-user-id}';
```

---

**Dernière mise à jour** : 5 janvier 2026
**Version** : 1.0
**Auteur** : Équipe Paprika

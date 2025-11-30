# Migration Multi-Recettes - Instructions

## 📋 Vue d'ensemble

Cette migration convertit la structure de données `meal_plans.meals` pour supporter **plusieurs recettes par slot** au lieu d'une seule.

**Avant** :
```json
{
  "monday-breakfast": {
    "recipeId": "uuid-123",
    "servings": 4,
    "isCooked": false
  }
}
```

**Après** :
```json
{
  "monday-breakfast": [
    { "recipeId": "uuid-123", "servings": 4, "isCooked": false },
    { "recipeId": "uuid-456", "servings": 2, "isCooked": false }
  ]
}
```

---

## ⚠️ IMPORTANT - À faire AVANT la migration

### 1. Backup de la base de données

Créez un backup complet de votre base Supabase :
1. Allez sur https://app.supabase.com/project/YOUR_PROJECT_ID/settings/storage
2. Cliquez sur "Database" → "Backups"
3. Créez un backup manuel

### 2. Tester en local (recommandé)

Si vous utilisez Supabase local :
```bash
# 1. Démarrer Supabase local
npx supabase start

# 2. Appliquer la migration
npx supabase db push

# 3. Vérifier que tout fonctionne
npm start
```

---

## 🚀 Exécution de la migration (Production)

### Option A : Via Supabase SQL Editor (RECOMMANDÉ)

1. **Ouvrir le SQL Editor** :
   - Allez sur https://app.supabase.com/project/YOUR_PROJECT_ID/sql
   - Créez une nouvelle query

2. **Copier le script SQL** :
   - Ouvrez le fichier `supabase/migrations/migration-multi-recipes.sql`
   - Copiez tout le contenu

3. **Exécuter la migration** :
   - Collez le SQL dans l'éditeur
   - Cliquez sur "Run" (en bas à droite)

4. **Vérifier le résultat** :
   ```sql
   -- Vérifier qu'un slot est maintenant un array
   SELECT
     id,
     week_start,
     jsonb_typeof(meals -> 'monday-breakfast') as slot_type,
     meals -> 'monday-breakfast' as monday_data
   FROM meal_plans
   WHERE meals ? 'monday-breakfast'
   LIMIT 5;
   ```

   **Résultat attendu** : `slot_type` doit afficher `"array"` (pas `"object"`)

### Option B : Via Supabase CLI

```bash
# 1. Se connecter à Supabase
npx supabase link --project-ref YOUR_PROJECT_ID

# 2. Appliquer les migrations
npx supabase db push

# 3. Vérifier
npx supabase db diff
```

---

## ✅ Post-Migration - Vérifications

### 1. Vérifier les données

Exécutez cette requête pour vérifier que toutes les données ont été migrées :

```sql
-- Compter les meal_plans avec ancien format (devrait être 0)
SELECT COUNT(*) as old_format_count
FROM meal_plans
WHERE EXISTS (
  SELECT 1
  FROM jsonb_each(meals)
  WHERE jsonb_typeof(value) = 'object'
);

-- Compter les meal_plans avec nouveau format (devrait être > 0)
SELECT COUNT(*) as new_format_count
FROM meal_plans
WHERE EXISTS (
  SELECT 1
  FROM jsonb_each(meals)
  WHERE jsonb_typeof(value) = 'array'
);
```

### 2. Tester l'application

1. **Démarrer l'app** :
   ```bash
   npm start
   ```

2. **Tester le meal planning** :
   - ✅ Ajouter une recette à un slot vide
   - ✅ Ajouter une 2ème recette au même slot
   - ✅ Swiper pour supprimer une recette individuelle
   - ✅ Cocher/décocher le statut "Cuisiné" par recette
   - ✅ Essayer d'ajouter une 6ème recette (doit bloquer avec message d'erreur)

### 3. Rollback (si nécessaire)

Si quelque chose ne va pas, vous pouvez restaurer depuis le backup :

```sql
-- Rollback manuel (convertir arrays → objects, garde seulement la 1ère recette)
UPDATE meal_plans
SET meals = (
  SELECT jsonb_object_agg(
    key,
    value->0  -- Prend le premier élément de l'array
  )
  FROM jsonb_each(meals)
  WHERE jsonb_typeof(value) = 'array'
);
```

⚠️ **ATTENTION** : Ce rollback **perd les recettes multiples** (garde seulement la première).

---

## 📊 Statistiques Post-Migration

Pour voir combien de slots ont maintenant plusieurs recettes :

```sql
SELECT
  COUNT(*) as total_slots,
  COUNT(*) FILTER (WHERE jsonb_array_length(value) > 1) as multi_recipe_slots,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE jsonb_array_length(value) > 1) / COUNT(*),
    2
  ) as percentage_multi
FROM meal_plans,
     jsonb_each(meals);
```

---

## 🐛 Problèmes courants

### Erreur : "column meals is of type jsonb but expression is of type text"

**Solution** : Assurez-vous que le script utilise `jsonb_object_agg` et `jsonb_build_array`.

### Erreur : "cannot extract elements from a scalar"

**Solution** : Certains slots sont déjà au format array. La migration gère ce cas avec la clause `WHERE`.

### App crash : "undefined is not an object"

**Solution** : Vérifiez que vous avez bien redémarré l'app après la migration :
```bash
# Tuer le serveur Metro Bundler
# Puis redémarrer
npm start
```

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifiez les logs Supabase : https://app.supabase.com/project/YOUR_PROJECT_ID/logs
2. Consultez le `DECISION-LOG.md` du projet
3. Restaurez depuis le backup si nécessaire

---

**Date de création** : 30 novembre 2025
**Mainteneur** : Équipe Paprika

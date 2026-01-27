# Supabase Storage Setup - Recipe Images

Ce guide explique comment configurer le bucket Supabase Storage pour stocker les images de recettes de manière permanente.

## Pourquoi ce bucket ?

L'Edge Function `recipe-import` télécharge maintenant automatiquement les images depuis les URLs externes (Instagram, TikTok, sites web) et les stocke dans Supabase Storage. Cela garantit que les images restent accessibles même si :
- Les URLs Instagram/TikTok expirent
- Les sites sources bloquent le hotlinking
- Les posts sources sont supprimés

## Configuration du Bucket

### Méthode 1 : Via le Dashboard Supabase (Recommandé)

1. Allez sur [Supabase Dashboard](https://supabase.com/dashboard)
2. Sélectionnez votre projet
3. Naviguez vers **Storage** dans le menu latéral
4. Cliquez sur **New Bucket**
5. Configurez le bucket :
   - **Name**: `recipe-images`
   - **Public bucket**: ✅ Coché (les images doivent être accessibles publiquement)
   - **File size limit**: `5242880` (5 MB)
   - **Allowed MIME types**:
     - `image/jpeg`
     - `image/png`
     - `image/webp`
6. Cliquez sur **Create bucket**

### Méthode 2 : Via SQL (Alternative)

Si vous préférez configurer via SQL, exécutez ce code dans l'éditeur SQL de Supabase :

```sql
-- Créer le bucket recipe-images (storage.buckets)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'recipe-images',
  'recipe-images',
  true,
  5242880,  -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

### Méthode 3 : Via l'Edge Function (Automatique)

L'`ImageService` frontend contient une méthode `initializeStorage()` qui peut créer le bucket automatiquement. Cependant, cette méthode nécessite des permissions admin et n'est pas recommandée pour la production.

## Politiques RLS (Row Level Security)

Par défaut, un bucket public permet :
- ✅ **Lecture** (GET) : Accessible à tous (URLs publiques)
- ❌ **Écriture** (INSERT/UPDATE/DELETE) : Uniquement via service role key

L'Edge Function utilise le **service role key** configuré dans les secrets Supabase, donc elle peut uploader des images même si le bucket est en lecture seule pour les utilisateurs.

### ⚠️ Politique Actuelle : Simple et Fonctionnelle (MVP)

**Version actuelle en production** :

```sql
-- Activer RLS sur storage.objects (si pas déjà fait)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Politique simple : Tous les utilisateurs authentifiés peuvent gérer les images
CREATE POLICY "Authenticated users can manage recipe images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');
```

**Note** : Cette politique permet à tous les utilisateurs authentifiés de gérer toutes les images du bucket. C'est suffisant pour le MVP mais devrait être amélioré en production (voir ci-dessous).

### 🔐 Politique Sécurisée (À Implémenter)

**Version recommandée pour la production** (restrictive par utilisateur) :

```sql
-- SUPPRIMER la politique simple d'abord
DROP POLICY IF EXISTS "Authenticated users can manage recipe images" ON storage.objects;

-- Politique restrictive : Chaque utilisateur gère uniquement ses propres images
CREATE POLICY "Users can manage only their own recipe images"
ON storage.objects FOR ALL
TO authenticated
USING (
  bucket_id = 'recipe-images' AND
  name LIKE ('recipes/' || auth.uid()::text || '/%')
)
WITH CHECK (
  bucket_id = 'recipe-images' AND
  name LIKE ('recipes/' || auth.uid()::text || '/%')
);
```

**Problème connu** : Cette politique peut ne pas fonctionner sur certaines versions de Supabase en raison d'un bug avec `auth.uid()` dans le contexte Storage RLS.

**Solution alternative** : Créer une Edge Function dédiée pour l'upload qui valide côté serveur :

```typescript
// supabase/functions/upload-recipe-image/index.ts
const userId = await getUserIdFromToken(req);
const storagePath = await req.json().path;

// Validation : Le chemin doit commencer par recipes/{userId}/
if (!storagePath.startsWith(`recipes/${userId}/`)) {
  return new Response("Forbidden: Invalid storage path", { status: 403 });
}

// Upload via service role
const { data, error } = await supabase.storage
  .from('recipe-images')
  .upload(storagePath, file);
```

## Structure de Stockage

Les images sont organisées de cette façon :

```
recipe-images/
└── recipes/
    ├── {uuid}-{timestamp}.jpg
    ├── {uuid}-{timestamp}.png
    └── {uuid}-{timestamp}.webp
```

**Exemple** : `recipe-images/recipes/a1b2c3d4-1704067200000.jpg`

- `{uuid}` : Identifiant unique généré pour la recette
- `{timestamp}` : Timestamp pour éviter les collisions de noms

## Vérification

Pour vérifier que le bucket est bien configuré :

1. **Via Dashboard** :
   - Allez dans Storage → `recipe-images`
   - Vous devriez voir le bucket avec **Public** activé

2. **Via SQL** :
   ```sql
   SELECT id, name, public, file_size_limit, allowed_mime_types
   FROM storage.buckets
   WHERE id = 'recipe-images';
   ```

3. **Test d'upload** :
   - Importez une recette depuis une URL
   - Vérifiez dans Storage → `recipe-images` → `recipes/`
   - Vous devriez voir l'image uploadée

## Nettoyage des Anciennes Images

Si vous souhaitez nettoyer les images orphelines (recettes supprimées), vous pouvez créer une fonction PostgreSQL planifiée :

```sql
-- TODO: Créer une fonction de nettoyage des images orphelines
-- Cette fonction devrait être exécutée périodiquement (ex: 1 fois par mois)
-- Elle supprime les images dont le recipeId n'existe plus dans la table recipes
```

## Coûts

Supabase Storage Free Tier :
- **1 GB** de stockage gratuit
- **2 GB** de bande passante gratuite par mois

Une image de recette pèse en moyenne **200-500 KB**. Vous pouvez stocker environ **2000-5000 recettes** dans le tier gratuit.

**Estimation** :
- 100 utilisateurs × 20 recettes = 2000 recettes
- 2000 × 300 KB = **600 MB** (bien en dessous de 1 GB)

## Dépannage

### Erreur "Bucket does not exist"
**Solution** : Créez le bucket via le Dashboard ou SQL (voir ci-dessus)

### Erreur "Permission denied" ou "RLS policy violation"
**Causes possibles** :
1. RLS n'est pas activé sur `storage.objects`
2. Aucune politique n'autorise l'opération
3. La politique existe mais ne matche pas le chemin

**Solutions** :
```sql
-- 1. Vérifier si RLS est activé
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'storage' AND tablename = 'objects';
-- Si rowsecurity = false, exécuter : ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Lister les politiques existantes
SELECT policyname, cmd
FROM pg_policies
WHERE schemaname = 'storage' AND tablename = 'objects';

-- 3. Vérifier qu'au moins une politique existe
-- Si aucune politique, créer celle recommandée ci-dessus
```

### Images non visibles
**Solution** : Vérifiez que le bucket est **public** (option cochée dans le Dashboard)

### Upload échoue (413 Payload Too Large)
**Solution** : L'image dépasse 5 MB, augmentez `file_size_limit` ou compressez l'image

### Erreur "mime type not supported"
**Cause** : Le type MIME de l'image n'est pas dans `allowed_mime_types` du bucket
**Solution** :
```sql
-- Mettre à jour les types MIME autorisés
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'recipe-images';
```

### Image uploadée mais affichée en blanc (React Native)
**Cause** : Problème de conversion base64 → ArrayBuffer
**Solution** : Vérifier que vous utilisez `expo-file-system/legacy` et non la nouvelle API :
```typescript
import * as FileSystem from "expo-file-system/legacy"; // ✅ Correct
// import * as FileSystem from "expo-file-system"; // ❌ Ne fonctionne pas
```

### Erreur "Method readAsStringAsync is deprecated"
**Cause** : Utilisation de la nouvelle API expo-file-system (non compatible)
**Solution** : Importer depuis `/legacy` (voir ci-dessus)

---

**Dernière mise à jour** : 5 janvier 2026
**Auteur** : Équipe Paprika

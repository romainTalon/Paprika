# Feature : Ajout d'Image de Couverture pour les Recettes

**Date d'implémentation** : 27 janvier 2026
**Statut** : ✅ Fonctionnel (MVP)

## Vue d'ensemble

Cette feature permet aux utilisateurs d'ajouter une **image de couverture personnalisée** lors de l'import d'une recette (URL, photo, etc.) sur l'écran de prévisualisation avant sauvegarde.

## Fonctionnalités

### ✅ Implémenté

- **Ajout d'image** via caméra ou galerie photos
- **Prévisualisation** de l'image sélectionnée
- **Modification/Suppression** de l'image avant sauvegarde
- **Compression automatique** de l'image (1200x1200px max, JPEG 85%)
- **Upload vers Supabase Storage** dans `recipe-images/recipes/{userId}/`
- **Compatible avec tous les types d'import** (URL, photo OCR, Instagram, TikTok, etc.)
- **Gestion des erreurs** : la recette est sauvegardée même si l'upload échoue

### 🚀 Disponibilité

- **Écran de prévisualisation** (`app/recipes/preview.tsx`) : Tous les imports
- **Position** : Après la description, avant les portions

## Architecture

### Composants

#### 1. `CoverImagePicker` (`src/components/recipe/CoverImagePicker.tsx`)

Composant principal pour la sélection d'image.

**Props** :
```typescript
interface CoverImagePickerProps {
  value: CoverImageData | null;
  onChange: (data: CoverImageData | null) => void;
  label?: string;
  disabled?: boolean;
}
```

**Type `CoverImageData`** :
```typescript
interface CoverImageData {
  type: "url" | "photo";
  url?: string;           // Pour images existantes (URL)
  photo?: PhotoResult;    // Pour nouvelles photos
}
```

**Fonctionnement** :
1. Affiche un placeholder cliquable si aucune image
2. Ouvre une modal avec 2 options : Caméra ou Galerie
3. Utilise `usePhotoImport` pour la capture/compression
4. Affiche l'aperçu avec option de suppression

#### 2. Hook `usePhotoImport` (`src/hooks/usePhotoImport.ts`)

Hook existant réutilisé, configuré avec des paramètres optimisés :

```typescript
const { takePhoto, pickFromGallery, isLoading } = usePhotoImport({
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.85,
});
```

**Résultat** : Images de ~200-400 KB (balance qualité/taille)

### Flux d'Upload

```
1. Utilisateur sélectionne une image
   ↓
2. Compression via expo-image-manipulator
   ↓
3. Image stockée temporairement dans le cache local
   ↓
4. Lors de "Enregistrer" :
   - Lecture du fichier local avec expo-file-system/legacy
   - Conversion base64 → ArrayBuffer (Uint8Array)
   - Upload vers Supabase Storage
   ↓
5. URL publique générée et stockée dans la BDD
```

**Code d'upload** (dans `preview.tsx`) :
```typescript
// Lecture du fichier local
const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: 'base64',
});

// Conversion en ArrayBuffer
const binaryString = atob(base64);
const bytes = new Uint8Array(binaryString.length);
for (let i = 0; i < binaryString.length; i++) {
  bytes[i] = binaryString.charCodeAt(i);
}

// Upload vers Supabase
const { data } = await supabase.storage
  .from("recipe-images")
  .upload(storagePath, bytes.buffer, {
    cacheControl: "3600",
    upsert: true,
    contentType: mimeType,
  });
```

### Storage Supabase

**Bucket** : `recipe-images` (public)
**Structure** :
```
recipe-images/
└── recipes/
    └── {userId}/
        ├── cover-1769550100396.jpg
        ├── cover-1769550205847.jpg
        └── ...
```

**Politiques RLS** :
```sql
-- Politique actuelle (simple et fonctionnelle)
CREATE POLICY "Authenticated users can manage recipe images"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'recipe-images')
WITH CHECK (bucket_id = 'recipe-images');
```

⚠️ **Note** : Cette politique permet à tous les utilisateurs authentifiés de gérer toutes les images. Pour le MVP c'est acceptable, mais à améliorer (voir section Améliorations).

## Limitations et Contraintes

### Techniques

1. **API Expo File System** : Utilisation de `/legacy` car la nouvelle API n'est pas encore stable
2. **Conversion ArrayBuffer** : Nécessaire car React Native ne supporte pas `new Blob([ArrayBuffer])`
3. **Pas de recadrage** : L'utilisateur ne peut pas recadrer l'image après capture
4. **Format fixe** : Conversion forcée en JPEG (sauf si PNG original)

### Sécurité

1. **RLS non restrictif** : N'importe quel utilisateur authentifié peut uploader/supprimer n'importe quelle image
2. **Pas de validation côté serveur** : Pas de vérification du type MIME, taille, contenu
3. **Pas de quota utilisateur** : Un utilisateur peut uploader un nombre illimité d'images

### UX

1. **Pas de feedback de progression** : Juste "Upload de l'image..." sans pourcentage
2. **Pas de retry automatique** : En cas d'échec réseau, l'utilisateur doit recommencer
3. **Pas d'édition d'image** : Pas de rotation, crop, filtres, etc.

## Améliorations Futures

### 🔴 Priorité Haute (Sécurité)

#### 1. Politiques RLS restrictives par utilisateur

**Problème** : Actuellement, n'importe quel utilisateur peut supprimer les images des autres.

**Solution** :
```sql
-- Politique restrictive avec validation du chemin
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

**Pourquoi ça n'a pas marché ?** : Problème technique non résolu avec `auth.uid()` dans le contexte Storage RLS. À investiguer.

**Alternative** : Créer une **Edge Function dédiée** pour l'upload qui valide côté serveur :
```typescript
// supabase/functions/upload-recipe-image/index.ts
const userId = await getUserIdFromToken(req);
if (!storagePath.startsWith(`recipes/${userId}/`)) {
  return new Response("Forbidden", { status: 403 });
}
```

#### 2. Validation côté serveur

**Ajouter dans l'Edge Function** :
- ✅ Validation du MIME type (JPEG, PNG, WebP uniquement)
- ✅ Limite de taille (5 MB max)
- ✅ Scan antivirus/malware (optionnel)
- ✅ Vérification du contenu (vraiment une image)

#### 3. Quota par utilisateur

**Implémenter** :
- Limite de stockage par utilisateur (ex: 100 MB pour free, illimité pour premium)
- Compteur dans la table `users` : `storage_used_bytes`
- Trigger PostgreSQL pour mettre à jour le compteur

### 🟡 Priorité Moyenne (UX)

#### 4. Éditeur d'image intégré

**Fonctionnalités** :
- Recadrage (crop) avec ratio 16:9 ou 1:1
- Rotation (90°, 180°, 270°)
- Filtres basiques (luminosité, contraste, saturation)

**Librairies possibles** :
- `react-native-image-crop-picker` (crop + rotation)
- `expo-image-editor` (plus complet)

#### 5. Feedback de progression

**Améliorer** :
- Barre de progression pendant l'upload
- Indication de la vitesse (KB/s)
- Animation visuelle

**Implémentation** :
```typescript
const { data } = await supabase.storage
  .from("recipe-images")
  .upload(storagePath, bytes.buffer, {
    onUploadProgress: (progress) => {
      const percent = (progress.loaded / progress.total) * 100;
      setUploadProgress(percent);
    },
  });
```

⚠️ **Note** : `onUploadProgress` n'est pas supporté dans le SDK Supabase actuel. À implémenter avec `XMLHttpRequest` ou `fetch` direct.

#### 6. Retry automatique

**Ajouter** :
- Détection d'erreur réseau
- Retry automatique (3 tentatives max)
- Exponential backoff entre les tentatives

#### 7. Images multiples

**Feature** : Permettre d'ajouter plusieurs images à une recette (galerie)
- Image de couverture (obligatoire)
- Images d'étapes (optionnel)
- Galerie de photos finales (optionnel)

**Impact BDD** :
```sql
ALTER TABLE recipes
ADD COLUMN additional_images TEXT[]; -- Array d'URLs
```

### 🟢 Priorité Basse (Nice to have)

#### 8. Compression optimisée

**Améliorer** :
- Utiliser WebP au lieu de JPEG (meilleure compression)
- Compression adaptative selon le contenu (photo vs graphique)
- Génération de plusieurs tailles (thumbnail, medium, large)

**Exemple** :
```
recipes/{userId}/
├── cover-123-thumb.webp   (200x200, ~20 KB)
├── cover-123-medium.webp  (600x600, ~80 KB)
└── cover-123-large.webp   (1200x1200, ~200 KB)
```

#### 9. Détection automatique d'image de recette

**Feature** : Quand l'utilisateur importe par photo, proposer automatiquement la photo comme image de couverture

**Workflow** :
```
1. User prend photo d'un livre de cuisine
   ↓
2. Gemini extrait la recette
   ↓
3. Modal suggère : "Utiliser cette photo comme image de couverture ?"
   - Oui → Utilise la photo OCR (recadrée)
   - Non → Permet de choisir une autre photo
```

**Problème** : Les photos OCR contiennent du texte, pas idéal comme couverture. Solution : Crop intelligent pour extraire juste la photo du plat si détectée.

#### 10. Recherche d'images en ligne

**Feature** : Proposer une recherche d'images via API externe

**APIs possibles** :
- Unsplash API (gratuit, haute qualité)
- Pexels API (gratuit)
- Google Custom Search API (payant)

**UX** :
```
Modal d'ajout d'image :
- Prendre une photo
- Galerie photos
- Rechercher en ligne (nouveau)
```

#### 11. AI Image Generation

**Feature** : Générer une image de la recette avec DALL-E ou Stable Diffusion

**Prompt** :
```
"A professional food photography of {recipe.title},
plated beautifully on a white plate, natural lighting,
top view, 4k, highly detailed"
```

**Coût** : ~€0.02-0.04 par image (selon le modèle)

## Testing

### Tests à ajouter

#### Unit Tests
```typescript
// CoverImagePicker.test.tsx
describe('CoverImagePicker', () => {
  it('should show placeholder when no image', () => { ... });
  it('should open modal on press', () => { ... });
  it('should call onChange when image selected', () => { ... });
  it('should remove image when remove button pressed', () => { ... });
});
```

#### Integration Tests
```typescript
// preview.screen.test.tsx
describe('Recipe Preview Screen - Cover Image', () => {
  it('should upload image on save', async () => { ... });
  it('should save recipe without image if upload fails', async () => { ... });
  it('should show loading indicator during upload', () => { ... });
});
```

#### E2E Tests
```typescript
// e2e/recipe-import.spec.ts
test('should add cover image during recipe import', async () => {
  await importRecipeFromURL('https://example.com/recipe');
  await tapCoverImagePicker();
  await selectFromGallery();
  await tapSaveButton();

  // Verify image uploaded
  const recipe = await getRecipeById(recipeId);
  expect(recipe.coverImageUrl).toContain('supabase.co/storage');
});
```

## Monitoring & Métriques

### À implémenter

1. **Analytics** :
   - Nombre d'images uploadées par jour
   - Taux de succès/échec des uploads
   - Taille moyenne des images
   - Temps moyen d'upload

2. **Alertes** :
   - Alerte si taux d'échec > 5%
   - Alerte si temps d'upload > 10s (95th percentile)
   - Alerte si storage quota dépassé

3. **Logs** :
   - Log structuré avec `{ userId, recipeId, imageSize, uploadDuration, success }`
   - Intégration avec Sentry pour les erreurs

## Coûts

### Storage Supabase

**Free Tier** : 1 GB gratuit
**Estimation** :
- Image moyenne : 300 KB
- 3,000 images = ~900 MB (dans le tier gratuit)
- 10,000 images = ~3 GB → €0.021/GB/mois = €0.063/mois

**Bande passante** : 2 GB gratuit/mois
- 1,000 vues/jour × 300 KB = 300 MB/jour = 9 GB/mois
- Dépassement : 7 GB × €0.09/GB = €0.63/mois

**Total estimé** : ~€0.70/mois pour 10,000 recettes actives

## Migration depuis l'ancienne version

Pas de migration nécessaire - cette feature est **additive**.

Les recettes existantes sans image continuent de fonctionner normalement avec `coverImageUrl = null`.

## Rollout

**Phase 1** : ✅ Disponible immédiatement sur l'écran preview pour tous les imports
**Phase 2** : 🔜 Ajouter à l'écran d'édition de recette existante
**Phase 3** : 🔜 Ajouter à l'écran de création manuelle de recette

## Support & Troubleshooting

### Erreurs communes

#### 1. "RLS policy violation"
**Cause** : Politiques RLS mal configurées
**Solution** : Vérifier les politiques avec la requête SQL dans STORAGE-SETUP.md

#### 2. "mime type not supported"
**Cause** : Format d'image non supporté
**Solution** : Vérifier `allowed_mime_types` du bucket

#### 3. Image blanche après upload
**Cause** : Problème de conversion base64 → ArrayBuffer
**Solution** : Vérifier que `expo-file-system/legacy` est utilisé

#### 4. "Method readAsStringAsync is deprecated"
**Cause** : Utilisation de la nouvelle API expo-file-system
**Solution** : Importer depuis `/legacy`

### Debug

Activer les logs temporairement :
```typescript
// Dans preview.tsx, avant l'upload
console.log("Upload debug:", {
  userId: user.id,
  storagePath,
  fileSize: bytes.length,
  mimeType: coverImage.photo.mimeType,
});
```

## Ressources

- [Documentation Supabase Storage](https://supabase.com/docs/guides/storage)
- [Expo File System Legacy API](https://docs.expo.dev/versions/v54.0.0/sdk/filesystem/)
- [Expo Image Manipulator](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [Storage RLS Policies](https://supabase.com/docs/guides/storage/security/access-control)

---

**Auteur** : Équipe Paprika
**Dernière mise à jour** : 27 janvier 2026

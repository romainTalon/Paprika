# TODO : Améliorations Feature Image de Couverture

**Statut actuel** : ✅ MVP fonctionnel (27 janvier 2026)
**Prochaines étapes** : Voir les priorités ci-dessous

---

## 🔴 Priorité HAUTE (Sécurité & Stabilité)

### 1. Sécuriser les politiques RLS Storage

**Problème actuel** : Tous les utilisateurs authentifiés peuvent supprimer/modifier les images des autres utilisateurs.

**Action requise** :
- [ ] Investiguer pourquoi `auth.uid()` ne fonctionne pas dans Storage RLS
- [ ] Tester la politique LIKE avec `auth.uid()::text` sur différentes versions de Supabase
- [ ] Si le problème persiste, créer une Edge Function dédiée `upload-recipe-image`
- [ ] Ajouter des tests E2E pour vérifier l'isolation des données

**Difficulté** : ⭐⭐⭐ (Complexe - nécessite debugging Supabase)
**Impact** : 🔥🔥🔥 Critique pour la sécurité
**Temps estimé** : 1-2 jours

**Fichiers impactés** :
- `supabase/functions/upload-recipe-image/index.ts` (nouveau)
- `app/recipes/preview.tsx` (modifier l'upload pour utiliser la fonction)
- Tests de sécurité

---

### 2. Validation côté serveur

**Problème actuel** : Pas de validation du contenu uploadé (taille, type, malware).

**Action requise** :
- [ ] Créer Edge Function avec validation complète
- [ ] Vérifier le MIME type réel (pas juste l'extension)
- [ ] Limiter la taille à 5 MB max
- [ ] Scanner le contenu pour détecter les fichiers malveillants (optionnel)
- [ ] Vérifier que c'est vraiment une image (pas un PDF renommé)

**Difficulté** : ⭐⭐ (Moyen)
**Impact** : 🔥🔥 Important pour la sécurité
**Temps estimé** : 1 jour

**Code exemple** :
```typescript
// Validation dans Edge Function
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

if (file.size > MAX_SIZE) {
  return new Response('File too large', { status: 413 });
}

if (!ALLOWED_TYPES.includes(file.type)) {
  return new Response('Invalid file type', { status: 400 });
}

// Vérifier les magic bytes pour confirmer le type réel
const header = new Uint8Array(await file.slice(0, 4).arrayBuffer());
// JPEG: FF D8 FF, PNG: 89 50 4E 47, WebP: 52 49 46 46
```

---

### 3. Gestion des quotas utilisateur

**Problème actuel** : Un utilisateur peut uploader un nombre illimité d'images.

**Action requise** :
- [ ] Ajouter colonne `storage_used_bytes` dans la table `users`
- [ ] Créer trigger PostgreSQL pour mettre à jour le compteur à chaque upload/delete
- [ ] Limiter à 100 MB pour les free users, illimité pour premium
- [ ] Afficher l'utilisation du quota dans le profil utilisateur

**Difficulté** : ⭐⭐ (Moyen)
**Impact** : 🔥🔥 Important pour les coûts
**Temps estimé** : 1 jour

**Schema BDD** :
```sql
ALTER TABLE users
ADD COLUMN storage_used_bytes BIGINT DEFAULT 0,
ADD COLUMN storage_quota_bytes BIGINT DEFAULT 104857600; -- 100 MB

-- Trigger pour mettre à jour le quota
CREATE OR REPLACE FUNCTION update_user_storage_quota()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE users
    SET storage_used_bytes = storage_used_bytes + NEW.metadata->>'size'::bigint
    WHERE id = (SELECT metadata->>'user_id' FROM storage.objects WHERE id = NEW.id)::uuid;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE users
    SET storage_used_bytes = storage_used_bytes - OLD.metadata->>'size'::bigint
    WHERE id = (SELECT metadata->>'user_id' FROM storage.objects WHERE id = OLD.id)::uuid;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

---

## 🟡 Priorité MOYENNE (UX & Fonctionnalités)

### 4. Éditeur d'image intégré

**Feature** : Permettre le recadrage et la rotation de l'image après sélection.

**Action requise** :
- [ ] Évaluer les librairies disponibles :
  - `react-native-image-crop-picker` (simple, crop + rotation)
  - `expo-image-editor` (plus complet mais plus lourd)
  - `react-native-image-crop-tools` (alternative)
- [ ] Implémenter le crop avec ratio 16:9 ou 1:1
- [ ] Ajouter rotation 90° / 180° / 270°
- [ ] Tester sur iOS et Android

**Difficulté** : ⭐⭐⭐ (Complexe - UI native)
**Impact** : 🔥🔥 Améliore l'UX
**Temps estimé** : 2-3 jours

**UX souhaitée** :
```
1. User sélectionne une image
   ↓
2. Modal d'édition s'ouvre automatiquement
   - Crop avec aperçu en temps réel
   - Boutons rotation (90°, 180°, 270°)
   - Filtres basiques (optionnel)
   ↓
3. User confirme → Image éditée utilisée pour l'upload
```

---

### 5. Barre de progression d'upload

**Problème actuel** : Juste "Upload de l'image..." sans indication de progression.

**Action requise** :
- [ ] Implémenter le tracking de progression
- [ ] Afficher une barre de progression (0-100%)
- [ ] Afficher la vitesse (KB/s) et le temps restant estimé
- [ ] Permettre l'annulation de l'upload

**Difficulté** : ⭐⭐ (Moyen - SDK Supabase ne supporte pas `onProgress` nativement)
**Impact** : 🔥 Nice to have
**Temps estimé** : 1 jour

**Solution** : Utiliser `fetch` direct avec suivi de progression au lieu du SDK :
```typescript
const xhr = new XMLHttpRequest();
xhr.upload.addEventListener('progress', (e) => {
  if (e.lengthComputable) {
    const percent = (e.loaded / e.total) * 100;
    setUploadProgress(percent);
  }
});
```

---

### 6. Retry automatique en cas d'échec réseau

**Problème actuel** : Si l'upload échoue, l'utilisateur doit tout recommencer.

**Action requise** :
- [ ] Détecter les erreurs réseau (timeout, connection lost)
- [ ] Implémenter retry automatique (max 3 tentatives)
- [ ] Exponential backoff entre les tentatives (1s, 2s, 4s)
- [ ] Afficher "Tentative 2/3..." pendant les retries
- [ ] Sauvegarder l'image localement pour permettre retry plus tard

**Difficulté** : ⭐⭐ (Moyen)
**Impact** : 🔥🔥 Améliore la fiabilité
**Temps estimé** : 1 jour

---

### 7. Support des images multiples (galerie)

**Feature** : Permettre d'ajouter plusieurs images à une recette.

**Action requise** :
- [ ] Modifier le schema BDD : `additional_images TEXT[]`
- [ ] Créer composant `ImageGalleryPicker`
- [ ] Permettre la sélection multiple (caméra/galerie)
- [ ] Afficher les thumbnails des images sélectionnées
- [ ] Réordonner les images (drag & drop)
- [ ] Définir quelle image est la couverture

**Difficulté** : ⭐⭐⭐⭐ (Complexe - beaucoup de UI)
**Impact** : 🔥🔥 Feature premium
**Temps estimé** : 3-5 jours

**Use cases** :
- Photo de chaque étape de la recette
- Photo du plat sous différents angles
- Photo des ingrédients avant/après cuisson

---

## 🟢 Priorité BASSE (Nice to have)

### 8. Compression optimisée avec WebP

**Feature** : Utiliser WebP au lieu de JPEG pour une meilleure compression.

**Action requise** :
- [ ] Tester `expo-image-manipulator` avec format WebP
- [ ] Comparer la taille des fichiers (WebP vs JPEG)
- [ ] Vérifier la compatibilité iOS/Android
- [ ] Générer plusieurs tailles (thumb, medium, large)

**Difficulté** : ⭐⭐ (Moyen)
**Impact** : 🔥 Optimisation
**Temps estimé** : 1-2 jours

**Bénéfices** :
- WebP = ~30% plus petit que JPEG à qualité égale
- Réduction des coûts de stockage et bande passante

---

### 9. Détection automatique d'image dans la photo OCR

**Feature** : Quand l'utilisateur importe par photo, proposer automatiquement d'utiliser la photo comme couverture.

**Action requise** :
- [ ] Détecter si la photo OCR contient une image de plat
- [ ] Utiliser un modèle de détection d'objets (YOLO, TensorFlow Lite)
- [ ] Extraire la région de l'image (crop intelligent)
- [ ] Proposer à l'utilisateur : "Utiliser comme couverture ?"

**Difficulté** : ⭐⭐⭐⭐⭐ (Très complexe - ML on-device)
**Impact** : 🔥 Nice to have
**Temps estimé** : 1 semaine

**Alternatives plus simples** :
- Proposer systématiquement la photo OCR (sans détection)
- Laisser l'utilisateur crop manuellement

---

### 10. Recherche d'images en ligne (Unsplash)

**Feature** : Permettre de chercher une image sur Unsplash directement dans l'app.

**Action requise** :
- [ ] Créer compte Unsplash Developer
- [ ] Intégrer l'API Unsplash
- [ ] Créer UI de recherche avec grille d'images
- [ ] Télécharger l'image sélectionnée
- [ ] Attribuer le crédit de la photo (obligatoire Unsplash)

**Difficulté** : ⭐⭐ (Moyen - API simple)
**Impact** : 🔥 Nice to have
**Temps estimé** : 2 jours

**Coût** : Gratuit jusqu'à 50 requêtes/heure

---

### 11. Génération d'image par IA (DALL-E)

**Feature** : Générer automatiquement une image du plat avec l'IA.

**Action requise** :
- [ ] Intégrer DALL-E ou Stable Diffusion API
- [ ] Créer un prompt optimisé basé sur le titre de la recette
- [ ] Générer l'image (5-10s)
- [ ] Proposer à l'utilisateur : "Utiliser cette image ?"
- [ ] Limiter à X générations/mois pour free users

**Difficulté** : ⭐⭐⭐ (Complexe - IA externe)
**Impact** : 🔥🔥 Feature wow
**Temps estimé** : 2-3 jours

**Coût** :
- DALL-E 3 : ~€0.04 par image (1024x1024)
- Stable Diffusion : ~€0.002 par image

**Prompt exemple** :
```
A professional food photography of {recipe.title},
beautifully plated on a white ceramic plate,
garnished with fresh herbs, natural lighting,
top-down view, 4k resolution, highly detailed,
appetizing, restaurant quality
```

---

## 📊 Métriques & Monitoring (à implémenter)

### Analytics à tracker

- [ ] Nombre d'images uploadées par jour/semaine/mois
- [ ] Taux de succès/échec des uploads (%)
- [ ] Taille moyenne des images (KB)
- [ ] Temps moyen d'upload (secondes)
- [ ] Distribution des sources (caméra vs galerie)
- [ ] % de recettes avec image vs sans image

### Alertes à configurer

- [ ] Alerte si taux d'échec > 5%
- [ ] Alerte si temps d'upload > 10s (95th percentile)
- [ ] Alerte si storage quota dépassé (80% utilisé)
- [ ] Alerte si coûts Supabase Storage augmentent brutalement

### Logs structurés

```typescript
logger.info('recipe_image_uploaded', {
  userId,
  recipeId,
  imageSize: bytes.length,
  uploadDuration: Date.now() - startTime,
  mimeType: coverImage.photo.mimeType,
  source: 'camera' | 'gallery',
  success: true,
});
```

---

## 🧪 Tests (à ajouter)

### Unit Tests
- [ ] `CoverImagePicker.test.tsx` - Composant isolé
- [ ] `usePhotoImport.test.ts` - Hook de capture

### Integration Tests
- [ ] `preview.screen.test.tsx` - Upload dans le contexte complet
- [ ] `image.service.test.ts` - Service d'upload

### E2E Tests
- [ ] Ajouter image lors de l'import → Vérifier présence en BDD
- [ ] Supprimer image → Vérifier suppression du Storage
- [ ] Échec d'upload → Vérifier que la recette est quand même sauvegardée

### Performance Tests
- [ ] Temps d'upload pour 100 KB, 500 KB, 1 MB, 5 MB
- [ ] Mesurer l'impact sur la batterie (compression)

---

## 📝 Documentation (à compléter)

### User Documentation
- [ ] Créer un guide utilisateur avec screenshots
- [ ] Vidéo tutoriel : "Comment ajouter une image à une recette"
- [ ] FAQ sur les formats supportés, tailles limites, etc.

### Developer Documentation
- [ ] ✅ FEATURE-cover-image.md (fait)
- [ ] ✅ STORAGE-SETUP.md (mis à jour)
- [ ] Diagramme d'architecture (flux d'upload)
- [ ] API documentation si Edge Function créée

---

## 🚀 Roadmap

### Sprint 1 (Sécurité) - Semaine du 27 jan 2026
- [ ] Implémenter Edge Function sécurisée
- [ ] Validation côté serveur
- [ ] Tests de sécurité

### Sprint 2 (Quotas) - Semaine du 3 fév 2026
- [ ] Gestion des quotas utilisateur
- [ ] Affichage du quota dans le profil
- [ ] Monitoring des coûts

### Sprint 3 (UX) - Semaine du 10 fév 2026
- [ ] Éditeur d'image (crop + rotation)
- [ ] Barre de progression
- [ ] Retry automatique

### Sprint 4 (Advanced) - Semaine du 17 fév 2026
- [ ] Images multiples (galerie)
- [ ] Compression WebP
- [ ] Recherche Unsplash (optionnel)

---

## 💡 Idées en vrac (brainstorming)

- Permettre de prendre plusieurs photos et laisser l'IA choisir la meilleure
- Filtre Instagram-style (Valencia, Nashville, etc.)
- Partage de l'image sur les réseaux sociaux
- Watermark automatique "Made with Paprika"
- Détection automatique du plat (ML : "Ceci est un gâteau au chocolat")
- Suggestion de tags basée sur l'image (ML : reconnaître les ingrédients)
- Mode offline : Sauvegarder localement et synchroniser plus tard
- Compression adaptative selon la connexion (Wifi vs 4G)

---

**Dernière mise à jour** : 27 janvier 2026
**Maintenu par** : Équipe Paprika

**Note** : Ce fichier doit être mis à jour régulièrement au fur et à mesure de l'avancement.

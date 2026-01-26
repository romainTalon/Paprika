# Plan : Import de recettes par photo (Gemini Vision)

> **Statut** : ✅ Implémentée
> **Date** : 25 janvier 2026

## Objectif
Permettre aux utilisateurs de photographier une recette dans un livre de cuisine et de l'importer automatiquement via **Gemini Vision API** (Google).

---

## Pourquoi Gemini ?

| Critère | Claude Vision | Gemini Vision |
|---------|---------------|---------------|
| Coût image | ~€0.03/image | ~€0.001/image |
| Coût texte | €0.003-0.015/1K tokens | €0.0001-0.0004/1K tokens |
| **Total estimé** | **~€0.03/import** | **~€0.002/import** |

**Gemini est ~15x moins cher** pour le même usage.

---

## Architecture

```
Photo/Galerie → Compression → Base64 → Edge Function → Gemini Vision → Preview Screen → DB
```

**Choix** : Étendre l'Edge Function existante `recipe-import`.

---

## Fichiers à créer

| Fichier | Description |
|---------|-------------|
| `src/hooks/usePhotoImport.ts` | Hook caméra/galerie + compression |
| `src/components/recipe/PhotoImportModal.tsx` | Modal choix caméra/galerie |

---

## Fichiers à modifier

| Fichier | Modifications |
|---------|---------------|
| `supabase/functions/recipe-import/index.ts` | Import Gemini SDK + `parsePhotoWithGemini()` |
| `src/hooks/useRecipes.ts` | Ajouter param `imageBase64` à `useImportRecipe()` |
| `app/recipes/import.tsx` | Bouton "Import photo" + modal |
| `src/types/ai.ts` | Ajouter `"photo"` à `ImportStrategy` |

---

## Configuration

```bash
# Secret Supabase
supabase secrets set GOOGLE_API_KEY=your-api-key

# Dépendances frontend
npx expo install expo-image-picker expo-image-manipulator
```

---

## Coûts Freemium

| Type | Coût |
|------|------|
| URL (DeepSeek) | ~€0.001 |
| Photo (Gemini) | ~€0.002 |

Photos comptent dans le quota (5/mois gratuit).

---

## Ordre d'implémentation

1. Obtenir clé API Google AI Studio
2. Installer dépendances expo
3. Créer `usePhotoImport` hook
4. Ajouter secret `GOOGLE_API_KEY` à Supabase
5. Modifier Edge Function + `parsePhotoWithGemini()`
6. Créer `PhotoImportModal`
7. Modifier écran d'import
8. Tests iOS/Android

---

## Hors scope (v2)

- Recettes multi-pages
- Rotation/recadrage avancé
- OCR local

---

## Résumé d'implémentation

**Date de complétion** : 25 janvier 2026

### Modèle utilisé
- `gemini-2.0-flash` (Google Generative AI)
- Coût estimé : ~€0.002/import

### Problèmes rencontrés
1. **Quota 429** : Modèle `gemini-2.0-flash-exp` avait des limites strictes sur le free tier
2. **Models 1.5 retirés** : `gemini-1.5-flash` et `gemini-1.5-flash-latest` retournaient 404 (Google a retiré les modèles 1.5)
3. **expo-file-system deprecated** : `getInfoAsync()` deprecated dans Expo 54, remplacé par calcul de taille depuis base64

### Solution finale
- Modèle : `gemini-2.0-flash`
- API URL : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`
- Compression : 1024px max, JPEG quality 0.8 (~100-300KB)
- Taille fichier : Calculée depuis `base64.length * 0.75`

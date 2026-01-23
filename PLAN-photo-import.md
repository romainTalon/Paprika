# Plan : Import de recettes par photo (Gemini Vision)

> **Statut** : En attente d'implémentation
> **Date** : 23 janvier 2025

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

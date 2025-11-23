# Log des Décisions Architecturales - Paprika

*Traçabilité des choix techniques et business majeurs*

---

## Format des Entrées

```markdown
## YYYY-MM-DD - Titre de la Décision
**Contexte** : Situation qui a mené à cette décision
**Décision** : Ce qui a été décidé
**Raisons** :
- Raison 1
- Raison 2
**Alternatives considérées** : Options écartées
**Conséquences** : Impact attendu
**Statut** : ✅ Validée | 🔄 En révision | ❌ Annulée
```

---

## 2025-11-23 - Implémentation Écran Détail Recette (RecipeDetailScreen)

**Contexte** : L'écran de détail des recettes (`app/recipes/[id].tsx`) n'était qu'un placeholder. Besoin d'une vue complète pour consulter les recettes avec :
- Affichage de tous les détails (ingrédients, étapes, nutrition, métadonnées)
- Interaction pendant la cuisine (cocher ingrédients/étapes)
- Ajustement dynamique des portions
- Actions utilisateur (favori, modifier, supprimer)

**Décision** : **Implémentation complète d'un écran de lecture de recette interactif et optimisé pour la cuisine**

**Implémentation** :

1. **Structure de l'Écran** (759 lignes totales)
   - **Header** : Image hero (250px) + Titre + Bouton favori (❤️/🤍)
   - **Metadata Bar** : Portions (stepper), temps (prep/cook/total), difficulté
   - **Ingrédients** : Liste avec checkboxes interactives + quantités ajustées
   - **Étapes** : Liste numérotée avec checkboxes + strikethrough quand complétées
   - **Nutrition** : Card avec calories, protéines, glucides, lipides, fibres
   - **Footer** : Actions Modifier + Supprimer (sticky)

2. **Features Interactives**
   - **Servings Multiplier** (lines 257-283)
     - Stepper +/- 0.5 portions
     - Recalcul automatique quantités ingrédients en temps réel
     - `useMemo` pour performance (pas de re-render inutiles)
     - Exemple : 4 portions → 2 portions divise toutes les quantités par 2

   - **Interactive Checkboxes** (lines 335-407)
     - Ingrédients : Tap pour marquer comme utilisé pendant cuisine
     - Étapes : Tap pour marquer comme complétée
     - Visual feedback : strikethrough + opacity 0.5
     - State local avec `Set<number>` pour performance
     - Persiste pendant la session (perdu au unmount)

   - **Favorite Toggle** (lines 237-244, handler lines 46-52)
     - Bouton ❤️ (favori) / 🤍 (non-favori)
     - Optimistic UI via TanStack Query
     - `useToggleFavorite` hook avec cache invalidation

3. **Gestion des États** (lines 133-194)
   - **Loading** : Spinner centré avec BackButton
   - **Error** : Message d'erreur + bouton "Réessayer" avec `refetch()`
   - **Not Found** : 404 avec emoji 🔍 + bouton retour
   - Tous les états suivent le pattern du Design System

4. **Data Fetching & Mutations**
   ```typescript
   // Hooks utilisés (lines 24-38)
   const { data: recipe, isLoading, error, refetch } = useRecipe(recipeId, user?.id);
   const toggleFavorite = useToggleFavorite();
   const deleteRecipe = useDeleteRecipe();
   ```
   - `useRecipe` : Fetch avec cache (stale 5min)
   - `useToggleFavorite` : Mutation optimiste
   - `useDeleteRecipe` : Mutation avec invalidation query + navigation back

5. **Computed Values** (useMemo pour performance)
   - **adjustedIngredients** (lines 115-121) : Quantités × servingsMultiplier
   - **adjustedServings** (lines 123-126) : Portions arrondies
   - **totalTime** (lines 128-131) : prepTime + cookTime

6. **Formatage & Affichage**
   - **Temps** (lines 197-204) : `formatTime(150)` → "2h30", `formatTime(45)` → "45min"
   - **Difficulté** (lines 207-211) : "easy" → "Facile", "medium" → "Moyen", "hard" → "Difficile"
   - **Quantités** (line 360) : `toFixed(1).replace(/\.0$/, "")` → "2" au lieu de "2.0"
   - **Image fallback** (line 27) : Default Unsplash si pas de coverImageUrl

7. **Actions Utilisateur**
   - **Modifier** (lines 80-85) : Placeholder alert (TODO: edit screen)
   - **Supprimer** (lines 87-118)
     - Confirmation avec `Alert.alert` (2 boutons : Annuler / Supprimer)
     - Style "destructive" pour bouton rouge
     - Mutation `deleteRecipe.mutateAsync` avec params complets
     - Navigation `router.back()` après succès
     - Error handling avec alert

8. **Accessibilité**
   - `accessibilityRole="button"` sur tous les TouchableOpacity
   - `accessibilityLabel` descriptifs (ex: "Réduire les portions")
   - `accessibilityState={{ checked }}` sur checkboxes
   - Touch targets respectent minimum 44×44px (servings buttons 32×32 car groupés)

9. **Performance Optimizations**
   - Tous handlers avec `useCallback` (lines 46-118)
   - Computed values avec `useMemo` (lines 115-131)
   - TanStack Query cache (stale 5min, gc 30min)
   - Conditional rendering (sections nutrition, times, description)

**Patterns Techniques** :

```typescript
// Servings multiplier avec useMemo
const adjustedIngredients = useMemo(() => {
  if (!recipe?.ingredients) return [];
  return recipe.ingredients.map((ing) => ({
    ...ing,
    quantity: ing.quantity * servingsMultiplier,
  }));
}, [recipe?.ingredients, servingsMultiplier]);

// Checkbox state avec Set<number>
const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

const handleIngredientToggle = useCallback((index: number) => {
  setCheckedIngredients((prev) => {
    const next = new Set(prev);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    return next;
  });
}, []);

// Conditional rendering pour sections optionnelles
{recipe.nutrition && (
  <View style={styles.section}>
    <Text variant="h3">Informations nutritionnelles</Text>
    {/* ... */}
  </View>
)}
```

**Raisons** :
- ✅ **UX Cuisine** : Checkboxes permettent de suivre progression pendant la cuisine
- ✅ **Flexibility** : Multiplier portions adapte recette à nombre convives
- ✅ **Performance** : useMemo/useCallback évitent re-renders inutiles
- ✅ **Accessibility** : ARIA labels, touch targets, keyboard-friendly
- ✅ **Error Handling** : Loading, error, not found states couverts
- ✅ **Design System** : 100% theme tokens, aucune valeur hardcodée
- ✅ **Maintenability** : Code structuré, TypeScript strict, patterns cohérents

**Alternatives considérées** :
- **Servings : Input texte** : Moins intuitif qu'un stepper, risque saisie invalide
- **Checkboxes persistantes** : Complexe (DB updates), use-case limité (session suffit)
- **Sections pliables** : Over-engineering pour mobile, scroll simple suffit
- **Image carousel** : Pas de multi-images dans MVP, ajout futur possible
- **Bouton "Commencer à cuisiner"** : Mode séparé inutile, checkboxes suffisent

**Conséquences** :
- ✅ Navigation complète : Cookbooks → RecipeCard → RecipeDetail fonctionnelle
- ✅ CRUD recipes complet : Create (✅), Read (✅), Update (TODO), Delete (✅)
- 🔄 Edit screen needed : Action "Modifier" pointe vers placeholder
- 🔄 Meal plan integration : Bouton "Ajouter au planning" à implémenter
- 🔄 Share feature : Bouton "Partager" à implémenter (lien + image)

**Statut** : ✅ Validée

**Fichiers modifiés** :
- `app/recipes/[id].tsx` : Implémentation complète (21 lignes → 759 lignes)

---

## 2025-11-23 - Amélioration UX Création de Recettes Manuelles

**Contexte** : Après feedback utilisateur sur le formulaire de création de recettes, plusieurs problèmes UX critiques identifiés :
- **FAB croix décentrée** : Le bouton "+" flottant avait sa croix visuellement décalée verticalement
- **Temps seulement en minutes** : Saisir "120" pour 2 heures était contre-intuitif et source d'erreurs
- **Unité obligatoire** : Impossible de saisir "1 carotte" sans unité awkward ("pièce", "unité", etc.)
- **Pas de support fractions** : Saisir "0.5" au lieu de "1/2" peu naturel en cuisine
- **Validation différée** : Erreurs visibles seulement à la soumission, pas de feedback immédiat

**Décision** : **Refonte complète de l'UX du formulaire avec 5 améliorations majeures**

**Implémentation** :

1. **Fix FAB Icon Centering** (bug CSS)
   - Ajout `lineHeight: 36` au style `fabIcon` dans `app/cookbooks/[id].tsx`
   - Application du pattern existant déjà présent dans `CookbooksScreen.tsx`

2. **TimeStepper Component** (nouveau composant)
   - Fichier : `src/components/recipe/TimeStepper.tsx` (220 lignes)
   - Interface : 2 lignes de steppers (Heures / Minutes)
   - Boutons +/- : Heures (+/- 1h), Minutes (+/- 15min)
   - Conversion automatique : 2h30 → 150 minutes (stockage DB)
   - Design System complet + Accessibilité (ARIA labels, touch targets 44×44px)
   - Intégré dans `CreateRecipeScreen` pour `prepTime` et `cookTime`

3. **Unité Optionnelle pour Ingrédients**
   - **Validation** : `src/lib/validations/recipe.validation.ts`
     - `unit: z.string().max(20).optional().or(z.literal(""))`
   - **Interface** : `src/types/database.ts`
     - `unit?: string` (TypeScript optional)
   - **Composant** : `src/components/recipe/IngredientInput.tsx`
     - Placeholder changé : "Unité" → "Unité (opt.)"
     - Gestion `unit || undefined` pour stockage propre
   - **Initialisation** : `app/recipes/create.tsx`
     - `{ name: "", quantity: 0 }` (sans `unit: ""`)
   - Exemples valides : "1 carotte" (sans unité), "200 g farine" (avec unité)

4. **Support Fractions pour Quantités**
   - **Utilitaire** : `src/utils/fractionParser.ts` (140 lignes)
     - `parseFraction()` : "1/2" → 0.5, "1 1/2" → 1.5, "3/4" → 0.75
     - `formatFraction()` : 0.5 → "1/2", 1.5 → "1 1/2"
     - Support unicode (½, ¼, ¾, ⅓, ⅔, etc.)
     - Validation robuste (division par zéro, valeurs négatives)
   - **Intégration** : `IngredientInput.tsx`
     - State local `quantityText` pour saisie utilisateur
     - Parsing en temps réel avec `parseFraction()`
     - `keyboardType="default"` pour permettre "/"
     - Stockage en nombre décimal dans la DB

5. **Validation en Temps Réel**
   - **CreateRecipeScreen** : Ajout state `errors: Record<string, string>`
   - **Fonction** : `validateField(fieldName, value)` avec Zod
   - **Events** : `onChangeText` + `onBlur` pour validation immédiate
   - **UI** : Bordure rouge (`inputError`) + message d'erreur sous le champ
   - **Implémenté sur** : Champ titre (extensible à tous les champs)

**Ajustements UI** (feedback utilisateur) :
- Retrait hints inutiles sous champs ingrédients (conversion fractions, suggestions unités)
- Alignement hauteur inputs : `alignItems: "center"` pour ligne horizontale parfaite
- Suppression affichage "Total : X minutes" sous TimeStepper (redondant)

**Raisons** :
- ✅ **UX cuisine-friendly** : Fractions (1/2, 3/4) naturelles en cuisine
- ✅ **Temps intuitifs** : Stepper évite erreurs de calcul mental (120 min → 2h)
- ✅ **Flexibilité ingrédients** : "1 carotte" sans unité awkward
- ✅ **Feedback immédiat** : Validation temps réel réduit frustration utilisateur
- ✅ **Accessibilité** : Touch targets 44×44px, ARIA labels, keyboard-friendly
- ✅ **Performance** : Validation locale (pas d'appels réseau)
- ✅ **Maintenabilité** : Composants réutilisables (TimeStepper, fractionParser)

**Alternatives considérées** :
- **Temps : Champ texte intelligent ("2h30")** : Parsing ambigu ("230" = 2h30 ou 230min ?)
- **Temps : Dropdown prédéfini** : Limitant pour recettes longues (pain, mijotés)
- **Unité : Liste prédéfinie uniquement** : Rigide, ne couvre pas tous les cas
- **Unité : Autocomplete** : Plus complexe à implémenter, bénéfice marginal
- **Fractions : Boutons ½ ¼ ¾** : Limité aux fractions communes
- **Validation : Seulement à la soumission** : Mauvaise UX moderne

**Fichiers Créés** (2) :
- `src/utils/fractionParser.ts` (140 lignes)
- `src/components/recipe/TimeStepper.tsx` (220 lignes)

**Fichiers Modifiés** (7) :
- `app/cookbooks/[id].tsx` : Fix FAB lineHeight
- `src/lib/validations/recipe.validation.ts` : Unit optional
- `src/types/database.ts` : Interface unit optional
- `src/components/recipe/IngredientInput.tsx` : Fractions + unit optional + UI cleanup
- `src/components/recipe/index.ts` : Export TimeStepper
- `app/recipes/create.tsx` : TimeStepper integration + validation temps réel + unit initialization fix

**Pattern d'Utilisation - TimeStepper** :
```tsx
import { TimeStepper } from "@/components/recipe";

<TimeStepper
  label="Temps de préparation"
  value={prepTime} // number | undefined (minutes)
  onChange={setPrepTime}
/>
```

**Pattern d'Utilisation - Fractions** :
```tsx
import { parseFraction } from "@/utils/fractionParser";

const handleQuantityChange = (text: string) => {
  const parsed = parseFraction(text); // "1/2" → 0.5
  if (parsed !== null) {
    setQuantity(parsed);
  }
};
```

**Conséquences** :
- Expérience création recettes significativement améliorée
- Réduction taux d'abandon formulaire (feedback immédiat)
- Données plus cohérentes (fractions converties en décimales)
- Pattern établi pour futurs formulaires (EditRecipeScreen, etc.)
- Compatibilité ascendante : recettes existantes avec unité fonctionnent toujours

**Tests Effectués** :
- ✅ FAB croix centrée (iOS + Android)
- ✅ Stepper temps : incréments/décréments corrects
- ✅ Conversion temps : 2h30 = 150 min en DB
- ✅ Ingrédient sans unité : "1 carotte" sauvegarde OK
- ✅ Ingrédient avec unité : "200 g farine" sauvegarde OK
- ✅ Fractions : "1/2" → 0.5, "3/4" → 0.75 en DB
- ✅ Validation temps réel : erreur affichée immédiatement
- ✅ Bouton submit : activé quand formulaire valide (unit optional pris en compte)

**Statut** : ✅ Validée et déployée

**Ressources** :
- [React Native useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions) (pour responsive futur)
- [Zod Validation](https://zod.dev/) (validation temps réel)
- [iOS Human Interface Guidelines - Touch Targets](https://developer.apple.com/design/human-interface-guidelines/ios/visual-design/adaptivity-and-layout/)

---

## 2025-11-23 - Correction Emojis Croppés et Responsivité Écrans Onboarding

**Contexte** : Après review des écrans d'onboarding, plusieurs problèmes de qualité visuelle identifiés :
- **Emojis dans illustrations croppés** : Les emojis 📱✨, 🔗📋, et 📅🛒 étaient coupés verticalement dans les boxes d'illustration
- **Tailles fixes non responsives** : Les emojis et illustrations utilisaient des tailles hardcodées (80px, 200px) qui ne s'adaptaient pas aux petits écrans (iPhone SE, Android compact)
- **Fix précédent incomplet** : Le fix du 19 novembre avait corrigé les emojis principaux mais pas ceux des illustrations

**Décision** : **Appliquer le fix emoji à TOUS les emojis + rendre les écrans responsive avec `useWindowDimensions`**

**Implémentation** :

1. **Fix Emoji Cropping** (6 emojis corrigés) :
   - **step1.tsx** : `illustrationEmoji` (📱✨) → `fontSize: 64, lineHeight: 72` (ajouté)
   - **step2.tsx** : `illustrationEmoji` (🔗📋) → `fontSize: 48, lineHeight: 56` (ajouté)
   - **step3.tsx** : `illustrationEmoji` (📅🛒) → `fontSize: 48, lineHeight: 56` (ajouté)
   - **Règle appliquée** : `lineHeight = fontSize + 8px minimum` (docs/08-frontend-guidelines.md)

2. **Responsive Design avec `useWindowDimensions`** :
   ```typescript
   const { width, height } = useWindowDimensions();

   // Seuil : hauteur < 700px (iPhone SE = 667px)
   const isSmallScreen = height < 700;
   const emojiSize = isSmallScreen ? 64 : 80;
   const illustrationSize = isSmallScreen ? 160 : 200;
   const illustrationEmojiSize = isSmallScreen ? 40/48 : 48/64;
   ```

3. **Styles Dynamiques** :
   - Tailles emoji calculées en runtime : `fontSize: emojiSize, lineHeight: emojiSize + 8`
   - Illustrations adaptatives : `width: illustrationSize, height: illustrationSize`
   - Suppression des tailles hardcodées dans StyleSheet

**Raisons** :
- ✅ **Qualité visuelle** : Emojis complets, non croppés sur tous les écrans
- ✅ **Responsive** : Adaptation automatique iPhone SE, iPhone 8, petits Android
- ✅ **Cohérence** : Même règle emoji appliquée partout (principal + illustrations)
- ✅ **Performance** : `useWindowDimensions` hook natif React Native (0 overhead)
- ✅ **Maintenabilité** : Tailles centralisées dans constantes, facile à ajuster
- ✅ **Conformité Guidelines** : Suit docs/08-frontend-guidelines.md section 3.2 "Responsive Design"

**Alternatives considérées** :
- **Augmenter lineHeight statiquement** : Ne résout pas le problème de responsivité
- **Media queries CSS** : Non supporté nativement par React Native
- **Dimensions.get('window')** : Ne se met pas à jour lors de rotation/changement
- **useWindowDimensions** (choisi) : Hook natif, reactive, optimal

**Tailles Adaptatives** :

| Élément | Écran Normal (≥700px) | Petit Écran (<700px) | Économie |
|---------|----------------------|---------------------|----------|
| Emoji principal | 80px + lineHeight 88 | 64px + lineHeight 72 | -20% |
| Illustration (box) | 200×200px | 160×160px | -20% |
| Emoji illustration (step1) | 64px + lineHeight 72 | 48px + lineHeight 56 | -25% |
| Emoji illustration (step2/3) | 48px + lineHeight 56 | 40px + lineHeight 48 | -17% |

**Fichiers Modifiés** :
- `app/onboarding/step1.tsx` : Import hook + responsive logic + styles dynamiques
- `app/onboarding/step2.tsx` : Import hook + responsive logic + styles dynamiques
- `app/onboarding/step3.tsx` : Import hook + responsive logic + styles dynamiques

**Pattern d'Utilisation** :
```tsx
// Pattern recommandé pour styles responsive avec emojis
import { useWindowDimensions } from "react-native";

export default function Screen() {
  const { width, height } = useWindowDimensions();
  const isSmallScreen = height < 700;
  const emojiSize = isSmallScreen ? 64 : 80;

  return (
    <Text style={{
      fontSize: emojiSize,
      lineHeight: emojiSize + 8, // Toujours +8px minimum
    }}>
      🍳
    </Text>
  );
}
```

**Conséquences** :
- Expérience onboarding améliorée sur tous les formats d'écran
- Standard établi pour tous les futurs écrans avec emojis
- Conformité totale avec guidelines design system
- Pattern réutilisable pour autres écrans (RecipeDetailScreen, etc.)

**Tests Recommandés** :
- iPhone SE (667 × 375px) → Devrait utiliser tailles réduites
- iPhone 14 (844 × 390px) → Devrait utiliser tailles normales
- Android Pixel 3a (720 × 360px) → Devrait utiliser tailles réduites
- Vérification visuelle : emojis complets, pas de débordement

**Statut** : ✅ Validée

**Ressources** :
- [React Native useWindowDimensions](https://reactnative.dev/docs/usewindowdimensions)
- [docs/08-frontend-guidelines.md](./docs/08-frontend-guidelines.md) - Section 2.1.4 "Emojis - Gestion du Crop Vertical"
- [docs/08-frontend-guidelines.md](./docs/08-frontend-guidelines.md) - Section 3.2 "Responsive Design"

---

## 2025-11-19 - Ajout du Composant BackButton pour Navigation Inter-Écrans

**Contexte** : Après implémentation de la navigation Safe Areas, feedback utilisateur concernant l'absence d'indicateurs visuels pour la navigation :
- Aucun moyen visuel clair de revenir en arrière quand on navigue dans un cookbook
- Même problème sur l'écran de paramètres (Settings)
- Idem sur l'écran de création de recette
- Navigation confuse pour utilisateurs peu familiers avec les gestes iOS/Android

**Décision** : **Créer un composant BackButton réutilisable** pour tous les écrans standalone

**Implémentation** :

1. **Nouveau Composant** : `src/components/navigation/BackButton.tsx`
   - Bouton "← Retour" avec style cohérent du design system
   - Comportement par défaut : `router.back()`
   - Props optionnelles :
     - `onPress?` : Handler personnalisé
     - `label?` : Texte personnalisé (défaut : "← Retour")
     - `style?` : Style override
   - Accessibilité complète (`accessibilityLabel`, `accessibilityRole`)

2. **Intégration dans les Écrans** :
   - `app/cookbooks/[id].tsx` : Tous les états (loading, error, empty, main)
   - `app/settings/index.tsx` : En haut du ScrollView
   - `app/recipes/create.tsx` : En haut du formulaire

3. **Export** : Ajouté dans `src/components/navigation/index.ts`

**Raisons** :
- ✅ **UX améliorée** : Indicateur visuel clair pour revenir en arrière
- ✅ **Cohérence** : Même comportement sur tous les écrans standalone
- ✅ **Accessibilité** : Support des lecteurs d'écran
- ✅ **Maintenabilité** : Composant réutilisable, pas de duplication
- ✅ **Design System** : Utilise les tokens (colors, spacing) existants
- ✅ **Flexibilité** : Props permettent la personnalisation si nécessaire

**Alternatives considérées** :
- **Bouton natif iOS/Android** : Pas de contrôle sur le style, inconsistant cross-platform
- **Header personnalisé par écran** : Duplication de code, maintenance difficile
- **Geste swipe uniquement** : Non découvrable, pas accessible
- **Icône sans texte** : Moins clair pour utilisateurs non techniques

**Pattern d'Utilisation** :
```tsx
// Pattern recommandé pour écrans standalone
import { BackButton } from "@/components/navigation";

export default function StandaloneScreen() {
  return (
    <Container useSafeArea>
      <BackButton />
      {/* Contenu de l'écran */}
    </Container>
  );
}
```

**Conséquences** :
- Navigation inter-écrans plus intuitive et claire
- Réduction du taux d'abandon sur écrans standalone
- Pattern établi pour tous les futurs écrans
- Code facilement testable et maintenable

**Statut** : ✅ Validée

**Ressources** :
- [Expo Router Navigation](https://docs.expo.dev/router/navigating-pages/)
- [docs/08-frontend-guidelines.md](./docs/08-frontend-guidelines.md) - Section Navigation

---

## 2025-11-19 - Gestion des Safe Areas et Responsive iOS/Android

**Contexte** : Après implémentation des premiers écrans, plusieurs problèmes de responsive identifiés :
- Header AppHeader affiché sous la status bar iPhone (icônes wifi/batterie/heure recouvrant le logo)
- Écrans Settings, Create Recipe, et Recipe List avec contenu coupé en haut
- Emojis croppés (coupés verticalement) partout dans l'application

**Décision** : **Standardisation de la gestion des Safe Areas** avec `react-native-safe-area-context`

**Solutions Implémentées** :

1. **SafeAreaProvider Global** (app/_layout.tsx)
   - Wrapper racine obligatoire pour tout le reste
   - Active les safe areas pour toute l'app

2. **AppHeader avec SafeAreaView** (src/components/navigation/AppHeader.tsx)
   - SafeAreaView avec `edges={["top"]}` uniquement
   - Respecte le notch/Dynamic Island/status bar iOS

3. **Container avec Support SafeAreaView** (src/components/ui/Container.tsx)
   - Nouveau prop `useSafeArea?: boolean` (défaut: false)
   - Nouveau prop `safeAreaEdges?: ("top" | "right" | "bottom" | "left")[]`
   - Rendu conditionnel : SafeAreaView ou View selon le contexte

4. **Règle de Gestion par Type d'Écran** :
   - **Écrans dans les tabs** → PAS de useSafeArea (header AppHeader géré)
   - **Écrans auth/onboarding** → useSafeArea={true} (tous edges)
   - **Écrans standalone** → useSafeArea={true} OU SafeAreaView direct

5. **Correction Emojis Croppés** :
   - Ajout de `lineHeight` supérieur au `fontSize` pour tous les emojis
   - Ratio appliqué : lineHeight = fontSize + 8px minimum
   - 48px → 56px | 64px → 72px | 80px → 88px

**Raisons** :
- ✅ **Support iPhone moderne** : Notch, Dynamic Island, status bar
- ✅ **Support Android** : Status bar, navigation bar
- ✅ **Cohérence visuelle** : Tous les écrans respectent les zones sûres
- ✅ **Maintenabilité** : Pattern clair selon le type d'écran
- ✅ **Performance** : Pas de double wrapping inutile (tabs)
- ✅ **Flexibilité** : Container avec props optionnelles pour cas spéciaux

**Alternatives considérées** :
- **SafeAreaView partout** : Surcharge inutile dans les tabs (double safe area)
- **Padding manuel** : Non responsive, ne s'adapte pas aux devices
- **StatusBar height calculation** : Complexe, fragile, non maintenable

**Structure Finale** :
```
SafeAreaProvider (app/_layout.tsx)
  ├─ Tab Navigation
  │   ├─ AppHeader (SafeAreaView edges:["top"])
  │   └─ Tab Screens (Container sans useSafeArea)
  │
  ├─ Auth/Onboarding (Container useSafeArea)
  │
  └─ Standalone Screens
      ├─ Settings (SafeAreaView direct)
      ├─ Create Recipe (SafeAreaView direct)
      └─ Recipe List (Container useSafeArea)
```

**Écrans Corrigés** (17 fichiers) :
- AppHeader (SafeAreaView)
- Container (support useSafeArea)
- AuthFormContainer (useSafeArea par défaut)
- PlaceholderScreen (useSafeArea)
- 3 écrans auth (login, signup, forgot-password)
- 3 écrans onboarding (step1, step2, step3)
- 4 écrans standalone (index, settings, create recipe, recipe list)
- 3 composants UI (RecipeCard, CookbooksScreen emojis, PlaceholderScreen)

**Conséquences** :
- Interface parfaitement responsive sur tous les devices
- Expérience utilisateur cohérente iOS/Android
- Pattern clair pour futurs écrans (voir docs/08-frontend-guidelines.md)
- Maintenance facilitée

**Statut** : ✅ Validée

**Ressources** :
- [react-native-safe-area-context](https://github.com/th3rdwave/react-native-safe-area-context)
- [docs/08-frontend-guidelines.md](./docs/08-frontend-guidelines.md) - Section Safe Areas

---

## 2025-11-03 - Choix de Drizzle ORM au lieu de Prisma

**Contexte** : Besoin d'un ORM type-safe pour interagir avec PostgreSQL de manière sécurisée

**Décision** : Utiliser **Drizzle ORM** comme couche d'abstraction database

**Raisons** :
- ✅ Plus léger : **40KB** vs Prisma **300KB** (réduction 87%)
- ✅ Meilleure inférence TypeScript automatique (pas besoin de `npx prisma generate`)
- ✅ Queries plus performantes (génération SQL optimisé)
- ✅ SQL-like syntax plus intuitive pour développeurs expérimentés
- ✅ Migrations versionnées similaires à Prisma
- ✅ Compatible avec Supabase et Edge Functions

**Alternatives considérées** :
- **Prisma** : Plus populaire mais plus lourd, génération de types moins pratique
- **TypeORM** : Trop complexe, decorators verbeux, maintenance incertaine
- **Kysely** : Excellent mais moins mature, moins de ressources communautaires

**Conséquences** :
- Bundle size réduit = app plus rapide
- Courbe d'apprentissage légèrement plus raide (moins de ressources que Prisma)
- Meilleure DX avec inférence automatique des types

**Statut** : ✅ Validée

**Ressources** :
- [Drizzle vs Prisma Benchmark](https://orm.drizzle.team/benchmarks)
- [Drizzle Documentation](https://orm.drizzle.team)

---

## 2025-11-03 - Stratégie Freemium sans Trial

**Contexte** : Choix du modèle de monétisation pour maximiser croissance et revenus

**Décision** : **Freemium généreux sans demande de carte bancaire** à l'inscription

**Raisons** :
- ✅ **3x plus de conversions** vs trial avec CB (simulation : 60 vs 20 users premium)
- ✅ **Zéro friction** à l'inscription = taux de téléchargement 10x supérieur
- ✅ Croissance organique par bouche-à-oreille (utilisateurs free deviennent ambassadeurs)
- ✅ Base utilisateurs large pour itérer rapidement sur le produit
- ✅ Upgrade naturel quand limite atteinte (moment de forte valeur perçue)
- ✅ Permet A/B testing à grande échelle sur onboarding

**Alternatives considérées** :
- **Trial 7 jours avec CB** : Friction trop forte, 95% de perte à l'inscription
- **Paywall immédiat** : Incompatible avec discovery, personne ne paie sans essayer
- **Freemium limité dans le temps** : Frustration utilisateur, mauvaise réputation

**Limites Free** :
- 2 cookbooks (suffisant pour tester, frustrant après 1 mois)
- 20 recettes (2-3 semaines d'usage normal)
- 5 imports IA/mois (coût maîtrisé : €0.05/user, renouvellement mensuel = trigger upgrade récurrent)
- Meal planning illimité (feature différenciante, crée engagement, coût nul)

**Conversion attendue** :
- 10-15% free → premium après 30 jours
- LTV premium : €50+ (10 mois d'abonnement moyen)

**Conséquences** :
- Acquisition plus lente au démarrage (besoin de volume pour convertir)
- Support client plus élevé (base utilisateurs free importante)
- Coûts variables proportionnels aux utilisateurs gratuits

**Statut** : ✅ Validée

**Ressources** :
- [docs/06-freemium-strategy.md](./docs/06-freemium-strategy.md)

---

## 2025-11-03 - Import IA Hybride (3 Stratégies)

**Contexte** : Import de recettes depuis le web peu fiable avec approche JSON-LD uniquement

**Décision** : **Approche hybride avec 3 stratégies en cascade** :
1. **Stratégie 1** : JSON-LD extraction (gratuit, rapide)
2. **Stratégie 2** : LLM + HTML scraping (Claude 3.5 Sonnet)
3. **Stratégie 3** : Vision AI screenshot (Claude Vision)

**Raisons** :
- ✅ **95%+ taux de succès** (vs 70% avec JSON-LD seul)
- ✅ Fonctionne sur **n'importe quel site** (pas seulement les gros sites avec JSON-LD)
- ✅ Coût maîtrisé : ~**$0.01-0.03** par import (JSON-LD gratuit capte 70%)
- ✅ Fallbacks intelligents : si JSON-LD échoue → LLM → Vision AI
- ✅ Extraction complète : ingrédients, étapes, temps, portions, images, tags
- ✅ Qualité constante grâce à validation Zod

**Alternatives considérées** :
- **Scraping pur (Cheerio)** : Fragile, nécessite patterns par site, maintenance lourde
- **IA uniquement** : Coûteux ($0.10+ par import), overkill pour sites avec JSON-LD
- **OCR Google Vision** : Moins précis que Claude Vision, coût similaire

**Architecture** :
```typescript
async function importRecipeFromURL(url: string) {
  // Stratégie 1: JSON-LD (70% succès)
  const jsonLD = await extractJSONLD(url);
  if (isValid(jsonLD)) return jsonLD;

  // Stratégie 2: LLM + HTML (20% succès)
  const html = await fetchHTML(url);
  const llmResult = await claudeParseHTML(html);
  if (isValid(llmResult)) return llmResult;

  // Stratégie 3: Vision AI (5% succès)
  const screenshot = await captureScreenshot(url);
  const visionResult = await claudeVision(screenshot);
  return visionResult;
}
```

**Coûts par stratégie** :
- JSON-LD : €0 (gratuit)
- LLM + HTML : ~€0.01 (4K tokens input)
- Vision AI : ~€0.03 (1 image 1920x1080)

**Conséquences** :
- Complexité technique accrue (3 stratégies à maintenir)
- Dépendance à Anthropic Claude (vendor lock-in)
- Coûts variables selon mix de stratégies utilisées
- Besoin de monitoring et analytics pour optimiser

**Statut** : ✅ Validée

**Ressources** :
- [docs/02-tech-stack.md](./docs/02-tech-stack.md#intelligence-artificielle)

---

## 2025-11-03 - React Native + Expo au lieu de Flutter

**Contexte** : Choix du framework mobile cross-platform

**Décision** : **React Native 0.76+ avec Expo 52+**

**Raisons** :
- ✅ Écosystème JavaScript/TypeScript (courbe d'apprentissage nulle)
- ✅ **Expo** simplifie drastiquement le développement mobile (OTA updates, EAS Build)
- ✅ Librairies tierces excellentes (NativeWind, React Query, Zustand)
- ✅ Hot reload ultra-rapide (Fast Refresh)
- ✅ Communauté massive, ressources abondantes
- ✅ Interopérabilité avec web si besoin futur (React Native Web)
- ✅ Performance native suffisante pour une app de contenu

**Alternatives considérées** :
- **Flutter** : Excellente performance mais Dart moins mainstream, moins de libs tierces
- **Native (Swift + Kotlin)** : Performance maximale mais 2x le travail, maintenance lourde
- **Ionic/Capacitor** : WebView moins performant, UX moins native

**Conséquences** :
- Dépendance à l'écosystème React Native
- Quelques compromis performance vs natif (mais négligeables pour notre use case)
- Updates Expo parfois breaking (mitigation : versioning strict)

**Statut** : ✅ Validée

---

## 2025-11-03 - Supabase au lieu de Firebase

**Contexte** : Choix de la plateforme Backend-as-a-Service

**Décision** : **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)

**Raisons** :
- ✅ **PostgreSQL** relationnel (vs NoSQL Firebase) = meilleur pour notre modèle de données
- ✅ **SQL natif** = queries complexes faciles (joins, aggregations)
- ✅ **Drizzle ORM** compatible (Firebase nécessite SDK propriétaire)
- ✅ **Row Level Security** natif (sécurité au niveau DB)
- ✅ **Open-source** (auto-hébergeable si besoin futur)
- ✅ Pricing transparent et prévisible
- ✅ Edge Functions Deno (TypeScript natif, moderne)
- ✅ Realtime WebSocket natif
- ✅ Storage S3-compatible

**Alternatives considérées** :
- **Firebase** : NoSQL moins adapté, vendor lock-in Google, pricing imprévisible
- **AWS Amplify** : Trop complexe, overkill pour MVP
- **Custom Backend (NestJS + RDS)** : Maintenance lourde, coûts infra élevés

**Coûts Supabase** :
- **Free tier** : 500MB DB, 1GB storage, 2M Edge Functions executions
- **Pro tier** : €25/mois (suffisant jusqu'à ~10K users)

**Conséquences** :
- Vendor lock-in Supabase (mitigation : PostgreSQL standard = migration possible)
- Limites Edge Functions (10s timeout, 2MB payload)
- Besoin de compétences PostgreSQL

**Statut** : ✅ Validée

---

## 2025-11-07 - StyleSheet Natif + Design System au lieu de NativeWind

**Contexte** : NativeWind v4 instable avec Expo 54, problèmes de configuration et incompatibilités de versions pendant le setup initial.

**Décision** : **React Native StyleSheet natif** avec un Design System structuré (`src/theme/` + composants UI réutilisables)

**Raisons** :
- ✅ **Stabilité maximale** : Pas de problèmes de configuration ou breaking changes
- ✅ **Performance native** : StyleSheet compilé au build time, zéro overhead
- ✅ **Type-safety** : TypeScript fonctionne parfaitement avec StyleSheet
- ✅ **Production-ready** : Approche standard et éprouvée React Native
- ✅ **Debugging facile** : Moins de couches d'abstraction
- ✅ **Bundle size** : Aucune dépendance supplémentaire
- ✅ **Design System réutilisable** : `theme/` + composants UI = expérience similaire à Tailwind

**Alternatives considérées** :
- **NativeWind v4** : Problèmes d'incompatibilité avec Expo 54, configuration complexe
- **Styled Components** : Runtime overhead, bundle plus lourd
- **Tamagui** : Excellent mais trop opinionated, courbe d'apprentissage

**Architecture du Design System** :
```
src/
├── theme/
│   ├── colors.ts       # Palette Warm & Cozy
│   ├── spacing.ts      # Système d'espacement (4px base)
│   ├── typography.ts   # Tailles, poids, line heights
│   ├── shadows.ts      # Ombres pré-définies
│   └── index.ts        # Export centralisé
└── components/ui/
    ├── Text.tsx        # Composant Text avec variants
    ├── Button.tsx      # Composant Button réutilisable
    ├── Container.tsx   # Conteneur principal
    └── index.ts
```

**Exemple d'utilisation** :
```tsx
// ✅ Avec Design System (simple et propre)
import { Container, Text, Button } from "@/components/ui";
import { spacing } from "@/theme";

<Container centered>
  <Text variant="h1" color="primary">
    🍳 Paprika
  </Text>
  <Button variant="primary" size="lg" style={{ marginTop: spacing.xl }}>
    Commencer
  </Button>
</Container>
```

**Migration future** :
- Possible de passer à NativeWind v5 quand stable
- Ou rester avec StyleSheet (excellent pour MVP et production)

**Conséquences** :
- Plus verbeux pour styles complexes (mais composants UI compensent)
- Besoin de maintenir le Design System (mais structure claire)
- Meilleure stabilité = développement plus rapide

**Statut** : ✅ Validée

**Ressources** :
- [docs/09-design-system.md](./docs/09-design-system.md)
- Design System original : [docs/07-ui-guidelines.md](./docs/07-ui-guidelines.md)

---

## 2025-11-18 - Mapping snake_case/camelCase dans les Services

**Contexte** : Supabase/PostgreSQL utilise snake_case pour les noms de colonnes (`user_id`, `cover_image_url`) mais TypeScript/React utilise camelCase (`userId`, `coverImageUrl`). Les services renvoyaient des données brutes sans transformation, causant des erreurs.

**Décision** : Implémenter des **fonctions de mapping** dans chaque service pour transformer automatiquement les données entre snake_case (DB) et camelCase (app).

**Raisons** :
- ✅ **Type safety** : Le code TypeScript attend des types camelCase cohérents
- ✅ **Consistance** : Toute l'application utilise camelCase (convention React/JS)
- ✅ **DX améliorée** : Autocomplétion fonctionne correctement
- ✅ **Maintenance** : Un seul endroit pour gérer la transformation
- ✅ **Évolutivité** : Facile d'ajouter de nouveaux champs transformés

**Implémentation** :
```typescript
// Exemple dans CookbookService
function mapDbRowToCookbook(row: any): Cookbook {
  return {
    id: row.id,
    userId: row.user_id,  // snake_case → camelCase
    name: row.name,
    coverImageUrl: row.cover_image_url,  // snake_case → camelCase
    isDefault: row.is_default,  // snake_case → camelCase
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// Utilisé dans chaque méthode de récupération
const { data, error } = await supabase.from("cookbooks").select("*");
return { data: data?.map(mapDbRowToCookbook) || [], error: null };
```

**Services impactés** :
- ✅ CookbookService - `mapDbRowToCookbook()`
- ✅ RecipeService - `mapDbRowToRecipe()`
- ⏳ MealPlanService (à venir)
- ⏳ GroceryListService (à venir)

**Alternatives considérées** :
- **Supabase PostgREST snake_case config** : Ne fonctionne pas avec RLS policies
- **Drizzle camelCase plugin** : Pas encore stable pour Supabase
- **Pas de transformation** : TypeScript errors partout, mauvaise DX

**Conséquences** :
- Légère overhead de transformation (~1-2ms par objet, négligeable)
- Code plus maintenable et type-safe
- Pattern à répéter pour chaque nouveau service

**Statut** : ✅ Validée

---

## 2025-11-18 - Fix React Hooks Order dans RecipeListScreen

**Contexte** : Erreur "Rendered more hooks than during the previous render" causée par des hooks (`useCallback`) appelés **après** des `return` conditionnels dans `CookbookDetailScreen`.

**Décision** : **Déplacer tous les hooks avant les conditions de return**, respectant strictement les Rules of Hooks de React.

**Raisons** :
- ✅ **Règle fondamentale React** : Les hooks doivent TOUJOURS être appelés dans le même ordre
- ✅ **Stabilité** : Évite les bugs de re-render imprévisibles
- ✅ **Best practice** : Pattern standard React

**Avant (❌ Incorrect)** :
```typescript
const data = useQuery(...)
const mutation = useMutation(...)

if (loading) return <Loading />  // ⚠️ Early return

const handler = useCallback(...)  // ❌ Pas toujours appelé !
```

**Après (✅ Correct)** :
```typescript
const data = useQuery(...)
const mutation = useMutation(...)
const handler = useCallback(...)  // ✅ Toujours appelé

// Conditional returns APRÈS tous les hooks
if (loading) return <Loading />
```

**Pattern appliqué** :
1. Tous les hooks au début (useState, useQuery, useMutation, useCallback, etc.)
2. Logique et calculs
3. Conditions de return (loading, error, empty state)
4. Render principal

**Conséquences** :
- Pattern plus verbeux mais plus sûr
- À appliquer systématiquement dans tous les composants
- Ajouter ce pattern au linter/ESLint si possible

**Statut** : ✅ Validée

**Ressources** :
- [Rules of Hooks - React Docs](https://react.dev/reference/rules/rules-of-hooks)

---

## 2025-11-18 - Validation Zod pour formulaires de recettes

**Contexte** : Besoin de valider des formulaires complexes avec listes dynamiques (ingrédients, étapes) avant soumission à l'API.

**Décision** : Utiliser **Zod** pour la validation côté client avec messages d'erreur en français.

**Raisons** :
- ✅ **Type inference** : Types TypeScript automatiques depuis les schémas
- ✅ **Composabilité** : Schémas réutilisables (ingredient, step, recipe)
- ✅ **DX excellente** : Erreurs claires et localisées
- ✅ **Bundle size** : Léger (~8KB gzippé)
- ✅ **Déjà installé** : Utilisé ailleurs dans le projet

**Schémas créés** :
```typescript
// src/lib/validations/recipe.validation.ts
export const recipeIngredientSchema = z.object({
  name: z.string().min(1, "Le nom de l'ingrédient est requis"),
  quantity: z.number().positive("La quantité doit être positive"),
  unit: z.string().min(1, "L'unité est requise"),
});

export const recipeStepSchema = z.object({
  order: z.number().int().positive(),
  instruction: z.string().min(5, "L'instruction doit contenir au moins 5 caractères"),
});

export const createRecipeSchema = z.object({
  title: z.string().min(1, "Le titre est requis").max(200),
  ingredients: z.array(recipeIngredientSchema).min(1, "Au moins un ingrédient requis"),
  steps: z.array(recipeStepSchema).min(1, "Au moins une étape requise"),
  // ... autres champs
});
```

**Utilisation** :
```typescript
try {
  const validated = createRecipeSchema.parse(formData);
  await createRecipe.mutateAsync(validated);
} catch (error) {
  if (error instanceof z.ZodError) {
    Alert.alert("Validation", error.issues[0].message);
  }
}
```

**Alternatives considérées** :
- **Yup** : Plus lourd, moins bon TypeScript inference
- **Joi** : Pas adapté au frontend (trop gros)
- **Validation manuelle** : Fastidieux, pas de types automatiques

**Conséquences** :
- Messages d'erreur clairs pour l'utilisateur
- Moins d'appels API invalides
- Types garantis à la compilation
- Pattern à réutiliser pour tous les formulaires

**Statut** : ✅ Validée

---

## 2025-11-03 - Anthropic Claude au lieu d'OpenAI GPT

**Contexte** : Choix du LLM pour parsing recettes et nutrition

**Décision** : **Anthropic Claude 3.5 Sonnet** comme LLM principal

**Raisons** :
- ✅ **Context window** : 200K tokens (vs GPT-4o 128K) = meilleur pour HTML long
- ✅ **Vision AI** : Claude Vision excellent pour screenshots de recettes
- ✅ **Structured outputs** : JSON parsing fiable
- ✅ **Coût** : $3/M input tokens (vs GPT-4o $2.50 mais moins bon)
- ✅ **Latence** : ~2-3s pour parsing HTML (acceptable)
- ✅ **Safety** : Moins de refus injustifiés que GPT

**Alternatives considérées** :
- **OpenAI GPT-4o** : Excellent aussi mais context window plus court
- **Google Gemini** : Moins mature, API moins stable
- **Open-source (Llama 3)** : Coûts hosting > coûts API, maintenance lourde

**Coûts Claude 3.5 Sonnet** :
- Input : $3 / 1M tokens (~€0.003 / 1K tokens)
- Output : $15 / 1M tokens (~€0.015 / 1K tokens)
- Import HTML moyen : 4K tokens input + 1K output = **~€0.01**
- Vision AI : 1 image = **~€0.03**

**Conséquences** :
- Vendor lock-in Anthropic (mitigation : abstraction layer pour swap facile)
- Coûts proportionnels au volume d'imports
- Dépendance à l'uptime d'Anthropic

**Statut** : ✅ Validée

**Fallback** : Si coûts trop élevés, passer à GPT-4o mini ($0.15/1M) avec légère baisse de qualité

---

## 2025-11-03 - OpenFoodFacts au lieu de USDA FoodData Central

**Contexte** : Choix de l'API nutritionnelle pour calculs automatiques

**Décision** : **OpenFoodFacts** comme base nutritionnelle principale

**Raisons** :
- ✅ **Gratuit** : 0 coût, pas de limite d'API
- ✅ **2M+ produits** : Excellent coverage international
- ✅ **Focus France** : Produits français très bien couverts (notre marché principal)
- ✅ **Open-source** : Communauté active, data quality élevée
- ✅ **Multilingue** : Support FR, EN, ES, etc.
- ✅ **Nutri-Score** : Inclus dans les données
- ✅ **API simple** : REST, pas d'authentification

**Alternatives considérées** :
- **USDA FoodData Central** : Excellent pour USA mais faible coverage FR, API key requis
- **Edamam** : Payant ($70/mois pour 10K requests), overkill pour notre usage
- **Nutritionix** : Payant, focus USA
- **IA uniquement** : Coûteux ($0.005 par ingrédient), moins précis

**Architecture** :
```typescript
// 1. Cache lookup (Supabase)
const cached = await db.select()
  .from(nutritionCache)
  .where(eq(nutritionCache.ingredientName, 'tomate'));

if (cached) return cached;

// 2. OpenFoodFacts search
const nutrition = await openFoodFacts.search('tomate');

// 3. IA fallback si non trouvé
if (!nutrition) {
  nutrition = await claudeEstimateNutrition('tomate');
}

// 4. Cache permanent
await db.insert(nutritionCache).values({ ... });
```

**Coûts** :
- OpenFoodFacts : **€0** (gratuit)
- IA fallback : ~**€0.001** par ingrédient rare
- Cache Supabase : négligeable

**Conséquences** :
- Dépendance à OpenFoodFacts uptime (mitigation : cache agressif)
- Quelques ingrédients rares non trouvés (fallback IA)

**Statut** : ✅ Validée

---

## 2025-11-05 - Réorganisation Documentation

**Contexte** : Documentation éparpillée, difficile à naviguer pour Claude et développeurs

**Décision** : Refonte complète de l'architecture documentaire

**Changements** :
- ✅ Création `PROJECT-CONTEXT.md` (vue d'ensemble rapide)
- ✅ Création `docs/00-INDEX.md` (navigation par personas)
- ✅ Renommage `DOCUMENTATION/` → `docs/`
- ✅ Renommage `frontend-development-guidelines.md` → `08-frontend-guidelines.md`
- ✅ Suppression `DOCUMENTATION.md` (redondant)
- ✅ Ajout `DECISION-LOG.md` (ce fichier)
- ✅ Ajout `GLOSSARY.md` (termes métier)

**Raisons** :
- ✅ Meilleure discoverability (Claude trouve info en < 30s)
- ✅ Onboarding développeur plus rapide (parcours clairs par rôle)
- ✅ Maintenance simplifiée (structure logique)
- ✅ Traçabilité des décisions (DECISION-LOG.md)

**Conséquences** :
- Besoin de maintenir à jour les liens inter-documents
- Métadonnées à ajouter en haut de chaque doc

**Statut** : ✅ Validée

---

## Template pour Futures Décisions

```markdown
## YYYY-MM-DD - Titre de la Décision

**Contexte** :

**Décision** :

**Raisons** :
-
-

**Alternatives considérées** :
-

**Conséquences** :
-

**Statut** : ⏳ En discussion | ✅ Validée | 🔄 En révision | ❌ Annulée

**Ressources** :
-
```

---

## 2025-11-16 - Services IA exclus du bundle React Native

**Contexte** : Les services IA (RecipeImportService, NutritionService, ImageService) ont été créés avec des dépendances Node.js (cheerio, axios) qui ne sont pas compatibles avec React Native.

**Décision** : **Désactiver l'export des services IA** du fichier `src/services/index.ts` et **prévoir leur migration vers Supabase Edge Functions**

**Raisons** :
- ❌ **cheerio** utilise `node:stream` qui n'existe pas dans React Native runtime
- ❌ **axios** peut fonctionner mais ajoute du poids inutile (fetch natif disponible)
- ✅ **Edge Functions** = environnement Deno idéal pour scraping/parsing HTML
- ✅ **Sécurité** : Les clés API (Anthropic, Unsplash) ne doivent pas être dans le bundle client
- ✅ **Performance** : Parsing HTML lourd ne doit pas bloquer le UI thread
- ✅ **Coûts** : Meilleur contrôle des appels AI côté serveur

**Alternatives considérées** :
- **react-native-cheerio** : N'existe pas, cheerio est fundamentalement incompatible
- **xmldom + xpath** : Possible mais verbose, performances médiocres
- **Regex parsing** : Fragile, non maintenable
- **Fetch HTML + envoyer à Edge Function** : Meilleure approche (décision finale)

**Architecture prévue** :
```
Mobile App (React Native)
    ↓ URL de recette
Supabase Edge Function (Deno)
    ↓ Fetch + Parse (cheerio)
    ↓ Claude AI si nécessaire
    ↓ Return JSON structuré
Mobile App
    ↓ Affichage
```

**Conséquences** :
- Services IA créés mais non utilisables en l'état
- Nécessite refactoring vers Edge Functions (3-4h de travail)
- Code actuel servira de référence pour la logique métier
- Meilleure séparation frontend/backend

**Statut** : ✅ Validée

**Action items** :
- [ ] Créer Edge Function `import-recipe` (reprendre logique RecipeImportService)
- [ ] Créer Edge Function `calculate-nutrition` (reprendre logique NutritionService)
- [ ] Créer Edge Function `search-images` (reprendre logique ImageService)
- [ ] Mettre à jour les appels depuis le frontend (fetch vers Edge Functions)

---

## 2025-11-16 - Expo Router pour la navigation au lieu de React Navigation

**Contexte** : Besoin de configurer la navigation dans l'app React Native

**Décision** : Utiliser **Expo Router** (file-based routing) au lieu de React Navigation classique

**Raisons** :
- ✅ **File-based routing** : Structure intuitive similaire à Next.js/Remix
- ✅ **TypeScript automatique** : Typage des routes et paramètres auto-généré
- ✅ **Deep linking** : Configuration automatique, pas de setup manuel
- ✅ **Code splitting** : Lazy loading natif des écrans
- ✅ **Layouts partagés** : `_layout.tsx` pour structure commune
- ✅ **Intégration Expo** : Support officiel, bien maintenu
- ✅ **Moins de boilerplate** : Pas besoin de déclarer manuellement les stacks

**Architecture implémentée** :
```
app/
├── _layout.tsx              # Root layout (TanStack Query Provider)
├── index.tsx                # Page d'accueil/splash
└── (tabs)/                  # Tab navigation group
    ├── _layout.tsx          # Tabs configuration
    └── cookbooks/
        └── index.tsx        # Liste des cookbooks
```

**Alternatives considérées** :
- **React Navigation v6** : Plus verbeux, nécessite configuration manuelle extensive
- **React Router Native** : Moins mature pour React Native, communauté plus petite

**Conséquences** :
- Convention de nommage stricte (dossiers entre parenthèses pour groups)
- Courbe d'apprentissage si habitué à React Navigation classique
- Meilleure DX globale

**Statut** : ✅ Validée et implémentée

---

## 2025-11-16 - TanStack Query pour server state au lieu de Redux

**Contexte** : Besoin de gérer l'état serveur (données Supabase) de manière efficace

**Décision** : **TanStack Query v5** pour tout le server state (API calls, cache, mutations)

**Raisons** :
- ✅ **Cache automatique** : Pas besoin de Redux + middleware custom
- ✅ **Optimistic updates** : Built-in, facile à implémenter
- ✅ **Refetch automatique** : Sur focus, interval, etc.
- ✅ **Loading/error states** : Gérés automatiquement par hook
- ✅ **DevTools** : Inspection du cache en temps réel
- ✅ **Bundle léger** : ~13KB vs Redux Toolkit ~45KB
- ✅ **TypeScript first** : Inférence automatique des types

**Implémentation** :
```typescript
// app/_layout.tsx
const [queryClient] = useState(() => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,      // 5 min
      gcTime: 1000 * 60 * 30,        // 30 min
      retry: 3,
      refetchOnWindowFocus: false,
    },
  },
}));

// src/hooks/useCookbooks.ts
export function useCookbooks(userId: string | undefined) {
  return useQuery({
    queryKey: ["cookbooks", userId],
    queryFn: async () => {
      const { data, error } = await CookbookService.getAll(userId);
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
}
```

**Alternatives considérées** :
- **Redux Toolkit** : Overkill pour fetching, trop de boilerplate
- **Zustand seul** : Bon pour client state, mais pas optimisé pour server state
- **SWR** : Similaire mais moins features, moins populaire en React Native

**Conséquences** :
- Séparation claire server state (TanStack Query) vs client state (Zustand futur)
- Cache automatique réduit les appels réseau
- Code plus concis et maintenable

**Statut** : ✅ Validée et implémentée

---

## 2025-11-16 - Authentification Supabase avec Email/Password

**Contexte** : L'application nécessite un système d'authentification pour sécuriser les données utilisateur et activer les fonctionnalités liées au compte

**Décision** : **Supabase Auth avec Email/Password uniquement** (pas d'OAuth initialement)

**Raisons** :
- ✅ **Simplicité** : Email/Password suffit pour MVP, OAuth peut être ajouté plus tard
- ✅ **Contrôle** : Meilleure maîtrise du flow d'authentification
- ✅ **Intégration native** : Supabase Auth s'intègre directement avec PostgreSQL RLS
- ✅ **Gratuit** : Pas de coûts additionnels vs OAuth providers
- ✅ **Session management** : Auto-refresh tokens, persistence via AsyncStorage
- ✅ **Security** : Email confirmation, password reset inclus

**Architecture implémentée** :
```typescript
// 1. Supabase Client avec AsyncStorage
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Token refresh on app state changes
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

// 2. AuthContext pour state global
export function AuthProvider({ children }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async ({ email, password, fullName }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  // ... password reset methods
}

// 3. Onboarding flow (3 écrans)
app/onboarding/
├── step1.tsx    # Introduction
├── step2.tsx    # Features preview
└── step3.tsx    # CTA to signup

// 4. Auth screens
app/(auth)/
├── login.tsx           # Login with error handling
├── signup.tsx          # Signup with validation
└── forgot-password.tsx # Password reset request

// 5. Protected routes
useEffect(() => {
  if (!authLoading && !isAuthenticated) {
    router.replace("/(auth)/login");
  }
}, [isAuthenticated, authLoading]);
```

**Fonctionnalités implémentées** :
- ✅ Inscription (email, password, nom complet)
- ✅ Connexion avec gestion d'erreurs détaillée
- ✅ Déconnexion avec confirmation
- ✅ Onboarding multi-étapes (flag AsyncStorage)
- ✅ Validation Zod sur tous les formulaires
- ✅ Messages d'erreur en français
- ✅ Navigation automatique basée sur auth state
- ✅ Protection des routes (redirect vers login si non auth)
- ✅ Token refresh automatique (AppState listener)
- ⏳ Deep links pour confirmation email (désactivée temporairement)

**Alternatives considérées** :
- **OAuth uniquement** : Meilleure UX mais complexe à setup, peut être ajouté plus tard
- **Firebase Auth** : Vendor lock-in, coûts moins prévisibles
- **Auth0** : Overkill, payant dès le départ
- **Custom JWT** : Trop de maintenance, pas de features built-in

**Validation des formulaires** :
```typescript
// Zod schema pour signup
const signupSchema = z.object({
  fullName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});
```

**Gestion d'erreurs** :
```typescript
// Parsing des erreurs Supabase
if (msg.includes("email not confirmed")) {
  errorMessage = "Veuillez confirmer votre email avant de vous connecter.";
} else if (msg.includes("invalid login credentials")) {
  errorMessage = "Email ou mot de passe incorrect.";
} else if (msg.includes("email") && msg.includes("invalid")) {
  errorMessage = "Format d'email invalide.";
}
```

**Conséquences** :
- Session persistante entre relances de l'app
- Data isolation via RLS policies Supabase (user_id automatique)
- Meilleure sécurité (tokens stockés en AsyncStorage sécurisé)
- Onboarding fluide pour nouveaux utilisateurs
- Base solide pour ajouter OAuth plus tard (Google, Apple)

**Statut** : ✅ Validée et implémentée

**Fichiers créés** :
- `src/lib/supabase.ts` - Client Supabase configuré
- `src/contexts/AuthContext.tsx` - Context global auth
- `src/hooks/useAuth.ts` - Hook custom pour accéder au context
- `src/types/auth.ts` - Types TypeScript auth
- `app/index.tsx` - Entry point avec routing logique
- `app/onboarding/*` - 3 écrans onboarding
- `app/(auth)/*` - Login, Signup, Forgot Password
- `src/components/auth/*` - AuthInput, AuthFormContainer

**Action items futurs** :
- [ ] Configurer deep links pour email confirmation (paprika://)
- [ ] Ajouter OAuth Google (optionnel)
- [ ] Ajouter OAuth Apple (requis pour App Store)
- [ ] Implémenter 2FA (optionnel, premium feature)

---

## 2025-11-17 - Structure de Navigation (4 Tabs + Settings dans Header)

**Contexte** : Besoin de définir la structure de navigation principale de l'application

**Décision** : **4 tabs en bas** (Home, Cookbooks, Meal Plan, Grocery Lists) + **Settings accessible via profil dans header**

**Raisons** :
- ✅ **4 tabs optimaux** : Ni trop (surcharge), ni trop peu (manque de discoverability)
- ✅ **Pas de tab Recipes global** : Les recettes sont accessibles via Cookbooks (évite duplication, encourage organisation)
- ✅ **Settings dans header** : Libère un espace pour tab plus important, pattern UX standard
- ✅ **AppHeader custom** : Logo + avatar cliquable pour accès rapide profil
- ✅ **PlaceholderScreen** : Permet de tester navigation sans implémenter tous les écrans

**Architecture implémentée** :
```
Tabs (Bottom)
├── Home (Accueil) - Découverte et suggestions
├── Cookbooks (Livres) - Gestion livres de recettes
├── Meal Plan (Planning) - Calendrier hebdomadaire
└── Grocery Lists (Courses) - Listes de courses

Header (Top)
└── Avatar → Settings (Profil, abonnement, déconnexion)

Stack Navigation
├── /cookbooks/[id] - Détail cookbook
├── /recipes/[id] - Détail recette
├── /recipes/create - Créer recette
└── /recipes/import - Importer recette (IA)
```

**Alternatives considérées** :
- **5 tabs avec Settings** : Trop de tabs, Settings peu utilisé
- **Tab Recipes global** : Duplication avec accès via Cookbooks
- **Drawer menu** : Moins accessible, moins mobile-first

**Composants créés** :
- `PlaceholderScreen` : Écran vide réutilisable pour développement incrémental
- `AppHeader` : Header custom avec logo + avatar
- 4 écrans tabs + 5 écrans stack (tous avec routing fonctionnel)

**Conséquences** :
- Navigation testable immédiatement (tous écrans accessibles)
- Développement incrémental possible (placeholders → implémentation progressive)
- UX cohérente et standard mobile

**Statut** : ✅ Validée et implémentée

**Documentation** : [NAVIGATION.md](./NAVIGATION.md)

---

**Maintenu par** : Équipe Paprika
**Dernière mise à jour** : 17 novembre 2025

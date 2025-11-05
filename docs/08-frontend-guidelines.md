# Frontend Development Guidelines - Paprika

Guide complet pour le développement frontend de l'application Paprika iOS. Ce document combine la charte graphique "Warm & Cozy" avec les standards techniques de développement React Native.

---

## Table des Matières

1. [Design System](#1-design-system)
2. [Architecture & Structure](#2-architecture--structure)
3. [Responsive Design](#3-responsive-design)
4. [Positionnement & Layout](#4-positionnement--layout)
5. [Accessibilité](#5-accessibilité)
6. [Lisibilité & Typographie](#6-lisibilité--typographie)
7. [Performance](#7-performance)
8. [Best Practices React Native](#8-best-practices-react-native)
9. [Composants UI](#9-composants-ui)
10. [Workflow de Développement](#10-workflow-de-développement)

---

## 1. Design System

### 1.1 Palette de Couleurs "Warm & Cozy"

#### Primary - Paprika/Terracotta
```typescript
colors: {
  primary: '#E75C44',      // Couleur principale
  primary50: '#FEF2F2',
  primary100: '#FEE2E2',
  primary200: '#FECACA',
  primary300: '#FCA5A5',
  primary400: '#F87171',
  primary500: '#E75C44',   // Base
  primary600: '#DC2626',
  primary700: '#B91C1C',
  primary800: '#991B1B',
  primary900: '#7F1D1D',
}
```

#### Secondary - Orange Chaud
```typescript
secondary: '#F97316',      // Orange principal
secondary50: '#FFF7ED',
secondary500: '#F97316',   // Base
secondary900: '#7C2D12',
```

#### Accent - Jaune Miel
```typescript
accent: '#F59E0B',         // Jaune miel principal
accent50: '#FFFBEB',
accent500: '#F59E0B',      // Base
accent900: '#78350F',
```

#### Neutrals - Tons Chauds
```typescript
neutral: {
  white: '#FAFAF9',        // Blanc cassé chaud
  black: '#1C1917',        // Noir chaud
  50: '#FAFAF9',
  100: '#F5F5F4',
  200: '#E7E5E4',
  300: '#D6D3D1',
  400: '#A8A29E',
  500: '#78716C',
  600: '#57534E',
  700: '#44403C',
  800: '#292524',
  900: '#1C1917',
}
```

#### Couleurs Sémantiques
```typescript
semantic: {
  success: '#22C55E',      // Vert olive
  warning: '#F59E0B',      // Jaune miel
  error: '#DC2626',        // Rouge
  info: '#0EA5E9',         // Bleu ciel
}
```

**Règle d'utilisation :**
- ⛔ **JAMAIS** de valeurs hardcodées : `color: '#E75C44'`
- ✅ **TOUJOURS** utiliser le thème : `color: colors.primary`

### 1.2 Typographie

#### Tailles de Police
```typescript
fontSize: {
  '2xs': 10,
  xs: 12,
  sm: 14,
  md: 16,      // Base pour body
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
}
```

#### Graisses (Font Weight)
```typescript
fontWeight: {
  light: '300',
  normal: '400',    // Défaut
  medium: '500',
  semibold: '600',
  bold: '700',
}
```

#### Familles de Polices
```typescript
fontFamily: {
  heading: 'Inter-Bold',
  body: 'Inter-Regular',
  mono: 'Courier',
}
```

**Règle d'utilisation :**
- ⛔ **JAMAIS** : `fontSize: 16`
- ✅ **TOUJOURS** : `fontSize: fontSizes.md`

### 1.3 Espacement (Spacing)

**Système basé sur multiples de 4px :**
```typescript
spacing: {
  0: 0,
  1: 4,       // 4px
  2: 8,       // 8px
  3: 12,      // 12px
  4: 16,      // 16px
  5: 20,      // 20px
  6: 24,      // 24px
  8: 32,      // 32px
  10: 40,     // 40px
  12: 48,     // 48px
  16: 64,     // 64px
  20: 80,     // 80px
}
```

**Règle d'utilisation :**
- ⛔ **JAMAIS** : `padding: 16`
- ✅ **TOUJOURS** : `padding: spacing.lg` (qui vaut 16)

### 1.4 Border Radius

```typescript
borderRadius: {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,       // Défaut pour boutons
  xl: 12,      // Défaut pour cartes
  '2xl': 16,
  '3xl': 24,
  full: 9999,  // Cercles parfaits
}
```

### 1.5 Ombres (Shadows)

```typescript
shadows: {
  xs: {
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#7C2D12',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
}
```

**Note :** Sur Android, utiliser `elevation` au lieu de `shadow*`

---

## 2. Architecture & Structure

### 2.1 Organisation des Fichiers

```
src/
├── screens/              # Écrans complets (pages)
│   ├── CookbooksScreen.tsx
│   ├── RecipeDetailScreen.tsx
│   └── ...
├── components/           # Composants réutilisables
│   ├── ui/              # Composants UI basiques
│   │   ├── PaprikaText.tsx
│   │   ├── Button.tsx
│   │   └── Card.tsx
│   └── recipe/          # Composants métier
│       ├── RecipeCard.tsx
│       └── MealSlot.tsx
├── hooks/               # Hooks personnalisés
│   ├── useAuth.ts
│   ├── useRecipes.ts
│   └── useMealPlans.ts
├── services/            # Appels API/Backend
│   ├── auth.service.ts
│   ├── recipe.service.ts
│   └── cookbook.service.ts
├── types/               # Types TypeScript
│   └── index.ts
├── theme/               # Design system
│   └── index.ts
├── navigation/          # Configuration navigation
│   ├── MainNavigator.tsx
│   └── types.ts
└── utils/               # Utilitaires
    └── helpers.ts
```

### 2.2 Naming Conventions

#### Fichiers
- **Screens** : `PascalCase` + `Screen.tsx` → `CookbooksScreen.tsx`
- **Components** : `PascalCase.tsx` → `RecipeCard.tsx`
- **Hooks** : `camelCase` + `use` prefix → `useRecipes.ts`
- **Services** : `camelCase` + `.service.ts` → `recipe.service.ts`
- **Types** : `index.ts` (exports centralisés)

#### Variables & Fonctions
- **Variables** : `camelCase` → `const userName = 'John'`
- **Constantes** : `UPPER_SNAKE_CASE` → `const MAX_RECIPES = 100`
- **Fonctions** : `camelCase` → `const handlePress = () => {}`
- **Composants** : `PascalCase` → `const RecipeCard = () => {}`
- **Types/Interfaces** : `PascalCase` → `interface Recipe {}`

### 2.3 Pattern de Composants

**Screen Pattern (Full Page) :**
```tsx
import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing } from '@/theme';

export default function MyScreen() {
  // 1. Hooks (state, navigation, custom hooks)
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { data } = useMyHook();

  // 2. Effects
  useEffect(() => {
    // Side effects
  }, []);

  // 3. Handlers (avec useCallback)
  const handlePress = useCallback(() => {
    // Logic
  }, []);

  // 4. Render helpers (avec useMemo si calcul coûteux)
  const filteredData = useMemo(() => {
    return data.filter(item => item.active);
  }, [data]);

  // 5. JSX
  return (
    <View style={styles.container}>
      {/* Content */}
    </View>
  );
}

// 6. Styles (toujours en bas)
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
});
```

**Component Pattern (Reusable) :**
```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';

interface MyComponentProps {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  onPress,
  disabled = false,
}) => {
  return (
    <TouchableOpacity 
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled]}
    >
      {/* Content */}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
});
```

---

## 3. Responsive Design

### 3.1 Approche Mobile-First

**Principe :** Développer d'abord pour mobile, puis adapter pour tablette/desktop si besoin.

```tsx
import { Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Breakpoints
const BREAKPOINTS = {
  mobile: 0,      // < 768px
  tablet: 768,    // 768px - 1024px
  desktop: 1024,  // > 1024px
};

// Helper
const isTablet = width >= BREAKPOINTS.tablet;
const isDesktop = width >= BREAKPOINTS.desktop;
```

### 3.2 Layout Adaptatif

**Grid System :**
```tsx
const getColumns = () => {
  if (width < BREAKPOINTS.tablet) return 1;  // Mobile: 1 colonne
  if (width < BREAKPOINTS.desktop) return 2; // Tablet: 2 colonnes
  return 3;                                   // Desktop: 3 colonnes
};
```

**Spacing Responsive :**
```tsx
const styles = StyleSheet.create({
  container: {
    padding: isTablet ? spacing['2xl'] : spacing.lg,
  },
  grid: {
    gap: isTablet ? spacing.lg : spacing.md,
  },
});
```

### 3.3 SafeArea Management

**Toujours utiliser SafeAreaView pour les écrans :**
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function MyScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Content */}
    </SafeAreaView>
  );
}
```

**Options edges :**
- `['top']` : Uniquement le haut (pour écrans sans header)
- `['top', 'left', 'right']` : Tout sauf le bas (pour écrans avec tabs)
- `['bottom']` : Uniquement le bas
- Omis : Tous les bords (défaut)

### 3.4 Orientation Handling

```tsx
import { useWindowDimensions } from 'react-native';

function MyScreen() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  return (
    <View style={[
      styles.container,
      isLandscape && styles.landscape
    ]}>
      {/* Content */}
    </View>
  );
}
```

---

## 4. Positionnement & Layout

### 4.1 Flexbox Best Practices

**Container Principal :**
```tsx
const styles = StyleSheet.create({
  container: {
    flex: 1,                    // Prend tout l'espace disponible
    flexDirection: 'column',    // Direction verticale (défaut)
    justifyContent: 'flex-start', // Alignement vertical
    alignItems: 'stretch',      // Alignement horizontal (défaut)
  },
});
```

**Centrage Parfait :**
```tsx
const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',   // Centre verticalement
    alignItems: 'center',       // Centre horizontalement
  },
});
```

**Espacement entre Éléments :**
```tsx
// Option 1: Gap (React Native 0.71+)
const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,            // Espace entre éléments
  },
});

// Option 2: Margin (pour versions antérieures)
const styles = StyleSheet.create({
  item: {
    marginBottom: spacing.md,
  },
  itemLast: {
    marginBottom: 0,            // Retirer margin du dernier
  },
});
```

### 4.2 Absolute vs Relative Positioning

**Relative (Défaut) :**
```tsx
const styles = StyleSheet.create({
  badge: {
    position: 'relative',       // Position normale dans le flow
    top: -10,                   // Décalage depuis position normale
  },
});
```

**Absolute (Sorti du flow) :**
```tsx
const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  floatingButton: {
    position: 'absolute',
    bottom: spacing['2xl'],
    right: spacing.lg,
  },
});
```

**⚠️ Attention :**
- `absolute` retire l'élément du flow (ne prend plus de place)
- Utilisé pour : badges, overlays, FAB (Floating Action Buttons)

### 4.3 Z-Index Management

**Ordre de superposition :**
```tsx
const Z_INDEX = {
  base: 0,           // Contenu normal
  header: 10,        // Headers fixes
  dropdown: 20,      // Dropdowns
  modal: 30,         // Modals
  tooltip: 40,       // Tooltips
  overlay: 50,       // Overlays sombres
};

const styles = StyleSheet.create({
  modal: {
    position: 'absolute',
    zIndex: Z_INDEX.modal,
  },
});
```

### 4.4 ScrollView vs FlatList

**ScrollView** - Pour petites listes (<50 items)
```tsx
<ScrollView 
  style={styles.container}
  contentContainerStyle={styles.content}  // Padding interne
  showsVerticalScrollIndicator={false}
>
  {items.map(item => <Item key={item.id} {...item} />)}
</ScrollView>
```

**FlatList** - Pour grandes listes (>50 items)
```tsx
<FlatList
  data={recipes}
  renderItem={({ item }) => <RecipeCard recipe={item} />}
  keyExtractor={item => item.id}
  contentContainerStyle={styles.listContent}
  showsVerticalScrollIndicator={false}
  // Performance optimizations
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
/>
```

**⚠️ Règles :**
- ✅ **FlatList** pour listes longues (lazy loading automatique)
- ✅ **ScrollView** pour contenu mixte ou petites listes
- ⛔ **JAMAIS** de ScrollView dans un autre ScrollView

---

## 5. Accessibilité

### 5.1 Contraste des Couleurs (WCAG AA)

**Standards :**
- **Texte normal** (< 18px) : Contraste minimum **4.5:1**
- **Texte large** (≥ 18px) : Contraste minimum **3:1**
- **Éléments UI** : Contraste minimum **3:1**

**Vérification :**
```tsx
// ✅ Bon contraste : Texte #1C1917 sur fond #FAFAF9
// Contraste = 16.5:1 (excellent)

// ⛔ Mauvais contraste : Texte #A8A29E sur fond #FAFAF9
// Contraste = 2.8:1 (insuffisant)
```

**Outils de vérification :**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Coolors Contrast Checker](https://coolors.co/contrast-checker)

### 5.2 Touch Targets

**Taille Minimum :**
- **44x44 pixels** (recommandation Apple)
- **48x48 pixels** (recommandation Material Design)

```tsx
const styles = StyleSheet.create({
  button: {
    minWidth: 44,
    minHeight: 44,
    // OU
    paddingVertical: spacing.md,  // Au moins 12px
    paddingHorizontal: spacing.lg, // Au moins 16px
  },
});
```

**Espacement entre Éléments Tactiles :**
- Minimum **8px** entre deux éléments cliquables

```tsx
const styles = StyleSheet.create({
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.md,  // Au moins 8px entre boutons
  },
});
```

### 5.3 Labels et Accessibilité

**Toujours ajouter des labels accessibles :**
```tsx
<TouchableOpacity
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel="Ajouter aux favoris"
  accessibilityHint="Double tap pour ajouter cette recette à vos favoris"
>
  <Icon name="heart" />
</TouchableOpacity>
```

**Roles disponibles :**
- `button`, `link`, `header`, `search`, `image`, `text`, `checkbox`, `radio`, `switch`, `tab`, `menu`, `menuitem`, `progressbar`, `alert`

**States :**
```tsx
<TouchableOpacity
  accessible={true}
  accessibilityState={{
    disabled: isDisabled,
    selected: isSelected,
    checked: isChecked,
  }}
>
  {/* Content */}
</TouchableOpacity>
```

### 5.4 Focus Visible

**Toujours montrer le focus pour navigation clavier :**
```tsx
const [isFocused, setIsFocused] = useState(false);

<TouchableOpacity
  onFocus={() => setIsFocused(true)}
  onBlur={() => setIsFocused(false)}
  style={[
    styles.button,
    isFocused && styles.buttonFocused
  ]}
>
  {/* Content */}
</TouchableOpacity>

const styles = StyleSheet.create({
  buttonFocused: {
    borderWidth: 2,
    borderColor: colors.primary,
    // OU
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
});
```

### 5.5 Éviter la Couleur Seule

**⛔ Mauvais :**
```tsx
// Rouge = erreur, Vert = succès
<Text style={{ color: isError ? 'red' : 'green' }}>
  {message}
</Text>
```

**✅ Bon :**
```tsx
// Couleur + Icône + Texte
<View>
  <Icon name={isError ? 'alert-circle' : 'check-circle'} />
  <Text style={{ color: isError ? colors.error : colors.success }}>
    {isError ? 'Erreur : ' : 'Succès : '}{message}
  </Text>
</View>
```

---

## 6. Lisibilité & Typographie

### 6.1 Hiérarchie Typographique

**Niveaux de Titres :**
```tsx
// H1 - Titre principal de page
<PaprikaText variant="heading" size="4xl" weight="bold">
  Mes Cookbooks
</PaprikaText>

// H2 - Sous-titres de section
<PaprikaText variant="heading" size="2xl" weight="semibold">
  Recettes Favorites
</PaprikaText>

// H3 - Titres de cartes
<PaprikaText variant="heading" size="lg" weight="medium">
  Pasta Carbonara
</PaprikaText>

// Body - Texte normal
<PaprikaText variant="body" size="md">
  Une délicieuse recette italienne...
</PaprikaText>

// Caption - Métadonnées
<PaprikaText variant="caption" size="sm" color="neutral">
  Ajouté il y a 2 jours
</PaprikaText>
```

### 6.2 Line Height Optimal

**Standards :**
- **Titres** : `lineHeight = fontSize * 1.2` (120%)
- **Body text** : `lineHeight = fontSize * 1.5` (150%)
- **Captions** : `lineHeight = fontSize * 1.4` (140%)

```tsx
const styles = StyleSheet.create({
  heading: {
    fontSize: fontSizes['2xl'],  // 24px
    lineHeight: 28.8,             // 24 * 1.2
  },
  body: {
    fontSize: fontSizes.md,       // 16px
    lineHeight: 24,               // 16 * 1.5
  },
  caption: {
    fontSize: fontSizes.sm,       // 14px
    lineHeight: 19.6,             // 14 * 1.4
  },
});
```

### 6.3 Largeur Maximale du Texte

**Règle des 60-80 caractères :**
- Maximum **75 caractères par ligne** pour une lisibilité optimale
- Environ **600-650px** de largeur

```tsx
const styles = StyleSheet.create({
  textContainer: {
    maxWidth: 650,
    alignSelf: 'center',  // Centre le bloc de texte
  },
  paragraph: {
    fontSize: fontSizes.md,
    lineHeight: 24,
    textAlign: 'left',    // Jamais 'justify' sur mobile
  },
});
```

### 6.4 Espacement des Paragraphes

```tsx
const styles = StyleSheet.create({
  paragraph: {
    marginBottom: spacing.lg,  // 16px entre paragraphes
  },
  paragraphLast: {
    marginBottom: 0,            // Pas de margin sur le dernier
  },
});
```

### 6.5 Éviter le Texte Tout en Majuscules

**⛔ Mauvais :**
```tsx
<Text style={{ textTransform: 'uppercase' }}>
  CECI EST DIFFICILE À LIRE
</Text>
```

**✅ Bon :**
```tsx
<Text style={{ fontWeight: '600' }}>
  Ceci est plus lisible
</Text>
```

**Exception :** Les labels de boutons très courts (< 3 mots)

---

## 7. Performance

### 7.1 FlatList Optimizations

```tsx
<FlatList
  data={recipes}
  renderItem={({ item }) => <RecipeCard recipe={item} />}
  keyExtractor={item => item.id}
  
  // Optimisations
  removeClippedSubviews={true}        // Retire les items hors écran
  maxToRenderPerBatch={10}            // Nombre d'items par batch
  windowSize={10}                      // Taille de la fenêtre de rendu
  initialNumToRender={10}              // Items initiaux
  getItemLayout={(data, index) => ({  // Si items de taille fixe
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### 7.2 Lazy Loading des Images

```tsx
import FastImage from 'react-native-fast-image';

<FastImage
  source={{
    uri: recipe.image_url,
    priority: FastImage.priority.normal,
  }}
  style={styles.image}
  resizeMode={FastImage.resizeMode.cover}
/>
```

**Placeholder pendant chargement :**
```tsx
const [imageLoaded, setImageLoaded] = useState(false);

<View style={styles.imageContainer}>
  {!imageLoaded && (
    <View style={styles.placeholder}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  )}
  <Image
    source={{ uri: recipe.image_url }}
    style={styles.image}
    onLoad={() => setImageLoaded(true)}
  />
</View>
```

### 7.3 Memoization

**useMemo - Pour calculs coûteux :**
```tsx
const filteredRecipes = useMemo(() => {
  return recipes.filter(recipe => 
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
}, [recipes, searchQuery]);
```

**useCallback - Pour fonctions passées en props :**
```tsx
const handlePress = useCallback((recipeId: string) => {
  navigation.navigate('RecipeDetail', { id: recipeId });
}, [navigation]);
```

**React.memo - Pour composants lourds :**
```tsx
export const RecipeCard = React.memo<RecipeCardProps>(({ recipe, onPress }) => {
  return (
    <TouchableOpacity onPress={onPress}>
      {/* Content */}
    </TouchableOpacity>
  );
});
```

### 7.4 Éviter les Re-renders Inutiles

**❌ Mauvais - Crée une nouvelle fonction à chaque render :**
```tsx
<Button onPress={() => handleDelete(recipe.id)} />
```

**✅ Bon - Utilise useCallback :**
```tsx
const handleDeletePress = useCallback(() => {
  handleDelete(recipe.id);
}, [recipe.id]);

<Button onPress={handleDeletePress} />
```

### 7.5 Compression des Images

```bash
# Avant upload
# PNG → WebP (90% de réduction)
# JPEG → Optimized JPEG (50% de réduction)
```

**Dimensions recommandées :**
- **Thumbnail** : 150x150px
- **Card image** : 400x300px
- **Full screen** : 1080x1920px (max)

---

## 8. Best Practices React Native

### 8.1 Hooks Patterns

**Order des Hooks (toujours le même) :**
```tsx
function MyScreen() {
  // 1. State hooks
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<Recipe[]>([]);

  // 2. Navigation/Router hooks
  const navigation = useNavigation();
  const route = useRoute();

  // 3. Custom hooks
  const { user } = useAuth();
  const { recipes, fetchRecipes } = useRecipes();

  // 4. Effects
  useEffect(() => {
    fetchRecipes();
  }, []);

  // 5. Callbacks
  const handlePress = useCallback(() => {
    // Logic
  }, []);

  // 6. Memos
  const filteredData = useMemo(() => {
    return data.filter(item => item.active);
  }, [data]);

  // 7. Render
  return <View>{/* JSX */}</View>;
}
```

### 8.2 State Management

**Local State (useState) :**
```tsx
// Pour état local à un composant
const [isOpen, setIsOpen] = useState(false);
```

**Custom Hooks (Business Logic) :**
```tsx
// Pour logique réutilisable
const { recipes, loading, error, fetchRecipes } = useRecipes();
```

**Context (Partage global) :**
```tsx
// Pour données globales (auth, theme, etc.)
const { user, signIn, signOut } = useAuth();
```

### 8.3 Error Handling

**Try-Catch avec États :**
```tsx
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const handleSave = async () => {
  setLoading(true);
  setError(null);

  try {
    await saveRecipe(data);
    navigation.goBack();
  } catch (err) {
    setError(err.message || 'Une erreur est survenue');
  } finally {
    setLoading(false);
  }
};
```

**Affichage des Erreurs :**
```tsx
{error && (
  <View style={styles.errorContainer}>
    <Icon name="alert-circle" color={colors.error} />
    <Text style={styles.errorText}>{error}</Text>
  </View>
)}
```

### 8.4 Loading States

**Skeleton Screens (préféré aux spinners) :**
```tsx
{loading ? (
  <View style={styles.skeleton}>
    <View style={styles.skeletonImage} />
    <View style={styles.skeletonText} />
    <View style={styles.skeletonText} />
  </View>
) : (
  <RecipeCard recipe={recipe} />
)}
```

### 8.5 Platform-Specific Code

```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
});
```

---

## 9. Composants UI

### 9.1 Composants Existants

#### PaprikaText
```tsx
<PaprikaText
  variant="heading"      // heading | body | caption | label
  size="lg"              // 2xs | xs | sm | md | lg | xl | 2xl | 3xl | 4xl
  color="primary"        // primary | secondary | accent | neutral | success | error
  weight="semibold"      // light | normal | medium | semibold | bold
  align="center"         // left | center | right
>
  Mon Texte
</PaprikaText>
```

#### Button
```tsx
<Button
  variant="solid"        // solid | outline | ghost
  colorScheme="primary"  // primary | secondary | accent
  size="md"              // xs | sm | md | lg
  onPress={handlePress}
  disabled={loading}
  leftIcon={<Icon name="plus" />}
  rightIcon={<Icon name="chevron-right" />}
>
  Ajouter
</Button>
```

#### Card
```tsx
<Card
  variant="elevated"     // elevated | outlined | filled
  size="md"              // sm | md | lg
  onPress={handlePress}  // Optionnel (rend la card cliquable)
>
  {/* Content */}
</Card>
```

#### RecipeCard
```tsx
<RecipeCard
  recipe={recipe}
  onPress={() => navigation.navigate('RecipeDetail', { id: recipe.id })}
  onFavoritePress={handleFavorite}
/>
```

#### MealSlot
```tsx
<MealSlot
  meal={meal}
  onPress={handleSelectRecipe}
  onRemove={handleRemoveMeal}
/>
```

### 9.2 Créer un Nouveau Composant

**Template :**
```tsx
import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme';
import { PaprikaText } from './PaprikaText';

interface MyComponentProps {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

export const MyComponent: React.FC<MyComponentProps> = ({
  title,
  subtitle,
  onPress,
  disabled = false,
  style,
}) => {
  const Component = onPress ? TouchableOpacity : View;

  return (
    <Component
      onPress={onPress}
      disabled={disabled}
      style={[styles.container, disabled && styles.disabled, style]}
    >
      <PaprikaText variant="heading" size="lg">
        {title}
      </PaprikaText>
      {subtitle && (
        <PaprikaText variant="body" size="sm" color="neutral">
          {subtitle}
        </PaprikaText>
      )}
    </Component>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.neutral[50],
  },
  disabled: {
    opacity: 0.5,
  },
});
```

---

## 10. Workflow de Développement

### 10.1 Avant de Commencer

1. **Lire les docs existantes :**
   - `docs/Paprika-design-system.md`
   - `docs/Paprika-data-model.md`
   - `docs/Paprika-status-report.md`

2. **Vérifier les composants existants :**
   - Regarder dans `src/components/ui/`
   - Réutiliser plutôt que recréer

3. **Planifier l'écran :**
   - Quelle navigation ?
   - Quels hooks nécessaires ?
   - Quels services à appeler ?

### 10.2 Pendant le Développement

1. **Créer le fichier screen :**
   ```bash
   src/screens/MyNewScreen.tsx
   ```

2. **Implémenter la logique :**
   - Hooks
   - État
   - Handlers

3. **Créer le JSX :**
   - Utiliser les composants existants
   - Respecter le design system
   - Ajouter les styles

4. **Intégrer la navigation :**
   - Ajouter dans `src/navigation/MainNavigator.tsx`
   - Définir les types de navigation

5. **Tester :**
   - Fonctionnalité
   - Responsive
   - Loading/Error states

### 10.3 Checklist de Qualité

Avant de considérer un écran terminé :

- [ ] ✅ Utilise les composants UI existants
- [ ] ✅ Respecte le design system (couleurs, spacing, etc.)
- [ ] ✅ TypeScript strict (pas de `any`)
- [ ] ✅ Accessibilité (labels, touch targets, contraste)
- [ ] ✅ Responsive (fonctionne sur tous les écrans)
- [ ] ✅ Performance (FlatList, memoization, etc.)
- [ ] ✅ States gérés (loading, error, empty)
- [ ] ✅ Navigation intégrée et testée
- [ ] ✅ Code documenté (commentaires si logique complexe)

### 10.4 Review Criteria

**Code Quality :**
- [ ] Pas de hardcoded values
- [ ] Nommage cohérent
- [ ] Pas de duplication de code
- [ ] Fonctions courtes (< 50 lignes)

**Performance :**
- [ ] Utilisation appropriée de FlatList
- [ ] Memoization quand nécessaire
- [ ] Pas de calculs lourds dans render

**UX :**
- [ ] Feedback visuel sur interactions
- [ ] Messages d'erreur clairs
- [ ] Loading states
- [ ] Empty states

**Accessibilité :**
- [ ] Labels accessibles
- [ ] Contraste suffisant
- [ ] Touch targets corrects
- [ ] Focus visible

---

## Ressources

### Documentation Officielle
- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [React Navigation](https://reactnavigation.org/docs/getting-started)
- [TypeScript](https://www.typescriptlang.org/docs/)

### Design & UX
- [Material Design](https://m3.material.io/)
- [Human Interface Guidelines (iOS)](https://developer.apple.com/design/human-interface-guidelines/)

### Accessibilité
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [React Native Accessibility](https://reactnavigation.org/docs/accessibility/)

### Performance
- [React Native Performance](https://reactnative.dev/docs/performance)
- [Flipper Debugger](https://fbflipper.com/)

---

**Version:** 1.0  
**Dernière mise à jour:** Novembre 2025  
**Maintenu par:** Équipe Paprika

---

*Ce document est vivant et doit être mis à jour régulièrement avec les nouvelles pratiques et patterns découverts pendant le développement.*

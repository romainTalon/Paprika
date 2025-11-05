# **07 - UI Guidelines & Design System**

*Règles de développement front et design system complet*

---

## 🎨 **Design System "Warm & Cozy"**

### **Philosophie**

Paprika utilise un design **chaleureux, accueillant et confortable** qui évoque la cuisine familiale et le plaisir de cuisiner. Chaque élément doit inspirer la convivialité.

**Mots-clés :** Chaleur, Douceur, Confort, Naturel, Accueillant

---

## 🎨 **1. Couleurs**

### **Palette Principale**

```typescript
// tailwind.config.js
colors: {
  // Orange chaleureux (couleur principale)
  primary: {
    DEFAULT: "#FFB03A",
    50: "#FFF8F0",
    100: "#FFEFD9",
    200: "#FFE0B2",
    300: "#FFD08A",
    400: "#FFC062",
    500: "#FFB03A",  // Base
    600: "#E69A34",
    700: "#CC842E",
    800: "#B36E28",
    900: "#995822",
  },
  
  // Crème doux (backgrounds)
  cream: {
    DEFAULT: "#FFF9F0",
    50: "#FFFCF7",
    100: "#FFF9F0",  // Base
    200: "#FFF3E0",
    300: "#FFEFD1",
    400: "#FFEAC2",
    500: "#FFE4B3",
  },
  
  // Marrons et gris chauds (textes)
  warm: {
    brown: "#6B5847",   // Texte principal
    gray: "#8B7355",    // Texte secondaire
  },
  
  // États (succès, erreur, warning)
  success: "#10B981",   // Vert doux
  error: "#EF4444",     // Rouge chaleureux
  warning: "#F59E0B",   // Orange warning
  info: "#3B82F6",      // Bleu doux
}
```

### **Utilisation des Couleurs**

```typescript
// ✅ CORRECT
<View className="bg-cream-100">
  <Text className="text-warm-brown">Mon Titre</Text>
  <Button className="bg-primary-500">Action</Button>
</View>

// ❌ INCORRECT - Pas de couleurs froides
<View className="bg-blue-500">  // ❌ Trop froid
<View className="bg-gray-100">  // ❌ Pas assez chaleureux
```

### **Contraste Minimum (WCAG AA)**

| Fond | Texte | Ratio | ✅/❌ |
|------|-------|-------|------|
| cream-100 (#FFF9F0) | warm-brown (#6B5847) | 7.2:1 | ✅ AAA |
| primary-500 (#FFB03A) | white (#FFFFFF) | 2.1:1 | ❌ |
| primary-500 (#FFB03A) | warm-brown (#6B5847) | 3.4:1 | ❌ |
| white (#FFFFFF) | warm-brown (#6B5847) | 8.5:1 | ✅ AAA |

**Règle :** Toujours tester avec un outil de contraste avant de valider un couple fond/texte.

---

## ✍️ **2. Typographie**

### **Font Family**

```typescript
// app.json ou tailwind.config.js
fontFamily: {
  sans: ["Poppins", "system-ui", "sans-serif"],
}
```

**Poppins** : Police moderne, ronde et chaleureuse

### **Échelle Typographique**

```typescript
// Tailles de texte (mobile-first)
text-xs    // 12px - Annotations, labels secondaires
text-sm    // 14px - Corps de texte secondaire
text-base  // 16px - Corps de texte principal (DEFAULT)
text-lg    // 18px - Sous-titres
text-xl    // 20px - Titres de section
text-2xl   // 24px - Titres de page
text-3xl   // 30px - Titres principaux
text-4xl   // 36px - Headlines

// Poids (font-weight)
font-normal    // 400 - Texte courant
font-medium    // 500 - Emphasis léger
font-semibold  // 600 - Titres, labels
font-bold      // 700 - Titres importants
```

### **Hiérarchie Typographique**

```typescript
// Titre de page
<Text className="text-3xl font-bold text-warm-brown">
  Mes Recettes
</Text>

// Titre de section
<Text className="text-xl font-semibold text-warm-brown mb-2">
  Cookbooks Récents
</Text>

// Corps de texte
<Text className="text-base text-warm-brown">
  Organisez vos recettes par thème
</Text>

// Texte secondaire
<Text className="text-sm text-warm-gray">
  23 recettes · Mis à jour il y a 2j
</Text>
```

### **Line Height**

```typescript
leading-none      // 1.0 - Titres serrés
leading-tight     // 1.25 - Titres
leading-normal    // 1.5 - Corps de texte (DEFAULT)
leading-relaxed   // 1.625 - Texte aéré
leading-loose     // 2.0 - Très aéré
```

---

## 📏 **3. Spacing & Layout**

### **Échelle de Spacing**

```typescript
// Tailwind spacing scale (4px base)
0   // 0px
1   // 4px
2   // 8px
3   // 12px
4   // 16px   ← Base standard
5   // 20px
6   // 24px
8   // 32px
10  // 40px
12  // 48px
16  // 64px
20  // 80px
24  // 96px
```

### **Règles de Spacing**

```typescript
// Padding intérieur des écrans
<View className="p-4">  // Mobile (16px)
<View className="p-6">  // Tablet/Desktop (24px)

// Marges entre sections
<View className="mb-6">  // Entre sections (24px)
<View className="mb-4">  // Entre éléments (16px)
<View className="mb-2">  // Entre éléments liés (8px)

// Gap dans flexbox
<View className="flex gap-4">  // Entre items (16px)
<View className="flex gap-2">  // Entre items serrés (8px)
```

### **Safe Areas (Mobile)**

```typescript
import { SafeAreaView } from "react-native-safe-area-context";

// ✅ TOUJOURS utiliser SafeAreaView pour les écrans principaux
<SafeAreaView className="flex-1 bg-cream-100">
  <View className="p-4">
    {/* Contenu */}
  </View>
</SafeAreaView>

// ❌ Ne pas utiliser View simple pour la racine
<View className="flex-1">  // ❌ Pas de safe area
```

---

## 📱 **4. Responsive Design**

### **Breakpoints**

```typescript
// NativeWind breakpoints
sm: 640px    // Petits mobiles paysage
md: 768px    // Tablettes portrait
lg: 1024px   // Tablettes paysage
xl: 1280px   // Desktop
2xl: 1536px  // Large desktop
```

### **Mobile-First Approach**

```typescript
// ✅ CORRECT - Mobile first, puis adaptations
<View className="p-4 md:p-6 lg:p-8">
  <Text className="text-xl md:text-2xl lg:text-3xl">
    Titre
  </Text>
</View>

// ❌ INCORRECT - Desktop first
<View className="p-8 sm:p-4">  // ❌ Mauvais ordre
```

### **Layouts Responsives**

```typescript
// Grille responsive
<View className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} {...item} />)}
</View>

// Flex responsive
<View className="flex flex-col md:flex-row gap-4">
  <View className="flex-1">Sidebar</View>
  <View className="flex-2">Main</View>
</View>

// Masquer/afficher selon breakpoint
<View className="hidden md:flex">Desktop only</View>
<View className="flex md:hidden">Mobile only</View>
```

### **Images Responsives**

```typescript
import { Image } from "expo-image";

// ✅ CORRECT - Responsive image
<Image
  source={{ uri: imageUrl }}
  className="w-full h-48 md:h-64 lg:h-80"
  contentFit="cover"
  transition={200}
  placeholder={blurhash}
/>

// Aspect ratio fixe
<View className="aspect-square md:aspect-video">
  <Image source={{ uri }} className="w-full h-full" />
</View>
```

---

## ♿ **5. Accessibilité (a11y)**

### **Règles Obligatoires**

#### **1. Labels et Descriptions**

```typescript
// ✅ CORRECT - Tous les éléments interactifs ont des labels
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Ajouter une recette"
  accessibilityHint="Ouvre le formulaire de création de recette"
  accessibilityRole="button"
  onPress={handleAdd}
>
  <Icon name="plus" />
</TouchableOpacity>

// ❌ INCORRECT - Pas de label
<TouchableOpacity onPress={handleAdd}>
  <Icon name="plus" />  // ❌ Incompréhensible pour screen reader
</TouchableOpacity>
```

#### **2. Hiérarchie de Titres**

```typescript
// ✅ CORRECT - Ordre logique
<View>
  <Text accessibilityRole="header" accessibilityLevel={1}>
    Mes Cookbooks
  </Text>
  <Text accessibilityRole="header" accessibilityLevel={2}>
    Desserts
  </Text>
  <Text accessibilityRole="header" accessibilityLevel={3}>
    Recettes récentes
  </Text>
</View>
```

#### **3. États Interactifs**

```typescript
// ✅ CORRECT - États accessibles
<TouchableOpacity
  accessibilityState={{
    disabled: isLoading,
    selected: isActive,
    busy: isProcessing,
  }}
  disabled={isLoading}
>
  <Text>{isLoading ? "Chargement..." : "Valider"}</Text>
</TouchableOpacity>
```

#### **4. Inputs et Forms**

```typescript
// ✅ CORRECT - Input accessible
<View>
  <Text className="text-sm font-medium text-warm-brown mb-1">
    Titre de la recette
  </Text>
  <TextInput
    value={title}
    onChangeText={setTitle}
    placeholder="Ex: Tarte aux pommes"
    accessibilityLabel="Titre de la recette"
    accessibilityHint="Saisissez le nom de votre recette"
    accessibilityRequired={true}
    className="border border-warm-gray/30 rounded-lg p-3"
  />
  {error && (
    <Text
      className="text-sm text-error mt-1"
      accessibilityRole="alert"
    >
      {error}
    </Text>
  )}
</View>
```

#### **5. Contraste des Couleurs**

```typescript
// ✅ CORRECT - Contraste suffisant (> 4.5:1)
<Text className="text-warm-brown">Texte lisible</Text>

// ❌ INCORRECT - Contraste insuffisant
<Text className="text-primary-300">Texte illisible</Text>
```

#### **6. Touch Targets**

```typescript
// Taille minimum : 44x44 points (iOS) / 48x48 dp (Android)

// ✅ CORRECT
<TouchableOpacity className="min-h-[44px] min-w-[44px] items-center justify-center">
  <Icon name="heart" size={20} />
</TouchableOpacity>

// ❌ INCORRECT - Trop petit
<TouchableOpacity className="p-1">  // ❌ < 44px
  <Icon name="heart" size={16} />
</TouchableOpacity>
```

---

## 🎯 **6. Composants Réutilisables**

### **Button Component**

```typescript
// src/components/ui/Button.tsx
import { TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { clsx } from "clsx";

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  className?: string;
}

export function Button({
  children,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  accessibilityLabel,
  className,
}: ButtonProps) {
  const baseClasses = "rounded-full items-center justify-center";
  
  const variantClasses = {
    primary: "bg-primary-500 active:bg-primary-600",
    secondary: "bg-cream-200 active:bg-cream-300",
    ghost: "bg-transparent active:bg-cream-100",
  };
  
  const sizeClasses = {
    sm: "px-4 py-2",
    md: "px-6 py-3",
    lg: "px-8 py-4",
  };
  
  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };
  
  const textColorClasses = {
    primary: "text-white",
    secondary: "text-warm-brown",
    ghost: "text-primary-500",
  };
  
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) && "opacity-50",
        className
      )}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "white" : "#FFB03A"} />
      ) : (
        <Text
          className={clsx(
            "font-semibold",
            textSizeClasses[size],
            textColorClasses[variant]
          )}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// Utilisation
<Button
  variant="primary"
  size="md"
  onPress={handleSubmit}
  loading={isSubmitting}
  accessibilityLabel="Enregistrer la recette"
>
  Enregistrer
</Button>
```

### **Card Component**

```typescript
// src/components/ui/Card.tsx
import { View, TouchableOpacity, Image, Text } from "react-native";
import { clsx } from "clsx";

interface CardProps {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  onPress?: () => void;
  variant?: "default" | "highlighted";
  className?: string;
}

export function Card({
  title,
  subtitle,
  imageUrl,
  onPress,
  variant = "default",
  className,
}: CardProps) {
  const Wrapper = onPress ? TouchableOpacity : View;
  
  return (
    <Wrapper
      onPress={onPress}
      accessible={!!onPress}
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={onPress ? `Ouvrir ${title}` : undefined}
      className={clsx(
        "bg-white rounded-2xl overflow-hidden shadow-sm",
        variant === "highlighted" && "border-2 border-primary-500",
        onPress && "active:opacity-80",
        className
      )}
    >
      {imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          className="w-full h-48"
          resizeMode="cover"
        />
      )}
      <View className="p-4">
        <Text className="text-lg font-semibold text-warm-brown">
          {title}
        </Text>
        {subtitle && (
          <Text className="text-sm text-warm-gray mt-1">
            {subtitle}
          </Text>
        )}
      </View>
    </Wrapper>
  );
}
```

### **Input Component**

```typescript
// src/components/ui/Input.tsx
import { View, Text, TextInput, TextInputProps } from "react-native";
import { clsx } from "clsx";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  required?: boolean;
  helperText?: string;
}

export function Input({
  label,
  error,
  required,
  helperText,
  className,
  ...props
}: InputProps) {
  const inputId = props.accessibilityLabel || label;
  
  return (
    <View className="mb-4">
      {label && (
        <Text className="text-sm font-medium text-warm-brown mb-1">
          {label}
          {required && <Text className="text-error"> *</Text>}
        </Text>
      )}
      
      <TextInput
        {...props}
        accessibilityLabel={inputId}
        accessibilityRequired={required}
        className={clsx(
          "bg-white border rounded-lg p-3 text-base text-warm-brown",
          error ? "border-error" : "border-warm-gray/30",
          "focus:border-primary-500",
          className
        )}
        placeholderTextColor="#8B7355"
      />
      
      {error && (
        <Text
          className="text-sm text-error mt-1"
          accessibilityRole="alert"
          accessibilityLive="polite"
        >
          {error}
        </Text>
      )}
      
      {helperText && !error && (
        <Text className="text-xs text-warm-gray mt-1">
          {helperText}
        </Text>
      )}
    </View>
  );
}
```

---

## ⚡ **7. Performance**

### **Optimisations React**

```typescript
// 1. Memoization
const ExpensiveComponent = memo(({ data }) => {
  const processed = useMemo(() => {
    return heavyComputation(data);
  }, [data]);
  
  return <View>{processed}</View>;
});

// 2. useCallback pour fonctions
const handlePress = useCallback(() => {
  doSomething(id);
}, [id]);

// 3. Lazy loading
const HeavyScreen = lazy(() => import("./HeavyScreen"));

// 4. FlatList optimisée
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### **Images Optimisées**

```typescript
import { Image } from "expo-image";

// ✅ CORRECT - Image optimisée
<Image
  source={{ uri: imageUrl }}
  placeholder={blurhash}
  contentFit="cover"
  transition={200}
  cachePolicy="memory-disk"
  className="w-full h-48"
/>
```

---

## ✅ **8. Checklist Qualité**

### **Avant Chaque Commit**

#### **Responsive**
- [ ] Testé sur mobile (< 640px)
- [ ] Testé sur tablet (768px)
- [ ] Safe areas respectées
- [ ] Pas de scroll horizontal
- [ ] Touch targets > 44px

#### **Accessibilité**
- [ ] Tous les boutons ont accessibilityLabel
- [ ] Contraste > 4.5:1 (texte) / 3:1 (UI)
- [ ] Hiérarchie de titres logique
- [ ] Inputs avec labels
- [ ] États (loading, error, success) annoncés

#### **Performance**
- [ ] Pas de re-render inutiles
- [ ] Images optimisées
- [ ] Listes virtualisées (FlatList)
- [ ] Pas de console.log en prod

#### **Code Quality**
- [ ] Pas de any en TypeScript
- [ ] Composants < 200 lignes
- [ ] Props documentées
- [ ] Naming explicite
- [ ] Pas de code dupliqué

#### **Design System**
- [ ] Couleurs "Warm & Cozy" uniquement
- [ ] Typographie Poppins
- [ ] Spacing cohérent (4px scale)
- [ ] Composants réutilisables
- [ ] Pas de magic numbers

---

## 🎨 **9. Animations**

### **Principes**

- **Subtiles** : Ne pas distraire
- **Rapides** : 150-300ms max
- **Naturelles** : Easing curves douces

### **Animations Recommandées**

```typescript
import Animated, {
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

// Fade in/out
const fadeIn = useAnimatedStyle(() => ({
  opacity: withTiming(visible ? 1 : 0, { duration: 200 }),
}));

// Scale (boutons)
const scale = useAnimatedStyle(() => ({
  transform: [{ scale: withSpring(pressed ? 0.95 : 1) }],
}));

// Slide (modals)
const slideUp = useAnimatedStyle(() => ({
  transform: [{
    translateY: withSpring(visible ? 0 : 1000, {
      damping: 20,
      stiffness: 90,
    }),
  }],
}));
```

---

## 📖 **10. Conventions de Nommage**

### **Fichiers**

```
PascalCase    → Composants React (Button.tsx)
camelCase     → Hooks, utils (useAuth.ts)
kebab-case    → Styles, assets (app-icon.png)
```

### **Composants**

```typescript
// ✅ CORRECT
export function RecipeCard({ recipe }: RecipeCardProps) {}

// ❌ INCORRECT
export function recipeCard() {}  // ❌ Pas PascalCase
export const RecipeCard = () => {}  // ❌ Préférer function
```

### **Props**

```typescript
// ✅ CORRECT - Props explicites
interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary";
  isLoading?: boolean;
  isDisabled?: boolean;
}

// ❌ INCORRECT - Props vagues
interface ButtonProps {
  text: string;  // ❌ Utiliser children
  onClick: () => void;  // ❌ React Native utilise onPress
  type: string;  // ❌ Pas typé
}
```

---

## 🎯 **11. Architecture Composants**

### **Structure Recommandée**

```typescript
// src/components/recipes/RecipeCard.tsx

// 1. Imports
import { View, Text, Image, TouchableOpacity } from "react-native";
import { Recipe } from "@/types";

// 2. Types/Interfaces
interface RecipeCardProps {
  recipe: Recipe;
  onPress: () => void;
}

// 3. Constantes
const CARD_HEIGHT = 200;

// 4. Composant
export function RecipeCard({ recipe, onPress }: RecipeCardProps) {
  // Hooks
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Handlers
  const handleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
  }, [isFavorite]);
  
  // Render helpers
  const renderImage = () => (
    <Image source={{ uri: recipe.imageUrl }} />
  );
  
  // Main render
  return (
    <TouchableOpacity onPress={onPress}>
      {renderImage()}
      <View>
        <Text>{recipe.title}</Text>
      </View>
    </TouchableOpacity>
  );
}

// 5. Styles (si nécessaire)
// 6. Exports nommés additionnels
```

---

## 📚 **12. Resources**

### **Outils Recommandés**

- **Contrast Checker** : https://webaim.org/resources/contrastchecker/
- **React Native Debugger** : https://github.com/jhen0409/react-native-debugger
- **Expo Go** : Test sur vrais devices
- **Accessibility Scanner** : Android uniquement

### **Documentation**

- React Native : https://reactnative.dev
- NativeWind : https://nativewind.dev
- Accessibility : https://reactnative.dev/docs/accessibility

---

*UI Guidelines v1.0 - Paprika*
*Design System et Best Practices Front*
*Dernière mise à jour : 3 novembre 2025*

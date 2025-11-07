# **09 - Design System Paprika**

*Guide d'utilisation du système de design - StyleSheet natif*

**Date de création** : 7 novembre 2025
**Dernière mise à jour** : 7 novembre 2025

---

## 📋 **Table des matières**

1. [Vue d'ensemble](#vue-densemble)
2. [Thème](#thème)
3. [Composants UI](#composants-ui)
4. [Exemples d'utilisation](#exemples-dutilisation)
5. [Best Practices](#best-practices)

---

## 🎨 **Vue d'ensemble**

Le design system Paprika est construit avec **React Native StyleSheet natif** pour une stabilité maximale et des performances optimales.

### Philosophie : "Warm & Cozy"

Chaleureux, accueillant, confortable - comme la cuisine familiale.

### Architecture

```
src/
├── theme/              # Tokens de design
│   ├── colors.ts       # Palette de couleurs
│   ├── spacing.ts      # Système d'espacement
│   ├── typography.ts   # Typographie
│   ├── shadows.ts      # Ombres
│   └── index.ts        # Export centralisé
└── components/ui/      # Composants réutilisables
    ├── Text.tsx        # Composant Text typé
    ├── Button.tsx      # Composant Button
    ├── Container.tsx   # Conteneur principal
    └── index.ts        # Export centralisé
```

---

## 🎨 **Thème**

### Colors

```typescript
import { colors } from "@/theme";

// Primary - Orange doux
colors.primary.DEFAULT  // "#FFB03A"
colors.primary[500]     // "#FFB03A"
colors.primary[600]     // "#E69A34"

// Cream - Crème chaleureux
colors.cream.DEFAULT    // "#FFF9F0"
colors.cream[100]       // "#FFF9F0"

// Warm tones
colors.warm.brown       // "#6B5847"
colors.warm.gray        // "#8B7355"

// Semantic
colors.success          // "#4CAF50"
colors.error            // "#F44336"
colors.warning          // "#FF9800"
colors.info             // "#2196F3"
```

### Spacing

```typescript
import { spacing } from "@/theme";

spacing.xs    // 4px
spacing.sm    // 8px
spacing.md    // 16px
spacing.lg    // 24px
spacing.xl    // 32px
spacing["2xl"] // 40px
spacing["3xl"] // 48px
```

### Typography

```typescript
import { fontSizes, fontWeights } from "@/theme";

// Font Sizes
fontSizes.xs     // 12px
fontSizes.base   // 16px
fontSizes.xl     // 20px
fontSizes["4xl"] // 36px

// Font Weights
fontWeights.normal    // "400"
fontWeights.semibold  // "600"
fontWeights.bold      // "700"
```

### Shadows

```typescript
import { shadows } from "@/theme";

shadows.sm   // Légère
shadows.md   // Moyenne
shadows.lg   // Forte
```

---

## 🧩 **Composants UI**

### Text

Composant Text avec variants pré-définis.

```typescript
import { Text } from "@/components/ui";

// Variants disponibles
<Text variant="h1">Titre principal</Text>
<Text variant="h2">Sous-titre</Text>
<Text variant="body">Texte normal</Text>
<Text variant="caption">Petit texte</Text>

// Customisation
<Text variant="body" color="primary" weight="bold">
  Texte personnalisé
</Text>
```

**Props :**
- `variant`: "h1" | "h2" | "h3" | "h4" | "body" | "bodyLarge" | "bodySmall" | "caption"
- `color`: Nom de couleur du thème ou valeur hex
- `weight`: "light" | "normal" | "medium" | "semibold" | "bold"

### Button

Composant Button avec variants et tailles.

```typescript
import { Button } from "@/components/ui";

// Variants
<Button variant="primary">Primary</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>

// Tailles
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// États
<Button loading>Chargement...</Button>
<Button disabled>Désactivé</Button>
```

**Props :**
- `variant`: "primary" | "secondary" | "outline" | "ghost"
- `size`: "sm" | "md" | "lg"
- `loading`: boolean
- `disabled`: boolean

### Container

Conteneur principal avec padding et centrage.

```typescript
import { Container } from "@/components/ui";

// Simple
<Container>
  <Text>Contenu</Text>
</Container>

// Centré
<Container centered>
  <Text>Contenu centré</Text>
</Container>

// Padding personnalisé
<Container padding="xl">
  <Text>Plus de padding</Text>
</Container>
```

**Props :**
- `padding`: Clé de `spacing` (xs, sm, md, lg, xl, etc.)
- `centered`: boolean - Centre le contenu verticalement et horizontalement

---

## 💡 **Exemples d'utilisation**

### Exemple 1 : Page simple

```typescript
import { Container, Text, Button } from "@/components/ui";
import { spacing } from "@/theme";

export default function WelcomeScreen() {
  return (
    <Container centered>
      <Text variant="h1" color="primary">
        🍳 Bienvenue
      </Text>
      <Text variant="body" style={{ marginTop: spacing.md }}>
        Découvrez vos recettes préférées
      </Text>
      <Button
        variant="primary"
        size="lg"
        style={{ marginTop: spacing.xl }}
        onPress={() => console.log("Action")}
      >
        Commencer
      </Button>
    </Container>
  );
}
```

### Exemple 2 : Card de recette

```typescript
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, shadows } from "@/theme";

export function RecipeCard({ title, description }: { title: string; description: string }) {
  return (
    <View style={styles.card}>
      <Text variant="h3">{title}</Text>
      <Text variant="bodySmall" style={{ marginTop: spacing.sm }}>
        {description}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    ...shadows.md,
  },
});
```

### Exemple 3 : Utilisation directe du thème

```typescript
import { View, StyleSheet } from "react-native";
import { colors, spacing, shadows } from "@/theme";

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.cream.DEFAULT,
    padding: spacing.lg,
    borderRadius: 16,
    ...shadows.lg,
  },
  title: {
    color: colors.primary.DEFAULT,
    fontSize: 24,
    fontWeight: "bold",
  },
});
```

---

## ✅ **Best Practices**

### 1. Toujours utiliser le thème

❌ **Mauvais**
```typescript
<View style={{ backgroundColor: "#FFB03A", padding: 16 }} />
```

✅ **Bon**
```typescript
import { colors, spacing } from "@/theme";

<View style={{ backgroundColor: colors.primary.DEFAULT, padding: spacing.md }} />
```

### 2. Privilégier les composants UI

❌ **Mauvais**
```typescript
<RNText style={{ fontSize: 24, fontWeight: "bold", color: "#6B5847" }}>
  Titre
</RNText>
```

✅ **Bon**
```typescript
<Text variant="h2">Titre</Text>
```

### 3. Extraire les styles complexes

❌ **Mauvais**
```typescript
<View style={{
  backgroundColor: colors.white,
  padding: spacing.md,
  borderRadius: 12,
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
}}>
```

✅ **Bon**
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 12,
    ...shadows.md,
  },
});

<View style={styles.card}>
```

### 4. Utiliser les imports d'alias

```typescript
// ✅ Bon
import { colors } from "@/theme";
import { Text } from "@/components/ui";

// ❌ Mauvais
import { colors } from "../../theme";
import { Text } from "../../components/ui/Text";
```

---

## 🔄 **Migration depuis NativeWind**

Si vous aviez du code avec Tailwind classes :

```typescript
// Avant (NativeWind)
<View className="flex-1 items-center justify-center bg-cream">
  <Text className="text-4xl font-bold text-primary">Titre</Text>
</View>

// Après (StyleSheet + Design System)
<Container centered>
  <Text variant="h1" color="primary">Titre</Text>
</Container>
```

---

## 📚 **Ressources**

- [React Native StyleSheet API](https://reactnative.dev/docs/stylesheet)
- [TypeScript avec React Native](https://reactnative.dev/docs/typescript)
- Design system original : `docs/07-ui-guidelines.md`

---

*Design System Paprika v1.0 - 7 novembre 2025*

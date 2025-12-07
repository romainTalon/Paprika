---
name: design-system
description: Apply Paprika design system rules when styling React Native components. Use when creating styles, using colors, spacing, typography, or shadows. Ensures theme tokens are used instead of hardcoded values.
---

# Paprika Design System

## When to Use This Skill

Apply this skill automatically when:
- Creating or modifying `StyleSheet.create()` blocks
- Using colors, spacing, or typography values
- Styling React Native components
- Creating new UI components

## Core Rules

### NEVER Hardcode Values

```typescript
// ❌ NEVER DO THIS
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFF9F5',
    borderRadius: 8,
  },
});

// ✅ ALWAYS DO THIS
import { colors, spacing, borderRadius } from '@/theme';

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,           // 16px
    backgroundColor: colors.warm.cream,
    borderRadius: borderRadius.md, // 8px
  },
});
```

## Theme Token Reference

### Colors (from `src/theme/colors.ts`)
```typescript
colors.primary           // #E75C44 - Paprika brand color
colors.secondary         // #F97316 - Orange
colors.accent            // #F59E0B - Honey
colors.warm.cream        // #FFF9F5 - Warm white background
colors.warm.brown        // #2C1810 - Warm black text
colors.neutral.50-900    // Gray scale
colors.semantic.success  // #84CC16 - Green
colors.semantic.warning  // #F59E0B - Amber
colors.semantic.error    // #EF4444 - Red
colors.semantic.info     // #3B82F6 - Blue
```

### Spacing (from `src/theme/spacing.ts`)
```typescript
spacing.xs   // 4px
spacing.sm   // 8px
spacing.md   // 12px
spacing.lg   // 16px
spacing.xl   // 24px
spacing.2xl  // 32px
spacing.3xl  // 40px
```

### Typography (from `src/theme/typography.ts`)
```typescript
fontSizes.xs    // 12px
fontSizes.sm    // 14px
fontSizes.base  // 16px
fontSizes.lg    // 18px
fontSizes.xl    // 20px
fontSizes.2xl   // 24px
fontSizes.3xl   // 30px
fontSizes.4xl   // 36px

fontWeights.normal    // '400'
fontWeights.medium    // '500'
fontWeights.semibold  // '600'
fontWeights.bold      // '700'
```

### Border Radius
```typescript
borderRadius.sm   // 4px
borderRadius.md   // 8px
borderRadius.lg   // 12px
borderRadius.xl   // 16px
borderRadius.2xl  // 20px
borderRadius.full // 9999px (circular)
```

### Shadows (from `src/theme/shadows.ts`)
```typescript
shadows.sm    // Subtle shadow
shadows.md    // Medium shadow
shadows.lg    // Strong shadow
```

## UI Components to Reuse

Before creating custom styles, check if these exist:
- `Text` from `@/components/ui` - Has variants: h1-h4, body, bodyLarge, bodySmall, caption
- `Button` from `@/components/ui` - Has variants: primary, secondary, outline, ghost
- `Container` from `@/components/ui` - Layout container with optional centering

## Common Patterns

### Screen Container
```typescript
container: {
  flex: 1,
  backgroundColor: colors.warm.cream,
  padding: spacing.lg,
}
```

### Card Style
```typescript
card: {
  backgroundColor: colors.neutral.white,
  borderRadius: borderRadius.lg,
  padding: spacing.lg,
  ...shadows.md,
}
```

### Section Header
```typescript
sectionHeader: {
  fontSize: fontSizes.lg,
  fontWeight: fontWeights.semibold,
  color: colors.warm.brown,
  marginBottom: spacing.md,
}
```

## Emoji Line Height Fix

When using emojis, always add lineHeight to prevent cropping:
```typescript
emoji: {
  fontSize: 48,
  lineHeight: 56, // fontSize + 8
}
```

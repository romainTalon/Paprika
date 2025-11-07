/**
 * Paprika Spacing System
 *
 * Base: 4px
 * Scale: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96
 */

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  "2xl": 40,
  "3xl": 48,
  "4xl": 64,
  "5xl": 80,
  "6xl": 96,
} as const;

export type SpacingKey = keyof typeof spacing;

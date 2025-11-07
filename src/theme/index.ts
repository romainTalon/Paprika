/**
 * Paprika Design System
 *
 * Export all theme tokens for easy import
 * Usage: import { colors, spacing, fontSizes } from '@/theme';
 */

export * from "./colors";
export * from "./spacing";
export * from "./typography";
export * from "./shadows";

// Re-export for convenience
import { colors } from "./colors";
import { spacing } from "./spacing";
import { fontSizes, fontWeights, lineHeights } from "./typography";
import { shadows } from "./shadows";

export const theme = {
  colors,
  spacing,
  fontSizes,
  fontWeights,
  lineHeights,
  shadows,
} as const;

export default theme;

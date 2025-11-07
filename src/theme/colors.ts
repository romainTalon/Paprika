/**
 * Paprika Color Palette - "Warm & Cozy" Design System
 *
 * Philosophy: Chaleureux, accueillant, confortable (comme la cuisine familiale)
 */

export const colors = {
  // Primary - Orange doux
  primary: {
    DEFAULT: "#FFB03A",
    50: "#FFF8F0",
    100: "#FFEFD9",
    200: "#FFE0B2",
    300: "#FFD08A",
    400: "#FFC062",
    500: "#FFB03A",
    600: "#E69A34",
    700: "#CC842E",
    800: "#B36E28",
    900: "#995822",
  },

  // Cream - Crème chaleureux
  cream: {
    DEFAULT: "#FFF9F0",
    50: "#FFFCF7",
    100: "#FFF9F0",
    200: "#FFF3E0",
    300: "#FFEFD1",
    400: "#FFEAC2",
    500: "#FFE4B3",
  },

  // Warm tones
  warm: {
    brown: "#6B5847",
    gray: "#8B7355",
  },

  // Semantic colors
  success: "#4CAF50",
  warning: "#FF9800",
  error: "#F44336",
  info: "#2196F3",

  // Neutral
  white: "#FFFFFF",
  black: "#000000",
  gray: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#EEEEEE",
    300: "#E0E0E0",
    400: "#BDBDBD",
    500: "#9E9E9E",
    600: "#757575",
    700: "#616161",
    800: "#424242",
    900: "#212121",
  },

  // Transparent
  transparent: "transparent",
} as const;

export type ColorKey = keyof typeof colors;

import React from "react";
import { Text as RNText, TextProps as RNTextProps, StyleSheet } from "react-native";
import { colors, fontSizes, fontWeights, lineHeights } from "@/theme";

type TextVariant = "h1" | "h2" | "h3" | "h4" | "body" | "bodyLarge" | "bodySmall" | "caption";

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: keyof typeof colors | string;
  weight?: keyof typeof fontWeights;
}

export function Text({ variant = "body", color, weight, style, ...props }: TextProps) {
  const variantStyle = styles[variant];
  const colorStyle = color ? { color: getColor(color) } : undefined;
  const weightStyle = weight ? { fontWeight: fontWeights[weight] } : undefined;

  return <RNText style={[variantStyle, colorStyle, weightStyle, style]} {...props} />;
}

function getColor(color: string): string {
  // Check if it's a direct color value (starts with #)
  if (color.startsWith("#")) {
    return color;
  }

  // Check if it's a color key
  if (color in colors) {
    const colorValue = colors[color as keyof typeof colors];
    return typeof colorValue === "string" ? colorValue : colorValue.DEFAULT || colorValue[500];
  }

  return color;
}

const styles = StyleSheet.create({
  h1: {
    fontSize: fontSizes["4xl"],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes["4xl"] * lineHeights.tight,
    color: colors.warm.brown,
  },
  h2: {
    fontSize: fontSizes["3xl"],
    fontWeight: fontWeights.bold,
    lineHeight: fontSizes["3xl"] * lineHeights.tight,
    color: colors.warm.brown,
  },
  h3: {
    fontSize: fontSizes["2xl"],
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes["2xl"] * lineHeights.tight,
    color: colors.warm.brown,
  },
  h4: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.semibold,
    lineHeight: fontSizes.xl * lineHeights.normal,
    color: colors.warm.brown,
  },
  body: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.base * lineHeights.normal,
    color: colors.warm.brown,
  },
  bodyLarge: {
    fontSize: fontSizes.lg,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.lg * lineHeights.normal,
    color: colors.warm.brown,
  },
  bodySmall: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.sm * lineHeights.normal,
    color: colors.warm.gray,
  },
  caption: {
    fontSize: fontSizes.xs,
    fontWeight: fontWeights.normal,
    lineHeight: fontSizes.xs * lineHeights.normal,
    color: colors.warm.gray,
  },
});

import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/theme";

export interface ContainerProps extends ViewProps {
  padding?: keyof typeof spacing;
  centered?: boolean;
  /** Whether to use SafeAreaView (default: false for screens with custom header) */
  useSafeArea?: boolean;
  /** Which edges to apply safe area insets to (default: all) */
  safeAreaEdges?: ("top" | "right" | "bottom" | "left")[];
}

export function Container({
  padding = "md",
  centered = false,
  useSafeArea = false,
  safeAreaEdges = ["top", "right", "bottom", "left"],
  style,
  ...props
}: ContainerProps) {
  const containerStyle = [
    styles.base,
    { padding: spacing[padding] },
    centered && styles.centered,
    style
  ];

  if (useSafeArea) {
    return (
      <SafeAreaView edges={safeAreaEdges} style={containerStyle} {...props} />
    );
  }

  return (
    <View style={containerStyle} {...props} />
  );
}

const styles = StyleSheet.create({
  base: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },
  centered: {
    alignItems: "center",
    justifyContent: "center",
  },
});

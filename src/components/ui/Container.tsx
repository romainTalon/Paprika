import React from "react";
import { View, ViewProps, StyleSheet } from "react-native";
import { colors, spacing } from "@/theme";

export interface ContainerProps extends ViewProps {
  padding?: keyof typeof spacing;
  centered?: boolean;
}

export function Container({ padding = "md", centered = false, style, ...props }: ContainerProps) {
  return (
    <View
      style={[styles.base, { padding: spacing[padding] }, centered && styles.centered, style]}
      {...props}
    />
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

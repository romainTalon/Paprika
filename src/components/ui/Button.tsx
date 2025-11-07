import React from "react";
import {
  TouchableOpacity,
  TouchableOpacityProps,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { Text } from "./Text";
import { colors, spacing, shadows } from "@/theme";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends TouchableOpacityProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: string;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  style,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        styles[size],
        isDisabled && styles.disabled,
        style,
      ]}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.white : colors.primary.DEFAULT}
        />
      ) : (
        <Text
          weight="semibold"
          style={[
            styles.text,
            variant === "primary" && styles.textPrimary,
            variant === "secondary" && styles.textSecondary,
            variant === "outline" && styles.textOutline,
            variant === "ghost" && styles.textGhost,
          ]}
        >
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    ...shadows.sm,
  },

  // Variants
  primary: {
    backgroundColor: colors.primary.DEFAULT,
  },
  secondary: {
    backgroundColor: colors.cream.DEFAULT,
    borderWidth: 1,
    borderColor: colors.cream[300],
  },
  outline: {
    backgroundColor: colors.transparent,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  ghost: {
    backgroundColor: colors.transparent,
  },

  // Sizes
  sm: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  md: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  lg: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  // Text colors
  text: {
    fontSize: 16,
  },
  textPrimary: {
    color: colors.white,
  },
  textSecondary: {
    color: colors.warm.brown,
  },
  textOutline: {
    color: colors.primary.DEFAULT,
  },
  textGhost: {
    color: colors.primary.DEFAULT,
  },
});

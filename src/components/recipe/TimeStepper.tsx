/**
 * TimeStepper Component
 *
 * A stepper-style input for time duration with separate hours and minutes controls
 * Converts to/from minutes for storage in the database
 */

import React, { useMemo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing } from "@/theme";

interface TimeStepperProps {
  /** Label displayed above the stepper */
  label: string;
  /** Current value in minutes */
  value: number | undefined;
  /** Callback when value changes (receives total minutes) */
  onChange: (minutes: number | undefined) => void;
  /** Whether the stepper is disabled */
  disabled?: boolean;
}

export function TimeStepper({
  label,
  value,
  onChange,
  disabled = false,
}: TimeStepperProps) {
  // Convert minutes to hours and minutes
  const { hours, minutes } = useMemo(() => {
    if (value === undefined || value === 0) {
      return { hours: 0, minutes: 0 };
    }
    return {
      hours: Math.floor(value / 60),
      minutes: value % 60,
    };
  }, [value]);

  // Handle hour change
  const handleHourChange = (delta: number) => {
    if (disabled) return;

    const newHours = Math.max(0, hours + delta);
    const newTotalMinutes = newHours * 60 + minutes;

    // If total is 0, set to undefined
    onChange(newTotalMinutes === 0 ? undefined : newTotalMinutes);
  };

  // Handle minute change
  const handleMinuteChange = (delta: number) => {
    if (disabled) return;

    const newMinutes = Math.max(0, minutes + delta);
    const newTotalMinutes = hours * 60 + newMinutes;

    // If total is 0, set to undefined
    onChange(newTotalMinutes === 0 ? undefined : newTotalMinutes);
  };

  return (
    <View style={styles.container}>
      {/* Label */}
      <Text variant="bodySmall" style={styles.label}>
        {label}
      </Text>

      {/* Hours Row */}
      <View style={styles.row}>
        <Text variant="body" style={styles.rowLabel}>
          Heures
        </Text>
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={() => handleHourChange(-1)}
            disabled={disabled || hours === 0}
            accessibilityRole="button"
            accessibilityLabel="Diminuer les heures"
            accessibilityHint="Retire 1 heure"
          >
            <Text style={styles.buttonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.valueContainer}>
            <Text variant="h2" style={styles.valueText}>
              {hours}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={() => handleHourChange(1)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Augmenter les heures"
            accessibilityHint="Ajoute 1 heure"
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Minutes Row */}
      <View style={styles.row}>
        <Text variant="body" style={styles.rowLabel}>
          Minutes
        </Text>
        <View style={styles.stepperContainer}>
          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={() => handleMinuteChange(-15)}
            disabled={disabled || minutes === 0}
            accessibilityRole="button"
            accessibilityLabel="Diminuer les minutes"
            accessibilityHint="Retire 15 minutes"
          >
            <Text style={styles.buttonText}>−</Text>
          </TouchableOpacity>

          <View style={styles.valueContainer}>
            <Text variant="h2" style={styles.valueText}>
              {minutes}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, disabled && styles.buttonDisabled]}
            onPress={() => handleMinuteChange(15)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel="Augmenter les minutes"
            accessibilityHint="Ajoute 15 minutes"
          >
            <Text style={styles.buttonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },

  label: {
    color: colors.warm.brown,
    fontWeight: "600",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },

  rowLabel: {
    flex: 1,
    color: colors.warm.gray,
  },

  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 2,
  },

  button: {
    width: 44,
    height: 44,
    borderRadius: spacing.md,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary[600],
  },

  buttonDisabled: {
    backgroundColor: colors.gray[200],
    borderColor: colors.gray[300],
  },

  buttonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
    lineHeight: 28,
  },

  valueContainer: {
    flex: 1,
    minWidth: 60,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cream[100],
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },

  valueText: {
    color: colors.warm.brown,
    fontWeight: "600",
  },
});

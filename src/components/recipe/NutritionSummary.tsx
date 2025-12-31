/**
 * NutritionSummary Component
 *
 * Displays nutritional information for a recipe with 3 states:
 * - Loading: Shows ActivityIndicator during calculation
 * - Empty: Shows button to calculate nutrition
 * - Data: Displays 6 macros in a grid (calories, protein, carbs, fat, fiber, sugar)
 *
 * @module components/recipe/NutritionSummary
 */

import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Text, Button } from "@/components/ui";
import { colors, spacing, fontSizes, fontWeights } from "@/theme";

interface NutritionSummaryProps {
  nutrition: {
    perServing: {
      calories: number;
      protein: number;
      carbohydrates: number;
      fat: number;
      fiber: number;
      sugar: number;
    };
  } | null;
  isCalculating: boolean;
  onCalculate: () => void;
  isPremium: boolean;
}

export function NutritionSummary({
  nutrition,
  isCalculating,
  onCalculate,
  isPremium,
}: NutritionSummaryProps) {
  const router = useRouter();

  // Premium gate: Show blurred overlay for free users
  if (!isPremium) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="h3" style={styles.title}>
            Informations Nutritionnelles
          </Text>
          <Text variant="caption" color="neutral" style={styles.subtitle}>
            Par portion
          </Text>
        </View>

        {/* Premium overlay */}
        <View style={styles.blurContainer}>
          <View style={styles.premiumOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text variant="h3" style={styles.premiumTitle}>
              Fonctionnalité Premium
            </Text>
            <Text variant="body" color="neutral" style={styles.premiumDescription}>
              Accédez aux valeurs nutritionnelles détaillées calculées par IA
            </Text>
            <Button
              variant="primary"
              size="lg"
              onPress={() => router.push("/premium" as any)}
              style={styles.premiumButton}
            >
              Passer Premium - 4,99€/mois
            </Button>
          </View>
        </View>
      </View>
    );
  }
  // Loading state
  if (isCalculating) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="h3" style={styles.title}>
            Informations Nutritionnelles
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text variant="body" color="neutral" style={styles.loadingText}>
            Calcul en cours...
          </Text>
        </View>
      </View>
    );
  }

  // No nutrition data
  if (!nutrition) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text variant="h3" style={styles.title}>
            Informations Nutritionnelles
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text variant="body" color="neutral" style={styles.emptyText}>
            Les informations nutritionnelles n'ont pas encore été calculées.
          </Text>
          <Button
            variant="outline"
            size="md"
            onPress={onCalculate}
            style={styles.calculateButton}
          >
            Calculer la nutrition
          </Button>
        </View>
      </View>
    );
  }

  // Display nutrition data
  const { perServing } = nutrition;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="h3" style={styles.title}>
          Informations Nutritionnelles
        </Text>
        <Text variant="caption" color="neutral" style={styles.subtitle}>
          Par portion
        </Text>
      </View>

      <View style={styles.grid}>
        {/* Calories */}
        <View style={styles.macro}>
          <Text variant="h2" style={styles.macroValue}>
            {Math.round(perServing.calories)}
          </Text>
          <Text variant="caption" color="neutral">
            kcal
          </Text>
        </View>

        {/* Protein */}
        <View style={styles.macro}>
          <Text variant="h3" style={styles.macroValue}>
            {perServing.protein.toFixed(1)}g
          </Text>
          <Text variant="caption" color="neutral">
            Protéines
          </Text>
        </View>

        {/* Carbs */}
        <View style={styles.macro}>
          <Text variant="h3" style={styles.macroValue}>
            {perServing.carbohydrates.toFixed(1)}g
          </Text>
          <Text variant="caption" color="neutral">
            Glucides
          </Text>
        </View>

        {/* Fat */}
        <View style={styles.macro}>
          <Text variant="h3" style={styles.macroValue}>
            {perServing.fat.toFixed(1)}g
          </Text>
          <Text variant="caption" color="neutral">
            Lipides
          </Text>
        </View>

        {/* Fiber */}
        <View style={styles.macro}>
          <Text variant="h3" style={styles.macroValue}>
            {perServing.fiber.toFixed(1)}g
          </Text>
          <Text variant="caption" color="neutral">
            Fibres
          </Text>
        </View>

        {/* Sugar */}
        <View style={styles.macro}>
          <Text variant="h3" style={styles.macroValue}>
            {perServing.sugar.toFixed(1)}g
          </Text>
          <Text variant="caption" color="neutral">
            Sucres
          </Text>
        </View>
      </View>

      {/* Recalculate button */}
      <Button
        variant="ghost"
        size="sm"
        onPress={onCalculate}
        style={styles.recalculateButton}
      >
        Recalculer
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    padding: spacing.lg,
    marginVertical: spacing.md,
  },

  header: {
    marginBottom: spacing.md,
  },

  title: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  subtitle: {
    fontSize: fontSizes.sm,
  },

  // Loading
  loadingContainer: {
    alignItems: "center",
    paddingVertical: spacing.xl,
  },

  loadingText: {
    marginTop: spacing.md,
  },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },

  emptyText: {
    textAlign: "center",
    marginBottom: spacing.md,
  },

  calculateButton: {
    marginTop: spacing.sm,
  },

  // Nutrition grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },

  macro: {
    flex: 1,
    minWidth: "30%",
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.cream.DEFAULT,
    borderRadius: spacing.sm,
  },

  macroValue: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.bold as any,
    marginBottom: spacing.xs,
  },

  recalculateButton: {
    marginTop: spacing.md,
    alignSelf: "center",
  },

  // Premium overlay
  blurContainer: {
    borderRadius: spacing.md,
    overflow: "hidden",
    minHeight: 200,
    backgroundColor: "rgba(255, 249, 240, 0.95)", // Cream with opacity
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    borderStyle: "dashed",
  },

  premiumOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },

  lockIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },

  premiumTitle: {
    color: colors.warm.brown,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  premiumDescription: {
    textAlign: "center",
    maxWidth: 280,
  },

  premiumButton: {
    marginTop: spacing.md,
  },
});

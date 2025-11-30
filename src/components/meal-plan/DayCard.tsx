/**
 * Day Card Component
 *
 * Displays a single day card with day header and 4 meal slots.
 *
 * @module components/meal-plan/DayCard
 */

import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@/components/ui";
import { MealSlotRow } from "./MealSlotRow";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import type { WeekDay, MealType, MealSlot } from "@/types";
import type { Recipe } from "@/hooks/useRecipes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface DayCardProps {
  /** Day of the week */
  day: WeekDay;
  /** Date for this day */
  date: Date;
  /** All recipes (to pass to MealSlotRow) */
  allRecipes?: Recipe[];
  /** Function to get meal slots for a specific meal */
  getMealSlots: (day: WeekDay, meal: MealType) => MealSlot[];
  /** Callback when a meal slot is pressed */
  onMealPress: (day: WeekDay, meal: MealType) => void;
}

// Meal types configuration
const MEAL_TYPES: { type: MealType; icon: string; label: string }[] = [
  { type: "breakfast", icon: "🍳", label: "Petit-déj" },
  { type: "lunch", icon: "🍽️", label: "Déjeuner" },
  { type: "dinner", icon: "🍲", label: "Dîner" },
  { type: "snack", icon: "🍎", label: "Snack" },
];

// Day name mapping
const DAY_NAMES: Record<WeekDay, string> = {
  monday: "LUNDI",
  tuesday: "MARDI",
  wednesday: "MERCREDI",
  thursday: "JEUDI",
  friday: "VENDREDI",
  saturday: "SAMEDI",
  sunday: "DIMANCHE",
};

export function DayCard({
  day,
  date,
  allRecipes,
  getMealSlots,
  onMealPress,
}: DayCardProps) {
  // Format date (e.g., "6 janvier")
  const formattedDate = format(date, "d MMMM", { locale: fr });

  return (
    <View style={styles.card}>
      {/* Day Header */}
      <View style={styles.header}>
        <Text style={styles.dayName}>{DAY_NAMES[day]}</Text>
        <Text style={styles.date}>{formattedDate}</Text>
      </View>

      {/* Separator */}
      <View style={styles.separator} />

      {/* Meal Slots */}
      <View style={styles.meals}>
        {MEAL_TYPES.map(({ type, icon, label }) => {
          const mealSlots = getMealSlots(day, type);

          return (
            <MealSlotRow
              key={type}
              mealType={type}
              icon={icon}
              label={label}
              mealSlots={mealSlots}
              allRecipes={allRecipes}
              onPress={() => onMealPress(day, type)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: spacing.sm,
  },

  dayName: {
    fontSize: fontSizes.xl,
    fontWeight: fontWeights.bold as any,
    color: colors.warm.brown,
    letterSpacing: 0.5,
  },

  date: {
    fontSize: fontSizes.sm,
    fontWeight: fontWeights.medium as any,
    color: colors.gray[600],
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginBottom: spacing.sm,
  },

  // Meals Container
  meals: {
    gap: spacing.xs,
  },
});

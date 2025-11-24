/**
 * Meal Plan Screen
 *
 * Weekly meal planning interface with 7 days × 4 meal types grid.
 * Allows selecting recipes for each meal slot and adjusting servings.
 *
 * @module app/(tabs)/meal-plan
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Container, Text, Button } from "@/components/ui";
import { MealSlotCard } from "@/components/meal-plan";
import RecipePickerModal from "@/components/modals/RecipePickerModal";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import {
  useMealPlan,
  useUpdateMealSlot,
  useClearMealSlot,
  useMarkMealCooked,
  useClearWeekMealPlan,
} from "@/hooks/useMealPlans";
import { useRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { MealPlanService } from "@/services";
import type { MealType, WeekDay, MealSlot, getMealSlotKey } from "@/types";
import { addWeeks, subWeeks, format, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";

// Meal types and days configuration
const MEAL_TYPES: { type: MealType; icon: string; label: string }[] = [
  { type: "breakfast", icon: "🍳", label: "Petit-déj" },
  { type: "lunch", icon: "🍽️", label: "Déjeuner" },
  { type: "dinner", icon: "🍲", label: "Dîner" },
  { type: "snack", icon: "🍎", label: "Snack" },
];

const WEEK_DAYS: { day: WeekDay; label: string; shortLabel: string }[] = [
  { day: "monday", label: "Lundi", shortLabel: "Lun" },
  { day: "tuesday", label: "Mardi", shortLabel: "Mar" },
  { day: "wednesday", label: "Mercredi", shortLabel: "Mer" },
  { day: "thursday", label: "Jeudi", shortLabel: "Jeu" },
  { day: "friday", label: "Vendredi", shortLabel: "Ven" },
  { day: "saturday", label: "Samedi", shortLabel: "Sam" },
  { day: "sunday", label: "Dimanche", shortLabel: "Dim" },
];

export default function MealPlanScreen() {
  const { user } = useAuth();
  const userId = user?.id;

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return MealPlanService.getMondayOfWeek(); // YYYY-MM-DD format
  });

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: WeekDay;
    meal: MealType;
  } | null>(null);

  // Fetch meal plan for current week
  const { data: mealPlan, isLoading, error, refetch } = useMealPlan(userId!, currentWeekStart);

  // Fetch all recipes (to display in slots)
  const { data: allRecipes } = useRecipes(userId!);

  // Mutations
  const updateSlot = useUpdateMealSlot();
  const clearSlot = useClearMealSlot();
  const markCooked = useMarkMealCooked();
  const clearWeek = useClearWeekMealPlan();

  // Week navigation handlers
  const handlePrevWeek = useCallback(() => {
    const prevWeek = subWeeks(new Date(currentWeekStart), 1);
    setCurrentWeekStart(format(startOfWeek(prevWeek, { weekStartsOn: 1 }), "yyyy-MM-dd"));
  }, [currentWeekStart]);

  const handleNextWeek = useCallback(() => {
    const nextWeek = addWeeks(new Date(currentWeekStart), 1);
    setCurrentWeekStart(format(startOfWeek(nextWeek, { weekStartsOn: 1 }), "yyyy-MM-dd"));
  }, [currentWeekStart]);

  const handleCurrentWeek = useCallback(() => {
    setCurrentWeekStart(MealPlanService.getMondayOfWeek());
  }, []);

  // Format week range for display
  const weekRangeText = useMemo(() => {
    const start = new Date(currentWeekStart);
    const end = addWeeks(start, 1);
    end.setDate(end.getDate() - 1); // Last day of week (Sunday)

    const startFormatted = format(start, "d MMM", { locale: fr });
    const endFormatted = format(end, "d MMM yyyy", { locale: fr });

    return `Semaine du ${startFormatted} - ${endFormatted}`;
  }, [currentWeekStart]);

  // Slot handlers
  const handleSlotPress = useCallback(
    (day: WeekDay, meal: MealType) => {
      setSelectedSlot({ day, meal });
      setModalVisible(true);
    },
    []
  );

  const handleRecipeSelect = useCallback(
    async (recipeId: string, servings: number) => {
      if (!selectedSlot || !userId || !mealPlan) return;

      try {
        await updateSlot.mutateAsync({
          mealPlanId: mealPlan.id,
          userId,
          weekStart: currentWeekStart,
          day: selectedSlot.day,
          meal: selectedSlot.meal,
          mealSlot: {
            recipeId,
            servings,
            isCooked: false,
          },
        });

        Alert.alert("Succès", "Repas ajouté au planning !");
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Impossible d'ajouter le repas"
        );
      }
    },
    [selectedSlot, userId, mealPlan, currentWeekStart, updateSlot]
  );

  const handleRemoveSlot = useCallback(
    async (day: WeekDay, meal: MealType) => {
      if (!userId || !mealPlan) return;

      Alert.alert(
        "Supprimer",
        "Êtes-vous sûr de vouloir supprimer ce repas du planning ?",
        [
          { text: "Annuler", style: "cancel" },
          {
            text: "Supprimer",
            style: "destructive",
            onPress: async () => {
              try {
                await clearSlot.mutateAsync({
                  mealPlanId: mealPlan.id,
                  userId,
                  weekStart: currentWeekStart,
                  day,
                  meal,
                });
              } catch (error) {
                Alert.alert(
                  "Erreur",
                  error instanceof Error ? error.message : "Impossible de supprimer le repas"
                );
              }
            },
          },
        ]
      );
    },
    [userId, mealPlan, currentWeekStart, clearSlot]
  );

  const handleToggleCooked = useCallback(
    async (day: WeekDay, meal: MealType, currentStatus: boolean) => {
      if (!userId || !mealPlan) return;

      try {
        await markCooked.mutateAsync({
          mealPlanId: mealPlan.id,
          userId,
          weekStart: currentWeekStart,
          day,
          meal,
          isCooked: !currentStatus,
        });
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Impossible de modifier le statut"
        );
      }
    },
    [userId, mealPlan, currentWeekStart, markCooked]
  );

  const handleClearWeek = useCallback(() => {
    if (!userId || !mealPlan) return;

    Alert.alert(
      "Effacer la semaine",
      "Êtes-vous sûr de vouloir supprimer tous les repas de cette semaine ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Tout effacer",
          style: "destructive",
          onPress: async () => {
            try {
              await clearWeek.mutateAsync({
                mealPlanId: mealPlan.id,
                userId,
                weekStart: currentWeekStart,
              });
              Alert.alert("Succès", "La semaine a été effacée !");
            } catch (error) {
              Alert.alert(
                "Erreur",
                error instanceof Error ? error.message : "Impossible d'effacer la semaine"
              );
            }
          },
        },
      ]
    );
  }, [userId, mealPlan, currentWeekStart, clearWeek]);

  // Get meal slot from meal plan
  const getMealSlot = useCallback(
    (day: WeekDay, meal: MealType): MealSlot | null => {
      if (!mealPlan?.meals) return null;
      const key = `${day}-${meal}`;
      return (mealPlan.meals as Record<string, MealSlot>)[key] || null;
    },
    [mealPlan]
  );

  // Get recipe for meal slot
  const getRecipeForSlot = useCallback(
    (mealSlot: MealSlot | null) => {
      if (!mealSlot || !allRecipes) return undefined;
      return allRecipes.find((r) => r.id === mealSlot.recipeId);
    },
    [allRecipes]
  );

  // Get initial values for modal (when editing)
  const getInitialModalValues = useMemo(() => {
    if (!selectedSlot) return { recipeId: null, servings: 4 };
    const mealSlot = getMealSlot(selectedSlot.day, selectedSlot.meal);
    return {
      recipeId: mealSlot?.recipeId || null,
      servings: mealSlot?.servings || 4,
    };
  }, [selectedSlot, getMealSlot]);

  // Loading state
  if (isLoading) {
    return (
      <Container centered useSafeArea>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
          Chargement du planning...
        </Text>
      </Container>
    );
  }

  // Error state
  if (error) {
    return (
      <Container centered useSafeArea>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text variant="h2">Erreur</Text>
        <Text variant="body" color="neutral" style={{ marginTop: spacing.md, textAlign: "center" }}>
          {error instanceof Error ? error.message : "Impossible de charger le planning"}
        </Text>
        <Button variant="primary" onPress={() => refetch()} style={{ marginTop: spacing.lg }}>
          Réessayer
        </Button>
      </Container>
    );
  }

  return (
    <Container useSafeArea>
      <View style={styles.container}>
        {/* Week Navigation Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.navButton}
            onPress={handlePrevWeek}
            accessibilityLabel="Previous week"
            accessibilityRole="button"
          >
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>

          <View style={styles.weekInfo}>
            <Text variant="h3" style={styles.weekText}>
              {weekRangeText}
            </Text>
            <TouchableOpacity onPress={handleCurrentWeek}>
              <Text variant="caption" style={styles.currentWeekButton}>
                Semaine actuelle
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.navButton}
            onPress={handleNextWeek}
            accessibilityLabel="Next week"
            accessibilityRole="button"
          >
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>

        {/* Clear Week Button */}
        <View style={styles.actionBar}>
          <Button variant="outline" size="sm" onPress={handleClearWeek}>
            Effacer la semaine
          </Button>
        </View>

        {/* Meal Planning Grid */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
        >
          {/* Meal Type Headers */}
          <View style={styles.headerRow}>
            <View style={styles.dayLabelCell} />
            {MEAL_TYPES.map(({ type, icon, label }) => (
              <View key={type} style={styles.mealHeaderCell}>
                <Text style={styles.mealIcon}>{icon}</Text>
                <Text variant="caption" style={styles.mealLabel}>
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Days Rows */}
          {WEEK_DAYS.map(({ day, label, shortLabel }) => (
            <View key={day} style={styles.dayRow}>
              {/* Day Label */}
              <View style={styles.dayLabelCell}>
                <Text variant="bodySmall" style={styles.dayLabel}>
                  {shortLabel}
                </Text>
              </View>

              {/* Meal Slots */}
              {MEAL_TYPES.map(({ type: mealType }) => {
                const mealSlot = getMealSlot(day, mealType);
                const recipe = getRecipeForSlot(mealSlot);

                return (
                  <View key={`${day}-${mealType}`} style={styles.slotCell}>
                    <MealSlotCard
                      mealSlot={mealSlot}
                      day={day}
                      mealType={mealType}
                      recipe={recipe}
                      onPress={() => handleSlotPress(day, mealType)}
                      onToggleCooked={
                        mealSlot
                          ? () => handleToggleCooked(day, mealType, mealSlot.isCooked)
                          : undefined
                      }
                      onRemove={mealSlot ? () => handleRemoveSlot(day, mealType) : undefined}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Recipe Picker Modal */}
        <RecipePickerModal
          visible={modalVisible}
          userId={userId ?? null}
          initialRecipeId={getInitialModalValues.recipeId}
          initialServings={getInitialModalValues.servings}
          onClose={() => setModalVisible(false)}
          onSelect={handleRecipeSelect}
        />
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    ...shadows.sm,
  },

  navButtonText: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.white,
    fontWeight: fontWeights.bold as any,
  },

  weekInfo: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: spacing.md,
  },

  weekText: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  currentWeekButton: {
    color: colors.primary.DEFAULT,
    textDecorationLine: "underline",
  },

  // Action Bar
  actionBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  // Grid
  scrollView: {
    flex: 1,
  },

  scrollContent: {
    padding: spacing.xs,
    paddingBottom: spacing.md,
  },

  headerRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },

  dayLabelCell: {
    width: 50,
    justifyContent: "center",
    alignItems: "center",
  },

  mealHeaderCell: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: spacing.xs,
  },

  mealIcon: {
    fontSize: 24,
    lineHeight: 28,
    marginBottom: spacing.xs,
  },

  mealLabel: {
    color: colors.warm.brown,
    fontWeight: fontWeights.semibold as any,
    textAlign: "center",
  },

  dayRow: {
    flexDirection: "row",
    marginBottom: spacing.sm,
  },

  dayLabel: {
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    textAlign: "center",
  },

  slotCell: {
    flex: 1,
    marginHorizontal: spacing.xs,
  },

  // Error
  errorIcon: {
    fontSize: 64,
    lineHeight: 72,
    marginBottom: spacing.md,
  },
});

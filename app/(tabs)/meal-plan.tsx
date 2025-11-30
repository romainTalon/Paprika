/**
 * Meal Plan Screen
 *
 * Weekly meal planning interface with vertical list of day cards.
 * Allows selecting recipes for each meal slot and managing them via modals.
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
import { Text } from "@/components/ui";
import { DayCard, MealSlotDetailModal } from "@/components/meal-plan";
import RecipePickerModal from "@/components/modals/RecipePickerModal";
import { colors, spacing, fontSizes, fontWeights } from "@/theme";
import {
  useMealPlan,
  useClearWeekMealPlan,
  useAddRecipeToSlot,
  useRemoveRecipeFromSlot,
  useUpdateRecipeInSlot,
} from "@/hooks/useMealPlans";
import { useRecipes } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { MealPlanService } from "@/services";
import type { MealType, WeekDay, MealSlot } from "@/types";
import { addWeeks, subWeeks, format, startOfWeek, addDays } from "date-fns";
import { fr } from "date-fns/locale";

// Week days configuration
const WEEK_DAYS: WeekDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

export default function MealPlanScreen() {
  const { user } = useAuth();
  const userId = user?.id;

  // Week navigation state
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    return MealPlanService.getMondayOfWeek(); // YYYY-MM-DD format
  });

  // Recipe Picker Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{
    day: WeekDay;
    meal: MealType;
  } | null>(null);

  // Meal Slot Detail Modal state
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedSlotForDetail, setSelectedSlotForDetail] = useState<{
    day: WeekDay;
    meal: MealType;
  } | null>(null);

  // Fetch meal plan for current week
  const { data: mealPlan, isLoading, error } = useMealPlan(userId!, currentWeekStart);

  // Fetch all recipes
  const { data: allRecipes } = useRecipes(userId!);

  // Mutations
  const addRecipe = useAddRecipeToSlot();
  const removeRecipe = useRemoveRecipeFromSlot();
  const updateRecipe = useUpdateRecipeInSlot();
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

  // Get meal slots from meal plan
  const getMealSlots = useCallback(
    (day: WeekDay, meal: MealType): MealSlot[] => {
      if (!mealPlan?.meals) return [];
      const key = `${day}-${meal}`;
      return (mealPlan.meals as Record<string, MealSlot[]>)[key] || [];
    },
    [mealPlan]
  );

  // Handler for meal slot press (routes to appropriate modal)
  const handleMealPress = useCallback(
    (day: WeekDay, meal: MealType) => {
      const slots = getMealSlots(day, meal);

      if (!slots || slots.length === 0) {
        // Empty slot → Open Recipe Picker Modal
        setSelectedSlot({ day, meal });
        setModalVisible(true);
      } else {
        // Slot with recipes → Open Detail Modal
        setSelectedSlotForDetail({ day, meal });
        setDetailModalVisible(true);
      }
    },
    [getMealSlots]
  );

  // Recipe Picker Modal - Select recipe
  const handleRecipeSelect = useCallback(
    async (recipeId: string, servings: number) => {
      if (!selectedSlot || !userId || !mealPlan) return;

      try {
        await addRecipe.mutateAsync({
          mealPlanId: mealPlan.id,
          userId,
          weekStart: currentWeekStart,
          day: selectedSlot.day,
          meal: selectedSlot.meal,
          newRecipe: {
            recipeId,
            servings,
            isCooked: false,
          },
        });

        Alert.alert("Succès", "Recette ajoutée au planning !");
        setModalVisible(false);
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Impossible d'ajouter la recette"
        );
      }
    },
    [selectedSlot, userId, mealPlan, currentWeekStart, addRecipe]
  );

  // Detail Modal - Add recipe button
  const handleAddRecipeFromDetail = useCallback(() => {
    if (!selectedSlotForDetail) return;

    // Close detail modal
    setDetailModalVisible(false);

    // Open recipe picker modal
    setSelectedSlot({
      day: selectedSlotForDetail.day,
      meal: selectedSlotForDetail.meal,
    });
    setModalVisible(true);
  }, [selectedSlotForDetail]);

  // Detail Modal - Toggle cooked status
  const handleToggleCookedInDetail = useCallback(
    async (recipeIndex: number, currentStatus: boolean) => {
      if (!selectedSlotForDetail || !userId || !mealPlan) return;

      try {
        await updateRecipe.mutateAsync({
          mealPlanId: mealPlan.id,
          userId,
          weekStart: currentWeekStart,
          day: selectedSlotForDetail.day,
          meal: selectedSlotForDetail.meal,
          recipeIndex,
          updates: { isCooked: !currentStatus },
        });
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Impossible de modifier le statut"
        );
      }
    },
    [selectedSlotForDetail, userId, mealPlan, currentWeekStart, updateRecipe]
  );

  // Detail Modal - Update servings
  const handleUpdateServingsInDetail = useCallback(
    async (recipeIndex: number, newServings: number) => {
      if (!selectedSlotForDetail || !userId || !mealPlan) return;

      try {
        await updateRecipe.mutateAsync({
          mealPlanId: mealPlan.id,
          userId,
          weekStart: currentWeekStart,
          day: selectedSlotForDetail.day,
          meal: selectedSlotForDetail.meal,
          recipeIndex,
          updates: { servings: newServings },
        });
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Impossible de modifier les portions"
        );
      }
    },
    [selectedSlotForDetail, userId, mealPlan, currentWeekStart, updateRecipe]
  );

  // Detail Modal - Remove recipe
  const handleRemoveRecipeInDetail = useCallback(
    async (recipeIndex: number) => {
      if (!selectedSlotForDetail || !userId || !mealPlan) return;

      // Check if this is the last recipe BEFORE removing
      const currentSlots = getMealSlots(selectedSlotForDetail.day, selectedSlotForDetail.meal);
      const isLastRecipe = currentSlots.length === 1;

      try {
        await removeRecipe.mutateAsync({
          mealPlanId: mealPlan.id,
          userId,
          weekStart: currentWeekStart,
          day: selectedSlotForDetail.day,
          meal: selectedSlotForDetail.meal,
          recipeIndex,
        });

        // Close modal immediately if we just removed the last recipe
        if (isLastRecipe) {
          setDetailModalVisible(false);
        }
      } catch (error) {
        Alert.alert(
          "Erreur",
          error instanceof Error ? error.message : "Impossible de supprimer la recette"
        );
      }
    },
    [selectedSlotForDetail, userId, mealPlan, currentWeekStart, removeRecipe, getMealSlots]
  );

  // Clear entire week
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

  // Calculate dates for each day of the week
  const weekDates = useMemo(() => {
    const startDate = new Date(currentWeekStart);
    return WEEK_DAYS.map((day, index) => addDays(startDate, index));
  }, [currentWeekStart]);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
        <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
          Chargement du planning...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="body" color="error" style={{ marginBottom: spacing.md }}>
          Erreur lors du chargement du planning
        </Text>
        <Text variant="caption" color="neutral">
          {error instanceof Error ? error.message : "Erreur inconnue"}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {/* Header: Week Navigation */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevWeek}
          style={styles.navButton}
          accessibilityLabel="Semaine précédente"
        >
          <Text style={styles.navIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.weekInfo}>
          <Text style={styles.weekRangeText}>{weekRangeText}</Text>
          <TouchableOpacity
            onPress={handleCurrentWeek}
            style={styles.currentWeekButton}
            accessibilityLabel="Aller à la semaine actuelle"
          >
            <Text style={styles.currentWeekButtonText}>Semaine actuelle</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleNextWeek}
          style={styles.navButton}
          accessibilityLabel="Semaine suivante"
        >
          <Text style={styles.navIcon}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          onPress={handleClearWeek}
          style={styles.clearButton}
          accessibilityLabel="Effacer toute la semaine"
        >
          <Text style={styles.clearButtonText}>Effacer la semaine</Text>
        </TouchableOpacity>
      </View>

      {/* Day Cards List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator
      >
        {WEEK_DAYS.map((day, index) => (
          <DayCard
            key={day}
            day={day}
            date={weekDates[index]}
            allRecipes={allRecipes}
            getMealSlots={getMealSlots}
            onMealPress={handleMealPress}
          />
        ))}
      </ScrollView>

      {/* Recipe Picker Modal */}
      <RecipePickerModal
        visible={modalVisible}
        userId={userId ?? null}
        onClose={() => setModalVisible(false)}
        onSelect={handleRecipeSelect}
      />

      {/* Meal Slot Detail Modal */}
      <MealSlotDetailModal
        visible={detailModalVisible}
        day={selectedSlotForDetail?.day}
        mealType={selectedSlotForDetail?.meal}
        mealSlots={
          selectedSlotForDetail
            ? getMealSlots(selectedSlotForDetail.day, selectedSlotForDetail.meal)
            : []
        }
        allRecipes={allRecipes}
        onClose={() => setDetailModalVisible(false)}
        onAddRecipe={handleAddRecipeFromDetail}
        onToggleCooked={handleToggleCookedInDetail}
        onUpdateServings={handleUpdateServingsInDetail}
        onRemoveRecipe={handleRemoveRecipeInDetail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.cream.DEFAULT,
    padding: spacing.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  navButton: {
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
  },

  navIcon: {
    fontSize: 24,
    lineHeight: 28,
    color: colors.primary.DEFAULT,
  },

  weekInfo: {
    flex: 1,
    alignItems: "center",
  },

  weekRangeText: {
    fontSize: fontSizes.base,
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  currentWeekButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },

  currentWeekButtonText: {
    fontSize: fontSizes.xs,
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.medium as any,
  },

  // Action Bar
  actionBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  clearButton: {
    alignSelf: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing.sm,
    backgroundColor: colors.cream.DEFAULT,
  },

  clearButtonText: {
    fontSize: fontSizes.sm,
    color: colors.error,
    fontWeight: fontWeights.medium as any,
  },

  // Scroll View
  scrollView: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },

  scrollContent: {
    padding: spacing.md,
  },
});

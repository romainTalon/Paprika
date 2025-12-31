/**
 * Recipe Preview Screen
 *
 * Preview and edit imported recipe data before saving to database.
 * Shows a badge indicating the import strategy used (JSON-LD or Claude AI).
 *
 * @module app/recipes/preview
 */

import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Text, Button } from "@/components/ui";
import { BackButton } from "@/components/navigation";
import { IngredientInput, StepInput, TimeStepper } from "@/components/recipe";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";
import { useSaveImportedRecipe } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import type { RecipeIngredient, RecipeStep } from "@/types/database";
import type { ImportedRecipeData, ImportStrategy } from "@/types/ai";

type RecipeDifficulty = "easy" | "medium" | "hard";

export default function PreviewRecipeScreen() {
  const { recipeData, strategy, cookbookId } = useLocalSearchParams<{
    recipeData: string;
    strategy: ImportStrategy;
    cookbookId?: string;
  }>();

  const { user } = useAuth();
  const saveRecipe = useSaveImportedRecipe();

  // Parse imported data
  const imported: ImportedRecipeData = JSON.parse(recipeData);

  // Editable state (pre-populated from import)
  const [title, setTitle] = useState(imported.title);
  const [description, setDescription] = useState(imported.description || "");
  const [servings, setServings] = useState(imported.servings);
  const [prepTime, setPrepTime] = useState<number | undefined>(imported.prepTime);
  const [cookTime, setCookTime] = useState<number | undefined>(imported.cookTime);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>(
    imported.difficulty || "easy"
  );
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(
    imported.ingredients
  );
  const [steps, setSteps] = useState<RecipeStep[]>(imported.steps);

  // Ingredient Handlers
  const handleAddIngredient = useCallback(() => {
    setIngredients([...ingredients, { name: "", quantity: 0, unit: "" }]);
  }, [ingredients]);

  const handleRemoveIngredient = useCallback(
    (index: number) => {
      if (ingredients.length > 1) {
        setIngredients(ingredients.filter((_, i) => i !== index));
      }
    },
    [ingredients]
  );

  const handleIngredientChange = useCallback(
    (index: number, updated: RecipeIngredient) => {
      const newIngredients = [...ingredients];
      newIngredients[index] = updated;
      setIngredients(newIngredients);
    },
    [ingredients]
  );

  // Step Handlers
  const handleAddStep = useCallback(() => {
    setSteps([...steps, { order: steps.length + 1, instruction: "" }]);
  }, [steps]);

  const handleRemoveStep = useCallback(
    (index: number) => {
      if (steps.length > 1) {
        const updated = steps.filter((_, i) => i !== index);
        // Renumber steps
        updated.forEach((step, i) => {
          step.order = i + 1;
        });
        setSteps(updated);
      }
    },
    [steps]
  );

  const handleStepChange = useCallback(
    (index: number, updated: RecipeStep) => {
      const newSteps = [...steps];
      newSteps[index] = updated;
      setSteps(newSteps);
    },
    [steps]
  );

  // Save Handler
  const handleSave = useCallback(async () => {
    // Validation
    if (!title.trim()) {
      Alert.alert("Erreur", "Le titre est requis");
      return;
    }

    // Validate: at least ingredients OR steps (partial import support)
    const hasValidIngredients =
      ingredients.length > 0 && ingredients.some((ing) => ing.name.trim());
    const hasValidSteps =
      steps.length > 0 && steps.some((step) => step.instruction.trim());

    if (!hasValidIngredients && !hasValidSteps) {
      Alert.alert(
        "Erreur",
        "La recette doit avoir au moins des ingrédients OU des étapes"
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Erreur", "Vous devez être connecté");
      return;
    }

    try {
      const recipe = await saveRecipe.mutateAsync({
        userId: user.id,
        cookbookId: cookbookId || undefined,
        isPremium: user.isPremium === true,
        recipe: {
          ...imported,
          title,
          description: description || undefined,
          servings,
          prepTime,
          cookTime,
          difficulty,
          ingredients,
          steps,
        },
      });

      Alert.alert("Succès", "Recette importée avec succès !", [
        {
          text: "OK",
          onPress: () => router.replace(`/recipes/${recipe.id}`),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        "Erreur",
        error?.message || "Impossible de sauvegarder la recette"
      );
    }
  }, [
    title,
    description,
    servings,
    prepTime,
    cookTime,
    difficulty,
    ingredients,
    steps,
    user,
    cookbookId,
    imported,
    saveRecipe,
  ]);

  // Cancel Handler
  const handleCancel = useCallback(() => {
    Alert.alert(
      "Annuler l'import",
      "Voulez-vous vraiment annuler ? Les modifications seront perdues.",
      [
        { text: "Continuer l'édition", style: "cancel" },
        { text: "Annuler", style: "destructive", onPress: () => router.back() },
      ]
    );
  }, []);

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <BackButton />

          {/* Import Strategy Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text variant="caption" style={styles.badgeText}>
                ✓ Importée via{" "}
                {strategy === "instagram"
                  ? "Instagram 📸"
                  : strategy === "tiktok"
                  ? "TikTok 🎵"
                  : strategy === "json-ld"
                  ? "JSON-LD"
                  : "IA Claude"}
              </Text>
            </View>
          </View>

          {/* Warnings for missing data */}
          {ingredients.length === 0 && (
            <View style={styles.warningBanner}>
              <Text variant="bodySmall" style={styles.warningText}>
                ⚠️ Aucun ingrédient trouvé - Ajoutez-les manuellement ci-dessous
              </Text>
            </View>
          )}
          {steps.length === 0 && (
            <View style={styles.warningBanner}>
              <Text variant="bodySmall" style={styles.warningText}>
                ⚠️ Aucune étape trouvée - Ajoutez-les manuellement ci-dessous
              </Text>
            </View>
          )}

          {/* Header */}
          <View style={styles.header}>
            <Text variant="h1" style={styles.title}>
              Vérifier la recette
            </Text>
            <Text variant="body" color="neutral" style={styles.subtitle}>
              Vérifiez et modifiez les informations avant de sauvegarder
            </Text>
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionLabel}>
              Titre
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Nom de la recette"
              placeholderTextColor={colors.gray[400]}
              style={styles.input}
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionLabel}>
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Description de la recette (optionnel)"
              placeholderTextColor={colors.gray[400]}
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Servings */}
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionLabel}>
              Portions
            </Text>
            <View style={styles.row}>
              <Text variant="body" style={styles.rowLabel}>
                Nombre de personnes
              </Text>
              <View style={styles.servingsContainer}>
                <TouchableOpacity
                  style={styles.servingsButton}
                  onPress={() => setServings(Math.max(1, servings - 1))}
                >
                  <Text style={styles.servingsButtonText}>−</Text>
                </TouchableOpacity>
                <Text variant="h2" style={styles.servingsValue}>
                  {servings}
                </Text>
                <TouchableOpacity
                  style={styles.servingsButton}
                  onPress={() => setServings(Math.min(20, servings + 1))}
                >
                  <Text style={styles.servingsButtonText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Times */}
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionLabel}>
              Temps
            </Text>
            <TimeStepper
              label="Temps de préparation"
              value={prepTime}
              onChange={setPrepTime}
            />
            <TimeStepper
              label="Temps de cuisson"
              value={cookTime}
              onChange={setCookTime}
            />
          </View>

          {/* Difficulty */}
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionLabel}>
              Difficulté
            </Text>
            <View style={styles.difficultyOptions}>
              <TouchableOpacity
                style={[
                  styles.difficultyOption,
                  difficulty === "easy" && styles.difficultyOptionSelected,
                ]}
                onPress={() => setDifficulty("easy")}
              >
                <Text
                  variant="body"
                  style={[
                    styles.difficultyText,
                    difficulty === "easy" && styles.difficultyTextSelected,
                  ]}
                >
                  Facile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.difficultyOption,
                  difficulty === "medium" && styles.difficultyOptionSelected,
                ]}
                onPress={() => setDifficulty("medium")}
              >
                <Text
                  variant="body"
                  style={[
                    styles.difficultyText,
                    difficulty === "medium" && styles.difficultyTextSelected,
                  ]}
                >
                  Moyen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.difficultyOption,
                  difficulty === "hard" && styles.difficultyOptionSelected,
                ]}
                onPress={() => setDifficulty("hard")}
              >
                <Text
                  variant="body"
                  style={[
                    styles.difficultyText,
                    difficulty === "hard" && styles.difficultyTextSelected,
                  ]}
                >
                  Difficile
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Ingredients */}
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionLabel}>
              Ingrédients ({ingredients.length})
            </Text>
            {ingredients.map((ingredient, index) => (
              <IngredientInput
                key={index}
                ingredient={ingredient}
                onChange={(updated) => handleIngredientChange(index, updated)}
                onRemove={() => handleRemoveIngredient(index)}
                showRemove={ingredients.length > 1}
              />
            ))}
            <Button
              variant="outline"
              onPress={handleAddIngredient}
              style={styles.addButton}
            >
              + Ajouter un ingrédient
            </Button>
          </View>

          {/* Steps */}
          <View style={styles.section}>
            <Text variant="h3" style={styles.sectionLabel}>
              Étapes ({steps.length})
            </Text>
            {steps.map((step, index) => (
              <StepInput
                key={index}
                step={step}
                onChange={(updated) => handleStepChange(index, updated)}
                onRemove={() => handleRemoveStep(index)}
                showRemove={steps.length > 1}
              />
            ))}
            <Button
              variant="outline"
              onPress={handleAddStep}
              style={styles.addButton}
            >
              + Ajouter une étape
            </Button>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <Button
            variant="outline"
            onPress={handleCancel}
            style={styles.cancelButton}
          >
            Annuler
          </Button>
          <Button
            variant="primary"
            onPress={handleSave}
            disabled={saveRecipe.isPending}
            style={styles.saveButton}
          >
            {saveRecipe.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.cream.DEFAULT,
  },

  keyboardView: {
    flex: 1,
  },

  container: {
    flex: 1,
  },

  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },

  // Badge
  badgeContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },

  badge: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing["2xl"],
  },

  badgeText: {
    color: colors.white,
    fontWeight: fontWeights.semibold as any,
  },

  // Warning Banner
  warningBanner: {
    backgroundColor: "#FEF3C7", // warning yellow-100
    padding: spacing.md,
    borderRadius: spacing.sm,
    marginVertical: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B", // warning yellow-500
  },

  warningText: {
    color: "#92400E", // warning yellow-900
    lineHeight: 20,
  },

  // Header
  header: {
    marginBottom: spacing.xl,
  },

  title: {
    color: colors.warm.brown,
    marginBottom: spacing.sm,
  },

  subtitle: {
    lineHeight: 22,
  },

  // Section
  section: {
    marginBottom: spacing.xl,
  },

  sectionLabel: {
    color: colors.warm.brown,
    marginBottom: spacing.sm,
  },

  // Input
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: spacing.sm,
    padding: spacing.md,
    fontSize: fontSizes.base,
    fontWeight: fontWeights.normal as any,
    color: colors.warm.brown,
    ...shadows.sm,
  },

  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },

  // Row
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
  },

  rowLabel: {
    color: colors.warm.brown,
    flex: 1,
  },

  // Servings Stepper
  servingsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },

  servingsButton: {
    width: 44,
    height: 44,
    borderRadius: spacing.md,
    backgroundColor: colors.primary.DEFAULT,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: colors.primary[600],
  },

  servingsButtonText: {
    fontSize: 24,
    fontWeight: "bold" as any,
    color: colors.white,
    lineHeight: 28,
  },

  servingsValue: {
    minWidth: 40,
    textAlign: "center",
    color: colors.warm.brown,
    fontWeight: fontWeights.semibold as any,
  },

  // Difficulty
  difficultyOptions: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  difficultyOption: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
    alignItems: "center",
  },

  difficultyOptionSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary[100],
  },

  difficultyText: {
    color: colors.gray[600],
    fontSize: fontSizes.sm,
  },

  difficultyTextSelected: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.semibold as any,
  },

  // Buttons
  addButton: {
    marginTop: spacing.sm,
  },

  // Footer
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    ...shadows.lg,
  },

  cancelButton: {
    flex: 1,
  },

  saveButton: {
    flex: 2,
  },
});

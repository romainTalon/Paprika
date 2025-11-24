/**
 * Edit Recipe Screen
 *
 * Edit existing recipe form with pre-population from database.
 * Allows editing title, ingredients, steps, and all recipe details.
 *
 * @module app/recipes/[id]/edit
 */

import React, { useState, useCallback, useEffect } from "react";
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
import { useRecipe, useUpdateRecipe } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { updateRecipeSchema } from "@/lib/validations/recipe.validation";
import type { RecipeIngredient, RecipeStep } from "@/types/database";
import { z } from "zod";

type RecipeDifficulty = "easy" | "medium" | "hard";

export default function EditRecipeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const updateRecipe = useUpdateRecipe();

  // Fetch existing recipe
  const { data: recipe, isLoading, error } = useRecipe(id!, user?.id!);

  // Basic Information
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [cookbookId, setCookbookId] = useState<string | undefined>(undefined);

  // Details
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState<number | undefined>(undefined);
  const [cookTime, setCookTime] = useState<number | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>("easy");

  // Ingredients
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([
    { name: "", quantity: 0 },
  ]);

  // Steps
  const [steps, setSteps] = useState<RecipeStep[]>([
    { order: 1, instruction: "" },
  ]);

  // Validation Errors (Real-time)
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-populate form when recipe is loaded
  useEffect(() => {
    if (recipe) {
      setTitle(recipe.title || "");
      setDescription(recipe.description || "");
      setCoverImageUrl(recipe.coverImageUrl || "");
      setCookbookId(recipe.cookbookId || undefined);
      setServings(recipe.servings || 4);
      setPrepTime(recipe.prepTime || undefined);
      setCookTime(recipe.cookTime || undefined);
      setDifficulty(recipe.difficulty || "easy");

      // Ensure at least 1 ingredient
      setIngredients(
        recipe.ingredients && recipe.ingredients.length > 0
          ? recipe.ingredients
          : [{ name: "", quantity: 0 }]
      );

      // Ensure at least 1 step
      setSteps(
        recipe.steps && recipe.steps.length > 0
          ? recipe.steps
          : [{ order: 1, instruction: "" }]
      );
    }
  }, [recipe]);

  // Validate a single field in real-time
  const validateField = useCallback((fieldName: string, value: any) => {
    try {
      // Get the field schema from updateRecipeSchema
      const fieldSchema = updateRecipeSchema.shape[fieldName as keyof typeof updateRecipeSchema.shape];

      if (fieldSchema) {
        fieldSchema.parse(value);
        // Clear error if validation passes
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName];
          return newErrors;
        });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Set error message
        setErrors(prev => ({
          ...prev,
          [fieldName]: error.issues[0].message,
        }));
      }
    }
  }, []);

  // Ingredient Handlers
  const handleAddIngredient = useCallback(() => {
    setIngredients([...ingredients, { name: "", quantity: 0 }]);
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
        // Re-order remaining steps
        const newSteps = steps
          .filter((_, i) => i !== index)
          .map((step, i) => ({ ...step, order: i + 1 }));
        setSteps(newSteps);
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

  // Form Validation and Submission
  const handleSubmit = useCallback(async () => {
    if (!user?.id) {
      Alert.alert("Erreur", "Vous devez être connecté pour modifier une recette");
      return;
    }

    if (!id) {
      Alert.alert("Erreur", "ID de recette manquant");
      return;
    }

    try {
      // Prepare update data
      const updates = {
        title,
        description: description || undefined,
        cookbookId: cookbookId || undefined,
        coverImageUrl: coverImageUrl || undefined,
        servings,
        prepTime,
        cookTime,
        difficulty,
        ingredients,
        steps,
      };

      // Validate form data
      const validated = updateRecipeSchema.parse(updates);

      // Update recipe
      await updateRecipe.mutateAsync({
        recipeId: id,
        userId: user.id,
        cookbookId: recipe?.cookbookId ?? undefined, // Old cookbook ID for cache invalidation
        updates: validated,
      });

      // Navigate back to recipe detail
      Alert.alert("Succès", "Recette modifiée avec succès !", [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    } catch (error) {
      // Log error for debugging
      console.error("Recipe update error:", error);

      if (error instanceof z.ZodError) {
        // Show first validation error
        Alert.alert("Validation", error.issues[0].message);
      } else if (error instanceof Error) {
        Alert.alert("Erreur", `Erreur de modification: ${error.message}`);
      } else {
        Alert.alert("Erreur", "Une erreur s'est produite lors de la modification");
      }
    }
  }, [
    user,
    id,
    title,
    description,
    cookbookId,
    coverImageUrl,
    servings,
    prepTime,
    cookTime,
    difficulty,
    ingredients,
    steps,
    updateRecipe,
    recipe?.cookbookId,
  ]);

  const handleCancel = useCallback(() => {
    Alert.alert("Annuler", "Êtes-vous sûr de vouloir annuler ? Les modifications seront perdues.", [
      { text: "Non", style: "cancel" },
      {
        text: "Oui, annuler",
        style: "destructive",
        onPress: () => router.back(),
      },
    ]);
  }, []);

  // Check if form is valid (basic check)
  const isValid =
    title.trim().length > 0 &&
    servings > 0 &&
    ingredients.some((ing) => ing.name.trim().length > 0 && ing.quantity > 0) &&
    steps.some((step) => step.instruction.trim().length >= 5);

  // Loading State
  if (isLoading) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton />
          <View style={styles.centered}>
            <Text variant="body" color="neutral">
              Chargement...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Error State
  if (error) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton />
          <View style={styles.centered}>
            <Text variant="h2">Erreur</Text>
            <Text variant="body" color="neutral" style={{ marginTop: spacing.md }}>
              Impossible de charger la recette
            </Text>
            <Button
              variant="primary"
              onPress={() => router.back()}
              style={{ marginTop: spacing.lg }}
            >
              Retour
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Not Found State
  if (!recipe) {
    return (
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.container}>
          <BackButton />
          <View style={styles.centered}>
            <Text variant="h1" style={{ fontSize: 64, lineHeight: 72 }}>
              🔍
            </Text>
            <Text variant="h2">Recette introuvable</Text>
            <Button
              variant="primary"
              onPress={() => router.back()}
              style={{ marginTop: spacing.lg }}
            >
              Retour
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <BackButton />
        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1">Modifier la recette</Text>
          <Text variant="bodySmall" color="neutral">
            {recipe.title}
          </Text>
        </View>

        {/* Basic Information Section */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Informations de base
          </Text>

          {/* Title */}
          <View style={styles.field}>
            <Text variant="bodySmall" style={styles.label}>
              Titre <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, errors.title && styles.inputError]}
              value={title}
              onChangeText={(text) => {
                setTitle(text);
                validateField("title", text);
              }}
              onBlur={() => validateField("title", title)}
              placeholder="Ex: Pâtes Carbonara"
              placeholderTextColor={colors.gray[400]}
              maxLength={200}
            />
            {errors.title ? (
              <Text variant="caption" style={styles.errorText}>
                {errors.title}
              </Text>
            ) : (
              <Text variant="caption" color="neutral" style={styles.hint}>
                {title.length}/200 caractères
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text variant="bodySmall" style={styles.label}>
              Description
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Décrivez votre recette..."
              placeholderTextColor={colors.gray[400]}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={1000}
            />
            <Text variant="caption" color="neutral" style={styles.hint}>
              {description.length}/1000 caractères
            </Text>
          </View>

          {/* Cover Image URL */}
          <View style={styles.field}>
            <Text variant="bodySmall" style={styles.label}>
              Image de couverture (URL)
            </Text>
            <TextInput
              style={styles.input}
              value={coverImageUrl}
              onChangeText={setCoverImageUrl}
              placeholder="https://exemple.com/image.jpg"
              placeholderTextColor={colors.gray[400]}
              keyboardType="url"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Details Section */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Détails
          </Text>

          {/* Servings */}
          <View style={styles.field}>
            <Text variant="bodySmall" style={styles.label}>
              Nombre de portions <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={[styles.input, styles.numberInput]}
              value={String(servings)}
              onChangeText={(text) => {
                const num = parseInt(text);
                if (!isNaN(num) && num > 0) setServings(num);
              }}
              placeholder="4"
              placeholderTextColor={colors.gray[400]}
              keyboardType="number-pad"
            />
          </View>

          {/* Prep Time with Stepper */}
          <View style={styles.field}>
            <TimeStepper
              label="Temps de préparation"
              value={prepTime}
              onChange={setPrepTime}
            />
          </View>

          {/* Cook Time with Stepper */}
          <View style={styles.field}>
            <TimeStepper
              label="Temps de cuisson"
              value={cookTime}
              onChange={setCookTime}
            />
          </View>

          {/* Difficulty */}
          <View style={styles.field}>
            <Text variant="bodySmall" style={styles.label}>
              Difficulté
            </Text>
            <View style={styles.difficultyButtons}>
              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  difficulty === "easy" && styles.difficultyButtonActive,
                ]}
                onPress={() => setDifficulty("easy")}
              >
                <Text
                  variant="body"
                  style={[
                    styles.difficultyButtonText,
                    difficulty === "easy" && styles.difficultyButtonTextActive,
                  ]}
                >
                  Facile
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  difficulty === "medium" && styles.difficultyButtonActive,
                ]}
                onPress={() => setDifficulty("medium")}
              >
                <Text
                  variant="body"
                  style={[
                    styles.difficultyButtonText,
                    difficulty === "medium" && styles.difficultyButtonTextActive,
                  ]}
                >
                  Moyen
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.difficultyButton,
                  difficulty === "hard" && styles.difficultyButtonActive,
                ]}
                onPress={() => setDifficulty("hard")}
              >
                <Text
                  variant="body"
                  style={[
                    styles.difficultyButtonText,
                    difficulty === "hard" && styles.difficultyButtonTextActive,
                  ]}
                >
                  Difficile
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Ingrédients <Text style={styles.required}>*</Text>
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
            size="md"
            onPress={handleAddIngredient}
            style={styles.addButton}
          >
            + Ajouter un ingrédient
          </Button>
        </View>

        {/* Steps Section */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Étapes <Text style={styles.required}>*</Text>
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
            size="md"
            onPress={handleAddStep}
            style={styles.addButton}
          >
            + Ajouter une étape
          </Button>
        </View>
      </ScrollView>

      {/* Sticky Footer Actions */}
      <View style={styles.footer}>
        <Button
          variant="outline"
          onPress={handleCancel}
          disabled={updateRecipe.isPending}
          style={styles.footerButton}
        >
          Annuler
        </Button>

        <Button
          variant="primary"
          onPress={handleSubmit}
          disabled={!isValid}
          loading={updateRecipe.isPending}
          style={styles.footerButton}
        >
          Enregistrer
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
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 100, // Space for footer
  },

  header: {
    marginBottom: spacing.xl,
  },

  section: {
    marginBottom: spacing.xl,
  },

  sectionTitle: {
    marginBottom: spacing.md,
    color: colors.warm.brown,
  },

  field: {
    marginBottom: spacing.lg,
  },

  label: {
    marginBottom: spacing.xs,
    fontWeight: fontWeights.semibold as any,
    color: colors.warm.brown,
  },

  required: {
    color: colors.error,
  },

  input: {
    backgroundColor: colors.cream.DEFAULT,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: spacing.sm,
    padding: spacing.md,
    fontSize: fontSizes.base,
    color: colors.warm.brown,
  },

  textArea: {
    height: 100,
    paddingTop: spacing.md,
  },

  numberInput: {
    maxWidth: 120,
  },

  hint: {
    marginTop: spacing.xs,
    textAlign: "right",
  },

  inputError: {
    borderColor: colors.error,
    borderWidth: 2,
  },

  errorText: {
    color: colors.error,
    marginTop: spacing.xs,
  },

  difficultyButtons: {
    flexDirection: "row",
    gap: spacing.sm,
  },

  difficultyButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: spacing.sm,
    alignItems: "center",
    backgroundColor: colors.white,
  },

  difficultyButtonActive: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },

  difficultyButtonText: {
    color: colors.warm.brown,
  },

  difficultyButtonTextActive: {
    color: colors.white,
    fontWeight: fontWeights.semibold as any,
  },

  addButton: {
    marginTop: spacing.sm,
  },

  footer: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
    backgroundColor: colors.white,
    ...shadows.lg,
  },

  footerButton: {
    flex: 1,
  },
});

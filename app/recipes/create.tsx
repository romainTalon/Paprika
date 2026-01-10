/**
 * Create Recipe Screen
 *
 * Manual recipe creation form with full validation.
 * Allows entering title, ingredients, steps, and all recipe details.
 *
 * @module app/recipes/create
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
import { TagPicker } from "@/components/recipe/TagPicker";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";
import { normalizeTagArray } from "@/utils/tagNormalizer";
import { useCreateRecipe } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { createRecipeSchema } from "@/lib/validations/recipe.validation";
import type { RecipeIngredient, RecipeStep } from "@/types/database";
import { z } from "zod";

type RecipeDifficulty = "easy" | "medium" | "hard";

export default function CreateRecipeScreen() {
  const { cookbookId } = useLocalSearchParams<{ cookbookId?: string }>();
  const { user } = useAuth();
  const createRecipe = useCreateRecipe();

  // Basic Information
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");

  // Details
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState<number | undefined>(undefined);
  const [cookTime, setCookTime] = useState<number | undefined>(undefined);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty>("easy");
  const [tags, setTags] = useState<string[]>([]);

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

  // Validate a single field in real-time
  const validateField = useCallback((fieldName: string, value: any) => {
    try {
      // Get the field schema
      const fieldSchema = createRecipeSchema.shape[fieldName as keyof typeof createRecipeSchema.shape];

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
      Alert.alert("Erreur", "Vous devez être connecté pour créer une recette");
      return;
    }

    try {
      // Validate form data
      const validated = createRecipeSchema.parse({
        title,
        description: description || undefined,
        cookbookId: cookbookId || undefined,
        coverImageUrl: coverImageUrl || undefined,
        servings,
        prepTime,
        cookTime,
        difficulty,
        tags: normalizeTagArray(tags),
        ingredients,
        steps,
      });

      // Create recipe
      const recipe = await createRecipe.mutateAsync({
        userId: user.id,
        ...validated,
      });

      // Navigate to recipe detail
      Alert.alert("Succès", "Recette créée avec succès !", [
        {
          text: "OK",
          onPress: () => {
            router.replace(`/recipes/${recipe.id}`);
          },
        },
      ]);
    } catch (error) {
      // Log error for debugging
      console.error("Recipe creation error:", error);

      if (error instanceof z.ZodError) {
        // Show first validation error
        Alert.alert("Validation", error.issues[0].message);
      } else if (error instanceof Error) {
        // Check for freemium limit
        if (error.message.includes("limit") || error.message.includes("20")) {
          Alert.alert(
            "Limite atteinte",
            "Vous avez atteint la limite de 20 recettes pour la version gratuite. Passez à Premium pour créer des recettes illimitées !",
            [
              { text: "Plus tard", style: "cancel" },
              {
                text: "Voir Premium",
                onPress: () => router.push("/settings"),
              },
            ]
          );
        } else {
          Alert.alert("Erreur", `Erreur de création: ${error.message}`);
        }
      } else {
        Alert.alert("Erreur", "Une erreur s'est produite lors de la création");
      }
    }
  }, [
    user,
    title,
    description,
    cookbookId,
    coverImageUrl,
    servings,
    prepTime,
    cookTime,
    difficulty,
    tags,
    ingredients,
    steps,
    createRecipe,
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
          <Text variant="h1">Nouvelle Recette</Text>
          <Text variant="bodySmall" color="neutral">
            Remplissez les informations de votre recette
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

        {/* Tags Section */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionTitle}>
            Tags
          </Text>
          <Text
            variant="bodySmall"
            color="neutral"
            style={{ marginBottom: spacing.sm }}
          >
            Sélectionnez jusqu'à 10 tags pour catégoriser votre recette
          </Text>
          <TagPicker
            selectedTags={tags}
            onTagsChange={setTags}
            maxTags={10}
            showCount={true}
          />
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
          disabled={createRecipe.isPending}
          style={styles.footerButton}
        >
          Annuler
        </Button>

        <Button
          variant="primary"
          onPress={handleSubmit}
          disabled={!isValid}
          loading={createRecipe.isPending}
          style={styles.footerButton}
        >
          Créer la recette
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

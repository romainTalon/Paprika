/**
 * Import Recipe Screen
 *
 * Import recipe from URL using AI-powered web scraping.
 * Supports JSON-LD extraction and Claude HTML parsing.
 *
 * @module app/recipes/import
 */

import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text, Button } from "@/components/ui";
import { BackButton } from "@/components/navigation";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useCookbooks } from "@/hooks/useCookbooks";
import { useImportRecipe } from "@/hooks/useRecipes";

export default function ImportRecipeScreen() {
  const { user } = useAuth();
  const { data: cookbooks, isLoading: loadingCookbooks } = useCookbooks(user?.id);
  const importRecipe = useImportRecipe();

  const [url, setUrl] = useState("");
  const [selectedCookbookId, setSelectedCookbookId] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0);

  // Validate URL
  const isValidUrl = useCallback((url: string): boolean => {
    try {
      const trimmed = url.trim();
      if (!trimmed) return false;

      // Check for http/https protocol
      if (!trimmed.match(/^https?:\/\//i)) return false;

      // Try to create URL object (validates format)
      new URL(trimmed);
      return true;
    } catch {
      return false;
    }
  }, []);

  // Handle import
  const handleImport = useCallback(async () => {
    // Validate URL
    if (!isValidUrl(url)) {
      Alert.alert(
        "URL invalide",
        "Veuillez entrer une URL valide commençant par http:// ou https://",
        [{ text: "OK" }]
      );
      return;
    }

    if (!user?.id) {
      Alert.alert("Erreur", "Vous devez être connecté pour importer des recettes");
      return;
    }

    try {
      // Reset progress
      setProgress(0);

      // Call import mutation
      const result = await importRecipe.mutateAsync({
        url: url.trim(),
        userId: user.id,
        cookbookId: selectedCookbookId,
        onProgress: setProgress,
      });

      // Navigate to preview screen with recipe data
      router.push({
        pathname: "/recipes/preview",
        params: {
          recipeData: JSON.stringify(result.recipe),
          strategy: result.strategy,
          cookbookId: selectedCookbookId || "",
        },
      });
    } catch (error: any) {
      // Handle different error types
      const errorMessage = error?.message || "Une erreur inconnue est survenue";

      if (errorMessage.includes("limit")) {
        // Freemium limit reached
        Alert.alert(
          "Limite atteinte",
          errorMessage,
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Devenir Premium",
              onPress: () => router.push("/settings/premium"),
            },
          ]
        );
      } else {
        // Generic error
        Alert.alert(
          "Erreur d'importation",
          `Impossible d'importer la recette: ${errorMessage}`,
          [
            { text: "Annuler", style: "cancel" },
            { text: "Réessayer", onPress: handleImport },
          ]
        );
      }

      // Reset progress
      setProgress(0);
    }
  }, [url, user, selectedCookbookId, importRecipe, isValidUrl]);

  // Loading state for cookbooks
  if (loadingCookbooks) {
    return (
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
          <Text variant="body" color="neutral" style={styles.loadingText}>
            Chargement...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Back Button */}
        <BackButton />

        {/* Header */}
        <View style={styles.header}>
          <Text variant="h1" style={styles.title}>
            Importer une Recette
          </Text>
          <Text variant="body" color="neutral" style={styles.subtitle}>
            Collez l'URL d'une recette et notre IA l'importera automatiquement
          </Text>
        </View>

        {/* URL Input */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionLabel}>
            URL de la recette
          </Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://exemple.com/ma-recette"
            placeholderTextColor={colors.gray[400]}
            style={styles.input}
            keyboardType="url"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!importRecipe.isPending}
          />
          <Text variant="caption" color="neutral" style={styles.hint}>
            Fonctionne avec la plupart des sites de recettes (Marmiton, 750g, etc.)
          </Text>
        </View>

        {/* Cookbook Selection */}
        <View style={styles.section}>
          <Text variant="h3" style={styles.sectionLabel}>
            Livre de recettes (optionnel)
          </Text>
          <View style={styles.cookbookOptions}>
            {/* None option */}
            <TouchableOpacity
              style={[
                styles.cookbookOption,
                !selectedCookbookId && styles.cookbookOptionSelected,
              ]}
              onPress={() => setSelectedCookbookId(undefined)}
              disabled={importRecipe.isPending}
            >
              <Text
                variant="body"
                style={[
                  styles.cookbookOptionText,
                  !selectedCookbookId && styles.cookbookOptionTextSelected,
                ]}
              >
                Aucun livre
              </Text>
            </TouchableOpacity>

            {/* Cookbook options */}
            {cookbooks?.map((cookbook) => (
              <TouchableOpacity
                key={cookbook.id}
                style={[
                  styles.cookbookOption,
                  selectedCookbookId === cookbook.id && styles.cookbookOptionSelected,
                ]}
                onPress={() => setSelectedCookbookId(cookbook.id)}
                disabled={importRecipe.isPending}
              >
                <Text
                  variant="body"
                  style={[
                    styles.cookbookOptionText,
                    selectedCookbookId === cookbook.id && styles.cookbookOptionTextSelected,
                  ]}
                >
                  {cookbook.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress Indicator */}
        {importRecipe.isPending && (
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
            <Text variant="body" style={styles.progressText}>
              Import en cours... {progress}%
            </Text>
            <Text variant="caption" color="neutral" style={styles.progressHint}>
              Analyse de la recette avec IA
            </Text>
          </View>
        )}

        {/* Import Button */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            size="lg"
            onPress={handleImport}
            disabled={!isValidUrl(url) || importRecipe.isPending}
            style={styles.importButton}
          >
            {importRecipe.isPending ? "Import en cours..." : "Importer la recette"}
          </Button>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text variant="h3" style={styles.infoTitle}>
            Comment ça marche ?
          </Text>
          <Text variant="bodySmall" color="neutral" style={styles.infoText}>
            1. Notre IA analyse automatiquement la page web{"\n"}
            2. Elle extrait le titre, ingrédients et étapes{"\n"}
            3. Vous pouvez prévisualiser et modifier avant de sauvegarder{"\n"}
            4. La recette est ajoutée à votre collection
          </Text>
          <View style={styles.infoBadge}>
            <Text variant="caption" style={styles.infoBadgeText}>
              ✨ Gratuit: 5 imports/mois • Premium: Illimité
            </Text>
          </View>
        </View>
      </ScrollView>
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
  },

  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing["2xl"],
  },

  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },

  loadingText: {
    marginTop: spacing.md,
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

  hint: {
    marginTop: spacing.xs,
  },

  // Cookbook Options
  cookbookOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },

  cookbookOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: spacing["2xl"],
    borderWidth: 1,
    borderColor: colors.gray[300],
    backgroundColor: colors.white,
  },

  cookbookOptionSelected: {
    borderColor: colors.primary.DEFAULT,
    backgroundColor: colors.primary[100],
  },

  cookbookOptionText: {
    color: colors.gray[600],
    fontSize: fontSizes.sm,
  },

  cookbookOptionTextSelected: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.semibold as any,
  },

  // Progress
  progressContainer: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    marginBottom: spacing.xl,
    ...shadows.md,
  },

  progressText: {
    marginTop: spacing.md,
    color: colors.warm.brown,
    fontWeight: fontWeights.semibold as any,
  },

  progressHint: {
    marginTop: spacing.xs,
  },

  // Button
  buttonContainer: {
    marginBottom: spacing.xl,
  },

  importButton: {
    width: "100%",
  },

  // Info Card
  infoCard: {
    backgroundColor: colors.primary[100],
    borderRadius: spacing.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },

  infoTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.md,
  },

  infoText: {
    lineHeight: 20,
    marginBottom: spacing.md,
  },

  infoBadge: {
    backgroundColor: colors.white,
    borderRadius: spacing.sm,
    padding: spacing.sm,
    alignSelf: "flex-start",
  },

  infoBadgeText: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.semibold as any,
  },
});

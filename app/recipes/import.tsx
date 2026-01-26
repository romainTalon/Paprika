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
import { PhotoImportModal } from "@/components/recipe/PhotoImportModal";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";
import { useAuth } from "@/hooks/useAuth";
import { useCookbooks } from "@/hooks/useCookbooks";
import { useImportRecipe } from "@/hooks/useRecipes";
import { usePhotoImport } from "@/hooks/usePhotoImport";

export default function ImportRecipeScreen() {
  const { user } = useAuth();
  const { data: cookbooks, isLoading: loadingCookbooks } = useCookbooks(user?.id);
  const importRecipe = useImportRecipe();
  const {
    takePhoto,
    pickFromGallery,
    photo,
    clearPhoto,
    isLoading: isCapturingPhoto,
  } = usePhotoImport();

  const [url, setUrl] = useState("");
  const [selectedCookbookId, setSelectedCookbookId] = useState<string | undefined>(undefined);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // URL source type detection
  type URLSourceType = "instagram" | "tiktok" | "web" | "invalid";
  const [urlSource, setUrlSource] = useState<URLSourceType>("invalid");

  // Detect URL source (Instagram/TikTok/web)
  const detectURLSource = useCallback((url: string): URLSourceType => {
    try {
      const trimmed = url.trim();
      if (!trimmed) return "invalid";

      // Check for http/https protocol
      if (!trimmed.match(/^https?:\/\//i)) return "invalid";

      // Try to create URL object
      const urlObj = new URL(trimmed);
      const hostname = urlObj.hostname.toLowerCase();

      // Instagram: /p/{post_id}/ or /reel/{reel_id}/
      if (hostname.includes("instagram.com")) {
        const postMatch = urlObj.pathname.match(/\/(p|reel)\/([A-Za-z0-9_-]+)/);
        if (postMatch) {
          return "instagram";
        }
      }

      // TikTok: /@{username}/video/{video_id}
      if (hostname.includes("tiktok.com")) {
        const videoMatch = urlObj.pathname.match(/\/@([^/]+)\/video\/(\d+)/);
        if (videoMatch) {
          return "tiktok";
        }
      }

      // Valid web URL
      return "web";
    } catch {
      return "invalid";
    }
  }, []);

  // Update URL source when URL changes
  React.useEffect(() => {
    setUrlSource(detectURLSource(url));
  }, [url, detectURLSource]);

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

    // Progress timer reference
    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      // Reset progress
      setProgress(0);
      setProgressMessage("Connexion...");

      // Simulate progress updates for better UX
      progressTimer = setInterval(() => {
        setProgress((prev) => {
          if (prev < 20) {
            setProgressMessage("Extraction de la description...");
            return prev + 5;
          } else if (prev < 80) {
            setProgressMessage("Analyse avec IA...");
            return prev + 3;
          } else if (prev < 95) {
            setProgressMessage("Finalisation...");
            return prev + 2;
          }
          return prev;
        });
      }, 500);

      // Call import mutation
      const result = await importRecipe.mutateAsync({
        url: url.trim(),
        userId: user.id,
        cookbookId: selectedCookbookId,
        onProgress: (p) => {
          setProgress(p);
          if (p === 100) {
            setProgressMessage("Import terminé !");
          }
        },
      });

      // Stop timer and set to 100%
      clearInterval(progressTimer);
      setProgress(100);
      setProgressMessage("Import terminé !");

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
      // Clean up timer
      if (progressTimer) {
        clearInterval(progressTimer);
      }

      // Handle different error types
      const errorMessage = error?.message || "Une erreur inconnue est survenue";
      console.error("❌ Import error:", errorMessage);

      const isSocialMediaError =
        errorMessage.includes("SOCIAL_MEDIA_ERROR:") ||
        errorMessage.includes("Instagram") ||
        errorMessage.includes("TikTok") ||
        errorMessage.includes("limite l'accès");

      // Clean up the error message (remove prefix)
      const cleanMessage = errorMessage.replace("SOCIAL_MEDIA_ERROR: ", "");

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
      } else if (isSocialMediaError) {
        // Social media import error - offer manual creation
        Alert.alert(
          "Import impossible",
          `${cleanMessage}\n\nVous pouvez créer la recette manuellement.`,
          [
            { text: "Annuler", style: "cancel" },
            {
              text: "Créer manuellement",
              onPress: () =>
                router.push({
                  pathname: "/recipes/create",
                  params: { sourceUrl: url, sourcePlatform: urlSource },
                }),
            },
            { text: "Réessayer", onPress: handleImport },
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
      setProgressMessage("");
    }
  }, [url, user, selectedCookbookId, importRecipe, isValidUrl]);

  // ==========================================================================
  // PHOTO IMPORT HANDLERS
  // ==========================================================================

  const handleCameraPress = useCallback(async () => {
    await takePhoto();
  }, [takePhoto]);

  const handleGalleryPress = useCallback(async () => {
    await pickFromGallery();
  }, [pickFromGallery]);

  const handlePhotoImport = useCallback(async () => {
    if (!photo) {
      Alert.alert("Erreur", "Aucune photo sélectionnée");
      return;
    }

    if (!user?.id) {
      Alert.alert("Erreur", "Vous devez être connecté pour importer des recettes");
      return;
    }

    try {
      // Reset progress
      setProgress(0);
      setProgressMessage("Analyse de la photo...");

      // Call import mutation with imageBase64
      const result = await importRecipe.mutateAsync({
        userId: user.id,
        cookbookId: selectedCookbookId,
        imageBase64: photo.base64,
        imageMimeType: photo.mimeType,
        onProgress: (p) => {
          setProgress(p);
          if (p === 100) {
            setProgressMessage("Import terminé !");
          }
        },
      });

      // Close modal
      setShowPhotoModal(false);
      clearPhoto();
      setProgress(100);
      setProgressMessage("Import terminé !");

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
      const errorMessage = error?.message || "Une erreur inconnue est survenue";
      console.error("❌ Photo import error:", errorMessage);

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
          `Impossible d'analyser la photo: ${errorMessage}`,
          [
            { text: "Annuler", style: "cancel" },
            { text: "Réessayer", onPress: handlePhotoImport },
          ]
        );
      }

      // Reset progress
      setProgress(0);
      setProgressMessage("");
    }
  }, [photo, user, selectedCookbookId, importRecipe, clearPhoto]);

  const handleClosePhotoModal = useCallback(() => {
    if (!importRecipe.isPending) {
      setShowPhotoModal(false);
      clearPhoto();
    }
  }, [importRecipe.isPending, clearPhoto]);

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

          {/* Source Badge */}
          {urlSource === "instagram" && (
            <View style={styles.sourceBadge}>
              <Text variant="caption" style={styles.sourceBadgeText}>
                📸 Instagram Post/Reel
              </Text>
            </View>
          )}
          {urlSource === "tiktok" && (
            <View style={styles.sourceBadge}>
              <Text variant="caption" style={styles.sourceBadgeText}>
                🎵 TikTok Video
              </Text>
            </View>
          )}
        </View>

        {/* Photo Import Button */}
        <View style={styles.photoImportSection}>
          <TouchableOpacity
            style={styles.photoImportButton}
            onPress={() => setShowPhotoModal(true)}
            disabled={importRecipe.isPending}
            activeOpacity={0.7}
          >
            <View style={styles.photoImportIcon}>
              <Text style={styles.photoImportEmoji}>📷</Text>
            </View>
            <View style={styles.photoImportContent}>
              <Text variant="h3" style={styles.photoImportTitle}>
                Importer depuis une photo
              </Text>
              <Text variant="bodySmall" color="neutral">
                Photographiez une recette de livre de cuisine
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text variant="caption" color="neutral" style={styles.dividerText}>
              ou
            </Text>
            <View style={styles.dividerLine} />
          </View>
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
              {progressMessage || "Import en cours..."} {progress}%
            </Text>
            <Text variant="caption" color="neutral" style={styles.progressHint}>
              {progress < 20
                ? "Connexion au serveur"
                : progress < 80
                ? "Extraction et analyse IA en cours"
                : "Presque terminé"}
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

      {/* Photo Import Modal */}
      <PhotoImportModal
        visible={showPhotoModal}
        onClose={handleClosePhotoModal}
        onCameraPress={handleCameraPress}
        onGalleryPress={handleGalleryPress}
        onImport={handlePhotoImport}
        isCapturing={isCapturingPhoto}
        isImporting={importRecipe.isPending}
        photo={photo}
        onClearPhoto={clearPhoto}
      />
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

  // Photo Import Button
  photoImportSection: {
    marginBottom: spacing.lg,
  },

  photoImportButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary[100],
    borderRadius: spacing.md,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
    borderStyle: "dashed",
  },

  photoImportIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
    ...shadows.sm,
  },

  photoImportEmoji: {
    fontSize: 28,
  },

  photoImportContent: {
    flex: 1,
  },

  photoImportTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  // Divider
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.lg,
  },

  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.gray[300],
  },

  dividerText: {
    marginHorizontal: spacing.md,
    textTransform: "uppercase",
  },

  sourceBadge: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[100],
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: spacing["2xl"],
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.primary.DEFAULT,
  },

  sourceBadgeText: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.semibold as any,
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

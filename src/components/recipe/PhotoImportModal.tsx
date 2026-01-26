/**
 * PhotoImportModal Component
 *
 * Modal for selecting photo source (camera or gallery)
 * for recipe import via Gemini Vision.
 *
 * @module components/recipe/PhotoImportModal
 */

import React from "react";
import {
  View,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Image,
  ActivityIndicator,
} from "react-native";
import { Text, Button } from "@/components/ui";
import { colors, spacing, fontSizes, fontWeights, shadows } from "@/theme";
import type { PhotoResult } from "@/hooks/usePhotoImport";

interface PhotoImportModalProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Callback when camera is selected */
  onCameraPress: () => void;
  /** Callback when gallery is selected */
  onGalleryPress: () => void;
  /** Callback when import is confirmed */
  onImport: () => void;
  /** Whether photo capture is in progress */
  isCapturing: boolean;
  /** Whether import is in progress */
  isImporting: boolean;
  /** Current photo result (if any) */
  photo: PhotoResult | null;
  /** Callback to clear photo */
  onClearPhoto: () => void;
}

/**
 * Modal component for photo-based recipe import
 *
 * Shows camera/gallery options, photo preview, and import button.
 *
 * @example
 * ```tsx
 * <PhotoImportModal
 *   visible={showPhotoModal}
 *   onClose={() => setShowPhotoModal(false)}
 *   onCameraPress={handleCamera}
 *   onGalleryPress={handleGallery}
 *   onImport={handleImport}
 *   isCapturing={isCapturing}
 *   isImporting={isImporting}
 *   photo={photo}
 *   onClearPhoto={clearPhoto}
 * />
 * ```
 */
export function PhotoImportModal({
  visible,
  onClose,
  onCameraPress,
  onGalleryPress,
  onImport,
  isCapturing,
  isImporting,
  photo,
  onClearPhoto,
}: PhotoImportModalProps) {
  const isLoading = isCapturing || isImporting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <Text variant="h2" style={styles.title}>
                  Importer par photo
                </Text>
                <Text variant="body" color="neutral" style={styles.subtitle}>
                  Prenez en photo une recette de livre de cuisine
                </Text>
              </View>

              {/* Photo Preview or Options */}
              {photo ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: photo.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.previewInfo}>
                    <Text variant="caption" color="neutral">
                      {Math.round(photo.fileSize / 1024)} KB - {photo.width}x
                      {photo.height}
                    </Text>
                  </View>

                  {/* Import Button */}
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={onImport}
                    disabled={isLoading}
                    style={styles.importButton}
                  >
                    {isImporting ? "Analyse en cours..." : "Analyser la recette"}
                  </Button>

                  {/* Change Photo Button */}
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={onClearPhoto}
                    disabled={isLoading}
                  >
                    <Text
                      variant="body"
                      style={[
                        styles.changePhotoText,
                        isLoading && styles.disabledText,
                      ]}
                    >
                      Changer de photo
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.optionsContainer}>
                  {isCapturing ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator
                        size="large"
                        color={colors.primary.DEFAULT}
                      />
                      <Text
                        variant="body"
                        color="neutral"
                        style={styles.loadingText}
                      >
                        Traitement de l'image...
                      </Text>
                    </View>
                  ) : (
                    <>
                      {/* Camera Option */}
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={onCameraPress}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionIcon}>
                          <Text style={styles.optionEmoji}>📷</Text>
                        </View>
                        <View style={styles.optionContent}>
                          <Text variant="h3" style={styles.optionTitle}>
                            Prendre une photo
                          </Text>
                          <Text variant="bodySmall" color="neutral">
                            Utilisez la caméra pour photographier une recette
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Gallery Option */}
                      <TouchableOpacity
                        style={styles.optionButton}
                        onPress={onGalleryPress}
                        activeOpacity={0.7}
                      >
                        <View style={styles.optionIcon}>
                          <Text style={styles.optionEmoji}>🖼️</Text>
                        </View>
                        <View style={styles.optionContent}>
                          <Text variant="h3" style={styles.optionTitle}>
                            Galerie photos
                          </Text>
                          <Text variant="bodySmall" color="neutral">
                            Sélectionnez une photo existante
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}

              {/* Info */}
              <View style={styles.infoContainer}>
                <Text variant="caption" color="neutral" style={styles.infoText}>
                  Notre IA analysera la photo pour extraire le titre, les
                  ingrédients et les étapes de la recette.
                </Text>
              </View>

              {/* Cancel Button */}
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                disabled={isLoading}
              >
                <Text
                  variant="body"
                  style={[
                    styles.cancelText,
                    isLoading && styles.disabledText,
                  ]}
                >
                  Annuler
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },

  container: {
    backgroundColor: colors.white,
    borderRadius: spacing.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 400,
    ...shadows.lg,
  },

  header: {
    marginBottom: spacing.xl,
    alignItems: "center",
  },

  title: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
    textAlign: "center",
  },

  subtitle: {
    textAlign: "center",
  },

  // Options (camera/gallery selection)
  optionsContainer: {
    marginBottom: spacing.lg,
  },

  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cream.DEFAULT,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },

  optionEmoji: {
    fontSize: 24,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  // Loading state
  loadingContainer: {
    alignItems: "center",
    padding: spacing.xl,
  },

  loadingText: {
    marginTop: spacing.md,
  },

  // Photo preview
  previewContainer: {
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: spacing.md,
    backgroundColor: colors.gray[100],
  },

  previewInfo: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },

  importButton: {
    width: "100%",
    marginBottom: spacing.sm,
  },

  changePhotoButton: {
    padding: spacing.sm,
  },

  changePhotoText: {
    color: colors.primary.DEFAULT,
    fontWeight: fontWeights.medium as any,
  },

  // Info
  infoContainer: {
    backgroundColor: colors.primary[100],
    borderRadius: spacing.sm,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },

  infoText: {
    textAlign: "center",
    lineHeight: 18,
  },

  // Cancel button
  cancelButton: {
    alignItems: "center",
    padding: spacing.sm,
  },

  cancelText: {
    color: colors.gray[500],
    fontWeight: fontWeights.medium as any,
  },

  disabledText: {
    opacity: 0.5,
  },
});

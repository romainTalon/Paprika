/**
 * CoverImagePicker Component
 *
 * Allows users to select a cover image for a recipe from camera or gallery.
 * Displays placeholder when no image, or the selected/existing image with options to change.
 *
 * @module components/recipe/CoverImagePicker
 */

import React, { useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Text } from "@/components/ui";
import { colors, spacing, fontWeights, shadows } from "@/theme";
import { usePhotoImport, type PhotoResult } from "@/hooks/usePhotoImport";

/**
 * Cover image data - can be either an existing URL or a newly captured photo
 */
export interface CoverImageData {
  /** Type of image source */
  type: "url" | "photo";
  /** URL for existing images (from import or already uploaded) */
  url?: string;
  /** PhotoResult for newly captured/selected images */
  photo?: PhotoResult;
}

interface CoverImagePickerProps {
  /** Current cover image data */
  value: CoverImageData | null;
  /** Callback when image changes */
  onChange: (data: CoverImageData | null) => void;
  /** Optional label text */
  label?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/**
 * Cover image picker component for recipe forms
 *
 * @example
 * ```tsx
 * const [coverImage, setCoverImage] = useState<CoverImageData | null>(null);
 *
 * <CoverImagePicker
 *   value={coverImage}
 *   onChange={setCoverImage}
 *   label="Image de couverture"
 * />
 * ```
 */
export function CoverImagePicker({
  value,
  onChange,
  label = "Image de couverture",
  disabled = false,
}: CoverImagePickerProps) {
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { takePhoto, pickFromGallery, isLoading } = usePhotoImport({
    // Higher quality for cover images
    maxWidth: 1200,
    maxHeight: 1200,
    quality: 0.85,
  });

  // Get the display URI based on image type
  const getDisplayUri = useCallback((): string | null => {
    if (!value) return null;
    if (value.type === "url" && value.url) return value.url;
    if (value.type === "photo" && value.photo) return value.photo.uri;
    return null;
  }, [value]);

  const displayUri = getDisplayUri();

  const handleCameraPress = useCallback(async () => {
    setIsProcessing(true);
    const result = await takePhoto();
    setIsProcessing(false);
    setShowModal(false);
    if (result) {
      onChange({ type: "photo", photo: result });
    }
  }, [takePhoto, onChange]);

  const handleGalleryPress = useCallback(async () => {
    setIsProcessing(true);
    const result = await pickFromGallery();
    setIsProcessing(false);
    setShowModal(false);
    if (result) {
      onChange({ type: "photo", photo: result });
    }
  }, [pickFromGallery, onChange]);

  const handleRemoveImage = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handlePress = useCallback(() => {
    if (disabled || isProcessing) return;
    setShowModal(true);
  }, [disabled, isProcessing]);

  return (
    <View style={styles.container}>
      <Text variant="h3" style={styles.label}>
        {label}
      </Text>
      <Text
        variant="bodySmall"
        color="neutral"
        style={styles.hint}
      >
        Ajoutez une photo pour illustrer votre recette (optionnel)
      </Text>

      {/* Image Preview or Placeholder */}
      <TouchableOpacity
        style={[
          styles.imageContainer,
          disabled && styles.imageContainerDisabled,
        ]}
        onPress={handlePress}
        activeOpacity={0.7}
        disabled={disabled || isProcessing}
      >
        {displayUri ? (
          <>
            <Image
              source={{ uri: displayUri }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.imageOverlay}>
              <Text variant="bodySmall" style={styles.overlayText}>
                Appuyez pour modifier
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text variant="body" style={styles.placeholderText}>
              Ajouter une image
            </Text>
            <Text variant="caption" color="neutral">
              Appuyez pour prendre ou choisir une photo
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Remove button when image exists */}
      {displayUri && !isProcessing && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={handleRemoveImage}
          disabled={disabled}
        >
          <Text variant="bodySmall" style={styles.removeText}>
            Supprimer l'image
          </Text>
        </TouchableOpacity>
      )}

      {/* Source Selection Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text variant="h3" style={styles.modalTitle}>
                  Choisir une image
                </Text>

                {isProcessing ? (
                  <View style={styles.modalLoadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary.DEFAULT} />
                    <Text variant="body" color="neutral" style={styles.modalLoadingText}>
                      Traitement de l'image...
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Camera Option */}
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={handleCameraPress}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionIcon}>
                        <Text style={styles.optionEmoji}>📷</Text>
                      </View>
                      <View style={styles.optionContent}>
                        <Text variant="body" style={styles.optionTitle}>
                          Prendre une photo
                        </Text>
                        <Text variant="caption" color="neutral">
                          Utiliser la caméra
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Gallery Option */}
                    <TouchableOpacity
                      style={styles.optionButton}
                      onPress={handleGalleryPress}
                      activeOpacity={0.7}
                    >
                      <View style={styles.optionIcon}>
                        <Text style={styles.optionEmoji}>🖼️</Text>
                      </View>
                      <View style={styles.optionContent}>
                        <Text variant="body" style={styles.optionTitle}>
                          Galerie photos
                        </Text>
                        <Text variant="caption" color="neutral">
                          Choisir une image existante
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Cancel */}
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => setShowModal(false)}
                    >
                      <Text variant="body" style={styles.cancelText}>
                        Annuler
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },

  label: {
    color: colors.warm.brown,
    marginBottom: spacing.xs,
  },

  hint: {
    marginBottom: spacing.md,
  },

  // Image container
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: spacing.md,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
    overflow: "hidden",
  },

  imageContainerDisabled: {
    opacity: 0.5,
  },

  // Image
  image: {
    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: spacing.sm,
    alignItems: "center",
  },

  overlayText: {
    color: colors.white,
    fontWeight: fontWeights.medium as any,
  },

  // Placeholder
  placeholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },

  placeholderIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },

  placeholderText: {
    color: colors.gray[600],
    fontWeight: fontWeights.medium as any,
    marginBottom: spacing.xs,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingText: {
    marginTop: spacing.md,
  },

  // Remove button
  removeButton: {
    marginTop: spacing.sm,
    alignSelf: "center",
    padding: spacing.sm,
  },

  removeText: {
    color: colors.error,
    fontWeight: fontWeights.medium as any,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },

  modalContainer: {
    backgroundColor: colors.white,
    borderRadius: spacing.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 340,
    ...shadows.lg,
  },

  modalTitle: {
    color: colors.warm.brown,
    marginBottom: spacing.lg,
    textAlign: "center",
  },

  // Options
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.cream.DEFAULT,
    borderRadius: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[100],
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.md,
  },

  optionEmoji: {
    fontSize: 22,
  },

  optionContent: {
    flex: 1,
  },

  optionTitle: {
    color: colors.warm.brown,
    fontWeight: fontWeights.medium as any,
  },

  // Cancel
  cancelButton: {
    marginTop: spacing.md,
    alignItems: "center",
    padding: spacing.sm,
  },

  cancelText: {
    color: colors.gray[500],
    fontWeight: fontWeights.medium as any,
  },

  // Modal loading
  modalLoadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },

  modalLoadingText: {
    marginTop: spacing.md,
  },
});

/**
 * usePhotoImport Hook
 *
 * Custom hook for capturing photos from camera or gallery
 * and compressing them for AI processing.
 *
 * Uses expo-image-picker for media selection and
 * expo-image-manipulator for compression/optimization.
 *
 * @module hooks/usePhotoImport
 */

import { useState, useCallback } from "react";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";
import { Alert } from "react-native";

/**
 * Configuration for image compression
 */
interface CompressionConfig {
  /** Maximum width in pixels (height auto-scaled) */
  maxWidth: number;
  /** Maximum height in pixels (width auto-scaled) */
  maxHeight: number;
  /** JPEG quality (0-1) */
  quality: number;
}

/**
 * Default compression settings optimized for Gemini Vision
 * - 1024px max dimension keeps text readable
 * - 0.8 quality balances size/quality
 * - Results in ~100-300KB images
 */
const DEFAULT_COMPRESSION: CompressionConfig = {
  maxWidth: 1024,
  maxHeight: 1024,
  quality: 0.8,
};

/**
 * Result of photo capture/selection
 */
export interface PhotoResult {
  /** Base64 encoded image data (without data:image prefix) */
  base64: string;
  /** MIME type of the image */
  mimeType: "image/jpeg" | "image/png";
  /** Original file URI (local) */
  uri: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** Approximate file size in bytes */
  fileSize: number;
}

/**
 * Hook state and methods
 */
export interface UsePhotoImportReturn {
  /** Whether photo capture is in progress */
  isLoading: boolean;
  /** Error message if capture failed */
  error: string | null;
  /** Captured photo result */
  photo: PhotoResult | null;
  /** Open camera to take a photo */
  takePhoto: () => Promise<PhotoResult | null>;
  /** Open gallery to select a photo */
  pickFromGallery: () => Promise<PhotoResult | null>;
  /** Clear current photo and error */
  clearPhoto: () => void;
}

/**
 * Custom hook for photo capture and compression
 *
 * @param config - Optional compression configuration
 * @returns Hook state and methods
 *
 * @example
 * ```typescript
 * const { takePhoto, pickFromGallery, photo, isLoading } = usePhotoImport();
 *
 * const handleCamera = async () => {
 *   const result = await takePhoto();
 *   if (result) {
 *     // Send result.base64 to Gemini Vision API
 *   }
 * };
 * ```
 */
export function usePhotoImport(
  config: Partial<CompressionConfig> = {}
): UsePhotoImportReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photo, setPhoto] = useState<PhotoResult | null>(null);

  const compressionConfig: CompressionConfig = {
    ...DEFAULT_COMPRESSION,
    ...config,
  };

  /**
   * Request camera permissions
   */
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à la caméra est nécessaire pour prendre des photos de recettes.",
        [{ text: "OK" }]
      );
      return false;
    }

    return true;
  }, []);

  /**
   * Request media library permissions
   */
  const requestGalleryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== "granted") {
      Alert.alert(
        "Permission requise",
        "L'accès à la galerie est nécessaire pour sélectionner des photos de recettes.",
        [{ text: "OK" }]
      );
      return false;
    }

    return true;
  }, []);

  /**
   * Compress and convert image to base64
   */
  const processImage = useCallback(
    async (uri: string): Promise<PhotoResult> => {
      // Compress image
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            resize: {
              width: compressionConfig.maxWidth,
              height: compressionConfig.maxHeight,
            },
          },
        ],
        {
          compress: compressionConfig.quality,
          format: ImageManipulator.SaveFormat.JPEG,
          base64: true,
        }
      );

      if (!manipulated.base64) {
        throw new Error("Failed to convert image to base64");
      }

      // Estimate file size from base64 string length
      // Base64 increases size by ~33%, so: fileSize ≈ base64Length * 0.75
      const fileSize = Math.round(manipulated.base64.length * 0.75);

      return {
        base64: manipulated.base64,
        mimeType: "image/jpeg",
        uri: manipulated.uri,
        width: manipulated.width,
        height: manipulated.height,
        fileSize,
      };
    },
    [compressionConfig]
  );

  /**
   * Take photo with camera
   */
  const takePhoto = useCallback(async (): Promise<PhotoResult | null> => {
    setError(null);
    setIsLoading(true);

    try {
      // Check permissions
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      // Launch camera - no forced crop to allow full page capture
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1, // Max quality, we'll compress after
      });

      if (result.canceled || !result.assets?.[0]) {
        setIsLoading(false);
        return null;
      }

      // Process image
      const processed = await processImage(result.assets[0].uri);
      setPhoto(processed);
      setIsLoading(false);

      return processed;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur lors de la capture photo";
      setError(message);
      setIsLoading(false);
      console.error("❌ Photo capture error:", err);
      return null;
    }
  }, [requestCameraPermission, processImage]);

  /**
   * Pick photo from gallery
   */
  const pickFromGallery = useCallback(async (): Promise<PhotoResult | null> => {
    setError(null);
    setIsLoading(true);

    try {
      // Check permissions
      const hasPermission = await requestGalleryPermission();
      if (!hasPermission) {
        setIsLoading(false);
        return null;
      }

      // Launch gallery - no forced crop to allow full page selection
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: false,
        quality: 1, // Max quality, we'll compress after
      });

      if (result.canceled || !result.assets?.[0]) {
        setIsLoading(false);
        return null;
      }

      // Process image
      const processed = await processImage(result.assets[0].uri);
      setPhoto(processed);
      setIsLoading(false);

      return processed;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Erreur lors de la sélection photo";
      setError(message);
      setIsLoading(false);
      console.error("❌ Photo selection error:", err);
      return null;
    }
  }, [requestGalleryPermission, processImage]);

  /**
   * Clear current photo
   */
  const clearPhoto = useCallback(() => {
    setPhoto(null);
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    photo,
    takePhoto,
    pickFromGallery,
    clearPhoto,
  };
}

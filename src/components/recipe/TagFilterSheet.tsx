/**
 * TagFilterSheet Component
 *
 * Bottom sheet modal for filtering recipes by tags.
 * Reuses TagPicker component with apply/reset functionality.
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Text, Button } from "@/components/ui";
import { colors, spacing, fontSizes, shadows } from "@/theme";
import { TagPicker } from "./TagPicker";

interface TagFilterSheetProps {
  /** Whether modal is visible */
  visible: boolean;
  /** Currently applied filter tags */
  selectedTags: string[];
  /** Callback when filter changes */
  onFilterChange: (tags: string[]) => void;
  /** Callback to close modal */
  onClose: () => void;
}

export function TagFilterSheet({
  visible,
  selectedTags,
  onFilterChange,
  onClose,
}: TagFilterSheetProps) {
  // Local state for tag selection (temporary until applied)
  const [localSelectedTags, setLocalSelectedTags] = useState<string[]>([]);

  // Sync local state with prop when modal opens
  useEffect(() => {
    if (visible) {
      setLocalSelectedTags(selectedTags);
    }
  }, [visible, selectedTags]);

  // Handle apply
  const handleApply = useCallback(() => {
    onFilterChange(localSelectedTags);
    onClose();
  }, [localSelectedTags, onFilterChange, onClose]);

  // Handle reset
  const handleReset = useCallback(() => {
    setLocalSelectedTags([]);
    onFilterChange([]);
    onClose();
  }, [onFilterChange, onClose]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    // Reset local state to original
    setLocalSelectedTags(selectedTags);
    onClose();
  }, [selectedTags, onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.backdrop}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={handleCancel}
        />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h2" style={styles.headerTitle}>
              Filtrer par tags
            </Text>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Fermer"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* TagPicker */}
          <View style={styles.content}>
            <TagPicker
              selectedTags={localSelectedTags}
              onTagsChange={setLocalSelectedTags}
              maxTags={10}
              showCount={true}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Button
              variant="outline"
              onPress={handleReset}
              style={styles.footerButton}
            >
              Réinitialiser
            </Button>
            <Button
              variant="primary"
              onPress={handleApply}
              style={styles.footerButton}
            >
              {localSelectedTags.length > 0
                ? `Appliquer (${localSelectedTags.length})`
                : "Appliquer"}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  backdropTouchable: {
    flex: 1,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.xl,
    borderTopRightRadius: spacing.xl,
    maxHeight: "85%",
    ...shadows.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  headerTitle: {
    flex: 1,
  },
  closeButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  closeIcon: {
    fontSize: 24,
    lineHeight: 24,
    color: colors.warm.gray,
  },
  content: {
    maxHeight: "70%",
  },
  footer: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  footerButton: {
    flex: 1,
  },
});

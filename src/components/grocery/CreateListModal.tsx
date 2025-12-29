/**
 * CreateListModal Component
 *
 * Modal for creating a new grocery list or renaming an existing one.
 * Only requires a name field (no description).
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { Text, Button } from "@/components/ui";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import { useCreateGroceryList, useUpdateGroceryList } from "@/hooks/useGroceryList";
import type { GroceryList } from "@/types";

interface CreateListModalProps {
  visible: boolean;
  list?: GroceryList | null;
  userId: string | null;
  onClose: () => void;
  onSuccess?: (list: GroceryList) => void;
}

export function CreateListModal({
  visible,
  list,
  userId,
  onClose,
  onSuccess,
}: CreateListModalProps) {
  const [name, setName] = useState("");

  const isEditing = !!list;
  const createList = useCreateGroceryList();
  const updateList = useUpdateGroceryList();

  // Reset form when modal opens or list changes
  useEffect(() => {
    if (visible) {
      setName(list?.name || "");
    }
  }, [visible, list]);

  // Validation
  const isNameValid = name.trim().length >= 1;
  const isLoading = createList.isPending || updateList.isPending;

  // Handlers
  const handleSave = useCallback(async () => {
    if (!isNameValid || !userId) return;

    try {
      if (isEditing && list) {
        // Update existing list
        await updateList.mutateAsync({
          listId: list.id,
          userId,
          updates: { name: name.trim() },
        });
        onSuccess?.(list);
      } else {
        // Create new list
        const created = await createList.mutateAsync({
          userId,
          name: name.trim(),
        });
        onSuccess?.(created);
      }

      onClose();
    } catch (error) {
      console.error("CreateListModal error:", error);

      // Check if it's a freemium limit error
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes("limit reached")) {
        Alert.alert(
          "Limite atteinte",
          "Vous avez atteint la limite de listes actives (1/1). Pour créer plusieurs listes, passez à Premium ou archivez votre liste actuelle.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Erreur",
          errorMessage
        );
      }
    }
  }, [isNameValid, userId, isEditing, list, name, updateList, createList, onSuccess, onClose]);

  const handleCancel = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleCancel}
        />

        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text variant="h2">{isEditing ? "Renommer la liste" : "Nouvelle liste"}</Text>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeButton}
              accessibilityLabel="Fermer"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Name Field */}
            <View style={styles.field}>
              <Text variant="bodySmall" style={styles.label}>
                Nom de la liste <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Courses de la semaine"
                placeholderTextColor={colors.gray[400]}
                maxLength={100}
                editable={!isLoading}
                autoCapitalize="sentences"
                autoFocus
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button
              variant="outline"
              onPress={handleCancel}
              disabled={isLoading}
              style={styles.actionButton}
            >
              Annuler
            </Button>

            <Button
              variant="primary"
              onPress={handleSave}
              disabled={!isNameValid}
              loading={isLoading}
              style={styles.actionButton}
            >
              {isEditing ? "Enregistrer" : "Créer"}
            </Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },

  modal: {
    backgroundColor: colors.white,
    borderTopLeftRadius: spacing.lg,
    borderTopRightRadius: spacing.lg,
    maxHeight: "90%",
    ...shadows.lg,
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },

  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },

  closeIcon: {
    fontSize: 24,
    color: colors.gray[600],
  },

  // Form
  form: {
    padding: spacing.lg,
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

  // Actions
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },

  actionButton: {
    flex: 1,
  },
});

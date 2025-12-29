/**
 * EditItemModal Component
 *
 * Modal for editing an existing grocery item.
 * Includes name (required), quantity (optional), unit (optional), and category selection.
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
  ScrollView,
  Alert,
} from "react-native";
import { Text, Button } from "@/components/ui";
import { CategoryPicker } from "./CategoryPicker";
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import { DEFAULT_CATEGORY_ID, GROCERY_CATEGORIES, getCategoryDisplay } from "@/constants/categories";
import { useUpdateGroceryItem } from "@/hooks/useGroceryList";
import type { GroceryItem } from "@/types";

interface EditItemModalProps {
  visible: boolean;
  item: GroceryItem;
  listId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditItemModal({
  visible,
  item,
  listId,
  onClose,
  onSuccess,
}: EditItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [category, setCategory] = useState(DEFAULT_CATEGORY_ID);

  const updateItem = useUpdateGroceryItem();

  // Pre-fill form when modal opens
  useEffect(() => {
    if (visible && item) {
      setName(item.name);
      setQuantity(item.quantity || "");
      setUnit(item.unit || "");

      // Extract category ID from full label (e.g., "🛒 Autres" → "autres")
      const categoryId = GROCERY_CATEGORIES.find(
        cat => `${cat.emoji} ${cat.label}` === item.category
      )?.id || DEFAULT_CATEGORY_ID;
      setCategory(categoryId);
    }
  }, [visible, item]);

  // Validation
  const isNameValid = name.trim().length >= 1;
  const isQuantityValid = quantity === "" || !isNaN(parseFloat(quantity));
  const isValid = isNameValid && isQuantityValid;
  const isLoading = updateItem.isPending;

  // Handlers
  const handleSave = useCallback(async () => {
    if (!isValid) return;

    try {
      await updateItem.mutateAsync({
        itemId: item.id,
        listId,
        updates: {
          name: name.trim(),
          quantity: quantity || null,
          unit: unit.trim() || null,
          category: getCategoryDisplay(category), // Convert ID to full label (emoji + name)
        },
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("EditItemModal error:", error);
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : JSON.stringify(error)
      );
    }
  }, [isValid, item.id, listId, name, quantity, unit, category, updateItem, onSuccess, onClose]);

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
            <Text variant="h2">Modifier l'article</Text>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeButton}
              accessibilityLabel="Fermer"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView
            style={styles.form}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Name Field */}
            <View style={styles.field}>
              <Text variant="bodySmall" style={styles.label}>
                Nom de l'article <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Tomates"
                placeholderTextColor={colors.gray[400]}
                maxLength={200}
                editable={!isLoading}
                autoCapitalize="sentences"
              />
            </View>

            {/* Quantity and Unit Row */}
            <View style={styles.row}>
              <View style={[styles.field, styles.quantityField]}>
                <Text variant="bodySmall" style={styles.label}>
                  Quantité
                </Text>
                <TextInput
                  style={[styles.input, !isQuantityValid && quantity !== "" && styles.inputError]}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="Ex: 500"
                  placeholderTextColor={colors.gray[400]}
                  keyboardType="decimal-pad"
                  editable={!isLoading}
                />
              </View>

              <View style={[styles.field, styles.unitField]}>
                <Text variant="bodySmall" style={styles.label}>
                  Unité
                </Text>
                <TextInput
                  style={styles.input}
                  value={unit}
                  onChangeText={setUnit}
                  placeholder="Ex: g, ml, pièces"
                  placeholderTextColor={colors.gray[400]}
                  maxLength={50}
                  editable={!isLoading}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Category Picker */}
            <View style={styles.field}>
              <Text variant="bodySmall" style={styles.label}>
                Catégorie
              </Text>
              <CategoryPicker selectedId={category} onSelect={setCategory} />
            </View>
          </ScrollView>

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
              disabled={!isValid}
              loading={isLoading}
              style={styles.actionButton}
            >
              Enregistrer
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

  row: {
    flexDirection: "row",
    gap: spacing.md,
  },

  quantityField: {
    flex: 1,
  },

  unitField: {
    flex: 1,
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

  inputError: {
    borderColor: colors.error,
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

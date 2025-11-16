/**
 * Create/Edit Cookbook Modal
 *
 * Modal for creating a new cookbook or editing an existing one.
 * Includes validation and handles both create and update operations.
 *
 * @module components/modals/CreateCookbookModal
 */

import React, { useState, useEffect } from "react";
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
import { colors, spacing, shadows, fontSizes, fontWeights } from "@/theme";
import {
  useCreateCookbook,
  useUpdateCookbook,
  type Cookbook,
} from "@/hooks/useCookbooks";

interface CreateCookbookModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Cookbook to edit (if null, creates new) */
  cookbook?: Cookbook | null;
  /** Current user ID */
  userId: string | null;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback after successful creation/update */
  onSuccess?: (cookbook: Cookbook) => void;
}

export default function CreateCookbookModal({
  visible,
  cookbook,
  userId,
  onClose,
  onSuccess,
}: CreateCookbookModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDefault, setIsDefault] = useState(false);

  const isEditing = !!cookbook;

  // Mutations
  const createCookbook = useCreateCookbook();
  const updateCookbook = useUpdateCookbook();

  // Reset form when modal opens/closes
  useEffect(() => {
    if (visible) {
      if (cookbook) {
        // Editing existing cookbook
        setName(cookbook.name);
        setDescription(cookbook.description || "");
        setIsDefault(cookbook.isDefault);
      } else {
        // Creating new cookbook
        setName("");
        setDescription("");
        setIsDefault(false);
      }
    }
  }, [visible, cookbook]);

  // Validation
  const isValid = name.trim().length >= 1 && name.trim().length <= 100;
  const isLoading = createCookbook.isPending || updateCookbook.isPending;

  // Handlers
  const handleSave = async () => {
    if (!isValid || !userId) return;

    try {
      if (isEditing && cookbook) {
        // Update existing cookbook
        const updated = await updateCookbook.mutateAsync({
          cookbookId: cookbook.id,
          userId,
          updates: {
            name: name.trim(),
            description: description.trim() || undefined,
            isDefault,
          },
        });

        onSuccess?.(updated);
        onClose();

        Alert.alert("Succès", "Le livre a été modifié avec succès !");
      } else {
        // Create new cookbook
        const created = await createCookbook.mutateAsync({
          userId,
          name: name.trim(),
          description: description.trim() || undefined,
          isDefault,
        });

        onSuccess?.(created);
        onClose();

        Alert.alert("Succès", "Le livre a été créé avec succès !");
      }
    } catch (error) {
      Alert.alert(
        "Erreur",
        error instanceof Error
          ? error.message
          : "Une erreur s'est produite lors de l'enregistrement"
      );
    }
  };

  const handleCancel = () => {
    onClose();
  };

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
            <Text variant="h2">
              {isEditing ? "Modifier le livre" : "Nouveau livre"}
            </Text>
            <TouchableOpacity
              onPress={handleCancel}
              style={styles.closeButton}
              accessibilityLabel="Close modal"
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
                Nom du livre <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ex: Recettes de famille"
                placeholderTextColor={colors.gray[400]}
                maxLength={100}
                autoFocus={!isEditing}
                editable={!isLoading}
              />
              <Text variant="caption" color="neutral" style={styles.hint}>
                {name.length}/100 caractères
              </Text>
            </View>

            {/* Description Field */}
            <View style={styles.field}>
              <Text variant="bodySmall" style={styles.label}>
                Description
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Décrivez ce livre de recettes (optionnel)"
                placeholderTextColor={colors.gray[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                maxLength={500}
                editable={!isLoading}
              />
              <Text variant="caption" color="neutral" style={styles.hint}>
                {description.length}/500 caractères
              </Text>
            </View>

            {/* Default Checkbox */}
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsDefault(!isDefault)}
              disabled={isLoading}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isDefault && styles.checkboxChecked]}>
                {isDefault && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxLabel}>
                <Text variant="body">Livre par défaut</Text>
                <Text variant="caption" color="neutral">
                  Les nouvelles recettes seront ajoutées ici automatiquement
                </Text>
              </View>
            </TouchableOpacity>
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
    fontFamily: "Poppins",
  },

  textArea: {
    height: 100,
    paddingTop: spacing.md, // Ensure padding for multiline
  },

  hint: {
    marginTop: spacing.xs,
    textAlign: "right",
  },

  // Checkbox
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },

  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: colors.gray[400],
    borderRadius: spacing.xs,
    marginRight: spacing.md,
    justifyContent: "center",
    alignItems: "center",
  },

  checkboxChecked: {
    backgroundColor: colors.primary.DEFAULT,
    borderColor: colors.primary.DEFAULT,
  },

  checkmark: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },

  checkboxLabel: {
    flex: 1,
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

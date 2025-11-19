/**
 * Settings Screen
 *
 * User profile, preferences, and account settings.
 */

import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text, Container } from "@/components/ui";
import { colors, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      "Déconnexion",
      "Voulez-vous vraiment vous déconnecter ?",
      [
        {
          text: "Annuler",
          style: "cancel",
        },
        {
          text: "Déconnexion",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
              router.replace("/");
            } catch (error) {
              Alert.alert("Erreur", "Impossible de se déconnecter");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView style={styles.container}>
      {/* Profile Section */}
      <View style={styles.section}>
        <Text variant="h2" style={styles.sectionTitle}>
          Profil
        </Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.[0]?.toUpperCase() || "?"}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text variant="h3">{user?.user_metadata?.full_name || "Utilisateur"}</Text>
            <Text variant="bodySmall" color="neutral">
              {user?.email}
            </Text>
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          Compte
        </Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text variant="body">Modifier le profil</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text variant="body">Changer le mot de passe</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text variant="body">Préférences</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Premium Section */}
      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          Abonnement
        </Text>
        <View style={styles.premiumCard}>
          <Text variant="h3">Version Gratuite</Text>
          <Text variant="bodySmall" color="neutral" style={{ marginTop: spacing.xs }}>
            2 livres • 20 recettes • 5 imports IA/mois
          </Text>
          <TouchableOpacity style={styles.upgradeButton}>
            <Text variant="body" style={{ color: colors.primary.DEFAULT, fontWeight: "600" }}>
              Passer à Premium →
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About Section */}
      <View style={styles.section}>
        <Text variant="h3" style={styles.sectionTitle}>
          À propos
        </Text>
        <TouchableOpacity style={styles.menuItem}>
          <Text variant="body">Aide & Support</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text variant="body">Conditions d'utilisation</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text variant="body">Politique de confidentialité</Text>
          <Text style={styles.arrow}>›</Text>
        </TouchableOpacity>
        <View style={styles.menuItem}>
          <Text variant="bodySmall" color="neutral">
            Version 1.0.0
          </Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={styles.signOutButton}
        onPress={handleSignOut}
      >
        <Text style={styles.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xl }} />
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
    backgroundColor: colors.cream.DEFAULT,
  },
  section: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.md,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.white,
  },
  profileInfo: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: spacing.sm,
  },
  arrow: {
    fontSize: 24,
    color: colors.gray[400],
  },
  premiumCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: spacing.md,
    borderWidth: 2,
    borderColor: colors.primary.DEFAULT,
  },
  upgradeButton: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  signOutButton: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.white,
    borderRadius: spacing.md,
    borderWidth: 1,
    borderColor: colors.error,
    alignItems: "center",
  },
  signOutText: {
    color: colors.error,
    fontWeight: "600",
  },
});

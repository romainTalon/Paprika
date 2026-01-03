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
import { BackButton } from "@/components/navigation";
import { colors, spacing } from "@/theme";
import { useAuth } from "@/hooks/useAuth";

export default function SettingsScreen() {
  const { user, signOut } = useAuth();

  // Calculate days remaining for premium
  const getDaysRemaining = () => {
    if (!user?.premiumUntil) return null;
    const now = new Date();
    const expiry = new Date(user.premiumUntil);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatExpiryDate = () => {
    if (!user?.premiumUntil) return null;
    const expiry = new Date(user.premiumUntil);
    return expiry.toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

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
      <BackButton />
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
        {user?.isPremium ? (
          <View style={styles.premiumCard}>
            <View style={styles.premiumBadge}>
              <Text variant="bodySmall" style={styles.premiumBadgeText}>
                ✨ PREMIUM
              </Text>
            </View>
            <Text variant="h3" style={{ marginTop: spacing.sm }}>
              Abonnement Premium
            </Text>
            {user.premiumUntil && (
              <>
                <Text variant="bodySmall" color="neutral" style={{ marginTop: spacing.xs }}>
                  Expire le {formatExpiryDate()}
                </Text>
                {getDaysRemaining() !== null && getDaysRemaining()! > 0 && (
                  <Text variant="caption" style={{ color: colors.success, marginTop: spacing.xs }}>
                    {getDaysRemaining()} jour{getDaysRemaining()! > 1 ? "s" : ""} restant{getDaysRemaining()! > 1 ? "s" : ""}
                  </Text>
                )}
              </>
            )}

            <View style={styles.divider} />

            <Text variant="bodySmall" style={{ fontWeight: "600", marginBottom: spacing.xs }}>
              Avantages Premium :
            </Text>
            <Text variant="bodySmall" color="neutral">
              ✓ Livres de recettes illimités
            </Text>
            <Text variant="bodySmall" color="neutral">
              ✓ Recettes illimitées
            </Text>
            <Text variant="bodySmall" color="neutral">
              ✓ Imports IA illimités
            </Text>
            <Text variant="bodySmall" color="neutral">
              ✓ Listes de courses illimitées
            </Text>
            <Text variant="bodySmall" color="neutral">
              ✓ Calculs nutritionnels automatiques
            </Text>
            <Text variant="bodySmall" color="neutral">
              ✓ Export PDF professionnel
            </Text>
          </View>
        ) : (
          <View style={styles.premiumCard}>
            <Text variant="h3">Version Gratuite</Text>
            <Text variant="bodySmall" color="neutral" style={{ marginTop: spacing.xs }}>
              2 livres • 20 recettes • 5 imports IA/mois
            </Text>
            <Text variant="bodySmall" color="neutral" style={{ marginTop: spacing.md, fontStyle: "italic" }}>
              Passez à Premium pour débloquer toutes les fonctionnalités (bientôt disponible)
            </Text>
          </View>
        )}
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
  premiumBadge: {
    backgroundColor: colors.primary.DEFAULT,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
    alignSelf: "flex-start",
  },
  premiumBadgeText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 11,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray[200],
    marginVertical: spacing.md,
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

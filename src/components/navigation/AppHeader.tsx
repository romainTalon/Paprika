/**
 * App Header Component
 *
 * Custom header with logo and profile icon
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Text } from "@/components/ui";
import { colors, spacing, fontSizes } from "@/theme";
import { useAuth } from "@/hooks/useAuth";

export function AppHeader() {
  const { user } = useAuth();

  const handleProfilePress = () => {
    router.push("/settings");
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo/Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.logo}>Paprika</Text>
        </View>

        {/* Profile Icon */}
        <TouchableOpacity
          onPress={handleProfilePress}
          style={styles.profileButton}
          accessibilityLabel="Open profile and settings"
        >
          {user?.user_metadata?.avatar_url ? (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user.user_metadata.full_name?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.email?.[0]?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.cream.DEFAULT,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.cream.DEFAULT,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  titleContainer: {
    flex: 1,
  },
  logo: {
    fontSize: fontSizes["2xl"],
    fontWeight: "bold",
    color: colors.primary.DEFAULT,
  },
  profileButton: {
    padding: spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary.DEFAULT,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: fontSizes.base,
    fontWeight: "bold",
    color: colors.white,
  },
});

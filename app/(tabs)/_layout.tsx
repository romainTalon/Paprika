/**
 * Tab Navigation Layout
 *
 * Sets up the bottom tab navigation for the app.
 */

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/theme";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary.DEFAULT,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.gray[200],
          borderTopWidth: 1,
        },
        headerStyle: {
          backgroundColor: colors.white,
          borderBottomColor: colors.gray[200],
          borderBottomWidth: 1,
        },
        headerTintColor: colors.warm.brown,
        headerTitleStyle: {
          fontFamily: "Poppins",
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="cookbooks"
        options={{
          title: "Livres",
          tabBarIcon: ({ color }) => (
            // Using emoji for now - can replace with icon library later
            <Text style={{ fontSize: 24 }}>{color === colors.primary.DEFAULT ? "📚" : "📖"}</Text>
          ),
        }}
      />
    </Tabs>
  );
}

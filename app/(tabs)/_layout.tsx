/**
 * Tab Navigation Layout
 *
 * Sets up the bottom tab navigation for the app.
 */

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { colors } from "@/theme";
import { AppHeader } from "@/components/navigation";

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
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingHorizontal: 4,
        },
        headerStyle: {
          backgroundColor: colors.cream.DEFAULT,
        },
        header: () => <AppHeader />,
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Accueil",
          tabBarLabel: "Accueil",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, lineHeight: 28 }}>🏠</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="cookbooks"
        options={{
          title: "Livres",
          tabBarLabel: "Livres",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, lineHeight: 28 }}>📚</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="meal-plan"
        options={{
          title: "Planning",
          tabBarLabel: "Planning",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, lineHeight: 28 }}>📅</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="grocery-lists"
        options={{
          title: "Courses",
          tabBarLabel: "Courses",
          tabBarIcon: ({ color }) => (
            <Text style={{ fontSize: 24, lineHeight: 28 }}>🛒</Text>
          ),
        }}
      />
    </Tabs>
  );
}

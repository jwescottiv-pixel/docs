import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: "#FF6B6B",
        tabBarInactiveTintColor: "#999",

        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 12,
          borderTopWidth: 0,
          elevation: 12,
        },

        tabBarLabelStyle: { fontSize: 12, fontWeight: "700" },

        tabBarIcon: ({ color, size, focused }) => {
          const iconName =
            route.name === "index"
              ? focused
                ? "sparkles"
                : "sparkles-outline"
              : focused
              ? "archive"
              : "archive-outline";

          return <Ionicons name={iconName as any} size={size ?? 22} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "TTS" }} />
      <Tabs.Screen name="vault" options={{ title: "Vault" }} />
    </Tabs>
  );
}
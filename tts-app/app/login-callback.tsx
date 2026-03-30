import React, { useEffect } from "react";
import { View, Text, Alert } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

export default function LoginCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleUrl = (url: string) => {
      if (!url) {
        Alert.alert("Login error", "No callback URL found");
        return;
      }

      Alert.alert("Login successful", "You are now logged in");

      setTimeout(() => {
        router.replace("/(tabs)");
      }, 500);
    };

    // 🔥 Listen for incoming links
    const subscription = Linking.addEventListener("url", (event) => {
      handleUrl(event.url);
    });

    // 🔥 Also handle cold start just in case
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Logging you in...</Text>
    </View>
  );
}
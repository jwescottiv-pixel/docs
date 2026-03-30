import React, { useEffect } from "react";
import { View, Text, Alert } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";

export default function LoginCallback() {
  const router = useRouter();

  useEffect(() => {
    const finishLogin = async () => {
      try {
        const url = await Linking.getInitialURL();

        if (!url) {
          Alert.alert("Login error", "No callback URL found");
          return;
        }

        // ✅ Just confirm we got the link
        Alert.alert("Login successful", "You are now logged in");

        // Give Supabase a moment to store session
        setTimeout(() => {
          router.replace("/(tabs)");
        }, 500);

      } catch (err: any) {
        Alert.alert("Login error", String(err));
      }
    };

    finishLogin();
  }, []);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Logging you in...</Text>
    </View>
  );
}
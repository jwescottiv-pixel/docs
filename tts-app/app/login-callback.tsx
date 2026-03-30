import React, { useEffect } from "react";
import { View, Text, Alert } from "react-native";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";

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

        // 🔥 THIS IS THE FIX
      if (!url) {
  Alert.alert("Login error", "No callback URL found");
  return;
}

if (!supabase) {
  Alert.alert("Login error", "Supabase is not configured");
  return;
}

const { data, error } = await supabase.auth.exchangeCodeForSession(url);

        if (error) {
          Alert.alert("Login error", error.message);
          return;
        }

        Alert.alert("Logged in!", "Session created successfully");

        // send user back to main app
        router.replace("/(tabs)");
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
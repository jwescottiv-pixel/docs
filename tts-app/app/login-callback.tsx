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

        if (!supabase) {
          Alert.alert("Login error", "Supabase is not configured");
          return;
        }

        const hash = url.split("#")[1] || "";
        const params = new URLSearchParams(hash);

        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");

        if (!access_token || !refresh_token) {
          Alert.alert("Login error", "Missing auth tokens");
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token,
          refresh_token,
        });

        if (error) {
          Alert.alert("Login error", error.message);
          return;
        }

        Alert.alert("Login successful", "You are now logged in");
        router.replace("/(tabs)");
      } catch (err: any) {
        Alert.alert("Login error", String(err));
      }
    };

    finishLogin();
  }, [router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>Logging you in...</Text>
    </View>
  );
}
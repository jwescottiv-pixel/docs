import React, { useEffect } from "react";
import { View, Text, Alert } from "react-native";
import * as Linking from "expo-linking";

export default function LoginCallback() {

  useEffect(() => {
    const finishLogin = async () => {
      try {
        const url = await Linking.getInitialURL();

        if (!url) {
          Alert.alert("Login error", "No callback URL found");
          return;
        }

      Alert.alert("Login callback received", url);


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
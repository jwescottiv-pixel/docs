import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import Purchases from "react-native-purchases";
import { useEffect } from "react";

export default function RootLayout() {
useEffect(() => {
  Purchases.configure({
    apiKey: "test_YhbhHIgFcViNLNfpBcxAyADVxse",
  });
}, []);
return (
    <ShareIntentProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ShareIntentProvider>
  );
}
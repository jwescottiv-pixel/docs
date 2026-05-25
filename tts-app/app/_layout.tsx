import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";
import Purchases from "react-native-purchases";
import { useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
useEffect(() => {
  Purchases.configure({
    apiKey: "test_YhbhHIgFcViNLNfpBcxAyADVxse",
  });

supabase?.auth.getSession().then(({ data }) => {
  const userId = data.session?.user?.id;

  if (userId) {
Purchases.logIn(userId);

Purchases.getCustomerInfo().then((info) => {
  console.log("REVENUECAT CUSTOMER:", info);
});
  }
});
}, []);
return (
    <ShareIntentProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ShareIntentProvider>
  );
}
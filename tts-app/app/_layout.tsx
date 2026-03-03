import { Stack } from "expo-router";
import { ShareIntentProvider } from "expo-share-intent";

export default function RootLayout() {
  return (
    <ShareIntentProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ShareIntentProvider>
  );
}
import React, { useMemo, useState } from "react";
import { useEffect } from "react";
import { useShareIntentContext } from "expo-share-intent";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { fromByteArray } from "base64-js";
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import { Alert } from "react-native";
const BACKEND_TTS_URL =
  process.env.EXPO_PUBLIC_TTS_URL || "https://docs-production-fdc6.up.railway.app/tts";
export default function TtsScreen() {
  const [text, setText] = useState("Hello! This should speak.");
 const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();

useEffect(() => {
  if (!hasShareIntent) return;

  const incoming = (shareIntent.text ?? "").trim();
  if (incoming.length > 0) {
    setText(incoming);
  }

  resetShareIntent();
}, [hasShareIntent, shareIntent?.text, resetShareIntent]); 
  const [status, setStatus] = useState("idle"); // "idle" | "loading" | "playing"

  const canRun = useMemo(() => text.trim().length > 0 && status === "idle", [text, status]);
const generateAndPlay = async () => {
  setStatus("loading");

  try {
    const res = await fetch(BACKEND_TTS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    if (!res.ok) {
      const msg = await res.text().catch(() => "");
      throw new Error(`Backend ${res.status}: ${msg}`);
    }

    const buffer = await res.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const base64Audio = fromByteArray(bytes);

const dir = ((FileSystem as any).cacheDirectory ?? (FileSystem as any).documentDirectory ?? "") as string;
const fileUri = dir + "tts.mp3";

await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
  encoding: "base64",
});

    setStatus("playing");
    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true }
    );

    sound.setOnPlaybackStatusUpdate((s) => {
      if ("didJustFinish" in s && s.didJustFinish) {
        sound.unloadAsync();
        setStatus("idle");
      }
    });
  } catch (e: any) {
    setStatus("idle");
    Alert.alert(
      "TTS Error",
      e?.message ?? "Failed to generate audio."
    );
  }
};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TTS App</Text>

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type something to speak…"
        placeholderTextColor="#666"
        multiline
      />

      <Pressable
        style={[styles.button, !canRun && styles.disabled]}
        disabled={!canRun}
       onPress={generateAndPlay}
      >
        <Text style={styles.buttonText}>
          {status === "loading" ? "Generating…" : status === "playing" ? "Playing…" : "Generate & Play"}
        </Text>
      </Pressable>

      <Text style={styles.small}>Status: {status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "white" },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 12, color: "black" },
  input: {
    minHeight: 140,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    borderColor: "#ccc",
    color: "black",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  disabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: "700", color: "black" },
  small: { marginTop: 12, color: "black" },
});
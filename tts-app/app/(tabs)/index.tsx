import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Switch,
  Linking,
  Alert,
ActivityIndicator
} from "react-native";
import { useShareIntentContext } from "expo-share-intent";
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import { fromByteArray } from "base64-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView, /* ...other imports... */ } from "react-native";
import { Picker } from "@react-native-picker/picker";
export default function TtsScreen() {
  const [text, setText] = useState("Hello, this should speak.");
  const [voiceId, setVoiceId] = useState("zLWoLzezIQShXIP70eGA");
  const [voices, setVoices] = useState<{ voice_id: string; name: string }[]>([]);

  const [autoplayOnShare, setAutoplayOnShare] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(false);
const loadVoices = async () => {
  setVoicesLoading(true);
  try {
    const base = process.env.EXPO_PUBLIC_TTS_URL!.replace(/\/tts$/, "");
    const r = await fetch(`${base}/voices`);
    const data = await r.json();

    setVoices(
      (data?.voices || [])
        .filter((v: any) => v.category === "cloned")
        .map((v: any) => ({
          voice_id: v.voice_id,
          name: v.name,
        }))
    );
  } catch (e) {
    console.error("Failed to load voices", e);
  } finally {
    setVoicesLoading(false);
  }
};
useEffect(() => {
  (async () => {
    try {
      const saved = await AsyncStorage.getItem("autoplayOnShare");
      if (saved !== null) setAutoplayOnShare(saved === "true");
    } catch {}
  })();
}, []);
 useEffect(() => {
  (async () => {
    try {
      const savedVoice = await AsyncStorage.getItem("voiceId");
      if (savedVoice) setVoiceId(savedVoice);
    } catch {}
  })();
}, []);
 useEffect(() => {
  (async () => {
    try {
      await AsyncStorage.setItem(
        "autoplayOnShare",
        String(autoplayOnShare)
      );
    } catch {}
  })();
}, [autoplayOnShare]);
  useEffect(() => {
  (async () => {
    try {
      await AsyncStorage.setItem("voiceId", String(voiceId));
    } catch {}
  })();
}, [voiceId]);
  useEffect(() => {
  loadVoices();
}, []);
  const { shareIntent, resetShareIntent } = useShareIntentContext();

  useMemo(() => {
    if (shareIntent?.text) {
      setText(shareIntent.text);
      resetShareIntent();
    }
  }, [shareIntent]);


const speakText = async () => {
  try {
   const response = await fetch(process.env.EXPO_PUBLIC_TTS_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
   body: JSON.stringify(
  voiceId?.trim() ? { text, voiceId: voiceId.trim() } : { text }
),
    });
if (!response.ok) {
      const raw = await response.text().catch(() => "");
      let message = raw;

      // Try to parse Railway/server JSON errors like:
      // {"detail":{"status":"voice_not_found","message":"..."}}
      try {
        const json = JSON.parse(raw);
        message =
          json?.detail?.message ||
          json?.error ||
          raw ||
          `Request failed (${response.status})`;
      } catch {
        message = raw || `Request failed (${response.status})`;
      }

      Alert.alert("TTS failed", message);
      return;
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    const base64Audio = fromByteArray(bytes);

    const fileUri = FileSystem.documentDirectory + "tts.mp3";
    await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { sound } = await Audio.Sound.createAsync(
      { uri: fileUri },
      { shouldPlay: true }
    );

    sound.setOnPlaybackStatusUpdate((status) => {
      if ("didJustFinish" in status && status.didJustFinish) {
        sound.unloadAsync();
      }
    });
   } catch (err: any) {
  console.error("TTS error:", err);
  Alert.alert("TTS error", err?.message ? String(err.message) : String(err));
}
};
const openElevenLabs = () => {
  Linking.openURL("https://elevenlabs.io/app/voice-lab");
};
  return (
    <View style={styles.container}>
      <Text style={styles.title}>TTS App</Text>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        multiline
      />

      <View style={styles.toggleRow}>
        <Text>Autoplay when opened from share</Text>
        <Switch
          value={autoplayOnShare}
          onValueChange={setAutoplayOnShare}
        />
      </View>

<Pressable style={styles.button} onPress={speakText}>
  <Text style={styles.buttonText}>Generate and Play</Text>
  </Pressable>
<Pressable style={styles.button} onPress={openElevenLabs}>
  <Text style={styles.buttonText}>Clone a Voice with ElevenLabs</Text>
</Pressable>
<View
  style={{
    marginTop: 20,
  }}
>
  <Text>Voice</Text>
</View>
<View style={{ borderWidth: 1, borderRadius: 8, marginTop: 8 }}>
  <Picker
    selectedValue={voiceId}
    onValueChange={(v) => setVoiceId(String(v))}
  >
    {voices.map((v) => (
      <Picker.Item
        key={v.voice_id}
        label={v.name}
        value={v.voice_id}
      />
    ))}
</Picker>
</View>

<Pressable
  style={[
    styles.button,
    { marginTop: 10, opacity: voicesLoading ? 0.6 : 1 }
  ]}
  onPress={loadVoices}
  disabled={voicesLoading}
>
<View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
  {voicesLoading ? <ActivityIndicator size="small" color="#fff" /> : null}
  <Text style={styles.buttonText}>Refresh voices</Text>
</View>
</Pressable>

</View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: "#fff" },
title: { fontSize: 24, fontWeight: "700", marginBottom: 12, color: "#111" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 120,
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#333",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});

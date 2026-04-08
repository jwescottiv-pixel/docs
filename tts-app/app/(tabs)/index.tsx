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
ActivityIndicator,
Image
} from "react-native";
import { useShareIntentContext } from "expo-share-intent";
import * as FileSystem from "expo-file-system/legacy";
import { Audio } from "expo-av";
import { fromByteArray } from "base64-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView, /* ...other imports... */ } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import * as DocumentPicker from "expo-document-picker";
import { supabase } from "../../lib/supabase";
import { useURL } from "expo-linking";
import * as AuthSession from "expo-auth-session";
import * as Crypto from "expo-crypto";
export default function TtsScreen() {
  const [text, setText] = useState("Hello, this should speak.");
  const [voiceId, setVoiceId] = useState("zLWoLzezIQShXIP70eGA");
  const [voices, setVoices] = useState<{ voice_id: string; name: string }[]>([]);

  const [autoplayOnShare, setAutoplayOnShare] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(false);
  const [email, setEmail] = useState("");
const [sendingLink, setSendingLink] = useState(false);
const [loggedIn, setLoggedIn] = useState(false);
const [loadingApple, setLoadingApple] = useState(false);
const sendMagicLink = async () => {
  try {
    setSendingLink(true);
if (!supabase) {
  Alert.alert("Login error", "Supabase is not configured");
  return;
}
const { error } = await supabase.auth.signInWithOtp({
  email,
  options: {
   emailRedirectTo: "ttsapp://",
  },
});

    if (error) {
      Alert.alert("Login error", error.message);
    } else {
      Alert.alert("Check your email", "Magic link sent!");
    }
  } catch (err: any) {
    Alert.alert("Error", String(err));
  } finally {
    setSendingLink(false);
  }
};

const signInWithApple = async () => {
  try {
    setLoadingApple(true);

    const redirectUri = AuthSession.makeRedirectUri({
      scheme: "ttsapp",
    });

    const response = await supabase!.auth.signInWithOAuth({
      provider: "apple",
      options: {
        redirectTo: redirectUri,
      },
    });

    if (response.error) {
      Alert.alert("Apple login error", response.error.message);
    }
  } catch (err: any) {
    Alert.alert("Apple login error", String(err));
  } finally {
    setLoadingApple(false);
  }
};

const testInsert = async () => {

const testInsert = async () => {
  if (!supabase) {
    Alert.alert("Error", "Supabase not initialized");
    return;
  }

  const { data, error } = await supabase
    .from("user_voices")
    .insert([
      {
        voice_id: "test_voice",
        voice_name: "Test Voice",
      },
    ]);

  if (error) {
    Alert.alert("Insert error", error.message);
  } else {
    Alert.alert("Success", "Test voice saved!");
  }
};
const loadVoices = async () => {
  setVoicesLoading(true);
  try {
    const base = process.env.EXPO_PUBLIC_TTS_URL!.replace(/\/tts$/, "");
    const r = await fetch(`${base}/voices`);
    const data = await r.json();

   const list =
  (data?.voices || [])
    .filter((v: any) => v.category === "cloned")
    .map((v: any) => ({
      voice_id: String(v.voice_id),
      name: String(v.name),
    }));

setVoices(list);

// Force a valid selection so Picker has a matching value to display
const nextId =
list.find((v: { voice_id: string; name: string }) => v.voice_id === voiceId)?.voice_id ?? list[0]?.voice_id ?? "";

if (nextId && nextId !== voiceId) {
  setVoiceId(nextId);
}
  } catch (e) {
    console.error("Failed to load voices", e);
  } finally {
    setVoicesLoading(false);
  }
};
useEffect(() => {
  if (!supabase) return;

  const checkSession = async () => {
  const { data } = await supabase!.auth.getSession();
    setLoggedIn(!!data.session);
  };

  checkSession();

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setLoggedIn(!!session);
    }
  );

  return () => {
    listener.subscription.unsubscribe();
  };
}, []);
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
useEffect(() => {
  if (!voices.length) return;

  const found = voices.some((v) => v.voice_id === voiceId);
  if (!found) {
    setVoiceId(voices[0].voice_id);
  }
}, [voices]);
  const { shareIntent, resetShareIntent } = useShareIntentContext();
const url = useURL();

useEffect(() => {
  if (!url || !supabase) return;

  const finishLoginFromUrl = async () => {
    try {
      const hash = url.split("#")[1] || "";
      const params = new URLSearchParams(hash);

      const access_token = params.get("access_token");
      const refresh_token = params.get("refresh_token");

      if (!access_token || !refresh_token) return;

    const { error } = await supabase!.auth.setSession({
        access_token,
        refresh_token,
      });

      if (error) {
        Alert.alert("Login error", error.message);
        return;
      }

      Alert.alert("Login successful", "You are now logged in");
      setLoggedIn(true);
    } catch (err: any) {
      Alert.alert("Login error", String(err));
    }
  };

  finishLoginFromUrl();
}, [url]);
useEffect(() => {
  if (!shareIntent?.text) return;

  const incoming = shareIntent.text;
  setText(incoming);

  (async () => {
    try {
      if (autoplayOnShare) {
        await speakText(incoming);
      }
    } finally {
      resetShareIntent();
    }
  })();
}, [shareIntent?.text, autoplayOnShare]);


const speakText = async (overrideText?: string) => {
  try {
    const t = (overrideText ?? text).trim();
    if (!t) return;

    const response = await fetch(process.env.EXPO_PUBLIC_TTS_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        voiceId?.trim()
          ? { text: t, voiceId: voiceId.trim() }
          : { text: t }
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
const openElevenLabs = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
    });

    if (result.canceled) return;

    const file = result.assets[0];

const formData = new FormData();
formData.append("name", "VoiceCandy Clone");
formData.append("file", {
  uri: file.uri,
  name: file.name || "sample.m4a",
  type: file.mimeType || "audio/m4a",
} as any);

const base = process.env.EXPO_PUBLIC_TTS_URL!.replace(/\/tts$/, "");
const response = await fetch(`${base}/clone`, {
  method: "POST",
  body: formData,
});

const data = await response.json();

if (!response.ok) {
  throw new Error(data?.detail || data?.error || "Clone failed");
}

Alert.alert("Clone created", data?.name || "Voice cloned successfully");
  } catch (err) {
    console.error("Picker error:", err);
    Alert.alert("Error", "Could not pick file");
  }
};
  return (
  <LinearGradient
  colors={["#FFF7ED", "#FFE4E6", "#E6F4FE"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ flex: 1 }}
>
<ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 120,}}>
  <View style={styles.card}>
  <View style={{ marginBottom: 16 }}>
  <Text style={{ fontWeight: "600", marginBottom: 6 }}>Email login</Text>
  <TextInput
    value={email}
    onChangeText={setEmail}
    placeholder="you@example.com"
    autoCapitalize="none"
    keyboardType="email-address"
    style={{
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      marginBottom: 10,
      backgroundColor: "#fff",
    }}
  />
  <Pressable
    onPress={sendMagicLink}
    disabled={sendingLink || !email.trim()}
    style={{
      backgroundColor: sendingLink || !email.trim() ? "#ccc" : "#8B5CF6",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "700" }}>
      {sendingLink ? "Sending..." : "Send Magic Link"}
    </Text>
  </Pressable>
</View>
</View>
<Pressable
  onPress={signInWithApple}
  disabled={loadingApple}
  style={{
    backgroundColor: loadingApple ? "#ccc" : "#000",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  }}
>
  <Text style={{ color: "#fff", fontWeight: "700" }}>
    {loadingApple ? "Connecting..." : "Continue with Apple"}
  </Text>
</Pressable>
<Text style={{ color: "red", fontSize: 22, fontWeight: "900", marginBottom: 16 }}>
  APPLE TEST
</Text>
<Text style={{ marginBottom: 16, fontWeight: "600" }}>
  Login status: {loggedIn ? "Logged in" : "Not logged in"}
</Text>
<View style={styles.brandHeader}>
  <Image
    source={require("../../assets/images/VoiceCandy-icon-1024.png")}
    style={styles.brandLogo}
    resizeMode="contain"
  />
  <Text style={styles.brandTitle}>VoiceCandy</Text>
  <Text style={styles.brandTagline}>Turn text into voice — instantly.</Text>
</View>

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

<Pressable style={styles.button} onPress={() => speakText()}>
  <Text style={styles.buttonText}>Generate and Play</Text>
  </Pressable>
  <Pressable onPress={testInsert} style={styles.button}>
 <Text style={styles.buttonText}>TEST SAVE VOICE 999</Text>
</Pressable>
  <Pressable
  style={[styles.button, { marginTop: 10 }]}
onPress={async () => {
  const item = {
    id: String(Date.now()),
    text,
    voiceId,
    savedAt: Date.now(),
  };

const key = "vault_items";

  const existingRaw = await AsyncStorage.getItem(key);
  const existing = existingRaw ? JSON.parse(existingRaw) : [];

  const next = [item, ...existing];

  await AsyncStorage.setItem(key, JSON.stringify(next));
  Alert.alert("Saved", "Saved to Vault");
}}
>
  <Text style={styles.buttonText}>Save to Vault</Text>
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
  selectedValue={
  voices.some((vv) => vv.voice_id === voiceId)
    ? voiceId
    : (voices[0]?.voice_id ?? "")
}
    onValueChange={(v) => setVoiceId(String(v))}
   style={{ color: "#111" }}
  dropdownIconColor="#111" 
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
</ScrollView>
</LinearGradient>
);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: "#FFF7ED",
    paddingBottom: 120,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
brandHeader: {
  alignItems: "center",
  marginBottom: 14,
},
brandLogo: {
  width: 56,
  height: 56,
  marginBottom: 6,
  borderRadius: 14,
},
brandTitle: {
  fontSize: 36,
  fontWeight: "900",
  textAlign: "center",
  letterSpacing: 1.5,
  marginBottom: 6,
  color: "#FF4F8B",
  textShadowColor: "rgba(255, 75, 140, 0.4)",
  textShadowOffset: { width: 0, height: 3 },
  textShadowRadius: 8,
},

  brandTagline: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.6,
    marginBottom: 18,
  },

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
  backgroundColor: "#FF6B6B",
  paddingVertical: 16,
  borderRadius: 18,
  alignItems: "center",
  marginTop: 14,
  shadowColor: "#FF6B6B",
  shadowOpacity: 0.35,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 6 },
  elevation: 6,
},

  buttonText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
}); 
}
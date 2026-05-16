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
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import { fromByteArray } from "base64-js";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScrollView, /* ...other imports... */ } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../../lib/supabase";

export default function TtsScreen() {
  const [text, setText] = useState("Hello, this should speak.");
  const [voiceId, setVoiceId] = useState("zLWoLzezIQShXIP70eGA");
  const [voices, setVoices] = useState<{ voice_id: string; name: string }[]>([]);
const [userOwnedVoicesOnly, setUserOwnedVoicesOnly] = useState(true);
  const [autoplayOnShare, setAutoplayOnShare] = useState(false);
  const [voicesLoading, setVoicesLoading] = useState(false);
const [cloneLoading, setCloneLoading] = useState(false);
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [sendingLink, setSendingLink] = useState(false);
const [loggedIn, setLoggedIn] = useState(false);
const [authLoading, setAuthLoading] = useState(true);
const [messagesUsed, setMessagesUsed] = useState(0);
const isPremium = false;
const FREE_MESSAGE_LIMIT = 5;
const PREMIUM_MESSAGE_LIMIT = 50;
const MESSAGE_LIMIT = isPremium ? PREMIUM_MESSAGE_LIMIT : FREE_MESSAGE_LIMIT;
const FREE_PLAN_NAME = "Free";
const PREMIUM_PLAN_NAME = "VoiceCandy Premium";
const handleLogin = async () => {
  try {
    setSendingLink(true);

    if (!supabase) {
      Alert.alert("Login error", "Supabase is not configured");
      return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing info", "Enter email and password");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

if (error) {
  if (error.message.toLowerCase().includes("email not confirmed")) {
    Alert.alert(
      "Email not confirmed",
      "Please check your email and confirm your account before logging in."
    );
  } else {
    Alert.alert("Login error", error.message);
  }
} else {
Alert.alert("Success", "Logged in!");
}
  } catch (err: any) {
    Alert.alert("Error", String(err));
  } finally {
    setSendingLink(false);
  }
};
const handleSignUp = async () => {
  try {
    if (!supabase) {
      Alert.alert("Error", "Supabase not configured");
      return;
    }

    if (!email.trim() || !password.trim()) {
      Alert.alert("Missing info", "Enter email and password");
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      Alert.alert("Sign up error", error.message);
    } else {
  Alert.alert(
  "Check your email",
  "We sent you a confirmation link. Please confirm your email before logging in."
);
    }
  } catch (err: any) {
    Alert.alert("Error", String(err));
  }
};

const loadVoices = async () => {
  setVoicesLoading(true);
  try {
    const base = process.env.EXPO_PUBLIC_TTS_URL!.replace(/\/tts$/, "");
const {
  data: { session },
} = await supabase!.auth.getSession();

const r = await fetch(`${base}/voices`, {
  headers: {
    Authorization: `Bearer ${session?.access_token}`,
  },
});
    const data = await r.json();

    const list =
      (data?.voices || [])
        .filter((v: any) => v.category === "cloned")
        .map((v: any) => ({
          voice_id: String(v.voice_id),
          name: String(v.name),
        }));

    setVoices(list);

    const nextId =
      list.find((v: { voice_id: string; name: string }) => v.voice_id === voiceId)?.voice_id ??
      list[0]?.voice_id ??
      "";

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
 const fetchMessageUsage = async () => {
  try {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data, error } = await supabase
      .from("user_usage")
      .select("messages_used")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Fetch usage error:", error);
      return;
    }

    if (data?.messages_used !== undefined) {
      setMessagesUsed(Number(data.messages_used || 0));
    }
  } catch (err) {
    console.error("Fetch usage error:", err);
  }
};
useEffect(() => {
  if (!supabase) {
    setAuthLoading(false);
    return;
  }

  supabase.auth.getSession().then(({ data }) => {
    setLoggedIn(!!data.session);
    setAuthLoading(false);
  });

  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
  setLoggedIn(!!session);

  if (session) {
    fetchMessageUsage();
  }
});

  return () => {
    subscription.unsubscribe();
  };
}, []);
useEffect(() => {
  if (!voices.length) return;

  const found = voices.some((v) => v.voice_id === voiceId);
  if (!found) {
    setVoiceId(voices[0].voice_id);
  }
}, [voices]);
  const { shareIntent, resetShareIntent } = useShareIntentContext();

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

const incrementMessageUsage = async () => {
 
  try {
    if (!supabase) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: existing, error: fetchError } = await supabase
      .from("user_usage")
      .select("id, messages_used")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Usage fetch error:", fetchError);
      return;
    }

    if (!existing) {
      const { error: insertError } = await supabase
        .from("user_usage")
        .insert({
          user_id: user.id,
          messages_used: 1,
        });

      if (insertError) {
        console.error("Usage insert error:", insertError);
      }

      return;
    }

    const { error: updateError } = await supabase
      .from("user_usage")
      .update({
        messages_used: Number(existing.messages_used || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      console.error("Usage update error:", updateError);
    }
  } catch (err) {
    console.error("Usage tracking error:", err);
  }
};
const speakText = async (overrideText?: string) => {
if (!loggedIn) {
  Alert.alert("Login required", "Please log in to use this feature.");
  return;
}  
if (messagesUsed >= MESSAGE_LIMIT) {
  Alert.alert(
    "Limit reached",
    "You’ve used all your messages for now."
  );
  return;
}  
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
   await incrementMessageUsage();
await fetchMessageUsage();

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
const handleLogout = async () => {
  try {
    if (!supabase) {
      return;
    }

    const { error } = await supabase.auth.signOut();
    setEmail("");
    setPassword("");
    if (error) {
      Alert.alert("Logout error", error.message);
    }
  } catch (err: any) {
    Alert.alert("Logout error", String(err));
  }
};
const handleDeleteAccount = async () => {
  try {
    if (!supabase) return;

    Alert.alert(
      "Delete account",
      "Are you sure you want to delete your account? This cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
const base = process.env.EXPO_PUBLIC_TTS_URL!.replace(/\/tts$/, "");

const {
  data: { session },
} = await supabase!.auth.getSession();
if (!session?.access_token) {
  Alert.alert(
    "Delete account failed",
    "Please log out and log back in, then try again."
  );
  return;
}
const response = await fetch(`${base}/delete-account`, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${session?.access_token}`,
  },
});

const data = await response.json().catch(() => ({}));

if (!response.ok) {
Alert.alert(
  "Delete account failed",
  data?.error || `Server returned ${response.status}`
);
  return;
}

await supabase!.auth.signOut();
setEmail("");
setPassword("");
Alert.alert("Account deleted", "Your account has been removed.");
          },
        },
      ]
    );
  } catch (err: any) {
    Alert.alert("Error", String(err));
  }
};
const openElevenLabs = async () => {
  try {
    const sessionResult = await supabase!.auth.getSession();
    const session = sessionResult.data.session;

    if (!session?.access_token) {
      Alert.alert("Login required", "Please log in first.");
      return;
    }

    const result = await DocumentPicker.getDocumentAsync({
      type: ["audio/*"],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled) {
      return;
    }

    const file = result.assets?.[0];

    if (!file?.uri) {
      Alert.alert("Error", "No audio file selected.");
      return;
    }

    const base = process.env.EXPO_PUBLIC_TTS_URL?.replace(/\/tts$/, "");

    if (!base) {
      Alert.alert("Error", "Missing backend URL.");
      return;
    }

    setCloneLoading(true);

    const formData = new FormData();
    formData.append("name", file.name?.replace(/\.[^/.]+$/, "") || "VoiceCandy Clone");
    formData.append("file", {
      uri: file.uri,
      name: file.name || "sample.m4a",
      type: file.mimeType || "audio/mpeg",
    } as any);

    const response = await fetch(`${base}/clone`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      Alert.alert("Clone failed", data?.error || `Server returned ${response.status}`);
      return;
    }

    Alert.alert("Voice clone created", "Your private voice clone was saved to your account.");
    await loadVoices();
  } catch (err: any) {
    Alert.alert("Clone error", String(err));
  } finally {
    setCloneLoading(false);
  }
};


  return (
  <LinearGradient
  colors={["#FFF7ED", "#FFE4E6", "#E6F4FE"]}
  start={{ x: 0, y: 0 }}
  end={{ x: 1, y: 1 }}
  style={{ flex: 1 }}
>
<ScrollView contentContainerStyle={{ flexGrow: 1, padding: 16, paddingTop: 36, paddingBottom: 80 }}>
  <View style={styles.card}>

<View style={styles.brandHeader}>
  <Image
    source={require("../../assets/images/VoiceCandy-icon-1024.png")}
    style={styles.brandLogo}
    resizeMode="contain"
  />
<Text style={styles.brandTitle}>VoiceCandy</Text>
  <Text style={styles.brandTagline}>Turn text into voice — instantly.</Text>
</View>
{loggedIn && (
  <View style={{ marginBottom: 10, alignItems: "center" }}>
    <Text style={{ textAlign: "center", marginBottom: 8 }}>
      Logged in
    </Text>
    <Text style={{ textAlign: "center", marginBottom: 8, fontWeight: "700" }}>
  Plan: {isPremium ? PREMIUM_PLAN_NAME : FREE_PLAN_NAME}
</Text>
Messages used: {messagesUsed} / {MESSAGE_LIMIT}
<Text style={{ textAlign: "center", marginBottom: 8 }}>
  Remaining: {Math.max(0, MESSAGE_LIMIT - messagesUsed)}
</Text>
    <Pressable
      onPress={handleLogout}
      style={{
        backgroundColor: "#6B7280",
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: 10,
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "700" }}>
        Log Out
      </Text>
    </Pressable>
    <Pressable
  onPress={handleDeleteAccount}
  style={{
    backgroundColor: "#DC2626",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    marginTop: 8,
  }}
>
  <Text style={{ color: "#fff", fontWeight: "700" }}>
    Delete Account
  </Text>
</Pressable>
  </View>
)}
{!loggedIn && (
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

  <TextInput
    value={password}
    onChangeText={setPassword}
    placeholder="Password"
    secureTextEntry
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
    onPress={handleLogin}
    disabled={sendingLink || !email.trim() || !password.trim()}
    style={{
      backgroundColor:
        sendingLink || !email.trim() || !password.trim() ? "#ccc" : "#8B5CF6",
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: "center",
    }}
  >
    <Text style={{ color: "#fff", fontWeight: "700" }}>
      {sendingLink ? "Logging in..." : "Log In"}
    </Text>
  </Pressable>
  <Pressable
  onPress={handleSignUp}
  style={{
    backgroundColor: "#10B981",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  }}
>
  <Text style={{ color: "#fff", fontWeight: "700" }}>
    Sign Up
  </Text>
</Pressable>
</View>
)}
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

{loggedIn && (
  <Pressable
    style={[
      styles.button,
      messagesUsed >= MESSAGE_LIMIT ? { opacity: 0.5 } : null,
    ]}
    onPress={() => speakText()}
    disabled={messagesUsed >= MESSAGE_LIMIT}
  >
    <Text style={styles.buttonText}>Generate and Play</Text>
  </Pressable>
)}

{messagesUsed >= MESSAGE_LIMIT && (
  <Text style={{ textAlign: "center", marginTop: 10, color: "#DC2626" }}>
  Upgrade to Premium to unlock more messages.
  </Text>
)}
<Pressable
  style={[
    styles.button,
    {
      marginTop: 10,
      backgroundColor: "#7C3AED",
    },
  ]}
>
  <Text style={styles.buttonText}>Upgrade to Premium</Text>
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
  <Text style={styles.buttonText}>Create Private Voice Clone</Text>
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

</View>
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
  fontSize: 30,
  fontWeight: "900",
  textAlign: "center",
  letterSpacing: 1.5,
  marginBottom: 4,
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
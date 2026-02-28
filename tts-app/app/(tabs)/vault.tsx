import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type VaultItem = {
  id: string;
  text: string;
  voiceId: string;
  savedAt: number;
};

const VAULT_KEY = "vault_items";

function formatSavedAt(ts: number) {
  try {
    return new Date(ts).toLocaleString();
  } catch {
    return "";
  }
}

function previewText(text: string, max = 140) {
  const t = (text ?? "").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1) + "…";
}

export default function VaultScreen() {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadVault = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await AsyncStorage.getItem(VAULT_KEY);
      const parsed: VaultItem[] = raw ? JSON.parse(raw) : [];
      const sorted = [...parsed].sort(
        (a, b) => (b.savedAt ?? 0) - (a.savedAt ?? 0)
      );
      setItems(sorted);
    } catch (e) {
      console.warn("Failed to load vault:", e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVault();
  }, [loadVault]);

  const confirmDelete = useCallback(
    (id: string) => {
      Alert.alert(
        "Remove from Vault?",
        "This will delete the saved item from this device.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              const next = items.filter((x) => x.id !== id);
              setItems(next);
              try {
                await AsyncStorage.setItem(VAULT_KEY, JSON.stringify(next));
              } catch (e) {
                console.warn("Failed to persist vault after delete:", e);
              }
            },
          },
        ]
      );
    },
    [items]
  );

  const renderItem = ({ item }: { item: VaultItem }) => (
    <View style={styles.card}>
      <Text style={styles.text} numberOfLines={4}>
        {previewText(item.text)}
      </Text>

      <View style={styles.metaRow}>
        <View style={styles.metaCol}>
          <Text style={styles.metaLabel}>Saved</Text>
          <Text style={styles.metaValue}>{formatSavedAt(item.savedAt)}</Text>
        </View>

        <View style={styles.metaColRight}>
          <Text style={styles.metaLabel}>Voice</Text>
          <Text style={styles.metaValue} numberOfLines={1}>
            {item.voiceId}
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => confirmDelete(item.id)}
          style={({ pressed }) => [
            styles.actionBtn,
            pressed && styles.actionBtnPressed,
          ]}
        >
          <Text style={styles.actionTextDanger}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Vault</Text>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={items.length === 0 ? styles.emptyWrap : styles.listWrap}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadVault} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No saved items yet</Text>
            <Text style={styles.emptyBody}>
              Tap “Save to Vault” after generating audio to store messages here.
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 12 },
  header: { fontSize: 24, fontWeight: "700", marginBottom: 12 },

  listWrap: { paddingBottom: 24 },
  emptyWrap: { flexGrow: 1, justifyContent: "center", paddingBottom: 24 },

  card: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.10)",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  text: { fontSize: 16, lineHeight: 22, marginBottom: 10 },

  metaRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  metaCol: { flex: 1 },
  metaColRight: { flex: 1, alignItems: "flex-end" },
  metaLabel: { fontSize: 12, opacity: 0.65, marginBottom: 2 },
  metaValue: { fontSize: 13, fontWeight: "600" },

  actionsRow: { flexDirection: "row", justifyContent: "flex-end" },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.12)",
  },
  actionBtnPressed: { opacity: 0.7 },
  actionTextDanger: { fontSize: 14, fontWeight: "700" },

  empty: { alignItems: "center", paddingHorizontal: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  emptyBody: { fontSize: 14, opacity: 0.7, textAlign: "center" },
});
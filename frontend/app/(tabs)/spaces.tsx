import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, ScrollView, Pressable, StyleSheet, TextInput, Modal,
  KeyboardAvoidingView, Platform, ActivityIndicator, DeviceEventEmitter,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";
import { REFRESH_EVENT } from "./_layout";

const TEMPLATES = [
  { name: "Car", icon: "car-outline", color: "#111111" },
  { name: "Home", icon: "home-outline", color: "#374151" },
  // { name: "Study", icon: "school-outline", color: "#4B5563" },
  // { name: "Travel", icon: "airplane-outline", color: "#6B7280" },
  { name: "Finance", icon: "wallet-outline", color: "#111111" },
  // { name: "Fitness", icon: "barbell-outline", color: "#374151" },
  // { name: "Work", icon: "briefcase-outline", color: "#4B5563" },
  // { name: "Health", icon: "medkit-outline", color: "#6B7280" },
] as const;

export default function Spaces() {
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const [spaces, setSpaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState<string>("folder-outline");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await api.listSpaces();
      setSpaces(r.spaces);
    } catch { }
  }, []);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
    const sub = DeviceEventEmitter.addListener(REFRESH_EVENT, () => load());
    return () => sub.remove();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const create = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await api.createSpace({ name: name.trim(), icon, color: "#111111" });
      setName(""); setIcon("folder-outline"); setCreating(false);
      await load();
    } catch { } finally { setBusy(false); }
  };

  const createFromTemplate = async (t: typeof TEMPLATES[number]) => {
    setBusy(true);
    try {
      await api.createSpace({ name: t.name, icon: t.icon, color: t.color });
      await load();
    } catch { } finally { setBusy(false); }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }} testID="spaces-screen">
      <View style={{ padding: spacing.xl, paddingBottom: spacing.md, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 30, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 }}>Spaces</Text>
        <Pressable
          testID="spaces-create-button"
          onPress={() => setCreating(true)}
          hitSlop={12}
          style={{ padding: spacing.sm, borderRadius: radius.pill, backgroundColor: colors.surfaceSecondary }}
        >
          <Ionicons name="add" size={22} color={colors.onSurface} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 140, gap: spacing.md }}>
        {loading ? (
          <ActivityIndicator color={colors.onSurfaceTertiary} />
        ) : spaces.length === 0 ? (
          <View style={{ paddingVertical: spacing["3xl"], alignItems: "center", gap: spacing.lg }}>
            <Ionicons name="grid-outline" size={36} color={colors.onSurfaceTertiary} />
            <Text style={{ fontSize: 18, fontWeight: "600", color: colors.onSurface }}>Create your first Space</Text>
            <Text style={{ fontSize: 14, color: colors.onSurfaceTertiary, textAlign: "center", maxWidth: 300 }}>
              A Space is any part of your life you want to keep organized — Car, Home, Study, Travel or anything you invent.
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, justifyContent: "center" }}>
              {TEMPLATES.slice(0, 6).map((t) => (
                <Pressable
                  key={t.name}
                  testID={`template-${t.name.toLowerCase()}`}
                  onPress={() => createFromTemplate(t)}
                  style={{
                    paddingHorizontal: spacing.lg, paddingVertical: spacing.md,
                    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
                    flexDirection: "row", alignItems: "center", gap: 6,
                  }}
                >
                  <Ionicons name={t.icon as any} size={14} color={colors.onSurface} />
                  <Text style={{ color: colors.onSurface, fontSize: 13, fontWeight: "600" }}>{t.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.md }}>
            {spaces.map((s) => (
              <Pressable
                key={s.id}
                testID={`space-card-${s.id}`}
                onPress={() => router.push(`/${s.id}` as any)}
                style={{
                  width: "48%",
                  minHeight: 140,
                  backgroundColor: colors.surfaceSecondary,
                  borderRadius: radius.lg,
                  padding: spacing.lg,
                  alignItems: "center",
                  justifyContent: "center",
                  gap: spacing.md,
                }}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceTertiary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={(s.icon || "folder-outline") as any}
                    size={22}
                    color={colors.onSurface}
                  />
                </View>

                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: colors.onSurface,
                    textAlign: "center",
                  }}
                  numberOfLines={1}
                >
                  {s.name}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {spaces.length > 0 && (
          <View style={{ marginTop: spacing.xl, gap: spacing.md }}>
            <Text style={{ fontSize: 13, color: colors.onSurfaceTertiary, fontWeight: "700", letterSpacing: 0.4 }}>
              QUICK TEMPLATES
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
              {TEMPLATES.map((t) => (
                <Pressable
                  key={t.name}
                  testID={`template-quick-${t.name.toLowerCase()}`}
                  onPress={() => createFromTemplate(t)}
                  style={{
                    paddingHorizontal: spacing.md, paddingVertical: 8,
                    borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border,
                    flexDirection: "row", alignItems: "center", gap: 6,
                  }}
                >
                  <Ionicons name={t.icon as any} size={12} color={colors.onSurface} />
                  <Text style={{ color: colors.onSurface, fontSize: 12 }}>{t.name}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal visible={creating} animationType="slide" transparent onRequestClose={() => setCreating(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable onPress={() => setCreating(false)} style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }} />
          <View style={{ backgroundColor: colors.surface, padding: spacing.xl, gap: spacing.lg, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: colors.onSurface }}>New Space</Text>
            <TextInput
              testID="new-space-name"
              value={name} onChangeText={setName}
              placeholder="e.g. Car, Home, Study"
              placeholderTextColor={colors.onSurfaceTertiary}
              autoFocus
              style={{
                backgroundColor: colors.surfaceSecondary, color: colors.onSurface,
                borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: 14, fontSize: 16,
              }}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
              {["folder-outline", "car-outline", "home-outline", "school-outline", "airplane-outline", "wallet-outline", "barbell-outline", "briefcase-outline", "medkit-outline", "paw-outline", "camera-outline", "cafe-outline"].map((ic) => (
                <Pressable
                  key={ic}
                  testID={`icon-pick-${ic}`}
                  onPress={() => setIcon(ic)}
                  style={{
                    width: 44, height: 44, borderRadius: radius.md,
                    alignItems: "center", justifyContent: "center",
                    backgroundColor: icon === ic ? colors.brandPrimary : colors.surfaceSecondary,
                  }}
                >
                  <Ionicons name={ic as any} size={20} color={icon === ic ? colors.onBrandPrimary : colors.onSurface} />
                </Pressable>
              ))}
            </ScrollView>
            <Pressable
              testID="new-space-create-button"
              onPress={create}
              disabled={busy || !name.trim()}
              style={{
                backgroundColor: colors.brandPrimary,
                opacity: busy || !name.trim() ? 0.5 : 1,
                paddingVertical: 14, borderRadius: radius.md, alignItems: "center",
              }}
            >
              {busy ? <ActivityIndicator color={colors.onBrandPrimary} /> : (
                <Text style={{ color: colors.onBrandPrimary, fontWeight: "700", fontSize: 15 }}>Create Space</Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

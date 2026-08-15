import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator, DeviceEventEmitter } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "task", label: "Tasks" },
  { key: "note", label: "Notes" },
  { key: "expense", label: "Expenses" },
  { key: "reminder", label: "Reminders" },
  { key: "event", label: "Events" },
] as const;

export default function SpaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius } = useTheme();
  const router = useRouter();
  const [space, setSpace] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [s, list] = await Promise.all([api.getSpace(id), api.listItems({ space_id: id })]);
      setSpace(s); setItems(list);
    } catch {}
  }, [id]);

  useEffect(() => {
    (async () => { setLoading(true); await load(); setLoading(false); })();
    const sub = DeviceEventEmitter.addListener("lifeos.refresh", () => load());
    return () => sub.remove();
  }, [load]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const toggle = async (it: any) => {
    if (it.type !== "task") return;
    try { await api.updateItem(it.id, { completed: !it.completed }); await load(); } catch {}
  };

  const del = async (it: any) => {
    try { await api.deleteItem(it.id); await load(); } catch {}
  };

  const delSpace = async () => {
    if (!id) return;
    try { await api.deleteSpace(id); router.back(); } catch {}
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.surface }} testID="space-detail-screen">
      <View style={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Pressable testID="space-back" onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.onSurface} />
          </Pressable>
          <Pressable testID="space-delete" onPress={delSpace} hitSlop={12}>
            <Ionicons name="trash-outline" size={20} color={colors.onSurfaceTertiary} />
          </Pressable>
        </View>
        {space && (
          <View style={{ gap: spacing.sm }}>
            <View style={{
              width: 52, height: 52, borderRadius: radius.md,
              backgroundColor: colors.surfaceSecondary,
              alignItems: "center", justifyContent: "center",
            }}>
              <Ionicons name={(space.icon || "folder-outline") as any} size={26} color={colors.onSurface} />
            </View>
            <Text style={{ fontSize: 30, fontWeight: "800", color: colors.onSurface, letterSpacing: -0.5 }}>{space.name}</Text>
            {space.description ? <Text style={{ fontSize: 14, color: colors.onSurfaceTertiary }}>{space.description}</Text> : null}
          </View>
        )}
      </View>

      {/* Sticky-ish filter chip row */}
      <View style={{ height: 56, justifyContent: "center" }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm, alignItems: "center" }}
        >
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <Pressable
                key={f.key}
                testID={`filter-${f.key}`}
                onPress={() => setFilter(f.key)}
                style={{
                  flexShrink: 0,
                  height: 36,
                  paddingHorizontal: spacing.lg,
                  borderRadius: radius.pill,
                  alignItems: "center", justifyContent: "center",
                  backgroundColor: active ? colors.brandPrimary : "transparent",
                  borderWidth: 1, borderColor: active ? colors.brandPrimary : colors.border,
                }}
              >
                <Text style={{ color: active ? colors.onBrandPrimary : colors.onSurface, fontSize: 13, fontWeight: "600" }}>
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing.xl, paddingBottom: 140, paddingTop: spacing.sm }}>
        {loading ? (
          <ActivityIndicator color={colors.onSurfaceTertiary} />
        ) : filtered.length === 0 ? (
          <View style={{ paddingVertical: spacing["3xl"], alignItems: "center", gap: spacing.md }}>
            <Ionicons name="sparkles-outline" size={30} color={colors.onSurfaceTertiary} />
            <Text style={{ fontSize: 15, color: colors.onSurfaceTertiary, textAlign: "center" }}>
              Nothing here yet. Use the + button to capture something.
            </Text>
          </View>
        ) : (
          filtered.map((it) => (
            <Pressable
              key={it.id}
              testID={`space-item-${it.id}`}
              onLongPress={() => del(it)}
              onPress={() => toggle(it)}
              style={{
                flexDirection: "row", alignItems: "center", gap: spacing.md,
                paddingVertical: spacing.md,
                borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border,
              }}
            >
              {it.type === "task" ? (
                <Ionicons
                  name={it.completed ? "checkmark-circle" : "ellipse-outline"}
                  size={22} color={it.completed ? colors.success : colors.onSurfaceTertiary}
                />
              ) : (
                <Ionicons name={iconFor(it.type)} size={20} color={colors.onSurfaceTertiary} />
              )}
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15, color: colors.onSurface, fontWeight: "500",
                    textDecorationLine: it.completed ? "line-through" : "none",
                    opacity: it.completed ? 0.5 : 1,
                  }}
                  numberOfLines={2}
                >{it.title}</Text>
                {(it.due_at || it.amount != null || it.recurrence) && (
                  <Text style={{ fontSize: 12, color: colors.onSurfaceTertiary, marginTop: 2 }}>
                    {it.due_at ? new Date(it.due_at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                    {it.amount != null ? ` · ${it.currency || "EUR"} ${Number(it.amount).toFixed(2)}` : ""}
                    {it.recurrence ? ` · ↻ ${it.recurrence}` : ""}
                  </Text>
                )}
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function iconFor(type: string): any {
  return ({
    task: "checkmark-circle-outline",
    reminder: "notifications-outline",
    note: "document-text-outline",
    expense: "cash-outline",
    event: "calendar-outline",
  } as any)[type] || "ellipse-outline";
}

import { Tabs } from "expo-router";
import { View, Pressable, StyleSheet, Platform, useWindowDimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/lib/theme";
import { QuickAddSheet, QuickAddSheetRef } from "@/components/quick_add/quickAdd";
import { DeviceEventEmitter } from "react-native";
import { useCallback, useRef } from "react";

export const REFRESH_EVENT = "lifeos.refresh";

export default function TabsLayout() {
  const { colors, isDark, spacing } = useTheme();
  const { width } = useWindowDimensions();
  const compact = width < 800;
  const sheetRef = useRef<QuickAddSheetRef>(null);

  const openQuickAdd = useCallback(() => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    sheetRef.current?.present();
  }, []);

  const onSaved = useCallback(() => {
    DeviceEventEmitter.emit(REFRESH_EVENT);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: !compact,
          tabBarActiveTintColor: colors.onSurface,
          tabBarInactiveTintColor: colors.onSurfaceTertiary,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: StyleSheet.hairlineWidth,
            height: Platform.OS === "ios" ? 84 : 64,
            paddingBottom: Platform.OS === "ios" ? 24 : 10,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Home",
            tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="spaces"
          options={{
            title: "Spaces",
            tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: "Calendar",
            tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="search"
          options={{
            title: "Search",
            tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>

      {/* Floating Quick Add FAB */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute", right: spacing.xl,
          bottom: Platform.OS === "ios" ? 100 : 80,
        }}
      >
        <Pressable
          testID="quick-add-fab"
          onPress={openQuickAdd}
          style={({ pressed }) => ({
            width: 56, height: 56, borderRadius: 28,
            backgroundColor: colors.brandPrimary,
            alignItems: "center", justifyContent: "center",
            transform: [{ scale: pressed ? 0.94 : 1 }],
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.6 : 0.15,
            shadowRadius: 12,
            elevation: 8,
          })}
        >
          <Ionicons name="add" size={28} color={colors.onBrandPrimary} />
        </Pressable>
      </View>

      <QuickAddSheet ref={sheetRef} onSaved={onSaved} />
    </View>
  );
}
import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  SafeAreaView,
} from "react-native-safe-area-context";
import {
  ActivityIndicator,
  View,
  Text,
} from "react-native";
import {
  useLocalSearchParams,
  useFocusEffect,
} from "expo-router";

import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";
import { CarDashboard } from "@/components/spaces/car";

export default function SpaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();

  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) {
      return;
    }

    try {
      const result = await api.getSpace(id);
      setSpace(result);
    } catch (error) {
      console.error("[SPACE] failed to load:", error);
    }
  }, [id]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);

      if (mounted) {
        await load();
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
        }}
        testID="space-detail-screen"
      >
        <ActivityIndicator
          color={colors.onSurfaceTertiary}
        />
      </SafeAreaView>
    );
  }

  if (!space) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
        testID="space-detail-screen"
      >
        <Text
          style={{
            color: colors.onSurface,
            fontSize: 16,
            fontWeight: "600",
          }}
        >
          Space could not be loaded.
        </Text>
      </SafeAreaView>
    );
  }

  /*
   * TEMPORARY:
   * Until the backend exposes a reliable `type` field,
   * we treat the current space as CAR.
   *
   * Later this becomes:
   *
   * if (space.type === "car") {
   *   return <CarDashboard space={space} />;
   * }
   */

  return (
    <SafeAreaView
      edges={["top"]}
      style={{
        flex: 1,
        backgroundColor: colors.surface,
      }}
      testID="space-detail-screen"
    >
      <CarDashboard space={space} />
    </SafeAreaView>
  );
}
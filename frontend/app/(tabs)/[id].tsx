import React, {
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  View,
  ActivityIndicator,
  DeviceEventEmitter,
  Alert,
} from "react-native";
import {
  useLocalSearchParams,
  useRouter,
  useFocusEffect,
} from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "@/lib/theme";
import { api } from "@/lib/api";
import CarDashboard from "@/components/spaces/car/CarDashboard";

import { mockCarData } from "@/components/spaces/car/car.mock";

export default function SpaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { colors } = useTheme();
  const router = useRouter();

  const [space, setSpace] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  /*
   * ==========================================================
   * LOAD SPACE
   * ==========================================================
   *
   * Important:
   *
   * Nu schimbăm API-ul existent.
   *
   * Continuăm să folosim:
   *
   *   api.getSpace(id)
   *
   * Exact ca înainte.
   */

  const load = useCallback(async () => {
    if (!id) return;

    try {
      const result = await api.getSpace(id);

      console.log("================================");
      console.log("[SPACE DATA]");
      console.log("ID:", id);
      console.log("RESULT:", result);
      console.log("TYPE:", result?.type);
      console.log("SLUG:", result?.slug);
      console.log("KIND:", result?.kind);
      console.log("NAME:", result?.name);
      console.log("ICON:", result?.icon);
      console.log("================================");

      setSpace(result);
    } catch (error) {
      console.error("[SPACE] failed to load:", error);
    }
  }, [id]);

  console.log("[SPACE DETAIL] space:", space);
  console.log("[SPACE DETAIL] space name:", space?.name);
  console.log("[SPACE DETAIL] space icon:", space?.icon);

  /*
   * ==========================================================
   * INITIAL LOAD + REFRESH EVENT
   * ==========================================================
   */

  useEffect(() => {
    let mounted = true;

    const initialLoad = async () => {
      if (!mounted) return;

      setLoading(true);

      await load();

      if (mounted) {
        setLoading(false);
      }
    };

    initialLoad();

    const sub = DeviceEventEmitter.addListener(
      "lifeos.refresh",
      () => {
        load();
      },
    );

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [load]);

  /*
   * ==========================================================
   * RELOAD WHEN SCREEN GETS FOCUS
   * ==========================================================
   */

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  /*
   * ==========================================================
   * DELETE SPACE
   * ==========================================================
   *
   * Momentan păstrăm comportamentul existent.
   *
   * Mai târziu putem muta această logică într-un menu
   * dedicat Space-ului.
   */

  const deleteSpace = useCallback(() => {
    if (!id) return;

    Alert.alert(
      "Delete space",
      `Are you sure you want to delete "${space?.name || "this space"}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteSpace(id);
              router.back();
            } catch (error: any) {
              Alert.alert(
                "Could not delete space",
                error?.message || "Something went wrong.",
              );
            }
          },
        },
      ],
    );
  }, [id, router, space]);

  /*
   * ==========================================================
   * ADD
   * ==========================================================
   *
   * Pentru moment doar pregătim arhitectura.
   *
   * NU facem încă request API.
   *
   * În pasul următor vom crea CarAddSheet.
   */

  const handleAdd = useCallback(() => {
    console.log("[CAR] Add pressed");
  }, []);

  /*
   * ==========================================================
   * EDIT
   * ==========================================================
   *
   * La fel, momentan doar placeholder.
   *
   * În pasul următor vom crea CarEditSheet.
   */

  const handleEdit = useCallback(() => {
    console.log("[CAR] Edit pressed");
  }, []);

  /*
   * ==========================================================
   * LOADING
   * ==========================================================
   */

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
        testID="space-detail-loading"
      >
        <ActivityIndicator
          color={colors.onSurfaceTertiary}
        />
      </SafeAreaView>
    );
  }

  /*
   * ==========================================================
   * SPACE NOT FOUND
   * ==========================================================
   */

  if (!space) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{
          flex: 1,
          backgroundColor: colors.surface,
        }}
        testID="space-detail-error"
      >
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons
            name="alert-circle-outline"
            size={32}
            color={colors.onSurfaceTertiary}
          />
        </View>
      </SafeAreaView>
    );
  }

  /*
   * ==========================================================
   * SPACE TYPE
   * ==========================================================
   *
   * Momentan tratăm CAR separat.
   *
   * IMPORTANT:
   *
   * Nu presupunem încă exact ce câmp folosește backend-ul
   * pentru tipul Space-ului.
   *
   * Pentru moment încercăm mai multe variante:
   *
   *   space.type
   *   space.slug
   *   space.kind
   *
   * și, pentru dezvoltare, verificăm și numele.
   */

  const spaceType = String(
    space.type ||
    space.slug ||
    space.kind ||
    "",
  ).toLowerCase();

  const isCar =
    spaceType === "car" ||
    spaceType === "vehicle" ||
    String(space.name || "").toLowerCase() === "car";

  /*
   * ==========================================================
   * CAR
   * ==========================================================
   */

  if (isCar) {
    return (
      <SafeAreaView
        edges={["top"]}
        style={{
          flex: 1,
          backgroundColor: colors.surface,
        }}
        testID="space-detail-screen"
      >
        <CarDashboard
          space={space}
          carData={mockCarData}
          onAdd={handleAdd}
          onEdit={handleEdit}
        />
      </SafeAreaView>
    );
  }

  /*
   * ==========================================================
   * DEFAULT SPACE
   * ==========================================================
   *
   * Până construim dashboard-urile pentru celelalte Space-uri,
   * păstrăm un fallback simplu.
   *
   * Nu pierdem funcționalitatea existentă.
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
      <View
        style={{
          flex: 1,
          paddingHorizontal: 24,
          paddingTop: 20,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Ionicons
            name={(space.icon || "folder-outline") as any}
            size={26}
            color={colors.onSurface}
          />

          <Ionicons
            name="ellipsis-horizontal"
            size={22}
            color={colors.onSurfaceTertiary}
          />
        </View>

        <View
          style={{
            marginTop: 28,
          }}
        >
          <Ionicons
            name={(space.icon || "folder-outline") as any}
            size={42}
            color={colors.onSurface}
          />

          <View
            style={{
              marginTop: 16,
            }}
          >
            {/* We intentionally keep this fallback minimal. */}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
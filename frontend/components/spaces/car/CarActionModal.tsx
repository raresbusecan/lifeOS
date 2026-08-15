import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
} from "@gorhom/bottom-sheet";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

export type CarActionType =
  | "fuel"
  | "maintenance"
  | "expense"
  | "document"
  | "mileage";

export type CarActionModalRef = {
  present: () => void;
  dismiss: () => void;
};

type CarActionModalProps = {
  onAction?: (action: CarActionType) => void;
};

type ActionItem = {
  type: CarActionType;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
};

const ACTIONS: ActionItem[] = [
  {
    type: "fuel",
    icon: "water-outline",
    title: "Fuel",
    subtitle: "Add a fuel entry",
  },
  {
    type: "maintenance",
    icon: "construct-outline",
    title: "Maintenance",
    subtitle: "Record service or repairs",
  },
  {
    type: "expense",
    icon: "card-outline",
    title: "Expense",
    subtitle: "Add a car-related expense",
  },
  {
    type: "document",
    icon: "document-text-outline",
    title: "Document",
    subtitle: "Add insurance, registration or document",
  },
  {
    type: "mileage",
    icon: "speedometer-outline",
    title: "Mileage",
    subtitle: "Update current mileage",
  },
];

export const CarActionModal = React.forwardRef<
  CarActionModalRef,
  CarActionModalProps
>(({ onAction }, ref) => {
  const { colors, spacing, radius } = useTheme();

  const sheetRef = useRef<BottomSheetModal>(null);

  const [selectedAction, setSelectedAction] =
    useState<CarActionType | null>(null);

  React.useImperativeHandle(ref, () => ({
    present: () => {
      setSelectedAction(null);
      sheetRef.current?.present();
    },

    dismiss: () => {
      sheetRef.current?.dismiss();
    },
  }));

  const handleAction = useCallback(
    (action: CarActionType) => {
      setSelectedAction(action);

      onAction?.(action);

      /*
       * Momentan doar selectăm acțiunea.
       *
       * Formularele reale vor fi adăugate ulterior:
       *
       * fuel
       * maintenance
       * expense
       * document
       * mileage
       */
    },
    [onAction],
  );

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
        pressBehavior="close"
      />
    ),
    [],
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={["72%"]}
      backdropComponent={renderBackdrop}
      enablePanDownToClose
      keyboardBehavior={
        Platform.OS === "ios" ? "extend" : "interactive"
      }
      keyboardBlurBehavior="restore"
      handleIndicatorStyle={{
        backgroundColor: colors.surfaceTertiary,
      }}
      backgroundStyle={{
        backgroundColor: colors.surface,
      }}
    >
      <BottomSheetView
        style={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.xl,
        }}
      >
        {/* Header */}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: spacing.xl,
          }}
        >
          <View style={{ gap: 3 }}>
            <Text
              style={{
                fontSize: 22,
                fontWeight: "800",
                color: colors.onSurface,
                letterSpacing: -0.3,
              }}
            >
              Add to Car
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: colors.onSurfaceTertiary,
              }}
            >
              Choose what you want to add
            </Text>
          </View>

          <Pressable
            onPress={() => sheetRef.current?.dismiss()}
            hitSlop={10}
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.pill,
              backgroundColor: colors.surfaceSecondary,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="close"
              size={20}
              color={colors.onSurfaceTertiary}
            />
          </Pressable>
        </View>

        {/* Actions */}

        <View style={{ gap: spacing.sm }}>
          {ACTIONS.map((action) => {
            const active = selectedAction === action.type;

            return (
              <Pressable
                key={action.type}
                testID={`car-action-${action.type}`}
                onPress={() => handleAction(action.type)}
                style={{
                  minHeight: 68,
                  borderRadius: radius.lg,
                  backgroundColor: active
                    ? colors.surfaceTertiary
                    : colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: active
                    ? colors.onSurfaceTertiary
                    : colors.border,
                  paddingHorizontal: spacing.lg,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: spacing.md,
                }}
              >
                {/* Icon */}

                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceTertiary,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name={action.icon}
                    size={20}
                    color={colors.onSurface}
                  />
                </View>

                {/* Text */}

                <View
                  style={{
                    flex: 1,
                    gap: 3,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "700",
                      color: colors.onSurface,
                    }}
                  >
                    {action.title}
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: colors.onSurfaceTertiary,
                    }}
                  >
                    {action.subtitle}
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.onSurfaceTertiary}
                />
              </Pressable>
            );
          })}
        </View>

        {/* Selected state */}

        {selectedAction && (
          <View
            style={{
              marginTop: spacing.lg,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceSecondary,
            }}
          >
            <Text
              style={{
                fontSize: 12,
                color: colors.onSurfaceTertiary,
                textAlign: "center",
              }}
            >
              {getSelectedMessage(selectedAction)}
            </Text>
          </View>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  );
});

CarActionModal.displayName = "CarActionModal";

function getSelectedMessage(action: CarActionType) {
  switch (action) {
    case "fuel":
      return "Fuel form will be added next.";

    case "maintenance":
      return "Maintenance form will be added next.";

    case "expense":
      return "Expense form will be added next.";

    case "document":
      return "Document form will be added next.";

    case "mileage":
      return "Mileage form will be added next.";

    default:
      return "";
  }
}
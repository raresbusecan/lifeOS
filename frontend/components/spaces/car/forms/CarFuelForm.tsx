import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

export type CarFuelEntry = {
  id: string;
  date: string;
  liters: number;
  price: number;
  odometer: number;
  station?: string;
};

type CarFuelFormProps = {
  onCancel: () => void;
  onSave: (entry: CarFuelEntry) => void;
};

export default function CarFuelForm({
  onCancel,
  onSave,
}: CarFuelFormProps) {
  const { colors, spacing, radius } = useTheme();

  const [liters, setLiters] = useState("");
  const [price, setPrice] = useState("");
  const [odometer, setOdometer] = useState("");
  const [station, setStation] = useState("");

  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");

    const litersValue = Number(liters.replace(",", "."));
    const priceValue = Number(price.replace(",", "."));
    const odometerValue = Number(odometer.replace(",", "."));

    if (!liters || !litersValue || litersValue <= 0) {
      setError("Please enter a valid number of liters.");
      return;
    }

    if (!price || !priceValue || priceValue <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (!odometer || !odometerValue || odometerValue <= 0) {
      setError("Please enter a valid odometer value.");
      return;
    }

    const entry: CarFuelEntry = {
      id: `fuel-${Date.now()}`,
      date: new Date().toISOString(),
      liters: litersValue,
      price: priceValue,
      odometer: odometerValue,
      station: station.trim() || undefined,
    };

    onSave(entry);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.xl,
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
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.sm,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: radius.md,
                  backgroundColor: colors.surfaceSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="water-outline"
                  size={19}
                  color={colors.onSurface}
                />
              </View>

              <Text
                style={{
                  fontSize: 22,
                  fontWeight: "800",
                  color: colors.onSurface,
                  letterSpacing: -0.3,
                }}
              >
                Add Fuel
              </Text>
            </View>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: colors.onSurfaceTertiary,
              }}
            >
              Record a fuel fill-up
            </Text>
          </View>

          <Pressable
            onPress={onCancel}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close fuel form"
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

        {/* Liters */}

        <FormField
          label="Liters"
          value={liters}
          onChangeText={setLiters}
          placeholder="e.g. 58"
          keyboardType="decimal-pad"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Price */}

        <FormField
          label="Price"
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 250"
          keyboardType="decimal-pad"
          suffix="RON"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Odometer */}

        <FormField
          label="Odometer"
          value={odometer}
          onChangeText={setOdometer}
          placeholder="e.g. 124580"
          keyboardType="number-pad"
          suffix="km"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Station */}

        <FormField
          label="Station"
          value={station}
          onChangeText={setStation}
          placeholder="e.g. OMV"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Error */}

        {error ? (
          <View
            style={{
              marginTop: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: colors.surfaceSecondary,
            }}
          >
            <Text
              style={{
                fontSize: 13,
                color: colors.onSurface,
              }}
            >
              {error}
            </Text>
          </View>
        ) : null}

        {/* Save */}

        <Pressable
          onPress={handleSave}
          accessibilityRole="button"
          accessibilityLabel="Save fuel"
          style={{
            marginTop: spacing.xl,
            minHeight: 52,
            borderRadius: radius.md,
            backgroundColor: colors.onSurface,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "800",
              color: colors.surface,
            }}
          >
            Save Fuel
          </Text>
        </Pressable>

        {/* Cancel */}

        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel fuel"
          style={{
            marginTop: spacing.sm,
            minHeight: 48,
            borderRadius: radius.md,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "700",
              color: colors.onSurface,
            }}
          >
            Cancel
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

type FormFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType?: "default" | "decimal-pad" | "number-pad";
  suffix?: string;
  colors: any;
  spacing: any;
  radius: any;
};

function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  suffix,
  colors,
  spacing,
  radius,
}: FormFieldProps) {
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text
        style={{
          marginBottom: spacing.sm,
          fontSize: 12,
          fontWeight: "700",
          color: colors.onSurfaceTertiary,
        }}
      >
        {label}
      </Text>

      <View
        style={{
          minHeight: 52,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: spacing.md,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.onSurfaceTertiary}
          keyboardType={keyboardType}
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.onSurface,
            paddingVertical: 0,
          }}
        />

        {suffix ? (
          <Text
            style={{
              marginLeft: spacing.sm,
              fontSize: 12,
              fontWeight: "700",
              color: colors.onSurfaceTertiary,
            }}
          >
            {suffix}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
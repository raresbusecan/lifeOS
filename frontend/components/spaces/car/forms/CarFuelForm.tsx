import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

import type { CarFuelEntry, CarVehicle } from "@/lib/spaces/car/car.types";

type CarFuelFormProps = {
  vehicle: CarVehicle;
  fuelEntries: CarFuelEntry[];
  onCancel: () => void;
  onSave: (entry: CarFuelEntry) => void;
};

export default function CarFuelForm({
  vehicle,
  fuelEntries,
  onCancel,
  onSave,
}: CarFuelFormProps) {
  const { colors, spacing, radius } = useTheme();

  const [liters, setLiters] = useState("");
  const [price, setPrice] = useState("");
  const [odometer, setOdometer] = useState("");
  const [station, setStation] = useState("");

  const [focusedField, setFocusedField] = useState<string | null>(null);


  const [levelBefore, setLevelBefore] = useState<number | null>(null);
  const [levelAfter, setLevelAfter] = useState<number | null>(null);

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

    if (levelBefore === null || levelAfter === null) {
      Alert.alert(
        "Missing tank level",
        "Please select both tank levels before saving.",
      );
      return;
    }

    const entry: CarFuelEntry = {
      id: `fuel-${Date.now()}`,
      date: new Date().toISOString(),
      liters: litersValue,
      total_paid: priceValue,
      odometer: odometerValue,
      station: station.trim() || undefined,
      level_before: levelBefore,
      level_after: levelAfter,
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


        <View>
          <Text
            style={{
              marginBottom: spacing.sm,
              fontSize: 12,
              fontWeight: "700",
              color: colors.onSurfaceTertiary,
            }}
          >
            Tank level before
          </Text>
          <Slider
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={levelBefore ?? 0}
            onValueChange={setLevelBefore}
            minimumTrackTintColor={colors.onSurface}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.onSurface}
          />

          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.onSurface,
            }}
          >
            {levelBefore ?? 0}%
          </Text>
        </View>

        <View>
          <Text
            style={{
              marginBottom: spacing.sm,
              fontSize: 12,
              fontWeight: "700",
              color: colors.onSurfaceTertiary,
            }}
          >
            Tank level after
          </Text>
          <Slider
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={levelAfter ?? 0}
            onValueChange={setLevelAfter}
            minimumTrackTintColor={colors.onSurface}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.onSurface}
          />

          <Text
            style={{
              fontSize: 15,
              fontWeight: "700",
              color: colors.onSurface,
            }}
          >
            {levelAfter ?? 0}%
          </Text>
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
          fieldName="liters"
          focusedField={focusedField}
          onFocus={setFocusedField}
          onBlur={() => setFocusedField(null)}
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
          fieldName="price"
          focusedField={focusedField}
          onFocus={setFocusedField}
          onBlur={() => setFocusedField(null)}
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
          fieldName="odometer"
          focusedField={focusedField}
          onFocus={setFocusedField}
          onBlur={() => setFocusedField(null)}
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
          fieldName="station"
          focusedField={focusedField}
          onFocus={setFocusedField}
          onBlur={() => setFocusedField(null)}
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
  fieldName: string;
  focusedField: string | null;
  onFocus: (field: string) => void;
  onBlur: () => void;
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
  fieldName,
  focusedField,
  onFocus,
  onBlur,
}: FormFieldProps) {
  const isFocused = focusedField === fieldName;

  return (
    <View style={{ marginBottom: spacing.xl }}>
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
          borderWidth: isFocused ? 2 : 1,
          borderColor: isFocused
            ? colors.onSurface
            : colors.border,
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
          onFocus={() => onFocus(fieldName)}
          onBlur={onBlur}
          style={{
            flex: 1,
            fontSize: 15,
            color: colors.onSurface,
            paddingVertical: 0,
            borderWidth: 0,
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
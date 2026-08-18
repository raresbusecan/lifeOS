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

import type { CarMaintenanceEntry } from "../car.types";

type CarMaintenanceFormProps = {
  onCancel: () => void;
  onSave: (entry: CarMaintenanceEntry) => void;
};

export default function CarMaintenanceForm({
  onCancel,
  onSave,
}: CarMaintenanceFormProps) {
  const { colors, spacing, radius } = useTheme();

  const [service, setService] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [odometer, setOdometer] = useState("");
  const [provider, setProvider] = useState("");
  const [nextServiceOdometer, setNextServiceOdometer] =
    useState("");

  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");

    const priceValue = Number(price.replace(",", "."));
    const odometerValue = Number(
      odometer.replace(",", "."),
    );

    const nextServiceValue = nextServiceOdometer
      ? Number(nextServiceOdometer.replace(",", "."))
      : undefined;

    if (!service.trim()) {
      setError("Please enter the service type.");
      return;
    }

    if (!description.trim()) {
      setError("Please enter a description.");
      return;
    }

    if (!price || !priceValue || priceValue <= 0) {
      setError("Please enter a valid price.");
      return;
    }

    if (
      !odometer ||
      !odometerValue ||
      odometerValue <= 0
    ) {
      setError("Please enter a valid odometer value.");
      return;
    }

    if (
      nextServiceOdometer &&
      (!nextServiceValue || nextServiceValue <= 0)
    ) {
      setError(
        "Please enter a valid next service odometer value.",
      );
      return;
    }

    if (
      nextServiceValue !== undefined &&
      nextServiceValue <= odometerValue
    ) {
      setError(
        "Next service mileage must be greater than the current odometer.",
      );
      return;
    }

    const entry: CarMaintenanceEntry = {
      id: `maintenance-${Date.now()}`,
      date: new Date().toISOString(),
      service: service.trim(),
      description: description.trim(),
      price: priceValue,
      odometer: odometerValue,
      provider: provider.trim() || undefined,
      nextServiceOdometer: nextServiceValue,
    };

    onSave(entry);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === "ios" ? "padding" : undefined
      }
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
                  backgroundColor:
                    colors.surfaceSecondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name="construct-outline"
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
                Add Maintenance
              </Text>
            </View>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: colors.onSurfaceTertiary,
              }}
            >
              Record a service or repair
            </Text>
          </View>

          <Pressable
            onPress={onCancel}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close maintenance form"
            style={{
              width: 36,
              height: 36,
              borderRadius: radius.pill,
              backgroundColor:
                colors.surfaceSecondary,
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

        {/* Service */}

        <FormField
          label="Service"
          value={service}
          onChangeText={setService}
          placeholder="e.g. Oil change"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Description */}

        <FormField
          label="Description"
          value={description}
          onChangeText={setDescription}
          placeholder="e.g. Engine oil and oil filter replaced"
          colors={colors}
          spacing={spacing}
          radius={radius}
          multiline
        />

        {/* Price */}

        <FormField
          label="Price"
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 380"
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
          placeholder="e.g. 123580"
          keyboardType="number-pad"
          suffix="km"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Provider */}

        <FormField
          label="Provider"
          value={provider}
          onChangeText={setProvider}
          placeholder="e.g. BMW Service"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Next Service */}

        <FormField
          label="Next Service"
          value={nextServiceOdometer}
          onChangeText={setNextServiceOdometer}
          placeholder="e.g. 133580"
          keyboardType="number-pad"
          suffix="km"
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
              backgroundColor:
                colors.surfaceSecondary,
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
          accessibilityLabel="Save maintenance"
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
            Save Maintenance
          </Text>
        </Pressable>

        {/* Cancel */}

        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel maintenance"
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
  multiline?: boolean;
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
  multiline = false,
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
          minHeight: multiline ? 90 : 52,
          borderRadius: radius.md,
          backgroundColor:
            colors.surfaceSecondary,
          borderWidth: 1,
          borderColor: colors.border,
          flexDirection: "row",
          alignItems: multiline
            ? "flex-start"
            : "center",
          paddingHorizontal: spacing.md,
          paddingVertical: multiline
            ? spacing.md
            : 0,
        }}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            colors.onSurfaceTertiary
          }
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={
            multiline ? "top" : "center"
          }
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
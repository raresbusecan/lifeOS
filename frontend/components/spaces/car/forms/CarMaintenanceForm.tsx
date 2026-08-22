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

import type { CarMaintenanceEntry } from "@/lib/spaces/car/car.types";
import { validateMaintenanceEntry } from "@/lib/spaces/car/validation/maintenance.validation";

type CarMaintenanceFormProps = {
  onCancel: () => void;
  onSave: (entry: CarMaintenanceEntry) => void;
  /** Pass an existing entry to edit it instead of creating a new one. */
  entry?: CarMaintenanceEntry;
};

const MAINTENANCE_TYPES = [
  "Oil Change",
  "Filters",
  "Brakes",
  "Tires",
  "Battery",
  "Fluids",
  "Service",
  "Repair",
];

export default function CarMaintenanceForm({
  onCancel,
  onSave,
  entry,
}: CarMaintenanceFormProps) {
  const isEditing = entry !== undefined;

  const { colors, spacing, radius } = useTheme();

  const [service, setService] = useState(entry?.service ?? "");
  const [description, setDescription] = useState(
    entry?.description ?? "",
  );
  const [price, setPrice] = useState(
    entry ? String(entry.price) : "",
  );
  const [odometer, setOdometer] = useState(
    entry ? String(entry.odometer) : "",
  );
  const [provider, setProvider] = useState(entry?.provider ?? "");
  const [nextServiceOdometer, setNextServiceOdometer] = useState(
    entry?.nextServiceOdometer
      ? String(entry.nextServiceOdometer)
      : "",
  );

  const [focusedField, setFocusedField] = useState<string | null>(null);

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

    const draftEntry: Omit<CarMaintenanceEntry, "id" | "date"> = {
      service: service.trim(),
      description: description.trim(),
      price: priceValue,
      odometer: odometerValue,
      provider: provider.trim() || undefined,
      nextServiceOdometer: nextServiceValue,
    };

    const result = validateMaintenanceEntry(draftEntry);

    if (!result.valid) {
      setError(result.error ?? "Please check the entered values.");
      return;
    }

    const entryToSave: CarMaintenanceEntry = {
      id: entry?.id ?? `maintenance-${Date.now()}`,
      date: entry?.date ?? new Date().toISOString(),
      ...draftEntry,
    };

    onSave(entryToSave);
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
                {isEditing ? "Edit Maintenance" : "Add Maintenance"}
              </Text>
            </View>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: colors.onSurfaceTertiary,
              }}
            >
              {isEditing
                ? "Update this service or repair"
                : "Record a service or repair"}
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

        {/* Quick Select */}

        <Text
          style={{
            marginBottom: spacing.sm,
            fontSize: 12,
            fontWeight: "700",
            color: colors.onSurfaceTertiary,
          }}
        >
          Quick Select
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          {MAINTENANCE_TYPES.map((type) => {
            const selected = service === type;

            return (
              <Pressable
                key={type}
                onPress={() => setService(type)}
                style={{
                  paddingHorizontal: spacing.md,
                  minHeight: 40,
                  borderRadius: radius.pill,
                  backgroundColor: selected
                    ? colors.onSurface
                    : colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: selected
                    ? colors.onSurface
                    : colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: selected
                      ? colors.surface
                      : colors.onSurface,
                  }}
                >
                  {type}
                </Text>
              </Pressable>
            );
          })}
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
          fieldName="service"
          focusedField={focusedField}
          onFocus={setFocusedField}
          onBlur={() => setFocusedField(null)}
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
          fieldName="description"
          focusedField={focusedField}
          onFocus={setFocusedField}
          onBlur={() => setFocusedField(null)}
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
          placeholder="e.g. 123580"
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

        {/* Provider */}

        <FormField
          label="Provider"
          value={provider}
          onChangeText={setProvider}
          placeholder="e.g. BMW Service"
          colors={colors}
          spacing={spacing}
          radius={radius}
          fieldName="provider"
          focusedField={focusedField}
          onFocus={setFocusedField}
          onBlur={() => setFocusedField(null)}
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
          fieldName="nextService"
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
            {isEditing ? "Save Changes" : "Save Maintenance"}
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
  multiline = false,
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
          minHeight: multiline ? 90 : 52,
          borderRadius: radius.md,
          backgroundColor:
            colors.surfaceSecondary,
          borderWidth: isFocused ? 2 : 1,
          borderColor: isFocused
            ? colors.onSurface
            : colors.border,
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
          onFocus={() => onFocus(fieldName)}
          onBlur={onBlur}
          style={[{
            flex: 1,
            fontSize: 15,
            color: colors.onSurface,
            paddingVertical: 0,
            borderWidth: 0,
          }, Platform.OS === "web" && { outlineStyle: "none" } as any]}
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
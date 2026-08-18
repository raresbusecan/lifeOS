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

export type CarDocumentEntry = {
  id: string;
  date: string;
  documentType: string;
  title: string;
  issuer?: string;
  issueDate?: string;
  expiryDate?: string;
  price?: number;
  notes?: string;
};

type CarDocumentFormProps = {
  onCancel: () => void;
  onSave: (entry: CarDocumentEntry) => void;
};

const DOCUMENT_TYPES = [
  "RCA",
  "ITP",
  "CASCO",
  "Insurance",
  "Registration",
  "Service book",
  "Other",
];

export default function CarDocumentForm({
  onCancel,
  onSave,
}: CarDocumentFormProps) {
  const { colors, spacing, radius } = useTheme();

  const [documentType, setDocumentType] = useState("");
  const [title, setTitle] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [price, setPrice] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");

  const handleSave = () => {
    setError("");

    const priceValue = price
      ? Number(price.replace(",", "."))
      : undefined;

    if (!documentType.trim()) {
      setError("Please select a document type.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter a document title.");
      return;
    }

    if (
      price &&
      (priceValue === undefined ||
        Number.isNaN(priceValue) ||
        priceValue < 0)
    ) {
      setError("Please enter a valid price.");
      return;
    }

    if (issueDate && !isValidDate(issueDate)) {
      setError(
        "Issue date must use the format DD.MM.YYYY.",
      );
      return;
    }

    if (expiryDate && !isValidDate(expiryDate)) {
      setError(
        "Expiry date must use the format DD.MM.YYYY.",
      );
      return;
    }

    if (
      issueDate &&
      expiryDate &&
      parseDate(expiryDate) < parseDate(issueDate)
    ) {
      setError(
        "Expiry date cannot be before the issue date.",
      );
      return;
    }

    const entry: CarDocumentEntry = {
      id: `document-${Date.now()}`,
      date: new Date().toISOString(),
      documentType: documentType.trim(),
      title: title.trim(),
      issuer: issuer.trim() || undefined,
      issueDate: issueDate.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
      price: priceValue,
      notes: notes.trim() || undefined,
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
                  name="document-text-outline"
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
                Add Document
              </Text>
            </View>

            <Text
              style={{
                marginTop: 6,
                fontSize: 13,
                color: colors.onSurfaceTertiary,
              }}
            >
              Record a vehicle document
            </Text>
          </View>

          <Pressable
            onPress={onCancel}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close document form"
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

        {/* Document Type */}

        <Text
          style={{
            marginBottom: spacing.sm,
            fontSize: 12,
            fontWeight: "700",
            color: colors.onSurfaceTertiary,
          }}
        >
          Document Type
        </Text>

        <View
          style={{
            flexDirection: "row",
            flexWrap: "wrap",
            gap: spacing.sm,
            marginBottom: spacing.lg,
          }}
        >
          {DOCUMENT_TYPES.map((type) => {
            const selected = documentType === type;

            return (
              <Pressable
                key={type}
                onPress={() => setDocumentType(type)}
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

        {/* Title */}

        <FormField
          label="Title"
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. RCA 2026"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Issuer */}

        <FormField
          label="Issuer"
          value={issuer}
          onChangeText={setIssuer}
          placeholder="e.g. Allianz"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Issue Date */}

        <FormField
          label="Issue Date"
          value={issueDate}
          onChangeText={setIssueDate}
          placeholder="DD.MM.YYYY"
          keyboardType="default"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Expiry Date */}

        <FormField
          label="Expiry Date"
          value={expiryDate}
          onChangeText={setExpiryDate}
          placeholder="DD.MM.YYYY"
          keyboardType="default"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Price */}

        <FormField
          label="Price"
          value={price}
          onChangeText={setPrice}
          placeholder="e.g. 650"
          keyboardType="decimal-pad"
          suffix="RON"
          colors={colors}
          spacing={spacing}
          radius={radius}
        />

        {/* Notes */}

        <FormField
          label="Notes"
          value={notes}
          onChangeText={setNotes}
          placeholder="Optional notes"
          colors={colors}
          spacing={spacing}
          radius={radius}
          multiline
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
          accessibilityLabel="Save document"
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
            Save Document
          </Text>
        </Pressable>

        {/* Cancel */}

        <Pressable
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel document"
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
  keyboardType?: "default" | "decimal-pad";
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

function isValidDate(value: string) {
  const match = value.match(
    /^(\d{2})\.(\d{2})\.(\d{4})$/,
  );

  if (!match) {
    return false;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function parseDate(value: string) {
  const [day, month, year] = value
    .split(".")
    .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  ).getTime();
}
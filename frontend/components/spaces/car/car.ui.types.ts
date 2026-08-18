import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type CarIcon = ComponentProps<typeof Ionicons>["name"];

export type CarNextItem = {
  id: string | number;
  icon: CarIcon;
  title: string;
  subtitle: string;
  right?: string;
};

export type CarQuickActionKey =
  | "fuel"
  | "maintenance"
  | "document"
  | "expense";

export type CarQuickAction = {
  key: CarQuickActionKey;
  icon: CarIcon;
  label: string;
};
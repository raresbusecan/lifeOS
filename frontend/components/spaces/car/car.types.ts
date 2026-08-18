import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type CarIcon = ComponentProps<typeof Ionicons>["name"];

export type CarVehicle = {
  make: string;
  model: string;
  year: number;
  registration_number?: string;
  mileage: number;
  fuel_type?: string;
  engine?: string;
};

export type CarNextItem = {
  id: string | number;
  icon: CarIcon;
  title: string;
  subtitle: string;
  right?: string;
};

export type CarRecentItem = {
  id: string | number;
  icon: CarIcon;
  title: string;
  subtitle: string;
  amount?: number | string;
  currency?: string;
};

export type CarFuelEntry = {
  id: string;
  date: string;
  liters: number;
  price: number;
  odometer: number;
  station?: string;
};

export type CarMaintenanceEntry = {
  id: string;
  date: string;
  service: string;
  description: string;
  price: number;
  odometer: number;
  provider?: string;
  nextServiceOdometer?: number;
};

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

export type CarExpenseEntry = {
  id: string;
  date: string;
  category: string;
  title: string;
  amount: number;
  odometer?: number;
  provider?: string;
  notes?: string;
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
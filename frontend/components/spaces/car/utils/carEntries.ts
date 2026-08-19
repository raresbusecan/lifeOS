import type { CarRecentItem } from "./carEntries.types";

import type {
  CarDocumentEntry,
  CarExpenseEntry,
  CarFuelEntry,
  CarMaintenanceEntry,
} from "@/lib/spaces/car/car.types";

import {
  formatDate,
  formatNumber,
} from "./carFormatters";

type CarRecentEntries = {
  fuelEntries: CarFuelEntry[];
  maintenanceEntries: CarMaintenanceEntry[];
  documentEntries: CarDocumentEntry[];
  expenseEntries: CarExpenseEntry[];
};


export const buildCarRecentItems = ({
  fuelEntries,
  maintenanceEntries,
  documentEntries,
  expenseEntries,
}: CarRecentEntries): CarRecentItem[] => {
  return [
    ...fuelEntries.map((entry) => ({
      id: entry.id,
      icon: "water-outline" as const,
      title: "Fuel",
      subtitle: `${formatDate(entry.date)} · ${formatNumber(
        entry.odometer,
      )} km`,
      amount: `${formatNumber(entry.price)} RON`,
    })),

    ...maintenanceEntries.map((entry) => ({
      id: entry.id,
      icon: "construct-outline" as const,
      title: entry.service,
      subtitle: `${formatDate(entry.date)} · ${formatNumber(
        entry.odometer,
      )} km`,
      amount: `${formatNumber(entry.price)} RON`,
    })),

    ...documentEntries.map((entry) => ({
      id: entry.id,
      icon: "document-text-outline" as const,
      title: entry.title,
      subtitle: `${entry.documentType}${
        entry.expiryDate
          ? ` · Expires ${entry.expiryDate}`
          : ""
      }`,
      amount:
        entry.price !== undefined
          ? `${formatNumber(entry.price)} RON`
          : undefined,
    })),

    ...expenseEntries.map((entry) => ({
      id: entry.id,
      icon: "receipt-outline" as const,
      title: entry.title,
      subtitle: `${entry.category}${
        entry.odometer
          ? ` · ${formatNumber(entry.odometer)} km`
          : ""
      }`,
      amount: `${formatNumber(entry.amount)} RON`,
    })),
  ];
};
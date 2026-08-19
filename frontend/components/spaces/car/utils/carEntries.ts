import type { CarRecentItem } from "./carEntries.types";

import {
  formatCarDate,
  formatCarNumber,
} from "./carFormatters";

import type {
  CarDocumentEntry,
  CarExpenseEntry,
  CarFuelEntry,
  CarMaintenanceEntry,
} from "@/lib/spaces/car/car.types";

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
      subtitle: `${formatCarDate(entry.date)} · ${formatCarNumber(
        entry.odometer,
      )} km`,
      amount: `${formatCarNumber(entry.price)} RON`,
    })),

    ...maintenanceEntries.map((entry) => ({
      id: entry.id,
      icon: "construct-outline" as const,
      title: entry.service,
      subtitle: `${formatCarDate(entry.date)} · ${formatCarNumber(
        entry.odometer,
      )} km`,
      amount: `${formatCarNumber(entry.price)} RON`,
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
          ? `${formatCarNumber(entry.price)} RON`
          : undefined,
    })),

    ...expenseEntries.map((entry) => ({
      id: entry.id,
      icon: "receipt-outline" as const,
      title: entry.title,
      subtitle: `${entry.category}${
        entry.odometer
          ? ` · ${formatCarNumber(entry.odometer)} km`
          : ""
      }`,
      amount: `${formatCarNumber(entry.amount)} RON`,
    })),
  ];
};
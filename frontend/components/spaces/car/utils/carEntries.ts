import type {
  CarDocumentEntry,
  CarExpenseEntry,
  CarFuelEntry,
  CarMaintenanceEntry,
  CarRecentItem,
} from "../car.types";

type CarRecentEntries = {
  fuelEntries: CarFuelEntry[];
  maintenanceEntries: CarMaintenanceEntry[];
  documentEntries: CarDocumentEntry[];
  expenseEntries: CarExpenseEntry[];
};

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US").format(value);

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const buildCarRecentItems = ({
  fuelEntries,
  maintenanceEntries,
  documentEntries,
  expenseEntries,
}: CarRecentEntries): CarRecentItem[] => {
  return [
    {
      id: "fuel-1",
      icon: "water-outline",
      title: "Fuel",
      subtitle: "Today · 58 L",
      amount: "250 RON",
    },
    {
      id: "maintenance-1",
      icon: "construct-outline",
      title: "Oil change",
      subtitle: "Aug 8 · 123,380 km",
      amount: "380 RON",
    },

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
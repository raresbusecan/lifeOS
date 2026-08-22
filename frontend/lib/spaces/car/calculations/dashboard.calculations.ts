import type { CarData } from "@/components/spaces/car/car.data.types";
import type { CarNextItem } from "@/components/spaces/car/car.ui.types";
import type {
  CarDocumentEntry,
  CarMaintenanceEntry,
} from "../car.types";
import { getSortedFuelEntries } from "./../utils/fuel.utils";
import {
  calculateDistance,
  calculateEstimatedLitersConsumed,
} from "./fuel.calculations";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const DOC_ALERT_DAYS = 45;
const MAINT_ALERT_KM = 2000;

export function getCurrentOdometer(carData: CarData): number {
  let maxOdometer = carData.vehicle.mileage || 0;

  carData.fuelEntries.forEach((entry) => {
    if (entry.odometer !== undefined && entry.odometer > maxOdometer) {
      maxOdometer = entry.odometer;
    }
  });

  carData.maintenanceEntries.forEach((entry) => {
    if (entry.odometer > maxOdometer) {
      maxOdometer = entry.odometer;
    }
  });

  carData.expenseEntries.forEach((entry) => {
    if (entry.odometer && entry.odometer > maxOdometer) {
      maxOdometer = entry.odometer;
    }
  });

  return maxOdometer;
}

export function getThisMonthExpenses(carData: CarData): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const isCurrentMonth = (dateString: string) => {
    const d = new Date(dateString);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  };

  let total = 0;

  carData.fuelEntries.forEach((entry) => {
    if (isCurrentMonth(entry.date)) {
      total += entry.total_paid ?? 0;
    }
  });

  carData.maintenanceEntries.forEach((entry) => {
    if (isCurrentMonth(entry.date)) {
      total += entry.price;
    }
  });

  carData.documentEntries.forEach((entry) => {
    if (entry.price && isCurrentMonth(entry.date)) {
      total += entry.price;
    }
  });

  carData.expenseEntries.forEach((entry) => {
    if (isCurrentMonth(entry.date)) {
      total += entry.amount;
    }
  });

  return total;
}

/**
 * Average fuel consumption across all recorded fuel entries, as a
 * single L/100km number.
 *
 * We DON'T average the individual per-entry consumption values —
 * that would weight a 50km trip the same as a 2000km trip. Instead
 * we sum total liters consumed and total distance covered across all
 * valid consecutive entry pairs, then compute one overall rate
 * (totalLiters / totalDistance × 100). This matches real-world fuel
 * economy better.
 *
 * Returns null when there isn't enough data yet (fewer than 2 fuel
 * entries, no tank capacity set, or no valid consecutive pair —
 * e.g. only partial fills where the tank level went the wrong way).
 */
export function getAverageFuelConsumption(
  carData: CarData,
): number | null {
  const tankCapacity = carData.vehicle.tank_capacity_liters ?? 0;

  if (tankCapacity <= 0) {
    return null;
  }

  const sortedEntries = getSortedFuelEntries(carData.fuelEntries);

  if (sortedEntries.length < 2) {
    return null;
  }

  let totalDistance = 0;
  let totalLiters = 0;

  for (let i = 1; i < sortedEntries.length; i++) {
    const previousEntry = sortedEntries[i - 1];
    const currentEntry = sortedEntries[i];

    const distance = calculateDistance(previousEntry, currentEntry);
    const litersConsumed = calculateEstimatedLitersConsumed(
      previousEntry,
      currentEntry,
      tankCapacity,
    );

    if (distance === null || litersConsumed === null) {
      continue;
    }

    totalDistance += distance;
    totalLiters += litersConsumed;
  }

  if (totalDistance <= 0 || totalLiters <= 0) {
    return null;
  }

  return Number(((totalLiters / totalDistance) * 100).toFixed(2));
}

function parseDateString(dateStr: string): Date | null {
  // Matches DD.MM.YYYY
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return new Date(year, month - 1, day);
}

/* ============================================================
   DOCUMENT STATUS
   ============================================================ */

export type DocumentStatus =
  | "valid"
  | "expiring_soon"
  | "expired"
  | "no_expiry";

export type DocumentStatusResult = {
  status: DocumentStatus;
  daysUntilExpiry: number | null;
};

export function getDocumentStatus(
  entry: CarDocumentEntry,
  referenceDate: Date = new Date(),
): DocumentStatusResult {
  if (!entry.expiryDate) {
    return { status: "no_expiry", daysUntilExpiry: null };
  }

  const expiry = parseDateString(entry.expiryDate);

  if (!expiry) {
    return { status: "no_expiry", daysUntilExpiry: null };
  }

  const daysUntilExpiry = Math.ceil(
    (expiry.getTime() - referenceDate.getTime()) / MS_PER_DAY,
  );

  if (daysUntilExpiry < 0) {
    return { status: "expired", daysUntilExpiry };
  }

  if (daysUntilExpiry <= DOC_ALERT_DAYS) {
    return { status: "expiring_soon", daysUntilExpiry };
  }

  return { status: "valid", daysUntilExpiry };
}

export type CarDocumentEntryWithStatus = CarDocumentEntry &
  DocumentStatusResult;

export function getDocumentEntriesWithStatus(
  carData: CarData,
  referenceDate: Date = new Date(),
): CarDocumentEntryWithStatus[] {
  return carData.documentEntries.map((entry) => ({
    ...entry,
    ...getDocumentStatus(entry, referenceDate),
  }));
}

/* ============================================================
   MAINTENANCE STATUS
   ============================================================ */

export type MaintenanceStatus =
  | "ok"
  | "due_soon"
  | "overdue"
  | "not_scheduled";

export type MaintenanceStatusResult = {
  status: MaintenanceStatus;
  remainingKm: number | null;
};

export function getMaintenanceStatus(
  entry: CarMaintenanceEntry,
  currentOdometer: number,
): MaintenanceStatusResult {
  if (!entry.nextServiceOdometer) {
    return { status: "not_scheduled", remainingKm: null };
  }

  const remainingKm = entry.nextServiceOdometer - currentOdometer;

  if (remainingKm < 0) {
    return { status: "overdue", remainingKm };
  }

  if (remainingKm <= MAINT_ALERT_KM) {
    return { status: "due_soon", remainingKm };
  }

  return { status: "ok", remainingKm };
}

export type CarMaintenanceEntryWithStatus = CarMaintenanceEntry &
  MaintenanceStatusResult;

export function getMaintenanceEntriesWithStatus(
  carData: CarData,
  currentOdometer: number,
): CarMaintenanceEntryWithStatus[] {
  return carData.maintenanceEntries.map((entry) => ({
    ...entry,
    ...getMaintenanceStatus(entry, currentOdometer),
  }));
}

export function getUpcomingItems(
  carData: CarData,
  currentOdometer: number,
  limit?: number,
): CarNextItem[] {
  const items: Array<CarNextItem & { urgency: number }> = [];

  // 1. Documents expiring soon
  const documentsWithStatus = getDocumentEntriesWithStatus(carData);

  documentsWithStatus.forEach((entry) => {
    if (entry.status !== "expiring_soon" || entry.daysUntilExpiry === null) {
      return;
    }

    const expiry = parseDateString(entry.expiryDate!);
    if (!expiry) return;

    items.push({
      id: `doc-${entry.id}`,
      icon: "document-text-outline",
      title: entry.title,
      subtitle: `Expires in ${entry.daysUntilExpiry} day${entry.daysUntilExpiry !== 1 ? 's' : ''}`,
      right: `${expiry.getDate()} ${expiry.toLocaleString('default', { month: 'short' })}`,
      urgency: entry.daysUntilExpiry, // Lower is more urgent
    });
  });

  // 2. Maintenance due soon or overdue
  const maintenanceWithStatus = getMaintenanceEntriesWithStatus(
    carData,
    currentOdometer,
  );

  maintenanceWithStatus.forEach((entry) => {
    if (
      (entry.status !== "due_soon" && entry.status !== "overdue") ||
      entry.remainingKm === null
    ) {
      return;
    }

    // Skip maintenance overdue by a lot — it's likely stale/irrelevant.
    if (entry.remainingKm < -5000) {
      return;
    }

    // Heuristic so it's comparable to "days" urgency for documents (~30km/day).
    const equivalentDays = entry.remainingKm / 30;

    const subtitle =
      entry.remainingKm < 0
        ? `Overdue by ${Math.abs(entry.remainingKm).toLocaleString()} km`
        : `Due in ${entry.remainingKm.toLocaleString()} km`;

    items.push({
      id: `maint-${entry.id}`,
      icon: "construct-outline",
      title: entry.service,
      subtitle,
      right: "Soon",
      urgency: equivalentDays,
    });
  });

  // Sort by urgency (ascending). No limit unless the caller asks for one
  // — the dashboard's "NEXT" preview passes limit=3, a full alerts/
  // history view can call this with no limit to get everything.
  items.sort((a, b) => a.urgency - b.urgency);

  const limited =
    limit !== undefined ? items.slice(0, limit) : items;

  return limited.map(({ urgency, ...item }) => item);
}
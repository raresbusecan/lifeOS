import type { CarFuelEntry } from "../car.types";

export type FuelValidationResult = {
  valid: boolean;
  error?: string;
};

export function validateFuelEntry(
  entry: Omit<CarFuelEntry, "id" | "date">,
  previousEntry: CarFuelEntry | null,
): FuelValidationResult {
  if (entry.odometer <= 0) {
    return {
      valid: false,
      error: "Please enter a valid odometer value.",
    };
  }

  if (previousEntry && entry.odometer < previousEntry.odometer) {
    return {
      valid: false,
      error: `Odometer cannot be lower than the previous value (${previousEntry.odometer} km).`,
    };
  }

  if (entry.level_before < 0 || entry.level_before > 100) {
    return {
      valid: false,
      error: "Tank level before must be between 0% and 100%.",
    };
  }

  if (entry.level_after < 0 || entry.level_after > 100) {
    return {
      valid: false,
      error: "Tank level after must be between 0% and 100%.",
    };
  }

  if (entry.level_after < entry.level_before) {
    return {
      valid: false,
      error:
        "Tank level after refueling cannot be lower than the level before refueling.",
    };
  }

  if (
    previousEntry &&
    entry.level_before > previousEntry.level_after
  ) {
    return {
      valid: false,
      error:
        "Tank level before refueling cannot be higher than the previous recorded level after refueling.",
    };
  }

  if (entry.liters <= 0) {
    return {
      valid: false,
      error: "Please enter a valid number of liters.",
    };
  }

  if (entry.total_paid <= 0) {
    return {
      valid: false,
      error: "Please enter a valid total amount paid.",
    };
  }

  return { valid: true };
}
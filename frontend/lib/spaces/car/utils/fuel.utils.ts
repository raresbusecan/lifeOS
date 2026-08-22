import type { CarFuelEntry } from "../car.types";

export function getSortedFuelEntries(
  fuelEntries: CarFuelEntry[],
): CarFuelEntry[] {
  return [...fuelEntries].sort(
    (a, b) =>
      new Date(a.date).getTime() -
      new Date(b.date).getTime(),
  );
}

export function getPreviousFuelEntry(
  fuelEntries: CarFuelEntry[],
  currentDate: string,
): CarFuelEntry | null {
  const previousEntries = fuelEntries
    .filter(
      (entry) =>
        new Date(entry.date).getTime() <
        new Date(currentDate).getTime(),
    )
    .sort(
      (a, b) =>
        new Date(b.date).getTime() -
        new Date(a.date).getTime(),
    );

  return previousEntries[0] ?? null;
}
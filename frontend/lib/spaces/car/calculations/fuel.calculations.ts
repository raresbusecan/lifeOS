import type { CarFuelEntry } from "../car.types";
import { getPreviousFuelEntry } from "../utils/fuel.utils";


export function calculateSuggestedLiters(
    tankCapacityLiters: number,
    levelBefore: number,
    levelAfter: number,
): number | null {
    if (tankCapacityLiters <= 0) return null;

    if (levelBefore < 0 || levelBefore > 100) {
        return null;
    }

    if (levelAfter < 0 || levelAfter > 100) {
        return null;
    }

    if (levelAfter < levelBefore) {
        return null;
    }

    const liters =
        tankCapacityLiters *
        ((levelAfter - levelBefore) / 100);

    return Number(liters.toFixed(2));
}

export function calculatePricePerLiter(
    liters: number,
    totalPaid: number,
): number | null {
    if (liters <= 0 || totalPaid <= 0) return null;

    return Number((totalPaid / liters).toFixed(2));
}

export function calculateDistance(
    previousEntry: CarFuelEntry | null,
    currentEntry: CarFuelEntry,
): number | null {
    if (!previousEntry) return null;

    const distance =
        currentEntry.odometer - previousEntry.odometer;

    if (distance <= 0) return null;

    return distance;
}

export function calculateEstimatedLitersConsumed(
    previousEntry: CarFuelEntry | null,
    currentEntry: CarFuelEntry,
    tankCapacityLiters: number,
): number | null {
    if (!previousEntry || tankCapacityLiters <= 0) {
        return null;
    }

    const consumed =
        tankCapacityLiters *
        ((previousEntry.level_after - currentEntry.level_before) / 100);

    if (consumed <= 0) return null;

    return Number(consumed.toFixed(2));
}

export function calculateEstimatedConsumption(
    fuelEntries: CarFuelEntry[],
    currentEntry: CarFuelEntry,
    tankCapacityLiters: number,
): number | null {
    const previousEntry = getPreviousFuelEntry(
        fuelEntries,
        currentEntry.date,
    );

    if (!previousEntry) {
        return null;
    }

    const distance =
        currentEntry.odometer - previousEntry.odometer;

    if (distance <= 0) {
        return null;
    }

    const litersConsumed =
        tankCapacityLiters *
        (
            (previousEntry.level_after -
                currentEntry.level_before) /
            100
        );

    if (litersConsumed <= 0) {
        return null;
    }

    return Number(
        ((litersConsumed / distance) * 100).toFixed(2),
    );
}
import type { CarData } from "@/components/spaces/car/car.data.types";
import type { CarNextItem } from "@/components/spaces/car/car.ui.types";

export function getCurrentOdometer(carData: CarData): number {
  let maxOdometer = carData.vehicle.mileage || 0;

  carData.fuelEntries.forEach((entry) => {
    if (entry.odometer > maxOdometer) {
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
      total += entry.total_paid;
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

function parseDateString(dateStr: string): Date | null {
  // Matches DD.MM.YYYY
  const match = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  return new Date(year, month - 1, day);
}

export function getUpcomingItems(carData: CarData, currentOdometer: number): CarNextItem[] {
  const items: Array<CarNextItem & { urgency: number }> = [];
  const now = new Date();
  
  // 1. Documents expiring in < 45 days
  const DOC_ALERT_DAYS = 45;
  const MS_PER_DAY = 1000 * 60 * 60 * 24;

  carData.documentEntries.forEach((entry) => {
    if (entry.expiryDate) {
      const expiry = parseDateString(entry.expiryDate);
      if (expiry) {
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / MS_PER_DAY);
        if (diffDays >= 0 && diffDays <= DOC_ALERT_DAYS) {
          items.push({
            id: `doc-${entry.id}`,
            icon: "document-text-outline",
            title: entry.title,
            subtitle: `Expires in ${diffDays} day${diffDays !== 1 ? 's' : ''}`,
            right: `${expiry.getDate()} ${expiry.toLocaleString('default', { month: 'short' })}`,
            urgency: diffDays, // Lower is more urgent
          });
        }
      }
    }
  });

  // 2. Maintenance due in < 2000 km
  const MAINT_ALERT_KM = 2000;
  
  carData.maintenanceEntries.forEach((entry) => {
    if (entry.nextServiceOdometer) {
      const remainingKm = entry.nextServiceOdometer - currentOdometer;
      if (remainingKm <= MAINT_ALERT_KM && remainingKm >= -5000) {
        // Calculate an urgency metric comparable to days (heuristic: 1 day ~ 30km)
        const equivalentDays = remainingKm / 30;
        
        let subtitle = `Due in ${remainingKm.toLocaleString()} km`;
        if (remainingKm < 0) {
            subtitle = `Overdue by ${Math.abs(remainingKm).toLocaleString()} km`;
        }

        items.push({
          id: `maint-${entry.id}`,
          icon: "construct-outline",
          title: entry.service,
          subtitle: subtitle,
          right: "Soon",
          urgency: equivalentDays,
        });
      }
    }
  });

  // Sort by urgency (ascending) and take top 3
  items.sort((a, b) => a.urgency - b.urgency);
  
  return items.slice(0, 3).map(({ urgency, ...item }) => item);
}

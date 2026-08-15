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
  icon: string;
  title: string;
  subtitle: string;
  right?: string;
};

export type CarRecentItem = {
  id: string | number;
  icon: string;
  title: string;
  subtitle: string;
  amount?: number;
  currency?: string;
};

export type CarQuickActionKey =
  | "fuel"
  | "maintenance"
  | "document"
  | "expense";

export type CarQuickAction = {
  key: CarQuickActionKey;
  icon: string;
  label: string;
};
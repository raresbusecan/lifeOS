export type CarVehicle = {
  make: string;
  model: string;
  year: number;
  registration_number?: string;
  mileage: number;
  fuel_type?: string;
  engine?: string;
  tank_capacity_liters: number;
};

export type CarFuelEntry = {
  id: string;
  date: string;
  liters: number;
  total_paid: number;
  odometer: number;
  level_before:number;
  level_after:number;
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
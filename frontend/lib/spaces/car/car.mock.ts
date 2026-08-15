import type {
  CarNextItem,
  CarRecentItem,
  CarVehicle,
} from "@/components/spaces/car/car.types";

export const MOCK_VEHICLE: CarVehicle = {
  make: "BMW",
  model: "320d",
  year: 2018,
  registration_number: "MM01ABC",
  mileage: 124580,
  fuel_type: "Diesel",
  engine: "2.0",
};

export const MOCK_NEXT: CarNextItem[] = [
  {
    id: 1,
    icon: "construct-outline",
    title: "Oil change",
    subtitle: "Due in 1,200 km",
    right: "Soon",
  },
  {
    id: 2,
    icon: "document-text-outline",
    title: "RCA",
    subtitle: "Expires in 42 days",
    right: "Oct 12",
  },
];

export const MOCK_RECENT: CarRecentItem[] = [
  {
    id: 1,
    icon: "water-outline",
    title: "Fuel",
    subtitle: "Today · 58 L",
    amount: 250,
    currency: "RON",
  },
  {
    id: 2,
    icon: "construct-outline",
    title: "Oil change",
    subtitle: "Aug 8 · 123,380 km",
    amount: 380,
    currency: "RON",
  },
];
import type { CarIcon } from "../car.types";

export type CarRecentItem = {
  id: string | number;
  icon: CarIcon;
  title: string;
  subtitle: string;
  amount?: string;
  currency?: string;
};
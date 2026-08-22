import type { CarIcon } from "../car.ui.types";

export type CarRecentItemType =
  | "fuel"
  | "maintenance"
  | "document"
  | "expense";

export type CarRecentItem = {
  id: string | number;
  type: CarRecentItemType;
  icon: CarIcon;
  title: string;
  subtitle: string;
  amount?: string;
  currency?: string;
};
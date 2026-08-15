import React, { useState } from "react";
import {
  ScrollView,
  Alert,
} from "react-native";
import { useTheme } from "@/lib/theme";

import { CarHeader } from "./CarHeader";
import { CarStats } from "./CarStats";
import { CarNextSection, CarNextItem } from "./CarNextSection";
import {
  CarRecentSection,
  CarRecentItem,
} from "./CarRecentSection";
import {
  CarQuickActions,
  CarQuickAction,
} from "./CarQuickActions";
import {
  CarDetails,
  CarVehicle,
} from "./CarDetails";

export type CarDashboardProps = {
  space: any;
};

const MOCK_VEHICLE: CarVehicle = {
  make: "BMW",
  model: "320d",
  year: 2018,
  registration_number: "MM01ABC",
  mileage: 124580,
  fuel_type: "Diesel",
  engine: "2.0",
};

const MOCK_NEXT: CarNextItem[] = [
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

const MOCK_RECENT: CarRecentItem[] = [
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

const CAR_ACTIONS: CarQuickAction[] = [
  {
    key: "fuel",
    icon: "water-outline",
    label: "Fuel",
  },
  {
    key: "maintenance",
    icon: "construct-outline",
    label: "Maintenance",
  },
  {
    key: "document",
    icon: "document-text-outline",
    label: "Document",
  },
  {
    key: "expense",
    icon: "card-outline",
    label: "Expense",
  },
];

export function CarDashboard({
  space,
}: CarDashboardProps) {
  const { spacing } = useTheme();

  const [vehicle] = useState<CarVehicle>(MOCK_VEHICLE);

  const handleAdd = () => {
    Alert.alert(
      "Add",
      "CAR add actions will be connected here."
    );
  };

  const handleEdit = () => {
    Alert.alert(
      "Edit vehicle",
      "Vehicle editing will be connected here."
    );
  };

  const handleAction = (
    action: CarQuickAction["key"]
  ) => {
    Alert.alert(
      action.charAt(0).toUpperCase() + action.slice(1),
      `The ${action} flow will be connected here.`
    );
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingHorizontal: spacing.xl,
        paddingBottom: 150,
      }}
    >
      <CarHeader
        space={space}
        onAdd={handleAdd}
        onEdit={handleEdit}
      />

      <CarStats
        mileage={vehicle.mileage || 0}
        monthlyCost={620}
        currency="RON"
      />

      <CarNextSection
        items={MOCK_NEXT}
      />

      <CarRecentSection
        items={MOCK_RECENT}
      />

      <CarQuickActions
        actions={CAR_ACTIONS}
        onAction={handleAction}
      />

      <CarDetails
        vehicle={vehicle}
      />
    </ScrollView>
  );
}
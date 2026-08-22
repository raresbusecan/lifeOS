import React, { useRef, useState } from "react";
import { buildCarRecentItems } from "./utils/carEntries";
import type { CarRecentItem } from "./utils/carEntries.types";

import {
    View,
    Text,
    ScrollView,
    Pressable,
    StyleSheet,
} from "react-native";

import {
    CarActionModal,
    type CarActionModalRef,
    type CarActionType,
} from "./CarActionModal";

import CarFuelForm from "./forms/CarFuelForm";
import CarMaintenanceForm from "./forms/CarMaintenanceForm";
import CarDocumentForm from "./forms/CarDocumentForm";
import CarExpenseForm from "./forms/CarExpenseForm";

import type {
    CarDocumentEntry,
    CarExpenseEntry,
    CarFuelEntry,
    CarMaintenanceEntry,
    CarVehicle,
} from "@/lib/spaces/car/car.types";


import type {
    CarIcon,
    CarNextItem,
} from "./car.ui.types";

import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/lib/theme";

import type { CarData } from "./car.data.types";

export type CarDashboardProps = {
    space: any;
    carData: CarData;
    onAdd?: () => void;
    onEdit?: () => void;
    onFuelSave?: (entry: CarFuelEntry) => void;
    onMaintenanceSave?: (entry: CarMaintenanceEntry) => void;
    onDocumentSave?: (entry: CarDocumentEntry) => void;
    onExpenseSave?: (entry: CarExpenseEntry) => void;
};

type CarStat = {
    icon: keyof typeof Ionicons.glyphMap;
    value: string;
    label: string;
    suffix?: string;
};


type CarAction = {
    id: CarActionType;
    icon: keyof typeof Ionicons.glyphMap;
    label: string;
};

export default function CarDashboard({
    space,
    carData,
    onAdd,
    onEdit,
    onFuelSave,
    onMaintenanceSave,
    onDocumentSave,
    onExpenseSave,
}: CarDashboardProps) {
    const { colors, spacing, radius } = useTheme();

    const carActionModalRef = useRef<CarActionModalRef>(null);

    const [fuelFormVisible, setFuelFormVisible] = useState(false);


    const [maintenanceFormVisible, setMaintenanceFormVisible] =
        useState(false);


    const [documentFormVisible, setDocumentFormVisible] =
        useState(false);

    const [expenseFormVisible, setExpenseFormVisible] =
        useState(false);


    /*
     * =========================================================
     * TEMPORARY LOCAL CAR DATA
     * =========================================================
     */

    const stats: CarStat[] = [
        {
            icon: "speedometer-outline",
            value: "124,580",
            label: "Mileage",
            suffix: "km",
        },
        {
            icon: "wallet-outline",
            value: "620",
            label: "This month",
            suffix: "RON",
        },
    ];

    const nextItems: CarNextItem[] = [
        {
            id: "oil-change",
            icon: "construct-outline",
            title: "Oil change",
            subtitle: "Due in 1,200 km",
            right: "Soon",
        },
        {
            id: "rca",
            icon: "document-text-outline",
            title: "RCA",
            subtitle: "Expires in 42 days",
            right: "Oct 12",
        },
    ];

    const recentItems = buildCarRecentItems({
        fuelEntries: carData.fuelEntries,
        maintenanceEntries: carData.maintenanceEntries,
        documentEntries: carData.documentEntries,
        expenseEntries: carData.expenseEntries,
    });

    const quickActions: CarAction[] = [
        {
            id: "fuel",
            icon: "water-outline",
            label: "Fuel",
        },
        {
            id: "maintenance",
            icon: "construct-outline",
            label: "Maintenance",
        },
        {
            id: "document",
            icon: "document-text-outline",
            label: "Document",
        },
        {
            id: "expense",
            icon: "card-outline",
            label: "Expense",
        },
    ];

    /*
     * =========================================================
     * ADD
     * =========================================================
     */

    const handleAdd = () => {
        onAdd?.();
        carActionModalRef.current?.present();
    };

    /*
     * =========================================================
     * CAR ACTION
     * =========================================================
     */

    const handleCarAction = (action: CarActionType) => {
        if (action === "fuel") {
            carActionModalRef.current?.dismiss();
            setFuelFormVisible(true);
            return;
        }

        if (action === "maintenance") {
            carActionModalRef.current?.dismiss();
            setMaintenanceFormVisible(true);
            return;
        }

        if (action === "document") {
            carActionModalRef.current?.dismiss();
            setDocumentFormVisible(true);
            return;
        }

        if (action === "expense") {
            carActionModalRef.current?.dismiss();
            setExpenseFormVisible(true);
            return;
        }

        /*
         * Celelalte acțiuni vor primi formularele lor ulterior:
         *
         * maintenance
         * expense
         * document
         * mileage
         */
    };

    /*
     * =========================================================
     * SAVE FUEL
     * =========================================================
     */

    const handleFuelSave = (entry: CarFuelEntry) => {
        onFuelSave?.(entry);
        setFuelFormVisible(false);
    };

    const handleMaintenanceSave = (entry: CarMaintenanceEntry) => {
        onMaintenanceSave?.(entry);
        setMaintenanceFormVisible(false);
    };


    const handleDocumentSave = (entry: CarDocumentEntry) => {
        onDocumentSave?.(entry);
        setDocumentFormVisible(false);
    };


    const handleExpenseSave = (entry: CarExpenseEntry) => {
        onExpenseSave?.(entry);
        setExpenseFormVisible(false);
    };

    /*
     * =========================================================
     * EDIT CAR
     * =========================================================
     */

    const handleEdit = () => {
        onEdit?.();
    };

    /*
     * =========================================================
     * FUEL FORM
     * =========================================================
     */

    if (fuelFormVisible) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                }}
            >
                <CarFuelForm
                    vehicle={carData.vehicle}
                    fuelEntries={carData.fuelEntries}
                    onCancel={() => setFuelFormVisible(false)}
                    onSave={handleFuelSave}
                />
            </View>
        );
    }

    if (maintenanceFormVisible) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                }}
            >
                <CarMaintenanceForm
                    onCancel={() =>
                        setMaintenanceFormVisible(false)
                    }
                    onSave={handleMaintenanceSave}
                />
            </View>
        );
    }

    if (documentFormVisible) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                }}
            >
                <CarDocumentForm
                    onCancel={() =>
                        setDocumentFormVisible(false)
                    }
                    onSave={handleDocumentSave}
                />
            </View>
        );
    }


    if (expenseFormVisible) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: colors.surface,
                }}
            >
                <CarExpenseForm
                    onCancel={() =>
                        setExpenseFormVisible(false)
                    }
                    onSave={handleExpenseSave}
                />
            </View>
        );
    }

    /*
     * =========================================================
     * DASHBOARD
     * =========================================================
     */

    return (
        <>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                    paddingHorizontal: spacing.xl,
                    paddingBottom: 150,
                }}
            >
                {/* =====================================================
            SPACE IDENTITY
            ===================================================== */}

                <View
                    style={{
                        position: "relative",
                        alignItems: "center",
                        paddingTop: spacing.md,
                        paddingBottom: spacing.xl,
                    }}
                >
                    {/* ADD */}

                    <Pressable
                        testID="space-add"
                        onPress={handleAdd}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel="Add car item"
                        style={{
                            position: "absolute",
                            left: 0,
                            top: spacing.md + 10,
                            width: 40,
                            height: 40,
                            borderRadius: radius.pill,
                            backgroundColor: colors.surfaceSecondary,
                            borderWidth: 1,
                            borderColor: colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons
                            name="add"
                            size={22}
                            color={colors.onSurface}
                        />
                    </Pressable>

                    {/* EDIT */}

                    <Pressable
                        testID="space-edit"
                        onPress={handleEdit}
                        hitSlop={10}
                        accessibilityRole="button"
                        accessibilityLabel="Edit car"
                        style={{
                            position: "absolute",
                            right: 0,
                            top: spacing.md + 10,
                            width: 40,
                            height: 40,
                            borderRadius: radius.pill,
                            backgroundColor: colors.surfaceSecondary,
                            borderWidth: 1,
                            borderColor: colors.border,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons
                            name="create-outline"
                            size={19}
                            color={colors.onSurface}
                        />
                    </Pressable>

                    {/* CAR ICON */}

                    <View
                        style={{
                            width: 68,
                            height: 68,
                            borderRadius: radius.lg,
                            backgroundColor: colors.surfaceSecondary,
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: spacing.md,
                        }}
                    >
                        <Ionicons
                            name={(space?.icon || "car-outline") as any}
                            size={32}
                            color={colors.onSurface}
                        />
                    </View>

                    {/* NAME */}

                    <Text
                        style={{
                            fontSize: 30,
                            lineHeight: 36,
                            fontWeight: "800",
                            color: colors.onSurface,
                            letterSpacing: -0.7,
                        }}
                    >
                        {space?.name || "Car"}
                    </Text>

                    {/* VEHICLE DESCRIPTION */}

                    <Text
                        style={{
                            marginTop: 4,
                            fontSize: 14,
                            color: colors.onSurfaceTertiary,
                        }}
                    >
                        BMW 320d · 2018
                    </Text>
                </View>

                {/* =====================================================
            MAIN STATS
            ===================================================== */}

                <View
                    style={{
                        flexDirection: "row",
                        gap: spacing.md,
                        marginBottom: spacing.xl,
                    }}
                >
                    {stats.map((stat) => (
                        <StatCard
                            key={stat.label}
                            {...stat}
                            colors={colors}
                            radius={radius}
                            spacing={spacing}
                        />
                    ))}
                </View>

                {/* =====================================================
            NEXT
            ===================================================== */}

                <SectionTitle
                    title="NEXT"
                    colors={colors}
                />

                <View
                    style={{
                        gap: spacing.sm,
                        marginBottom: spacing.xl,
                    }}
                >
                    {nextItems.map((item) => (
                        <InfoRow
                            key={item.id}
                            {...item}
                            colors={colors}
                            radius={radius}
                            spacing={spacing}
                        />
                    ))}
                </View>

                {/* =====================================================
            RECENT
            ===================================================== */}

                <SectionTitle
                    title="RECENT"
                    colors={colors}
                />

                <View
                    style={{
                        backgroundColor: colors.surfaceSecondary,
                        borderRadius: radius.lg,
                        overflow: "hidden",
                        marginBottom: spacing.xl,
                    }}
                >
                    {recentItems.map((item, index) => (
                        <RecentRow
                            key={item.id}
                            {...item}
                            colors={colors}
                            spacing={spacing}
                            last={index === recentItems.length - 1}
                        />
                    ))}
                </View>

                {/* =====================================================
            QUICK ACTIONS
            ===================================================== */}

                <SectionTitle
                    title="QUICK ACTIONS"
                    colors={colors}
                />

                <View
                    style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        gap: spacing.sm,
                    }}
                >
                    {quickActions.map((action) => (
                        <ActionButton
                            key={action.id}
                            {...action}
                            colors={colors}
                            radius={radius}
                            onPress={() => handleCarAction(action.id)}
                        />
                    ))}
                </View>
            </ScrollView>

            {/* =======================================================
          ADD CAR ACTION MODAL
          ======================================================= */}

            <CarActionModal
                ref={carActionModalRef}
                onAction={handleCarAction}
            />
        </>
    );
}

/* ============================================================
   SECTION TITLE
   ============================================================ */

function SectionTitle({
    title,
    colors,
}: {
    title: string;
    colors: any;
}) {
    return (
        <Text
            style={{
                fontSize: 12,
                fontWeight: "800",
                letterSpacing: 1,
                color: colors.onSurfaceTertiary,
                marginBottom: 10,
            }}
        >
            {title}
        </Text>
    );
}

/* ============================================================
   STAT CARD
   ============================================================ */

function StatCard({
    icon,
    value,
    label,
    suffix,
    colors,
    radius,
    spacing,
}: CarStat & {
    colors: any;
    radius: any;
    spacing: any;
}) {
    return (
        <View
            style={{
                flex: 1,
                minHeight: 110,
                padding: spacing.lg,
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.lg,
                justifyContent: "space-between",
            }}
        >
            <Ionicons
                name={icon}
                size={19}
                color={colors.onSurfaceTertiary}
            />

            <View>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "baseline",
                        gap: 4,
                    }}
                >
                    <Text
                        style={{
                            fontSize: 22,
                            fontWeight: "800",
                            color: colors.onSurface,
                            letterSpacing: -0.4,
                        }}
                    >
                        {value}
                    </Text>

                    {suffix ? (
                        <Text
                            style={{
                                fontSize: 11,
                                fontWeight: "600",
                                color: colors.onSurfaceTertiary,
                            }}
                        >
                            {suffix}
                        </Text>
                    ) : null}
                </View>

                <Text
                    style={{
                        marginTop: 2,
                        fontSize: 12,
                        color: colors.onSurfaceTertiary,
                    }}
                >
                    {label}
                </Text>
            </View>
        </View>
    );
}

/* ============================================================
   NEXT / INFO ROW
   ============================================================ */

function InfoRow({
    icon,
    title,
    subtitle,
    right,
    colors,
    radius,
    spacing,
}: CarNextItem & {
    colors: any;
    radius: any;
    spacing: any;
}) {
    return (
        <View
            style={{
                backgroundColor: colors.surfaceSecondary,
                borderRadius: radius.lg,
                padding: spacing.lg,
                flexDirection: "row",
                alignItems: "center",
                gap: spacing.md,
            }}
        >
            <View
                style={{
                    width: 42,
                    height: 42,
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceTertiary,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Ionicons
                    name={icon}
                    size={20}
                    color={colors.onSurface}
                />
            </View>

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 15,
                        fontWeight: "700",
                        color: colors.onSurface,
                    }}
                >
                    {title}
                </Text>

                <Text
                    style={{
                        marginTop: 3,
                        fontSize: 12,
                        color: colors.onSurfaceTertiary,
                    }}
                >
                    {subtitle}
                </Text>
            </View>

            <Text
                style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: colors.onSurfaceTertiary,
                }}
            >
                {right}
            </Text>
        </View>
    );
}

/* ============================================================
   RECENT ROW
   ============================================================ */

function RecentRow({
    icon,
    title,
    subtitle,
    amount,
    colors,
    spacing,
    last = false,
}: CarRecentItem & {
    colors: any;
    spacing: any;
    last?: boolean;
}) {
    return (
        <View
            style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: spacing.lg,
                paddingVertical: spacing.md,
                gap: spacing.md,
                borderBottomWidth: last
                    ? 0
                    : StyleSheet.hairlineWidth,
                borderBottomColor: colors.border,
            }}
        >
            <Ionicons
                name={icon}
                size={20}
                color={colors.onSurfaceTertiary}
            />

            <View style={{ flex: 1 }}>
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "600",
                        color: colors.onSurface,
                    }}
                >
                    {title}
                </Text>

                <Text
                    style={{
                        marginTop: 2,
                        fontSize: 12,
                        color: colors.onSurfaceTertiary,
                    }}
                >
                    {subtitle}
                </Text>
            </View>

            {amount ? (
                <Text
                    style={{
                        fontSize: 14,
                        fontWeight: "700",
                        color: colors.onSurface,
                    }}
                >
                    {amount}
                </Text>
            ) : null}
        </View>
    );
}

/* ============================================================
   QUICK ACTION
   ============================================================ */

function ActionButton({
    icon,
    label,
    colors,
    radius,
    onPress,
}: CarAction & {
    colors: any;
    radius: any;
    onPress: () => void;
}) {
    return (
        <Pressable
            testID={`car-action-${label.toLowerCase()}`}
            onPress={onPress}
            style={{
                flexGrow: 1,
                flexBasis: "46%",
                minHeight: 48,
                paddingHorizontal: 14,
                borderRadius: radius.md,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
            }}
        >
            <Ionicons
                name={icon}
                size={17}
                color={colors.onSurface}
            />

            <Text
                style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.onSurface,
                }}
            >
                {label}
            </Text>
        </Pressable>
    );
}

/* ============================================================
   HELPERS
   ============================================================ */


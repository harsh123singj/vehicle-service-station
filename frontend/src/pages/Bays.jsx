import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Warehouse,
    RefreshCw,
    Car,
    Wrench,
    Ban,
    CheckCircle2,
    Clock3,
} from "lucide-react";

import api from "../services/api";
import socket from "../services/socket";

const statusConfig = {
    AVAILABLE: {
        label: "Available",
        icon: CheckCircle2,
        container: "border-emerald-200 bg-emerald-50/60",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        badge: "bg-emerald-100 text-emerald-700",
    },

    OCCUPIED: {
        label: "Occupied",
        icon: Car,
        container: "border-blue-200 bg-blue-50/60",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        badge: "bg-blue-100 text-blue-700",
    },

    MAINTENANCE: {
        label: "Maintenance",
        icon: Wrench,
        container: "border-yellow-200 bg-yellow-50/60",
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600",
        badge: "bg-yellow-100 text-yellow-700",
    },

    OUT_OF_SERVICE: {
        label: "Out of Service",
        icon: Ban,
        container: "border-red-200 bg-red-50/60",
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        badge: "bg-red-100 text-red-700",
    },
};

function formatStatus(status) {
    return status
        ?.replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    });
}

export default function Bays() {
    const [bays, setBays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");

    const fetchBays = useCallback(async () => {
        try {
            setLoading(true);

            const response = await api.get("/bays");

            setBays(response.data.bays || []);
        } catch (error) {
            console.error("Failed to fetch bays:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchBays();

        socket.connect();

        const handleBayUpdate = () => {
            fetchBays();
        };

        socket.on("bay:changed", handleBayUpdate);
        socket.on("journey:service-started", handleBayUpdate);
        socket.on("journey:service-completed", handleBayUpdate);

        return () => {
            socket.off("bay:changed", handleBayUpdate);
            socket.off(
                "journey:service-started",
                handleBayUpdate
            );
            socket.off(
                "journey:service-completed",
                handleBayUpdate
            );
        };
    }, [fetchBays]);

    /*
     * Realtime bay/service updates
     */
    useEffect(() => {
        socket.connect();

        const handleBayChanged = () => {
            fetchBays();
        };

        const handleServiceStarted = () => {
            fetchBays();
        };

        const handleServiceCompleted = () => {
            fetchBays();
        };

        socket.on("bay:changed", handleBayChanged);
        socket.on("journey:service-started", handleServiceStarted);
        socket.on(
            "journey:service-completed",
            handleServiceCompleted
        );

        return () => {
            socket.off("bay:changed", handleBayChanged);
            socket.off(
                "journey:service-started",
                handleServiceStarted
            );
            socket.off(
                "journey:service-completed",
                handleServiceCompleted
            );

            socket.disconnect();
        };
    }, [fetchBays]);

    const filteredBays = useMemo(() => {
        if (statusFilter === "ALL") {
            return bays;
        }

        return bays.filter(
            (bay) => bay.status === statusFilter
        );
    }, [bays, statusFilter]);

    const availableCount = bays.filter(
        (bay) => bay.status === "AVAILABLE"
    ).length;

    const occupiedCount = bays.filter(
        (bay) => bay.status === "OCCUPIED"
    ).length;

    const maintenanceCount = bays.filter(
        (bay) => bay.status === "MAINTENANCE"
    ).length;

    const outOfServiceCount = bays.filter(
        (bay) => bay.status === "OUT_OF_SERVICE"
    ).length;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <div className="flex items-center gap-2">
                        <Warehouse
                            size={23}
                            className="text-blue-600"
                        />

                        <h1 className="text-2xl font-bold text-slate-900">
                            Bays
                        </h1>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor service bay availability and activity.
                    </p>
                </div>

                <button
                    onClick={fetchBays}
                    className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>

            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                <SummaryCard
                    title="Available"
                    value={availableCount}
                    icon={CheckCircle2}
                    iconClass="text-emerald-600"
                    bgClass="bg-emerald-50"
                />

                <SummaryCard
                    title="Occupied"
                    value={occupiedCount}
                    icon={Car}
                    iconClass="text-blue-600"
                    bgClass="bg-blue-50"
                />

                <SummaryCard
                    title="Maintenance"
                    value={maintenanceCount}
                    icon={Wrench}
                    iconClass="text-yellow-600"
                    bgClass="bg-yellow-50"
                />

                <SummaryCard
                    title="Out of Service"
                    value={outOfServiceCount}
                    icon={Ban}
                    iconClass="text-red-600"
                    bgClass="bg-red-50"
                />

            </div>

            {/* Toolbar */}
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <h2 className="font-bold text-slate-900">
                        Service Bays
                    </h2>

                    <p className="mt-1 text-xs text-slate-500">
                        Bay status updates automatically in real time.
                    </p>
                </div>

                <select
                    value={statusFilter}
                    onChange={(event) =>
                        setStatusFilter(event.target.value)
                    }
                    className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                >
                    <option value="ALL">All Bays</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="OCCUPIED">Occupied</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="OUT_OF_SERVICE">
                        Out of Service
                    </option>
                </select>

            </div>

            {/* Bays */}
            {loading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <RefreshCw
                        size={28}
                        className="mx-auto animate-spin text-blue-500"
                    />

                    <p className="mt-3 text-sm text-slate-500">
                        Loading bays...
                    </p>
                </div>
            ) : filteredBays.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                    <Warehouse
                        size={36}
                        className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                        No bays found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                        There are no bays matching the selected filter.
                    </p>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">

                    {filteredBays.map((bay) => {
                        const config =
                            statusConfig[bay.status] ||
                            statusConfig.AVAILABLE;

                        const Icon = config.icon;

                        /*
                         * Depending on the backend response, journey
                         * information may be nested differently.
                         */
                        const journey = bay.serviceSession?.journey;

                        const registrationNumber =
                            journey?.vehicle?.registrationNumber ||
                            bay.journey?.vehicle?.registrationNumber ||
                            bay.vehicle?.registrationNumber;

                        const journeyId =
                            journey?.id ||
                            bay.journey?.id ||
                            bay.journeyId;

                        const serviceSession =
                            bay.serviceSession;

                        return (
                            <div
                                key={bay.id}
                                className={`rounded-xl border p-5 shadow-sm transition hover:shadow-md ${config.container}`}
                            >

                                {/* Bay Header */}
                                <div className="flex items-start justify-between">

                                    <div className="flex items-center gap-3">

                                        <div
                                            className={`flex h-11 w-11 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}
                                        >
                                            <Icon size={21} />
                                        </div>

                                        <div>
                                            <p className="text-xs text-slate-500">
                                                Service Bay
                                            </p>

                                            <h2 className="text-lg font-bold text-slate-900">
                                                {bay.bayNumber ||
                                                    bay.name ||
                                                    `Bay #${bay.id}`}
                                            </h2>
                                        </div>

                                    </div>

                                    <span
                                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
                                    >
                                        {formatStatus(bay.status)}
                                    </span>

                                </div>

                                {/* Bay Details */}
                                <div className="mt-5 border-t border-slate-200/70 pt-4">

                                    {bay.name &&
                                        bay.bayNumber && (
                                            <div className="mb-3">
                                                <p className="text-xs text-slate-400">
                                                    Name
                                                </p>

                                                <p className="mt-1 text-sm font-medium text-slate-700">
                                                    {bay.name}
                                                </p>
                                            </div>
                                        )}

                                    {bay.status === "OCCUPIED" ? (
                                        <div className="space-y-3">

                                            <div>
                                                <p className="text-xs text-slate-400">
                                                    Vehicle
                                                </p>

                                                <div className="mt-1 flex items-center gap-2">
                                                    <Car
                                                        size={15}
                                                        className="text-blue-600"
                                                    />

                                                    <p className="text-sm font-semibold text-slate-800">
                                                        {registrationNumber ||
                                                            "Vehicle assigned"}
                                                    </p>
                                                </div>
                                            </div>

                                            {journeyId && (
                                                <div>
                                                    <p className="text-xs text-slate-400">
                                                        Journey
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                        #{journeyId}
                                                    </p>
                                                </div>
                                            )}

                                            {serviceSession && (
                                                <div>
                                                    <p className="text-xs text-slate-400">
                                                        Service
                                                    </p>

                                                    <p className="mt-1 text-sm font-medium text-slate-700">
                                                        {formatStatus(
                                                            serviceSession.status
                                                        )}
                                                    </p>
                                                </div>
                                            )}

                                        </div>
                                    ) : bay.status === "AVAILABLE" ? (
                                        <div className="flex items-center gap-2 text-sm text-emerald-700">
                                            <CheckCircle2 size={16} />

                                            <span className="font-medium">
                                                Ready for vehicle assignment
                                            </span>
                                        </div>
                                    ) : bay.status === "MAINTENANCE" ? (
                                        <div className="flex items-center gap-2 text-sm text-yellow-700">
                                            <Wrench size={16} />

                                            <span className="font-medium">
                                                Bay under maintenance
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-sm text-red-700">
                                            <Ban size={16} />

                                            <span className="font-medium">
                                                Bay unavailable
                                            </span>
                                        </div>
                                    )}

                                </div>

                                {/* Footer */}
                                <div className="mt-5 flex items-center justify-between border-t border-slate-200/70 pt-3">

                                    <span className="text-xs text-slate-400">
                                        Site #{bay.siteId}
                                    </span>

                                    {serviceSession?.startedAt && (
                                        <span className="flex items-center gap-1 text-xs text-slate-500">
                                            <Clock3 size={13} />
                                            Started{" "}
                                            {formatDate(
                                                serviceSession.startedAt
                                            )}
                                        </span>
                                    )}

                                </div>

                            </div>
                        );
                    })}

                </div>
            )}

        </div>
    );
}

function SummaryCard({
    title,
    value,
    icon: Icon,
    iconClass,
    bgClass,
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

            <div className="flex items-start justify-between">

                <div>
                    <p className="text-sm font-medium text-slate-500">
                        {title}
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-900">
                        {value}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 items-center justify-center rounded-lg ${bgClass} ${iconClass}`}
                >
                    <Icon size={21} />
                </div>

            </div>

        </div>
    );
}
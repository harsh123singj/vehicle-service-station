import { useCallback, useEffect, useState } from "react";
import {
    Search,
    RefreshCw,
    Eye,
    Car,
    Clock,
} from "lucide-react";
import JourneyDetail from "./JourneyDetail";
import api from "../services/api";
import socket from "../services/socket.js";


const statusStyles = {
    ENTERED: "bg-blue-50 text-blue-700",
    IDENTIFIED: "bg-indigo-50 text-indigo-700",
    VERIFYING: "bg-yellow-50 text-yellow-700",
    ELIGIBLE: "bg-green-50 text-green-700",
    NOT_ELIGIBLE: "bg-red-50 text-red-700",
    HOLD: "bg-orange-50 text-orange-700",
    QUEUED: "bg-purple-50 text-purple-700",
    BAY_ASSIGNED: "bg-cyan-50 text-cyan-700",
    SERVICE_IN_PROGRESS: "bg-blue-50 text-blue-700",
    SERVICE_COMPLETED: "bg-green-50 text-green-700",
    EXITED: "bg-slate-100 text-slate-600",
    CANCELLED: "bg-red-50 text-red-600",
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

export default function Journeys() {
    const [journeys, setJourneys] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [selectedJourneyId, setSelectedJourneyId] = useState(null);

    const fetchJourneys = useCallback(async () => {
        try {
            setLoading(true);

            const response = await api.get("/journeys");

            setJourneys(response.data.journeys || []);
        } catch (error) {
            console.error("Failed to fetch journeys:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchJourneys();
    }, [fetchJourneys]);

    useEffect(() => {
        fetchJourneys();

        socket.connect();

        const handleJourneyUpdate = () => {
            fetchJourneys();
        };

        socket.on("journey:created", handleJourneyUpdate);
        socket.on("journey:eligibility-decided", handleJourneyUpdate);
        socket.on("journey:service-started", handleJourneyUpdate);
        socket.on("journey:service-completed", handleJourneyUpdate);
        socket.on("journey:exited", handleJourneyUpdate);
        socket.on("journey:verification-failed", handleJourneyUpdate);

        return () => {
            socket.off("journey:created", handleJourneyUpdate);
            socket.off(
                "journey:eligibility-decided",
                handleJourneyUpdate
            );
            socket.off(
                "journey:service-started",
                handleJourneyUpdate
            );
            socket.off(
                "journey:service-completed",
                handleJourneyUpdate
            );
            socket.off("journey:exited", handleJourneyUpdate);
            socket.off(
                "journey:verification-failed",
                handleJourneyUpdate
            );
        };
    }, [fetchJourneys]);

    const filteredJourneys = journeys.filter((journey) => {
        const matchesSearch =
            journey.vehicle?.registrationNumber
                ?.toLowerCase()
                .includes(search.toLowerCase()) ||
            String(journey.id).includes(search);

        const matchesStatus =
            statusFilter === "ALL" ||
            journey.currentStatus === statusFilter;

        return matchesSearch && matchesStatus;
    });

    if (selectedJourneyId) {
        return (
            <JourneyDetail
                journeyId={selectedJourneyId}
                onBack={() => setSelectedJourneyId(null)}
            />
        );
    }

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        Journeys
                    </h1>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor and manage vehicle journeys across the station.
                    </p>
                </div>

                <button
                    onClick={fetchJourneys}
                    className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 lg:flex-row">

                    {/* Search */}
                    <div className="relative flex-1">
                        <Search
                            size={18}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                            type="text"
                            placeholder="Search by vehicle registration or journey ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                        />
                    </div>

                    {/* Status */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="ENTERED">Entered</option>
                        <option value="IDENTIFIED">Identified</option>
                        <option value="VERIFYING">Verifying</option>
                        <option value="ELIGIBLE">Eligible</option>
                        <option value="NOT_ELIGIBLE">Not Eligible</option>
                        <option value="HOLD">Hold</option>
                        <option value="QUEUED">Queued</option>
                        <option value="BAY_ASSIGNED">Bay Assigned</option>
                        <option value="SERVICE_IN_PROGRESS">
                            Service In Progress
                        </option>
                        <option value="SERVICE_COMPLETED">
                            Service Completed
                        </option>
                        <option value="EXITED">Exited</option>
                    </select>

                </div>
            </div>

            {/* Journey Table */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="overflow-x-auto">
                    <table className="min-w-[900px] w-full">

                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Journey
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Vehicle
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Site
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Eligibility
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Entry Time
                                </th>

                                <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Action
                                </th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-12 text-center text-sm text-slate-500"
                                    >
                                        Loading journeys...
                                    </td>
                                </tr>
                            ) : filteredJourneys.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="7"
                                        className="px-5 py-12 text-center"
                                    >
                                        <Car
                                            size={32}
                                            className="mx-auto text-slate-300"
                                        />

                                        <p className="mt-3 text-sm font-medium text-slate-600">
                                            No journeys found
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            Try changing your search or filters.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredJourneys.map((journey) => (
                                    <tr
                                        key={journey.id}
                                        className="hover:bg-slate-50"
                                    >

                                        {/* Journey ID */}
                                        <td className="px-5 py-4">
                                            <p className="font-semibold text-slate-900">
                                                #{journey.id}
                                            </p>

                                            <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                                                <Clock size={12} />
                                                {formatDate(journey.entryTime)}
                                            </div>
                                        </td>

                                        {/* Vehicle */}
                                        <td className="px-5 py-4">
                                            <p className="font-medium text-slate-800">
                                                {journey.vehicle?.registrationNumber ||
                                                    `Vehicle #${journey.vehicleId}`}
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                {journey.vehicle?.type || "Vehicle"}
                                            </p>
                                        </td>

                                        {/* Site */}
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-medium text-slate-700">
                                                {journey.site?.name ||
                                                    `Site #${journey.siteId}`}
                                            </p>
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-4">
                                            <span
                                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[journey.currentStatus] ||
                                                    "bg-slate-100 text-slate-600"
                                                    }`}
                                            >
                                                {formatStatus(journey.currentStatus)}
                                            </span>
                                        </td>

                                        {/* Eligibility */}
                                        <td className="px-5 py-4">
                                            <span className="text-sm font-medium text-slate-700">
                                                {journey.eligibilityStatus
                                                    ? formatStatus(journey.eligibilityStatus)
                                                    : "Pending"}
                                            </span>
                                        </td>

                                        {/* Entry */}
                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {formatDate(journey.entryTime)}
                                        </td>

                                        {/* Action */}
                                        <td className="px-5 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedJourneyId(journey.id)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                                            >
                                                <Eye size={15} />
                                                View
                                            </button>
                                        </td>

                                    </tr>
                                ))
                            )}

                        </tbody>
                    </table>
                </div>

                {/* Footer */}
                {!loading && (
                    <div className="border-t border-slate-200 px-5 py-3">
                        <p className="text-xs text-slate-500">
                            Showing{" "}
                            <span className="font-semibold text-slate-700">
                                {filteredJourneys.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-700">
                                {journeys.length}
                            </span>{" "}
                            journeys
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
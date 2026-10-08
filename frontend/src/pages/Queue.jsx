import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ListOrdered,
    RefreshCw,
    Clock3,
    Car,
    AlertCircle,
} from "lucide-react";

import api from "../services/api";
import socket from "../services/socket";

function formatStatus(status) {
    if (!status) return "-";

    return status
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatWaitingTime(joinedAt) {
    if (!joinedAt) return "-";

    const minutes = Math.max(
        0,
        Math.floor(
            (Date.now() - new Date(joinedAt).getTime()) / 60000
        )
    );

    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min";
    return `${minutes} min`;
}

const statusStyles = {
    WAITING: "bg-yellow-50 text-yellow-700",
    CALLED: "bg-blue-50 text-blue-700",
    ASSIGNED: "bg-purple-50 text-purple-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-700",
};

export default function Queue() {
    const [queues, setQueues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState("ALL");

    const fetchQueues = useCallback(async () => {
        try {
            setLoading(true);

            const response = await api.get("/queues");

            setQueues(response.data.queues || []);
        } catch (error) {
            console.error("Failed to fetch queue:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    /*
     * Initial queue fetch
     */
    useEffect(() => {
        fetchQueues();

        socket.connect();

        const handleQueueUpdate = () => {
            fetchQueues();
        };

        socket.on("queue:changed", handleQueueUpdate);

        return () => {
            socket.off("queue:changed", handleQueueUpdate);
        };
    }, [fetchQueues]);

    /*
     * Realtime queue updates
     */
    useEffect(() => {
        socket.connect();

        const handleQueueChanged = () => {
            fetchQueues();
        };

        socket.on("queue:changed", handleQueueChanged);

        return () => {
            socket.off("queue:changed", handleQueueChanged);
            socket.disconnect();
        };
    }, [fetchQueues]);

    /*
     * Filter queue
     */
    const filteredQueues = useMemo(() => {
        if (statusFilter === "ALL") {
            return queues;
        }

        return queues.filter(
            (queue) => queue.status === statusFilter
        );
    }, [queues, statusFilter]);

    /*
     * Only currently waiting vehicles
     */
    const waitingCount = queues.filter(
        (queue) => queue.status === "WAITING"
    ).length;

    const assignedCount = queues.filter(
        (queue) => queue.status === "ASSIGNED"
    ).length;

    const calledCount = queues.filter(
        (queue) => queue.status === "CALLED"
    ).length;

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>
                    <div className="flex items-center gap-2">
                        <ListOrdered
                            size={23}
                            className="text-blue-600"
                        />

                        <h1 className="text-2xl font-bold text-slate-900">
                            Queue
                        </h1>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                        Monitor vehicles waiting for service and bay assignment.
                    </p>
                </div>

                <button
                    onClick={fetchQueues}
                    className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                    <RefreshCw
                        size={16}
                        className={loading ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <SummaryCard
                    title="Waiting"
                    value={waitingCount}
                    subtitle="Vehicles waiting"
                    icon={Clock3}
                />

                <SummaryCard
                    title="Called"
                    value={calledCount}
                    subtitle="Vehicles called"
                    icon={AlertCircle}
                />

                <SummaryCard
                    title="Assigned"
                    value={assignedCount}
                    subtitle="Bay assigned"
                    icon={Car}
                />

            </div>

            {/* Queue panel */}
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

                {/* Toolbar */}
                <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h2 className="font-bold text-slate-900">
                            Live Queue
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                            Updates automatically when queue events occur.
                        </p>
                    </div>

                    <select
                        value={statusFilter}
                        onChange={(event) =>
                            setStatusFilter(event.target.value)
                        }
                        className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="WAITING">Waiting</option>
                        <option value="CALLED">Called</option>
                        <option value="ASSIGNED">Assigned</option>
                        <option value="COMPLETED">Completed</option>
                        <option value="CANCELLED">Cancelled</option>
                    </select>

                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="min-w-[850px] w-full">

                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Position
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Vehicle
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Journey
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Priority
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Status
                                </th>

                                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                                    Waiting
                                </th>

                            </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-100">

                            {loading ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-5 py-14 text-center text-sm text-slate-500"
                                    >
                                        Loading queue...
                                    </td>
                                </tr>
                            ) : filteredQueues.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-5 py-14 text-center"
                                    >
                                        <ListOrdered
                                            size={36}
                                            className="mx-auto text-slate-300"
                                        />

                                        <p className="mt-3 text-sm font-semibold text-slate-600">
                                            Queue is empty
                                        </p>

                                        <p className="mt-1 text-xs text-slate-400">
                                            No vehicles are currently in this queue.
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                filteredQueues.map((queue, index) => {

                                    /*
                                     * Different backend responses may expose
                                     * vehicle information in slightly different
                                     * nested structures, so we safely check them.
                                     */
                                    const registrationNumber =
                                        queue.journey?.vehicle?.registrationNumber ||
                                        queue.vehicle?.registrationNumber ||
                                        `Vehicle #${queue.journey?.vehicleId || "-"}`;

                                    const journeyId =
                                        queue.journeyId ||
                                        queue.journey?.id ||
                                        "-";

                                    return (
                                        <tr
                                            key={queue.id}
                                            className="hover:bg-slate-50"
                                        >

                                            {/* Position */}
                                            <td className="px-5 py-4">
                                                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-sm font-bold text-blue-700">
                                                    {queue.position || index + 1}
                                                </div>
                                            </td>

                                            {/* Vehicle */}
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-800">
                                                    {registrationNumber}
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Site #{queue.siteId}
                                                </p>
                                            </td>

                                            {/* Journey */}
                                            <td className="px-5 py-4">
                                                <span className="font-medium text-slate-700">
                                                    #{journeyId}
                                                </span>
                                            </td>

                                            {/* Priority */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${queue.priority > 0
                                                            ? "bg-orange-50 text-orange-700"
                                                            : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {queue.priority > 0
                                                        ? `Priority ${queue.priority}`
                                                        : "Normal"}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[queue.status] ||
                                                        "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {formatStatus(queue.status)}
                                                </span>
                                            </td>

                                            {/* Waiting */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Clock3 size={14} />
                                                    {formatWaitingTime(queue.joinedAt)}
                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })
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
                                {filteredQueues.length}
                            </span>{" "}
                            of{" "}
                            <span className="font-semibold text-slate-700">
                                {queues.length}
                            </span>{" "}
                            queue entries
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}

function SummaryCard({
    title,
    value,
    subtitle,
    icon: Icon,
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

                    <p className="mt-1 text-xs text-slate-400">
                        {subtitle}
                    </p>
                </div>

                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Icon size={21} />
                </div>

            </div>
        </div>
    );
}
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import socket from "../services/socket";

const severityConfig = {
  CRITICAL: {
    label: "Critical",
    icon: ShieldAlert,
    badge: "bg-red-100 text-red-700",
    iconBg: "bg-red-100",
    iconColor: "text-red-600",
    border: "border-red-200",
  },

  HIGH: {
    label: "High",
    icon: AlertTriangle,
    badge: "bg-orange-100 text-orange-700",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    border: "border-orange-200",
  },

  MEDIUM: {
    label: "Medium",
    icon: AlertTriangle,
    badge: "bg-yellow-100 text-yellow-700",
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
    border: "border-yellow-200",
  },

  LOW: {
    label: "Low",
    icon: Bell,
    badge: "bg-blue-100 text-blue-700",
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    border: "border-blue-200",
  },
};

const statusConfig = {
  OPEN: "bg-red-50 text-red-700",
  ACKNOWLEDGED: "bg-yellow-50 text-yellow-700",
  RESOLVED: "bg-green-50 text-green-700",
};

const formatStatus = (status) => {
  if (!status) return "-";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const Alerts = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/alerts");

      setAlerts(response.data.alerts || []);
    } catch (error) {
      console.error("Failed to fetch alerts:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  fetchAlerts();

  socket.connect();

  const handleAlertUpdate = () => {
    fetchAlerts();
  };

  socket.on("alert:created", handleAlertUpdate);

  return () => {
    socket.off("alert:created", handleAlertUpdate);
  };
}, [fetchAlerts]);

  /*
   * Realtime alert updates
   */
  useEffect(() => {
    socket.connect();

    const handleAlertCreated = () => {
      fetchAlerts();
    };

    socket.on("alert:created", handleAlertCreated);

    return () => {
      socket.off("alert:created", handleAlertCreated);
      socket.disconnect();
    };
  }, [fetchAlerts]);

  /*
   * Acknowledge alert
   */
  const acknowledgeAlert = async (alertId) => {
    try {
      setActionLoading(alertId);

      await api.put(`/alerts/${alertId}/acknowledge`);

      await fetchAlerts();
    } catch (error) {
      console.error(
        "Failed to acknowledge alert:",
        error
      );
    } finally {
      setActionLoading(null);
    }
  };

  /*
   * Resolve alert
   */
  const resolveAlert = async (alertId) => {
    try {
      setActionLoading(alertId);

      await api.put(`/alerts/${alertId}/resolve`);

      await fetchAlerts();
    } catch (error) {
      console.error("Failed to resolve alert:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((alert) => {
      const severityMatches =
        severityFilter === "ALL" ||
        alert.severity === severityFilter;

      const statusMatches =
        statusFilter === "ALL" ||
        alert.status === statusFilter;

      return severityMatches && statusMatches;
    });
  }, [alerts, severityFilter, statusFilter]);

  const criticalCount = alerts.filter(
    (alert) =>
      alert.severity === "CRITICAL" &&
      alert.status !== "RESOLVED"
  ).length;

  const highCount = alerts.filter(
    (alert) =>
      alert.severity === "HIGH" &&
      alert.status !== "RESOLVED"
  ).length;

  const openCount = alerts.filter(
    (alert) => alert.status === "OPEN"
  ).length;

  const resolvedCount = alerts.filter(
    (alert) => alert.status === "RESOLVED"
  ).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <Bell
              size={23}
              className="text-blue-600"
            />

            <h1 className="text-2xl font-bold text-slate-900">
              Alerts
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Monitor compliance, verification and operational alerts.
          </p>
        </div>

        <button
          onClick={fetchAlerts}
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
          title="Critical"
          value={criticalCount}
          subtitle="Unresolved"
          icon={ShieldAlert}
          bg="bg-red-50"
          color="text-red-600"
        />

        <SummaryCard
          title="High"
          value={highCount}
          subtitle="Unresolved"
          icon={AlertTriangle}
          bg="bg-orange-50"
          color="text-orange-600"
        />

        <SummaryCard
          title="Open"
          value={openCount}
          subtitle="Needs attention"
          icon={Bell}
          bg="bg-yellow-50"
          color="text-yellow-600"
        />

        <SummaryCard
          title="Resolved"
          value={resolvedCount}
          subtitle="Completed"
          icon={CheckCircle2}
          bg="bg-green-50"
          color="text-green-600"
        />

      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">

        <select
          value={severityFilter}
          onChange={(event) =>
            setSeverityFilter(event.target.value)
          }
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All Severities</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPEN">Open</option>
          <option value="ACKNOWLEDGED">
            Acknowledged
          </option>
          <option value="RESOLVED">Resolved</option>
        </select>

      </div>

      {/* Alert List */}
      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-blue-500"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading alerts...
          </p>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <CheckCircle2
            size={38}
            className="mx-auto text-emerald-500"
          />

          <p className="mt-3 text-sm font-semibold text-slate-700">
            No alerts found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            No alerts match the selected filters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">

          {filteredAlerts.map((alert) => {
            const config =
              severityConfig[alert.severity] ||
              severityConfig.LOW;

            const Icon = config.icon;

            return (
              <div
                key={alert.id}
                className={`rounded-xl border bg-white p-5 shadow-sm ${config.border}`}
              >

                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                  {/* Alert information */}
                  <div className="flex gap-4">

                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}
                    >
                      <Icon size={21} />
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">

                        <h2 className="font-bold text-slate-900">
                          {alert.title}
                        </h2>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
                        >
                          {config.label}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            statusConfig[alert.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {formatStatus(alert.status)}
                        </span>

                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {alert.message}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-400">

                        <span className="flex items-center gap-1">
                          <Clock3 size={13} />
                          {formatDate(alert.createdAt)}
                        </span>

                        <span>
                          Site #{alert.siteId}
                        </span>

                        {alert.journeyId && (
                          <span>
                            Journey #{alert.journeyId}
                          </span>
                        )}

                      </div>
                    </div>

                  </div>

                  {/* Actions */}
                  {alert.status !== "RESOLVED" && (
                    <div className="flex shrink-0 gap-2">

                      {alert.status === "OPEN" && (
                        <button
                          onClick={() =>
                            acknowledgeAlert(alert.id)
                          }
                          disabled={
                            actionLoading === alert.id
                          }
                          className="flex items-center gap-1.5 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 disabled:opacity-50"
                        >
                          <Clock3 size={14} />
                          {actionLoading === alert.id
                            ? "Updating..."
                            : "Acknowledge"}
                        </button>
                      )}

                      <button
                        onClick={() =>
                          resolveAlert(alert.id)
                        }
                        disabled={
                          actionLoading === alert.id
                        }
                        className="flex items-center gap-1.5 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        <CheckCircle2 size={14} />
                        {actionLoading === alert.id
                          ? "Updating..."
                          : "Resolve"}
                      </button>

                    </div>
                  )}

                </div>

              </div>
            );
          })}

        </div>
      )}

      {/* Footer */}
      {!loading && (
        <div className="text-xs text-slate-500">
          Showing{" "}
          <span className="font-semibold text-slate-700">
            {filteredAlerts.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-slate-700">
            {alerts.length}
          </span>{" "}
          alerts
        </div>
      )}

    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  bg,
  color,
}) => {
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

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-lg ${bg} ${color}`}
        >
          <Icon size={21} />
        </div>

      </div>
    </div>
  );
};

export default Alerts;
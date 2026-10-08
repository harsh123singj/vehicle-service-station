import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  RefreshCw,
  Clock3,
  User,
  Database,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";

const formatDate = (date) => {
  if (!date) return "-";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatText = (value) => {
  if (!value) return "-";

  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const getActionStyle = (action) => {
  const normalizedAction = action?.toUpperCase();

  if (
    normalizedAction?.includes("DELETE") ||
    normalizedAction?.includes("CANCEL")
  ) {
    return "bg-red-50 text-red-700";
  }

  if (
    normalizedAction?.includes("UPDATE") ||
    normalizedAction?.includes("ASSIGN")
  ) {
    return "bg-blue-50 text-blue-700";
  }

  if (
    normalizedAction?.includes("CREATE") ||
    normalizedAction?.includes("START")
  ) {
    return "bg-emerald-50 text-emerald-700";
  }

  if (
    normalizedAction?.includes("VERIFY") ||
    normalizedAction?.includes("ELIGIB")
  ) {
    return "bg-purple-50 text-purple-700";
  }

  return "bg-slate-100 text-slate-600";
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/audit-logs");

      setLogs(response.data.logs || []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const entityTypes = useMemo(() => {
    const values = logs
      .map((log) => log.entityType)
      .filter(Boolean);

    return [...new Set(values)];
  }, [logs]);

  const actions = useMemo(() => {
    const values = logs
      .map((log) => log.action)
      .filter(Boolean);

    return [...new Set(values)];
  }, [logs]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const entityMatches =
        entityFilter === "ALL" ||
        log.entityType === entityFilter;

      const actionMatches =
        actionFilter === "ALL" ||
        log.action === actionFilter;

      return entityMatches && actionMatches;
    });
  }, [logs, entityFilter, actionFilter]);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <FileText
              size={23}
              className="text-blue-600"
            />

            <h1 className="text-2xl font-bold text-slate-900">
              Audit Logs
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Track important system and operator activities.
          </p>
        </div>

        <button
          onClick={fetchLogs}
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <SummaryCard
          title="Total Events"
          value={logs.length}
          subtitle="Recorded activities"
          icon={FileText}
        />

        <SummaryCard
          title="Entity Types"
          value={entityTypes.length}
          subtitle="Tracked resources"
          icon={Database}
        />

        <SummaryCard
          title="Actions"
          value={actions.length}
          subtitle="Different operations"
          icon={ShieldCheck}
        />

      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">

        <select
          value={entityFilter}
          onChange={(event) =>
            setEntityFilter(event.target.value)
          }
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All Entities</option>

          {entityTypes.map((entity) => (
            <option key={entity} value={entity}>
              {formatText(entity)}
            </option>
          ))}
        </select>

        <select
          value={actionFilter}
          onChange={(event) =>
            setActionFilter(event.target.value)
          }
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All Actions</option>

          {actions.map((action) => (
            <option key={action} value={action}>
              {formatText(action)}
            </option>
          ))}
        </select>

      </div>

      {/* Logs */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">
            Activity History
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            System and operator actions recorded for traceability.
          </p>
        </div>

        <div className="overflow-x-auto">

          <table className="min-w-[950px] w-full">

            <thead className="border-b border-slate-200 bg-slate-50">

              <tr>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Action
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Entity
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  User
                </th>

                <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Time
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100">

              {loading ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    <RefreshCw
                      size={25}
                      className="mx-auto animate-spin text-blue-500"
                    />

                    <p className="mt-3">
                      Loading audit logs...
                    </p>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-5 py-14 text-center"
                  >
                    <FileText
                      size={38}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      No audit logs found
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      No activity matches the selected filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50"
                  >

                    {/* Action */}
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getActionStyle(
                          log.action
                        )}`}
                      >
                        {formatText(log.action)}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-5 py-4">

                      <p className="font-semibold text-slate-800">
                        {formatText(log.entityType)}
                      </p>

                      {log.entityId && (
                        <p className="mt-1 text-xs text-slate-400">
                          ID #{log.entityId}
                        </p>
                      )}

                    </td>

                    {/* Description */}
                    <td className="max-w-md px-5 py-4">

                      <p className="text-sm text-slate-600">
                        {log.description || "-"}
                      </p>

                    </td>

                    {/* User */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-2">

                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                          <User size={15} />
                        </div>

                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {log.user?.name ||
                              (log.userId
                                ? `User #${log.userId}`
                                : "System")}
                          </p>

                          {log.siteId && (
                            <p className="text-xs text-slate-400">
                              Site #{log.siteId}
                            </p>
                          )}
                        </div>

                      </div>

                    </td>

                    {/* Time */}
                    <td className="px-5 py-4">

                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Clock3 size={14} />

                        {formatDate(log.createdAt)}
                      </div>

                    </td>

                  </tr>
                ))
              )}

            </tbody>

          </table>

        </div>

        {!loading && (
          <div className="border-t border-slate-200 px-5 py-3">
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-semibold text-slate-700">
                {filteredLogs.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-slate-700">
                {logs.length}
              </span>{" "}
              audit records
            </p>
          </div>
        )}

      </div>

    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
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

        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Icon size={21} />
        </div>

      </div>

    </div>
  );
};

export default AuditLogs;
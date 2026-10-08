import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Building2,
  Car,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Server,
  Wrench,
} from "lucide-react";

import api from "../services/api";
import socket from "../services/socket.js";

const CommandCenter = () => {
  const [sites, setSites] = useState([]);
  const [siteKpis, setSiteKpis] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCommandData = useCallback(async () => {
    try {
      setLoading(true);

      const [sitesResponse, alertsResponse] = await Promise.all([
        api.get("/sites"),
        api.get("/alerts"),
      ]);

      const siteList = sitesResponse.data.sites || [];

      setSites(siteList);
      setAlerts(alertsResponse.data.alerts || []);

      const kpiResults = await Promise.all(
        siteList.map(async (site) => {
          try {
            const response = await api.get(
              `/dashboard/kpis?period=today&siteId=${site.id}`
            );

            return {
              siteId: site.id,
              kpis: response.data.kpis,
            };
          } catch (error) {
            console.error(
              `Failed to fetch KPI for site ${site.id}`,
              error
            );

            return {
              siteId: site.id,
              kpis: null,
            };
          }
        })
      );

      const kpiMap = {};

      kpiResults.forEach((result) => {
        kpiMap[result.siteId] = result.kpis;
      });

      setSiteKpis(kpiMap);
    } catch (error) {
      console.error(
        "Failed to fetch command center data:",
        error
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
  fetchCommandData();

  socket.connect();

  const handleCommandUpdate = () => {
    fetchCommandData();
  };

  socket.on("journey:created", handleCommandUpdate);
  socket.on("journey:eligibility-decided", handleCommandUpdate);
  socket.on("journey:service-started", handleCommandUpdate);
  socket.on("journey:service-completed", handleCommandUpdate);
  socket.on("journey:exited", handleCommandUpdate);
  socket.on("journey:verification-failed", handleCommandUpdate);
  socket.on("queue:changed", handleCommandUpdate);
  socket.on("alert:created", handleCommandUpdate);

  return () => {
    socket.off("journey:created", handleCommandUpdate);
    socket.off(
      "journey:eligibility-decided",
      handleCommandUpdate
    );
    socket.off(
      "journey:service-started",
      handleCommandUpdate
    );
    socket.off(
      "journey:service-completed",
      handleCommandUpdate
    );
    socket.off("journey:exited", handleCommandUpdate);
    socket.off(
      "journey:verification-failed",
      handleCommandUpdate
    );
    socket.off("queue:changed", handleCommandUpdate);
    socket.off("alert:created", handleCommandUpdate);
  };
}, [fetchCommandData]);

  const activeSites = sites.filter(
    (site) => site.isActive
  ).length;

  const totalVehicles = Object.values(siteKpis).reduce(
    (total, kpi) =>
      total + (kpi?.vehiclesInJourney || 0),
    0
  );

  const totalQueue = Object.values(siteKpis).reduce(
    (total, kpi) =>
      total + (kpi?.queueLength || 0),
    0
  );

  const totalBays = Object.values(siteKpis).reduce(
    (total, kpi) =>
      total + (kpi?.bays?.total || 0),
    0
  );

  const occupiedBays = Object.values(siteKpis).reduce(
    (total, kpi) =>
      total + (kpi?.bays?.occupied || 0),
    0
  );

  const averageWaitingTimes = Object.values(siteKpis)
    .map((kpi) => kpi?.averageWaitingTimeMinutes)
    .filter((value) => typeof value === "number");

  const averageWait =
    averageWaitingTimes.length > 0
      ? averageWaitingTimes.reduce(
          (sum, value) => sum + value,
          0
        ) / averageWaitingTimes.length
      : 0;

  const openAlerts = alerts.filter(
    (alert) => alert.status === "OPEN"
  );

  const criticalAlerts = openAlerts.filter(
    (alert) => alert.severity === "CRITICAL"
  );

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">
            <Activity
              size={24}
              className="text-blue-600"
            />

            <h1 className="text-2xl font-bold text-slate-900">
              Central Command
            </h1>
          </div>

          <p className="mt-1 text-sm text-slate-500">
            Monitor operations across all service stations.
          </p>
        </div>

        <button
          onClick={fetchCommandData}
          className="flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />

          Refresh
        </button>

      </div>

      {/* Network KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        <KpiCard
          icon={Building2}
          title="Active Sites"
          value={activeSites}
          subtitle={`${sites.length} total sites`}
        />

        <KpiCard
          icon={Car}
          title="Vehicles"
          value={totalVehicles}
          subtitle="Currently in journey"
        />

        <KpiCard
          icon={Clock3}
          title="Network Queue"
          value={totalQueue}
          subtitle="Vehicles waiting"
        />

        <KpiCard
          icon={Wrench}
          title="Bay Utilization"
          value={
            totalBays > 0
              ? `${Math.round(
                  (occupiedBays / totalBays) * 100
                )}%`
              : "0%"
          }
          subtitle={`${occupiedBays} / ${totalBays} occupied`}
        />

      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <KpiCard
          icon={Clock3}
          title="Average Wait"
          value={`${averageWait.toFixed(1)} min`}
          subtitle="Across active sites"
        />

        <KpiCard
          icon={AlertTriangle}
          title="Open Alerts"
          value={openAlerts.length}
          subtitle="Require attention"
        />

        <KpiCard
          icon={Server}
          title="Critical Alerts"
          value={criticalAlerts.length}
          subtitle="Immediate attention"
        />

      </div>

      {/* Sites */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="font-bold text-slate-900">
            Site Performance
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Current operational status for each service station.
          </p>
        </div>

        <div className="divide-y divide-slate-100">

          {loading ? (
            <div className="py-14 text-center">
              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-blue-500"
              />

              <p className="mt-3 text-sm text-slate-500">
                Loading site information...
              </p>
            </div>
          ) : sites.length === 0 ? (
            <div className="py-14 text-center">
              <Building2
                size={38}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                No sites found
              </p>
            </div>
          ) : (
            sites.map((site) => {
              const kpis = siteKpis[site.id];

              const utilization =
                kpis?.bays?.total > 0
                  ? Math.round(
                      (kpis.bays.occupied /
                        kpis.bays.total) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={site.id}
                  className="p-5"
                >

                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

                    {/* Site info */}
                    <div className="flex items-start gap-3">

                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                          site.isActive
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        <Building2 size={21} />
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-bold text-slate-900">
                            {site.name}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              site.isActive
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {site.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>

                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {site.code} · {site.city},{" "}
                          {site.state}
                        </p>
                      </div>

                    </div>

                    {/* Site metrics */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

                      <Metric
                        label="Vehicles"
                        value={
                          kpis?.vehiclesInJourney ?? 0
                        }
                      />

                      <Metric
                        label="Queue"
                        value={
                          kpis?.queueLength ?? 0
                        }
                      />

                      <Metric
                        label="Bays"
                        value={
                          `${kpis?.bays?.occupied ?? 0}/${kpis?.bays?.total ?? 0}`
                        }
                      />

                      <Metric
                        label="Utilization"
                        value={`${utilization}%`}
                      />

                    </div>

                  </div>

                </div>
              );
            })
          )}

        </div>

      </div>

      {/* Critical Alerts */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

          <div>
            <h2 className="font-bold text-slate-900">
              Critical Alerts
            </h2>

            <p className="mt-1 text-xs text-slate-500">
              High-priority events requiring attention.
            </p>
          </div>

          <AlertTriangle
            size={21}
            className="text-red-500"
          />

        </div>

        <div className="divide-y divide-slate-100">

          {criticalAlerts.length === 0 ? (
            <div className="px-5 py-10 text-center">

              <CheckCircle2
                size={34}
                className="mx-auto text-emerald-500"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                No critical alerts
              </p>

              <p className="mt-1 text-xs text-slate-400">
                All critical operations are clear.
              </p>

            </div>
          ) : (
            criticalAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start gap-3 px-5 py-4"
              >

                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
                  <AlertTriangle size={18} />
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">

                    <p className="text-sm font-semibold text-slate-800">
                      {alert.title}
                    </p>

                    <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
                      CRITICAL
                    </span>

                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    {alert.message}
                  </p>

                  <p className="mt-1 text-xs text-slate-400">
                    Site #{alert.siteId}
                    {alert.journeyId
                      ? ` · Journey #${alert.journeyId}`
                      : ""}
                  </p>
                </div>

              </div>
            ))
          )}

        </div>

      </div>

    </div>
  );
};

const KpiCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
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

const Metric = ({ label, value }) => {
  return (
    <div className="min-w-[80px] rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
};

export default CommandCenter;
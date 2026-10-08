import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Camera as CameraIcon,
  CheckCircle2,
  Clock3,
  Power,
  RefreshCw,
  Signal,
  Wrench,
  XCircle,
} from "lucide-react";

import api from "../services/api";
import socket from "../services/socket";

const statusConfig = {
  ONLINE: {
    label: "Online",
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-700",
    iconBg: "bg-emerald-50",
    iconColor: "text-emerald-600",
    border: "border-emerald-200",
  },

  OFFLINE: {
    label: "Offline",
    icon: XCircle,
    badge: "bg-red-100 text-red-700",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    border: "border-red-200",
  },

  DEGRADED: {
    label: "Degraded",
    icon: Wrench,
    badge: "bg-yellow-100 text-yellow-700",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    border: "border-yellow-200",
  },
};

const formatDate = (date) => {
  if (!date) return "No heartbeat recorded";

  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatStatus = (status) => {
  if (!status) return "-";

  return status
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const Cameras = () => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [updatingCameraId, setUpdatingCameraId] = useState(null);

  // -----------------------------------------
  // Fetch cameras
  // -----------------------------------------
  const fetchCameras = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/cameras");

      setCameras(response.data.cameras || []);
    } catch (error) {
      console.error("Failed to fetch cameras:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // -----------------------------------------
  // Initial load
  // -----------------------------------------
  useEffect(() => {
    fetchCameras();
  }, [fetchCameras]);

  // -----------------------------------------
  // Socket.IO camera updates
  // -----------------------------------------
  useEffect(() => {
    socket.connect();

    const handleCameraChanged = () => {
      fetchCameras();
    };

    socket.on("camera:changed", handleCameraChanged);

    return () => {
      socket.off("camera:changed", handleCameraChanged);
      socket.disconnect();
    };
  }, [fetchCameras]);

  // -----------------------------------------
  // Update camera status
  // -----------------------------------------
  const updateCameraStatus = async (cameraId, status) => {
    try {
      setUpdatingCameraId(cameraId);

      await api.put(`/cameras/${cameraId}/status`, {
        status,
      });

      // Refresh immediately after successful update.
      await fetchCameras();
    } catch (error) {
      console.error(
        "Failed to update camera status:",
        error
      );

      alert(
        error.response?.data?.message ||
          "Failed to update camera status"
      );
    } finally {
      setUpdatingCameraId(null);
    }
  };

  // -----------------------------------------
  // Filter cameras
  // -----------------------------------------
  const filteredCameras = useMemo(() => {
    if (statusFilter === "ALL") {
      return cameras;
    }

    return cameras.filter(
      (camera) => camera.status === statusFilter
    );
  }, [cameras, statusFilter]);

  // -----------------------------------------
  // Summary counts
  // -----------------------------------------
  const onlineCount = cameras.filter(
    (camera) => camera.status === "ONLINE"
  ).length;

  const offlineCount = cameras.filter(
    (camera) => camera.status === "OFFLINE"
  ).length;

  const degradedCount = cameras.filter(
    (camera) => camera.status === "DEGRADED"
  ).length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>
          <div className="flex items-center gap-2">

            <CameraIcon
              size={23}
              className="text-blue-600"
            />

            <h1 className="text-2xl font-bold text-slate-900">
              Cameras
            </h1>

          </div>

          <p className="mt-1 text-sm text-slate-500">
            Monitor camera connectivity and station health.
          </p>
        </div>

        <button
          onClick={fetchCameras}
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
          title="Online"
          value={onlineCount}
          subtitle="Cameras operational"
          icon={CheckCircle2}
          bg="bg-emerald-50"
          color="text-emerald-600"
        />

        <SummaryCard
          title="Offline"
          value={offlineCount}
          subtitle="Requires attention"
          icon={XCircle}
          bg="bg-red-50"
          color="text-red-600"
        />

        <SummaryCard
          title="Degraded"
          value={degradedCount}
          subtitle="Performance issues"
          icon={Wrench}
          bg="bg-yellow-50"
          color="text-yellow-600"
        />

      </div>

      {/* Filter */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">

        <div>
          <h2 className="font-bold text-slate-900">
            Camera Health
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Monitor the health of cameras connected to each station.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value)
          }
          className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500"
        >
          <option value="ALL">All Cameras</option>
          <option value="ONLINE">Online</option>
          <option value="OFFLINE">Offline</option>
          <option value="DEGRADED">Degraded</option>
        </select>

      </div>

      {/* Camera cards */}
      {loading ? (

        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <RefreshCw
            size={28}
            className="mx-auto animate-spin text-blue-500"
          />

          <p className="mt-3 text-sm text-slate-500">
            Loading cameras...
          </p>

        </div>

      ) : filteredCameras.length === 0 ? (

        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">

          <CameraIcon
            size={38}
            className="mx-auto text-slate-300"
          />

          <p className="mt-3 text-sm font-semibold text-slate-600">
            No cameras found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            No cameras match the selected status.
          </p>

        </div>

      ) : (

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredCameras.map((camera) => {

            const config =
              statusConfig[camera.status] ||
              statusConfig.OFFLINE;

            const Icon = config.icon;

            const isUpdating =
              updatingCameraId === camera.id;

            return (
              <div
                key={camera.id}
                className={`rounded-xl border bg-white p-5 shadow-sm ${config.border}`}
              >

                {/* Header */}
                <div className="flex items-start justify-between gap-3">

                  <div className="flex items-center gap-3">

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-lg ${config.iconBg} ${config.iconColor}`}
                    >
                      <CameraIcon size={21} />
                    </div>

                    <div>

                      <p className="text-xs text-slate-500">
                        Camera
                      </p>

                      <h2 className="font-bold text-slate-900">
                        {camera.cameraCode ||
                          `CAM-${camera.id}`}
                      </h2>

                    </div>

                  </div>

                  <span
                    className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${config.badge}`}
                  >

                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        camera.status === "ONLINE"
                          ? "bg-emerald-500"
                          : camera.status === "DEGRADED"
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                    />

                    {config.label}

                  </span>

                </div>

                {/* Camera details */}
                <div className="mt-5 space-y-4 border-t border-slate-100 pt-4">

                  <div>

                    <p className="text-xs text-slate-400">
                      Name
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {camera.name || "-"}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-slate-400">
                      Location
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {camera.location || "-"}
                    </p>

                  </div>

                  <div>

                    <p className="text-xs text-slate-400">
                      Site
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {camera.site?.name ||
                        `Site #${camera.siteId}`}
                    </p>

                  </div>

                  <div>

                    <p className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Clock3 size={13} />
                      Last Heartbeat
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700">
                      {formatDate(
                        camera.lastHeartbeatAt
                      )}
                    </p>

                  </div>

                </div>

                {/* Footer */}
                <div className="mt-5 border-t border-slate-100 pt-3">

                  <div className="flex items-center justify-between">

                    <div className="flex items-center gap-1.5 text-xs text-slate-500">

                      <Signal size={14} />

                      <span>
                        {formatStatus(camera.status)}
                      </span>

                    </div>

                    <span className="text-xs text-slate-400">
                      ID #{camera.id}
                    </span>

                  </div>

                  {/* Camera simulation controls */}
                  <div className="mt-4 flex gap-2">

                    {camera.status !== "OFFLINE" && (

                      <button
                        onClick={() =>
                          updateCameraStatus(
                            camera.id,
                            "OFFLINE"
                          )
                        }
                        disabled={isUpdating}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        <Power size={14} />

                        {isUpdating
                          ? "Updating..."
                          : "Simulate Offline"}

                      </button>

                    )}

                    {camera.status === "OFFLINE" && (

                      <button
                        onClick={() =>
                          updateCameraStatus(
                            camera.id,
                            "ONLINE"
                          )
                        }
                        disabled={isUpdating}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >

                        <Power size={14} />

                        {isUpdating
                          ? "Updating..."
                          : "Bring Online"}

                      </button>

                    )}

                  </div>

                </div>

              </div>
            );
          })}

        </div>
      )}

    </div>
  );
};


// -----------------------------------------
// Summary Card
// -----------------------------------------

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

export default Cameras;
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Car,
  MapPin,
  Clock,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Activity,
} from "lucide-react";

import api from "../services/api";

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

function TimelineItem({ event, isLast }) {
  const failed =
    event.eventType === "ALERT_CREATED" ||
    event.newStatus === "HOLD" ||
    event.metadata?.decision === "NOT_ELIGIBLE";

  return (
    <div className="relative flex gap-4">
      {!isLast && (
        <div className="absolute left-[11px] top-7 h-full w-px bg-slate-200" />
      )}

      <div
        className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          failed
            ? "bg-orange-100 text-orange-600"
            : "bg-blue-100 text-blue-600"
        }`}
      >
        {failed ? (
          <AlertTriangle size={13} />
        ) : (
          <CheckCircle2 size={13} />
        )}
      </div>

      <div className="pb-7">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <p className="text-sm font-semibold text-slate-800">
            {formatStatus(event.eventType)}
          </p>

          <span className="text-xs text-slate-400">
            {formatDate(event.eventTime)}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500">
          <span>
            Source:{" "}
            <span className="font-medium text-slate-700">
              {event.source}
            </span>
          </span>

          {event.previousStatus && event.newStatus && (
            <span>
              {event.previousStatus} → {event.newStatus}
            </span>
          )}
        </div>

        {event.metadata?.reason && (
          <p className="mt-2 rounded-lg bg-orange-50 px-3 py-2 text-xs text-orange-700">
            {event.metadata.reason}
          </p>
        )}
      </div>
    </div>
  );
}

function VerificationCard({ verification }) {
  const verified = verification.status === "VERIFIED";

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-800">
            {formatStatus(verification.type)}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Reference: {verification.referenceNumber || "-"}
          </p>
        </div>

        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            verified
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {formatStatus(verification.status)}
        </span>
      </div>

      {verification.errorMessage && (
        <div className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-700">
          {verification.errorMessage}
        </div>
      )}

      {verification.responseData && (
        <div className="mt-3 rounded-lg bg-slate-50 p-3">
          <p className="mb-2 text-xs font-semibold text-slate-500">
            Service Response
          </p>

          <div className="space-y-1 text-xs text-slate-600">
            {Object.entries(verification.responseData).map(
              ([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between gap-4"
                >
                  <span className="font-medium">
                    {formatStatus(key)}
                  </span>

                  <span>
                    {typeof value === "boolean"
                      ? value
                        ? "Yes"
                        : "No"
                      : String(value)}
                  </span>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JourneyDetail({ journeyId, onBack }) {
  const [journey, setJourney] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJourney = async () => {
      try {
        setLoading(true);

        const response = await api.get(`/journeys/${journeyId}`);

        setJourney(response.data.journey);
      } catch (error) {
        console.error("Failed to fetch journey:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJourney();
  }, [journeyId]);

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-sm text-slate-500">
          Loading journey...
        </p>
      </div>
    );
  }

  if (!journey) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-700">
          Journey not found
        </p>

        <button
          onClick={onBack}
          className="mt-4 text-sm font-medium text-red-700 underline"
        >
          Go back
        </button>
      </div>
    );
  }

  const { vehicle, site, timestamps, metrics } = journey;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={onBack}
            className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50"
          >
            <ArrowLeft size={18} />
          </button>

          <div>
            <p className="text-sm text-slate-500">
              Journey #{journey.id}
            </p>

            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              {vehicle.registrationNumber}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              statusStyles[journey.status] ||
              "bg-slate-100 text-slate-600"
            }`}
          >
            {formatStatus(journey.status)}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              journey.eligibilityStatus === "ELIGIBLE"
                ? "bg-green-50 text-green-700"
                : journey.eligibilityStatus === "NOT_ELIGIBLE"
                  ? "bg-red-50 text-red-700"
                  : "bg-slate-100 text-slate-600"
            }`}
          >
            {formatStatus(journey.eligibilityStatus) ||
              "Pending"}
          </span>
        </div>
      </div>

      {/* Vehicle + Site */}
      <div className="grid gap-4 lg:grid-cols-2">

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Car size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Vehicle
              </p>

              <h2 className="font-bold text-slate-900">
                {vehicle.registrationNumber}
              </h2>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-400">
                Type
              </p>
              <p className="mt-1 text-sm font-medium">
                {vehicle.vehicleType}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Make / Model
              </p>
              <p className="mt-1 text-sm font-medium">
                {vehicle.make} {vehicle.model}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-400">
                Owner
              </p>
              <p className="mt-1 text-sm font-medium">
                {vehicle.ownerName}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <MapPin size={20} />
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Station
              </p>

              <h2 className="font-bold text-slate-900">
                {site.name}
              </h2>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-sm text-slate-700">
              {site.address}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {site.city}, {site.state}
            </p>

            <p className="mt-3 text-xs font-medium text-slate-500">
              Site Code: {site.code}
            </p>
          </div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

        <MetricCard
          title="Waiting Time"
          value={metrics.waitingTimeMinutes}
        />

        <MetricCard
          title="Service Time"
          value={metrics.serviceTimeMinutes}
        />

        <MetricCard
          title="Turnaround Time"
          value={metrics.turnaroundTimeMinutes}
        />

      </div>

      {/* Timeline + Verification */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Timeline */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Activity
              size={19}
              className="text-blue-600"
            />

            <h2 className="font-bold text-slate-900">
              Journey Timeline
            </h2>
          </div>

          {journey.timeline?.length ? (
            <div>
              {journey.timeline.map((event, index) => (
                <TimelineItem
                  key={event.id}
                  event={event}
                  isLast={
                    index === journey.timeline.length - 1
                  }
                />
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No timeline events available.
            </p>
          )}
        </div>

        {/* Verification */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <ShieldCheck
              size={19}
              className="text-blue-600"
            />

            <h2 className="font-bold text-slate-900">
              Verification Results
            </h2>
          </div>

          <div className="space-y-3">
            {journey.verification?.length ? (
              journey.verification.map((item) => (
                <VerificationCard
                  key={item.id}
                  verification={item}
                />
              ))
            ) : (
              <p className="text-sm text-slate-500">
                No verification results available.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Alert */}
      {journey.alerts?.length > 0 && (
        <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle
              size={20}
              className="mt-0.5 text-orange-600"
            />

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-bold text-orange-900">
                  Alerts
                </h2>

                <span className="rounded-full bg-orange-200 px-2 py-0.5 text-[10px] font-bold text-orange-800">
                  {journey.alerts.length}
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {journey.alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="rounded-lg border border-orange-200 bg-white p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">
                        {alert.title}
                      </p>

                      <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-bold text-red-700">
                        {alert.severity}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-600">
                      {alert.message}
                    </p>

                    <p className="mt-2 text-xs text-slate-400">
                      {formatDate(alert.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timestamp Details */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-5 flex items-center gap-2">
          <Clock
            size={19}
            className="text-blue-600"
          />

          <h2 className="font-bold text-slate-900">
            Journey Timestamps
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Timestamp
            label="Entry"
            value={timestamps.entryTime}
          />

          <Timestamp
            label="Identification"
            value={timestamps.identificationTime}
          />

          <Timestamp
            label="Verification"
            value={timestamps.verificationTime}
          />

          <Timestamp
            label="Queue"
            value={timestamps.queueTime}
          />

          <Timestamp
            label="Service Start"
            value={timestamps.serviceStartTime}
          />

          <Timestamp
            label="Service Complete"
            value={timestamps.serviceEndTime}
          />

          <Timestamp
            label="Exit"
            value={timestamps.exitTime}
          />
        </div>
      </div>

    </div>
  );
}

function MetricCard({ title, value }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-2xl font-bold text-slate-900">
        {value != null ? `${value} min` : "-"}
      </p>
    </div>
  );
}

function Timestamp({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-medium text-slate-700">
        {formatDate(value)}
      </p>
    </div>
  );
}
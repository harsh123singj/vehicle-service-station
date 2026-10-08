import {
  AlertTriangle,
  AlertCircle,
  Info,
  Clock
} from "lucide-react";

const severityStyles = {
  CRITICAL: {
    container: "border-red-200 bg-red-50",
    icon: "text-red-600",
    badge: "bg-red-100 text-red-700"
  },
  HIGH: {
    container: "border-orange-200 bg-orange-50",
    icon: "text-orange-600",
    badge: "bg-orange-100 text-orange-700"
  },
  MEDIUM: {
    container: "border-yellow-200 bg-yellow-50",
    icon: "text-yellow-600",
    badge: "bg-yellow-100 text-yellow-700"
  },
  LOW: {
    container: "border-blue-200 bg-blue-50",
    icon: "text-blue-600",
    badge: "bg-blue-100 text-blue-700"
  }
};

export default function ActiveAlerts({ alerts = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Active Alerts
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Issues requiring operator attention
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
          <AlertTriangle size={18} />
        </div>

      </div>

      {/* Alerts */}
      <div className="divide-y divide-slate-100">

        {alerts.length === 0 ? (
          <div className="px-5 py-10 text-center">

            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50">
              <AlertCircle
                size={22}
                className="text-emerald-500"
              />
            </div>

            <p className="mt-3 text-sm font-medium text-slate-600">
              No active alerts
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Everything is operating normally.
            </p>

          </div>
        ) : (
          alerts.map((alert) => {

            const style =
              severityStyles[alert.severity] ||
              severityStyles.MEDIUM;

            return (
              <div
                key={alert.id}
                className="px-5 py-4"
              >

                <div className="flex gap-3">

                  <div
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${style.container}`}
                  >
                    <AlertTriangle
                      size={18}
                      className={style.icon}
                    />
                  </div>

                  <div className="min-w-0 flex-1">

                    <div className="flex flex-wrap items-center gap-2">

                      <p className="text-sm font-semibold text-slate-800">
                        {alert.title}
                      </p>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${style.badge}`}
                      >
                        {alert.severity}
                      </span>

                    </div>

                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      {alert.message}
                    </p>

                    <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-400">
                      <Clock size={12} />

                      {alert.createdAt
                        ? new Date(
                            alert.createdAt
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : "Recently"}
                    </div>

                  </div>

                </div>

              </div>
            );
          })
        )}

      </div>

    </div>
  );
}
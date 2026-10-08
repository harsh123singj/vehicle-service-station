import {
  Activity,
  Car,
  ShieldCheck,
  ListOrdered,
  Warehouse,
  Wrench,
  LogOut,
  AlertTriangle
} from "lucide-react";

const eventConfig = {
  "journey:created": {
    icon: Car,
    color: "bg-blue-50 text-blue-600",
    label: "Vehicle entered"
  },

  "journey:eligibility-decided": {
    icon: ShieldCheck,
    color: "bg-emerald-50 text-emerald-600",
    label: "Eligibility decided"
  },

  "queue:changed": {
    icon: ListOrdered,
    color: "bg-purple-50 text-purple-600",
    label: "Queue updated"
  },

  "journey:service-started": {
    icon: Wrench,
    color: "bg-cyan-50 text-cyan-600",
    label: "Service started"
  },

  "journey:service-completed": {
    icon: Wrench,
    color: "bg-green-50 text-green-600",
    label: "Service completed"
  },

  "journey:exited": {
    icon: LogOut,
    color: "bg-slate-100 text-slate-600",
    label: "Vehicle exited"
  },

  "alert:created": {
    icon: AlertTriangle,
    color: "bg-red-50 text-red-600",
    label: "Alert created"
  },

  "journey:verification-failed": {
    icon: AlertTriangle,
    color: "bg-orange-50 text-orange-600",
    label: "Verification failed"
  }
};

export default function LiveEventFeed({ events = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

        <div>
          <div className="flex items-center gap-2">

            <h2 className="text-base font-semibold text-slate-900">
              Live Events
            </h2>

            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-600">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              LIVE
            </span>

          </div>

          <p className="mt-1 text-xs text-slate-400">
            Real-time station activity
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Activity size={18} />
        </div>

      </div>

      {/* Events */}
      <div className="divide-y divide-slate-100">

        {events.length === 0 ? (
          <div className="px-5 py-10 text-center">

            <Activity
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Waiting for events
            </p>

            <p className="mt-1 text-xs text-slate-400">
              New station activity will appear here automatically.
            </p>

          </div>
        ) : (
          events.map((event) => {

            const config =
              eventConfig[event.type] || {
                icon: Activity,
                color: "bg-slate-100 text-slate-600",
                label: event.type || "System event"
              };

            const Icon = config.icon;

            return (
              <div
                key={event.id}
                className="flex items-center gap-3 px-5 py-4"
              >

                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${config.color}`}
                >
                  <Icon size={17} />
                </div>

                <div className="min-w-0 flex-1">

                  <p className="text-sm font-medium text-slate-800">
                    {event.message || config.label}
                  </p>

                  {event.vehicle && (
                    <p className="mt-0.5 text-xs text-slate-400">
                      {event.vehicle}
                    </p>
                  )}

                </div>

                <span className="shrink-0 text-[11px] text-slate-400">
                  {event.time || "Now"}
                </span>

              </div>
            );
          })
        )}

      </div>

    </div>
  );
}
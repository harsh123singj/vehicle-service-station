import { Car, Clock } from "lucide-react";

const statusStyles = {
  ENTERED: "bg-blue-50 text-blue-700",
  IDENTIFIED: "bg-indigo-50 text-indigo-700",
  VERIFYING: "bg-yellow-50 text-yellow-700",
  ELIGIBLE: "bg-emerald-50 text-emerald-700",
  QUEUED: "bg-purple-50 text-purple-700",
  BAY_ASSIGNED: "bg-orange-50 text-orange-700",
  SERVICE_IN_PROGRESS: "bg-cyan-50 text-cyan-700",
  HOLD: "bg-red-50 text-red-700"
};

export default function CurrentVehicles({ vehicles = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Current Vehicles
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            Vehicles currently active at this station
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
          <Car size={18} />
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {vehicles.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Car
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              No active vehicles
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Vehicles will appear here when they enter the station.
            </p>
          </div>
        ) : (
          vehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                  <Car size={18} className="text-slate-600" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {vehicle.registrationNumber}
                  </p>

                  <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={12} />
                    {vehicle.time || "Recently entered"}
                  </div>
                </div>

              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  statusStyles[vehicle.status] ||
                  "bg-slate-100 text-slate-600"
                }`}
              >
                {vehicle.status?.replaceAll("_", " ") || "UNKNOWN"}
              </span>
            </div>
          ))
        )}
      </div>

    </div>
  );
}
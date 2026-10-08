import { Warehouse } from "lucide-react";

const bayStyles = {
  AVAILABLE: "bg-emerald-50 text-emerald-700 border-emerald-100",
  OCCUPIED: "bg-blue-50 text-blue-700 border-blue-100",
  MAINTENANCE: "bg-yellow-50 text-yellow-700 border-yellow-100",
  OUT_OF_SERVICE: "bg-red-50 text-red-700 border-red-100"
};

export default function BayStatus({ bays = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Bay Status
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Current service bay availability
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <Warehouse size={18} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 p-5">

        {bays.length === 0 ? (
          <div className="col-span-2 py-8 text-center">
            <Warehouse
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              No bays available
            </p>
          </div>
        ) : (
          bays.map((bay) => (
            <div
              key={bay.id}
              className={`rounded-lg border p-4 ${
                bayStyles[bay.status] ||
                "border-slate-200 bg-slate-50 text-slate-600"
              }`}
            >
              <div className="flex items-center justify-between">

                <p className="text-sm font-semibold">
                  Bay {bay.bayNumber}
                </p>

                <span className="h-2.5 w-2.5 rounded-full bg-current" />
              </div>

              <p className="mt-2 text-xs font-medium">
                {bay.status?.replaceAll("_", " ")}
              </p>

            </div>
          ))
        )}

      </div>

    </div>
  );
}
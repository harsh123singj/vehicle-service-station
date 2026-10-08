import { ListOrdered, Clock } from "lucide-react";

export default function QueuePanel({ queue = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">
            Queue
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Vehicles waiting for service
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
          <ListOrdered size={18} />
        </div>
      </div>

      <div className="divide-y divide-slate-100">

        {queue.length === 0 ? (
          <div className="px-5 py-10 text-center">

            <ListOrdered
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-medium text-slate-500">
              Queue is empty
            </p>

            <p className="mt-1 text-xs text-slate-400">
              Eligible vehicles will appear here.
            </p>

          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 px-5 py-4"
            >

              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                {item.position}
              </div>

              <div className="flex-1">
                <p className="text-sm font-semibold text-slate-800">
                  {item.registrationNumber}
                </p>

                <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock size={12} />
                  {item.waitingTime || "Waiting"}
                </div>
              </div>

              <span className="rounded-full bg-yellow-50 px-2.5 py-1 text-[11px] font-medium text-yellow-700">
                {item.status || "WAITING"}
              </span>

            </div>
          ))
        )}

      </div>

    </div>
  );
}
import {
  Car,
  ListOrdered,
  Wrench,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

const icons = {
  vehicles: Car,
  queue: ListOrdered,
  service: Wrench,
  completed: CheckCircle2,
  alerts: AlertTriangle
};

export default function KpiCard({
  type,
  title,
  value,
  subtitle
}) {
  const Icon = icons[type];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">

      <div className="flex items-start justify-between">

        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold text-slate-900">
            {value}
          </h3>

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
}
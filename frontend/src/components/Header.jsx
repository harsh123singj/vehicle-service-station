import {
  Menu,
  Bell,
  ChevronDown
} from "lucide-react";

export default function Header({
  onMenuClick
}) {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">

      <div className="flex items-center gap-3 sm:gap-4">

        {/* Mobile menu */}
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          aria-label="Open navigation"
        >
          <Menu size={22} />
        </button>

        <div>
          <p className="text-xs text-slate-500">
            Station Operations
          </p>

          <div className="mt-0.5 flex items-center gap-2 sm:gap-3">

            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Vehicle Service Station
            </h2>

            <div className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Online
            </div>

          </div>
        </div>

      </div>

      <div className="flex items-center gap-2 sm:gap-5">

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
          <Bell size={21} />

          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            3
          </span>
        </button>

        {/* User */}
        <button className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50">

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
            OP
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-slate-800">
              Operator
            </p>

            <p className="text-[10px] text-slate-500">
              Station Staff
            </p>
          </div>

          <ChevronDown
            size={16}
            className="text-slate-400"
          />

        </button>

      </div>

    </header>
  );
}
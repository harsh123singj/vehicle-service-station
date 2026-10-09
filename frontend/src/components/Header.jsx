
import { useState } from "react";
import { Menu, Bell, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import socket from "../services/socket";

export default function Header({ onMenuClick }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear saved authentication data
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Disconnect realtime connection
    socket.disconnect();

    // Close dropdown and return to login
    setProfileOpen(false);
    navigate("/login", { replace: true });
  };

  let user = {};

  try {
    user = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    user = {};
  }

  const userName = user.name || "Operator";
  const userRole = user.role || "Station Staff";
  const initials = userName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Mobile menu */}
        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
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
        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        >
          <Bell size={21} />

          <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
            3
          </span>
        </button>

        {/* User profile and logout */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((previous) => !previous)}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-50"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              {initials}
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-800">
                {userName}
              </p>

              <p className="text-[10px] text-slate-500">
                {userRole}
              </p>
            </div>

            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
            >
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {userName}
                </p>

                <p className="text-xs text-slate-500">
                  {userRole}
                </p>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={handleLogout}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-50"
              >
                <LogOut size={17} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

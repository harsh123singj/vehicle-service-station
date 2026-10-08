import {
  LayoutDashboard,
  Route,
  ListOrdered,
  Warehouse,
  Bell,
  Camera,
  FileText,
  Settings,
  Car,
  X,
  Activity,
  PlayCircle
} from "lucide-react";

import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import api from "../services/api.js";
import socket from "../services/socket.js";

const menuItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard",
  },
  {
    label: "Command Center",
    icon: Activity,
    path: "/command-center",
  },
  {
  label: "Simulator",
  icon: PlayCircle,
  path: "/simulator",
},
  {
    label: "Journeys",
    icon: Route,
    path: "/journeys",
  },
  {
    label: "Queue",
    icon: ListOrdered,
    path: "/queue",
  },
  {
    label: "Bays",
    icon: Warehouse,
    path: "/bays",
  },
  {
    label: "Alerts",
    icon: Bell,
    path: "/alerts",
  },
  {
    label: "Cameras",
    icon: Camera,
    path: "/cameras",
  },
  {
    label: "Audit Logs",
    icon: FileText,
    path: "/audit-logs",
  },
];

export default function Sidebar({ open, onClose }) {
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const response = await api.get("/alerts");

        const alerts = response.data.alerts || [];

        const openAlerts = alerts.filter(
          (alert) => alert.status === "OPEN"
        );

        setAlertCount(openAlerts.length);
      } catch (error) {
        console.error("Failed to fetch alert count:", error);
      }
    };

    // Initial alert count
    fetchAlertCount();

    // Connect to Socket.IO
    socket.connect();

    // Refresh count whenever a new alert is created
    const handleAlertCreated = () => {
      fetchAlertCount();
    };

    socket.on("alert:created", handleAlertCreated);

    return () => {
      socket.off("alert:created", handleAlertCreated);
    };
  }, []);

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      <aside
        className={`
          fixed left-0 top-0 z-50
          flex h-screen w-64 flex-col
          bg-slate-950 text-white
          transition-transform duration-300
          md:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Logo */}
        <div className="flex h-20 items-center justify-between border-b border-slate-800 px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
              <Car size={22} />
            </div>

            <div>
              <h1 className="text-sm font-bold">
                Smart Vehicle
              </h1>

              <p className="text-xs text-slate-400">
                Operations Platform
              </p>
            </div>
          </div>

          {/* Close button only on mobile */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-900 hover:text-white md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-5">
          {menuItems.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.label}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) => `
                  flex w-full items-center gap-3
                  rounded-lg px-4 py-3
                  text-sm transition
                  ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }
                `}
              >
                <Icon size={19} />

                <span>{item.label}</span>

                {/* Dynamic alert count */}
                {item.label === "Alerts" && alertCount > 0 && (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {alertCount}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={onClose}
            className="mb-3 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 hover:bg-slate-900 hover:text-white"
          >
            <Settings size={19} />
            Settings
          </button>

          <div className="flex items-center gap-3 rounded-lg bg-slate-900 p-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
              OP
            </div>

            <div>
              <p className="text-xs font-semibold">
                Operator
              </p>

              <p className="text-[10px] text-slate-400">
                Station Staff
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
import { useState } from "react";
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Journeys from "./pages/Journeys";
import JourneyDetail from "./pages/JourneyDetail";
import Queue from "./pages/Queue";
import Bays from "./pages/Bays";
import Alerts from "./pages/Alerts";
import Cameras from "./pages/Cameras";
import AuditLogs from "./pages/AuditLogs";
import CommandCenter from "./pages/CommandCenter";
import Simulator from "./pages/Simulator";


/* ---------------- Protected Route ---------------- */

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
};


/* ---------------- App Layout ---------------- */

const AppLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  const toggleSidebar = () => {
    setSidebarOpen((previous) => !previous);
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <Sidebar
        open={sidebarOpen}
        onClose={closeSidebar}
      />

      <div className="md:ml-64">

        <Header
          onMenuClick={toggleSidebar}
        />

        <main className="p-4 sm:p-6">
          <Routes>

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/journeys"
              element={<Journeys />}
            />

            <Route
              path="/journeys/:journeyId"
              element={<JourneyDetail />}
            />

            <Route
              path="/queue"
              element={<Queue />}
            />

            <Route
              path="/command-center"
              element={<CommandCenter />}
            />

            <Route
              path="/simulator"
              element={<Simulator />}
            />

            <Route
              path="/bays"
              element={<Bays />}
            />

            <Route
              path="/alerts"
              element={<Alerts />}
            />

            <Route
              path="/cameras"
              element={<Cameras />}
            />

            <Route
              path="/audit-logs"
              element={<AuditLogs />}
            />

          </Routes>
        </main>

      </div>
    </div>
  );
};


/* ---------------- Main App ---------------- */

const App = () => {
  return (
    <BrowserRouter>

      <Routes>

        {/* Login */}
        <Route
          path="/login"
          element={
            localStorage.getItem("token")
              ? <Navigate to="/dashboard" replace />
              : <Login />
          }
        />

        {/* Protected Application */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />

      </Routes>

    </BrowserRouter>
  );
};

export default App;
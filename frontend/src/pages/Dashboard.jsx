import { useCallback, useEffect, useState } from "react";

import socket from "../services/socket.js";
import api from "../services/api";

import KpiCard from "../components/KpiCard";
import CurrentVehicles from "../components/CurrentVehicles";
import QueuePanel from "../components/QueuePanel";
import BayStatus from "../components/BayStatus";
import ActiveAlerts from "../components/ActiveAlerts";
import LiveEventFeed from "../components/LiveEventFeed";

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);

  const [journeys, setJourneys] = useState([]);
  const [queue, setQueue] = useState([]);
  const [bays, setBays] = useState([]);
  const [alerts, setAlerts] = useState([]);

  const [events, setEvents] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * Fetch all dashboard data
   */
  const fetchDashboardData = useCallback(async () => {
    try {
      setError("");

      const [
        kpiResponse,
        journeyResponse,
        queueResponse,
        bayResponse,
        alertResponse
      ] = await Promise.all([
        api.get("/dashboard/kpis?period=today"),
        api.get("/journeys"),
        api.get("/queues"),
        api.get("/bays"),
        api.get("/alerts")
      ]);

      /*
       * KPI API response:
       *
       * {
       *   success: true,
       *   filters: {...},
       *   kpis: {
       *     totalJourneys: 4,
       *     vehiclesInJourney: 13,
       *     queueLength: 0,
       *     bays: {...}
       *   }
       * }
       */
      setKpis(kpiResponse.data);

      setJourneys(
        journeyResponse.data?.journeys || []
      );

      setQueue(
        queueResponse.data?.queues || []
      );

      setBays(
        bayResponse.data?.bays || []
      );

      setAlerts(
        (alertResponse.data?.alerts || []).filter(
          (alert) => alert.status === "OPEN"
        )
      );

    } catch (err) {
      console.error(
        "Failed to fetch dashboard data:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Failed to load dashboard data"
      );

    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Initial dashboard load
   */
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /*
   * Socket.IO real-time events
   */
  useEffect(() => {
    socket.connect();

    /*
     * Add an event to the live event feed.
     */
    const addLiveEvent = (
      type,
      message,
      vehicle = null
    ) => {
      const newEvent = {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type,
        message,
        vehicle,
        time: "Now"
      };

      setEvents((previousEvents) => [
        newEvent,
        ...previousEvents
      ].slice(0, 10));
    };

    /*
     * Vehicle entered
     */
    const handleJourneyCreated = (data) => {
      console.log(
        "Socket event: journey:created",
        data
      );

      addLiveEvent(
        "journey:created",
        "Vehicle entered the station",
        data?.journey?.vehicle?.registrationNumber ||
          data?.vehicle?.registrationNumber ||
          null
      );

      fetchDashboardData();
    };

    /*
     * Eligibility decision
     */
    const handleEligibilityDecided = (data) => {
      console.log(
        "Socket event: journey:eligibility-decided",
        data
      );

      addLiveEvent(
        "journey:eligibility-decided",
        "Vehicle eligibility decision completed",
        data?.journey?.vehicle?.registrationNumber ||
          data?.vehicle?.registrationNumber ||
          null
      );

      fetchDashboardData();
    };

    /*
     * Queue changed
     */
    const handleQueueChanged = (data) => {
      console.log(
        "Socket event: queue:changed",
        data
      );

      addLiveEvent(
        "queue:changed",
        "Queue updated"
      );

      fetchDashboardData();
    };

    /*
     * Service started
     */
    const handleServiceStarted = (data) => {
      console.log(
        "Socket event: journey:service-started",
        data
      );

      addLiveEvent(
        "journey:service-started",
        "Vehicle service started",
        data?.journey?.vehicle?.registrationNumber ||
          data?.vehicle?.registrationNumber ||
          null
      );

      fetchDashboardData();
    };

    /*
     * Service completed
     */
    const handleServiceCompleted = (data) => {
      console.log(
        "Socket event: journey:service-completed",
        data
      );

      addLiveEvent(
        "journey:service-completed",
        "Vehicle service completed",
        data?.journey?.vehicle?.registrationNumber ||
          data?.vehicle?.registrationNumber ||
          null
      );

      fetchDashboardData();
    };

    /*
     * Vehicle exited
     */
    const handleJourneyExited = (data) => {
      console.log(
        "Socket event: journey:exited",
        data
      );

      addLiveEvent(
        "journey:exited",
        "Vehicle exited the station",
        data?.journey?.vehicle?.registrationNumber ||
          data?.vehicle?.registrationNumber ||
          null
      );

      fetchDashboardData();
    };

    /*
     * Alert created
     */
    const handleAlertCreated = (data) => {
      console.log(
        "Socket event: alert:created",
        data
      );

      addLiveEvent(
        "alert:created",
        "New alert created"
      );

      fetchDashboardData();
    };

    /*
     * Verification failed
     */
    const handleVerificationFailed = (data) => {
      console.log(
        "Socket event: journey:verification-failed",
        data
      );

      addLiveEvent(
        "journey:verification-failed",
        "Vehicle verification failed"
      );

      fetchDashboardData();
    };

    /*
     * Register Socket.IO listeners
     */
    socket.on(
      "journey:created",
      handleJourneyCreated
    );

    socket.on(
      "journey:eligibility-decided",
      handleEligibilityDecided
    );

    socket.on(
      "queue:changed",
      handleQueueChanged
    );

    socket.on(
      "journey:service-started",
      handleServiceStarted
    );

    socket.on(
      "journey:service-completed",
      handleServiceCompleted
    );

    socket.on(
      "journey:exited",
      handleJourneyExited
    );

    socket.on(
      "alert:created",
      handleAlertCreated
    );

    socket.on(
      "journey:verification-failed",
      handleVerificationFailed
    );

    /*
     * Cleanup Socket.IO listeners
     */
    return () => {
      socket.off(
        "journey:created",
        handleJourneyCreated
      );

      socket.off(
        "journey:eligibility-decided",
        handleEligibilityDecided
      );

      socket.off(
        "queue:changed",
        handleQueueChanged
      );

      socket.off(
        "journey:service-started",
        handleServiceStarted
      );

      socket.off(
        "journey:service-completed",
        handleServiceCompleted
      );

      socket.off(
        "journey:exited",
        handleJourneyExited
      );

      socket.off(
        "alert:created",
        handleAlertCreated
      );

      socket.off(
        "journey:verification-failed",
        handleVerificationFailed
      );

      socket.disconnect();
    };
  }, [fetchDashboardData]);

  /*
   * Only show active journeys.
   */
  const activeJourneys = journeys.filter(
    (journey) =>
      ![
        "EXITED",
        "CANCELLED"
      ].includes(journey.currentStatus)
  );

  /*
   * Only show vehicles actually waiting
   * in the queue.
   */
  const waitingQueue = queue.filter(
    (item) =>
      [
        "WAITING",
        "CALLED"
      ].includes(item.status)
  );

  /*
   * Convert journey data for CurrentVehicles.
   */
  const currentVehicles = activeJourneys.map(
    (journey) => ({
      id: journey.id,

      registrationNumber:
        journey.vehicle?.registrationNumber ||
        `Vehicle #${journey.vehicleId}`,

      status: journey.currentStatus,

      time: journey.entryTime
        ? new Date(
            journey.entryTime
          ).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit"
          })
        : "Recently entered"
    })
  );

  /*
   * Convert queue data for QueuePanel.
   */
  const queueVehicles = waitingQueue.map(
    (item) => ({
      id: item.id,

      position: item.position,

      registrationNumber:
        item.journey?.vehicle?.registrationNumber ||
        `Vehicle #${
          item.journey?.vehicleId ||
          item.journeyId
        }`,

      status: item.status,

      waitingTime: item.joinedAt
        ? getWaitingTime(item.joinedAt)
        : "Waiting"
    })
  );

  /*
   * Loading state
   */
  if (loading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="text-sm text-slate-500">
          Loading dashboard...
        </div>
      </div>
    );
  }

  /*
   * Error state
   */
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div>

      {/* =========================
          PAGE HEADER
      ========================== */}

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-sm text-slate-500">
            Overview
          </p>

          <h1 className="mt-1 text-2xl font-bold text-slate-900">
            Station Dashboard
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Live overview of vehicles, queue, bays and station activity.
          </p>
        </div>

        <div className="w-fit rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-500">
          Today
        </div>

      </div>


      {/* =========================
          KPI CARDS
      ========================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">

        <KpiCard
          type="vehicles"
          title="Vehicles"
          value={
            kpis?.kpis?.vehiclesInJourney ?? 0
          }
          subtitle="Currently in journey"
        />

        <KpiCard
          type="queue"
          title="Queue"
          value={
            kpis?.kpis?.queueLength ?? 0
          }
          subtitle="Vehicles waiting"
        />

        <KpiCard
          type="service"
          title="Occupied Bays"
          value={
            kpis?.kpis?.bays?.occupied ?? 0
          }
          subtitle="Currently occupied"
        />

        <KpiCard
          type="completed"
          title="Journeys"
          value={
            kpis?.kpis?.totalJourneys ?? 0
          }
          subtitle="Total today"
        />

        <KpiCard
          type="alerts"
          title="Alerts"
          value={alerts.length}
          subtitle="Active alerts"
        />

      </div>


      {/* =========================
          CURRENT VEHICLES + QUEUE
      ========================== */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        <CurrentVehicles
          vehicles={currentVehicles}
        />

        <QueuePanel
          queue={queueVehicles}
        />

      </div>


      {/* =========================
          BAY STATUS
      ========================== */}

      <div className="mt-6">

        <BayStatus
          bays={bays}
        />

      </div>


      {/* =========================
          ALERTS + LIVE EVENTS
      ========================== */}

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">

        <ActiveAlerts
          alerts={alerts}
        />

        <LiveEventFeed
          events={events}
        />

      </div>

    </div>
  );
}


/*
 * Calculate how long a vehicle
 * has been waiting in the queue.
 */
function getWaitingTime(joinedAt) {
  const start = new Date(
    joinedAt
  ).getTime();

  const now = Date.now();

  const difference = Math.max(
    0,
    now - start
  );

  const minutes = Math.floor(
    difference / (1000 * 60)
  );

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes === 1) {
    return "1 min";
  }

  return `${minutes} mins`;
}
import { useEffect, useState } from "react";

import {
  Play,
  Car,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

import api from "../services/api.js";

const Simulator = () => {
  const [sites, setSites] = useState([]);

  const [registrationNumber, setRegistrationNumber] = useState("");
  const [selectedSite, setSelectedSite] = useState("");

  const [journey, setJourney] = useState(null);

  const [loading, setLoading] = useState(false);
  const [currentAction, setCurrentAction] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // -----------------------------------------
  // Load sites
  // -----------------------------------------
  useEffect(() => {
    const fetchSites = async () => {
      try {
        const response = await api.get("/sites");

        const siteList = response.data.sites || [];

        setSites(siteList);

        if (siteList.length > 0) {
          setSelectedSite(String(siteList[0].id));
        }
      } catch (err) {
        console.error("Failed to load sites:", err);
        setError("Failed to load sites");
      }
    };

    fetchSites();
  }, []);

  // -----------------------------------------
  // Get error message
  // -----------------------------------------
  const getErrorMessage = (err) => {
    return (
      err?.response?.data?.message ||
      err?.response?.data?.error ||
      err?.message ||
      "Something went wrong"
    );
  };

  // -----------------------------------------
  // Normalize journey response
  // -----------------------------------------
  const normalizeJourney = (returnedJourney) => {
    if (!returnedJourney) {
      return null;
    }

    return {
      ...returnedJourney,

      currentStatus:
        returnedJourney.currentStatus ??
        returnedJourney.status,
    };
  };

  // -----------------------------------------
  // Generic action runner
  // -----------------------------------------
  const runAction = async (label, request) => {
  try {
    setLoading(true);
    setCurrentAction(label);

    setError("");
    setMessage("");

    const response = await request();

    const returnedJourney = response.data?.journey;

    if (!returnedJourney) {
      throw new Error("Journey data was not returned by the server");
    }

    // Normalize status because different backend
    // responses may use status or currentStatus.
    const normalizedJourney = {
      ...returnedJourney,
      currentStatus:
        returnedJourney.currentStatus ??
        returnedJourney.status
    };

    setJourney(normalizedJourney);

    setMessage(
      response.data?.message ||
      `${label} completed successfully`
    );

  } catch (error) {
    console.error(`${label} error:`, error);

    setError(
      error.response?.data?.message ||
      error.message ||
      `${label} failed`
    );

  } finally {
    setLoading(false);
    setCurrentAction("");
  }
};

  // -----------------------------------------
  // 1. Generate vehicle entry
  // -----------------------------------------
  const generateEntry = async () => {
    if (!registrationNumber.trim()) {
      setError("Enter a vehicle registration number");
      return;
    }

    if (!selectedSite) {
      setError("Select a site");
      return;
    }

    try {
      await runAction("Generating Entry", () =>
        api.post("/simulator/vehicle", {
          registrationNumber:
            registrationNumber.trim(),

          siteId: Number(selectedSite),
        })
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 2. Identify vehicle
  // -----------------------------------------
  const identifyVehicle = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    try {
      await runAction(
        "Identifying Vehicle",
        () =>
          api.post(
            `/simulator/vehicle/${journey.id}/identify`,
            {
              confidence: 0.95,
            }
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 3. Verify vehicle
  // -----------------------------------------
  const verifyVehicle = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    try {
      await runAction(
        "Verifying Vehicle",
        () =>
          api.post(
            `/simulator/vehicle/${journey.id}/verify`
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 4. Normal eligibility
  // -----------------------------------------
  const checkEligibility = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    try {
      await runAction(
        "Checking Eligibility",
        () =>
          api.post(
            `/simulator/vehicle/${journey.id}/eligibility`
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 5. Non eligible scenario
  // -----------------------------------------
  const simulateNonEligible = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    try {
      await runAction(
        "Simulating Non-Eligible",
        () =>
          api.post(
            `/simulator/vehicle/${journey.id}/non-eligible`
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 6. Verification failure scenario
  // -----------------------------------------
  const simulateVerificationFailure =
    async () => {
      if (!journey?.id) {
        setError("No active journey found");
        return;
      }

      try {
        await runAction(
          "Simulating Verification Failure",
          () =>
            api.post(
              `/simulator/vehicle/${journey.id}/verification-failure`
            )
        );
      } catch {
        // Error already handled by runAction
      }
    };

  // -----------------------------------------
  // 7. Add vehicle to queue
  // -----------------------------------------
  const addToQueue = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    if (journey.currentStatus !== "ELIGIBLE") {
      setError(
        `Vehicle must be ELIGIBLE before entering queue. Current status: ${journey.currentStatus}`
      );
      return;
    }

    try {
      await runAction(
        "Adding To Queue",
        () =>
          api.post(
            `/journeys/${journey.id}/queue`,
            {
              priority: 0,
            }
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 8. Assign bay
  // -----------------------------------------
  const assignBay = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    try {
      await runAction(
        "Assigning Bay",
        () =>
          api.post(
            `/journeys/${journey.id}/assign-bay`
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 9. Start service
  // -----------------------------------------
  const startService = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    try {
      await runAction(
        "Starting Service",
        () =>
          api.post(
            `/journeys/${journey.id}/start-service`
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 10. Complete service
  // -----------------------------------------
  const completeService = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    try {
      await runAction(
        "Completing Service",
        () =>
          api.post(
            `/journeys/${journey.id}/complete-service`,
            {
              notes:
                "Service completed through simulator",
            }
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // 11. Exit journey
  // -----------------------------------------
  const exitJourney = async () => {
    if (!journey?.id) {
      setError("No active journey found");
      return;
    }

    try {
      await runAction(
        "Exiting Journey",
        () =>
          api.post(
            `/journeys/${journey.id}/exit`
          )
      );
    } catch {
      // Error already handled by runAction
    }
  };

  // -----------------------------------------
  // Reset simulator
  // -----------------------------------------
  const resetSimulator = () => {
    setJourney(null);

    setMessage("");
    setError("");

    setLoading(false);
    setCurrentAction("");

    setRegistrationNumber("");
  };

  const status = journey?.currentStatus;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3">

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Play size={22} />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Vehicle Simulator
            </h1>

            <p className="text-sm text-slate-500">
              Simulate the complete vehicle journey lifecycle
            </p>
          </div>

        </div>
      </div>

      {/* Simulator setup */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

        <h2 className="mb-5 text-lg font-semibold text-slate-900">
          Generate Vehicle Entry
        </h2>

        <div className="grid gap-5 md:grid-cols-2">

          {/* Registration */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Registration Number
            </label>

            <div className="relative">

              <Car
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={registrationNumber}
                onChange={(e) =>
                  setRegistrationNumber(
                    e.target.value.toUpperCase()
                  )
                }
                disabled={!!journey || loading}
                className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                placeholder="Enter vehicle number"
              />

            </div>

            <p className="mt-2 text-xs text-slate-500">
              New vehicles are automatically created for simulation.
            </p>
          </div>

          {/* Site */}
          <div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Site
            </label>

            <div className="relative">

              <MapPin
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={selectedSite}
                onChange={(e) =>
                  setSelectedSite(e.target.value)
                }
                disabled={!!journey || loading}
                className="w-full appearance-none rounded-lg border border-slate-300 bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
              >

                <option value="">
                  Select Site
                </option>

                {sites.map((site) => (
                  <option
                    key={site.id}
                    value={site.id}
                  >
                    {site.name}
                  </option>
                ))}

              </select>

            </div>
          </div>

        </div>

        <div className="mt-5 flex flex-wrap gap-3">

          {!journey ? (
            <button
              type="button"
              onClick={generateEntry}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <Play size={17} />

              {loading
                ? currentAction
                : "Generate Vehicle Entry"}

            </button>
          ) : (
            <button
              type="button"
              onClick={resetSimulator}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >

              <RotateCcw size={17} />

              New Simulation

            </button>
          )}

        </div>

      </div>

      {/* Success message */}
      {message && (
        <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">

          <CheckCircle2
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{message}</span>

        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">

          <AlertTriangle
            size={19}
            className="mt-0.5 shrink-0"
          />

          <span>{error}</span>

        </div>
      )}

      {/* Journey workflow */}
      {journey && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

          {/* Journey header */}
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

            <div>

              <p className="text-sm text-slate-500">
                Current Journey
              </p>

              <h2 className="text-xl font-bold text-slate-900">
                Journey #{journey.id}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {journey.registrationNumber ||
                  registrationNumber}
              </p>

            </div>

            <div className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
              {status}
            </div>

          </div>

          {/* Workflow */}
          <div className="space-y-3">

            {/* Identify */}
            <button
              type="button"
              onClick={identifyVehicle}
              disabled={
                loading ||
                status !== "ENTERED"
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-slate-900">
                    1. Identify Vehicle
                  </p>

                  <p className="text-xs text-slate-500">
                    Simulate camera/ANPR identification
                  </p>

                </div>

                <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  IDENTIFY
                </span>

              </div>

            </button>

            {/* Verify */}
            <button
              type="button"
              onClick={verifyVehicle}
              disabled={
                loading ||
                status !== "IDENTIFIED"
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-slate-900">
                    2. Verify Vehicle
                  </p>

                  <p className="text-xs text-slate-500">
                    Run simulated registration and compliance checks
                  </p>

                </div>

                <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  VERIFY
                </span>

              </div>

            </button>

            {/* Eligibility */}
            <button
              type="button"
              onClick={checkEligibility}
              disabled={
                loading ||
                status !== "VERIFYING"
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-slate-900">
                    3. Check Eligibility
                  </p>

                  <p className="text-xs text-slate-500">
                    Make backend eligibility decision
                  </p>

                </div>

                <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  ELIGIBILITY
                </span>

              </div>

            </button>

            {/* Queue */}
            <button
              type="button"
              onClick={addToQueue}
              disabled={
                loading ||
                status !== "ELIGIBLE"
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-slate-900">
                    4. Add To Queue
                  </p>

                  <p className="text-xs text-slate-500">
                    Place eligible vehicle into operational queue
                  </p>

                </div>

                <span className="rounded-lg bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                  QUEUE
                </span>

              </div>

            </button>

            {/* Bay */}
            <button
              type="button"
              onClick={assignBay}
              disabled={
                loading ||
                status !== "QUEUED"
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-purple-300 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-slate-900">
                    5. Assign Bay
                  </p>

                  <p className="text-xs text-slate-500">
                    Allocate an available service bay
                  </p>

                </div>

                <span className="rounded-lg bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  BAY
                </span>

              </div>

            </button>

            {/* Start service */}
            <button
              type="button"
              onClick={startService}
              disabled={
                loading ||
                status !== "BAY_ASSIGNED"
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-orange-300 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-slate-900">
                    6. Start Service
                  </p>

                  <p className="text-xs text-slate-500">
                    Start the vehicle service session
                  </p>

                </div>

                <span className="rounded-lg bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">
                  START
                </span>

              </div>

            </button>

            {/* Complete service */}
            <button
              type="button"
              onClick={completeService}
              disabled={
                loading ||
                status !== "SERVICE_IN_PROGRESS"
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-slate-900">
                    7. Complete Service
                  </p>

                  <p className="text-xs text-slate-500">
                    Finish service and release the bay
                  </p>

                </div>

                <span className="rounded-lg bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  COMPLETE
                </span>

              </div>

            </button>

            {/* Exit */}
            <button
              type="button"
              onClick={exitJourney}
              disabled={
                loading ||
                status !== "SERVICE_COMPLETED"
              }
              className="w-full rounded-xl border border-slate-200 p-4 text-left transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >

              <div className="flex items-center justify-between">

                <div>

                  <p className="font-semibold text-slate-900">
                    8. Exit Journey
                  </p>

                  <p className="text-xs text-slate-500">
                    Complete the vehicle journey
                  </p>

                </div>

                <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  EXIT
                </span>

              </div>

            </button>

          </div>

          {/* Negative scenarios */}
          {status === "VERIFYING" && (
            <div className="mt-6 border-t border-slate-200 pt-6">

              <h3 className="mb-1 text-sm font-semibold text-slate-900">
                Negative Test Scenarios
              </h3>

              <p className="mb-4 text-xs text-slate-500">
                Test failure handling and alert generation.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">

                <button
                  type="button"
                  onClick={simulateNonEligible}
                  disabled={loading}
                  className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Simulate Non-Eligible
                </button>

                <button
                  type="button"
                  onClick={
                    simulateVerificationFailure
                  }
                  disabled={loading}
                  className="rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-semibold text-orange-700 transition hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Simulate Verification Failure
                </button>

              </div>

            </div>
          )}

          {/* Completed */}
          {status === "EXITED" && (
            <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700">

              <CheckCircle2 size={20} />

              <div>

                <p className="font-semibold">
                  Journey Completed
                </p>

                <p className="text-xs">
                  Vehicle successfully exited the site.
                </p>

              </div>

            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Simulator;
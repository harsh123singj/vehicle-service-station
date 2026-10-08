import prisma from "../config/prisma.js";

const getPeriodStart = (period) => {
    const now = new Date();

    if (period === "24h") {
        return new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    if (period === "7d") {
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Default: today
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    return start;
};

const getDurationInMinutes = (start, end) => {
    if (!start || !end) return null;

    return (new Date(end) - new Date(start)) / (1000 * 60);
};

const average = (values) => {
    const validValues = values.filter(
        (value) => value !== null && !Number.isNaN(value)
    );

    if (validValues.length === 0) return 0;

    return validValues.reduce((sum, value) => sum + value, 0)
        / validValues.length;
};

const calculateOverlapMinutes = (start, end, periodStart, periodEnd) => {
    if (!start) return 0;

    const actualStart = Math.max(
        new Date(start).getTime(),
        periodStart.getTime()
    );

    const actualEnd = Math.min(
        new Date(end || periodEnd).getTime(),
        periodEnd.getTime()
    );

    if (actualEnd <= actualStart) return 0;

    return (actualEnd - actualStart) / (1000 * 60);
};

export const getDashboardKPIs = async (req, res) => {
    try {
        const { period = "today", siteId } = req.query;

        if (!["today", "24h", "7d"].includes(period)) {
            return res.status(400).json({
                success: false,
                message: "Invalid period. Use today, 24h or 7d."
            });
        }

        const periodStart = getPeriodStart(period);
        const periodEnd = new Date();

        const siteFilter = siteId
            ? { siteId: Number(siteId) }
            : {};

        /*
        -----------------------------------------
        1. JOURNEYS
        -----------------------------------------
        */

        const journeys = await prisma.journey.findMany({
            where: {
                ...siteFilter,
                entryTime: {
                    gte: periodStart,
                    lte: periodEnd
                }
            },
            include: {
                serviceSession: true,
                alerts: true,
                events: {
                    orderBy: {
                        eventTime: "asc"
                    }
                }
            }
        });

        /*
        -----------------------------------------
        2. CURRENT VEHICLES IN JOURNEY
        -----------------------------------------
        */

        const activeJourneys = await prisma.journey.count({
            where: {
                ...siteFilter,
                currentStatus: {
                    notIn: ["EXITED", "CANCELLED"]
                }
            }
        });

        /*
        -----------------------------------------
        3. QUEUE
        -----------------------------------------
        */

        const waitingQueue = await prisma.queue.count({
            where: {
                ...siteFilter,
                status: "WAITING"
            }
        });

        /*
        -----------------------------------------
        4. BAYS
        -----------------------------------------
        */

        const bays = await prisma.bay.findMany({
            where: siteFilter
        });

        const availableBays = bays.filter(
            (bay) => bay.status === "AVAILABLE"
        ).length;

        const occupiedBays = bays.filter(
            (bay) => bay.status === "OCCUPIED"
        ).length;

        const maintenanceBays = bays.filter(
            (bay) =>
                bay.status === "MAINTENANCE" ||
                bay.status === "OUT_OF_SERVICE"
        ).length;

        /*
        -----------------------------------------
        5. WAITING TIME
        Bay assignment - vehicle entry
        -----------------------------------------
        */

        const waitingTimes = [];

        for (const journey of journeys) {
            const bayAssignedEvent = journey.events.find(
                (event) => event.eventType === "BAY_ASSIGNED"
            );

            if (bayAssignedEvent) {
                const waitingTime = getDurationInMinutes(
                    journey.entryTime,
                    bayAssignedEvent.eventTime
                );

                if (waitingTime !== null) {
                    waitingTimes.push(waitingTime);
                }
            }
        }

        const averageWaitingTime = average(waitingTimes);

        /*
        -----------------------------------------
        6. SERVICE TIME
        Service completion - service start
        -----------------------------------------
        */

        const serviceTimes = journeys
            .map((journey) =>
                getDurationInMinutes(
                    journey.serviceStartTime,
                    journey.serviceEndTime
                )
            )
            .filter((value) => value !== null);

        const averageServiceTime = average(serviceTimes);

        /*
        -----------------------------------------
        7. TURNAROUND TIME
        Exit - Entry
        -----------------------------------------
        */

        const turnaroundTimes = journeys
            .map((journey) =>
                getDurationInMinutes(
                    journey.entryTime,
                    journey.exitTime
                )
            )
            .filter((value) => value !== null);

        const averageTurnaroundTime = average(turnaroundTimes);

        /*
        -----------------------------------------
        8. COMPLETED JOURNEYS / THROUGHPUT
        -----------------------------------------
        */

        const completedJourneys = journeys.filter(
            (journey) =>
                journey.currentStatus === "EXITED" ||
                journey.serviceEndTime !== null
        ).length;

        const periodHours =
            (periodEnd - periodStart) / (1000 * 60 * 60);

        const throughputPerHour =
            periodHours > 0
                ? completedJourneys / periodHours
                : 0;

        /*
        -----------------------------------------
        9. ELIGIBILITY RATE
        eligible / verified
        -----------------------------------------
        */

        const eligibilityEvents = [];

        for (const journey of journeys) {
            const decisionEvent = [...journey.events]
                .reverse()
                .find(
                    (event) =>
                        event.eventType === "ELIGIBILITY_DECIDED"
                );

            if (decisionEvent) {
                eligibilityEvents.push(decisionEvent);
            }
        }

        const verifiedCount = eligibilityEvents.length;

        const eligibleCount = eligibilityEvents.filter(
            (event) => event.newStatus === "ELIGIBLE"
        ).length;

        const eligibilityRate =
            verifiedCount > 0
                ? (eligibleCount / verifiedCount) * 100
                : 0;

        /*
        -----------------------------------------
        10. ALERT RATE
        journeys with alerts / total journeys
        -----------------------------------------
        */

        const alertingJourneys = journeys.filter(
            (journey) => journey.alerts.length > 0
        ).length;

        const alertRate =
            journeys.length > 0
                ? (alertingJourneys / journeys.length) * 100
                : 0;

        /*
        -----------------------------------------
        11. RESOURCE UTILIZATION
        Service-session occupied time /
        total bay availability
        -----------------------------------------
        */

        const serviceSessions = await prisma.serviceSession.findMany({
            where: {
                journey: siteFilter
            }
        });

        let occupiedMinutes = 0;

        for (const session of serviceSessions) {
            occupiedMinutes += calculateOverlapMinutes(
                session.startedAt,
                session.completedAt,
                periodStart,
                periodEnd
            );
        }

        const totalBayMinutes =
            bays.length *
            ((periodEnd - periodStart) / (1000 * 60));

        const resourceUtilization =
            totalBayMinutes > 0
                ? (occupiedMinutes / totalBayMinutes) * 100
                : 0;

        /*
        -----------------------------------------
        12. RESPONSE
        -----------------------------------------
        */

        return res.status(200).json({
            success: true,

            filters: {
                period,
                siteId: siteId ? Number(siteId) : null,
                from: periodStart,
                to: periodEnd
            },

            kpis: {
                totalJourneys: journeys.length,

                vehiclesInJourney: activeJourneys,

                queueLength: waitingQueue,

                bays: {
                    total: bays.length,
                    available: availableBays,
                    occupied: occupiedBays,
                    maintenance: maintenanceBays
                },

                averageWaitingTimeMinutes:
                    Number(averageWaitingTime.toFixed(2)),

                averageServiceTimeMinutes:
                    Number(averageServiceTime.toFixed(2)),

                averageTurnaroundTimeMinutes:
                    Number(averageTurnaroundTime.toFixed(2)),

                completedJourneys,

                throughputPerHour:
                    Number(throughputPerHour.toFixed(2)),

                eligibility: {
                    verified: verifiedCount,
                    eligible: eligibleCount,
                    rate: Number(eligibilityRate.toFixed(2))
                },

                alertRate: Number(alertRate.toFixed(2)),

                resourceUtilization: Number(
                    Math.min(resourceUtilization, 100).toFixed(2)
                )
            }
        });

    } catch (error) {
        console.error("Dashboard KPI error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to calculate dashboard KPIs"
        });
    }
};
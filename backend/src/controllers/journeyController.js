import prisma from "../config/prisma.js";
import { createAuditLog } from "../utils/auditLogger.js";
import { getIO } from "../config/socket.js";


// Create a new journey
export const createJourney = async (req, res) => {
    try {
        const { siteId, vehicleId, cameraId } = req.body;

        // Validate required fields
        if (!siteId || !vehicleId) {
            return res.status(400).json({
                success: false,
                message: "siteId and vehicleId are required"
            });
        }

        // Check site
        const site = await prisma.site.findUnique({
            where: {
                id: Number(siteId)
            }
        });

        if (!site) {
            return res.status(404).json({
                success: false,
                message: "Site not found"
            });
        }

        if (!site.isActive) {
            return res.status(400).json({
                success: false,
                message: "Site is not active"
            });
        }

        // Check vehicle
        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id: Number(vehicleId)
            }
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        // If camera is provided, check camera
        if (cameraId) {
            const camera = await prisma.camera.findUnique({
                where: {
                    id: Number(cameraId)
                }
            });

            if (!camera) {
                return res.status(404).json({
                    success: false,
                    message: "Camera not found"
                });
            }

            if (camera.siteId !== Number(siteId)) {
                return res.status(400).json({
                    success: false,
                    message: "Camera does not belong to this site"
                });
            }
        }

        // Create journey + first event in one transaction
        const result = await prisma.$transaction(async (tx) => {
            const journey = await tx.journey.create({
                data: {
                    siteId: Number(siteId),
                    vehicleId: Number(vehicleId),
                    cameraId: cameraId ? Number(cameraId) : null,
                    currentStatus: "ENTERED",
                    entryTime: new Date()
                }
            });

            const event = await tx.journeyEvent.create({
                data: {
                    journeyId: journey.id,
                    cameraId: cameraId ? Number(cameraId) : null,
                    eventType: "VEHICLE_ENTERED",
                    source: cameraId ? "CAMERA" : "OPERATOR",
                    newStatus: "ENTERED"
                }
            });


            return { journey, event };
        });

        const io = getIO();

        console.log("🔥 About to emit journey event");
        console.log("Connected clients:", io.sockets.sockets.size);
        io.emit("journey:created", {
            journeyId: result.journey.id,
            vehicleId: result.journey.vehicleId,
            siteId: result.journey.siteId,
            status: result.journey.currentStatus
        });

        console.log("🔥 Journey event emitted");
        await createAuditLog({
            userId: req.user?.userId || null,
            siteId: Number(siteId),
            action: "CREATE_JOURNEY",
            entityType: "Journey",
            entityId: String(result.journey.id),
            description: `Journey created for vehicle ${vehicle.registrationNumber}`,
            metadata: {
                vehicleId: Number(vehicleId),
                cameraId: cameraId ? Number(cameraId) : null
            }
        });

        return res.status(201).json({
            success: true,
            message: "Journey created successfully",
            journey: result.journey,
            event: result.event
        });

    } catch (error) {
        console.error("Create journey error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get all journeys
export const getAllJourneys = async (req, res) => {
    try {
        const journeys = await prisma.journey.findMany({
            include: {
                site: true,
                vehicle: true,
                camera: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: journeys.length,
            journeys
        });

    } catch (error) {
        console.error("Get journeys error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get journey by ID
export const getJourneyById = async (req, res) => {
    try {
        const journeyId = Number(req.params.id);

        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        const journey = await prisma.journey.findUnique({
            where: {
                id: journeyId
            },

            include: {
                vehicle: true,

                site: true,

                camera: true,

                events: {
                    orderBy: {
                        eventTime: "asc"
                    }
                },

                verifications: {
                    orderBy: {
                        checkedAt: "asc"
                    }
                },

                queue: true,

                serviceSession: {
                    include: {
                        bay: true
                    }
                },

                alerts: {
                    orderBy: {
                        createdAt: "asc"
                    }
                }
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        /*
        -----------------------------------------
        GET AUDIT LOGS FOR THIS JOURNEY
        -----------------------------------------
        */

        const auditLogs = await prisma.auditLog.findMany({
            where: {
                entityType: "Journey",
                entityId: String(journeyId)
            },

            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                }
            },

            orderBy: {
                createdAt: "asc"
            }
        });

        /*
        -----------------------------------------
        WAITING TIME
        BAY ASSIGNED - ENTRY
        -----------------------------------------
        */

        const bayAssignedEvent = journey.events.find(
            (event) => event.eventType === "BAY_ASSIGNED"
        );

        let waitingTimeMinutes = null;

        if (bayAssignedEvent) {
            waitingTimeMinutes =
                (new Date(bayAssignedEvent.eventTime) -
                    new Date(journey.entryTime)) /
                (1000 * 60);
        }

        /*
        -----------------------------------------
        SERVICE TIME
        SERVICE COMPLETED - SERVICE STARTED
        -----------------------------------------
        */

        let serviceTimeMinutes = null;

        if (
            journey.serviceStartTime &&
            journey.serviceEndTime
        ) {
            serviceTimeMinutes =
                (new Date(journey.serviceEndTime) -
                    new Date(journey.serviceStartTime)) /
                (1000 * 60);
        }

        /*
        -----------------------------------------
        TURNAROUND TIME
        EXIT - ENTRY
        -----------------------------------------
        */

        let turnaroundTimeMinutes = null;

        if (journey.entryTime && journey.exitTime) {
            turnaroundTimeMinutes =
                (new Date(journey.exitTime) -
                    new Date(journey.entryTime)) /
                (1000 * 60);
        }

        /*
        -----------------------------------------
        RESPONSE
        -----------------------------------------
        */

        return res.status(200).json({
            success: true,

            journey: {
                id: journey.id,

                status: journey.currentStatus,

                eligibilityStatus: journey.eligibilityStatus,

                vehicle: journey.vehicle,

                site: journey.site,

                camera: journey.camera,

                timestamps: {
                    entryTime: journey.entryTime,

                    identificationTime:
                        journey.identificationTime,

                    verificationTime:
                        journey.verificationTime,

                    queueTime:
                        journey.queueTime,

                    serviceStartTime:
                        journey.serviceStartTime,

                    serviceEndTime:
                        journey.serviceEndTime,

                    exitTime:
                        journey.exitTime
                },

                metrics: {
                    waitingTimeMinutes:
                        waitingTimeMinutes !== null
                            ? Number(
                                waitingTimeMinutes.toFixed(2)
                            )
                            : null,

                    serviceTimeMinutes:
                        serviceTimeMinutes !== null
                            ? Number(
                                serviceTimeMinutes.toFixed(2)
                            )
                            : null,

                    turnaroundTimeMinutes:
                        turnaroundTimeMinutes !== null
                            ? Number(
                                turnaroundTimeMinutes.toFixed(2)
                            )
                            : null
                },

                verification: journey.verifications,

                queue: journey.queue,

                service: journey.serviceSession
                    ? {
                        id: journey.serviceSession.id,

                        status:
                            journey.serviceSession.status,

                        serviceType:
                            journey.serviceSession.serviceType,

                        startedAt:
                            journey.serviceSession.startedAt,

                        completedAt:
                            journey.serviceSession.completedAt,

                        notes:
                            journey.serviceSession.notes,

                        bay:
                            journey.serviceSession.bay
                    }
                    : null,

                alerts: journey.alerts,

                auditLogs,

                /*
                ---------------------------------
                EVIDENCE PLACEHOLDER
                ---------------------------------
                */

                evidence: {
                    available: false,
                    message:
                        "Evidence storage is not implemented. Camera/event references are available."
                },

                /*
                ---------------------------------
                COMPLETE EVENT TIMELINE
                ---------------------------------
                */

                timeline: journey.events.map((event) => ({
                    id: event.id,

                    eventType: event.eventType,

                    source: event.source,

                    previousStatus:
                        event.previousStatus,

                    newStatus:
                        event.newStatus,

                    eventTime:
                        event.eventTime,

                    cameraId:
                        event.cameraId,

                    externalEventId:
                        event.externalEventId,

                    metadata:
                        event.metadata
                }))
            }
        });

    } catch (error) {
        console.error(
            "Get journey details error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch journey details"
        });
    }
};


// Update journey status
export const updateJourneyStatus = async (req, res) => {
    try {
        const journeyId = Number(req.params.id);
        const { status } = req.body;

        // Validate journey ID
        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        // Validate status
        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        // Allowed state transitions
        const allowedTransitions = {
            ENTERED: ["IDENTIFIED", "CANCELLED"],
            IDENTIFIED: ["VERIFYING", "CANCELLED"],
            VERIFYING: ["ELIGIBLE", "NOT_ELIGIBLE", "HOLD", "CANCELLED"],
            ELIGIBLE: ["QUEUED", "CANCELLED"],
            NOT_ELIGIBLE: ["HOLD", "CANCELLED"],
            HOLD: ["VERIFYING", "CANCELLED"],
            QUEUED: ["BAY_ASSIGNED", "CANCELLED"],
            BAY_ASSIGNED: ["SERVICE_IN_PROGRESS", "CANCELLED"],
            SERVICE_IN_PROGRESS: ["SERVICE_COMPLETED", "CANCELLED"],
            SERVICE_COMPLETED: ["EXITED"],
            EXITED: [],
            CANCELLED: []
        };

        // Find journey
        const journey = await prisma.journey.findUnique({
            where: {
                id: journeyId
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        const currentStatus = journey.currentStatus;

        // Check if transition is allowed
        const allowedNextStatuses = allowedTransitions[currentStatus] || [];

        if (!allowedNextStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status transition from ${currentStatus} to ${status}`
            });
        }

        // Map status to event type
        const eventTypeMap = {
            IDENTIFIED: "VEHICLE_IDENTIFIED",
            VERIFYING: "VERIFICATION_STARTED",
            ELIGIBLE: "ELIGIBILITY_DECIDED",
            NOT_ELIGIBLE: "ELIGIBILITY_DECIDED",
            HOLD: "ELIGIBILITY_DECIDED",
            QUEUED: "VEHICLE_QUEUED",
            BAY_ASSIGNED: "BAY_ASSIGNED",
            SERVICE_IN_PROGRESS: "SERVICE_STARTED",
            SERVICE_COMPLETED: "SERVICE_COMPLETED",
            EXITED: "VEHICLE_EXITED",
            CANCELLED: "JOURNEY_CANCELLED"
        };

        // Update relevant timestamp
        const timestampData = {};

        switch (status) {
            case "IDENTIFIED":
                timestampData.identificationTime = new Date();
                break;

            case "VERIFYING":
            case "ELIGIBLE":
            case "NOT_ELIGIBLE":
            case "HOLD":
                timestampData.verificationTime = new Date();
                break;

            case "QUEUED":
                timestampData.queueTime = new Date();
                break;

            case "SERVICE_IN_PROGRESS":
                timestampData.serviceStartTime = new Date();
                break;

            case "SERVICE_COMPLETED":
                timestampData.serviceEndTime = new Date();
                break;

            case "EXITED":
                timestampData.exitTime = new Date();
                break;
        }

        // Update journey + create event in one transaction
        const result = await prisma.$transaction(async (tx) => {

            const updatedJourney = await tx.journey.update({
                where: {
                    id: journeyId
                },
                data: {
                    currentStatus: status,
                    ...timestampData
                }
            });

            const event = await tx.journeyEvent.create({
                data: {
                    journeyId: journeyId,
                    eventType: eventTypeMap[status],
                    source: "OPERATOR",
                    previousStatus: currentStatus,
                    newStatus: status
                }
            });

            return {
                journey: updatedJourney,
                event
            };
        });

        return res.status(200).json({
            success: true,
            message: "Journey status updated successfully",
            journey: result.journey,
            event: result.event
        });

    } catch (error) {
        console.error("Update journey status error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Assigning bay to queued journey
export const assignBay = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        // Find journey
        const journey = await prisma.journey.findUnique({
            where: {
                id: journeyId
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // Journey must be queued
        if (journey.currentStatus !== "QUEUED") {
            return res.status(400).json({
                success: false,
                message: "Only queued journeys can be assigned to a bay"
            });
        }

        // Find available bay at the same site
        const bay = await prisma.bay.findFirst({
            where: {
                siteId: journey.siteId,
                status: "AVAILABLE"
            },
            orderBy: {
                bayNumber: "asc"
            }
        });

        if (!bay) {
            return res.status(409).json({
                success: false,
                message: "No available bay at this site"
            });
        }

        // Assign bay + create service session + update journey
        const result = await prisma.$transaction(async (tx) => {

            const updatedBay = await tx.bay.update({
                where: {
                    id: bay.id
                },
                data: {
                    status: "OCCUPIED"
                }
            });

            const serviceSession = await tx.serviceSession.create({
                data: {
                    journeyId,
                    bayId: bay.id,
                    status: "IN_PROGRESS",
                    startedAt: new Date()
                }
            });

            const updatedJourney = await tx.journey.update({
                where: {
                    id: journeyId
                },
                data: {
                    currentStatus: "BAY_ASSIGNED",
                    serviceStartTime: new Date()
                }
            });

            const event = await tx.journeyEvent.create({
                data: {
                    journeyId,
                    eventType: "BAY_ASSIGNED",
                    source: "OPERATOR",
                    previousStatus: "QUEUED",
                    newStatus: "BAY_ASSIGNED"
                }
            });

            // Update queue
            await tx.queue.update({
                where: {
                    journeyId
                },
                data: {
                    status: "ASSIGNED"
                }
            });

            // Create audit log
            await createAuditLog({
                db: tx,
                userId: req.user.userId,
                siteId: journey.siteId,
                action: "ASSIGN_BAY",
                entityType: "Journey",
                entityId: journeyId,
                description: `Bay ${bay.bayNumber} assigned to Journey ${journeyId}`,
                metadata: {
                    bayId: bay.id,
                    bayNumber: bay.bayNumber
                }
            });

            return {
                bay: updatedBay,
                serviceSession,
                journey: updatedJourney,
                event
            };
        });

        return res.status(200).json({
            success: true,
            message: "Bay assigned successfully",
            bay: result.bay,
            serviceSession: result.serviceSession,
            journey: result.journey,
            event: result.event
        });

    } catch (error) {
        console.error("Assign bay error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Complete service for a journey
export const completeService = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);
        const { notes } = req.body;

        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        // Find journey with service session
        const journey = await prisma.journey.findUnique({
            where: {
                id: journeyId
            },
            include: {
                serviceSession: true
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // Service must be in progress
        if (
            journey.currentStatus !== "BAY_ASSIGNED" &&
            journey.currentStatus !== "SERVICE_IN_PROGRESS"
        ) {
            return res.status(400).json({
                success: false,
                message: "Journey is not currently in service"
            });
        }

        if (!journey.serviceSession) {
            return res.status(400).json({
                success: false,
                message: "No service session found for this journey"
            });
        }

        const result = await prisma.$transaction(async (tx) => {

            // Complete service session
            const serviceSession = await tx.serviceSession.update({
                where: {
                    journeyId
                },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date(),
                    notes: notes || null
                }
            });

            // Make bay available again
            const bay = await tx.bay.update({
                where: {
                    id: serviceSession.bayId
                },
                data: {
                    status: "AVAILABLE"
                }
            });

            // Update journey
            const updatedJourney = await tx.journey.update({
                where: {
                    id: journeyId
                },
                data: {
                    currentStatus: "SERVICE_COMPLETED",
                    serviceEndTime: new Date()
                }
            });

            // Create journey event
            const event = await tx.journeyEvent.create({
                data: {
                    journeyId,
                    eventType: "SERVICE_COMPLETED",
                    source: "OPERATOR",
                    previousStatus: journey.currentStatus,
                    newStatus: "SERVICE_COMPLETED"
                }
            });

            // Create audit log
            await createAuditLog({
                db: tx,
                userId: req.user?.userId || null,
                siteId: journey.siteId,
                action: "COMPLETE_SERVICE",
                entityType: "Journey",
                entityId: String(journeyId),
                description: `Service completed for Journey ${journeyId}`,
                metadata: {
                    serviceSessionId: serviceSession.id,
                    bayId: serviceSession.bayId,
                    notes: notes || null
                }
            });

            return {
                serviceSession,
                bay,
                journey: updatedJourney,
                event
            };
        });

        const io = getIO();

        io.emit("journey:service-completed", {
            journeyId: result.journey.id,
            siteId: result.journey.siteId,
            vehicleId: result.journey.vehicleId,
            status: result.journey.currentStatus,
            serviceEndTime: result.journey.serviceEndTime
        });

        return res.status(200).json({
            success: true,
            message: "Service completed successfully",
            serviceSession: result.serviceSession,
            bay: result.bay,
            journey: result.journey,
            event: result.event
        });

    } catch (error) {
        console.error("Complete service error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};

export const startService = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        // Find journey
        const journey = await prisma.journey.findUnique({
            where: {
                id: journeyId
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // Service can only start after bay assignment
        if (journey.currentStatus !== "BAY_ASSIGNED") {
            return res.status(400).json({
                success: false,
                message: `Cannot start service from ${journey.currentStatus}`
            });
        }

        // Find service session
        const serviceSession = await prisma.serviceSession.findUnique({
            where: {
                journeyId
            }
        });

        if (!serviceSession) {
            return res.status(404).json({
                success: false,
                message: "Service session not found"
            });
        }

        const result = await prisma.$transaction(async (tx) => {

            // Update journey
            const updatedJourney = await tx.journey.update({
                where: {
                    id: journeyId
                },
                data: {
                    currentStatus: "SERVICE_IN_PROGRESS",
                    serviceStartTime: new Date()
                }
            });



            // Make sure session is in progress
            const updatedSession = await tx.serviceSession.update({
                where: {
                    journeyId
                },
                data: {
                    status: "IN_PROGRESS",
                    startedAt: new Date()
                }
            });

            // Create event
            const event = await tx.journeyEvent.create({
                data: {
                    journeyId,
                    eventType: "SERVICE_STARTED",
                    source: "OPERATOR",
                    previousStatus: "BAY_ASSIGNED",
                    newStatus: "SERVICE_IN_PROGRESS"
                }
            });

            await createAuditLog({
                db: tx,
                userId: req.user?.userId || null,
                siteId: journey.siteId,
                action: "START_SERVICE",
                entityType: "Journey",
                entityId: String(journeyId),
                description: `Service started for Journey ${journeyId}`,
                metadata: {
                    serviceSessionId: updatedSession.id
                }
            });

            return {
                journey: updatedJourney,
                serviceSession: updatedSession,
                event
            };
        });

        const io = getIO();

        io.emit("journey:service-started", {
            journeyId: result.journey.id,
            siteId: result.journey.siteId,
            vehicleId: result.journey.vehicleId,
            status: result.journey.currentStatus,
            serviceStartTime: result.journey.serviceStartTime
        });

        return res.status(200).json({
            success: true,
            message: "Service started successfully",
            journey: result.journey,
            serviceSession: result.serviceSession,
            event: result.event
        });

    } catch (error) {
        console.error("Start service error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Exit journey
export const exitJourney = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        // Find journey
        const journey = await prisma.journey.findUnique({
            where: {
                id: journeyId
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // Journey must have completed service
        if (journey.currentStatus !== "SERVICE_COMPLETED") {
            return res.status(400).json({
                success: false,
                message: "Journey must complete service before exit"
            });
        }

        // Update journey + create event
        const result = await prisma.$transaction(async (tx) => {

            const updatedJourney = await tx.journey.update({
                where: {
                    id: journeyId
                },
                data: {
                    currentStatus: "EXITED",
                    exitTime: new Date()
                }
            });

            const event = await tx.journeyEvent.create({
                data: {
                    journeyId,
                    eventType: "VEHICLE_EXITED",
                    source: "OPERATOR",
                    previousStatus: "SERVICE_COMPLETED",
                    newStatus: "EXITED"
                }
            });

            await createAuditLog({
                db: tx,
                userId: req.user?.userId || null,
                siteId: journey.siteId,
                action: "EXIT_JOURNEY",
                entityType: "Journey",
                entityId: String(journeyId),
                description: `Journey ${journeyId} exited successfully`,
                metadata: {
                    previousStatus: "SERVICE_COMPLETED",
                    newStatus: "EXITED"
                }
            });

            return {
                journey: updatedJourney,
                event
            };
        });

        const io = getIO();

        io.emit("journey:exited", {
            journeyId: result.journey.id,
            siteId: result.journey.siteId,
            vehicleId: result.journey.vehicleId,
            status: result.journey.currentStatus,
            exitTime: result.journey.exitTime
        });

        return res.status(200).json({
            success: true,
            message: "Journey exited successfully",
            journey: result.journey,
            event: result.event
        });

    } catch (error) {
        console.error("Exit journey error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
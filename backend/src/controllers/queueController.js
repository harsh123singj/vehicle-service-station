import prisma from "../config/prisma.js";
import { getIO } from "../config/socket.js";
// Add a journey to the queue
export const addToQueue = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

        const {
            priority = 0
        } = req.body || {};

        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        // -----------------------------------------
        // 1. Find journey
        // -----------------------------------------

        const journey = await prisma.journey.findUnique({
            where: {
                id: journeyId
            }
        });

        console.log("QUEUE DEBUG:", {
    journeyId,
    currentStatus: journey?.currentStatus,
    eligibilityStatus: journey?.eligibilityStatus
});

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // -----------------------------------------
        // 2. Journey must be eligible
        // -----------------------------------------

        if (journey.currentStatus !== "ELIGIBLE") {
            return res.status(400).json({
                success: false,
                message:
                    "Only eligible journeys can enter the queue"
            });
        }

        // -----------------------------------------
        // 3. Prevent duplicate queue entry
        // -----------------------------------------

        const existingQueue =
            await prisma.queue.findUnique({
                where: {
                    journeyId
                }
            });

        if (existingQueue) {
            return res.status(409).json({
                success: false,
                message: "Journey is already in the queue"
            });
        }

        // -----------------------------------------
        // 4. Find next queue position
        // -----------------------------------------

        const lastQueueEntry =
            await prisma.queue.findFirst({
                where: {
                    siteId: journey.siteId,
                    status: "WAITING"
                },

                orderBy: {
                    position: "desc"
                }
            });

        const nextPosition =
            lastQueueEntry?.position
                ? lastQueueEntry.position + 1
                : 1;

        // -----------------------------------------
        // 5. Create queue + update journey
        // -----------------------------------------

        const result =
            await prisma.$transaction(async (tx) => {

                const queue =
                    await tx.queue.create({
                        data: {
                            journeyId,

                            siteId:
                                journey.siteId,

                            position:
                                nextPosition,

                            priority,

                            status:
                                "WAITING"
                        }
                    });

                const updatedJourney =
                    await tx.journey.update({
                        where: {
                            id: journeyId
                        },

                        data: {
                            currentStatus:
                                "QUEUED",

                            queueTime:
                                new Date()
                        }
                    });

                const event =
                    await tx.journeyEvent.create({
                        data: {
                            journeyId,

                            eventType:
                                "VEHICLE_QUEUED",

                            source:
                                "SYSTEM",

                            previousStatus:
                                "ELIGIBLE",

                            newStatus:
                                "QUEUED",

                            metadata: {
                                position:
                                    nextPosition,

                                priority
                            }
                        }
                    });

                return {
                    queue,
                    journey: updatedJourney,
                    event
                };
            });

        // -----------------------------------------
        // 6. Real-time queue update
        // -----------------------------------------

        const io = getIO();

        io.emit("queue:changed", {
            journeyId:
                result.journey.id,

            siteId:
                result.journey.siteId,

            queueId:
                result.queue.id,

            position:
                result.queue.position,

            status:
                result.queue.status,

            journeyStatus:
                result.journey.currentStatus
        });

        // -----------------------------------------
        // 7. Response
        // -----------------------------------------

        return res.status(201).json({
            success: true,

            message:
                "Journey added to queue successfully",

            queue:
                result.queue,

            journey:
                result.journey,

            event:
                result.event
        });

    } catch (error) {
        console.error(
            "Add to queue error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Internal server error"
        });
    }
};


// Get all queues
export const getAllQueues = async (req, res) => {
    try {
        const queues = await prisma.queue.findMany({
            include: {
                journey: {
                    include: {
                        vehicle: true
                    }
                },
                site: true
            },
            orderBy: [
                {
                    priority: "desc"
                },
                {
                    position: "asc"
                }
            ]
        });

        return res.status(200).json({
            success: true,
            count: queues.length,
            queues
        });

    } catch (error) {
        console.error("Get queues error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get queue by ID
export const getQueueById = async (req, res) => {
    try {
        const queueId = Number(req.params.id);

        if (Number.isNaN(queueId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid queue ID"
            });
        }

        const queue = await prisma.queue.findUnique({
            where: {
                id: queueId
            },
            include: {
                journey: {
                    include: {
                        vehicle: true
                    }
                },
                site: true
            }
        });

        if (!queue) {
            return res.status(404).json({
                success: false,
                message: "Queue entry not found"
            });
        }

        return res.status(200).json({
            success: true,
            queue
        });

    } catch (error) {
        console.error("Get queue error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
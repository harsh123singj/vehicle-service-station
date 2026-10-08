import prisma from "../config/prisma.js";
import { getIO } from "../config/socket.js";
import { verifyRegistration, verifyCompliance } from "../services/verificationSimulator.js";


export const simulateVehicleEntry = async (req, res) => {
    try {
        const {
            registrationNumber,
            siteId,
            cameraId
        } = req.body || {};

        // -----------------------------------------
        // 1. Validate request
        // -----------------------------------------
        if (!registrationNumber || !siteId) {
            return res.status(400).json({
                success: false,
                message: "registrationNumber and siteId are required"
            });
        }

        const parsedSiteId = Number(siteId);

        if (Number.isNaN(parsedSiteId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid siteId"
            });
        }

        const normalizedRegistration =
            registrationNumber.trim().toUpperCase();

        // -----------------------------------------
        // 2. Check site
        // -----------------------------------------
        const site = await prisma.site.findUnique({
            where: {
                id: parsedSiteId
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
                message: "Site is inactive"
            });
        }

        // -----------------------------------------
        // 3. Find OR create vehicle
        // -----------------------------------------
        let vehicle = await prisma.vehicle.findUnique({
            where: {
                registrationNumber: normalizedRegistration
            }
        });

        // Automatically create vehicle for simulator
        if (!vehicle) {
            vehicle = await prisma.vehicle.create({
                data: {
                    registrationNumber: normalizedRegistration,
                    vehicleType: "CAR",
                    make: "Honda",
                    model: "City",
                    ownerName: "Simulator Vehicle"
                }
            });
        }

        // -----------------------------------------
        // 4. Validate camera if provided
        // -----------------------------------------
        let camera = null;

        if (cameraId) {
            const parsedCameraId = Number(cameraId);

            if (Number.isNaN(parsedCameraId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid cameraId"
                });
            }

            camera = await prisma.camera.findUnique({
                where: {
                    id: parsedCameraId
                }
            });

            if (!camera) {
                return res.status(404).json({
                    success: false,
                    message: "Camera not found"
                });
            }

            if (camera.siteId !== parsedSiteId) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Camera does not belong to selected site"
                });
            }

            if (camera.status !== "ONLINE") {
                return res.status(400).json({
                    success: false,
                    message: "Camera is not online"
                });
            }
        }

        // -----------------------------------------
        // 5. Check for active journey
        // -----------------------------------------
        const activeJourney = await prisma.journey.findFirst({
            where: {
                vehicleId: vehicle.id,

                currentStatus: {
                    notIn: [
                        "EXITED",
                        "CANCELLED"
                    ]
                }
            }
        });

        if (activeJourney) {
            return res.status(409).json({
                success: false,
                message:
                    "Vehicle already has an active journey",
                journeyId: activeJourney.id
            });
        }

        // -----------------------------------------
        // 6. Create Journey + Event
        // -----------------------------------------
        const result = await prisma.$transaction(
            async (tx) => {

                const journey = await tx.journey.create({
                    data: {
                        siteId: parsedSiteId,
                        vehicleId: vehicle.id,
                        cameraId: camera?.id ?? null,
                        currentStatus: "ENTERED",
                        entryTime: new Date()
                    }
                });

                const event = await tx.journeyEvent.create({
                    data: {
                        journeyId: journey.id,
                        cameraId: camera?.id ?? null,
                        eventType: "VEHICLE_ENTERED",
                        source: "SIMULATOR",
                        previousStatus: null,
                        newStatus: "ENTERED",

                        metadata: {
                            registrationNumber:
                                vehicle.registrationNumber,

                            simulator: true,

                            confidence: 1.0
                        }
                    }
                });

                return {
                    journey,
                    event
                };
            }
        );

        // -----------------------------------------
        // 7. Emit realtime event
        // -----------------------------------------
        const io = getIO();

        io.emit("journey:created", {
            journeyId: result.journey.id,
            vehicleId: result.journey.vehicleId,
            siteId: result.journey.siteId,
            status: result.journey.currentStatus,
            registrationNumber:
                vehicle.registrationNumber,
            eventType: "VEHICLE_ENTERED"
        });

        // -----------------------------------------
        // 8. Send response
        // -----------------------------------------
        return res.status(201).json({
            success: true,

            message:
                "Vehicle entry simulated successfully",

            vehicle: {
                id: vehicle.id,

                registrationNumber:
                    vehicle.registrationNumber,

                vehicleType:
                    vehicle.vehicleType,

                make:
                    vehicle.make,

                model:
                    vehicle.model,

                ownerName:
                    vehicle.ownerName
            },

            journey: {
                id: result.journey.id,

                vehicleId:
                    result.journey.vehicleId,

                registrationNumber:
                    vehicle.registrationNumber,

                siteId:
                    result.journey.siteId,

                cameraId:
                    result.journey.cameraId,

                // IMPORTANT:
                // Simulator.jsx uses currentStatus
                currentStatus:
                    result.journey.currentStatus,

                // Keep status too for compatibility
                status:
                    result.journey.currentStatus,

                entryTime:
                    result.journey.entryTime
            },

            event: {
                id: result.event.id,

                eventType:
                    result.event.eventType,

                source:
                    result.event.source,

                eventTime:
                    result.event.eventTime
            }
        });

    } catch (error) {
        console.error(
            "Simulate vehicle entry error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to simulate vehicle entry"
        });
    }
};

// vehicle identification here

export const simulateVehicleIdentification = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

        const {
            confidence = 0.98
        } = req.body;

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
            },

            include: {
                vehicle: true
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // -----------------------------------------
        // 2. Validate current state
        // -----------------------------------------

        if (journey.currentStatus !== "ENTERED") {
            return res.status(400).json({
                success: false,
                message:
                    `Vehicle can only be identified from ENTERED state. Current state: ${journey.currentStatus}`
            });
        }

        // -----------------------------------------
        // 3. Validate confidence
        // -----------------------------------------

        if (
            typeof confidence !== "number" ||
            confidence < 0 ||
            confidence > 1
        ) {
            return res.status(400).json({
                success: false,
                message:
                    "confidence must be a number between 0 and 1"
            });
        }

        // -----------------------------------------
        // 4. Update Journey + create event
        // -----------------------------------------

        const result = await prisma.$transaction(
            async (tx) => {

                const updatedJourney =
                    await tx.journey.update({
                        where: {
                            id: journeyId
                        },

                        data: {
                            currentStatus: "IDENTIFIED",
                            identificationTime: new Date()
                        }
                    });

                const event =
                    await tx.journeyEvent.create({
                        data: {
                            journeyId,

                            cameraId:
                                journey.cameraId,

                            eventType:
                                "VEHICLE_IDENTIFIED",

                            source:
                                "SIMULATOR",

                            previousStatus:
                                "ENTERED",

                            newStatus:
                                "IDENTIFIED",

                            metadata: {
                                registrationNumber:
                                    journey.vehicle.registrationNumber,

                                confidence,

                                simulator: true
                            }
                        }
                    });

                return {
                    journey: updatedJourney,
                    event
                };
            }
        );

        // -----------------------------------------
        // 5. Socket.IO event
        // -----------------------------------------

        const io = getIO();

        io.emit("journey:identified", {
            journeyId:
                result.journey.id,

            vehicleId:
                result.journey.vehicleId,

            siteId:
                result.journey.siteId,

            status:
                result.journey.currentStatus,

            registrationNumber:
                journey.vehicle.registrationNumber,

            confidence
        });

        // -----------------------------------------
        // 6. Response
        // -----------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Vehicle identification simulated successfully",

            journey: {
                id:
                    result.journey.id,

                vehicleId:
                    result.journey.vehicleId,

                registrationNumber:
                    journey.vehicle.registrationNumber,

                siteId:
                    result.journey.siteId,

                status:
                    result.journey.currentStatus,

                identificationTime:
                    result.journey.identificationTime
            },

            event: {
                id:
                    result.event.id,

                eventType:
                    result.event.eventType,

                source:
                    result.event.source,

                confidence,

                eventTime:
                    result.event.eventTime
            }
        });

    } catch (error) {
        console.error(
            "Simulate vehicle identification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to simulate vehicle identification"
        });
    }
};


export const simulateVerification = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

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
            },
            include: {
                vehicle: true
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // -----------------------------------------
        // 2. State validation
        // -----------------------------------------

        if (journey.currentStatus !== "IDENTIFIED") {
            return res.status(400).json({
                success: false,
                message:
                    `Verification can only start from IDENTIFIED state. Current state: ${journey.currentStatus}`
            });
        }

        // -----------------------------------------
        // 3. Move journey to VERIFYING
        // -----------------------------------------

        await prisma.$transaction(async (tx) => {

            await tx.journey.update({
                where: {
                    id: journeyId
                },
                data: {
                    currentStatus: "VERIFYING"
                }
            });

            await tx.journeyEvent.create({
                data: {
                    journeyId,

                    cameraId:
                        journey.cameraId,

                    eventType:
                        "VERIFICATION_STARTED",

                    source:
                        "SIMULATOR",

                    previousStatus:
                        "IDENTIFIED",

                    newStatus:
                        "VERIFYING",

                    metadata: {
                        simulator: true
                    }
                }
            });
        });

        // -----------------------------------------
        // 4. Call simulated external services
        // -----------------------------------------

        const registrationResult =
            await verifyRegistration(
                journey.vehicle
            );

        const complianceResult =
            await verifyCompliance(
                journey.vehicle
            );

        // -----------------------------------------
        // 5. Store verification results
        // -----------------------------------------

        const result =
            await prisma.$transaction(async (tx) => {

                const registration =
                    await tx.verificationResult.upsert({
                        where: {
                            journeyId_type: {
                                journeyId,
                                type: "REGISTRATION"
                            }
                        },

                        update: {
                            status:
                                registrationResult.status,

                            referenceNumber:
                                registrationResult.referenceNumber,

                            responseData:
                                registrationResult.responseData,

                            checkedAt:
                                new Date(),

                            errorMessage:
                                registrationResult.errorMessage
                        },

                        create: {
                            journeyId,

                            type:
                                "REGISTRATION",

                            status:
                                registrationResult.status,

                            referenceNumber:
                                registrationResult.referenceNumber,

                            responseData:
                                registrationResult.responseData,

                            checkedAt:
                                new Date(),

                            errorMessage:
                                registrationResult.errorMessage
                        }
                    });

                const compliance =
                    await tx.verificationResult.upsert({
                        where: {
                            journeyId_type: {
                                journeyId,
                                type: "COMPLIANCE"
                            }
                        },

                        update: {
                            status:
                                complianceResult.status,

                            referenceNumber:
                                complianceResult.referenceNumber,

                            responseData:
                                complianceResult.responseData,

                            checkedAt:
                                new Date(),

                            errorMessage:
                                complianceResult.errorMessage
                        },

                        create: {
                            journeyId,

                            type:
                                "COMPLIANCE",

                            status:
                                complianceResult.status,

                            referenceNumber:
                                complianceResult.referenceNumber,

                            responseData:
                                complianceResult.responseData,

                            checkedAt:
                                new Date(),

                            errorMessage:
                                complianceResult.errorMessage
                        }
                    });

                const verificationTime =
                    new Date();

                const event =
                    await tx.journeyEvent.create({
                        data: {
                            journeyId,

                            cameraId:
                                journey.cameraId,

                            eventType:
                                "VERIFICATION_COMPLETED",

                            source:
                                "SIMULATOR",

                            previousStatus:
                                "VERIFYING",

                            newStatus:
                                "VERIFYING",

                            metadata: {
                                registration:
                                    registrationResult.status,

                                compliance:
                                    complianceResult.status,

                                simulator: true
                            }
                        }
                    });

                const updatedJourney =
                    await tx.journey.update({
                        where: {
                            id: journeyId
                        },

                        data: {
                            verificationTime
                        }
                    });

                return {
                    journey: updatedJourney,
                    registration,
                    compliance,
                    event
                };
            });

        // -----------------------------------------
        // 6. Real-time event
        // -----------------------------------------

        const io = getIO();

        io.emit(
            "journey:verification-completed",
            {
                journeyId:
                    result.journey.id,

                vehicleId:
                    result.journey.vehicleId,

                siteId:
                    result.journey.siteId,

                status:
                    result.journey.currentStatus,

                registration:
                    result.registration.status,

                compliance:
                    result.compliance.status,

                verificationTime:
                    result.journey.verificationTime
            }
        );

        // -----------------------------------------
        // 7. Response
        // -----------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Vehicle verification simulated successfully",

            journey: {
                id:
                    result.journey.id,

                status:
                    result.journey.currentStatus,

                verificationTime:
                    result.journey.verificationTime
            },

            verification: {
                registration: {
                    type:
                        result.registration.type,

                    status:
                        result.registration.status,

                    referenceNumber:
                        result.registration.referenceNumber,

                    responseData:
                        result.registration.responseData
                },

                compliance: {
                    type:
                        result.compliance.type,

                    status:
                        result.compliance.status,

                    referenceNumber:
                        result.compliance.referenceNumber,

                    responseData:
                        result.compliance.responseData
                }
            },

            event: {
                id:
                    result.event.id,

                eventType:
                    result.event.eventType,

                source:
                    result.event.source,

                eventTime:
                    result.event.eventTime
            }
        });

    } catch (error) {
        console.error(
            "Simulate verification error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to simulate verification"
        });
    }
};

// eligibility simulation here
export const simulateEligibility = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        // -----------------------------------------
        // 1. Find journey + verification results
        // -----------------------------------------

        const journey = await prisma.journey.findUnique({
            where: {
                id: journeyId
            },

            include: {
                vehicle: true,

                verifications: true
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // -----------------------------------------
        // 2. Validate current state
        // -----------------------------------------

        if (journey.currentStatus !== "VERIFYING") {
            return res.status(400).json({
                success: false,
                message:
                    `Eligibility can only be decided from VERIFYING state. Current state: ${journey.currentStatus}`
            });
        }

        // -----------------------------------------
        // 3. Get verification results
        // -----------------------------------------

        const registration =
            journey.verifications.find(
                (verification) =>
                    verification.type === "REGISTRATION"
            );

        const compliance =
            journey.verifications.find(
                (verification) =>
                    verification.type === "COMPLIANCE"
            );

        if (!registration || !compliance) {
            return res.status(400).json({
                success: false,
                message:
                    "Required verification results are missing"
            });
        }

        // -----------------------------------------
        // 4. Backend eligibility rules
        // -----------------------------------------

        let decision;
        let reason;

        if (
            registration.status === "VERIFIED" &&
            compliance.status === "VERIFIED"
        ) {
            decision = "ELIGIBLE";

            reason =
                "Registration and compliance verification passed";
        } else {
            decision = "NOT_ELIGIBLE";

            reason =
                "One or more required verification checks failed";
        }

        // -----------------------------------------
        // 5. Update Journey + create event
        // -----------------------------------------

        const result =
            await prisma.$transaction(async (tx) => {

                const updatedJourney =
                    await tx.journey.update({
                        where: {
                            id: journeyId
                        },

                        data: {
                            currentStatus: decision,

                            eligibilityStatus: decision,

                            verificationTime:
                                journey.verificationTime ||
                                new Date(),

                            rejectionReason:
                                decision === "NOT_ELIGIBLE"
                                    ? reason
                                    : null
                        }
                    });

                const event =
                    await tx.journeyEvent.create({
                        data: {
                            journeyId,

                            cameraId:
                                journey.cameraId,

                            eventType:
                                "ELIGIBILITY_DECIDED",

                            source:
                                "SIMULATOR",

                            previousStatus:
                                "VERIFYING",

                            newStatus:
                                decision,

                            metadata: {
                                decision,

                                reason,

                                registrationStatus:
                                    registration.status,

                                complianceStatus:
                                    compliance.status,

                                simulator: true
                            }
                        }
                    });

                return {
                    journey: updatedJourney,
                    event
                };
            });

        // -----------------------------------------
        // 6. Real-time event
        // -----------------------------------------

        const io = getIO();

        io.emit(
            "journey:eligibility-decided",
            {
                journeyId:
                    result.journey.id,

                vehicleId:
                    result.journey.vehicleId,

                siteId:
                    result.journey.siteId,

                status:
                    result.journey.currentStatus,

                eligibilityStatus:
                    result.journey.eligibilityStatus,

                decision,

                reason
            }
        );

        // -----------------------------------------
        // 7. Response
        // -----------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Eligibility decision generated successfully",

            journey: {
                id:
                    result.journey.id,

                status:
                    result.journey.currentStatus,

                eligibilityStatus:
                    result.journey.eligibilityStatus
            },

            decision: {
                result: decision,

                reason,

                registration:
                    registration.status,

                compliance:
                    compliance.status
            },

            event: {
                id:
                    result.event.id,

                eventType:
                    result.event.eventType,

                source:
                    result.event.source,

                eventTime:
                    result.event.eventTime
            }
        });

    } catch (error) {
        console.error(
            "Simulate eligibility error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate eligibility decision"
        });
    }
};

// non eligible vehicle / negative xase 

export const simulateNonEligible = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

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
            },
            include: {
                vehicle: true,
                verifications: true
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // -----------------------------------------
        // 2. Must be VERIFYING
        // -----------------------------------------

        if (journey.currentStatus !== "VERIFYING") {
            return res.status(400).json({
                success: false,
                message:
                    `Non-eligible simulation requires VERIFYING state. Current state: ${journey.currentStatus}`
            });
        }

        // -----------------------------------------
        // 3. Update verification + journey + alert
        // -----------------------------------------

        const result = await prisma.$transaction(async (tx) => {

            // Registration passes
            await tx.verificationResult.upsert({
                where: {
                    journeyId_type: {
                        journeyId,
                        type: "REGISTRATION"
                    }
                },

                update: {
                    status: "VERIFIED",
                    checkedAt: new Date(),
                    errorMessage: null,
                    responseData: {
                        source: "SIMULATED_REGISTRATION_SERVICE",
                        valid: true
                    }
                },

                create: {
                    journeyId,
                    type: "REGISTRATION",
                    status: "VERIFIED",
                    checkedAt: new Date(),
                    responseData: {
                        source: "SIMULATED_REGISTRATION_SERVICE",
                        valid: true
                    }
                }
            });

            // Compliance fails
            const compliance =
                await tx.verificationResult.upsert({
                    where: {
                        journeyId_type: {
                            journeyId,
                            type: "COMPLIANCE"
                        }
                    },

                    update: {
                        status: "FAILED",
                        checkedAt: new Date(),
                        errorMessage:
                            "Vehicle compliance certification is invalid",
                        responseData: {
                            source: "SIMULATED_COMPLIANCE_SERVICE",
                            certificationStatus: "INVALID",
                            complianceStatus: "NON_COMPLIANT",
                            valid: false
                        }
                    },

                    create: {
                        journeyId,
                        type: "COMPLIANCE",
                        status: "FAILED",
                        checkedAt: new Date(),
                        errorMessage:
                            "Vehicle compliance certification is invalid",
                        responseData: {
                            source: "SIMULATED_COMPLIANCE_SERVICE",
                            certificationStatus: "INVALID",
                            complianceStatus: "NON_COMPLIANT",
                            valid: false
                        }
                    }
                });

            const reason =
                "Vehicle compliance verification failed";

            // Journey moves to HOLD
            const updatedJourney =
                await tx.journey.update({
                    where: {
                        id: journeyId
                    },

                    data: {
                        currentStatus: "HOLD",
                        eligibilityStatus: "NOT_ELIGIBLE",
                        rejectionReason: reason,
                        holdReason: reason,
                        verificationTime:
                            journey.verificationTime ||
                            new Date()
                    }
                });

            // Eligibility event
            const event =
                await tx.journeyEvent.create({
                    data: {
                        journeyId,

                        cameraId:
                            journey.cameraId,

                        eventType:
                            "ELIGIBILITY_DECIDED",

                        source:
                            "SIMULATOR",

                        previousStatus:
                            "VERIFYING",

                        newStatus:
                            "HOLD",

                        metadata: {
                            decision: "NOT_ELIGIBLE",
                            reason,
                            registrationStatus: "VERIFIED",
                            complianceStatus: "FAILED",
                            simulator: true
                        }
                    }
                });

            // Create alert
            const alert =
                await tx.alert.create({
                    data: {
                        siteId:
                            journey.siteId,

                        journeyId,

                        severity:
                            "HIGH",

                        status:
                            "OPEN",

                        title:
                            "Vehicle Not Eligible",

                        message:
                            reason
                    }
                });

            // Alert event
            await tx.journeyEvent.create({
                data: {
                    journeyId,

                    cameraId:
                        journey.cameraId,

                    eventType:
                        "ALERT_CREATED",

                    source:
                        "SIMULATOR",

                    previousStatus:
                        "HOLD",

                    newStatus:
                        "HOLD",

                    metadata: {
                        alertId:
                            alert.id,

                        severity:
                            alert.severity
                    }
                }
            });

            return {
                journey: updatedJourney,
                compliance,
                event,
                alert
            };
        });

        // -----------------------------------------
        // 4. Socket.IO
        // -----------------------------------------

        const io = getIO();

        io.emit(
            "journey:eligibility-decided",
            {
                journeyId:
                    result.journey.id,

                vehicleId:
                    result.journey.vehicleId,

                siteId:
                    result.journey.siteId,

                status:
                    result.journey.currentStatus,

                eligibilityStatus:
                    result.journey.eligibilityStatus,

                decision:
                    "NOT_ELIGIBLE",

                reason:
                    result.journey.rejectionReason
            }
        );

        io.emit(
            "alert:created",
            {
                alertId:
                    result.alert.id,

                journeyId:
                    result.alert.journeyId,

                siteId:
                    result.alert.siteId,

                severity:
                    result.alert.severity,

                status:
                    result.alert.status,

                title:
                    result.alert.title,

                message:
                    result.alert.message
            }
        );

        // -----------------------------------------
        // 5. Response
        // -----------------------------------------

        return res.status(200).json({
            success: true,

            message:
                "Non-eligible vehicle scenario simulated successfully",

            journey: {
                id:
                    result.journey.id,

                status:
                    result.journey.currentStatus,

                eligibilityStatus:
                    result.journey.eligibilityStatus,

                holdReason:
                    result.journey.holdReason
            },

            verification: {
                registration:
                    "VERIFIED",

                compliance:
                    result.compliance.status
            },

            alert:
                result.alert,

            event:
                result.event
        });

    } catch (error) {
        console.error(
            "Simulate non-eligible error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to simulate non-eligible scenario"
        });
    }
};


// negative case 2 - verification failure
export const simulateVerificationFailure = async (req, res) => {
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
            },
            include: {
                vehicle: true
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        // Must already be in VERIFYING state
        if (journey.currentStatus !== "VERIFYING") {
            return res.status(400).json({
                success: false,
                message:
                    `Verification failure simulation requires VERIFYING state. Current state: ${journey.currentStatus}`
            });
        }

        const reason =
            "External verification service unavailable";

        const result = await prisma.$transaction(async (tx) => {

            // Registration service unavailable
            const registration =
                await tx.verificationResult.upsert({
                    where: {
                        journeyId_type: {
                            journeyId,
                            type: "REGISTRATION"
                        }
                    },

                    update: {
                        status: "TIMEOUT",
                        checkedAt: new Date(),
                        errorMessage: reason,
                        responseData: {
                            source:
                                "SIMULATED_REGISTRATION_SERVICE",
                            available: false
                        }
                    },

                    create: {
                        journeyId,
                        type: "REGISTRATION",
                        status: "TIMEOUT",
                        checkedAt: new Date(),
                        errorMessage: reason,
                        responseData: {
                            source:
                                "SIMULATED_REGISTRATION_SERVICE",
                            available: false
                        }
                    }
                });

            // Compliance service unavailable
            const compliance =
                await tx.verificationResult.upsert({
                    where: {
                        journeyId_type: {
                            journeyId,
                            type: "COMPLIANCE"
                        }
                    },

                    update: {
                        status: "ERROR",
                        checkedAt: new Date(),
                        errorMessage: reason,
                        responseData: {
                            source:
                                "SIMULATED_COMPLIANCE_SERVICE",
                            available: false
                        }
                    },

                    create: {
                        journeyId,
                        type: "COMPLIANCE",
                        status: "ERROR",
                        checkedAt: new Date(),
                        errorMessage: reason,
                        responseData: {
                            source:
                                "SIMULATED_COMPLIANCE_SERVICE",
                            available: false
                        }
                    }
                });

            // Put vehicle on HOLD
            const updatedJourney =
                await tx.journey.update({
                    where: {
                        id: journeyId
                    },

                    data: {
                        currentStatus: "HOLD",
                        eligibilityStatus: "HOLD",
                        holdReason: reason,
                        verificationTime:
                            journey.verificationTime ||
                            new Date()
                    }
                });

            // Create journey event
            const event =
                await tx.journeyEvent.create({
                    data: {
                        journeyId,

                        cameraId:
                            journey.cameraId,

                        eventType:
                            "VERIFICATION_COMPLETED",

                        source:
                            "SIMULATOR",

                        previousStatus:
                            "VERIFYING",

                        newStatus:
                            "HOLD",

                        metadata: {
                            result: "SOURCE_UNAVAILABLE",
                            registrationStatus:
                                registration.status,
                            complianceStatus:
                                compliance.status,
                            reason,
                            simulator: true
                        }
                    }
                });

            // Create alert
            const alert =
                await tx.alert.create({
                    data: {
                        siteId:
                            journey.siteId,

                        journeyId,

                        severity:
                            "CRITICAL",

                        status:
                            "OPEN",

                        title:
                            "Verification Service Unavailable",

                        message:
                            reason
                    }
                });

            // Alert event
            await tx.journeyEvent.create({
                data: {
                    journeyId,

                    cameraId:
                        journey.cameraId,

                    eventType:
                        "ALERT_CREATED",

                    source:
                        "SIMULATOR",

                    previousStatus:
                        "HOLD",

                    newStatus:
                        "HOLD",

                    metadata: {
                        alertId:
                            alert.id,
                        severity:
                            alert.severity
                    }
                }
            });

            return {
                journey: updatedJourney,
                registration,
                compliance,
                event,
                alert
            };
        });

        // Real-time journey event
        const io = getIO();

        io.emit("journey:verification-failed", {
            journeyId:
                result.journey.id,

            vehicleId:
                result.journey.vehicleId,

            siteId:
                result.journey.siteId,

            status:
                result.journey.currentStatus,

            reason
        });

        // Real-time alert
        io.emit("alert:created", {
            alertId:
                result.alert.id,

            journeyId:
                result.alert.journeyId,

            siteId:
                result.alert.siteId,

            severity:
                result.alert.severity,

            status:
                result.alert.status,

            title:
                result.alert.title,

            message:
                result.alert.message
        });

        return res.status(200).json({
            success: true,

            message:
                "Verification service failure simulated successfully",

            journey: {
                id:
                    result.journey.id,

                status:
                    result.journey.currentStatus,

                eligibilityStatus:
                    result.journey.eligibilityStatus,

                holdReason:
                    result.journey.holdReason
            },

            verification: {
                registration:
                    result.registration.status,

                compliance:
                    result.compliance.status,

                reason
            },

            alert:
                result.alert,

            event:
                result.event
        });

    } catch (error) {
        console.error(
            "Simulate verification failure error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to simulate verification service failure"
        });
    }
};
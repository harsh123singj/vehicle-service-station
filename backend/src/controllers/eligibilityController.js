import prisma from "../config/prisma.js";

export const decideEligibility = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

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
                verifications: true
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        const requiredTypes = [
            "REGISTRATION",
            "COMPLIANCE",
            "INSURANCE",
            "FITNESS"
        ];

        const verifications = journey.verifications;

        // Check whether all required verifications exist
        const missingTypes = requiredTypes.filter(
            (type) =>
                !verifications.some(
                    (verification) => verification.type === type
                )
        );

        if (missingTypes.length > 0) {
            return res.status(400).json({
                success: false,
                message: "All required verifications are not completed",
                missingTypes
            });
        }

        // Check for failed/error/timeout verification
        const failedVerification = verifications.find(
            (verification) =>
                verification.status === "FAILED" ||
                verification.status === "ERROR" ||
                verification.status === "TIMEOUT"
        );

        if (failedVerification) {
            const journey = await prisma.journey.update({
                where: {
                    id: journeyId
                },
                data: {
                    currentStatus: "NOT_ELIGIBLE",
                    eligibilityStatus: "NOT_ELIGIBLE",
                    rejectionReason:
                        `Verification failed: ${failedVerification.type}`
                }
            });

            await prisma.journeyEvent.create({
                data: {
                    journeyId,
                    eventType: "ELIGIBILITY_DECIDED",
                    source: "SYSTEM",
                    previousStatus: "VERIFYING",
                    newStatus: "NOT_ELIGIBLE",
                    metadata: {
                        reason: `Verification failed: ${failedVerification.type}`
                    }
                }
            });

            return res.status(200).json({
                success: true,
                message: "Vehicle is not eligible",
                eligibilityStatus: "NOT_ELIGIBLE",
                journey
            });
        }

        // All verifications must be VERIFIED
        const allVerified = verifications.every(
            (verification) => verification.status === "VERIFIED"
        );

        if (!allVerified) {
            const journey = await prisma.journey.update({
                where: {
                    id: journeyId
                },
                data: {
                    currentStatus: "HOLD",
                    eligibilityStatus: "HOLD",
                    holdReason: "Verification requires manual review"
                }
            });

            await prisma.journeyEvent.create({
                data: {
                    journeyId,
                    eventType: "ELIGIBILITY_DECIDED",
                    source: "SYSTEM",
                    previousStatus: "VERIFYING",
                    newStatus: "HOLD",
                    metadata: {
                        reason: "Verification requires manual review"
                    }
                }
            });

            return res.status(200).json({
                success: true,
                message: "Vehicle placed on hold",
                eligibilityStatus: "HOLD",
                journey
            });
        }

        // Everything verified
        const journeyUpdated = await prisma.journey.update({
            where: {
                id: journeyId
            },
            data: {
                currentStatus: "ELIGIBLE",
                eligibilityStatus: "ELIGIBLE",
                verificationTime: new Date()
            }
        });

        await prisma.journeyEvent.create({
            data: {
                journeyId,
                eventType: "ELIGIBILITY_DECIDED",
                source: "SYSTEM",
                previousStatus: "VERIFYING",
                newStatus: "ELIGIBLE"
            }
        });

        return res.status(200).json({
            success: true,
            message: "Vehicle is eligible",
            eligibilityStatus: "ELIGIBLE",
            journey: journeyUpdated
        });

    } catch (error) {
        console.error("Eligibility decision error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
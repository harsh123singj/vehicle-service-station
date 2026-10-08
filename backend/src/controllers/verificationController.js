import prisma from "../config/prisma.js";

// Create or update verification
export const createVerification = async (req, res) => {
    try {
        const journeyId = Number(req.params.journeyId);

        const {
            type,
            status,
            referenceNumber,
            responseData,
            errorMessage
        } = req.body;

        if (Number.isNaN(journeyId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid journey ID"
            });
        }

        if (!type || !status) {
            return res.status(400).json({
                success: false,
                message: "Verification type and status are required"
            });
        }

        // Check journey
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

        // Create verification
        const verification = await prisma.verificationResult.upsert({
            where: {
                journeyId_type: {
                    journeyId,
                    type
                }
            },
            update: {
                status,
                referenceNumber,
                responseData,
                checkedAt: new Date(),
                errorMessage
            },
            create: {
                journeyId,
                type,
                status,
                referenceNumber,
                responseData,
                checkedAt: new Date(),
                errorMessage
            }
        });

        return res.status(201).json({
            success: true,
            message: "Verification recorded successfully",
            verification
        });

    } catch (error) {
        console.error("Create verification error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get all verifications for a journey
export const getJourneyVerifications = async (req, res) => {
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
            }
        });

        if (!journey) {
            return res.status(404).json({
                success: false,
                message: "Journey not found"
            });
        }

        const verifications = await prisma.verificationResult.findMany({
            where: {
                journeyId
            },
            orderBy: {
                createdAt: "asc"
            }
        });

        return res.status(200).json({
            success: true,
            count: verifications.length,
            verifications
        });

    } catch (error) {
        console.error("Get verifications error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
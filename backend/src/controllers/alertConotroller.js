import prisma from "../config/prisma.js";


// Create alert
export const createAlert = async (req, res) => {
    try {
        const {
            siteId,
            journeyId,
            severity,
            title,
            message
        } = req.body;

        if (!siteId || !severity || !title || !message) {
            return res.status(400).json({
                success: false,
                message: "siteId, severity, title and message are required"
            });
        }

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

        if (journeyId) {
            const journey = await prisma.journey.findUnique({
                where: {
                    id: Number(journeyId)
                }
            });

            if (!journey) {
                return res.status(404).json({
                    success: false,
                    message: "Journey not found"
                });
            }
        }

        const alert = await prisma.alert.create({
            data: {
                siteId: Number(siteId),
                journeyId: journeyId ? Number(journeyId) : null,
                severity,
                title,
                message
            }
        });

        return res.status(201).json({
            success: true,
            message: "Alert created successfully",
            alert
        });

    } catch (error) {
        console.error("Create alert error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get all alerts
export const getAllAlerts = async (req, res) => {
    try {
        const alerts = await prisma.alert.findMany({
            include: {
                site: true,
                journey: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });

    } catch (error) {
        console.error("Get alerts error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get alert by ID
export const getAlertById = async (req, res) => {
    try {
        const alertId = Number(req.params.id);

        if (Number.isNaN(alertId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid alert ID"
            });
        }

        const alert = await prisma.alert.findUnique({
            where: {
                id: alertId
            },
            include: {
                site: true,
                journey: true
            }
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        return res.status(200).json({
            success: true,
            alert
        });

    } catch (error) {
        console.error("Get alert error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Acknowledge alert
export const acknowledgeAlert = async (req, res) => {
    try {
        const alertId = Number(req.params.id);

        if (Number.isNaN(alertId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid alert ID"
            });
        }

        const alert = await prisma.alert.findUnique({
            where: {
                id: alertId
            }
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        // Only OPEN alerts can be acknowledged
        if (alert.status !== "OPEN") {
            return res.status(400).json({
                success: false,
                message: `Alert cannot be acknowledged because it is ${alert.status}`
            });
        }

        const updatedAlert = await prisma.alert.update({
            where: {
                id: alertId
            },
            data: {
                status: "ACKNOWLEDGED",
                acknowledgedAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Alert acknowledged successfully",
            alert: updatedAlert
        });

    } catch (error) {
        console.error("Acknowledge alert error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Resolve alert
export const resolveAlert = async (req, res) => {
    try {
        const alertId = Number(req.params.id);

        if (Number.isNaN(alertId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid alert ID"
            });
        }

        const alert = await prisma.alert.findUnique({
            where: {
                id: alertId
            }
        });

        if (!alert) {
            return res.status(404).json({
                success: false,
                message: "Alert not found"
            });
        }

        // Only OPEN or ACKNOWLEDGED alerts can be resolved
        if (
            alert.status !== "OPEN" &&
            alert.status !== "ACKNOWLEDGED"
        ) {
            return res.status(400).json({
                success: false,
                message: `Alert cannot be resolved because it is ${alert.status}`
            });
        }

        const updatedAlert = await prisma.alert.update({
            where: {
                id: alertId
            },
            data: {
                status: "RESOLVED",
                resolvedAt: new Date()
            }
        });

        return res.status(200).json({
            success: true,
            message: "Alert resolved successfully",
            alert: updatedAlert
        });

    } catch (error) {
        console.error("Resolve alert error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
import prisma from "../config/prisma.js";

// Create a bay
export const createBay = async (req, res) => {
    try {
        const { siteId, bayNumber, name } = req.body;

        if (!siteId || !bayNumber) {
            return res.status(400).json({
                success: false,
                message: "siteId and bayNumber are required"
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

        const bay = await prisma.bay.create({
            data: {
                siteId: Number(siteId),
                bayNumber,
                name,
                status: "AVAILABLE"
            }
        });

        return res.status(201).json({
            success: true,
            message: "Bay created successfully",
            bay
        });

    } catch (error) {
        console.error("Create bay error:", error);

        // Handle duplicate bay number for same site
        if (error.code === "P2002") {
            return res.status(409).json({
                success: false,
                message: "Bay number already exists at this site"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get all bays
export const getAllBays = async (req, res) => {
    try {
        const bays = await prisma.bay.findMany({
            include: {
                site: true
            },
            orderBy: {
                bayNumber: "asc"
            }
        });

        return res.status(200).json({
            success: true,
            count: bays.length,
            bays
        });

    } catch (error) {
        console.error("Get bays error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get bay by ID
export const getBayById = async (req, res) => {
    try {
        const bayId = Number(req.params.id);

        if (Number.isNaN(bayId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid bay ID"
            });
        }

        const bay = await prisma.bay.findUnique({
            where: {
                id: bayId
            },
            include: {
                site: true,
                serviceSessions: {
                    include: {
                        journey: {
                            include: {
                                vehicle: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        });

        if (!bay) {
            return res.status(404).json({
                success: false,
                message: "Bay not found"
            });
        }

        return res.status(200).json({
            success: true,
            bay
        });

    } catch (error) {
        console.error("Get bay error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Update bay status
export const updateBayStatus = async (req, res) => {
    try {
        const bayId = Number(req.params.id);
        const { status } = req.body;

        if (Number.isNaN(bayId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid bay ID"
            });
        }

        if (!status) {
            return res.status(400).json({
                success: false,
                message: "Status is required"
            });
        }

        const validStatuses = [
            "AVAILABLE",
            "OCCUPIED",
            "MAINTENANCE",
            "OUT_OF_SERVICE"
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid bay status"
            });
        }

        const bay = await prisma.bay.findUnique({
            where: {
                id: bayId
            }
        });

        if (!bay) {
            return res.status(404).json({
                success: false,
                message: "Bay not found"
            });
        }

        const updatedBay = await prisma.bay.update({
            where: {
                id: bayId
            },
            data: {
                status
            }
        });

        return res.status(200).json({
            success: true,
            message: "Bay status updated successfully",
            bay: updatedBay
        });

    } catch (error) {
        console.error("Update bay status error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
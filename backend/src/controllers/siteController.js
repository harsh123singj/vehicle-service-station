import prisma from "../config/prisma.js";

// Create a new site
export const createSite = async (req, res) => {
    try {
        const { name, code, address, city, state } = req.body;

        if (!name || !code) {
            return res.status(400).json({
                success: false,
                message: "Name and code are required"
            });
        }

        const existingSite = await prisma.site.findUnique({
            where: { code }
        });

        if (existingSite) {
            return res.status(409).json({
                success: false,
                message: "A site with this code already exists"
            });
        }

        const site = await prisma.site.create({
            data: {
                name,
                code,
                address,
                city,
                state
            }
        });

        return res.status(201).json({
            success: true,
            message: "Site created successfully",
            site
        });

    } catch (error) {
        console.error("Create site error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get all sites
export const getAllSites = async (req, res) => {
    try {
        const sites = await prisma.site.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: sites.length,
            sites
        });

    } catch (error) {
        console.error("Get sites error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get site by ID
export const getSiteById = async (req, res) => {
    try {
        const siteId = Number(req.params.id);

        if (Number.isNaN(siteId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid site ID"
            });
        }

        const site = await prisma.site.findUnique({
            where: {
                id: siteId
            }
        });

        if (!site) {
            return res.status(404).json({
                success: false,
                message: "Site not found"
            });
        }

        return res.status(200).json({
            success: true,
            site
        });

    } catch (error) {
        console.error("Get site error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Update site
export const updateSite = async (req, res) => {
    try {
        const siteId = Number(req.params.id);

        if (Number.isNaN(siteId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid site ID"
            });
        }

        const { name, code, address, city, state, isActive } = req.body;

        const existingSite = await prisma.site.findUnique({
            where: {
                id: siteId
            }
        });

        if (!existingSite) {
            return res.status(404).json({
                success: false,
                message: "Site not found"
            });
        }

        const site = await prisma.site.update({
            where: {
                id: siteId
            },
            data: {
                name,
                code,
                address,
                city,
                state,
                isActive
            }
        });

        return res.status(200).json({
            success: true,
            message: "Site updated successfully",
            site
        });

    } catch (error) {
        console.error("Update site error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Delete/deactivate site
export const deactivateSite = async (req, res) => {
    try {
        const siteId = Number(req.params.id);

        if (Number.isNaN(siteId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid site ID"
            });
        }

        const existingSite = await prisma.site.findUnique({
            where: {
                id: siteId
            }
        });

        if (!existingSite) {
            return res.status(404).json({
                success: false,
                message: "Site not found"
            });
        }

        const site = await prisma.site.update({
            where: {
                id: siteId
            },
            data: {
                isActive: false
            }
        });

        return res.status(200).json({
            success: true,
            message: "Site deactivated successfully",
            site
        });

    } catch (error) {
        console.error("Deactivate site error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
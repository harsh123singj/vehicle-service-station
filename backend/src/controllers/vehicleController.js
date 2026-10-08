import prisma from "../config/prisma.js";

// Create vehicle
export const createVehicle = async (req, res) => {
    try {
        const {
            registrationNumber,
            vehicleType,
            make,
            model,
            ownerName
        } = req.body;

        if (!registrationNumber) {
            return res.status(400).json({
                success: false,
                message: "Registration number is required"
            });
        }

        const existingVehicle = await prisma.vehicle.findUnique({
            where: {
                registrationNumber
            }
        });

        if (existingVehicle) {
            return res.status(409).json({
                success: false,
                message: "Vehicle with this registration number already exists"
            });
        }

        const vehicle = await prisma.vehicle.create({
            data: {
                registrationNumber,
                vehicleType,
                make,
                model,
                ownerName
            }
        });

        return res.status(201).json({
            success: true,
            message: "Vehicle created successfully",
            vehicle
        });

    } catch (error) {
        console.error("Create vehicle error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get all vehicles
export const getAllVehicles = async (req, res) => {
    try {
        const vehicles = await prisma.vehicle.findMany({
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: vehicles.length,
            vehicles
        });

    } catch (error) {
        console.error("Get vehicles error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get vehicle by ID
export const getVehicleById = async (req, res) => {
    try {
        const vehicleId = Number(req.params.id);

        if (Number.isNaN(vehicleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID"
            });
        }

        const vehicle = await prisma.vehicle.findUnique({
            where: {
                id: vehicleId
            }
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        return res.status(200).json({
            success: true,
            vehicle
        });

    } catch (error) {
        console.error("Get vehicle error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Get vehicle by registration number
export const getVehicleByRegistration = async (req, res) => {
    try {
        const { registrationNumber } = req.params;

        const vehicle = await prisma.vehicle.findUnique({
            where: {
                registrationNumber
            }
        });

        if (!vehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        return res.status(200).json({
            success: true,
            vehicle
        });

    } catch (error) {
        console.error("Get vehicle by registration error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// Update vehicle
export const updateVehicle = async (req, res) => {
    try {
        const vehicleId = Number(req.params.id);

        if (Number.isNaN(vehicleId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid vehicle ID"
            });
        }

        const existingVehicle = await prisma.vehicle.findUnique({
            where: {
                id: vehicleId
            }
        });

        if (!existingVehicle) {
            return res.status(404).json({
                success: false,
                message: "Vehicle not found"
            });
        }

        const {
            registrationNumber,
            vehicleType,
            make,
            model,
            ownerName
        } = req.body;

        const vehicle = await prisma.vehicle.update({
            where: {
                id: vehicleId
            },
            data: {
                registrationNumber,
                vehicleType,
                make,
                model,
                ownerName
            }
        });

        return res.status(200).json({
            success: true,
            message: "Vehicle updated successfully",
            vehicle
        });

    } catch (error) {
        console.error("Update vehicle error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
import prisma from "../config/prisma.js";
import { getIO } from "../config/socket.js";

export const getAllCameras = async (req, res) => {
    try {
        const cameras = await prisma.camera.findMany({
            include: {
                site: true
            },
            orderBy: {
                id: "asc"
            }
        });

        return res.status(200).json({
            success: true,
            count: cameras.length,
            cameras
        });

    } catch (error) {
        console.error("Get cameras error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


export const createCamera = async (req, res) => {
    try {
        const {
            siteId,
            name,
            cameraCode,
            location,
            status,
            streamUrl
        } = req.body || {};

        if (!siteId || !name || !cameraCode) {
            return res.status(400).json({
                success: false,
                message: "siteId, name and cameraCode are required"
            });
        }

        const parsedSiteId = Number(siteId);

        if (Number.isNaN(parsedSiteId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid siteId"
            });
        }

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

        const existingCamera = await prisma.camera.findFirst({
            where: {
                cameraCode
            }
        });

        if (existingCamera) {
            return res.status(409).json({
                success: false,
                message: "Camera code already exists"
            });
        }

        const camera = await prisma.camera.create({
            data: {
                siteId: parsedSiteId,
                name,
                cameraCode,
                location: location || null,
                status: status || "ONLINE",
                streamUrl: streamUrl || null,
                lastHeartbeatAt: new Date()
            },
            include: {
                site: true
            }
        });

        return res.status(201).json({
            success: true,
            message: "Camera created successfully",
            camera
        });

    } catch (error) {
        console.error("Create camera error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};


// -----------------------------------------
// Update camera status
// -----------------------------------------
export const updateCameraStatus = async (req, res) => {
    try {
        const cameraId = Number(req.params.id);
        const { status } = req.body || {};

        // -----------------------------------------
        // 1. Validate camera ID
        // -----------------------------------------
        if (Number.isNaN(cameraId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid camera ID"
            });
        }

        // -----------------------------------------
        // 2. Validate status
        // -----------------------------------------
        const allowedStatuses = [
            "ONLINE",
            "OFFLINE",
            "DEGRADED"
        ];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message:
                    "Status must be ONLINE, OFFLINE or DEGRADED"
            });
        }

        // -----------------------------------------
        // 3. Find camera
        // -----------------------------------------
        const existingCamera =
            await prisma.camera.findUnique({
                where: {
                    id: cameraId
                },
                include: {
                    site: true
                }
            });

        if (!existingCamera) {
            return res.status(404).json({
                success: false,
                message: "Camera not found"
            });
        }

        // -----------------------------------------
        // 4. Update camera
        // -----------------------------------------
        const camera =
            await prisma.camera.update({
                where: {
                    id: cameraId
                },
                data: {
                    status,

                    // Update heartbeat when camera
                    // comes back online.
                    lastHeartbeatAt:
                        status === "ONLINE"
                            ? new Date()
                            : existingCamera.lastHeartbeatAt
                },
                include: {
                    site: true
                }
            });

        // -----------------------------------------
        // 5. Create alert when camera goes offline
        // -----------------------------------------
        let alert = null;

        if (
            status === "OFFLINE" &&
            existingCamera.status !== "OFFLINE"
        ) {
            alert = await prisma.alert.create({
                data: {
                    siteId: camera.siteId,

                    severity: "HIGH",

                    status: "OPEN",

                    title: "Camera Offline",

                    message:
                        `Camera ${camera.cameraCode} is offline at ${camera.site.name}`
                }
            });
        }

        // -----------------------------------------
        // 6. Realtime events
        // -----------------------------------------
        const io = getIO();

        io.emit("camera:changed", {
            cameraId: camera.id,

            siteId: camera.siteId,

            cameraCode: camera.cameraCode,

            status: camera.status,

            lastHeartbeatAt:
                camera.lastHeartbeatAt
        });

        // Send alert realtime event
        if (alert) {
            io.emit("alert:created", {
                alertId: alert.id,

                siteId: alert.siteId,

                severity: alert.severity,

                status: alert.status,

                title: alert.title,

                message: alert.message
            });
        }

        // -----------------------------------------
        // 7. Response
        // -----------------------------------------
        return res.status(200).json({
            success: true,

            message:
                `Camera status updated to ${status}`,

            camera,

            alert
        });

    } catch (error) {
        console.error(
            "Update camera status error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
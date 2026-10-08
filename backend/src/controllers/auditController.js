import prisma from "../config/prisma.js";

export const getAllAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        role: true
                    }
                },
                site: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        return res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });

    } catch (error) {
        console.error("Get audit logs error:", error);

        return res.status(500).json({
            success: false,
            message: "Internal server error"
        });
    }
};
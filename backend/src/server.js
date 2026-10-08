import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authrouter from "./routes/authRoutes.js";
import prisma from "./config/prisma.js";
import siteRoute from "./routes/siteRoutes.js";
import vehicleRoutes from "./routes/vehicleRoutes.js";
import journeyrouter from "./routes/journeyRoutes.js";
import verificationrouter from "./routes/varificationRoutes.js";
import queueRoutes from "./routes/queueRoutes.js";
import bayrouter from "./routes/bayRoutes.js";
import eligibilityrouter from "./routes/eligibilityRoutes.js";
import alertRoute from "./routes/alertRoutes.js";
import auditRouter from "./routes/auditRoutes.js";
import dashboardrouter from "./routes/dashboardRoutes.js";
import simulatorrouter from "./routes/simulatorRoutes.js";
import camerarouter from "./routes/cameraRoutes.js";

import http from "http";
import { initSocket } from "./config/socket.js";



dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/auth", authrouter);
app.use("/api/sites", siteRoute);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/journeys", journeyrouter);
app.use("/api", verificationrouter);
app.use("/api", queueRoutes);
app.use("/api/bays", bayrouter);
app.use("/api", eligibilityrouter);
app.use("/api/alerts", alertRoute);
app.use("/api/audit-logs", auditRouter);
app.use("/api/dashboard", dashboardrouter);
app.use("/api/simulator", simulatorrouter);
app.use("/api/cameras", camerarouter);


app.get("/api/health", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.status(200).json({
            success: true,
            message: "Smart Vehicle Platform API is running",
            database: "connected"
        });
    } catch (error) {
        console.error("Database connection error:", error);

        res.status(500).json({
            success: false,
            message: "Server is running but database connection failed"
        });
    }
});

const PORT = process.env.PORT || 5000;

const httpServer = http.createServer(app);

initSocket(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
import express from "express";

import {
    createAlert,
    getAllAlerts,
    getAlertById,
    acknowledgeAlert,
    resolveAlert
} from "../controllers/alertConotroller.js";

const alertRouter = express.Router();

alertRouter.post("/", createAlert);

alertRouter.get("/", getAllAlerts);

alertRouter.get("/:id", getAlertById);

alertRouter.put("/:id/acknowledge", acknowledgeAlert);

alertRouter.put("/:id/resolve", resolveAlert);

export default alertRouter;
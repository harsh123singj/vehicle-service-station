import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
    createJourney,
    getAllJourneys,
    getJourneyById,
    updateJourneyStatus,
    assignBay,
    completeService,
    startService,
    exitJourney
} from "../controllers/journeyController.js";

const journeyrouter = express.Router();

journeyrouter.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    createJourney
);

journeyrouter.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    getAllJourneys
);

journeyrouter.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    getJourneyById
);

journeyrouter.put(
    "/:id/status",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    updateJourneyStatus
);

journeyrouter.post(
    "/:journeyId/assign-bay",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    assignBay
);

journeyrouter.post(
    "/:journeyId/complete-service",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    completeService
);

journeyrouter.post(
    "/:journeyId/start-service",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    startService
);

journeyrouter.post(
    "/:journeyId/exit",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    exitJourney
);

export default journeyrouter;
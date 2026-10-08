import express from "express";

import {
    simulateVehicleEntry,
    simulateVerification,
    simulateVehicleIdentification,
    simulateEligibility,
    simulateNonEligible,
    simulateVerificationFailure
} from "../controllers/simulatorController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const simulatorrouter = express.Router();

simulatorrouter.post(
    "/vehicle",
    authMiddleware,
    authorize("ADMIN", "OPERATOR", "SUPERVISOR"),
    simulateVehicleEntry
);
simulatorrouter.post(
    "/vehicle/:journeyId/identify",
    authMiddleware,
    authorize("ADMIN", "OPERATOR", "SUPERVISOR"),
    simulateVehicleIdentification
);
simulatorrouter.post(
    "/vehicle/:journeyId/eligibility",
    authMiddleware,
    authorize("ADMIN", "OPERATOR", "SUPERVISOR"),
    simulateEligibility
);
simulatorrouter.post(
    "/vehicle/:journeyId/verify",
    authMiddleware,
    authorize("ADMIN", "OPERATOR", "SUPERVISOR"),
    simulateVerification
);
simulatorrouter.post(
    "/vehicle/:journeyId/verification-failure",
    authMiddleware,
    authorize("ADMIN", "OPERATOR", "SUPERVISOR"),
    simulateVerificationFailure
);
simulatorrouter.post(
    "/vehicle/:journeyId/non-eligible",
    authMiddleware,
    authorize("ADMIN", "OPERATOR", "SUPERVISOR"),
    simulateNonEligible
);
export default simulatorrouter;
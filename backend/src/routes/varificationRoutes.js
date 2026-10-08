import express from "express";

import {
    createVerification,
    getJourneyVerifications
} from "../controllers/verificationController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const verificationrouter = express.Router();

verificationrouter.post(
    "/journeys/:journeyId/verifications",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    createVerification
);

verificationrouter.get(
    "/journeys/:journeyId/verifications",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    getJourneyVerifications
);

export default verificationrouter;
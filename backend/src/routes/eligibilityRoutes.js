import express from "express";

import {
    decideEligibility
} from "../controllers/eligibilityController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const eligibilityrouter = express.Router();

eligibilityrouter.post(
    "/journeys/:journeyId/eligibility",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    decideEligibility
);

export default eligibilityrouter;
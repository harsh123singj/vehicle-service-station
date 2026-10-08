import express from "express";

import {
    getDashboardKPIs
} from "../controllers/dashboardController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
const dashboardrouter = express.Router();

dashboardrouter.get(
    "/kpis",
    authMiddleware,
    authorize("ADMIN", "OPERATOR", "SUPERVISOR"),
    getDashboardKPIs
);

export default dashboardrouter;
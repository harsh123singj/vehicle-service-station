import express from "express";
import { getAllAuditLogs } from "../controllers/auditController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const auditRouter = express.Router();

auditRouter.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "SUPERVISOR","OPERATOR"),
    getAllAuditLogs
);

export default auditRouter;
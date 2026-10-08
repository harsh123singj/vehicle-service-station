import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
    createSite,
    getAllSites,
    getSiteById,
    updateSite,
    deactivateSite
} from "../controllers/siteController.js";

const siteRoute = express.Router();

siteRoute.use(authMiddleware);

siteRoute.post("/", authorize("ADMIN"), createSite);
siteRoute.get("/", authorize("ADMIN", "OPERATOR"), getAllSites);
siteRoute.get("/:id", authorize("ADMIN", "OPERATOR"), getSiteById);
siteRoute.put("/:id", authorize("ADMIN"), updateSite);
siteRoute.delete("/:id", authorize("ADMIN"), deactivateSite);

export default siteRoute;
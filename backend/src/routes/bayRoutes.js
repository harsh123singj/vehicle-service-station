import express from "express";

import {
    createBay,
    getAllBays,
    getBayById,
    updateBayStatus
} from "../controllers/bayController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const bayrouter = express.Router();

bayrouter.post(
    "/",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    createBay
);

bayrouter.get(
    "/",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    getAllBays
);

bayrouter.get(
    "/:id",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    getBayById
);

bayrouter.put(
    "/:id/status",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    updateBayStatus
);

export default bayrouter;
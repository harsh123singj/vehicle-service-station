import express from "express";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

import {
    createVehicle,
    getAllVehicles,
    getVehicleById,
    getVehicleByRegistration,
    updateVehicle
} from "../controllers/vehicleController.js";

const vehicleRoutes = express.Router();

vehicleRoutes.use(authMiddleware);

vehicleRoutes.post(
    "/",
    authorize("ADMIN"),
    createVehicle
);

vehicleRoutes.get(
    "/",
    authorize("ADMIN", "OPERATOR"),
    getAllVehicles
);

vehicleRoutes.get(
    "/registration/:registrationNumber",
    authorize("ADMIN", "OPERATOR"),
    getVehicleByRegistration
);

vehicleRoutes.get(
    "/:id",
    authorize("ADMIN", "OPERATOR"),
    getVehicleById
);

vehicleRoutes.put(
    "/:id",
    authorize("ADMIN"),
    updateVehicle
);

export default vehicleRoutes;
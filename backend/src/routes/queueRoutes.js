import express from "express";

import {
    addToQueue,
    getAllQueues,
    getQueueById
} from "../controllers/queueController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const queuerouter = express.Router();

queuerouter.post(
    "/journeys/:journeyId/queue",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    addToQueue
);

queuerouter.get(
    "/queues",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    getAllQueues
);

queuerouter.get(
    "/queues/:id",
    authMiddleware,
    authorize("ADMIN", "OPERATOR"),
    getQueueById
);

export default queuerouter;
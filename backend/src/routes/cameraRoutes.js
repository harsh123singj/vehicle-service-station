import express from "express";

import {
    getAllCameras,
    createCamera,
    updateCameraStatus
} from "../controllers/cameraController.js";

const camerarouter = express.Router();

camerarouter.get("/", getAllCameras);

camerarouter.post("/", createCamera);

camerarouter.put("/:id/status", updateCameraStatus);

export default camerarouter;
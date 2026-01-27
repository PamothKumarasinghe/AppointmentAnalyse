import express from "express";
import { createAvailablity } from "../controllers/availability.controller.js";
import { loadProfile } from "../middleware/loadProfile.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
// remember to create the role.middleware.js file later for role based access control
// add it to the post route below

const router = express.Router();

router.post("/", authMiddleware, loadProfile, createAvailablity);

export default router;

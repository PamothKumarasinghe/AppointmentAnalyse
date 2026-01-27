import express from "express";
import { bookAppointment } from "../controllers/appointment.controller";
import { loadProfile } from "../middleware/loadProfile.middleware";
import { authMiddleware } from "../middleware/auth.middleware";

// remember to create the role.middleware.js file later for role based access control
// add it to the post route below

const router = express.Router();

router.post("/", authMiddleware, loadProfile, bookAppointment);

export default router;

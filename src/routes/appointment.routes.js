import express from "express";
import {
  createAppointment,
  getMyAppointments,
  getAdminAppointments,
  updateAppointmentStatus,
  cancelAppointment,
  getAvailableSlots,
} from "../controllers/appointment.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { userOnly, adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

// Public route - get available slots
router.get("/slots", getAvailableSlots);

// All routes below require authentication
router.use(verifyToken);

// User routes
router.post("/", userOnly, createAppointment);
router.get("/my", userOnly, getMyAppointments);
router.put("/:appointmentId/cancel", userOnly, cancelAppointment);

// Admin routes
router.get("/admin", adminOnly, getAdminAppointments);
router.put("/:appointmentId/status", adminOnly, updateAppointmentStatus);

export default router;

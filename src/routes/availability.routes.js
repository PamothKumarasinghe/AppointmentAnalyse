import express from "express";
import {
  createAvailability,
  getAdminAvailability,
  getMyAvailability,
  updateAvailability,
  deleteAvailability,
} from "../controllers/availability.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";
import { adminOnly } from "../middleware/role.middleware.js";

const router = express.Router();

// Public route - get any admin's availability
router.get("/admin/:adminId", getAdminAvailability);

// Protected routes - admin only
router.use(verifyToken, adminOnly);

router.post("/", createAvailability);
router.get("/my", getMyAvailability);
router.put("/:availabilityId", updateAvailability);
router.delete("/:availabilityId", deleteAvailability);

export default router;

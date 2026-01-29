import express from "express";
import { getAllAdmins, getAdminById } from "../controllers/admin.controller.js";

const router = express.Router();

// Public routes - anyone can view admins
router.get("/", getAllAdmins);
router.get("/:adminId", getAdminById);

export default router;

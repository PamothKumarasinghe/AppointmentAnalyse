import express from "express";
import {
  signup,
  login,
  getProfile,
  updateProfile,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/signup", signup);
router.post("/login", login);

// Protected routes
router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);

export default router;
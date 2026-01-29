import dotenv from "dotenv";
dotenv.config();
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import availabilityRoutes from "./routes/availability.routes.js";
import appointmentRoutes from "./routes/appointment.routes.js";
import adminRoutes from "./routes/admin.routes.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Appointment System API 🚀");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/availability", availabilityRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admins", adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error occurred:");
  console.error(err);
  res.status(500).json({
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;

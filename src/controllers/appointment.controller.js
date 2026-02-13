import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Cleanup overdue pending appointments by marking them as rejected
const cleanupOverdueAppointments = async () => {
  const now = new Date();
  const currentDate = now.toISOString().split("T")[0];
  const currentTime = now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM format

  // Mark pending appointments as rejected where:
  // 1. Date is in the past, OR
  // 2. Date is today but start time has passed
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "rejected" })
    .eq("status", "pending")
    .or(
      `date.lt.${currentDate},and(date.eq.${currentDate},start_time.lt.${currentTime})`,
    )
    .select();

  if (error) {
    console.error("Error cleaning up overdue appointments:", error.message);
    return { rejected: 0, error };
  }

  console.log(
    `Auto-rejected ${data?.length || 0} overdue pending appointments`,
  );
  return { rejected: data?.length || 0 };
};

// Create appointment (User only)
export const createAppointment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { admin_id, date, start_time, end_time, notes } = req.body;

  // Validation
  if (!admin_id || !date || !start_time || !end_time) {
    return res.status(400).json({
      message: "admin_id, date, start_time, and end_time are required",
    });
  }

  // Check if slot is already booked
  const { data: existingAppointment } = await supabase
    .from("appointments")
    .select("id")
    .eq("admin_id", admin_id)
    .eq("date", date)
    .eq("start_time", start_time)
    .in("status", ["pending", "approved"])
    .single();

  if (existingAppointment) {
    return res.status(400).json({
      message: "This time slot is already booked",
    });
  }

  // Create appointment
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      admin_id,
      user_id: userId,
      date,
      start_time,
      end_time,
      notes,
      status: "pending",
    })
    .select(
      `
      *,
      admin:admin_id(id, full_name, email, specialty),
      user:user_id(id, full_name, email)
    `,
    )
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.status(201).json({
    message: "Appointment created successfully",
    appointment: data,
  });
});

// Get appointments for current user
export const getMyAppointments = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query; // Optional filter by status

  // Cleanup overdue pending appointments before fetching
  await cleanupOverdueAppointments();

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      admin:admin_id(id, full_name, email, specialty)
    `,
    )
    .eq("user_id", userId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.json({
    appointments: data,
  });
});

// Get appointments for admin
export const getAdminAppointments = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const { status, date } = req.query; // Optional filters

  // Cleanup overdue pending appointments before fetching
  await cleanupOverdueAppointments();

  let query = supabase
    .from("appointments")
    .select(
      `
      *,
      user:user_id(id, full_name, email, phone)
    `,
    )
    .eq("admin_id", adminId)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (status) {
    query = query.eq("status", status);
  }

  if (date) {
    query = query.eq("date", date);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.json({
    appointments: data,
  });
});

// Update appointment status (Admin only - approve/reject)
export const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const { appointmentId } = req.params;
  const { status } = req.body;

  // Validate status
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({
      message: "Status must be either 'approved' or 'rejected'",
    });
  }

  const { data, error } = await supabase
    .from("appointments")
    .update({ status })
    .eq("id", appointmentId)
    .eq("admin_id", adminId) // Ensure admin can only update their own appointments
    .select(
      `
      *,
      user:user_id(id, full_name, email)
    `,
    )
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (!data) {
    return res.status(404).json({
      message: "Appointment not found or unauthorized",
    });
  }

  res.json({
    message: `Appointment ${status} successfully`,
    appointment: data,
  });
});

// Cancel appointment (User only)
export const cancelAppointment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { appointmentId } = req.params;

  // Only pending appointments can be cancelled
  const { data, error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", appointmentId)
    .eq("user_id", userId)
    .eq("status", "pending") // Can only cancel pending appointments
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (!data) {
    return res.status(404).json({
      message: "Appointment not found, already processed, or unauthorized",
    });
  }

  res.json({
    message: "Appointment cancelled successfully",
    appointment: data,
  });
});

// Get available slots for a specific admin and date
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { adminId, date } = req.query;

  if (!adminId || !date) {
    return res.status(400).json({
      message: "adminId and date are required",
    });
  }

  // Get availability where the requested date falls within the range
  const { data: availability, error: availError } = await supabase
    .from("availability")
    .select("*")
    .eq("admin_id", adminId)
    .eq("is_active", true)
    .lte("start_date", date)
    .gte("end_date", date);

  if (availError || !availability || availability.length === 0) {
    return res.json({ slots: [] });
  }

  // Get booked appointments for this date
  const { data: bookedSlots } = await supabase
    .from("appointments")
    .select("start_time, end_time")
    .eq("admin_id", adminId)
    .eq("date", date)
    .in("status", ["pending", "approved"]);

  // Generate and filter slots
  const { generateSlots } = await import("../utils/slotGenerator.js");

  let allSlots = [];
  availability.forEach((av) => {
    const slots = generateSlots(av.start_time, av.end_time, av.slot_duration);
    allSlots.push(...slots);
  });

  // Filter out booked slots
  const availableSlots = allSlots.filter(
    (slot) =>
      !bookedSlots?.some(
        (appointment) => appointment.start_time === slot.start,
      ),
  );

  res.json({
    slots: availableSlots,
  });
});

export const bookAppointment = asyncHandler(async (req, res) => {
  const { admin_id, date, start_time, end_time } = req.body;

  const { error } = await supabase.from("appointments").insert({
    user_id: req.profile.id,
    admin_id,
    date,
    start_time,
    end_time,
  });

  if (error) return res.status(400).json({ message: error.message });

  res.json({ message: "Appointment booked successfully" });
});

// Manual cleanup endpoint (optional - can be called by cron job)
export const cleanupOverdue = asyncHandler(async (req, res) => {
  const result = await cleanupOverdueAppointments();

  if (result.error) {
    return res.status(500).json({
      message: "Error during cleanup",
      error: result.error.message,
    });
  }

  res.json({
    message: "Cleanup completed successfully",
    rejected: result.rejected,
  });
});

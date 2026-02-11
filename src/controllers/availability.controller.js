import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Helper function to calculate end date based on recurrence type
const calculateEndDate = (selectedDate, recurrenceType) => {
  const date = new Date(selectedDate);

  if (recurrenceType === "daily") {
    // Daily: same day only
    return selectedDate;
  } else if (recurrenceType === "weekly") {
    // Weekly: until the end of current week (Sunday)
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    const daysUntilSunday = 7 - dayOfWeek;
    const endDate = new Date(date);
    endDate.setDate(date.getDate() + daysUntilSunday);
    return endDate.toISOString().split("T")[0];
  } else if (recurrenceType === "monthly") {
    // Monthly: until the end of current month
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return endDate.toISOString().split("T")[0];
  }

  return selectedDate;
};

// Create availability (Admin only)
export const createAvailability = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const {
    selected_date, // The date admin selected (required)
    start_time,
    end_time,
    slot_duration,
    recurrence_type, // 'daily', 'weekly', or 'monthly'
  } = req.body;

  console.log("Creating availability with data:", req.body);

  // Validation
  if (
    !selected_date ||
    !start_time ||
    !end_time ||
    !slot_duration ||
    !recurrence_type
  ) {
    return res.status(400).json({
      message:
        "selected_date, start_time, end_time, slot_duration, and recurrence_type are required",
    });
  }

  // Validate recurrence type
  if (!["daily", "weekly", "monthly"].includes(recurrence_type)) {
    return res.status(400).json({
      message: "recurrence_type must be daily, weekly, or monthly",
    });
  }

  // Calculate end date based on recurrence type
  const start_date = selected_date;
  const end_date = calculateEndDate(selected_date, recurrence_type);

  console.log(
    `Calculated dates - Start: ${start_date}, End: ${end_date}, Type: ${recurrence_type}`,
  );

  // Insert availability
  const { data, error } = await supabase
    .from("availability")
    .insert({
      admin_id: adminId,
      start_date,
      end_date,
      start_time,
      end_time,
      slot_duration,
      recurrence_type,
    })
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.status(201).json({
    message: "Availability created successfully",
    availability: data,
  });
});

// Get admin's availability
export const getAdminAvailability = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  console.log("Fetching availability for adminId:", adminId);

  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("admin_id", adminId)
    .eq("is_active", true)
    .order("start_date", { ascending: true });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.json({
    availability: data,
  });
});

// Get own availability (for current admin)
export const getMyAvailability = asyncHandler(async (req, res) => {
  const adminId = req.user.id;

  console.log("Fetching availability for adminId:", adminId);
  const { data, error } = await supabase
    .from("availability")
    .select("*")
    .eq("admin_id", adminId)
    .order("day_of_week", { ascending: true });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.json({
    availability: data,
  });
});

// Update availability
export const updateAvailability = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const { availabilityId } = req.params;
  const {
    day_of_week,
    start_time,
    end_time,
    slot_duration,
    recurrence_type,
    specific_date,
    is_active,
  } = req.body;

  const updates = {};
  if (day_of_week !== undefined) updates.day_of_week = day_of_week;
  if (start_time !== undefined) updates.start_time = start_time;
  if (end_time !== undefined) updates.end_time = end_time;
  if (slot_duration !== undefined) updates.slot_duration = slot_duration;
  if (recurrence_type !== undefined) updates.recurrence_type = recurrence_type;
  if (specific_date !== undefined) updates.specific_date = specific_date;
  if (is_active !== undefined) updates.is_active = is_active;

  const { data, error } = await supabase
    .from("availability")
    .update(updates)
    .eq("id", availabilityId)
    .eq("admin_id", adminId) // Ensure admin can only update their own
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  if (!data) {
    return res.status(404).json({
      message: "Availability not found or unauthorized",
    });
  }

  res.json({
    message: "Availability updated successfully",
    availability: data,
  });
});

// Delete availability
export const deleteAvailability = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const { availabilityId } = req.params;

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", availabilityId)
    .eq("admin_id", adminId);

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.json({
    message: "Availability deleted successfully",
  });
});

export const createAvailablity = asyncHandler(async (req, res) => {
  const { data, start_time, end_time, slot_duration } = req.body;

  await supabase.from("availability").insert({
    admin_id: req.profile.id,
    data,
    start_time,
    end_time,
    slot_duration,
  });

  res.json({
    message: "Availability created successfully",
  });
});

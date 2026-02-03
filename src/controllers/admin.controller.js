import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all admins (for users to search and select)
export const getAllAdmins = asyncHandler(async (req, res) => {
  const { search } = req.query;

  let query = supabase
    .from("users")
    .select("id, email, full_name, specialty, phone")
    .eq("role", "admin");

  // Search by name or specialty
  if (search) {
    query = query.or(`full_name.ilike.%${search}%,specialty.ilike.%${search}%`);
  }

  const { data, error } = await query;

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.json({
    admins: data,
  });
});

// Get specific admin details
export const getAdminById = asyncHandler(async (req, res) => {
  const { adminId } = req.params;

  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, specialty, phone, created_at")
    .eq("id", adminId)
    .eq("role", "admin")
    .single();

  if (error) {
    return res.status(404).json({
      message: "Admin not found",
    });
  }

  res.json({
    admin: data,
  });
});

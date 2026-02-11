import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Get all admins (for users to search and select)
export const getAllAdmins = asyncHandler(async (req, res) => {
  const { search, city, state, specialty } = req.query;

  let query = supabase
    .from("users")
    .select(
      "id, email, full_name, specialty, phone, business_name, address, city, state, zip_code, country",
    )
    .eq("role", "admin");

  // Filter by city if provided
  if (city) {
    query = query.ilike("city", `%${city}%`);
  }

  // Filter by state if provided
  if (state) {
    query = query.ilike("state", `%${state}%`);
  }

  // Filter by specialty if provided
  if (specialty) {
    query = query.ilike("specialty", `%${specialty}%`);
  }

  // General search by name, business name, or specialty
  if (search) {
    query = query.or(
      `full_name.ilike.%${search}%,business_name.ilike.%${search}%,specialty.ilike.%${search}%`,
    );
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
    .select(
      "id, email, full_name, specialty, phone, business_name, address, city, state, zip_code, country, created_at",
    )
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

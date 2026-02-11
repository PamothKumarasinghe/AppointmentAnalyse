import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Signup controller
export const signup = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    role,
    full_name,
    specialty,
    phone,
    business_name,
    address,
    city,
    state,
    zip_code,
    country,
  } = req.body;

  // Validate required fields
  if (!email || !password || !role) {
    return res.status(400).json({
      message: "Email, password, and role are required",
    });
  }

  // Validate role
  if (!["admin", "user"].includes(role)) {
    return res.status(400).json({
      message: "Role must be either 'admin' or 'user'",
    });
  }

  // For admins, business name and location are recommended
  if (role === "admin" && (!business_name || !city)) {
    return res.status(400).json({
      message: "Business name and city are required for admin accounts",
    });
  }

  // Sign up user with metadata
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role,
        full_name: full_name || "",
        specialty: specialty || null,
        phone: phone || null,
        business_name: business_name || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zip_code || null,
        country: country || "USA",
      },
    },
  });

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.status(201).json({
    message: "User registered successfully",
    user: {
      id: data.user.id,
      email: data.user.email,
      role,
      full_name,
      business_name,
      city,
      state,
    },
  });
});

// Login controller
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "Email and password are required",
    });
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return res.status(401).json({
      message: "Invalid credentials",
    });
  }

  // Get user profile from database
  const { data: userProfile } = await supabase
    .from("users")
    .select(
      "id, email, role, full_name, specialty, phone, business_name, address, city, state, zip_code, country",
    )
    .eq("id", data.user.id)
    .single();

  res.json({
    message: "Login successful",
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
    user: userProfile,
  });
});

// Get current user profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user; // From auth middleware

  const { data: profile, error } = await supabase
    .from("users")
    .select(
      "id, email, role, full_name, specialty, phone, business_name, address, city, state, zip_code, country, created_at",
    )
    .eq("id", user.id)
    .single();

  if (error) {
    return res.status(404).json({
      message: "User profile not found",
    });
  }

  res.json({
    user: profile,
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user; // From auth middleware
  const {
    full_name,
    specialty,
    phone,
    business_name,
    address,
    city,
    state,
    zip_code,
    country,
  } = req.body;

  const updates = {};
  if (full_name !== undefined) updates.full_name = full_name;
  if (specialty !== undefined) updates.specialty = specialty;
  if (phone !== undefined) updates.phone = phone;
  if (business_name !== undefined) updates.business_name = business_name;
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (state !== undefined) updates.state = state;
  if (zip_code !== undefined) updates.zip_code = zip_code;
  if (country !== undefined) updates.country = country;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      message: "No fields to update",
    });
  }

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id)
    .select()
    .single();

  if (error) {
    return res.status(400).json({
      message: error.message,
    });
  }

  res.json({
    message: "Profile updated successfully",
    user: data,
  });
});

import { supabase } from "../config/supabase";
import { asyncHandler } from "../utils/asyncHandler";

// both the controllers are developed using supabase auth //

// signup controller
export const signup = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error)
    return res.status(400).json({
      message: error.message,
    });

  res.status(201).json({
    message: "User registered successfully",
    user: data.user,
  });
});

// login controller
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error)
    return res.status(401).json({
      message: "Invalid Credentials",
    });

  res.json({
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  });
});

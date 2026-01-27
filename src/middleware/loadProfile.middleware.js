import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const loadProfile = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error)
    return res.status(404).json({
      message: "User not found",
    });
  req.profile = data;
  next();
});

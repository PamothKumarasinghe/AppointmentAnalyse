import { supabase } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";

export const loadProfile = asyncHandler(async (req, res) => {
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

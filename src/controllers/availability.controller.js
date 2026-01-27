import { supabase } from "../config/supabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

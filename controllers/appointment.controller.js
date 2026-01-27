import { supabase } from "../config/db";
import { asyncHandler } from "../utils/asyncHandler";

export const bookAppointment = asyncHandler(async (req, res) => {
    const { admin_id, date, start_time, end_time } = req.body;

    const { error } = await supabase.from('appointments').insert({
        user_id: req.profile.id,
        admin_id,
        date,
        start_time,
        end_time
    });

    if (error) return res.status(400).json({ message: error.message });

    res.json({ message: 'Appointment booked successfully' });
});
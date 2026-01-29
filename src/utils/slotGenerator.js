/**
 * Generate time slots from start time to end time with given duration
 * @param {string} startTime - Start time in HH:MM format (e.g., "09:00")
 * @param {string} endTime - End time in HH:MM format (e.g., "17:00")
 * @param {number} duration - Slot duration in minutes (e.g., 30)
 * @returns {Array} Array of slot objects with start and end times
 */
export function generateSlots(startTime, endTime, duration) {
  const slots = [];

  // Parse time strings (HH:MM format)
  const [startHour, startMin] = startTime.split(":").map(Number);
  const [endHour, endMin] = endTime.split(":").map(Number);

  // Create date objects for today (date doesn't matter, we just need time)
  const current = new Date();
  current.setHours(startHour, startMin, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMin, 0, 0);

  // Generate slots
  while (current < end) {
    const slotStart = new Date(current);
    const slotEnd = new Date(current.getTime() + duration * 60000);

    // Don't add slot if it exceeds end time
    if (slotEnd > end) break;

    slots.push({
      start: slotStart.toTimeString().slice(0, 5), // HH:MM format
      end: slotEnd.toTimeString().slice(0, 5), // HH:MM format
    });

    current.setTime(slotEnd.getTime());
  }

  return slots;
}

import { supabase } from "../config/supabase.js";

export const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  // Get full user profile with role
  const { data: userProfile } = await supabase
    .from("users")
    .select("*")
    .eq("id", data.user.id)
    .single();

  if (!userProfile) {
    return res.status(401).json({ message: "User profile not found" });
  }

  req.user = userProfile;
  next();
};

// For backward compatibility
export const authMiddleware = verifyToken;

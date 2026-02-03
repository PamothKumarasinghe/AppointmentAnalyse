// Admin only middleware
export const adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({
      message: "Access denied. Admins only.",
    });
  }
  next();
};

// User only middleware
export const userOnly = (req, res, next) => {
  if (req.user.role !== "user") {
    return res.status(403).json({
      message: "Access denied. Users only.",
    });
  }
  next();
};

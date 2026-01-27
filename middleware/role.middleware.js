export const adminOnly = (req, res, next) => {
    if (req.profile.role !== 'admin') return res.status(403).json({ message: 'Access denied. Admins only.' });
    next();
};
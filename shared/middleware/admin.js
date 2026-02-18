//Admin role verification middleware
module.exports = function (req, res, next) {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied | Admin privileges required' });
    }
    next();
};

// Merchant role verification middleware
module.exports = function (req, res, next) {
    if (!req.user || req.user.userType !== 'merchant') {
        return res.status(403).json({ message: 'Access denied | Merchant privileges required' });
    }

    if (!req.user.isVerified) {
        return res.status(403).json({ message: 'Access denied | Merchant account not verified' });
    }

    next();
};

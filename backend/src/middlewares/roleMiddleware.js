const prisma = require('../config/db');

/**
 * Restrict access to specific roles
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
      });
    }

    next();
  };
};

/**
 * Ensure doctor has an active subscription before accessing protected doctor features
 */
const requireActiveSubscription = async (req, res, next) => {
  try {
    if (req.user.role !== 'DOCTOR') return next();

    const profile = await prisma.doctorProfile.findUnique({
      where: { userId: req.user.id },
    });

    if (!profile) {
      return res.status(403).json({
        success: false,
        message: 'Doctor profile not found. Please complete your profile setup.',
      });
    }

    if (profile.subscriptionStatus !== 'ACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your subscription is not active. Please complete payment to activate your account.',
      });
    }

    if (profile.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt) < new Date()) {
      // Auto-expire subscription
      await prisma.doctorProfile.update({
        where: { id: profile.id },
        data: { subscriptionStatus: 'INACTIVE' },
      });
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please renew to continue.',
      });
    }

    req.doctorProfile = profile;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { authorize, requireActiveSubscription };
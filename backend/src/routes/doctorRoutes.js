const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  updateProfile,
  getMyAvailability,
  setAvailability,
  deleteAvailability,
  getMyAppointments,
  submitPaymentProof,
  getSubscriptionInfo,
} = require('../controllers/doctorController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, requireActiveSubscription } = require('../middlewares/roleMiddleware');

// ── Public Routes ──────────────────────────────────────────────────────────────
router.get('/', getDoctors);
router.get('/:id', getDoctorById);

// ── Private Doctor Routes ──────────────────────────────────────────────────────
router.use(protect, authorize('DOCTOR'));

router.get('/me/subscription', getSubscriptionInfo);
router.post('/payment-proof', submitPaymentProof);
router.put('/profile', updateProfile);

// Routes that require active subscription
router.get('/me/availability', requireActiveSubscription, getMyAvailability);
router.post('/availability', requireActiveSubscription, setAvailability);
router.delete('/availability/:dayOfWeek', requireActiveSubscription, deleteAvailability);
router.get('/me/appointments', requireActiveSubscription, getMyAppointments);

module.exports = router;
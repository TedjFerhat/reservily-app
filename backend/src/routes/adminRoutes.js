const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser,
  getPaymentSubmissions,
  verifyPayment,
  rejectPayment,
  getStats,
  getAllAppointments,
} = require('../controllers/adminController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect, authorize('ADMIN'));

// Dashboard stats
router.get('/stats', getStats);

// User management
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.patch('/users/:id/suspend', suspendUser);
router.patch('/users/:id/activate', activateUser);

// Payment / subscription management
router.get('/payment-submissions', getPaymentSubmissions);
router.post('/payment-submissions/:id/verify', verifyPayment);
router.post('/payment-submissions/:id/reject', rejectPayment);

// Appointments oversight
router.get('/appointments', getAllAppointments);

module.exports = router;
const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  cancelAppointment,
  approveAppointment,
  rejectAppointment,
  getAppointmentById,
} = require('../controllers/appointmentController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize, requireActiveSubscription } = require('../middlewares/roleMiddleware');

router.use(protect);

// Patient actions
router.post('/', authorize('PATIENT'), bookAppointment);
router.patch('/:id/cancel', authorize('PATIENT'), cancelAppointment);

// Doctor actions (require active subscription)
router.patch('/:id/approve', authorize('DOCTOR'), requireActiveSubscription, approveAppointment);
router.patch('/:id/reject', authorize('DOCTOR'), requireActiveSubscription, rejectAppointment);

// Shared - patient, doctor, or admin can view their own
router.get('/:id', authorize('PATIENT', 'DOCTOR', 'ADMIN'), getAppointmentById);

module.exports = router;
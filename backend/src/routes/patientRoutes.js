const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, getMyAppointments } = require('../controllers/patientController');
const { protect } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(protect, authorize('PATIENT'));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/appointments', getMyAppointments);

module.exports = router;
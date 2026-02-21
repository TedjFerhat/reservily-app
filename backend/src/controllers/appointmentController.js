const Joi = require('joi');
const prisma = require('../config/db');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// ─── Validation Schemas ────────────────────────────────────────────────────────

const bookAppointmentSchema = Joi.object({
  doctorId: Joi.string().uuid().required(),
  date: Joi.date().iso().min('now').required(),
  time: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({ 'string.pattern.base': 'time must be in HH:MM format' }),
  notes: Joi.string().max(500).optional(),
});

// ─── Helper Functions ─────────────────────────────────────────────────────────

const getDayOfWeek = (date) => {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  return days[new Date(date).getDay()];
};

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @route   POST /api/appointments
 * @desc    Book an appointment with a doctor
 * @access  Private (Patient only)
 */
const bookAppointment = asyncHandler(async (req, res) => {
  const { error, value } = bookAppointmentSchema.validate(req.body);
  if (error) {
    return res.status(422).json({ success: false, message: error.details[0].message.replace(/['"]/g, '') });
  }

  const { doctorId, date, time, notes } = value;

  // Validate doctor exists and has active subscription
  const doctor = await prisma.doctorProfile.findFirst({
    where: {
      id: doctorId,
      subscriptionStatus: 'ACTIVE',
      user: { isActive: true },
    },
  });

  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found or not available for booking.' });
  }

  // Check doctor availability for that day
  const dayOfWeek = getDayOfWeek(date);
  const availability = await prisma.availability.findUnique({
    where: { doctorId_dayOfWeek: { doctorId, dayOfWeek } },
  });

  if (!availability) {
    return res.status(400).json({
      success: false,
      message: `Doctor is not available on ${dayOfWeek}.`,
    });
  }

  // Check requested time is within availability window
  if (time < availability.startTime || time >= availability.endTime) {
    return res.status(400).json({
      success: false,
      message: `Doctor is available from ${availability.startTime} to ${availability.endTime} on ${dayOfWeek}.`,
    });
  }

  // Check for slot conflicts (same doctor, date, time)
  const conflict = await prisma.appointment.findFirst({
    where: {
      doctorId,
      date: new Date(date),
      time,
      status: { in: ['PENDING', 'APPROVED'] },
    },
  });

  if (conflict) {
    return res.status(409).json({ success: false, message: 'This time slot is already booked.' });
  }

  const appointment = await prisma.appointment.create({
    data: {
      doctorId,
      patientId: req.user.id,
      date: new Date(date),
      time,
      notes: notes || null,
    },
    include: {
      doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully. Awaiting doctor confirmation.',
    data: appointment,
  });
});

/**
 * @route   PATCH /api/appointments/:id/cancel
 * @desc    Patient cancels their appointment
 * @access  Private (Patient only)
 */
const cancelAppointment = asyncHandler(async (req, res) => {
  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, patientId: req.user.id },
  });

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }

  if (['CANCELLED', 'REJECTED'].includes(appointment.status)) {
    return res.status(400).json({ success: false, message: `Appointment is already ${appointment.status.toLowerCase()}.` });
  }

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'CANCELLED' },
  });

  res.json({ success: true, message: 'Appointment cancelled.', data: updated });
});

/**
 * @route   PATCH /api/appointments/:id/approve
 * @desc    Doctor approves an appointment
 * @access  Private (Doctor with active subscription)
 */
const approveAppointment = asyncHandler(async (req, res) => {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, doctorId: profile.id },
  });

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }

  if (appointment.status !== 'PENDING') {
    return res.status(400).json({ success: false, message: `Cannot approve an appointment with status: ${appointment.status}.` });
  }

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'APPROVED' },
    include: {
      patient: { select: { id: true, name: true, email: true } },
    },
  });

  res.json({ success: true, message: 'Appointment approved.', data: updated });
});

/**
 * @route   PATCH /api/appointments/:id/reject
 * @desc    Doctor rejects an appointment
 * @access  Private (Doctor with active subscription)
 */
const rejectAppointment = asyncHandler(async (req, res) => {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

  const appointment = await prisma.appointment.findFirst({
    where: { id: req.params.id, doctorId: profile.id },
  });

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }

  if (appointment.status !== 'PENDING') {
    return res.status(400).json({ success: false, message: `Cannot reject an appointment with status: ${appointment.status}.` });
  }

  const updated = await prisma.appointment.update({
    where: { id: req.params.id },
    data: { status: 'REJECTED' },
  });

  res.json({ success: true, message: 'Appointment rejected.', data: updated });
});

/**
 * @route   GET /api/appointments/:id
 * @desc    Get single appointment details
 * @access  Private (owner patient or doctor)
 */
const getAppointmentById = asyncHandler(async (req, res) => {
  const profile = req.user.role === 'DOCTOR'
    ? await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } })
    : null;

  const whereClause =
    req.user.role === 'PATIENT'
      ? { id: req.params.id, patientId: req.user.id }
      : req.user.role === 'DOCTOR'
      ? { id: req.params.id, doctorId: profile?.id }
      : { id: req.params.id }; // ADMIN

  const appointment = await prisma.appointment.findFirst({
    where: whereClause,
    include: {
      doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
      patient: { select: { id: true, name: true, email: true } },
    },
  });

  if (!appointment) {
    return res.status(404).json({ success: false, message: 'Appointment not found.' });
  }

  res.json({ success: true, data: appointment });
});

module.exports = {
  bookAppointment,
  cancelAppointment,
  approveAppointment,
  rejectAppointment,
  getAppointmentById,
};
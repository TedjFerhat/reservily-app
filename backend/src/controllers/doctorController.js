const Joi = require('joi');
const prisma = require('../config/db');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// ─── Validation Schemas ────────────────────────────────────────────────────────

const profileUpdateSchema = Joi.object({
  specialty: Joi.string().optional(),
  city: Joi.string().optional(),
  clinicAddress: Joi.string().optional(),
  price: Joi.number().positive().optional(),
  bio: Joi.string().max(1000).optional(),
  experience: Joi.number().integer().min(0).optional(),
});

const availabilitySchema = Joi.object({
  dayOfWeek: Joi.string()
    .valid('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY')
    .required(),
  startTime: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({ 'string.pattern.base': 'startTime must be in HH:MM format' }),
  endTime: Joi.string()
    .pattern(/^([0-1]\d|2[0-3]):([0-5]\d)$/)
    .required()
    .messages({ 'string.pattern.base': 'endTime must be in HH:MM format' }),
});

const paymentProofSchema = Joi.object({
  referenceNumber: Joi.string().required(),
  amount: Joi.number().positive().required(),
  notes: Joi.string().max(500).optional(),
  proofImageUrl: Joi.string().uri().required(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/doctors
 * @desc    Search and list doctors (public - with filters)
 * @access  Public
 */
const getDoctors = asyncHandler(async (req, res) => {
  const { specialty, city, page = 1, limit = 10 } = req.query;

  const where = {
    subscriptionStatus: 'ACTIVE',
    user: { isActive: true },
    ...(specialty && { specialty: { contains: specialty, mode: 'insensitive' } }),
    ...(city && { city: { contains: city, mode: 'insensitive' } }),
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [doctors, total] = await Promise.all([
    prisma.doctorProfile.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        user: { select: { id: true, name: true, email: true } },
        availability: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.doctorProfile.count({ where }),
  ]);

  res.json({
    success: true,
    data: doctors,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  });
});

/**
 * @route   GET /api/doctors/:id
 * @desc    Get a single doctor profile
 * @access  Public
 */
const getDoctorById = asyncHandler(async (req, res) => {
  const doctor = await prisma.doctorProfile.findFirst({
    where: {
      id: req.params.id,
      subscriptionStatus: 'ACTIVE',
      user: { isActive: true },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
      availability: true,
    },
  });

  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found.' });
  }

  res.json({ success: true, data: doctor });
});

/**
 * @route   PUT /api/doctors/profile
 * @desc    Update doctor's own profile
 * @access  Private (Doctor only)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = profileUpdateSchema.validate(req.body);
  if (error) {
    return res.status(422).json({ success: false, message: error.details[0].message.replace(/['"]/g, '') });
  }

  const profile = await prisma.doctorProfile.update({
    where: { userId: req.user.id },
    data: value,
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  res.json({ success: true, message: 'Profile updated.', data: profile });
});

/**
 * @route   GET /api/doctors/availability
 * @desc    Get doctor's own availability schedule
 * @access  Private (Doctor only)
 */
const getMyAvailability = asyncHandler(async (req, res) => {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

  const availability = await prisma.availability.findMany({
    where: { doctorId: profile.id },
    orderBy: { dayOfWeek: 'asc' },
  });

  res.json({ success: true, data: availability });
});

/**
 * @route   POST /api/doctors/availability
 * @desc    Set/update availability for a day
 * @access  Private (Doctor with active subscription)
 */
const setAvailability = asyncHandler(async (req, res) => {
  const { error, value } = availabilitySchema.validate(req.body);
  if (error) {
    return res.status(422).json({ success: false, message: error.details[0].message.replace(/['"]/g, '') });
  }

  const { dayOfWeek, startTime, endTime } = value;

  if (startTime >= endTime) {
    return res.status(400).json({ success: false, message: 'startTime must be before endTime.' });
  }

  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

  // Upsert availability (create or update for that day)
  const availability = await prisma.availability.upsert({
    where: { doctorId_dayOfWeek: { doctorId: profile.id, dayOfWeek } },
    update: { startTime, endTime },
    create: { doctorId: profile.id, dayOfWeek, startTime, endTime },
  });

  res.status(201).json({ success: true, message: 'Availability updated.', data: availability });
});

/**
 * @route   DELETE /api/doctors/availability/:dayOfWeek
 * @desc    Remove availability for a specific day
 * @access  Private (Doctor with active subscription)
 */
const deleteAvailability = asyncHandler(async (req, res) => {
  const validDays = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
  const dayOfWeek = req.params.dayOfWeek.toUpperCase();

  if (!validDays.includes(dayOfWeek)) {
    return res.status(400).json({ success: false, message: 'Invalid day of week.' });
  }

  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

  await prisma.availability.deleteMany({
    where: { doctorId: profile.id, dayOfWeek },
  });

  res.json({ success: true, message: `Availability for ${dayOfWeek} removed.` });
});

/**
 * @route   GET /api/doctors/appointments
 * @desc    Get doctor's appointments (with optional status filter)
 * @access  Private (Doctor with active subscription)
 */
const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

  const where = {
    doctorId: profile.id,
    ...(status && { status: status.toUpperCase() }),
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        patient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({
    success: true,
    data: appointments,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

/**
 * @route   POST /api/doctors/payment-proof
 * @desc    Submit bank transfer proof for subscription activation
 * @access  Private (Doctor only)
 */
const submitPaymentProof = asyncHandler(async (req, res) => {
  const { error, value } = paymentProofSchema.validate(req.body);
  if (error) {
    return res.status(422).json({ success: false, message: error.details[0].message.replace(/['"]/g, '') });
  }

  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });
  if (!profile) return res.status(404).json({ success: false, message: 'Doctor profile not found.' });

  // Record the payment submission for admin review
  const submission = await prisma.paymentSubmission.create({
    data: {
      doctorId: profile.id,
      amount: value.amount,
      proofImageUrl: value.proofImageUrl,
      referenceNumber: value.referenceNumber,
      notes: value.notes || null,
    },
  });

  // Update doctor profile to show pending payment
  await prisma.doctorProfile.update({
    where: { id: profile.id },
    data: {
      paymentProofUrl: value.proofImageUrl,
      paymentReference: value.referenceNumber,
      subscriptionStatus: 'PENDING',
    },
  });

  res.status(201).json({
    success: true,
    message: 'Payment proof submitted. An admin will review and activate your subscription within 24 hours.',
    data: { submissionId: submission.id },
  });
});

/**
 * @route   GET /api/doctors/subscription-info
 * @desc    Get bank account details for subscription payment
 * @access  Private (Doctor only)
 */
const getSubscriptionInfo = asyncHandler(async (req, res) => {
  const profile = await prisma.doctorProfile.findUnique({ where: { userId: req.user.id } });

  res.json({
    success: true,
    data: {
      subscriptionStatus: profile?.subscriptionStatus || 'INACTIVE',
      subscriptionExpiresAt: profile?.subscriptionExpiresAt || null,
      monthlyPrice: parseFloat(process.env.SUBSCRIPTION_MONTHLY_PRICE) || 29.99,
      paymentInstructions: {
        bankName: process.env.BANK_NAME,
        accountNumber: process.env.BANK_ACCOUNT_NUMBER,
        accountHolder: process.env.BANK_ACCOUNT_HOLDER,
        routingNumber: process.env.BANK_ROUTING_NUMBER,
        steps: [
          '1. Transfer the monthly subscription fee to the bank account above',
          '2. Include your registered email as the transfer reference',
          '3. Submit your payment proof via POST /api/doctors/payment-proof',
          '4. An admin will verify and activate your account within 24 hours',
        ],
      },
    },
  });
});

module.exports = {
  getDoctors,
  getDoctorById,
  updateProfile,
  getMyAvailability,
  setAvailability,
  deleteAvailability,
  getMyAppointments,
  submitPaymentProof,
  getSubscriptionInfo,
};
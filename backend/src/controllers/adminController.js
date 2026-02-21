const Joi = require('joi');
const prisma = require('../config/db');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/admin/users
 * @desc    List all users with optional role filter
 * @access  Private (Admin only)
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const { role, page = 1, limit = 20, search } = req.query;

  const where = {
    ...(role && { role: role.toUpperCase() }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: parseInt(limit),
      select: {
        id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
        doctorProfile: {
          select: {
            id: true, specialty: true, city: true,
            subscriptionStatus: true, subscriptionExpiresAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    success: true,
    data: users,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

/**
 * @route   GET /api/admin/users/:id
 * @desc    Get detailed info on a single user
 * @access  Private (Admin only)
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, email: true, role: true, isActive: true, createdAt: true,
      doctorProfile: {
        include: { availability: true },
      },
    },
  });

  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  res.json({ success: true, data: user });
});

/**
 * @route   PATCH /api/admin/users/:id/suspend
 * @desc    Suspend (deactivate) a user account
 * @access  Private (Admin only)
 */
const suspendUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  if (user.role === 'ADMIN') {
    return res.status(403).json({ success: false, message: 'Cannot suspend an admin account.' });
  }

  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: false },
  });

  res.json({ success: true, message: `User ${user.name} has been suspended.` });
});

/**
 * @route   PATCH /api/admin/users/:id/activate
 * @desc    Reactivate a suspended user account
 * @access  Private (Admin only)
 */
const activateUser = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  await prisma.user.update({
    where: { id: req.params.id },
    data: { isActive: true },
  });

  res.json({ success: true, message: `User ${user.name} has been reactivated.` });
});

/**
 * @route   GET /api/admin/payment-submissions
 * @desc    List all pending payment proof submissions
 * @access  Private (Admin only)
 */
const getPaymentSubmissions = asyncHandler(async (req, res) => {
  const { verified, page = 1, limit = 20 } = req.query;

  const where = {
    ...(verified !== undefined && { isVerified: verified === 'true' }),
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [submissions, total] = await Promise.all([
    prisma.paymentSubmission.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
    }),
    prisma.paymentSubmission.count({ where }),
  ]);

  res.json({
    success: true,
    data: submissions,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

/**
 * @route   POST /api/admin/payment-submissions/:id/verify
 * @desc    Verify a payment and activate the doctor's subscription
 * @access  Private (Admin only)
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const schema = Joi.object({
    durationMonths: Joi.number().integer().min(1).max(12).default(1),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(422).json({ success: false, message: error.details[0].message });

  const submission = await prisma.paymentSubmission.findUnique({
    where: { id: req.params.id },
  });

  if (!submission) return res.status(404).json({ success: false, message: 'Payment submission not found.' });
  if (submission.isVerified) return res.status(400).json({ success: false, message: 'Payment already verified.' });

  // Calculate expiry date
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + value.durationMonths);

  // Activate doctor's subscription
  await prisma.$transaction(async (tx) => {
    await tx.paymentSubmission.update({
      where: { id: req.params.id },
      data: { isVerified: true, verifiedAt: new Date(), verifiedBy: req.user.id },
    });

    await tx.doctorProfile.update({
      where: { id: submission.doctorId },
      data: {
        subscriptionStatus: 'ACTIVE',
        subscriptionExpiresAt: expiresAt,
      },
    });
  });

  res.json({
    success: true,
    message: `Subscription activated for ${value.durationMonths} month(s). Expires: ${expiresAt.toISOString().split('T')[0]}`,
  });
});

/**
 * @route   POST /api/admin/payment-submissions/:id/reject
 * @desc    Reject a payment submission
 * @access  Private (Admin only)
 */
const rejectPayment = asyncHandler(async (req, res) => {
  const submission = await prisma.paymentSubmission.findUnique({ where: { id: req.params.id } });
  if (!submission) return res.status(404).json({ success: false, message: 'Submission not found.' });

  // Reset doctor back to INACTIVE
  await prisma.$transaction(async (tx) => {
    await tx.paymentSubmission.delete({ where: { id: req.params.id } });
    await tx.doctorProfile.update({
      where: { id: submission.doctorId },
      data: { subscriptionStatus: 'INACTIVE', paymentProofUrl: null, paymentReference: null },
    });
  });

  res.json({ success: true, message: 'Payment rejected. Doctor notified to resubmit.' });
});

/**
 * @route   GET /api/admin/stats
 * @desc    Get platform statistics
 * @access  Private (Admin only)
 */
const getStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalDoctors,
    totalPatients,
    activeDoctors,
    pendingDoctors,
    totalAppointments,
    pendingAppointments,
    pendingPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'DOCTOR' } }),
    prisma.user.count({ where: { role: 'PATIENT' } }),
    prisma.doctorProfile.count({ where: { subscriptionStatus: 'ACTIVE' } }),
    prisma.doctorProfile.count({ where: { subscriptionStatus: 'PENDING' } }),
    prisma.appointment.count(),
    prisma.appointment.count({ where: { status: 'PENDING' } }),
    prisma.paymentSubmission.count({ where: { isVerified: false } }),
  ]);

  res.json({
    success: true,
    data: {
      users: { total: totalUsers, doctors: totalDoctors, patients: totalPatients },
      doctors: { active: activeDoctors, pendingVerification: pendingDoctors },
      appointments: { total: totalAppointments, pending: pendingAppointments },
      payments: { pendingReview: pendingPayments },
    },
  });
});

/**
 * @route   GET /api/admin/appointments
 * @desc    Get all appointments platform-wide
 * @access  Private (Admin only)
 */
const getAllAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const where = { ...(status && { status: status.toUpperCase() }) };
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        doctor: { include: { user: { select: { id: true, name: true, email: true } } } },
        patient: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.appointment.count({ where }),
  ]);

  res.json({
    success: true,
    data: appointments,
    pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / parseInt(limit)) },
  });
});

module.exports = {
  getAllUsers,
  getUserById,
  suspendUser,
  activateUser,
  getPaymentSubmissions,
  verifyPayment,
  rejectPayment,
  getStats,
  getAllAppointments,
};
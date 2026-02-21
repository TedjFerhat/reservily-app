const Joi = require('joi');
const prisma = require('../config/db');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// ─── Validation Schemas ────────────────────────────────────────────────────────

const profileUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @route   GET /api/patients/profile
 * @desc    Get patient's own profile
 * @access  Private (Patient only)
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  res.json({ success: true, data: user });
});

/**
 * @route   PUT /api/patients/profile
 * @desc    Update patient profile
 * @access  Private (Patient only)
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { error, value } = profileUpdateSchema.validate(req.body);
  if (error) {
    return res.status(422).json({ success: false, message: error.details[0].message.replace(/['"]/g, '') });
  }

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: value,
    select: { id: true, name: true, email: true, role: true, updatedAt: true },
  });

  res.json({ success: true, message: 'Profile updated.', data: updated });
});

/**
 * @route   GET /api/patients/appointments
 * @desc    Get patient's appointment history
 * @access  Private (Patient only)
 */
const getMyAppointments = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;

  const where = {
    patientId: req.user.id,
    ...(status && { status: status.toUpperCase() }),
  };

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [appointments, total] = await Promise.all([
    prisma.appointment.findMany({
      where,
      skip,
      take: parseInt(limit),
      include: {
        doctor: {
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
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

module.exports = { getProfile, updateProfile, getMyAppointments };
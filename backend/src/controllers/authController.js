const bcrypt = require('bcryptjs');
const Joi = require('joi');
const prisma = require('../config/db');
const generateToken = require('../utils/generateToken');
const { asyncHandler } = require('../middlewares/errorMiddleware');

// ─── Validation Schemas ────────────────────────────────────────────────────────

const registerSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  role: Joi.string().valid('DOCTOR', 'PATIENT').required(),
  // Doctor-specific fields
  specialty: Joi.when('role', {
    is: 'DOCTOR',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  city: Joi.when('role', {
    is: 'DOCTOR',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  clinicAddress: Joi.when('role', {
    is: 'DOCTOR',
    then: Joi.string().required(),
    otherwise: Joi.forbidden(),
  }),
  price: Joi.when('role', {
    is: 'DOCTOR',
    then: Joi.number().positive().required(),
    otherwise: Joi.forbidden(),
  }),
  experience: Joi.when('role', {
    is: 'DOCTOR',
    then: Joi.number().integer().min(0).required(),
    otherwise: Joi.forbidden(),
  }),
  bio: Joi.when('role', {
    is: 'DOCTOR',
    then: Joi.string().max(1000).optional(),
    otherwise: Joi.forbidden(),
  }),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * @route   POST /api/auth/register
 * @desc    Register a new patient or doctor
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message.replace(/['"]/g, '')),
    });
  }

  const { name, email, password, role, specialty, city, clinicAddress, price, experience, bio } = value;

  // Check for existing email
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ success: false, message: 'Email already registered.' });
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user (and doctor profile in a transaction if doctor)
  let user;
  if (role === 'DOCTOR') {
    user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { name, email, password: hashedPassword, role },
      });

      await tx.doctorProfile.create({
        data: {
          userId: newUser.id,
          specialty,
          city,
          clinicAddress,
          price,
          experience,
          bio: bio || null,
          subscriptionStatus: 'INACTIVE',
        },
      });

      return newUser;
    });
  } else {
    user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });
  }

  const token = generateToken(user.id, user.role);

  const bankInfo = role === 'DOCTOR' ? {
    bankInfo: {
      bankName: process.env.BANK_NAME,
      accountNumber: process.env.BANK_ACCOUNT_NUMBER,
      accountHolder: process.env.BANK_ACCOUNT_HOLDER,
      routingNumber: process.env.BANK_ROUTING_NUMBER,
      amount: process.env.SUBSCRIPTION_MONTHLY_PRICE,
      instructions: 'Please transfer the subscription fee and submit your payment proof via POST /api/doctors/payment-proof',
    },
  } : {};

  res.status(201).json({
    success: true,
    message: role === 'DOCTOR'
      ? 'Doctor account created. Please complete payment to activate your subscription.'
      : 'Patient account created successfully.',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...bankInfo,
    },
  });
});

/**
 * @route   POST /api/auth/login
 * @desc    Login and get JWT token
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(422).json({
      success: false,
      message: error.details[0].message.replace(/['"]/g, ''),
    });
  }

  const { email, password } = value;

  // Find user with doctor profile if applicable
  const user = await prisma.user.findUnique({
    where: { email },
    include: { doctorProfile: true },
  });

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  if (!user.isActive) {
    return res.status(403).json({ success: false, message: 'Your account has been suspended. Contact support.' });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = generateToken(user.id, user.role);

  res.json({
    success: true,
    message: 'Login successful.',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.doctorProfile && {
          subscriptionStatus: user.doctorProfile.subscriptionStatus,
          subscriptionExpiresAt: user.doctorProfile.subscriptionExpiresAt,
        }),
      },
    },
  });
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current authenticated user info
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: {
      doctorProfile: {
        include: { availability: true },
      },
    },
  });

  // Remove password from response
  const { password, ...userData } = user;

  res.json({ success: true, data: userData });
});

/**
 * @route   PUT /api/auth/change-password
 * @desc    Change authenticated user password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(8).max(100).required(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) {
    return res.status(422).json({ success: false, message: error.details[0].message.replace(/['"]/g, '') });
  }

  const user = await prisma.user.findUnique({ where: { id: req.user.id } });

  const isMatch = await bcrypt.compare(value.currentPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }

  const hashed = await bcrypt.hash(value.newPassword, 12);
  await prisma.user.update({ where: { id: req.user.id }, data: { password: hashed } });

  res.json({ success: true, message: 'Password updated successfully.' });
});

module.exports = { register, login, getMe, changePassword };
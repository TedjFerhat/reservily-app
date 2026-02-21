/**
 * Email Service
 * Uses nodemailer to send transactional emails.
 * Install: npm install nodemailer
 * Configure EMAIL_* variables in .env
 */

// Uncomment the block below and install nodemailer to enable email notifications:
/*
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: `"Reservily" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  });
};
*/

/**
 * Send appointment confirmation to patient
 */
const sendAppointmentConfirmation = async (patient, doctor, appointment) => {
  // TODO: integrate nodemailer
  console.log(`[EMAIL] Appointment confirmation sent to ${patient.email}`);
};

/**
 * Send subscription activated email to doctor
 */
const sendSubscriptionActivated = async (doctor, expiresAt) => {
  // TODO: integrate nodemailer
  console.log(`[EMAIL] Subscription activated email sent to ${doctor.email}`);
};

/**
 * Send appointment status update to patient
 */
const sendAppointmentStatusUpdate = async (patient, status) => {
  // TODO: integrate nodemailer
  console.log(`[EMAIL] Appointment ${status} email sent to ${patient.email}`);
};

module.exports = {
  sendAppointmentConfirmation,
  sendSubscriptionActivated,
  sendAppointmentStatusUpdate,
};
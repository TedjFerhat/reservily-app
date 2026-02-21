/**
 * Payment Service - Manual Bank Transfer
 *
 * This platform uses a manual bank transfer flow instead of Stripe:
 * 1. Doctor registers and sees bank account details
 * 2. Doctor transfers subscription fee manually
 * 3. Doctor submits proof of payment via the API
 * 4. Admin reviews proof and activates subscription
 *
 * If you want to add Stripe in the future, install: npm install stripe
 * and replace this service with Stripe checkout sessions.
 */

/**
 * Get bank account information for subscription payment
 * @returns {Object} Bank account details
 */
const getBankAccountInfo = () => ({
  bankName: process.env.BANK_NAME || 'National Bank',
  accountNumber: process.env.BANK_ACCOUNT_NUMBER || '0000000000',
  accountHolder: process.env.BANK_ACCOUNT_HOLDER || 'Reservily Platform',
  routingNumber: process.env.BANK_ROUTING_NUMBER || '000000000',
  amount: parseFloat(process.env.SUBSCRIPTION_MONTHLY_PRICE) || 29.99,
  currency: 'USD',
});

/**
 * Calculate subscription expiry date
 * @param {number} months - Number of months to add
 * @returns {Date} Expiry date
 */
const calculateExpiryDate = (months = 1) => {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
};

/**
 * Check if a subscription is currently active
 * @param {string} status - Subscription status
 * @param {Date|null} expiresAt - Expiry date
 * @returns {boolean}
 */
const isSubscriptionActive = (status, expiresAt) => {
  if (status !== 'ACTIVE') return false;
  if (!expiresAt) return false;
  return new Date(expiresAt) > new Date();
};

module.exports = {
  getBankAccountInfo,
  calculateExpiryDate,
  isSubscriptionActive,
};
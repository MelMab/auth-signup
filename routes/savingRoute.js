const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Savings
 *   description: Savings management and Paystack integrations
 */

// 1. PUBLIC ROUTES
/**
 * @swagger
 * /savings/webhook:
 *   post:
 *     summary: Paystack Webhook listener
 *     tags: [Savings]
 *     responses:
 *       200:
 *         description: Webhook received successfully
 */
router.post('/webhook', savingsController.handlePaystackWebhook);

/**
 * @swagger
 * /savings/verify:
 *   get:
 *     summary: Verify a Paystack transaction
 *     tags: [Savings]
 *     parameters:
 *       - in: query
 *         name: reference
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Payment verified
 */
router.get('/verify', savingsController.verifyPaystackPayment);

// 2. AUTHENTICATED ROUTES
router.use(authenticate);

// 3. OWNER ONLY ROUTES
/**
 * @swagger
 * /savings/update-status:
 *   patch:
 *     summary: Update deposit status (Owner only)
 *     tags: [Savings]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               depositId: { type: string }
 *               status: { type: string, enum: [Pending, Completed, Failed] }
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Unauthorized - Owner role required
 */
router.patch('/update-status', authorize(['Owner']), savingsController.updateDepositStatus);

// 4. CUSTOMER ONLY ROUTES
router.use(authorize(['Customer']));

/**
 * @swagger
 * /savings/deposit:
 *   post:
 *     summary: Add new savings deposit
 *     tags: [Savings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       201:
 *         description: Deposit initiated
 */
router.post('/deposit', savingsController.addSavings);

/**
 * @swagger
 * /savings/history:
 *   get:
 *     summary: Get user savings history
 *     tags: [Savings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of past transactions
 */
router.get('/history', savingsController.getSavingsHistory);

/**
 * @swagger
 * /savings/recent:
 *   get:
 *     summary: Get recent deposits
 *     tags: [Savings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of recent activity
 */
router.get('/recent', savingsController.getRecentDeposits);

/**
 * @swagger
 * /savings/redeem:
 *   get:
 *     summary: Get redemption screen details
 *     tags: [Savings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Redemption data retrieved
 */
router.get('/redeem', savingsController.getRedeemScreen);

/**
 * @swagger
 * /savings/banks:
 *   get:
 *     summary: Get list of supported banks
 *     tags: [Savings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of banks
 */
router.get('/banks', savingsController.getBankList);

/**
 * @swagger
 * /savings/withdraw:
 *   post:
 *     summary: Submit a withdrawal request
 *     tags: [Savings]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Withdrawal submitted
 */
router.post('/withdraw', savingsController.submitWithdrawal);

module.exports = router;

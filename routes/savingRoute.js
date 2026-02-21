const express = require('express');
const router = express.Router();
const savingsController = require('../controllers/savingsController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

// 1. PUBLIC ROUTES (No Auth)
router.post('/webhook', savingsController.handlePaystackWebhook);
router.get('/verify', savingsController.verifyPaystackPayment);

// 2. AUTHENTICATED ROUTES (Must be logged in)
router.use(authenticate);

// 3. OWNER ONLY ROUTES
// Move this ABOVE the Customer restriction
router.patch('/update-status', authorize(['Owner']), savingsController.updateDepositStatus);

// 4. CUSTOMER ONLY ROUTES
// Now restrict everything else to Customers
router.use(authorize(['Customer']));

router.post('/deposit', savingsController.addSavings);
router.get('/history', savingsController.getSavingsHistory);
router.get('/recent', savingsController.getRecentDeposits);
router.get('/redeem', savingsController.getRedeemScreen);
router.get('/banks', savingsController.getBankList);
router.post('/withdraw', savingsController.submitWithdrawal);

module.exports = router;

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

/**
 * @swagger
 * components:
 *   schemas:
 *     UserSignup:
 *       type: object
 *       required: [first_name, last_name, email, phone, password, account_type]
 *       properties:
 *         first_name:   { type: string, example: Jane }
 *         last_name:    { type: string, example: Doe }
 *         email:        { type: string, example: jane@example.com }
 *         phone:        { type: string, example: "+2348012345678" }
 *         password:     { type: string, example: "StrongPass123!" }
 *         account_type: { type: string, enum: [Customer, Owner] }
 *     LoginResponse:
 *       type: object
 *       properties:
 *         message:    { type: string }
 *         token:      { type: string, description: JWT token for authentication }
 *         expires_in: { type: string, example: 1d }
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Create a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserSignup'
 *     responses:
 *       201:
 *         description: Account created successfully
 *       400:
 *         description: Validation error or email already exists
 */
router.post('/signup', authController.signup);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login and receive JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:       { type: string, example: jane@example.com }
 *               password:    { type: string, example: "StrongPass123!" }
 *               remember_me: { type: boolean, example: true, description: "true = 30 day token, false = 1 day" }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       400:
 *         description: Invalid credentials
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/auth/account-summary:
 *   get:
 *     summary: Get logged-in user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account data returned
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               data:
 *                 id: 1
 *                 first_name: Jane
 *                 last_name: Doe
 *                 email: jane@example.com
 *                 account_type: Customer
 *                 balance: 15000
 */
router.get('/account-summary', authenticate, authController.getAccountSummary);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request a 6-digit reset code via email
 *     description: >
 *       Sends a 6-digit code to the registered email address.
 *       Code expires in 15 minutes. Always returns success to prevent email enumeration.
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string, example: jane@example.com }
 *     responses:
 *       200:
 *         description: Code sent (or silently ignored if email not found)
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: If that email exists, a code has been sent.
 *       500:
 *         description: Email delivery failed
 */
router.post('/forgot-password', authController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using emailed code
 *     description: >
 *       Verifies the 6-digit code sent to the user's email and updates their password.
 *       Code must not be expired (15 minute window from request).
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code, new_password]
 *             properties:
 *               email:            { type: string, example: jane@example.com }
 *               code:             { type: string, example: "483921", description: 6-digit code from email }
 *               new_password:     { type: string, example: "NewPass456!", description: Min 8 characters }
 *               confirm_password: { type: string, example: "NewPass456!", description: Optional - must match new_password }
 *     responses:
 *       200:
 *         description: Password updated successfully
 *         content:
 *           application/json:
 *             example:
 *               status: success
 *               message: Password updated successfully
 *       400:
 *         description: Invalid/expired code, password too short, or mismatch
 *         content:
 *           application/json:
 *             examples:
 *               invalid_code:
 *                 value: { message: "Invalid or expired code" }
 *               expired:
 *                 value: { message: "Code has expired. Please request a new one." }
 *               too_short:
 *                 value: { message: "Password must be at least 8 characters" }
 *               mismatch:
 *                 value: { message: "Passwords do not match" }
 */
router.post('/reset-password', authController.resetPassword);

/**
 * @swagger
 * /api/auth/delete-account:
 *   delete:
 *     summary: Deactivate own account
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       404:
 *         description: User not found
 */
router.delete('/delete-account', authenticate, authorize(['Owner', 'Customer']), authController.deleteAccount);

module.exports = router;
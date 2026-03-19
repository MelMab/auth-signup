const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const User = require('../models/userModel');
const { validatePassword } = require('../utils/validator');
const db = require('../configs/connect');
const { sendResetCode } = require('../utils/emailService');

exports.signup = async (req, res) => {
  const { first_name, last_name, email, phone, password, account_type } = req.body;
  try {
    if (!validator.isEmail(email)) return res.status(400).json({ message: "Invalid email format" });

    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Email already registered or account inactive" });

    const password_hash = await bcrypt.hash(password, 12);
    await User.createUser({ first_name, last_name, email, phone, password_hash, account_type });

    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    console.error("SIGNUP ERROR:", error.message);
    res.status(500).json({ message: "Server error during signup: " + error.message });
  }
};

exports.login = async (req, res) => {
  const { email, password, remember_me } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials or account inactive" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const expiresIn = remember_me ? '30d' : '1d';
    const token = jwt.sign(
      { id: user.id, email: user.email, account_type: user.account_type },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      expires_in: expiresIn
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error.message);
    res.status(500).json({ message: "Server error during login: " + error.message });
  }
};

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const [rows] = await db.execute(
      'SELECT id, first_name, email FROM users WHERE email = ?', [email]
    );

    // Always return success to prevent email enumeration
    if (!rows.length) {
      return res.status(200).json({ status: 'success', message: 'If that email exists, a code has been sent.' });
    }

    const user = rows[0];
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await db.execute(
      'UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [code, expires, user.id]
    );

    await sendResetCode(user.email, user.first_name, code);

    res.status(200).json({ status: 'success', message: 'If that email exists, a code has been sent.' });
  } catch (err) {
    console.error('forgotPassword error:', err.message);
    res.status(500).json({ message: 'Failed to send reset code' });
  }
};

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { email, code, new_password, confirm_password } = req.body;

  if (!email || !code || !new_password) {
    return res.status(400).json({ message: 'email, code and new_password are required' });
  }
  if (new_password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  if (confirm_password && new_password !== confirm_password) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, reset_token, reset_token_expires FROM users WHERE email = ?', [email]
    );

    if (!rows.length || !rows[0].reset_token || rows[0].reset_token !== code) {
      return res.status(400).json({ message: 'Invalid or expired code' });
    }

    if (new Date() > new Date(rows[0].reset_token_expires)) {
      return res.status(400).json({ message: 'Code has expired. Please request a new one.' });
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await db.execute(
      'UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [hashed, rows[0].id]
    );

    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  } catch (err) {
    console.error('resetPassword error:', err.message);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// ─── GET /api/auth/account-summary ───────────────────────────────────────────
exports.getAccountSummary = async (req, res) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, first_name, last_name, email, phone, account_type, status, balance, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ status: 'success', data: rows[0] });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch account: " + error.message });
  }
};

exports.deleteAccount = async (req, res) => {
  try {
    const [result] = await User.deactivate(req.user.id);
    if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'Account deactivated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Deactivation failed' });
  }
};
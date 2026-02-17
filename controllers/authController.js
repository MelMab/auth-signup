const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const validator = require('validator');
const User = require('../models/userModel');
const { validatePassword } = require('../utils/validator');
const termiiConfig = require('../configs/termii');

exports.signup = async (req, res) => {
  const { first_name, last_name, email, phone, password, account_type } = req.body;
  try {
    if (!validator.isEmail(email)) return res.status(400).json({ message: "Invalid email format" });
    const passwordError = validatePassword(password);
    if (passwordError) return res.status(400).json({ message: passwordError });

    const existingUser = await User.findByEmail(email);
    if (existingUser) return res.status(400).json({ message: "Email already registered" });

    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    await User.createUser({first_name, last_name, email, phone, password_hash, account_type });
    res.status(201).json({ message: "Account created successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during signup" });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findByEmail(email);
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, email: user.email, account_type: user.account_type },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error during login" });
  }
};

// --- REQUEST OTP ---
exports.requestPasswordReset = async (req, res) => {
  const { phone } = req.body;
  try {
    if (!phone) return res.status(400).json({ message: "Phone number is required" });
    
    const user = await User.findByPhone(phone);
    if (!user) return res.status(404).json({ status: 'error', message: 'User not found' });

    const payload = {
      api_key: termiiConfig.apiKey,
      message_type: "NUMERIC",
      to: phone.replace('+', ''), 
      from: termiiConfig.senderId,
      channel: "dnd",
      pin_attempts: 10,
      pin_time_to_live: 5,
      pin_length: 6,
      pin_placeholder: "< 123456 >",
      message_text: "Your StockSave reset code is < 123456 >",
      pin_type: "NUMERIC"
    };

    const response = await axios.post(`${termiiConfig.baseUrl}/api/sms/otp/send`, payload);

    res.status(200).json({ 
      status: 'success', 
      message: 'Reset OTP sent', 
      pinId: response.data.pinId 
    });
  } catch (err) {
    console.error("Termii Send Error:", err.response?.data || err.message);
    res.status(500).json({ status: 'error', message: 'Failed to send OTP' });
  }
};

// --- VERIFY OTP AND RESET PASSWORD (ADDED BACK) ---
exports.resetPassword = async (req, res) => {
  const { phone, otp, pinId, newPassword } = req.body;
  
  try {
    if (!phone || !otp || !pinId || !newPassword) {
      return res.status(400).json({ message: "All fields (phone, otp, pinId, newPassword) are required" });
    }

    // 1. Verify with Termii
    const verifyPayload = {
      api_key: termiiConfig.apiKey,
      pin_id: pinId,
      pin: otp
    };

    const verification = await axios.post(`${termiiConfig.baseUrl}/api/sms/otp/verify`, verifyPayload);

    // Termii returns verified as boolean or string "True"
    if (!verification.data.verified || verification.data.verified.toString().toLowerCase() !== 'true') {
      return res.status(400).json({ status: 'error', message: 'Invalid or expired OTP' });
    }

    // 2. Hash New Password and Update DB
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    await User.updatePassword(phone, newPasswordHash);
    
    res.status(200).json({ status: 'success', message: 'Password updated successfully' });
  } catch (err) {
    console.error("Verification Error:", err.response?.data || err.message);
    res.status(500).json({ status: 'error', message: 'Reset failed' });
  }
};

exports.getAccountSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            status: 'success',
            data: {
                first_name: user.first_name,
                last_name: user.last_name,
                balance: user.balance,
                account_type: user.account_type,
                member_since: user.created_at,
                active_plans: 1, 
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Error fetching summary" });
    }
};

exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id; 
    await User.deleteById(userId);
    res.status(200).json({ status: 'success', message: 'Account deleted successfully' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Deletion failed' });
  }
};

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,           // TLS, not SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false  // fixes self-signed certificate error
  }
});

exports.sendResetCode = async (toEmail, firstName, code) => {
  const mailOptions = {
    from: `"StockSave AI" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your StockSave Password Reset Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #2E7D32;">StockSave AI</h2>
        </div>
        <p style="color: #333;">Hi <strong>${firstName}</strong>,</p>
        <p style="color: #555;">We received a request to reset your password. Use the code below — it expires in <strong>15 minutes</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <span style="
            display: inline-block;
            font-size: 36px;
            font-weight: bold;
            letter-spacing: 10px;
            color: #2E7D32;
            background: #E8F5E9;
            padding: 16px 32px;
            border-radius: 8px;
          ">${code}</span>
        </div>
        <p style="color: #555;">If you did not request a password reset, you can safely ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
        <p style="font-size: 12px; color: #999; text-align: center;">© ${new Date().getFullYear()} StockSave AI. All rights reserved.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};
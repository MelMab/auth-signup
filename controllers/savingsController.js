const db = require('../configs/connect');
const axios = require('axios');

exports.addSavings = async (req, res) => {

  const { amount, method, reference } = req.body;
  const user_id = req.user.id; // derive from JWT

  if (amount === undefined || !method) {
    return res.status(400).json({
      error: "Missing fields. Ensure amount and method are sent."
    });
  }

  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({
      error: "Amount must be a positive number"
    });
  }

  const allowedMethods = ['Cash', 'Paystack'];
  if (!allowedMethods.includes(method)) {
    return res.status(400).json({
      error: "Invalid payment method"
    });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    if (method === "Cash") {

      if (!reference) {
        throw new Error("Cash deposit requires a receipt reference");
      }

      // Insert as Completed immediately
      const [logResult] = await connection.execute(
        `INSERT INTO transactions 
        (user_id, amount, type, method, reference, status) 
        VALUES (?, ?, 'Deposit', 'Cash', ?, 'Completed')`,
        [user_id, amount, reference]
      );

      await connection.execute(
        `UPDATE users SET balance = balance + ? WHERE id = ?`,
        [amount, user_id]
      );

      await connection.commit();

      return res.status(200).json({
        success: true,
        message: "Cash deposit recorded",
        transactionId: logResult.insertId
      });
    }

    // -------------------
    // PAYSTACK FLOW
    // -------------------

    if (method === "Paystack") {

      // 1️⃣ Insert as Pending
      const [logResult] = await connection.execute(
        `INSERT INTO transactions 
        (user_id, amount, type, method, status) 
        VALUES (?, ?, 'Deposit', 'Paystack', 'Pending')`,
        [user_id, amount]
      );

      await connection.commit();

      // 2️⃣ Initialize Paystack payment
      const paystackResponse = await axios.post(
        "https://api.paystack.co/transaction/initialize",
        {
          email: req.user.email,
          amount: amount * 100 // convert to kobo
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      return res.status(200).json({
        success: true,
        payment_url: paystackResponse.data.data.authorization_url
      });
    }

  } catch (error) {
    await connection.rollback();
    return res.status(500).json({
      error: "Transaction failed: " + error.message
    });
  } finally {
    connection.release();
  }
};
// ... existing addSavings code ...


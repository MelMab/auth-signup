const db = require('../configs/connect');

exports.getCustomerDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. GET CORE PROFILE & TOTAL SAVINGS (Green Card)
    const [user] = await db.execute(
      "SELECT first_name, last_name, email, phone, account_type, status, balance, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (!user[0]) return res.status(404).json({ message: "User not found" });

    // 2. GET ACTIVE PAYMENT PLAN INFO (Monthly Card)
    const [plan] = await db.execute(
      "SELECT plan_type, amount, next_payment_date FROM payment_plans WHERE user_id = ? AND status = 'Active' LIMIT 1",
      [userId]
    );

    // 3. GET STOCK ITEMS COUNT (Items Card)
    const [stock] = await db.execute(
      "SELECT COUNT(*) as totalItems FROM stock_items WHERE user_id = ?",
      [userId]
    );

    // 4. GET RECENT ACTIVITY (Last 4 transactions)
    const [transactions] = await db.execute(
      "SELECT type, amount, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 4",
      [userId]
    );

    // 5. SAVINGS PROGRESS - based on real balance vs goals
    const monthlyGoal = 20000;
    const annualGoal = 240000;
    const balance = parseFloat(user[0].balance) || 0;

    const monthlyPercentage = Math.min((balance / monthlyGoal) * 100, 100).toFixed(1);
    const annualPercentage = Math.min((balance / annualGoal) * 100, 100).toFixed(1);

    res.status(200).json({
      status: 'success',
      data: {
        // Full profile (from getAccountSummary - useful for settings/profile screen)
        profile: {
          id: userId,
          first_name: user[0].first_name,
          last_name: user[0].last_name,
          email: user[0].email,
          phone: user[0].phone,
          account_type: user[0].account_type,
          status: user[0].status,
          member_since: user[0].created_at
        },

        // Dashboard summary cards
        greeting: `Welcome Back, ${user[0].first_name}!`,
        summary_cards: {
          total_savings: balance,
          active_plan: plan[0] || { plan_type: 'None', amount: 0 },
          next_payment: plan[0]?.next_payment_date || 'N/A',
          stock_count: stock[0].totalItems
        },

        // Progress bars
        progress: {
          monthly: {
            current: balance,
            goal: monthlyGoal,
            percentage: parseFloat(monthlyPercentage)
          },
          annual: {
            current: balance,
            goal: annualGoal,
            percentage: parseFloat(annualPercentage)
          }
        },

        // Recent transactions
        recent_activity: transactions
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'error', message: 'Dashboard data sync failed' });
  }
};
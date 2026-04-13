/**
 * Balances API Routes
 * GET /api/balances/trip/:tripId              — Get all member balances
 * GET /api/balances/trip/:tripId/settlements  — Get smart settlement plan
 */

const express = require('express');
const router = express.Router();

// ── Get Balances for Trip ────────────────────────────────
router.get('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [members]  = await pool.query('SELECT id, name, color_index FROM members WHERE trip_id = ? ORDER BY id', [tripId]);
    const [expenses] = await pool.query('SELECT id, total_amount, paid_by FROM expenses WHERE trip_id = ?', [tripId]);
    const [splits]   = await pool.query(
      `SELECT s.member_id, s.amount_owed 
       FROM expense_splits s 
       JOIN expenses e ON s.expense_id = e.id 
       WHERE e.trip_id = ?`,
      [tripId]
    );

    const balances = members.map(m => {
      const totalPaid = expenses
        .filter(e => e.paid_by === m.id)
        .reduce((sum, e) => sum + parseFloat(e.total_amount), 0);

      const totalOwed = splits
        .filter(s => s.member_id === m.id)
        .reduce((sum, s) => sum + parseFloat(s.amount_owed), 0);

      return {
        member_id:   m.id,
        member_name: m.name,
        color_index: m.color_index,
        total_paid:  Math.round(totalPaid * 100) / 100,
        total_owed:  Math.round(totalOwed * 100) / 100,
        net_balance: Math.round((totalPaid - totalOwed) * 100) / 100
      };
    });

    res.json(balances);
  } catch (err) {
    console.error('Get balances error:', err);
    res.status(500).json({ error: 'Failed to calculate balances' });
  }
});

// ── Smart Settlement Plan ────────────────────────────────
// Minimizes the number of transactions needed to settle all debts
router.get('/trip/:tripId/settlements', async (req, res) => {
  const { tripId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [members]  = await pool.query('SELECT id, name, color_index FROM members WHERE trip_id = ?', [tripId]);
    const [expenses] = await pool.query('SELECT id, total_amount, paid_by FROM expenses WHERE trip_id = ?', [tripId]);
    const [splits]   = await pool.query(
      `SELECT s.member_id, s.amount_owed 
       FROM expense_splits s 
       JOIN expenses e ON s.expense_id = e.id 
       WHERE e.trip_id = ?`,
      [tripId]
    );

    // Calculate net balance for each member
    const balances = members.map(m => {
      const totalPaid = expenses
        .filter(e => e.paid_by === m.id)
        .reduce((sum, e) => sum + parseFloat(e.total_amount), 0);
      const totalOwed = splits
        .filter(s => s.member_id === m.id)
        .reduce((sum, s) => sum + parseFloat(s.amount_owed), 0);
      return {
        id:          m.id,
        name:        m.name,
        color_index: m.color_index,
        net_balance: Math.round((totalPaid - totalOwed) * 100) / 100
      };
    });

    // Greedy algorithm: match largest debtor with largest creditor
    const creditors = balances.filter(b => b.net_balance > 0.01).sort((a, b) => b.net_balance - a.net_balance);
    const debtors   = balances.filter(b => b.net_balance < -0.01).sort((a, b) => a.net_balance - b.net_balance);
    const transactions = [];

    while (debtors.length && creditors.length) {
      const d = debtors[0];
      const c = creditors[0];
      const amount = Math.min(Math.abs(d.net_balance), c.net_balance);
      const rounded = Math.round(amount * 100) / 100;

      transactions.push({
        payer:        d.name,
        payer_id:     d.id,
        payer_color:  d.color_index,
        receiver:     c.name,
        receiver_id:  c.id,
        receiver_color: c.color_index,
        amount:       rounded
      });

      d.net_balance = Math.round((d.net_balance + rounded) * 100) / 100;
      c.net_balance = Math.round((c.net_balance - rounded) * 100) / 100;

      if (Math.abs(d.net_balance) < 0.01) debtors.shift();
      if (Math.abs(c.net_balance) < 0.01) creditors.shift();
    }

    res.json(transactions);
  } catch (err) {
    console.error('Get settlements error:', err);
    res.status(500).json({ error: 'Failed to calculate settlements' });
  }
});

module.exports = router;

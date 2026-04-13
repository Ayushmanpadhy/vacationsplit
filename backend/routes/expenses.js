/**
 * Expenses API Routes
 * GET    /api/expenses/trip/:tripId        — Get all expenses for a trip
 * GET    /api/expenses/:expenseId/splits   — Get splits for an expense
 * POST   /api/expenses                     — Add a new expense
 * PUT    /api/expenses/:expenseId          — Update an expense
 * DELETE /api/expenses/:expenseId          — Delete an expense
 */

const express = require('express');
const router = express.Router();

// ── Get Expenses by Trip ID ──────────────────────────────
router.get('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [expenses] = await pool.query(
      'SELECT * FROM expenses WHERE trip_id = ? ORDER BY created_at DESC',
      [tripId]
    );
    res.json(expenses);
  } catch (err) {
    console.error('Get expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// ── Get Splits for an Expense ────────────────────────────
router.get('/:expenseId/splits', async (req, res) => {
  const { expenseId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [splits] = await pool.query(
      `SELECT s.*, m.name as member_name 
       FROM expense_splits s 
       JOIN members m ON s.member_id = m.id 
       WHERE s.expense_id = ?`,
      [expenseId]
    );
    res.json(splits);
  } catch (err) {
    console.error('Get splits error:', err);
    res.status(500).json({ error: 'Failed to fetch splits' });
  }
});

// ── Add Expense ──────────────────────────────────────────
router.post('/', async (req, res) => {
  const { trip_id, title, total_amount, paid_by, added_by, category_id, split_type, note, splits } = req.body;
  const pool = req.app.locals.pool;

  // Validation
  if (!trip_id || !title?.trim() || !total_amount || total_amount <= 0) {
    return res.status(400).json({ error: 'Title and valid amount are required' });
  }
  if (!paid_by || !added_by) {
    return res.status(400).json({ error: 'Payer and creator info required' });
  }
  if (!splits || !Array.isArray(splits) || splits.length === 0) {
    return res.status(400).json({ error: 'At least one split is required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Insert expense
    const [expResult] = await connection.query(
      `INSERT INTO expenses (trip_id, title, total_amount, paid_by, added_by, category_id, split_type, note) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [trip_id, title.trim(), total_amount, paid_by, added_by, category_id || 5, split_type || 'even', note || null]
    );
    const expenseId = expResult.insertId;

    // Insert splits
    for (const split of splits) {
      await connection.query(
        'INSERT INTO expense_splits (expense_id, member_id, amount_owed) VALUES (?, ?, ?)',
        [expenseId, split.member_id, split.amount_owed]
      );
    }

    // Log activity
    await connection.query(
      'INSERT INTO activity_log (trip_id, member_id, action, description) VALUES (?, ?, ?, ?)',
      [trip_id, added_by, 'add', `Added "${title.trim()}" — ₹${Number(total_amount).toLocaleString('en-IN')}`]
    );

    await connection.commit();
    res.status(201).json({ id: expenseId });
  } catch (err) {
    await connection.rollback();
    console.error('Add expense error:', err);
    res.status(500).json({ error: 'Failed to add expense' });
  } finally {
    connection.release();
  }
});

// ── Update Expense ───────────────────────────────────────
router.put('/:expenseId', async (req, res) => {
  const { expenseId } = req.params;
  const { trip_id, title, total_amount, paid_by, category_id, split_type, note, splits, member_token } = req.body;
  const pool = req.app.locals.pool;

  if (!member_token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Auth: verify token belongs to the expense creator
    const [members] = await connection.query('SELECT id FROM members WHERE token = ?', [member_token]);
    if (members.length === 0) {
      await connection.rollback();
      return res.status(401).json({ error: 'Invalid token' });
    }
    const memberId = members[0].id;

    const [existing] = await connection.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Expense not found' });
    }
    if (existing[0].added_by !== memberId) {
      await connection.rollback();
      return res.status(403).json({ error: 'You can only edit your own expenses' });
    }

    // Update expense
    await connection.query(
      `UPDATE expenses SET title = ?, total_amount = ?, paid_by = ?, category_id = ?, split_type = ?, note = ? 
       WHERE id = ?`,
      [title?.trim(), total_amount, paid_by, category_id || 5, split_type || 'even', note || null, expenseId]
    );

    // Replace splits
    await connection.query('DELETE FROM expense_splits WHERE expense_id = ?', [expenseId]);
    for (const split of splits) {
      await connection.query(
        'INSERT INTO expense_splits (expense_id, member_id, amount_owed) VALUES (?, ?, ?)',
        [expenseId, split.member_id, split.amount_owed]
      );
    }

    // Log activity
    await connection.query(
      'INSERT INTO activity_log (trip_id, member_id, action, description) VALUES (?, ?, ?, ?)',
      [trip_id || existing[0].trip_id, memberId, 'edit', `Edited "${title?.trim() || existing[0].title}" expense`]
    );

    await connection.commit();
    res.json({ message: 'Updated' });
  } catch (err) {
    await connection.rollback();
    console.error('Update expense error:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  } finally {
    connection.release();
  }
});

// ── Delete Expense ───────────────────────────────────────
router.delete('/:expenseId', async (req, res) => {
  const { expenseId } = req.params;
  const { member_token } = req.query;
  const pool = req.app.locals.pool;

  if (!member_token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Auth check
    const [members] = await connection.query('SELECT id FROM members WHERE token = ?', [member_token]);
    if (members.length === 0) {
      await connection.rollback();
      return res.status(401).json({ error: 'Invalid token' });
    }
    const memberId = members[0].id;

    const [expenses] = await connection.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);
    if (expenses.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Expense not found' });
    }
    if (expenses[0].added_by !== memberId) {
      await connection.rollback();
      return res.status(403).json({ error: 'You can only delete your own expenses' });
    }

    // Log before deleting
    await connection.query(
      'INSERT INTO activity_log (trip_id, member_id, action, description) VALUES (?, ?, ?, ?)',
      [expenses[0].trip_id, memberId, 'delete', `Deleted "${expenses[0].title}" expense`]
    );

    // Delete (cascade removes splits)
    await connection.query('DELETE FROM expenses WHERE id = ?', [expenseId]);

    await connection.commit();
    res.json({ message: 'Deleted' });
  } catch (err) {
    await connection.rollback();
    console.error('Delete expense error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  } finally {
    connection.release();
  }
});

module.exports = router;

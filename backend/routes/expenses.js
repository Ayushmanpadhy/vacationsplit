const express = require('express');
const router = express.Router();

// Get Expenses by Trip ID
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
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
});

// Get Splits for Expense
router.get('/:expenseId/splits', async (req, res) => {
    const { expenseId } = req.params;
    const pool = req.app.locals.pool;

    try {
        const [splits] = await pool.query(
            'SELECT s.*, m.name as member_name FROM expense_splits s JOIN members m ON s.member_id = m.id WHERE s.expense_id = ?',
            [expenseId]
        );
        res.json(splits);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch splits' });
    }
});

// Add Expense
router.post('/', async (req, res) => {
    const { trip_id, title, total_amount, paid_by, added_by, category_id, split_type, note, splits } = req.body;
    const pool = req.app.locals.pool;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        const [expResult] = await connection.query(
            'INSERT INTO expenses (trip_id, title, total_amount, paid_by, added_by, category_id, split_type, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [trip_id, title, total_amount, paid_by, added_by, category_id, split_type, note]
        );

        const expenseId = expResult.insertId;

        for (const split of splits) {
            await connection.query(
                'INSERT INTO expense_splits (expense_id, member_id, amount_owed) VALUES (?, ?, ?)',
                [expenseId, split.member_id, split.amount_owed]
            );
        }

        // Log activity
        const [member] = await connection.query('SELECT name FROM members WHERE id = ?', [added_by]);
        const description = `Added "${title}" — ₹${total_amount}`;
        await connection.query(
            'INSERT INTO activity_log (trip_id, member_id, action, description) VALUES (?, ?, ?, ?)',
            [trip_id, added_by, 'add', description]
        );

        await connection.commit();
        res.status(201).json({ id: expenseId });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to add expense' });
    } finally {
        connection.release();
    }
});

// Delete Expense
router.delete('/:expenseId', async (req, res) => {
    const { expenseId } = req.params;
    const { member_token } = req.query;
    const pool = req.app.locals.pool;
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // Auth check
        const [members] = await connection.query('SELECT id FROM members WHERE token = ?', [member_token]);
        if (members.length === 0) return res.status(401).json({ error: 'Unauthorized' });
        const memberId = members[0].id;

        const [expenses] = await connection.query('SELECT * FROM expenses WHERE id = ?', [expenseId]);
        if (expenses.length === 0) return res.status(404).json({ error: 'Expense not found' });
        const expense = expenses[0];

        if (expense.added_by !== memberId) return res.status(403).json({ error: 'Can only delete your own expenses' });

        // Log activity before delete
        const [addedBy] = await connection.query('SELECT name FROM members WHERE id = ?', [memberId]);
        const description = `Deleted "${expense.title}" expense`;
        await connection.query(
            'INSERT INTO activity_log (trip_id, member_id, action, description) VALUES (?, ?, ?, ?)',
            [expense.trip_id, memberId, 'delete', description]
        );

        await connection.query('DELETE FROM expenses WHERE id = ?', [expenseId]);

        await connection.commit();
        res.json({ message: 'Deleted' });
    } catch (err) {
        await connection.rollback();
        console.error(err);
        res.status(500).json({ error: 'Failed to delete expense' });
    } finally {
        connection.release();
    }
});

module.exports = router;

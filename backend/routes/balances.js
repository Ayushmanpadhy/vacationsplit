const express = require('express');
const router = express.Router();

// Get Balances for Trip
router.get('/trip/:tripId', async (req, res) => {
    const { tripId } = req.params;
    const pool = req.app.locals.pool;

    try {
        const [members] = await pool.query('SELECT id, name, color_index FROM members WHERE trip_id = ?', [tripId]);
        const [expenses] = await pool.query('SELECT total_amount, paid_by, id FROM expenses WHERE trip_id = ?', [tripId]);
        const [splits] = await pool.query(
            'SELECT s.member_id, s.amount_owed FROM expense_splits s JOIN expenses e ON s.expense_id = e.id WHERE e.trip_id = ?',
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
                member_id: m.id,
                member_name: m.name,
                color_index: m.color_index,
                total_paid: totalPaid,
                total_owed: totalOwed,
                net_balance: Math.round((totalPaid - totalOwed) * 100) / 100
            };
        });

        res.json(balances);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to calculate balances' });
    }
});

// Get Settlement Plan
router.get('/trip/:tripId/settlements', async (req, res) => {
    const { tripId } = req.params;
    const pool = req.app.locals.pool;

    try {
        const [members] = await pool.query('SELECT id, name FROM members WHERE trip_id = ?', [tripId]);
        const [expenses] = await pool.query('SELECT total_amount, paid_by FROM expenses WHERE trip_id = ?', [tripId]);
        const [splits] = await pool.query(
            'SELECT s.member_id, s.amount_owed FROM expense_splits s JOIN expenses e ON s.expense_id = e.id WHERE e.trip_id = ?',
            [tripId]
        );

        let balances = members.map(m => {
            const totalPaid = expenses
                .filter(e => e.paid_by === m.id)
                .reduce((sum, e) => sum + parseFloat(e.total_amount), 0);
            const totalOwed = splits
                .filter(s => s.member_id === m.id)
                .reduce((sum, s) => sum + parseFloat(s.amount_owed), 0);
            return { id: m.id, name: m.name, net_balance: totalPaid - totalOwed };
        });

        let creditors = balances.filter(b => b.net_balance > 0.01).sort((a,b) => b.net_balance - a.net_balance);
        let debtors   = balances.filter(b => b.net_balance < -0.01).sort((a,b) => a.net_balance - b.net_balance);
        let transactions = [];

        while (debtors.length && creditors.length) {
            let d = debtors[0], c = creditors[0];
            let amount = Math.min(Math.abs(d.net_balance), c.net_balance);
            amount = Math.round(amount * 100) / 100;

            transactions.push({ 
                payer: d.name, 
                payer_id: d.id, 
                receiver: c.name, 
                receiver_id: c.id, 
                amount 
            });

            d.net_balance += amount;
            c.net_balance -= amount;

            if (Math.abs(d.net_balance) < 0.01) debtors.shift();
            if (Math.abs(c.net_balance) < 0.01) creditors.shift();
        }

        res.json(transactions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to calculate settlements' });
    }
});

module.exports = router;

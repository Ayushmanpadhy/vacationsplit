const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Get Members by Trip ID
router.get('/trip/:tripId', async (req, res) => {
    const { tripId } = req.params;
    const pool = req.app.locals.pool;

    try {
        const [members] = await pool.query('SELECT id, name, color_index, joined_at FROM members WHERE trip_id = ?', [tripId]);
        res.json(members);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch members' });
    }
});

// Add Member to Trip
router.post('/trip/:tripId', async (req, res) => {
    const { tripId } = req.params;
    const { name } = req.body;
    const pool = req.app.locals.pool;

    try {
        const [existing] = await pool.query('SELECT COUNT(*) as count FROM members WHERE trip_id = ?', [tripId]);
        const token = crypto.randomBytes(32).toString('hex');
        const colorIndex = existing[0].count % 10;

        const [result] = await pool.query(
            'INSERT INTO members (trip_id, name, token, color_index) VALUES (?, ?, ?, ?)',
            [tripId, name, token, colorIndex]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            token,
            color_index: colorIndex
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to add member' });
    }
});

// Get Member by Token
router.get('/token/:token', async (req, res) => {
    const { token } = req.params;
    const pool = req.app.locals.pool;

    try {
        const [members] = await pool.query('SELECT * FROM members WHERE token = ?', [token]);
        if (members.length === 0) return res.status(404).json({ error: 'Member not found' });
        res.json(members[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch member' });
    }
});

module.exports = router;

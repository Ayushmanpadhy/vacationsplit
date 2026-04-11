const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// Create Trip
router.post('/', async (req, res) => {
    const { name, destination, start_date, end_date, creator_name } = req.body;
    const pool = req.app.locals.pool;

    try {
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const [tripResult] = await pool.query(
            'INSERT INTO trips (code, name, destination, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
            [code, name, destination, start_date || null, end_date || null]
        );
        
        const tripId = tripResult.insertId;
        const token = crypto.randomBytes(32).toString('hex');
        
        const [memberResult] = await pool.query(
            'INSERT INTO members (trip_id, name, token, color_index) VALUES (?, ?, ?, ?)',
            [tripId, creator_name, token, 0]
        );

        res.status(201).json({
            trip_id: tripId,
            trip_code: code,
            member_id: memberResult.insertId,
            member_token: token
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create trip' });
    }
});

// Get Trip by Code
router.get('/:code', async (req, res) => {
    const { code } = req.params;
    const pool = req.app.locals.pool;

    try {
        const [trips] = await pool.query('SELECT * FROM trips WHERE code = ?', [code]);
        if (trips.length === 0) return res.status(404).json({ error: 'Trip not found' });
        res.json(trips[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch trip' });
    }
});

module.exports = router;

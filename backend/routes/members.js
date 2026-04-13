/**
 * Members API Routes
 * GET  /api/members/trip/:tripId     — Get all members of a trip
 * POST /api/members/trip/:tripId     — Add a member to a trip
 * GET  /api/members/token/:token     — Get member by auth token
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

// ── Get Members by Trip ID ───────────────────────────────
router.get('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [members] = await pool.query(
      'SELECT id, trip_id, name, token, color_index, joined_at FROM members WHERE trip_id = ? ORDER BY id ASC',
      [tripId]
    );
    res.json(members);
  } catch (err) {
    console.error('Get members error:', err);
    res.status(500).json({ error: 'Failed to fetch members' });
  }
});

// ── Add Member to Trip ───────────────────────────────────
router.post('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const { name } = req.body;
  const pool = req.app.locals.pool;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Member name is required' });
  }

  try {
    const [existing] = await pool.query(
      'SELECT COUNT(*) as count FROM members WHERE trip_id = ?',
      [tripId]
    );

    if (existing[0].count >= 20) {
      return res.status(400).json({ error: 'Maximum 20 members per trip' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const colorIndex = existing[0].count % 10;

    const [result] = await pool.query(
      'INSERT INTO members (trip_id, name, token, color_index) VALUES (?, ?, ?, ?)',
      [tripId, name.trim(), token, colorIndex]
    );

    res.status(201).json({
      id: result.insertId,
      name: name.trim(),
      token,
      color_index: colorIndex
    });
  } catch (err) {
    console.error('Add member error:', err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// ── Get Member by Token ──────────────────────────────────
router.get('/token/:token', async (req, res) => {
  const { token } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [members] = await pool.query(
      'SELECT id, trip_id, name, token, color_index, joined_at FROM members WHERE token = ?',
      [token]
    );
    if (members.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json(members[0]);
  } catch (err) {
    console.error('Get member by token error:', err);
    res.status(500).json({ error: 'Failed to fetch member' });
  }
});

module.exports = router;

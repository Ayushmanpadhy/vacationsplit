/**
 * Trips API Routes
 * POST /api/trips          — Create a new trip with members
 * GET  /api/trips/:code    — Get trip by code
 */

const express = require('express');
const router = express.Router();
const crypto = require('crypto');

/**
 * Generate a 6-character trip code using unambiguous characters.
 * Excludes 0, O, I, 1 to avoid confusion.
 */
function generateTripCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Create Trip ──────────────────────────────────────────
router.post('/', async (req, res) => {
  const { name, destination, start_date, end_date, creator_name, members } = req.body;
  const pool = req.app.locals.pool;

  // Validation
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Trip name is required' });
  }
  if (!creator_name || !creator_name.trim()) {
    return res.status(400).json({ error: 'Your name is required' });
  }
  if (!members || !Array.isArray(members) || members.length < 1) {
    return res.status(400).json({ error: 'At least one other member is required' });
  }

  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const code = generateTripCode();

    // Insert trip
    const [tripResult] = await connection.query(
      'INSERT INTO trips (code, name, destination, start_date, end_date) VALUES (?, ?, ?, ?, ?)',
      [code, name.trim(), destination?.trim() || null, start_date || null, end_date || null]
    );
    const tripId = tripResult.insertId;

    // Insert creator as first member
    const creatorToken = crypto.randomBytes(32).toString('hex');
    const [creatorResult] = await connection.query(
      'INSERT INTO members (trip_id, name, token, color_index) VALUES (?, ?, ?, ?)',
      [tripId, creator_name.trim(), creatorToken, 0]
    );
    const creatorId = creatorResult.insertId;

    // Insert other members
    for (let i = 0; i < members.length; i++) {
      const memberName = members[i].trim();
      if (!memberName) continue;
      const memberToken = crypto.randomBytes(32).toString('hex');
      await connection.query(
        'INSERT INTO members (trip_id, name, token, color_index) VALUES (?, ?, ?, ?)',
        [tripId, memberName, memberToken, (i + 1) % 10]
      );
    }

    // Log activity
    await connection.query(
      'INSERT INTO activity_log (trip_id, member_id, action, description) VALUES (?, ?, ?, ?)',
      [tripId, creatorId, 'create', `Trip "${name.trim()}" created by ${creator_name.trim()}`]
    );

    await connection.commit();

    res.status(201).json({
      trip_id: tripId,
      trip_code: code,
      member_id: creatorId,
      member_token: creatorToken
    });
  } catch (err) {
    await connection.rollback();
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'Failed to create trip' });
  } finally {
    connection.release();
  }
});

// ── Get Trip by Code ─────────────────────────────────────
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [trips] = await pool.query(
      'SELECT * FROM trips WHERE code = ?',
      [code.toUpperCase()]
    );
    if (trips.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json(trips[0]);
  } catch (err) {
    console.error('Get trip error:', err);
    res.status(500).json({ error: 'Failed to fetch trip' });
  }
});

module.exports = router;

/**
 * Activity Log API Routes
 * GET /api/activity/trip/:tripId — Get recent activity for a trip
 */

const express = require('express');
const router = express.Router();

// ── Get Activity Log ─────────────────────────────────────
router.get('/trip/:tripId', async (req, res) => {
  const { tripId } = req.params;
  const pool = req.app.locals.pool;

  try {
    const [logs] = await pool.query(
      `SELECT l.*, m.name as member_name 
       FROM activity_log l 
       JOIN members m ON l.member_id = m.id 
       WHERE l.trip_id = ? 
       ORDER BY l.created_at DESC 
       LIMIT 20`,
      [tripId]
    );
    res.json(logs);
  } catch (err) {
    console.error('Get activity error:', err);
    res.status(500).json({ error: 'Failed to fetch activity log' });
  }
});

module.exports = router;

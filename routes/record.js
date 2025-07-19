const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middlewares/authenticate');

router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT 
        ugr.game_mode,
        ugr.rank_point_delta,
        ugr.result,
        ugr.created_at,
        ui.name AS opponent_name,
        ui.photo_url AS opponent_photo_url
      FROM user_game_records ugr
      JOIN user_info ui ON ugr.opponent_uid = ui.uid
      WHERE ugr.uid = $1
      ORDER BY ugr.created_at DESC
      `,
      [req.uid]
    );

    res.json({ success: true, records: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middlewares/authenticate');

router.get('/me', authenticate, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit);
    const offset = parseInt(req.query.offset);

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
      LIMIT $2 OFFSET $3
      `,
      [req.uid, limit, offset]
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM user_game_records WHERE uid = $1`,
      [req.uid]
    );
    const totalCount = parseInt(countResult.rows[0].count);
    const hasMore = offset + result.rows.length < totalCount;

    res.json({
      success: true,
      records: result.rows,
      totalCount: totalCount,
      hasMore: hasMore,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/*
// 기존 전체 불러오기 로직 (백업용 주석처리)
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      \`
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
      \`,
      [req.uid]
    );

    res.json({ success: true, records: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
*/

module.exports = router;

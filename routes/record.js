const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middlewares/authenticate');

router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT game_mode, rank_point_delta, result, created_at FROM user_game_records WHERE uid = $1 ORDER BY created_at DESC',
            [req.uid]
        );

        res.json({ success: true, records: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

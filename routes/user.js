const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middlewares/authenticate');

router.post('/init-info', authenticate, async (req, res) => {
    try {
        await pool.query(
            `
            INSERT INTO user_info (uid, name, email, photo_url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (uid) DO NOTHING
            `,
            [req.uid, req.name, req.email, req.photoUrl]
        );

        res.status(200).json({ success: true, message: 'User info initialized' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/init-stats', authenticate, async (req, res) => {
    try {
        await pool.query(
            `
            INSERT INTO user_stats (uid)
            VALUES ($1)
            ON CONFLICT (uid) DO NOTHING
            `,
            [req.uid]
        );

        res.status(200).json({ success: true, message: 'User stats initialized' });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT uid, win_count, lose_count, win_streak, rank_point, updated_at
            FROM user_stats
            WHERE uid = $1
            `,
            [req.uid]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, user: result.rows[0] });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/ranking', async (req, res) => {
    try {
        const result = await pool.query(
            `
            SELECT
                us.uid,
                ui.name,
                ui.photo_url,
                us.rank_point,
                DENSE_RANK() OVER (ORDER BY us.rank_point DESC) AS rank
            FROM user_stats us
            JOIN user_info ui ON us.uid = ui.uid
            ORDER BY us.rank_point DESC
            `
        );

        res.status(200).json({ success: true, ranking: result.rows });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

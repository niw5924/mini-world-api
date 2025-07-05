const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticate = require('../middlewares/authenticate');

router.get('/me', authenticate, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT uid, email, name, score FROM users WHERE uid = $1',
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

module.exports = router;

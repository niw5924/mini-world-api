const express = require('express');
const router = express.Router();
const admin = require('../firebaseAdmin');
const pool = require('../db');

const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const firebaseIdToken = authHeader.split(' ')[1];
        const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
        req.uid = decoded.uid;
        next();
    } catch (err) {
        res.status(401).json({ success: false, message: err.message });
    }
};

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

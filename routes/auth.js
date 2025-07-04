const express = require('express');
const router = express.Router();
const admin = require('../firebaseAdmin');
const pool = require('../db');

router.post('/login', async (req, res) => {
    try {
        const { firebaseIdToken } = req.body;
        const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
        const { uid, email, name } = decoded;

        await pool.query(
            'INSERT INTO users (uid, email, name) VALUES ($1, $2, $3) ON CONFLICT (uid) DO NOTHING',
            [uid, email, name]
        );

        res.status(200).json({ success: true, message: 'Login success' });
    } catch (err) {
        res.status(401).json({ success: false, message: err.message });
    }
});

module.exports = router;

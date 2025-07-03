const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const pool = require('../db');
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

router.post('/login', async (req, res) => {
    const { firebaseIdToken } = req.body;

    try {
        const decoded = await admin.auth().verifyIdToken(firebaseIdToken);
        const { uid, email, name } = decoded;

        await pool.query(
            'INSERT INTO users (uid, email, name) VALUES ($1, $2, $3) ON CONFLICT (uid) DO NOTHING',
            [uid, email, name]
        );

        const result = await pool.query(
            'SELECT uid, email, name, score FROM users WHERE uid = $1',
            [uid]
        );

        res.json(result.rows[0]);
    } catch (err) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
